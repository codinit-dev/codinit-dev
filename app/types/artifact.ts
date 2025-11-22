export interface CodinitArtifactData {
  id: string;
  title: string;
  type?: string | undefined;
}

export interface ThinkingArtifactData extends CodinitArtifactData {
  type: 'thinking';
  steps: string[];
  content: string;
}
