export interface VideoConfig {
  prompt: string;
  resolution: '720p' | '1080p';
  aspectRatio: '16:9' | '9:16';
  model: 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview';
  negativePrompt?: string; // Not directly supported by Veo API yet, but good for UI expansion
}

export interface GeneratedVideo {
  id: string;
  url: string;
  config: VideoConfig;
  createdAt: number;
  fileName: string;
}

export type GenerationStatus = 'idle' | 'generating' | 'polling' | 'downloading' | 'completed' | 'error';

export interface GenerationState {
  status: GenerationStatus;
  progressMessage?: string;
  error?: string;
}