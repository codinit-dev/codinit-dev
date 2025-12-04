import { map, type MapStore } from 'nanostores';
import { ActionRunner } from '~/lib/runtime/action-runner';
import type {
  ActionCallbackData,
  ArtifactCallbackData,
  ThinkingArtifactCallbackData,
} from '~/lib/runtime/message-parser';
import { webcontainer } from '~/lib/webcontainer';
import type { ExampleShell } from '~/utils/shell';
import type { ActionAlert, DeployAlert, SupabaseAlert } from '~/types/actions';

export interface ArtifactState {
  id: string;
  title: string;
  type?: string;
  closed: boolean;
  runner: ActionRunner;
}

export interface ThinkingArtifactState {
  id: string;
  title: string;
  type: 'thinking';
  closed: boolean;
  steps: string[];
  content: string;
}

export interface TestArtifactState {
  id: string;
  title: string;
  type: 'test';
  closed: boolean;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  duration: number;
  coverage?: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
  };
  failedTests?: Array<{
    name: string;
    file: string;
    line: number;
    error: string;
    stack?: string;
  }>;
  command: string;
  status: 'running' | 'complete' | 'failed';
  timestamp: string;
}

export type ArtifactUpdateState = Pick<ArtifactState, 'title' | 'closed'>;
export type ThinkingArtifactUpdateState = Pick<ThinkingArtifactState, 'title' | 'closed'>;
export type TestArtifactUpdateState = Pick<
  TestArtifactState,
  'title' | 'closed' | 'status' | 'summary' | 'duration' | 'coverage' | 'failedTests'
>;

type Artifacts = MapStore<Record<string, ArtifactState>>;

export interface ArtifactsStoreCallbacks {
  getCodinitTerminal: () => ExampleShell;
  onActionAlert: (alert: ActionAlert) => void;
  onSupabaseAlert: (alert: SupabaseAlert) => void;
  onDeployAlert: (alert: DeployAlert) => void;
}

export class ArtifactsStore {
  artifacts: Artifacts = import.meta.hot?.data.artifacts ?? map({});
  thinkingArtifacts: MapStore<Record<string, ThinkingArtifactState>> =
    import.meta.hot?.data.thinkingArtifacts ?? map({});
  testArtifacts: MapStore<Record<string, TestArtifactState>> = import.meta.hot?.data.testArtifacts ?? map({});
  artifactIdList: string[] = [];

  #reloadedMessages = new Set<string>();
  #callbacks: ArtifactsStoreCallbacks;

  constructor(callbacks: ArtifactsStoreCallbacks) {
    this.#callbacks = callbacks;

    if (import.meta.hot) {
      import.meta.hot.data.artifacts = this.artifacts;
      import.meta.hot.data.thinkingArtifacts = this.thinkingArtifacts;
      import.meta.hot.data.testArtifacts = this.testArtifacts;
    }
  }

  setReloadedMessages(messages: string[]) {
    this.#reloadedMessages = new Set(messages);
  }

  get firstArtifact(): ArtifactState | undefined {
    return this.getArtifact(this.artifactIdList[0]);
  }

  getArtifact(id: string): ArtifactState | undefined {
    const artifacts = this.artifacts.get();
    return artifacts[id];
  }

  getThinkingArtifact(messageId: string): ThinkingArtifactState | undefined {
    return this.thinkingArtifacts.get()[messageId];
  }

  getTestArtifact(messageId: string): TestArtifactState | undefined {
    return this.testArtifacts.get()[messageId];
  }

  addArtifact(data: ArtifactCallbackData & { id: string; title: string; type?: string }) {
    const { messageId, title, id, type } = data;
    const artifact = this.getArtifact(messageId);

    if (artifact) {
      return;
    }

    if (!this.artifactIdList.includes(messageId)) {
      this.artifactIdList.push(messageId);
    }

    this.artifacts.setKey(messageId, {
      id,
      title,
      closed: false,
      type,
      runner: new ActionRunner(
        webcontainer,
        () => this.#callbacks.getCodinitTerminal(),
        (alert) => {
          if (this.#reloadedMessages.has(messageId)) {
            return;
          }

          this.#callbacks.onActionAlert(alert);
        },
        (alert) => {
          if (this.#reloadedMessages.has(messageId)) {
            return;
          }

          this.#callbacks.onSupabaseAlert(alert);
        },
        (alert) => {
          if (this.#reloadedMessages.has(messageId)) {
            return;
          }

          this.#callbacks.onDeployAlert(alert);
        },
        (testResult) => {
          if (this.#reloadedMessages.has(messageId)) {
            return;
          }

          const testArtifact = this.getTestArtifact(messageId);

          if (!testArtifact) {
            this.addTestArtifact(messageId, {
              id: `test-${Date.now()}`,
              title: 'Test Results',
              type: 'test',
              command: testResult.command,
              summary: testResult.summary,
              duration: testResult.duration,
              coverage: testResult.coverage,
              failedTests: testResult.failedTests,
              status: testResult.status,
              timestamp: new Date().toISOString(),
            });
          } else {
            this.updateTestArtifact(messageId, {
              summary: testResult.summary,
              duration: testResult.duration,
              coverage: testResult.coverage,
              failedTests: testResult.failedTests,
              status: testResult.status,
            });
          }
        },
      ),
    });
  }

  updateArtifact({ messageId }: ArtifactCallbackData, state: Partial<ArtifactUpdateState>) {
    const artifact = this.getArtifact(messageId);

    if (!artifact) {
      return;
    }

    this.artifacts.setKey(messageId, { ...artifact, ...state });
  }

  addThinkingArtifact({ messageId, title, id, type, steps, content }: ThinkingArtifactCallbackData) {
    const thinkingArtifact = this.getThinkingArtifact(messageId);

    if (thinkingArtifact) {
      return;
    }

    this.thinkingArtifacts.setKey(messageId, {
      id,
      title,
      closed: false,
      type,
      steps,
      content,
    });
  }

  updateThinkingArtifact({ messageId }: ThinkingArtifactCallbackData, state: Partial<ThinkingArtifactUpdateState>) {
    const thinkingArtifact = this.getThinkingArtifact(messageId);

    if (!thinkingArtifact) {
      return;
    }

    this.thinkingArtifacts.setKey(messageId, { ...thinkingArtifact, ...state });
  }

  addTestArtifact(messageId: string, artifact: Omit<TestArtifactState, 'closed'>) {
    const testArtifact = this.getTestArtifact(messageId);

    if (testArtifact) {
      return;
    }

    this.testArtifacts.setKey(messageId, {
      ...artifact,
      closed: false,
    });
  }

  updateTestArtifact(messageId: string, updates: Partial<TestArtifactUpdateState>) {
    const testArtifact = this.getTestArtifact(messageId);

    if (!testArtifact) {
      return;
    }

    this.testArtifacts.setKey(messageId, { ...testArtifact, ...updates });
  }

  addAction(data: ActionCallbackData) {
    const { messageId } = data;
    const artifact = this.getArtifact(messageId);

    if (!artifact) {
      throw new Error('Artifact not found');
    }

    return artifact.runner.addAction(data);
  }

  async runAction(data: ActionCallbackData, isStreaming: boolean = false) {
    const { messageId } = data;
    const artifact = this.getArtifact(messageId);

    if (!artifact) {
      throw new Error('Artifact not found');
    }

    const action = artifact.runner.actions.get()[data.actionId];

    if (!action || action.executed) {
      return;
    }

    await artifact.runner.runAction(data, isStreaming);
  }
}
