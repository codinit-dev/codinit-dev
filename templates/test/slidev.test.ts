import { test, type TestContext } from '@webcontainer/test';
import { beforeEach, expect, onTestFinished } from 'vitest';

beforeEach<TestContext>(async ({ setup, webcontainer }) => {
  await setup(async () => {
    await webcontainer.mount('slidev');
    await webcontainer.runCommand('npm', ['install']);
  });
});

test('user can build project', async ({ webcontainer }) => {
  await webcontainer.runCommand('npm', ['run', 'build']);

  await expect(webcontainer.readdir('dist')).resolves.toMatchInlineSnapshot(`
    [
      "404.html",
      "_redirects",
      "assets",
      "index.html",
    ]
  `);
});

test('user can start project and see changes in preview', async ({ preview, webcontainer }) => {
  const { exit } = webcontainer.runCommand('npm', ['run', 'dev']);
  onTestFinished(exit);

  await preview.getByRole('heading', { level: 1, name: 'Welcome to Slidev' });

  const slides = await webcontainer.readFile('slides.md');

  await webcontainer.writeFile('slides.md', slides.replace('# Welcome to Slidev', '# File edited'));

  await preview.getByRole('heading', { level: 1, name: 'File edited' });
});
