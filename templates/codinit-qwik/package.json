{
  "name": "my-qwik-basic-starter",
  "description": "Demo app with sample routes",
  "engines": {
    "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
  },
  "engines-annotation": "Mostly required by sharp which needs a Node-API v9 compatible runtime",
  "private": true,
  "trustedDependencies": [
    "sharp"
  ],
  "trustedDependencies-annotation": "Needed for bun to allow running install scripts",
  "type": "module",
  "scripts": {
    "build": "qwik build",
    "build.client": "vite build",
    "build.preview": "vite build --ssr src/entry.preview.tsx",
    "build.server": "vite build -c adapters/static/vite.config.ts",
    "build.types": "tsc --incremental --noEmit",
    "deploy": "echo 'Run \"npm run qwik add\" to install a server adapter'",
    "dev": "vite --mode ssr",
    "dev.debug": "node --inspect-brk ./node_modules/vite/bin/vite.js --mode ssr --force",
    "fmt": "prettier --write .",
    "fmt.check": "prettier --check .",
    "lint": "eslint \"src/**/*.ts*\"",
    "preview": "qwik build preview && vite preview --open",
    "start": "vite --open --mode ssr",
    "qwik": "qwik"
  },
  "devDependencies": {
    "@builder.io/qwik": "^1.7.3",
    "@builder.io/qwik-city": "^1.7.3",
    "@types/eslint": "^8.56.10",
    "@types/node": "^20.12.7",
    "@typescript-eslint/eslint-plugin": "^7.7.1",
    "@typescript-eslint/parser": "^7.7.1",
    "eslint": "^8.57.0",
    "eslint-plugin-qwik": "^1.7.3",
    "prettier": "^3.2.5",
    "typescript": "5.4.5",
    "undici": "*",
    "vite": "^5.2.10",
    "vite-tsconfig-paths": "^4.2.1"
  }
}
