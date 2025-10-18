import { test, type TestContext } from '@webcontainer/test';
import { beforeEach, expect, onTestFinished } from 'vitest';

import { removeFileHash } from './utils';

beforeEach<TestContext>(async ({ setup, webcontainer }) => {
  await setup(async () => {
    await webcontainer.mount('codinit-vite-react-ts');
    await webcontainer.runCommand('npm', ['install']);
  });
});

test('user can build project', async ({ webcontainer }) => {
  await webcontainer.runCommand('npm', ['run', 'build']);

  await expect(webcontainer.readdir('dist')).resolves.toMatchInlineSnapshot(`
    [
      "assets",
      "index.html",
    ]
  `);

  const assets = await webcontainer.readdir('dist/assets');
  expect(assets.map(removeFileHash)).toMatchInlineSnapshot(`
    [
      "index.css",
      "index.js",
    ]
  `);
});

test('user can start project and see changes in preview', async ({ preview, webcontainer }) => {
  const { exit } = webcontainer.runCommand('npm', ['run', 'dev']);
  onTestFinished(exit);

  await preview.getByText('Start prompting (or editing) to see magic happen :)');

  const app = await webcontainer.readFile('src/App.tsx');

  await webcontainer.writeFile(
    'src/App.tsx',
    app.replace('<p>Start prompting (or editing) to see magic happen :)</p>', '<h1>File edited</h1>'),
  );

  await preview.getByRole('heading', { level: 1, name: 'File edited' });
});
