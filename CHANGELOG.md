# 🚀 Keyboard Layout Detector — Enhancement Roadmap

## Current Score: 16/32 (50%)

---

## ✅ Already Working (16/32)

| # |            Goal                    | Status |
|---|------------------------------------|--------|
| L1 | Character mapping (En→Ar)         | ✅ |
| L2 | Reverse mapping (Ar→En)           | ✅ |
| L3 | Compound character handling (`لا`) | ✅ |
| L6 | Detect Arabic in English context  | ✅ |
| L7 | Detect English in Arabic context  | ✅ |
| L8 | Single-character whitelist        | ✅ |
| L12 | Skip already-correct words       | ✅ |
| L16 | `<input type="text">` support    | ✅ |
| L17 | `<input type="search">` support  | ✅ |
| L18 | `<textarea>` support             | ✅ |
| L22 | Undo after auto-fix-all          | ✅ |
| L24 | Multi-level undo                 | ✅ |
| L27 | Pause/Resume extension           | ✅ |
| L28 | Cooldown per element             | ✅ |
| L29 | Concurrent correction guard      | ✅ |
| L15 | Basic duplicate prevention       | ✅ |
|---------------------------------------------------|

---

## Phase 1 — Easy Code Fixes (5 goals → score: 21/32, 66%)

### L5 — Number Conversion Control ❌
- **Problem:** Digits always convert (`123` → `۱۲۳`) even when unwanted.
- **Fix:** Only convert standalone digit-only words. Add user toggle later.

### L20 — More Input Types ❌
- **Problem:** `<input type="email/tel/url">` are completely ignored.
- **Fix:** Add `email`, `tel`, `url` to `isInputElement()`. Exclude `password`, `hidden`, `number`.

### L23 — Undo After Fix Current Word ❌
- **Problem:** `replaceWord()` doesn't save to `undoHistory`. Single-word fixes can't be undone.
- **Fix:** Push to `undoHistory` inside `replaceWord()` before making changes.

### L26 — Ctrl+Z Scoped to Corrected Element ❌
- **Problem:** Ctrl+Z hijacks native browser undo on ALL elements when undo history exists.
- **Fix:** Check if `document.activeElement` matches the last corrected element before `preventDefault()`.

### L32 — Error Handling on Restricted Pages ❌
- **Problem:** `chrome.runtime.onMessage` is not guarded — crashes on `chrome://` pages.
- **Fix:** Wrap in `try/catch` and check `chrome.runtime` exists before adding listener.

---

## Phase 2 — AI Integration (6 goals → score: 27/32, 84%)

### One AI API solves all 6:

### L4 — Uppercase Letter Handling ❌
- **Problem:** `toEn()` always returns lowercase. `"اهممخ"` → `"hello"` not `"Hello"`.
- **AI Fix:** AI applies correct capitalization — sentences, proper nouns, "I", acronyms.

### L9 — Skip URLs ❌
- **Problem:** `www.google.com` gets converted like normal text.
- **AI Fix:** AI recognizes URLs from context without regex patterns.

### L10 — Skip Emails ❌
- **Problem:** `user@email.com` gets converted.
- **AI Fix:** AI recognizes email patterns in context.

### L11 — Skip Code Patterns ❌
- **Problem:** `console.log`, `getElementById` get converted.
- **AI Fix:** AI knows what code looks like vs natural language.

### L13 — Mixed-Language Words ❌
- **Problem:** `"helloعربي"` gets garbled — whole word treated as one language.
- **AI Fix:** AI determines intent: "intentionally mixed" vs "keyboard mistake".

### L14 — Dictionary Validation ❌
- **Problem:** `"xyz"` → `"ءغظ"` (gibberish) is accepted because there's no dictionary.
- **AI Fix:** AI knows `"ءغظ"` is not a real Arabic word and rejects the conversion.

### AI also UPGRADES 3 existing goals:
- **L6** — Smarter Arabic detection (won't flag Arabic words on Arabic websites)
- **L7** — Smarter English detection (won't flag English words on English websites)
- **L8** — Replaces hardcoded whitelist with AI knowledge of all valid single-char words

### Architecture:
```
NEW FILE: ai-service.js
  → validateCorrection(originalWord, convertedWord, surroundingText)
  → Returns: { shouldConvert: true/false, suggestion: "Hello", confidence: 0.95 }

CHANGE in content.js (one line):
  BEFORE: if (converted !== trimmedWord && this.shouldAutoCorrect(...))
  AFTER:  if (converted !== trimmedWord && this.shouldAutoCorrect(...) && await this.aiValidate(...))
```

---

## Phase 3 — Architecture Fixes (5 goals → score: 32/32, 100%)

### L15 — Robust Duplicate Prevention ❌
- **Problem:** `replacedWords` Set auto-clears after 10 entries with arbitrary heuristic.
- **Fix:** Replace with TTL-based Map — each word gets individual 30-second expiry.

### L19 — ContentEditable Caret Detection ❌
- **Problem:** `selectionStart` doesn't exist on contentEditable. Caret always returns 0.
- **Fix:** Use `window.getSelection()` + `Range` API — the correct browser API for this.

### L21 — Rich Text Editor Support ❌
- **Problem:** Gmail compose, Google Docs, Notion — not supported.
- **Fix:** Handle iframe-based editors and shadow DOM contentEditable elements.

### L25 — Undo Survives Page Navigation ❌
- **Problem:** All undo history is lost on page reload (in-memory only).
- **Fix:** Use `chrome.storage.session` — survives navigation, clears on browser close.

### L30 — Clean State Machine ❌
- **Problem:** State scattered across 3 booleans (`pauseExtension`, `isCorrectingNow`, `correctionCooldown`).
- **Fix:** Implement formal state machine: `idle → scanning → highlighting → correcting → done`.

### L31 — Background Service Worker ❌
- **Problem:** No `background.js`. Each tab is isolated. No badge, no cross-tab coordination.
- **Fix:** Add service worker for badge counter, session storage, and tab coordination.

---

## 📊 Score Progression

| Phase | Action | Score | Percentage |
|---|---|---|---|
| Current | As-is | 16/32 | 50% |
| Phase 1 | 5 easy code fixes | 21/32 | 66% |
| Phase 2 | AI API integration | 27/32 | 84% |
| Phase 3 | Architecture fixes | 32/32 | 100% |


- L30/L31/ reveiw
- fix the shortcut when clikcing it in arbic it didnt work✅
- change the places of the notaification msg
- try to make the porcess of convrtion a bit faster (how can i compare the diff's btw the first version and the latest one (v3), in presentage %) 
- while i was typing in teams in a chat box spacificly, i used the extention and the notifications was says the word detected and corrected, but the words      didn't get converted?? - here is the element 

    <div id="new-message-3f3d693a-4b56-46c5-a407-4041ba2f9873" placeholder="Type a message" tabindex="0" data-tid="ckeditor" data-is-focusable="true" data-shortcut-context="compose-field" class="fui-Primitive ___1czdayc f1poobt0 f1cktdmf f13htf1t f1ubnyt4 f1couhl3 f1ahpp82 f11qra4b f6dzj5z f1p9o1ba fokg9q4 ck ck-content ck-editor__editable ck-rounded-corners ck-editor__editable_inline ck-blurred" lang="en" dir="ltr" role="textbox" contenteditable="true" data-tabster="{&quot;focusable&quot;:{&quot;isDefault&quot;:true}, &quot;observed&quot;:{&quot;names&quot;:[&quot;chat-input&quot;]}}" style="overflow:hidden;" spellcheck="false" aria-label="Type a message"><p data-placeholder="Type a message">sbl ugd;l</p></div>