import { map, type MapStore } from 'nanostores';

export interface ArtifactVersion {
  id: string;
  artifactId: string;
  messageId: string;
  version: number;
  timestamp: Date;
  changes: ArtifactChange[];
  description?: string;
}

export interface ArtifactChange {
  type: 'file' | 'shell' | 'start' | 'supabase';
  filePath?: string;
  previousContent?: string;
  newContent?: string;
  command?: string;
}

export interface FileVersion {
  filePath: string;
  content: string;
  timestamp: Date;
  artifactId: string;
  version: number;
}

type ArtifactVersionsMap = MapStore<Record<string, ArtifactVersion[]>>;
type FileVersionsMap = MapStore<Record<string, FileVersion[]>>;

const MAX_VERSIONS_PER_ARTIFACT = 50;
const MAX_FILE_VERSIONS = 100;

class ArtifactVersionStore {
  #artifactVersions: ArtifactVersionsMap = import.meta.hot?.data.artifactVersions ?? map({});
  #fileVersions: FileVersionsMap = import.meta.hot?.data.fileVersions ?? map({});

  constructor() {
    if (import.meta.hot) {
      import.meta.hot.data.artifactVersions = this.#artifactVersions;
      import.meta.hot.data.fileVersions = this.#fileVersions;
    }
  }

  get artifactVersions() {
    return this.#artifactVersions;
  }

  get fileVersions() {
    return this.#fileVersions;
  }

  createVersion(
    artifactId: string,
    messageId: string,
    changes: ArtifactChange[],
    description?: string,
  ): ArtifactVersion {
    const versions = this.getVersionsForArtifact(artifactId);
    const nextVersion = versions.length > 0 ? Math.max(...versions.map((v) => v.version)) + 1 : 1;

    const newVersion: ArtifactVersion = {
      id: `${artifactId}-v${nextVersion}-${Date.now()}`,
      artifactId,
      messageId,
      version: nextVersion,
      timestamp: new Date(),
      changes,
      description,
    };

    const updatedVersions = [...versions, newVersion];

    if (updatedVersions.length > MAX_VERSIONS_PER_ARTIFACT) {
      updatedVersions.shift();
    }

    this.#artifactVersions.setKey(artifactId, updatedVersions);

    for (const change of changes) {
      if (change.type === 'file' && change.filePath && change.newContent !== undefined) {
        this.#recordFileVersion(change.filePath, change.newContent, artifactId, nextVersion);
      }
    }

    return newVersion;
  }

  #recordFileVersion(filePath: string, content: string, artifactId: string, version: number): void {
    const existingVersions = this.getFileVersions(filePath);

    const newFileVersion: FileVersion = {
      filePath,
      content,
      timestamp: new Date(),
      artifactId,
      version,
    };

    const updatedVersions = [...existingVersions, newFileVersion];

    if (updatedVersions.length > MAX_FILE_VERSIONS) {
      updatedVersions.shift();
    }

    this.#fileVersions.setKey(filePath, updatedVersions);
  }

  getVersionsForArtifact(artifactId: string): ArtifactVersion[] {
    return this.#artifactVersions.get()[artifactId] || [];
  }

  getVersion(artifactId: string, version: number): ArtifactVersion | undefined {
    const versions = this.getVersionsForArtifact(artifactId);
    return versions.find((v) => v.version === version);
  }

  getLatestVersion(artifactId: string): ArtifactVersion | undefined {
    const versions = this.getVersionsForArtifact(artifactId);
    return versions.length > 0 ? versions[versions.length - 1] : undefined;
  }

  getFileVersions(filePath: string): FileVersion[] {
    return this.#fileVersions.get()[filePath] || [];
  }

  getFileAtVersion(filePath: string, artifactId: string, version: number): FileVersion | undefined {
    const versions = this.getFileVersions(filePath);
    return versions.find((v) => v.artifactId === artifactId && v.version === version);
  }

  getLatestFileVersion(filePath: string): FileVersion | undefined {
    const versions = this.getFileVersions(filePath);
    return versions.length > 0 ? versions[versions.length - 1] : undefined;
  }

  compareVersions(
    artifactId: string,
    fromVersion: number,
    toVersion: number,
  ): { added: string[]; modified: string[]; removed: string[] } {
    const fromVer = this.getVersion(artifactId, fromVersion);
    const toVer = this.getVersion(artifactId, toVersion);

    if (!fromVer || !toVer) {
      return { added: [], modified: [], removed: [] };
    }

    const fromFiles = new Map(
      fromVer.changes.filter((c) => c.type === 'file' && c.filePath).map((c) => [c.filePath!, c.newContent]),
    );

    const toFiles = new Map(
      toVer.changes.filter((c) => c.type === 'file' && c.filePath).map((c) => [c.filePath!, c.newContent]),
    );

    const added: string[] = [];
    const modified: string[] = [];
    const removed: string[] = [];

    for (const [path, content] of toFiles) {
      if (!fromFiles.has(path)) {
        added.push(path);
      } else if (fromFiles.get(path) !== content) {
        modified.push(path);
      }
    }

    for (const path of fromFiles.keys()) {
      if (!toFiles.has(path)) {
        removed.push(path);
      }
    }

    return { added, modified, removed };
  }

  getVersionHistory(artifactId: string): Array<{
    version: number;
    timestamp: Date;
    description?: string;
    fileCount: number;
    commandCount: number;
  }> {
    const versions = this.getVersionsForArtifact(artifactId);

    return versions.map((v) => ({
      version: v.version,
      timestamp: v.timestamp,
      description: v.description,
      fileCount: v.changes.filter((c) => c.type === 'file').length,
      commandCount: v.changes.filter((c) => c.type === 'shell' || c.type === 'start').length,
    }));
  }

  clearVersionsForArtifact(artifactId: string): void {
    const currentVersions = this.#artifactVersions.get();
    const { [artifactId]: _, ...rest } = currentVersions;
    this.#artifactVersions.set(rest);
  }

  clearFileVersions(filePath: string): void {
    const currentVersions = this.#fileVersions.get();
    const { [filePath]: _, ...rest } = currentVersions;
    this.#fileVersions.set(rest);
  }

  clearAll(): void {
    this.#artifactVersions.set({});
    this.#fileVersions.set({});
  }
}

export const artifactVersionStore = new ArtifactVersionStore();
