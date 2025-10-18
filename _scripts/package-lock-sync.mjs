import fs from 'node:fs';
import path from 'node:path';
import childProcess from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const shouldWrite = process.argv.includes('--write');
const shouldForceWrite = shouldWrite && process.argv.includes('--force');

const cwd = path.resolve(__dirname, '..');

const npmBin = resolveNpmBin(cwd);

const starters = fs.readdirSync(cwd, { withFileTypes: true });

// iterate over all starters and check if the `package-lock.json` is in sync with the `package.json`
const promises = [];

for (const starter of starters) {
  const dir = path.join(cwd, starter.name);

  if (!starter.isDirectory() || !fs.existsSync(path.join(dir, 'package.json'))) {
    // we're only interested in directories containing a `package.json`
    continue;
  }

  if (shouldWrite) {
    promises.push(updatePackageLock(dir, starter.name, shouldForceWrite));
  } else {
    promises.push(checkPackageLockSync(dir, starter.name));
  }
}

const result = await Promise.allSettled(promises);

let exitCode = 0;

for (const { status, reason } of result) {
  if (status === 'rejected') {
    exitCode = 1;

    console.error(reason.message);
  }
}

process.exit(exitCode);

function resolveNpmBin(cwd) {
  const binPath = path.join(cwd, 'node_modules', '.bin', 'npm');

  if (!fs.existsSync(binPath)) {
    console.error('Could not find npm binary.');

    process.exit(1);
  }

  return binPath;
}

function checkPackageLockSync(directory, name) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(path.join(directory, 'package-lock.json'))) {
      reject(new Error(`No \`package-lock.json\` found for starter \`${name}\`.`));

      return;
    }

    const child = childProcess.spawn(npmBin, ['ci'], {
      stdio: 'ignore',
      cwd: directory,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        console.log(`✔ ${name}`);
        resolve();
      } else {
        reject(
          new Error(`The \`package-lock.json\` is not in sync with the \`package.json\` for starter \`${name}\`.`),
        );
      }
    });
  });
}

function updatePackageLock(directory, name, force) {
  return new Promise((resolve, reject) => {
    // we only write the `package-lock.json` if it does not exist or if the `--force` flag is set
    if (!force && fs.existsSync(path.join(directory, 'package-lock.json'))) {
      resolve();

      return;
    }

    const child = childProcess.spawn(npmBin, ['install', '--package-lock-only', '--ignore-scripts'], {
      stdio: 'ignore',
      cwd: directory,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Failed to update the \`package-lock.json\` for starter \`${name}\`.`));
      }
    });
  });
}
