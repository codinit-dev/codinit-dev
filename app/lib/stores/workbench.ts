import { atom, map, type MapStore, type ReadableAtom, type WritableAtom } from 'nanostores';
import type { EditorDocument, ScrollPosition } from '~/components/editor/codemirror/CodeMirrorEditor';
import type { ActionCallbackData, ArtifactCallbackData } from 'codinit-agent/message-parser';
import type { ExampleShell } from '~/utils/shell';
import { webcontainer, setupWebContainerEventHandlers } from '~/lib/webcontainer';
import type { ITerminal } from '~/types/terminal';
import { unreachable } from '~/utils/unreachable';
import { createScopedLogger } from '~/utils/logger';
import { EditorStore } from './editor';
import { FilesStore, type FileMap } from './files';
import { PreviewsStore } from './previews';
import { TerminalStore } from './terminal';
import JSZip from 'jszip';
import fileSaver from 'file-saver';
import { Octokit, type RestEndpointMethodTypes } from '@octokit/rest';
import { path } from '~/utils/path';
import { extractRelativePath } from '~/utils/diff';
import { description } from '~/lib/persistence';
import Cookies from 'js-cookie';
import { createSampler } from '~/utils/sampler';
import type { ActionAlert, DeployAlert, SupabaseAlert, FileAction } from '~/types/actions';
import { startAutoSave } from '~/lib/persistence/fileAutoSave';
import { diffApprovalStore } from './settings';
import { isElectron, saveFileLocal } from '~/utils/electron';
import { getProjectName } from '~/utils/projectName';
import { ActionRunner } from '~/lib/runtime/action-runner';

const { saveAs } = fileSaver;

const logger = createScopedLogger('WorkbenchStore');

function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => resolve(), { timeout: 100 });
    } else {
      setTimeout(resolve, 0);
    }
  });
}

const DEFAULT_ACTION_SAMPLE_INTERVAL = 500;

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

export type WorkbenchViewType = 'code' | 'diff' | 'preview' | 'progress';

export class WorkbenchStore {
  static readonly MAX_PENDING_ACTIONS = 50;

  #previewsStore = new PreviewsStore(webcontainer);
  #filesStore = new FilesStore(webcontainer);
  #editorStore = new EditorStore(this.#filesStore);
  #terminalStore = new TerminalStore(webcontainer);

  #reloadedMessages = new Set<string>();
  #actionQueueDepth = 0;

  artifacts: Artifacts = import.meta.hot?.data.artifacts ?? map({});
  thinkingArtifacts: MapStore<Record<string, ThinkingArtifactState>> =
    import.meta.hot?.data.thinkingArtifacts ?? map({});
  testArtifacts: MapStore<Record<string, TestArtifactState>> = import.meta.hot?.data.testArtifacts ?? map({});

  showWorkbench: WritableAtom<boolean> = import.meta.hot?.data.showWorkbench ?? atom(false);
  currentView: WritableAtom<WorkbenchViewType> = import.meta.hot?.data.currentView ?? atom('code');
  currentArtifactMessageId: WritableAtom<string | null> = import.meta.hot?.data.currentArtifactMessageId ?? atom(null);
  unsavedFiles: WritableAtom<Set<string>> = import.meta.hot?.data.unsavedFiles ?? atom(new Set<string>());
  actionAlert: WritableAtom<ActionAlert | undefined> =
    import.meta.hot?.data.actionAlert ?? atom<ActionAlert | undefined>(undefined);
  supabaseAlert: WritableAtom<SupabaseAlert | undefined> =
    import.meta.hot?.data.supabaseAlert ?? atom<SupabaseAlert | undefined>(undefined);
  deployAlert: WritableAtom<DeployAlert | undefined> =
    import.meta.hot?.data.deployAlert ?? atom<DeployAlert | undefined>(undefined);
  pendingApproval: WritableAtom<{
    actionId: string;
    messageId: string;
    artifactId: string;
    filePath: string;
    beforeContent: string;
    afterContent: string;
    action: FileAction;
  } | null> = import.meta.hot?.data.pendingApproval ?? atom(null);
  modifiedFiles = new Set<string>();
  artifactIdList: string[] = [];
  #globalExecutionQueue = Promise.resolve();

