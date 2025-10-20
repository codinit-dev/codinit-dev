export interface Template {
  name: string;
  label: string;
  description: string;
  githubRepo?: string; // For remote templates
  localPath?: string; // For local templates
  source?: 'local' | 'github'; // Indicate the source of the template
  tags?: string[];
  icon?: string;
}
