# Contributing to Keyboard Layout Detector

Thanks for taking the time to contribute! This guide keeps things lightweight for a solo-maintained project.

---

## Branching

All work happens on short-lived branches off `main`.

| Type | Pattern | Example |
|---|---|---|
| Feature | `feature/<name>` | `feature/farsi-support` |
| Bug fix | `fix/<name>` | `fix/undo-crash` |
| Refactor | `refactor/<name>` | `refactor/input-pipeline` |
| Chore | `chore/<name>` | `chore/update-manifest` |

**Rules:**
- Never push directly to `main`.
- One topic per branch; keep branches small and short-lived.
- Delete the branch after the PR is merged.

---

## Commit Messages

Use a short, imperative subject line (≤72 chars). Reference an issue number when applicable.

```
fix: prevent undo from crashing on empty input (#12)
feat: add Farsi keyboard layout mapping
refactor: extract word-detection logic into separate function
chore: bump manifest version to 4.4
```

**Format:** `type: description (#issue)`

Common types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.

---

## Opening a Pull Request

1. Branch off `main`: `git checkout -b fix/my-fix main`
2. Make focused, atomic commits.
3. Push and open a PR against `main`.
4. Fill in the PR template completely.
5. Wait for review (or self-review for solo work) before merging.
6. Delete the branch after merge.

### PR Checklist

- [ ] Branch follows the `type/description` naming convention
- [ ] Commits are focused and have clear messages
- [ ] No unrelated changes are included
- [ ] The extension loads without errors (`chrome://extensions/`)
- [ ] Manual smoke-test: `Ctrl+Alt`, `Ctrl+Q`, and `Ctrl+Z` still work as expected
- [ ] Branch will be deleted after merge

---

## Keeping Branches Up-to-Date (Rebase)

Prefer rebase over merge to keep a clean linear history:

```bash
# Update main first
git checkout main
git pull origin main

# Rebase your branch onto the updated main
git checkout fix/my-fix
git rebase main
```

If conflicts arise:
1. Resolve each conflicting file manually.
2. Stage the resolved file: `git add <file>`
3. Continue: `git rebase --continue`
4. If things go wrong, abort and start over: `git rebase --abort`

> Force-push is required after rebase on a branch you own:
> `git push --force-with-lease origin fix/my-fix`

---

## Conflict Resolution Tips

- Resolve conflicts in small chunks — one file at a time.
- Use `git diff` to understand what changed on each side before deciding.
- For dictionary files (`dict-ar.json`, `dict-en.json`), keep both additions when in doubt.
- Ask in the issue thread if the conflict is unclear.

---

## Reporting Dictionary Issues

Use the **in-extension report panel**: after running a scan, click any orange-highlighted word to open the report panel and submit corrections directly.

---

## Questions?

Open an issue or leave a comment on the relevant PR.