  actionStreamSampler = createSampler(
    (data: ActionCallbackData, isStreaming: boolean) =>
      this.addToExecutionQueue(() => this._runAction(data, isStreaming)),
    DEFAULT_ACTION_SAMPLE_INTERVAL,
  );

  constructor() {
    if (import.meta.hot) {
      import.meta.hot.data.artifacts = this.artifacts;
      import.meta.hot.data.thinkingArtifacts = this.thinkingArtifacts;
      import.meta.hot.data.testArtifacts = this.testArtifacts;
      import.meta.hot.data.unsavedFiles = this.unsavedFiles;
      import.meta.hot.data.showWorkbench = this.showWorkbench;
      import.meta.hot.data.currentView = this.currentView;
      import.meta.hot.data.currentArtifactMessageId = this.currentArtifactMessageId;
      import.meta.hot.data.actionAlert = this.actionAlert;
      import.meta.hot.data.supabaseAlert = this.supabaseAlert;
      import.meta.hot.data.deployAlert = this.deployAlert;
      import.meta.hot.data.pendingApproval = this.pendingApproval;

      // Ensure binary files are properly preserved across hot reloads
      const filesMap = this.files.get();

      for (const [path, dirent] of Object.entries(filesMap)) {
        if (dirent?.type === 'file' && dirent.isBinary && dirent.content) {
          // Make sure binary content is preserved
          this.files.setKey(path, { ...dirent });
        }
      }
    }

    if (!import.meta.env.SSR && typeof window !== 'undefined') {
      startAutoSave(
        () => this.files.get(),
        () => this.currentArtifactMessageId.get() || '',
      );
    }
  }

  addToExecutionQueue(callback: () => Promise<void>) {
    if (this.#actionQueueDepth >= WorkbenchStore.MAX_PENDING_ACTIONS) {
      logger.warn(`Action queue full (${this.#actionQueueDepth}), dropping action to prevent memory overflow`);

      this.actionAlert.set({
        type: 'warning',
        title: 'Action Queue Full',
        description: 'Too many pending actions. Slowing down to prevent crashes.',
      });

      return;
    }

    this.#actionQueueDepth++;

    this.#globalExecutionQueue = this.#globalExecutionQueue
      .then(() => callback())
      .finally(() => {
        this.#actionQueueDepth--;
      });
  }

  get previews() {
    return this.#previewsStore.previews;
  }

  updatePreviewUrl(port: number, url: string) {
    this.#previewsStore.updateUrl(port, url);
  }

  get files() {
    return this.#filesStore.files;
  }

  get currentDocument(): ReadableAtom<EditorDocument | undefined> {
    return this.#editorStore.currentDocument;
  }

  get selectedFile(): ReadableAtom<string | undefined> {
    return this.#editorStore.selectedFile;
  }

  get firstArtifact(): ArtifactState | undefined {
    return this.#getArtifact(this.artifactIdList[0]);
  }

  get filesCount(): number {
    return this.#filesStore.filesCount;
  }

  get showTerminal() {
    return this.#terminalStore.showTerminal;
  }
  get codinitTerminal() {
    return this.#terminalStore.codinitTerminal;
  }
  get alert() {
    return this.actionAlert;
  }
  clearAlert() {
    this.actionAlert.set(undefined);
  }

  get SupabaseAlert() {
    return this.supabaseAlert;
  }

  clearSupabaseAlert() {
    this.supabaseAlert.set(undefined);
  }

  get DeployAlert() {
    return this.deployAlert;
  }

  clearDeployAlert() {
    this.deployAlert.set(undefined);
  }

  toggleTerminal(value?: boolean) {
    this.#terminalStore.toggleTerminal(value);
  }

  attachTerminal(terminal: ITerminal) {
    this.#terminalStore.attachTerminal(terminal);
  }
  attachCodinitTerminal(terminal: ITerminal) {
    this.#terminalStore.attachCodinitTerminal(terminal);
  }

  onTerminalResize(cols: number, rows: number) {
    this.#terminalStore.onTerminalResize(cols, rows);
  }

