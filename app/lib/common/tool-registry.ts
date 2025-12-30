import toolsConfig from './builtin-tools.json';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: any;
}

export class ToolRegistry {
  private static _toolDefinitions: Map<string, ToolDefinition> = new Map();

  static initialize() {
    if (this._toolDefinitions.size > 0) {
      return;
    }

    for (const tool of toolsConfig.tools) {
      this._toolDefinitions.set(tool.name, {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      });
    }
  }

  static getToolDefinition(name: string): ToolDefinition | undefined {
    this.initialize();
    return this._toolDefinitions.get(name);
  }

  static getAllToolDefinitions(): ToolDefinition[] {
    this.initialize();
    return Array.from(this._toolDefinitions.values());
  }

  static getToolNames(): string[] {
    this.initialize();
    return Array.from(this._toolDefinitions.keys());
  }

  static hasTools(): boolean {
    this.initialize();
    return this._toolDefinitions.size > 0;
  }

  static getEnabledTools(enabledToolNames: string[]): ToolDefinition[] {
    this.initialize();
    return enabledToolNames
      .map((name) => this._toolDefinitions.get(name))
      .filter((tool): tool is ToolDefinition => tool !== undefined);
  }
}
