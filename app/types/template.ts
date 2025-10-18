export interface Template {
  name: string;
  label: string;
  description: string;
  githubRepo?: string; // For remote templates
  subdir?: string; // Subdirectory within the repo (for monorepos)
  localPath?: string; // For local templates (e.g., 'codinit-vite-react-ts')
  source?: 'local' | 'github'; // Indicate the source of the template
  tags?: string[];
  icon?: string;
}