  setDocuments(files: FileMap) {
    this.#editorStore.setDocuments(files);

    if (this.#filesStore.filesCount > 0 && this.currentDocument.get() === undefined) {
      // we find the first file and select it
      for (const [filePath, dirent] of Object.entries(files)) {
        if (dirent?.type === 'file') {
          this.setSelectedFile(filePath);
          break;
        }
      }
    }
  }

  setShowWorkbench(show: boolean) {
    this.showWorkbench.set(show);
  }

  setCurrentDocumentContent(newContent: string) {
    const filePath = this.currentDocument.get()?.filePath;

    if (!filePath) {
      return;
    }

    const originalContent = this.#filesStore.getFile(filePath)?.content;
    const unsavedChanges = originalContent !== undefined && originalContent !== newContent;

    this.#editorStore.updateFile(filePath, newContent);

    const currentDocument = this.currentDocument.get();

    if (currentDocument) {
      const previousUnsavedFiles = this.unsavedFiles.get();

      if (unsavedChanges && previousUnsavedFiles.has(currentDocument.filePath)) {
        return;
      }

      const newUnsavedFiles = new Set(previousUnsavedFiles);

      if (unsavedChanges) {
        newUnsavedFiles.add(currentDocument.filePath);
      } else {
        newUnsavedFiles.delete(currentDocument.filePath);
      }

      this.unsavedFiles.set(newUnsavedFiles);
    }
  }

  setCurrentDocumentScrollPosition(position: ScrollPosition) {
    const editorDocument = this.currentDocument.get();

    if (!editorDocument) {
      return;
    }

    const { filePath } = editorDocument;

    this.#editorStore.updateScrollPosition(filePath, position);
  }

  setSelectedFile(filePath: string | undefined) {
    this.#editorStore.setSelectedFile(filePath);
  }

  async saveFile(filePath: string) {
    const documents = this.#editorStore.documents.get();
    const document = documents[filePath];

    if (document === undefined) {
      return;
    }

    /*
     * For scoped locks, we would need to implement diff checking here
     * to determine if the user is modifying existing code or just adding new code
     * This is a more complex feature that would be implemented in a future update
     */

    await this.#filesStore.saveFile(filePath, document.value);

    if (isElectron()) {
      const projectName = this.#getProjectName();
      const relativePath = extractRelativePath(filePath);
      await saveFileLocal(projectName, relativePath, document.value);
    }

    const newUnsavedFiles = new Set(this.unsavedFiles.get());
    newUnsavedFiles.delete(filePath);

    this.unsavedFiles.set(newUnsavedFiles);
  }

  async saveCurrentDocument() {
    const currentDocument = this.currentDocument.get();

    if (currentDocument === undefined) {
      return;
    }

    await this.saveFile(currentDocument.filePath);
  }

  resetCurrentDocument() {
    const currentDocument = this.currentDocument.get();

    if (currentDocument === undefined) {
      return;
    }

    const { filePath } = currentDocument;
    const file = this.#filesStore.getFile(filePath);

    if (!file) {
      return;
    }

    this.setCurrentDocumentContent(file.content);
  }

  async saveAllFiles() {
    for (const filePath of this.unsavedFiles.get()) {
      await this.saveFile(filePath);
    }
  }

  getFileModifcations() {
    return this.#filesStore.getFileModifications();
  }

  getModifiedFiles() {
    return this.#filesStore.getModifiedFiles();
  }

  resetAllFileModifications() {
    this.#filesStore.resetFileModifications();
  }

  /**
   * Lock a file to prevent edits
   * @param filePath Path to the file to lock
   * @returns True if the file was successfully locked
   */
  lockFile(filePath: string) {
    return this.#filesStore.lockFile(filePath);
  }

  /**
   * Lock a folder and all its contents to prevent edits
   * @param folderPath Path to the folder to lock
   * @returns True if the folder was successfully locked
   */
  lockFolder(folderPath: string) {
    return this.#filesStore.lockFolder(folderPath);
  }

  /**
   * Unlock a file to allow edits
   * @param filePath Path to the file to unlock
   * @returns True if the file was successfully unlocked
   */
  unlockFile(filePath: string) {
    return this.#filesStore.unlockFile(filePath);
  }

