# Contributing

Download desktop app --> [latest release](https://github.com/codinit-dev/codinit-dev/releases/latest)

Thanks for your interest in contributing! CodinIT is an open-source AI app builder (web + desktop) and we welcome contributions of all kinds — bug reports, documentation fixes, examples, tests, design improvements, and code changes.

Please take a quick look through this document to find the best way to contribute.

---

## Table of Contents

* [Code of Conduct](#code-of-conduct)
* [How can I contribute?](#how-can-i-contribute)
  * [Reporting bugs](#reporting-bugs)
  * [Requesting features](#requesting-features)
  * [Working on issues / submitting PRs](#working-on-issues--submitting-prs)
* [Development setup](#development-setup)
* [Branching & commits](#branching--commits)
* [Formatting, linting & tests](#formatting-linting--tests)
* [Pull request checklist](#pull-request-checklist)
* [Security](#security)
* [License & thanks](#license--thanks)

---

## [Code of Conduct](/CODE_OF_CONDUCT.md)

We expect all contributors to follow a friendly, respectful, and constructive Code of Conduct. If the project does not already include one, please follow GitHub's Community Guidelines and be courteous in issues, PRs, and discussions.

If you encounter harassment or problematic behavior, please contact the repository owners privately (see the repository `SECURITY.yaml`).

---

## How can I contribute?

### Reporting bugs

If you find a bug:

1. Search existing issues to see whether it's already been reported.
2. If not found, open a new issue with a clear title and the following details:

   * **What you expected to happen**
   * **What actually happened**
   * **Steps to reproduce** (minimum reproducible example is ideal)
   * **Environment** (OS, Node/pnpm/yarn version, Electron if applicable)
   * Any error output or stack traces

A good bug report helps maintainers reproduce and fix problems quickly.

### Requesting features

Open an issue labeled **enhancement** or **feature request** describing the desired behavior, the user story it supports, and any ideas for implementation. If you plan to implement the feature yourself, say so and link to the issue from your pull request.

### Working on issues / submitting PRs

1. Claim the issue by commenting on it, or start a PR and reference the issue using `Fixes #ISSUE`.
2. Create a branch from `main` named using the pattern: `feature/short-description` or `fix/short-description`.
3. Follow the commit style described below and open a PR describing the change, why it’s needed, and any migration or configuration steps.
4. Keep PRs focused: small, reviewable changes are easiest to land.

---

## Development setup (for contributors)

This section is intentionally minimal and focused on contributing.

1. Fork the repository on GitHub.
2. Clone your fork and install dependencies using the package manager defined in `package.json` (pnpm preferred).
3. Create a `.env.local` file based on `.env.example` and provide valid credentials for any services required by the area you are working on (e.g. AI providers, database, auth).
4. Run the development environment and confirm the app starts before making changes.

If setup instructions change, the project README is the source of truth. Keep this file focused on contribution rules.

---

## Branching & commits

* Branch from `main` for new work.
* Use descriptive branch names: `feature/<name>`, `fix/<name>`, `chore/<name>`.
* Use conventional commits where possible, for example:

  * `feat: add X`
  * `fix: correct Y`
  * `chore: update deps`

---

## Formatting, linting & tests

This project uses formatting and linting tools (Prettier, ESLint, etc.). Please:

* Run linters and formatters before creating a PR.
* Add or update tests for new/changed behavior where applicable. There is a `__tests__` folder and Playwright configuration for end-to-end/preview tests.
* If you are unsure which scripts to run, check `package.json` for `test`, `lint`, `format`, and `dev` scripts.

---

## Pull request checklist

Before requesting review, please ensure:

* [ ] The PR targets the `main` branch (or the branch noted in the issue)
* [ ] Your code builds and runs locally (`pnpm run dev` / `pnpm build`)
* [ ] Linting and formatting pass
* [ ] Relevant tests are added/updated and pass
* [ ] You’ve updated documentation when applicable (README, inline comments, etc.)

---

## Security

If you discover a security vulnerability, please follow the repository's `SECURITY.yaml` guidance and do **not** disclose sensitive details in public issues. Prefer private contact to the maintainers as described in the repository's security policy.

---

## License & thanks

By contributing, you agree that your contributions will be licensed under the repository’s MIT license.

As well as our [Terms](https://codinit.dev/terms) & [Privacy Policy](https://codinit.dev/privacy) any violations relating to our terms & conditions will be deemed punishable by law and legal action will be taken against you.

Thanks for helping make CodinIT better! If you have any questions about contributing, open an issue marked `help wanted` or reach out via the repository discussions.

