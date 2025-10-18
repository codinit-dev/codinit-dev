import { test, type TestContext } from '@webcontainer/test';
import { beforeEach, expect, onTestFinished } from 'vitest';

beforeEach<TestContext>(async ({ webcontainer, setup }) => {
  await setup(async () => {
    await webcontainer.mount('sveltekit');
    await webcontainer.runCommand('npm', ['install']);
  });
});

test('user can build project', async ({ webcontainer }) => {
  await webcontainer.runCommand('npm', ['run', 'build']);

  await expect(webcontainer.readdir('.svelte-kit')).resolves.toMatchInlineSnapshot(`
    [
      "ambient.d.ts",
      "generated",
      "output",
      "tsconfig.json",
      "types",
    ]
  `);

  await expect(webcontainer.readdir('.svelte-kit/output')).resolves.toMatchInlineSnapshot(`
    [
      "client",
      "server",
    ]
  `);

  await expect(webcontainer.readdir('.svelte-kit/output/client')).resolves.toMatchInlineSnapshot(`
    [
      ".vite",
      "_app",
      "favicon.png",
    ]
  `);

  await expect(webcontainer.readdir('.svelte-kit/output/server')).resolves.toMatchInlineSnapshot(`
    [
      ".vite",
      "chunks",
      "entries",
      "index.js",
      "internal.js",
      "manifest-full.js",
      "manifest.js",
      "nodes",
      "stylesheets",
    ]
  `);
});

test('user can start project and see changes in preview', async ({ preview, webcontainer }) => {
  const { exit } = webcontainer.runCommand('npm', ['run', 'dev']);
  onTestFinished(exit);

  await preview.getByRole('heading', {
    level: 1,
    name: 'Welcome to SvelteKit',
  });

  const app = await webcontainer.readFile('src/routes/+page.svelte');

  await webcontainer.writeFile(
    'src/routes/+page.svelte',
    app.replace('<h1>Welcome to SvelteKit</h1>', '<h1>File edited</h1>'),
  );

  await preview.getByRole('heading', { level: 1, name: 'File edited' });
});
