export type PronounTypeId = 'purusa' | 'prichha' | 'niyama' | 'aniyama' | 'vibhaga';

export interface PronounCategory {
  id: PronounTypeId;
  number: string;
  name: string;
  shortName: string;
  color: string;
  borderColor: string;
  bgGradient: string;
  badgeBg: string;
  icon: string;
  definition: string;
  keywords: string[];
  subTypes?: {
    name: string;
    description: string;
    examples: string[];
  }[];
  examples: {
    word: string;
    sentence: string;
    highlight: string;
    explanation: string;
  }[];
  tips: string;
}

export interface SlingshotWord {
  id: string;
  word: string;
  contextSentence: string;
  targetTypeId: PronounTypeId;
  hint: string;
  explanation: string;
  subTypeNote?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  sentence?: string;
  highlightWord?: string;
  options: string[];
  correctIndex: number;
  pronounTypeId: PronounTypeId;
  explanation: string;
}

export interface ScoreRecord {
  id: string;
  playerName: string;
  avatar: string;
  score: number;
  maxScore: number;
  timeSpentSec: number;
  streak?: number;
  mode: 'game' | 'quiz';
  date: string;
  stars: number;
}

export interface UserProfile {
  name: string;
  avatar: string;
  soundEnabled: boolean;
  bgmEnabled: boolean;
}
