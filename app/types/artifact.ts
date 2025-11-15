export interface ExampleArtifactData {
  id: string;
  title: string;
  type?: string | undefined;
}

export interface ThinkingArtifactData extends ExampleArtifactData {
  type: 'thinking';
  steps: string[];
  content: string;
}