  /**
   * Unlock a folder and all its contents to allow edits
   * @param folderPath Path to the folder to unlock
   * @returns True if the folder was successfully unlocked
   */
  unlockFolder(folderPath: string) {
    return this.#filesStore.unlockFolder(folderPath);
  }

  /**
   * Check if a file is locked
   * @param filePath Path to the file to check
   * @returns Object with locked status, lock mode, and what caused the lock
   */
  isFileLocked(filePath: string) {
    return this.#filesStore.isFileLocked(filePath);
  }

  /**
   * Check if a folder is locked
   * @param folderPath Path to the folder to check
   * @returns Object with locked status, lock mode, and what caused the lock
   */
  isFolderLocked(folderPath: string) {
    return this.#filesStore.isFolderLocked(folderPath);
  }

  async createFile(filePath: string, content: string | Uint8Array = '') {
    try {
      const success = await this.#filesStore.createFile(filePath, content);

      if (success) {
        this.setSelectedFile(filePath);

        if (isElectron()) {
          const projectName = this.#getProjectName();
          const relativePath = extractRelativePath(filePath);
          await saveFileLocal(projectName, relativePath, content);
        }

        /*
         * For empty files, we need to ensure they're not marked as unsaved
         * Only check for empty string, not empty Uint8Array
         */
        if (typeof content === 'string' && content === '') {
          const newUnsavedFiles = new Set(this.unsavedFiles.get());
          newUnsavedFiles.delete(filePath);
          this.unsavedFiles.set(newUnsavedFiles);
        }
      }

      return success;
    } catch (error) {
      console.error('Failed to create file:', error);
      throw error;
    }
  }

