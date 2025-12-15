export type FileCategory = 'component' | 'config' | 'style' | 'test' | 'api' | 'util' | 'other';

export type ContextAnnotation =
  | {
      type: 'codeContext';
      files: string[];
      categories?: Record<string, FileCategory>;
      relevanceScores?: Record<string, number>;
      selectionReason?: string;
    }
  | {
      type: 'chatSummary';
      summary: string;
      chatId: string;
    };

export type ProgressAnnotation = {
  type: 'progress';
  label: string;
  status: 'in-progress' | 'complete';
  order: number;
  message: string;
};

export type ToolCallAnnotation = {
  type: 'toolCall';
  toolCallId: string;
  serverName: string;
  toolName: string;
  toolDescription: string;
};
