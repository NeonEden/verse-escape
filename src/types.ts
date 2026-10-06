export type NavigationTab = 'canvas' | 'folio' | 'rhythms' | 'resonances';

export type MoodAtmosphere = 'Atardecer Ámbar' | 'Noche Índigo' | 'Niebla Sepia' | 'Alba Pálida';

export interface SentimentVector {
  calidez: number;      // Warmth 0..1
  melancolia: number;   // Melancholy 0..1
  penumbra: number;     // Penumbra 0..1
  quietud: number;      // Meditative energy 0..1
  moodName?: string;
  debounce?: string;
}

export interface PoemStanza {
  id: string;
  lines: string[];
}

export interface Poem {
  id: string;
  notebook: string;
  volume: string;
  title: string;
  subtitle: string;
  stanzas: PoemStanza[];
  wordsCount: number;
  syllablesCount: number;
  sentiment: SentimentVector;
  mood: MoodAtmosphere;
  updatedAt: string;
}

export interface CoPilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  content: string;
  suggestedVerses?: string[];
  metricInfo?: string;
  tonalAffinity?: {
    score: string;
    poets: string;
  };
}

export interface SoundState {
  isPlaying: boolean;
  rainVolume: number;       // 0..100
  crackleVolume: number;    // 0..100
  windVolume: number;       // 0..100
  activePreset: string;
}