  async createFolder(folderPath: string) {
    try {
      return await this.#filesStore.createFolder(folderPath);
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  }

  isDefaultPreviewRunning() {
    return this.#previewsStore.previews.get().length > 0;
  }

  async deleteFile(filePath: string) {
    try {
      const currentDocument = this.currentDocument.get();
      const isCurrentFile = currentDocument?.filePath === filePath;

      const success = await this.#filesStore.deleteFile(filePath);

      if (success) {
        const newUnsavedFiles = new Set(this.unsavedFiles.get());

        if (newUnsavedFiles.has(filePath)) {
          newUnsavedFiles.delete(filePath);
          this.unsavedFiles.set(newUnsavedFiles);
        }

        if (isCurrentFile) {
          const files = this.files.get();
          let nextFile: string | undefined = undefined;

          for (const [path, dirent] of Object.entries(files)) {
            if (dirent?.type === 'file') {
              nextFile = path;
              break;
            }
          }

          this.setSelectedFile(nextFile);
        }
      }

      return success;
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  async deleteFolder(folderPath: string) {
    try {
      const currentDocument = this.currentDocument.get();
      const isInCurrentFolder = currentDocument?.filePath?.startsWith(folderPath + '/');

      const success = await this.#filesStore.deleteFolder(folderPath);

      if (success) {
        const unsavedFiles = this.unsavedFiles.get();
        const newUnsavedFiles = new Set<string>();

        for (const file of unsavedFiles) {
          if (!file.startsWith(folderPath + '/')) {
            newUnsavedFiles.add(file);
          }
        }

        if (newUnsavedFiles.size !== unsavedFiles.size) {
          this.unsavedFiles.set(newUnsavedFiles);
        }

        if (isInCurrentFolder) {
          const files = this.files.get();
          let nextFile: string | undefined = undefined;

          for (const [path, dirent] of Object.entries(files)) {
            if (dirent?.type === 'file') {
              nextFile = path;
              break;
            }
          }

          this.setSelectedFile(nextFile);
        }
      }

      return success;
    } catch (error) {
      console.error('Failed to delete folder:', error);
      throw error;
    }
  }

  abortAllActions() {
    // Iterate over all artifacts and their actions to abort them
    const artifacts = this.artifacts.get();

    for (const artifact of Object.values(artifacts)) {
      const actions = artifact.runner.actions.get();

      for (const action of Object.values(actions)) {
        if (action.status === 'pending' || action.status === 'running') {
          action.abort();
        }
      }
    }
  }

  setReloadedMessages(messages: string[]) {
    this.#reloadedMessages = new Set(messages);
  }

  #getArtifact(messageId: string): ArtifactState | undefined {
    return this.artifacts.get()[messageId];
  }

  #getProjectName() {
    return getProjectName();
  }

  addArtifact(data: ArtifactCallbackData) {
    const { partId, title, id, type } = data;
    const messageId = partId;
    const artifact = this.#getArtifact(messageId);

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
      runner: new ActionRunner(webcontainer, this.codinitTerminal as unknown as ExampleShell, {
        onAlert: (alert: ActionAlert) => {
          if (this.#reloadedMessages.has(messageId)) {
            return;
          }

          this.actionAlert.set(alert);
        },
        onToolCallComplete: () => {
          // Partial implementation
        },
      }),
    });
  }

  updateArtifact({ partId }: ArtifactCallbackData, state: Partial<ArtifactUpdateState>) {
    const messageId = partId;
    const artifact = this.#getArtifact(messageId);

    if (!artifact) {
      return;
    }

    this.artifacts.setKey(messageId, { ...artifact, ...state });
  }

  addTestArtifact(messageId: string, artifact: Omit<TestArtifactState, 'closed'>) {
    const testArtifact = this.#getTestArtifact(messageId);

    if (testArtifact) {
      return;
    }

    this.testArtifacts.setKey(messageId, {
      ...artifact,
      closed: false,
    });
  }

  updateTestArtifact(messageId: string, updates: Partial<TestArtifactUpdateState>) {
    const testArtifact = this.#getTestArtifact(messageId);

    if (!testArtifact) {
      return;
    }

    this.testArtifacts.setKey(messageId, { ...testArtifact, ...updates });
  }

  #getTestArtifact(messageId: string): TestArtifactState | undefined {
    return this.testArtifacts.get()[messageId];
  }

  addAction(data: ActionCallbackData) {
    this.addToExecutionQueue(() => this._addAction(data));
  }

  async _addAction(data: ActionCallbackData) {
    const { partId } = data;
    const messageId = partId;

    const artifact = this.#getArtifact(messageId);

    if (!artifact) {
      unreachable('Artifact not found');
    }

    return artifact.runner.addAction(data);
  }

  runAction(data: ActionCallbackData, isStreaming: boolean = false) {
    if (isStreaming) {
      this.actionStreamSampler(data, isStreaming);
    } else {
      this.addToExecutionQueue(() => this._runAction(data, isStreaming));
    }
  }

  async _runAction(data: ActionCallbackData, isStreaming: boolean = false) {
    const { partId } = data;
    const messageId = partId;

    const artifact = this.#getArtifact(messageId);

    if (!artifact) {
      unreachable('Artifact not found');
    }

    const action = artifact.runner.actions.get()[data.actionId];

    if (!action || action.executed) {
      return;
    }

    if (data.action.type === 'file') {
      const fullPath = path.join('/', data.action.filePath);

      if (this.selectedFile.get() !== fullPath) {
        this.setSelectedFile(fullPath);
      }

      this.#editorStore.updateFile(fullPath, data.action.content);

      if (!isStreaming && data.action.content) {
        await this.saveFile(fullPath);
      }
    }

    if (!isStreaming) {
      await artifact.runner.runAction(data, { isStreaming });
      this.resetAllFileModifications();
    } else {
      await artifact.runner.runAction(data, { isStreaming });
    }
  }

  async approveFileChange() {
    const pending = this.pendingApproval.get();

    if (!pending) {
      return;
    }

    const { actionId, messageId, artifactId, action } = pending;

    this.pendingApproval.set(null);

    const artifact = this.#getArtifact(messageId);

    if (!artifact) {
      unreachable('Artifact not found');
    }

    const actions = artifact.runner.actions.get();
    const currentAction = actions[actionId];

    if (currentAction) {
      artifact.runner.actions.setKey(actionId, { ...currentAction, status: 'running' });
    }

    const wasEnabled = diffApprovalStore.get();
    diffApprovalStore.set(false);

    try {
      await this._runAction(
        {
          actionId,
          partId: artifact.id as any,
          artifactId: artifact.id,
          action: {
            type: 'build' as const,
            content: 'npm run build',
          },
        },
        false,
      );
    } finally {
      diffApprovalStore.set(wasEnabled);
    }
  }

  async rejectFileChange() {
    const pending = this.pendingApproval.get();

    if (!pending) {
      return;
    }

    const { actionId, messageId } = pending;

    this.pendingApproval.set(null);

    const artifact = this.#getArtifact(messageId);

    if (!artifact) {
      unreachable('Artifact not found');
    }

    const actions = artifact.runner.actions.get();
    const currentAction = actions[actionId];

    if (currentAction) {
      artifact.runner.actions.setKey(actionId, { ...currentAction, status: 'aborted' });
    }
  }

  async downloadZip() {
    const zip = new JSZip();
    const files = this.files.get();

    // Get the project name from the description input, or use a default name
    const projectName = (description.value ?? 'project').toLocaleLowerCase().split(' ').join('_');

    // Generate a simple 6-character hash based on the current timestamp
    const timestampHash = Date.now().toString(36).slice(-6);
    const uniqueProjectName = `${projectName}_${timestampHash}`;

    for (const [filePath, dirent] of Object.entries(files)) {
      if (dirent?.type === 'file' && !dirent.isBinary) {
        const relativePath = extractRelativePath(filePath);

        // split the path into segments
        const pathSegments = relativePath.split('/');

        // if there's more than one segment, we need to create folders
        if (pathSegments.length > 1) {
          let currentFolder = zip;

          for (let i = 0; i < pathSegments.length - 1; i++) {
            currentFolder = currentFolder.folder(pathSegments[i])!;
          }
          currentFolder.file(pathSegments[pathSegments.length - 1], dirent.content);
        } else {
          // if there's only one segment, it's a file in the root
          zip.file(relativePath, dirent.content);
        }
      }
    }

    // Generate the zip file and save it
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${uniqueProjectName}.zip`);
  }

  async syncFiles(targetHandle: FileSystemDirectoryHandle) {
    const files = this.files.get();
    const syncedFiles = [];

    for (const [filePath, dirent] of Object.entries(files)) {
      if (dirent?.type === 'file' && !dirent.isBinary) {
        const relativePath = extractRelativePath(filePath);
        const pathSegments = relativePath.split('/');
        let currentHandle = targetHandle;

        for (let i = 0; i < pathSegments.length - 1; i++) {
          currentHandle = await currentHandle.getDirectoryHandle(pathSegments[i], { create: true });
        }

        // create or get the file
        const fileHandle = await currentHandle.getFileHandle(pathSegments[pathSegments.length - 1], {
          create: true,
        });

        // write the file content
        const writable = await fileHandle.createWritable();
        await writable.write(dirent.content);
        await writable.close();

        syncedFiles.push(relativePath);
      }
    }

    return syncedFiles;
  }

  async pushToGitHub(
    repoName: string,
    commitMessage?: string,
    githubUsername?: string,
    ghToken?: string,
    isPrivate: boolean = false,
  ) {
    try {
      const githubToken = ghToken || Cookies.get('githubToken');
      const owner = githubUsername || Cookies.get('githubUsername');

      if (!githubToken || !owner) {
        const error = new Error(
          'GitHub authentication required. Please connect your GitHub account in Settings > Connections.',
        );
        (error as any).code = 'AUTH_REQUIRED';
        throw error;
      }

      if (!repoName || !repoName.trim()) {
        const error = new Error('Repository name is required.');
        (error as any).code = 'INVALID_REPO_NAME';
        throw error;
      }

      console.log(`pushToGitHub called with isPrivate=${isPrivate}`);

      const octokit = new Octokit({ auth: githubToken });

      let repo: RestEndpointMethodTypes['repos']['get']['response']['data'];
      let visibilityJustChanged = false;
      let isNewRepo = false;

      try {
        const resp = await octokit.repos.get({ owner, repo: repoName });
        repo = resp.data;
        console.log('Repository already exists, using existing repo');

        if (repo.private !== isPrivate) {
          console.log(
            `Updating repository visibility from ${repo.private ? 'private' : 'public'} to ${isPrivate ? 'private' : 'public'}`,
          );

          try {
            const { data: updatedRepo } = await octokit.repos.update({
              owner,
              repo: repoName,
              private: isPrivate,
            });

            console.log('Repository visibility updated successfully');
            repo = updatedRepo;
            visibilityJustChanged = true;

            console.log('Waiting for visibility change to propagate...');
            await new Promise((resolve) => setTimeout(resolve, 3000));
          } catch (visibilityError: any) {
            console.error('Failed to update repository visibility:', visibilityError);

            if (visibilityError.status === 403) {
              const error = new Error(
                'Permission denied. Your GitHub token may not have sufficient permissions to update repository visibility.',
              );
              (error as any).code = 'PERMISSION_DENIED';
              throw error;
            }
          }
        }
      } catch (error: any) {
        if (error.code === 'PERMISSION_DENIED') {
          throw error;
        }

        if (error.status === 404) {
          console.log(`Creating new repository with private=${isPrivate}`);
          isNewRepo = true;

          try {
            const createRepoOptions = {
              name: repoName,
              private: isPrivate,
              auto_init: true,
            };

            console.log('Create repo options:', createRepoOptions);

            const { data: newRepo } = await octokit.repos.createForAuthenticatedUser(createRepoOptions);

            console.log('Repository created:', newRepo.html_url, 'Private:', newRepo.private);
            repo = newRepo;

            console.log('Waiting for repository to initialize...');
            await new Promise((resolve) => setTimeout(resolve, 5000));
          } catch (createError: any) {
            console.error('Failed to create repository:', createError);

            if (createError.status === 422) {
              const errorMessage = createError.response?.data?.errors?.[0]?.message || createError.message;

              if (errorMessage.includes('name already exists')) {
                const error = new Error(`Repository "${repoName}" already exists. Please choose a different name.`);
                (error as any).code = 'REPO_EXISTS';
                throw error;
              }

              const error = new Error(`Invalid repository name. ${errorMessage}`);
              (error as any).code = 'INVALID_REPO_NAME';
              throw error;
            } else if (createError.status === 403) {
              const error = new Error(
                'Permission denied. Your GitHub token may not have permission to create repositories.',
              );
              (error as any).code = 'PERMISSION_DENIED';
              throw error;
            } else if (createError.status === 401) {
              const error = new Error('GitHub token is invalid or expired. Please reconnect your GitHub account.');
              (error as any).code = 'AUTH_INVALID';
              throw error;
            }

            throw createError;
          }
        } else if (error.status === 401) {
          const err = new Error('GitHub token is invalid or expired. Please reconnect your GitHub account.');
          (err as any).code = 'AUTH_INVALID';
          throw err;
        } else if (error.status === 403) {
          const err = new Error('Permission denied. Your GitHub token may not have access to this repository.');
          (err as any).code = 'PERMISSION_DENIED';
          throw err;
        } else {
          console.error('Cannot access repo:', error);
          throw error;
        }
      }

      const files = this.files.get();

      if (!files || Object.keys(files).length === 0) {
        const error = new Error('No files found in the workspace. Please add some files before pushing.');
        (error as any).code = 'NO_FILES';
        throw error;
      }

      const pushFilesToRepo = async (attempt = 1): Promise<string> => {
        const maxAttempts = isNewRepo ? 4 : 3;

        try {
          console.log(`Pushing files to repository (attempt ${attempt}/${maxAttempts})...`);

          const blobs = await Promise.all(
            Object.entries(files).map(async ([filePath, dirent]) => {
              if (dirent?.type === 'file' && dirent.content) {
                try {
                  const { data: blob } = await octokit.git.createBlob({
                    owner: repo.owner.login,
                    repo: repo.name,
                    content: Buffer.from(dirent.content).toString('base64'),
                    encoding: 'base64',
                  });
                  return { path: extractRelativePath(filePath), sha: blob.sha };
                } catch (blobError) {
                  console.error(`Failed to create blob for ${filePath}:`, blobError);
                  return null;
                }
              }

              return null;
            }),
          );

          const validBlobs = blobs.filter(Boolean);

          if (validBlobs.length === 0) {
            const error = new Error('No valid files to push. All files may be binary or empty.');
            (error as any).code = 'NO_VALID_FILES';
            throw error;
          }

          const repoRefresh = await octokit.repos.get({ owner, repo: repoName });
          repo = repoRefresh.data;

          const defaultBranch = repo.default_branch || 'main';
          let latestCommitSha: string;

          try {
            const { data: ref } = await octokit.git.getRef({
              owner: repo.owner.login,
              repo: repo.name,
              ref: `heads/${defaultBranch}`,
            });
            latestCommitSha = ref.object.sha;
          } catch (refError: any) {
            console.error(`Error getting ref for branch ${defaultBranch}:`, refError);

            if (refError.status === 404) {
              if (isNewRepo && attempt < maxAttempts) {
                const delayMs = 3000;
                console.log(`Branch not ready yet, waiting ${delayMs}ms before retry...`);
                await new Promise((resolve) => setTimeout(resolve, delayMs));

                return pushFilesToRepo(attempt + 1);
              }

              const error = new Error(
                `Branch "${defaultBranch}" not found. The repository may still be initializing. Please try again in a moment.`,
              );
              (error as any).code = 'BRANCH_NOT_FOUND';
              throw error;
            }

            throw refError;
          }

          const { data: newTree } = await octokit.git.createTree({
            owner: repo.owner.login,
            repo: repo.name,
            base_tree: latestCommitSha,
            tree: validBlobs.map((blob) => ({
              path: blob!.path,
              mode: '100644',
              type: 'blob',
              sha: blob!.sha,
            })),
          });

          const { data: newCommit } = await octokit.git.createCommit({
            owner: repo.owner.login,
            repo: repo.name,
            message: commitMessage || 'Initial commit from your app',
            tree: newTree.sha,
            parents: [latestCommitSha],
          });

          await octokit.git.updateRef({
            owner: repo.owner.login,
            repo: repo.name,
            ref: `heads/${defaultBranch}`,
            sha: newCommit.sha,
          });

          console.log('Files successfully pushed to repository');

          return repo.html_url;
        } catch (error: any) {
          console.error(`Error during push attempt ${attempt}:`, error);

          if (error.code === 'NO_VALID_FILES' || error.code === 'BRANCH_NOT_FOUND') {
            throw error;
          }

          if ((visibilityJustChanged || isNewRepo || attempt === 1) && attempt < maxAttempts) {
            const delayMs = attempt * 2000;
            console.log(`Waiting ${delayMs}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));

            return pushFilesToRepo(attempt + 1);
          }

          if (error.status === 409) {
            const err = new Error(
              'Conflict detected. The repository may have been updated by another process. Please try again.',
            );
            (err as any).code = 'CONFLICT';
            throw err;
          } else if (error.status === 422) {
            const err = new Error('Invalid data sent to GitHub. Please check your files and try again.');
            (err as any).code = 'INVALID_DATA';
            throw err;
          }

          throw error;
        }
      };

      const repoUrl = await pushFilesToRepo();

      return repoUrl;
    } catch (error: any) {
      console.error('Error pushing to GitHub:', error);

      if (error.code) {
        throw error;
      }

      if (error.status === 401) {
        const err = new Error('GitHub authentication failed. Please reconnect your GitHub account.');
        (err as any).code = 'AUTH_INVALID';
        throw err;
      } else if (error.status === 403) {
        const err = new Error('Permission denied. Please check your GitHub token permissions.');
        (err as any).code = 'PERMISSION_DENIED';
        throw err;
      } else if (error.status === 404) {
        const err = new Error('Repository not found. Please check the repository name and try again.');
        (err as any).code = 'REPO_NOT_FOUND';
        throw err;
      }

      throw error;
    }
  }
}

export const workbenchStore = new WorkbenchStore();

// Setup WebContainer event handlers after store initialization
if (!import.meta.env.SSR) {
  setupWebContainerEventHandlers(workbenchStore);
}
