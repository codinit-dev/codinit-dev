import type { WebContainerProcess } from '@webcontainer/api';

export async function streamOutput(
  process: WebContainerProcess,
  options: { onOutput?: (output: string) => void; debounceMs?: number } = {},
): Promise<{ output: string; exitCode: number }> {
  let output = '';
  process.output.pipeTo(
    new WritableStream({
      write(data) {
        output += data;
        options.onOutput?.(data);
      },
    }),
  );

  const exitCode = await process.exit;

  return { output, exitCode };
}
