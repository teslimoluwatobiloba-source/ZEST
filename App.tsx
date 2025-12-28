
import React, { useState, useCallback } from 'react';
import { AppState, ExcitementIdea } from './types';
import { generateBoredomBustingIdeas } from './services/geminiService';
import VoiceCompanion from './components/VoiceCompanion';
import IdeaGrid from './components/IdeaGrid';
import LandingView from './components/LandingView';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [ideas, setIdeas] = useState<ExcitementIdea[]>([]);
  const [loading, setLoading] = useState(false);

  const handleStartAdventure = useCallback(async (mood: string) => {
    setLoading(true);
    setAppState(AppState.LOADING);
    try {
      const generatedIdeas = await generateBoredomBustingIdeas(mood);
      setIdeas(generatedIdeas);
      setAppState(AppState.IDEA_GRID);
    } catch (error) {
      console.error("Failed to fetch ideas", error);
      setAppState(AppState.HOME);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVoiceMode = () => {
    setAppState(AppState.VOICE_MODE);
  };

  const resetToHome = () => {
    setAppState(AppState.HOME);
  };

  const handleVoiceCommand = useCallback((action: string, params?: any) => {
    console.log("Executing Voice Command:", action, params);
    if (action === 'GENERATE_IDEAS') {
      handleStartAdventure(params?.mood || 'random and exciting');
    } else if (action === 'RESET_HOME') {
      resetToHome();
    }
  }, [handleStartAdventure]);

  return (
    <div className="min-h-screen font-sans relative">
      {/* Navigation */}
      <nav className="fixed top-8 left-1/2 -translate-x-1/2 w-[90%] max-w-7xl z-50 glass rounded-full px-10 py-5 flex justify-between items-center shadow-2xl border-white/10">
        <div 
          className="text-2xl font-black tracking-tighter flex items-center gap-4 cursor-pointer group"
          onClick={resetToHome}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-pink-600 rounded-2xl flex items-center justify-center group-hover:rotate-[15deg] transition-all duration-300 shadow-xl shadow-indigo-500/20 active:scale-90">
            <i className="fa-solid fa-bolt text-white text-xl"></i>
          </div>
          <span className="gradient-text uppercase italic tracking-[0.25em] text-2xl">ZEST</span>
        </div>
        <div className="flex gap-6">
          <button 
            onClick={handleVoiceMode}
            className={`hidden md:flex items-center gap-4 px-8 py-3 rounded-full transition-all text-sm font-black uppercase tracking-widest border ${
              appState === AppState.VOICE_MODE 
              ? 'bg-white text-slate-900 border-white shadow-[0_0_30px_rgba(255,255,255,0.4)] scale-105' 
              : 'bg-white/5 hover:bg-white/10 text-white border-white/10 hover:border-white/30'
            }`}
          >
            <i className={`fa-solid fa-microphone text-lg ${appState === AppState.VOICE_MODE ? 'text-indigo-600' : 'text-pink-500'}`}></i>
            Live Voice
          </button>
        </div>
      </nav>

      <main className="pt-48 pb-24 px-6 max-w-7xl mx-auto">
        {appState === AppState.HOME && (
          <LandingView 
            onStart={handleStartAdventure} 
            onVoiceClick={handleVoiceMode}
          />
        )}

        {appState === AppState.LOADING && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="relative mb-12">
               <div className="w-32 h-32 border-4 border-indigo-500/10 rounded-full"></div>
               <div className="absolute inset-0 w-32 h-32 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
               <div className="absolute inset-4 w-24 h-24 border-4 border-pink-500/10 rounded-full"></div>
               <div className="absolute inset-4 w-24 h-24 border-4 border-pink-500 border-b-transparent rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]"></div>
            </div>
            <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-6 gradient-text">Syncing Neural Networks...</h2>
            <p className="text-slate-400 text-2xl font-medium max-w-lg mx-auto leading-relaxed opacity-80">Scanning the multiverse for your perfect adrenaline match.</p>
          </div>
        )}

        {appState === AppState.IDEA_GRID && (
          <IdeaGrid ideas={ideas} onBack={resetToHome} />
        )}

        {appState === AppState.VOICE_MODE && (
          <VoiceCompanion onClose={resetToHome} onAction={handleVoiceCommand} />
        )}
      </main>

      {/* Floating Action Button for Mobile */}
      <div className="md:hidden fixed bottom-10 right-10 flex flex-col gap-6 z-50">
        <button 
          onClick={handleVoiceMode}
          className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-pink-600 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(99,102,241,0.5)] flex items-center justify-center active:scale-90 transition-transform border border-white/20"
        >
          <i className="fa-solid fa-microphone text-3xl text-white"></i>
        </button>
      </div>
    </div>
  );
};

export default App;
