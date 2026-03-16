# Keyboard Layout Detector

> Instantly fix Arabic ↔ English keyboard layout mistakes in any text field — on any website.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-green.svg)](manifest.json)
[![Version](https://img.shields.io/badge/version-4.3-orange.svg)](CHANGELOG.md)

---

## Overview

Keyboard Layout Detector is a Chrome extension that detects when text was typed in the wrong keyboard language and corrects it with a single shortcut.

**Example — typed in the wrong layout:**

| You typed | You meant | After Ctrl+Alt |
|-----------|-----------|----------------|
| `hgHv hg;kdr` | `الحب الكثير` | ✅ Fixed |
| `لاخ هشته فاخق` | `you write your` | ✅ Fixed |
| `now i am مخرث` | `now i am love` | ✅ Partial fix — correct words untouched |

If a word cannot be reliably converted (no dictionary match), it is flagged with an orange box so you can review and report it, rather than silently producing wrong text.

---

## Features

- **Bidirectional** — Arabic typed in English layout, and English typed in Arabic layout
- **Smart detection** — only converts words that are genuinely wrong; correct words in a mixed sentence are left untouched
- **Dictionary-backed** — built-in Arabic and English dictionaries prevent false conversions
- **Visual scan** — animated sweep shows which words will be changed before applying anything
- **Unknown word flagging** — orange highlight + floating label for words with no valid conversion
- **Report system** — submit corrections directly from the flag label to improve the dictionary
- **One-tap undo** — Ctrl+Z restores the original text at any time after a correction
---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + Alt` | Auto-fix all wrong words in the focused field |
| `Ctrl + Q` | Fix only the word at the current cursor position |
| `Ctrl + Shift + Q` | **Universal convert** — converts every word regardless of language or dictionary |
| `Ctrl + Z` | Undo the last correction and restore original text |

> **`Ctrl + Shift + Q` — what it does exactly:**
> The standard `Ctrl+Alt` scan only converts words it can verify against the built-in Arabic and English dictionaries — words in other languages are skipped to avoid false results. `Ctrl + Shift + Q` removes that filter entirely: it applies the keyboard layout remapping to **every word** in the field, no dictionary check, no language detection. This is designed for users in countries where a third language is involved — for example, someone writing in Farsi, Urdu, or any other language that shares the Arabic script but isn't yet in the dictionary. As the extension expands its language support, this shortcut remains the guaranteed fallback that always works regardless of which language pair is active.

---

## How It Works

Pressing `Ctrl+Alt` triggers a four-phase progressive scan:

**Phase 1 — Scan animation**
A sweep plays across the input to signal the scan is running.

**Phase 2 — Analysis**
Each word is tested against both dictionaries. Words that map to a valid word in the opposite language are queued for conversion. Words whose conversion result is not in any dictionary are flagged as "stuck."

**Phase 3 — Highlights**
- 🔴 Red box — words that will be auto-converted
- 🟠 Orange box — words that could not be matched to any dictionary entry

**Phase 4 — Correction**
Convertible words are replaced in the text. A toast notification previews the conversions (up to 5 per line; tap `+N more` to expand). Stuck words receive a floating label — hover to keep it, click to open the report panel.

---

## Installation

### From the Chrome Web Store
*(Link will appear here once published)*

### Developer Mode (manual install)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the extension folder
5. The extension is now active on all websites

> Also compatible with Brave, Edge, and any Chromium-based browser.

---

## Supported Input Types

| Element | Supported |
|---|---|
| `<input type="text / search / email / tel / url">` | ✅ |
| `<textarea>` | ✅ |
| `contenteditable` elements | ✅ |
| Embedded iframes (Google Docs, Twitter, etc.) | ✅ |
| Browser address bar | ❌ Browser security restriction |

---

## Number Handling

Numbers are never treated as layout mistakes.

| Input | Ctrl+Alt result |
|---|---|
| `123` | Unchanged |
| `test123` | Letters convert, digits stay |
| `0551234567` | Unchanged |

Ctrl+Q (manual mode) can still convert digits to Arabic-Indic numerals if needed.

---

## File Structure

```
keyboard-layout-detector/
├── manifest.json        # Chrome MV3 manifest
├── content.js           # Core logic: detection, highlighting, correction, scan
├── fa-layout.js         # Arabic ↔ English keyboard layout mapping table
├── styles.css           # All injected UI styles
├── popup.html           # Extension popup
├── popup.js             # Popup logic
├── popup.css            # Popup styles
├── dict-en.json         # English dictionary
├── dict-ar.json         # Arabic dictionary
└── test.html            # Interactive demo page
```

---

## Contributing

Contributions are welcome — bug reports, dictionary additions, and pull requests alike.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push the branch: `git push origin feature/your-feature`
5. Open a Pull Request

To report a missing or incorrect dictionary word, use the in-extension report panel (click any orange box after a scan).

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full version history.

---

## Author

**Abdullah Mohammad Almatrfi** — [github.com/AbdullahAlmatrfi](https://github.com/AbdullahAlmatrfi)

---

## License

This project is licensed under the [MIT License](LICENSE).

