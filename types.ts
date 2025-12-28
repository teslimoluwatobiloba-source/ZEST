
export interface ExcitementIdea {
  title: string;
  description: string;
  category: 'creative' | 'active' | 'chill' | 'educational' | 'gaming';
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
}

export enum AppState {
  HOME = 'HOME',
  VOICE_MODE = 'VOICE_MODE',
  IDEA_GRID = 'IDEA_GRID',
  LOADING = 'LOADING'
}

export interface TranscriptionItem {
  type: 'user' | 'model';
  text: string;
}
