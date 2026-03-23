# Contributing to Keyboard Layout Detector

Thank you for your interest in contributing! Whether it's fixing a bug, improving the dictionary, or suggesting a new feature — all contributions are welcome.

---

## Table of Contents

1. [Branching Strategy](#branching-strategy)
2. [Development Workflow](#development-workflow)
3. [Commit Message Guidelines](#commit-message-guidelines)
4. [Pull Request Process](#pull-request-process)
5. [Reporting Bugs](#reporting-bugs)
6. [Suggesting Features](#suggesting-features)
7. [Dictionary Contributions](#dictionary-contributions)
8. [Code Style](#code-style)

---

## Branching Strategy

This project follows a lightweight **trunk-based branching model** suited for solo and small-team development.

### Branch Types

| Branch | Purpose |
|--------|---------|
| `main` | Stable, production-ready code. Protected — no direct pushes. |
| `feature/<description>` | New features (e.g. `feature/farsi-layout-support`) |
| `fix/<description>` | Bug fixes (e.g. `fix/arabic-word-boundary`) |
| `refactor/<description>` | Code refactoring without behavior change |
| `chore/<description>` | Tooling, deps, CI, docs (e.g. `chore/update-manifest`) |
| `release/<version>` | Release preparation (e.g. `release/v5.0`) |
| `archive/<name>` | Preserved old branches — never delete, never merge |
| `backup/<date>-<description>` | Safety snapshots before risky changes |

### Rules

- **Always branch off `main`** — never branch from another feature branch.
- **Keep branches short-lived** — merge back to `main` as soon as the work is done.
- **One concern per branch** — don't mix features and bug fixes in the same branch.
- **Delete merged branches** — remote branches should be deleted after the PR is merged.

### Visual Overview

```
main ──────────────────────────────────────────── (stable)
       │            │             │
       └─ feature/x │             └─ fix/y ──── PR ──► main
                    │
                    └─ refactor/z ────── PR ──► main
```

---

## Development Workflow

1. **Sync your fork** (if contributing from a fork):

   ```bash
   git checkout main
   git pull upstream main
   ```

2. **Create a branch** from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Load the extension locally** for testing:
   - Open `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked** and select the project folder
   - Open `test.html` for a quick interactive test

4. **Make your changes** with focused, atomic commits.

5. **Push your branch** and open a Pull Request to `main`.

---

## Commit Message Guidelines

Use the following format for all commit messages:

```
<type>(<scope>): <short summary>

[Optional body with more detail]
[Optional footer: Fixes #issue-number]
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `docs` | Documentation only |
| `chore` | Tooling, CI, dependency updates |
| `test` | Adding or updating tests |
| `style` | Formatting, whitespace (no logic change) |

### Examples

```
feat(detection): add Farsi layout support
fix(dict): correct mismatched Arabic word entries
docs(readme): update keyboard shortcut table
chore(manifest): bump version to v5.0
```

---

## Pull Request Process

1. Fill in the [pull request template](.github/pull_request_template.md).
2. Make sure your branch is up to date with `main` before opening the PR.
3. Describe **what** you changed and **why**.
4. Link any related issues using `Fixes #<number>` or `Closes #<number>`.
5. Request a review if working in a team; otherwise self-review before merging.
6. **Squash or rebase** if your branch has noisy intermediate commits.
7. Delete the remote branch after merging.

---

## Reporting Bugs

Use the **[Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md)** when opening an issue. Please include:

- Browser name and version
- Steps to reproduce the problem
- What you expected to happen vs what actually happened
- A screenshot or screen recording if possible

For unknown/incorrect dictionary conversions, use the **in-extension report panel** (click any orange-highlighted word after a scan) — this feeds directly into future dictionary updates.

---

## Suggesting Features

Use the **[Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md)**. Describe the use case, not just the implementation — that way the request can be evaluated and designed properly.

---

## Dictionary Contributions

The dictionaries live in `dict-ar.json` and `dict-en.json`. Each file is a plain JSON object mapping words to a boolean (`true`):

```json
{
  "example": true,
  "word": true
}
```

When adding words:
- Add **only real, common words** — no proper nouns, abbreviations, or slang unless widely used.
- Keep entries **lowercase** (the detection engine normalizes case at runtime).
- Open a focused PR that only touches dictionary files, so it can be reviewed quickly.

---

## Code Style

- Plain **vanilla JavaScript** — no build step, no bundler.
- Keep functions small and focused on a single responsibility.
- Use `event.code` (not `event.key`) for shortcut detection so shortcuts work regardless of the OS keyboard language.
- Use `writeToElement()` / `execCommand('insertText')` for writing into `contenteditable` elements so frameworks like CKEditor receive the update correctly.
- Avoid global state where possible; pass data through function arguments.

---

## Questions?

Open a [GitHub Discussion](../../discussions) or file an issue — happy to help.
