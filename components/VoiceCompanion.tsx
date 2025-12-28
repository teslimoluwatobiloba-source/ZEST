
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage, Type, FunctionDeclaration } from '@google/genai';
import { decode, encode, decodeAudioData, createBlob } from '../services/audioUtils';
import { TranscriptionItem } from '../types';

interface VoiceCompanionProps {
  onClose: () => void;
  onAction?: (action: string, params?: any) => void;
}

const VoiceCompanion: React.FC<VoiceCompanionProps> = ({ onClose, onAction }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [transcriptions, setTranscriptions] = useState<TranscriptionItem[]>([]);
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(24).fill(0));
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  
  const aiRef = useRef<any>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptionRef = useRef({ user: '', model: '' });
  const transcriptListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptListRef.current) {
      transcriptListRef.current.scrollTo({
        top: transcriptListRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [transcriptions]);

  // Command recognition tool declaration
  const executeAppCommand: FunctionDeclaration = {
    name: 'execute_app_command',
    parameters: {
      type: Type.OBJECT,
      description: 'Executes a voice-activated command within the application.',
      properties: {
        action: {
          type: Type.STRING,
          description: 'The type of action to perform.',
          enum: ['GENERATE_IDEAS', 'RESET_HOME', 'START_STORY'],
        },
        mood_context: {
          type: Type.STRING,
          description: 'If generating ideas, what is the desired mood or vibe?',
        }
      },
      required: ['action'],
    },
  };

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      aiRef.current = ai;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const level = inputData.reduce((acc, v) => acc + Math.abs(v), 0) / inputData.length;
              setVisualizerData(prev => prev.map(() => level * 150 + Math.random() * 25));
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Tool Calls (Voice Commands)
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'execute_app_command') {
                  const args = fc.args as any;
                  setLastCommand(args.action);
                  
                  // Trigger UI callback
                  if (onAction) {
                    onAction(args.action, { mood: args.mood_context });
                  }

                  // Confirm to model
                  sessionPromise.then(s => s.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { status: 'executed' }
                    }
                  }));

                  // Provide brief visual feedback then clear
                  setTimeout(() => setLastCommand(null), 3000);
                }
              }
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const outCtx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outCtx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.inputTranscription) {
              transcriptionRef.current.user += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
              transcriptionRef.current.model += message.serverContent.outputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              const userT = transcriptionRef.current.user;
              const modelT = transcriptionRef.current.model;
              if (userT) setTranscriptions(prev => [...prev, { type: 'user', text: userT }]);
              if (modelT) setTranscriptions(prev => [...prev, { type: 'model', text: modelT }]);
              transcriptionRef.current = { user: '', model: '' };
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error('Live API Error:', e),
          onclose: () => setIsConnected(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [executeAppCommand] }],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `You are 'Zest', the world's most energetic boredom-killer. 
          Use the 'execute_app_command' tool to help the user navigate or get ideas:
          - If they ask to 'generate ideas' or 'show me the list' or 'what should I do', use GENERATE_IDEAS.
          - If they ask to 'go back' or 'exit' or 'home', use RESET_HOME.
          - If they say 'start a story' or 'tell me a tale', acknowledge and verbally start a story (you don't HAVE to call a tool for this, but can call START_STORY to give them visual feedback).
          
          Maintain massive enthusiasm and high energy at all times!`,
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to start session', err);
    }
  };

  useEffect(() => {
    startSession();
    return () => {
      if (sessionRef.current) sessionRef.current.close();
      if (audioContextRef.current) audioContextRef.current.close();
      if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    };
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[75vh] animate-fadeIn pb-16 relative">
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/40 via-purple-900/30 to-pink-900/40 blur-[100px] -z-10 animate-pulse"></div>

      {/* Left: Visualizer & Command Indicator */}
      <div className="flex-1 glass rounded-[3rem] p-12 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl border-white/10 group">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent pointer-events-none group-hover:via-indigo-500/10 transition-all duration-700"></div>
        
        {/* Command Feedback Overlay */}
        {lastCommand && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 animate-bounce">
            <div className="bg-indigo-500/90 backdrop-blur-md px-6 py-2 rounded-full border border-white/30 text-white font-black uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.5)]">
              Executing: {lastCommand.replace('_', ' ')}
            </div>
          </div>
        )}

        <div className="relative z-10 text-center mb-12">
          <div className={`w-64 h-64 rounded-full bg-slate-950/80 flex items-center justify-center relative mb-12 mx-auto transition-all duration-700 ${isConnected ? 'shadow-[0_0_100px_rgba(99,102,241,0.6)] scale-110' : 'shadow-2xl shadow-indigo-500/10'}`}>
            <div className={`absolute inset-0 rounded-full border-4 border-indigo-500/30 animate-[spin_4s_linear_infinite] ${isConnected ? 'opacity-100' : 'opacity-0'}`}></div>
            <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/20 to-pink-500/20 animate-pulse ${isConnected ? 'opacity-100' : 'opacity-0'}`}></div>
            
            <div className="relative z-20">
              <i className={`fa-solid fa-bolt-lightning text-7xl transition-all duration-500 ${isConnected ? 'text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.9)] animate-bounce' : 'text-slate-800'}`}></i>
            </div>
          </div>
          
          <h2 className="text-5xl font-black mb-4 tracking-tighter uppercase italic leading-none">
            {isConnected ? <span className="gradient-text">Zest is Alive</span> : 'Charging...'}
          </h2>
          <div className="flex items-center justify-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-slate-300 font-bold tracking-widest uppercase text-xs opacity-60">Commands: Active</p>
          </div>
        </div>

        <div className="flex items-end justify-center gap-2 h-28 w-full max-w-md px-4">
          {visualizerData.map((val, i) => (
            <div 
              key={i} 
              className={`w-2 rounded-full transition-all duration-100 shadow-lg ${isConnected ? 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.6)]' : 'bg-slate-800'}`}
              style={{ 
                height: `${Math.max(12, val)}%`, 
                opacity: isConnected ? 1 : 0.2,
                transform: `scaleY(${isConnected ? 1 : 0.5})`
              }}
            ></div>
          ))}
        </div>

        <div className="mt-16 flex gap-6 z-10">
          <button 
            onClick={onClose}
            className="px-12 py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black border border-white/10 transition-all uppercase tracking-[0.3em] shadow-2xl hover:border-pink-500/40 group active:scale-95"
          >
            <span className="group-hover:text-pink-400 transition-colors">Abort Mission</span>
          </button>
        </div>
      </div>

      {/* Right: Neon Transcription Feed */}
      <div className="w-full lg:w-[32rem] glass rounded-[3rem] p-8 flex flex-col max-h-[75vh] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] border-white/10 bg-slate-950/40 backdrop-blur-2xl">
        <div className="flex items-center justify-between mb-8 px-4">
          <h3 className="text-2xl font-black flex items-center gap-4 uppercase tracking-tighter italic">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75 ${isConnected ? '' : 'hidden'}`}></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
            </span>
            Neural Feed
          </h3>
          <div className="text-[10px] font-black bg-white/5 px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest text-slate-400">
            Real-time Sync
          </div>
        </div>
        
        <div 
          ref={transcriptListRef}
          className="flex-grow overflow-y-auto space-y-8 pr-4 custom-scrollbar scroll-smooth"
        >
          {transcriptions.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 italic text-center px-12 space-y-4">
              <i className="fa-solid fa-satellite-dish text-5xl mb-2 opacity-20 animate-pulse"></i>
              <p className="font-bold tracking-tight text-lg italic">"Zest, generate new ideas!"</p>
            </div>
          )}
          {transcriptions.map((t, i) => (
            <div 
              key={i} 
              className={`flex flex-col ${t.type === 'user' ? 'items-end' : 'items-start'} transition-all duration-500 animate-fadeInUp`}
            >
              <div className={`flex items-center gap-2 mb-2 px-3 ${t.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border ${t.type === 'user' ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-pink-500/20 border-pink-500/40 text-pink-400'}`}>
                  {t.type === 'user' ? <i className="fa-solid fa-user"></i> : <i className="fa-solid fa-robot"></i>}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${t.type === 'user' ? 'text-cyan-400' : 'text-pink-400'}`}>
                  {t.type === 'user' ? 'Explorer' : 'Zest'}
                </span>
              </div>
              
              <div 
                className={`max-w-[90%] px-6 py-4 rounded-[1.75rem] text-base leading-relaxed font-bold transition-all shadow-2xl border ${
                  t.type === 'user' 
                  ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-tr-none border-cyan-400/30 shadow-cyan-900/40 translate-x-1' 
                  : 'bg-gradient-to-br from-fuchsia-600 to-pink-700 text-white rounded-tl-none border-pink-400/30 shadow-pink-900/40 -translate-x-1'
                }`}
              >
                {t.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoiceCompanion;
