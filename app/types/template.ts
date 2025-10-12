export interface Template {
  name: string;
  label: string;
  description: string;
  githubRepo: string;
  subdir?: string; // Subdirectory within the repo (for monorepos)
  tags?: string[];
  icon?: string;
}
