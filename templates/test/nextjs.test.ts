import { test, type TestContext } from '@webcontainer/test';
import { beforeEach, expect, onTestFinished } from 'vitest';

beforeEach<TestContext>(async ({ setup, webcontainer }) => {
  await setup(async () => {
    await webcontainer.mount('nextjs');
    await webcontainer.runCommand('npm', ['install']);
  });
});

test('user can build project', async ({ webcontainer }) => {
  await webcontainer.runCommand('npm', ['run', 'build']);

  await expect(webcontainer.readdir('.next')).resolves.toMatchInlineSnapshot(`
    [
      "BUILD_ID",
      "app-build-manifest.json",
      "app-path-routes-manifest.json",
      "build-manifest.json",
      "cache",
      "export-marker.json",
      "images-manifest.json",
      "next-minimal-server.js.nft.json",
      "next-server.js.nft.json",
      "package.json",
      "prerender-manifest.js",
      "prerender-manifest.json",
      "react-loadable-manifest.json",
      "required-server-files.json",
      "routes-manifest.json",
      "server",
      "static",
      "trace",
      "types",
    ]
  `);

  await expect(webcontainer.readdir('.next/server')).resolves.toMatchInlineSnapshot(`
    [
      "app",
      "app-paths-manifest.json",
      "chunks",
      "font-manifest.json",
      "middleware-build-manifest.js",
      "middleware-manifest.json",
      "middleware-react-loadable-manifest.js",
      "next-font-manifest.js",
      "next-font-manifest.json",
      "pages",
      "pages-manifest.json",
      "server-reference-manifest.js",
      "server-reference-manifest.json",
      "webpack-runtime.js",
    ]
  `);
});

test('user can start project and see changes in preview', async ({ preview, webcontainer }) => {
  const { exit } = webcontainer.runCommand('npm', ['run', 'dev']);
  onTestFinished(exit);

  const text = 'Find in-depth information about Next.js features and API.';
  await preview.getByText(text);

  const app = await webcontainer.readFile('app/page.tsx');

  await webcontainer.writeFile('app/page.tsx', app.replace(text, 'File edited'));

  await preview.getByText('File edited');
});
