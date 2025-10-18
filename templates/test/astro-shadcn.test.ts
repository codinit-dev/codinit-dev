import { test, type TestContext } from '@webcontainer/test';
import { beforeEach, expect, onTestFinished } from 'vitest';

beforeEach<TestContext>(async ({ setup, webcontainer }) => {
  await setup(async () => {
    await webcontainer.mount('astro-shadcn');
    await webcontainer.runCommand('npm', ['install']);
  });
});

test('user can build project', async ({ webcontainer }) => {
  await webcontainer.runCommand('npm', ['run', 'build']);

  await expect(webcontainer.readdir('dist')).resolves.toMatchInlineSnapshot(`
    [
      "_astro",
      "favicon.svg",
      "index.html",
    ]
  `);

  const assets = await webcontainer.readdir('dist/_astro');
  expect(assets.map(removeHash)).toMatchInlineSnapshot(`
    [
      "client.js",
      "index.css",
    ]
  `);
});

test('user can start project and see changes in preview', async ({ preview, webcontainer }) => {
  const { exit } = webcontainer.runCommand('npm', ['run', 'dev']);
  onTestFinished(exit);

  await preview.getByText('Start prompting');

  const index = await webcontainer.readFile('src/pages/index.astro');

  await webcontainer.writeFile(
    'src/pages/index.astro',
    index.replace('<p>Start prompting</p>', '<h1>File edited</h1>'),
  );

  await preview.getByRole('heading', { level: 1, name: 'File edited' });
});

function removeHash(filename: string) {
  return filename.replace(/\.(.*)\./, '.');
}
