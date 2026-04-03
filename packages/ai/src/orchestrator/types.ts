export interface Scene {
  timestamp: number;
  duration: number;
  script: string;
  imagePrompt: string;
}

export interface VideoPlan {
  title: string;
  description: string;
  bgmPrompt: string;
  scenes: Scene[];
}
