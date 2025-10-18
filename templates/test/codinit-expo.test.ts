import { test, type TestContext } from '@webcontainer/test';
import { beforeEach, onTestFinished } from 'vitest';

beforeEach<TestContext>(async ({ setup, webcontainer }) => {
  await setup(async () => {
    await webcontainer.mount('codinit-expo');
    await webcontainer.runCommand('npm', ['install']);
  });
});

test('user can build project', async ({ webcontainer, expect }) => {
  const { waitForText, exit } = webcontainer.runCommand('npm', ['run', 'build:web']);

  // Expo's build process can get stuck, so wait for expected logs and start asserting content while process attempts to exit
  await waitForText('Exported: dist', 180_000);

  await expect(webcontainer.readdir('dist')).resolves.toMatchInlineSnapshot(`
      [
        "_expo",
        "assets",
        "favicon.ico",
        "index.html",
        "metadata.json",
      ]
    `);

  // Forcefully exit the process if stuck
  await exit();
});

test('user can start project and see changes in preview', async ({ preview, webcontainer }) => {
  const { exit } = webcontainer.runCommand('npm', ['run', 'dev']);
  onTestFinished(exit);

  await preview.getByText("This screen doesn't exist.");

  const app = await webcontainer.readFile('app/+not-found.tsx');

  await webcontainer.writeFile('app/+not-found.tsx', app.replace("This screen doesn't exist.", 'File edited'));

  await preview.getByText('File edited');
});
