# ⌨️ Keyboard Layout Detector — v4.0

A Chrome extension that automatically detects and fixes **Arabic ↔ English keyboard layout mistakes** in any input field or content-editable area on any website.

---

## 🌟 What It Does

When you accidentally type Arabic text while your keyboard is in English mode (or vice versa), this extension instantly detects the mistake and corrects it with a single shortcut — no copy-paste, no manual retyping.

**Example:**
- You type `اسممخ` but meant `hello` → press **Ctrl+Alt** → instantly corrected ✅
- You type `hsgdh` but meant `اهلا` → same shortcut → fixed in milliseconds ✅

---

## ⚡ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| **Ctrl + Alt** | Auto-fix all wrong words in the active field |
| **Ctrl + Q** | Fix only the current word at the cursor position |
| **Ctrl + Shift + Q** | Force-fix every word (bypasses dictionary — converts everything) |
| **Ctrl + Z** | Undo the last correction and restore original text |

---

## 🔍 Smart Scan — Visual Feedback System

Pressing **Ctrl+Alt** triggers a **4-phase progressive scan** with rich visual feedback:

### Phase 1 — Scanning
A sweep animation plays across the input field to signal detection is running.

### Phase 2 — Analysis
The text is analyzed word by word against the built-in dictionary.

### Phase 3 — Highlights
- 🔴 **Red box** — words that were typed in the wrong layout and will be corrected
- 🟠 **Orange box** — words that appear to be wrong-layout but are **not found in the dictionary** (stuck words)

### Phase 4 — Label for Stuck Words (890 ms)
If any stuck words exist, a floating label appears above (or below, near the top of the screen) the orange box:

```
⚠ not in dictionary
click to add 👆
```

- **Glassmorphism style**: warm amber → deep-orange gradient with `backdrop-filter` blur
- **Hover to keep**: hovering the label (or the orange box) pauses auto-dismiss
- **Auto-fades** after 3 seconds if not interacted with
- **Click to report**: opens the Report Panel directly

---

## 📋 Report Panel — "Not in Dictionary" Flow

When you click the label, a floating panel appears anchored to the input:

- **Single stuck word** → text input: "Should be: ______"
- **Multiple stuck words** → dropdown selector; each word's correction is stored separately
- **Submit** → sends all filled corrections to our dictionary improvement form
- Shows `✅ N words reported!` on success

---

## 💬 Feedback

The popup includes a **"💬 Send feedback"** button that opens a Google Form pre-filled with your feedback. No data is collected automatically — only what you voluntarily type and submit.

---

## ↩️ Undo System

Every correction is saved in a per-session stack:

| Action | Undo |
|---|---|
| Ctrl+Q — single word | Ctrl+Z restores original |
| Ctrl+Alt — auto-fix all | Ctrl+Z restores original |
| Ctrl+Shift+Q — force fix | Ctrl+Z restores original |
| Multiple fixes | Ctrl+Z multiple times (LIFO order) |

---

## 📖 Dictionary System

Two built-in JSON dictionaries power the detection:

| File | Language Set |
|---|---|
| `dict-en.json` | English words |
| `dict-ar.json` | Arabic words |

Words found in the dictionary are considered valid and will not be flagged. Unknown words trigger the orange "stuck" box and allow you to report them for future dictionary additions.

---

## 🔢 Number Handling

Numbers are never keyboard layout mistakes:

| Scenario | Behavior |
|---|---|
| `123` with Ctrl+Alt | Unchanged — numbers are skipped |
| `test123` with Ctrl+Alt | Letters convert, `123` stays |
| `0551234567` (phone) | Stays unchanged |
| `123` with Ctrl+Q (manual) | Converts to `۱۲۳` — manual always available |

---

## 🌐 Supported Input Fields

Works on any website with these input types:

| Type | Supported |
|---|---|
| `<input type="text">` | ✅ |
| `<input type="search">` | ✅ |
| `<input type="email">` | ✅ |
| `<input type="tel">` | ✅ |
| `<input type="url">` | ✅ |
| `<textarea>` | ✅ |
| `contentEditable` elements | ✅ |
| Password fields | ✅ (if enabled) |
| Browser address bar | ❌ (browser security restriction) |

> Works across **all frames** on the page (`all_frames: true`), including embedded iframes (e.g. Google Docs, Twitter compose).

---

## 🛠 Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the extension folder
5. The extension is now active on all websites

---

## 📁 File Structure

```
keyboard-layout-detector/
├── manifest.json        # Chrome MV3 manifest
├── content.js           # Core logic: detection, highlighting, correction, scan
├── fa-layout.js         # Arabic ↔ English keyboard layout mapping table
├── styles.css           # All injected UI styles (highlights, labels, panels, toast)
├── popup.html           # Extension popup UI
├── popup.js             # Popup logic (status display, feedback button)
├── popup.css            # Popup styles
├── dict-en.json         # English dictionary (Set)
├── dict-ar.json         # Arabic dictionary (Set)
├── icon16.png           # Extension icons
├── icon48.png
└── icon128.png
```

---

## 🆕 What's New in v4.0

### Smart Scan Visual Overhaul
- Merged all stuck words into a **single unified orange bounding box** (no more overlapping boxes)
- Removed distracting green highlights — scan now only shows red (wrong) + orange (stuck)
- Smooth `ease-out` transitions replacing old bouncy cubic-bezier curves

### "Not in Dictionary" Label
- Two-line floating label: `⚠ not in dictionary` + `click to add 👆`
- **Glassmorphism design**: amber-to-orange gradient + `backdrop-filter` blur + gold rim border + inset glass shine
- **Smart flip positioning**: appears above the orange box by default; flips below automatically when near the top of the screen (e.g. YouTube/Google search bars)
- **Hover persistence**: hovering pauses auto-dismiss for both the label and the orange box together
- **3-second auto-fade** with smooth opacity transition

### Per-Word Report Panel
- Dropdown selector when multiple stuck words exist
- Each correction stored individually in a `corrections` map
- Submit sends all corrections at once with a single confirmation

### Popup Simplified
- Removed word-input / auto-fill fields from popup
- Replaced with a single **"💬 Send feedback"** button linking to Google Form

### UX Polish
- Toast dismissed automatically when report panel opens
- All highlight boxes use consistent 4px padding
- Maximum `z-index` (`2147483647`) on all floating elements to prevent hiding behind site headers

---

## 📄 License

MIT — free to use, fork, and improve.
