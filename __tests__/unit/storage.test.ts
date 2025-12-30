import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initializeProject, saveFileLocal, isElectron } from '~/utils/electron';

describe('Storage System', () => {
    beforeEach(() => {
        // Reset global window object mocks
        (global as any).window = {
            electronAPI: {
                initializeProject: vi.fn(),
                saveFileLocal: vi.fn(),
            },
        };

        // Silence console.error for expected failures
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    describe('isElectron', () => {
        it('should return true when electronAPI is available', () => {
            expect(isElectron()).toBe(true);
        });

        it('should return false when window is undefined', () => {
            const originalWindow = global.window;
            delete (global as any).window;
            expect(isElectron()).toBe(false);
            global.window = originalWindow;
        });
    });

    describe('initializeProject', () => {
        it('should call electronAPI.initializeProject with projectName', async () => {
            const projectName = 'test-project';
            const mockInit = vi.spyOn((window as any).electronAPI, 'initializeProject').mockResolvedValue(true);

            const result = await initializeProject(projectName);

            expect(result).toBe(true);
            expect(mockInit).toHaveBeenCalledWith(projectName);
        });

        it('should return false if initializeProject fails', async () => {
            const projectName = 'test-project';
            vi.spyOn((window as any).electronAPI, 'initializeProject').mockRejectedValue(new Error('Failed'));

            const result = await initializeProject(projectName);

            expect(result).toBe(false);
        });
    });

    describe('saveFileLocal', () => {
        it('should call electronAPI.saveFileLocal with correct arguments', async () => {
            const projectName = 'test-project';
            const filePath = 'src/test.ts';
            const content = 'test content';
            const mockSave = vi.spyOn((window as any).electronAPI, 'saveFileLocal').mockResolvedValue(true);

            const result = await saveFileLocal(projectName, filePath, content);

            expect(result).toBe(true);
            expect(mockSave).toHaveBeenCalledWith(projectName, filePath, content);
        });

        it('should handle Uint8Array content', async () => {
            const content = new Uint8Array([1, 2, 3]);
            const mockSave = vi.spyOn((window as any).electronAPI, 'saveFileLocal').mockResolvedValue(true);

            const result = await saveFileLocal('project', 'file', content);

            expect(result).toBe(true);
            expect(mockSave).toHaveBeenCalledWith('project', 'file', content);
        });
    });
});
