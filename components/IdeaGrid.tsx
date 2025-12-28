
import React, { useState, useEffect } from 'react';
import { ExcitementIdea } from '../types';
import { generateVisualForIdea } from '../services/geminiService';

interface IdeaGridProps {
  ideas: ExcitementIdea[];
  onBack: () => void;
}

const IdeaGrid: React.FC<IdeaGridProps> = ({ ideas, onBack }) => {
  return (
    <div className="py-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-3xl font-black">Your Curated <span className="gradient-text">Excitement Hub</span></h2>
          <p className="text-slate-400">Fresh ideas served just for your current vibe.</p>
        </div>
        <button 
          onClick={onBack}
          className="text-sm font-bold bg-white/5 hover:bg-white/10 px-6 py-3 rounded-full transition-all border border-white/10"
        >
          <i className="fa-solid fa-arrow-left mr-2"></i>
          Back Home
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {ideas.map((idea, idx) => (
          <IdeaCard key={idx} idea={idea} index={idx} />
        ))}
      </div>
    </div>
  );
};

const IdeaCard: React.FC<{ idea: ExcitementIdea; index: number }> = ({ idea, index }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImg, setLoadingImg] = useState(false);

  useEffect(() => {
    async function fetchImage() {
      setLoadingImg(true);
      try {
        const url = await generateVisualForIdea(idea.title);
        setImageUrl(url);
      } catch (e) {
        setImageUrl(`https://picsum.photos/seed/${idea.title}/800/600`);
      } finally {
        setLoadingImg(false);
      }
    }
    fetchImage();
  }, [idea.title]);

  const categoryIcons: Record<string, string> = {
    creative: 'fa-palette',
    active: 'fa-running',
    chill: 'fa-couch',
    educational: 'fa-book-open',
    gaming: 'fa-ghost'
  };

  return (
    <div 
      className="bg-slate-800/30 border border-white/5 rounded-3xl overflow-hidden hover:border-indigo-500/50 transition-all group flex flex-col h-full animate-fadeInUp"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative h-48 bg-slate-900 overflow-hidden">
        {loadingImg ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : (
          <img 
            src={imageUrl || ''} 
            alt={idea.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        )}
        <div className="absolute top-4 left-4">
          <span className="bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/10 flex items-center gap-2">
            <i className={`fa-solid ${categoryIcons[idea.category] || 'fa-star'} text-indigo-400`}></i>
            {idea.category.toUpperCase()}
          </span>
        </div>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold mb-3 group-hover:text-indigo-300 transition-colors">{idea.title}</h3>
        <p className="text-slate-400 text-sm mb-6 flex-grow leading-relaxed">
          {idea.description}
        </p>
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <i className="fa-solid fa-gauge-high"></i>
            {idea.difficulty}
          </span>
          <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
            Let's Go
            <i className="fa-solid fa-arrow-right text-[10px]"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IdeaGrid;
