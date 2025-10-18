import { test, type TestContext } from '@webcontainer/test';
import { beforeEach, expect, onTestFinished } from 'vitest';

beforeEach<TestContext>(async ({ setup, webcontainer }) => {
  await setup(async () => {
    await webcontainer.mount('angular');
    await webcontainer.runCommand('npm', ['install']);
  });
});

test('user can build project', async ({ webcontainer }) => {
  await webcontainer.runCommand('npm', ['run', 'build']);

  await expect(webcontainer.readdir('dist')).resolves.toMatchInlineSnapshot(`
    [
      "demo",
    ]
  `);

  await expect(webcontainer.readdir('dist/demo')).resolves.toMatchInlineSnapshot(`
    [
      "3rdpartylicenses.txt",
      "browser",
      "prerendered-routes.json",
    ]
  `);

  await expect(webcontainer.readdir('dist/demo/browser')).resolves.toMatchInlineSnapshot(`
        [
          "index.html",
          "main.js",
          "polyfills.js",
          "styles.css",
        ]
      `);
});

test('user can start project and see changes in preview', async ({ preview, webcontainer }) => {
  const { exit } = webcontainer.runCommand('npm', ['run', 'dev']);
  onTestFinished(exit);

  await preview.getByRole('heading', { level: 1, name: 'Hello from Angular!' });

  const app = await webcontainer.readFile('src/main.ts');

  await webcontainer.writeFile('src/main.ts', app.replace('Hello from {{ name }}!', 'File edited'));

  await preview.getByRole('heading', { level: 1, name: 'File edited' });
});
