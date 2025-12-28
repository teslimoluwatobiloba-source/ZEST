
import React, { useState } from 'react';

interface LandingViewProps {
  onStart: (mood: string) => void;
  onVoiceClick: () => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onStart, onVoiceClick }) => {
  const [mood, setMood] = useState('extremely bored');

  const moodPresets = [
    { label: 'Creative', val: 'creative and ready to make something', color: 'indigo' },
    { label: 'Hyper', val: 'full of energy and need to move', color: 'orange' },
    { label: 'Curious', val: 'interested in learning something weird', color: 'emerald' },
    { label: 'Lazy', val: 'too lazy for much effort but bored', color: 'pink' },
  ];

  return (
    <div className="flex flex-col items-center py-12">
      <div className="text-center mb-16 float-animation relative">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full"></div>
        <h1 className="text-7xl md:text-[10rem] font-black mb-6 tracking-tighter leading-none select-none">
          BYE-BYE <br/><span className="gradient-text">BOREDOM.</span>
        </h1>
        <p className="text-xl md:text-3xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed tracking-wide">
          Life is too short for idle moments. Zest generates instant <span className="text-white font-bold drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">thrills</span> and creative explosions on command.
        </p>
      </div>

      <div className="w-full max-w-3xl glass rounded-[3rem] p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border-white/10 relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-pink-500/5 rounded-[3rem] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        
        <h3 className="text-2xl font-black mb-10 flex items-center gap-4 text-slate-100 uppercase tracking-widest italic">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
            <i className="fa-solid fa-wand-magic-sparkles text-indigo-400 text-xl animate-pulse"></i>
          </div>
          What's the energy?
        </h3>
        
        <div className="relative mb-10">
          <input 
            type="text" 
            placeholder="Tell us what's on your mind..."
            className="w-full bg-slate-900/40 border border-white/10 rounded-[2rem] px-10 py-6 text-2xl focus:outline-none transition-all neon-input placeholder:text-slate-700 font-medium text-white"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-4 mb-12">
          {moodPresets.map((m) => (
            <button
              key={m.label}
              onClick={() => setMood(m.val)}
              className={`px-8 py-3.5 rounded-2xl text-sm font-black transition-all border uppercase tracking-widest ${
                mood === m.val 
                ? `bg-white text-slate-950 border-white shadow-[0_0_25px_rgba(255,255,255,0.4)] scale-105` 
                : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button 
            onClick={() => onStart(mood)}
            className="ignite-pulse bg-indigo-600 hover:bg-indigo-500 text-white font-black py-7 rounded-[2rem] transition-all flex items-center justify-center gap-4 text-xl uppercase tracking-[0.2em] group shadow-2xl"
          >
            <i className="fa-solid fa-fire text-3xl group-hover:scale-125 transition-transform duration-300"></i>
            Ignite
          </button>
          
          <button 
            onClick={onVoiceClick}
            className="bg-slate-800/50 hover:bg-slate-800 text-white font-black py-7 rounded-[2rem] transition-all border border-white/10 flex items-center justify-center gap-4 text-xl uppercase tracking-[0.2em] shadow-xl hover:border-pink-500/50 group"
          >
            <i className="fa-solid fa-microphone text-3xl text-pink-500 group-hover:rotate-12 transition-transform"></i>
            Voice Mode
          </button>
        </div>
      </div>

      <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-6xl">
        <FeatureCard 
          icon="fa-gamepad" 
          title="Infinite Flow" 
          desc="Custom activities that evolve based on your responses. No boring templates here." 
          glow="indigo"
        />
        <FeatureCard 
          icon="fa-brain" 
          title="Neural Brain" 
          desc="AI models specifically tuned to maximize engagement and creative dopamine." 
          glow="pink"
        />
        <FeatureCard 
          icon="fa-camera" 
          title="Dream Visuals" 
          desc="Every adventure is paired with high-frequency AI imagery to spark your vision." 
          glow="yellow"
        />
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: string; title: string; desc: string; glow: string }> = ({ icon, title, desc, glow }) => {
  const glowColors: Record<string, string> = {
    indigo: 'rgba(99, 102, 241, 0.4)',
    pink: 'rgba(217, 70, 239, 0.4)',
    yellow: 'rgba(251, 191, 36, 0.4)'
  };
  
  return (
    <div className="p-10 glass rounded-[3rem] hover:-translate-y-3 transition-all duration-500 group relative overflow-hidden">
      <div 
        className="absolute -bottom-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-10 group-hover:opacity-30 transition-opacity" 
        style={{ backgroundColor: glowColors[glow] }}
      ></div>
      <div className={`w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center mb-8 border border-white/10 group-hover:border-${glow}-500/50 transition-colors`}>
        <i className={`fa-solid ${icon} text-slate-100 text-2xl`}></i>
      </div>
      <h4 className="text-2xl font-black mb-4 text-white uppercase tracking-tighter">{title}</h4>
      <p className="text-slate-400 leading-relaxed font-medium text-lg">{desc}</p>
    </div>
  );
};

export default LandingView;
