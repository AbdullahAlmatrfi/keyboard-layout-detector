class ModernLayoutDetector {
  constructor() {
    this.undoButton = null;
    this.currentElement = null;
    this.currentWordData = null;
    this.undoHistory = [];
    this.isCorrectingNow = false;
    this.pauseExtension = false;
    this.toastEl = null;        // single persistent toast element
    this._toastHideTimer = null;

    // Dictionary sets for word validation (L14)
    this.dictEn = null; // Set of common English words
    this.dictAr = null; // Set of common Arabic words
    this.dictsLoaded = false;

    // Whitelists for valid single characters
    this.arabicSingleWords = new Set(['و']);
    this.englishSingleWords = new Set(['I', 'i', 'a', 'A']);

    this.init();
  }

  async init() {
    try {
      // Initialize without external libraries

      // Load dictionaries for word validation (L14)
      this.loadDictionaries();

      // Load pause setting from chrome.storage
      if (window.chrome && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['pauseExtension'], (data) => {
          this.pauseExtension = !!data.pauseExtension;
        });

        // Listen for storage changes
        chrome.storage.onChanged.addListener((changes, area) => {
          if (area === 'sync' && changes.pauseExtension) {
            this.pauseExtension = changes.pauseExtension.newValue;
          }
        });
      }

      // Listen for messages from popup (guarded for restricted pages)
      if (chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
          if (this.pauseExtension) {
            sendResponse({ success: false, message: 'Extension is paused' });
            return;
          }

          if (request.action === 'fixCurrentWord') {
            this.fixCurrentWord(sendResponse);
            return true; // Keep message channel open for async response
          } else if (request.action === 'autoFixAll') {
            this.autoFixAllWords(sendResponse);
            return true; // Keep message channel open for async response
          } else if (request.action === 'forceFixAll') {
            this.forceFixAllFromPopup(sendResponse);
            return true; // Keep message channel open for async response
          } else if (request.action === 'undo') {
            const success = this.undoLastCorrection();
            sendResponse({ success: success });
            return true;
          } else if (request.action === 'checkUndo') {
            sendResponse({ hasUndo: this.undoHistory.length > 0 });
            return true;
          }
        });
      }

      this.createUndoButton();
      // Use capture phase (true) so our shortcuts fire BEFORE sites like Gmail can block them
      document.addEventListener('keydown', this.handleKeydown.bind(this), true);
      console.log('🚀 Modern Layout Detector loaded!');
    } catch (e) {
      console.warn('⚠️ Layout Detector: init failed (likely a restricted page):', e.message);
    }
  }

  // ─── POPUP MESSAGE HANDLERS ───────────────────────────────────────

  // Fix current word at cursor position
  fixCurrentWord(sendResponse) {
    try {
      const element = document.activeElement;
      if (!this.isInputElement(element)) {
        sendResponse({ success: false, message: 'No input field is focused' });
        return;
      }

      const foundWord = this.getWordAtCaret(element);
      if (!foundWord) {
        sendResponse({ success: false, message: 'No word found at cursor' });
        return;
      }

      // Apply the word correction (Ctrl+Q is a manual override — always convert)
      this.currentElement = element;
      this.currentWordData = foundWord;
      this.replaceWord();

      this.showNotification(`✅ Fixed: "${foundWord.original}" → "${foundWord.converted}"`, 'success');
      sendResponse({ success: true, original: foundWord.original, converted: foundWord.converted });
    } catch (e) {
      console.warn('⚠️ Fix current word failed:', e.message);
      sendResponse({ success: false, message: 'An error occurred while fixing the word' });
    }
  }

  // Force fix all words from popup (bypass dictionary)
  async forceFixAllFromPopup(sendResponse) {
    const element = document.activeElement;
    if (!this.isInputElement(element)) {
      sendResponse({ success: false, message: 'No input field is focused' });
      return;
    }

    await this.forceFixAllWords(element);

    const convertibleWords = this.findAllConvertibleWords(element);
    sendResponse({ success: true, count: convertibleWords.length });
  }

  // Auto-fix all wrong words in the current input field
  async autoFixAllWords(sendResponse) {
    const element = document.activeElement;
    if (!this.isInputElement(element)) {
      sendResponse({ success: false, message: 'No input field is focused' });
      return;
    }

    // startEpicProgressiveHighlighting manages isCorrectingNow internally
    await this.startEpicProgressiveHighlighting(element);

    const wrongWords = this.findWrongWords(element);
    sendResponse({ success: true, count: wrongWords.length });
  }

  // ─── UI COMPONENTS ─────────────────────────────────────────────────

  createUndoButton() {
    this.undoButton = document.createElement('div');
    this.undoButton.className = 'undo-button';
    this.undoButton.innerHTML = `
      <span class="undo-icon">↶</span>
      <span class="undo-text">Undo</span>
    `;
    this.undoButton.style.display = 'none';

    this.undoButton.addEventListener('click', () => {
      this.undoLastCorrection();
    });

    document.body.appendChild(this.undoButton);
  }

  showNotification(message, type = 'info') {
    // Create the single toast element once
    if (!this.toastEl) {
      this.toastEl = document.createElement('div');
      this.toastEl.className = 'auto-correct-notification';
      this.toastEl.style.opacity = '0';
      document.body.appendChild(this.toastEl);
    }

    // Cancel any pending hide timer so previous message doesn't cut this one short
    if (this._toastHideTimer) {
      clearTimeout(this._toastHideTimer);
      this._toastHideTimer = null;
    }

    // Update content and type
    this.toastEl.textContent = message;
    this.toastEl.className = `auto-correct-notification ${type}`;

    // Position toast relative to the focused input:
    //   - enough space above  → appear above the input
    //   - input near top edge → appear below the input
    //   - no input detected   → viewport bottom-center fallback
    const el = document.activeElement;
    let inputRect = null;
    if (el && this.isInputElement(el)) {
      try { inputRect = el.getBoundingClientRect(); } catch (e) { /* cross-origin iframe */ }
    }

    // Always reset both top and bottom first to prevent simultaneous top+bottom stretch
    this.toastEl.style.top = '';
    this.toastEl.style.bottom = '';
    this.toastEl.style.height = 'auto';

    if (inputRect) {
      const centerX = Math.round(inputRect.left + inputRect.width / 2);
      this.toastEl.style.left = centerX + 'px';

      if (inputRect.top > 54) {
        // Enough space above — show above the input
        this.toastEl.style.top = Math.round(inputRect.top - 50) + 'px';
      } else {
        // Input is near the top (search bars) — show below it
        this.toastEl.style.top = Math.round(inputRect.bottom + 8) + 'px';
      }
    } else {
      // Fallback: viewport bottom-center
      this.toastEl.style.left = Math.round(window.innerWidth / 2) + 'px';
      this.toastEl.style.bottom = '24px';
    }

    // Animate in: start shifted down 8px, fade to final position
    this.toastEl.style.transition = 'none';
    this.toastEl.style.opacity = '0';
    this.toastEl.style.transform = 'translateX(-50%) translateY(8px)';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.toastEl.style.transition = 'opacity 0.25s ease, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        this.toastEl.style.opacity = '1';
        this.toastEl.style.transform = 'translateX(-50%) translateY(0)';
      });
    });

    // Auto-hide after 2.5s
    this._toastHideTimer = setTimeout(() => {
      if (this.toastEl) {
        this.toastEl.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        this.toastEl.style.opacity = '0';
        this.toastEl.style.transform = 'translateX(-50%) translateY(8px)';
      }
    }, 2500);
  }

  // ─── DICTIONARY & VALIDATION ───────────────────────────────────────

  shouldAutoCorrectSingleChar(char, isArabic) {
    if (isArabic) {
      return !this.arabicSingleWords.has(char);
    } else {
      return !this.englishSingleWords.has(char);
    }
  }

  // Load dictionary JSON files for word validation (L14)
  async loadDictionaries() {
    try {
      const [enRes, arRes] = await Promise.all([
        fetch(chrome.runtime.getURL('dict-en.json')),
        fetch(chrome.runtime.getURL('dict-ar.json'))
      ]);
      const enWords = await enRes.json();
      const arWords = await arRes.json();
      this.dictEn = new Set(enWords);
      this.dictAr = new Set(arWords);
      this.dictsLoaded = true;
      console.log(`📖 Dictionaries loaded: ${this.dictEn.size} EN, ${this.dictAr.size} AR`);
    } catch (e) {
      console.warn('⚠️ Dictionary load failed, skipping validation:', e.message);
      this.dictsLoaded = false;
    }
  }

  // Check if a converted word is a real word in the target language (L14)
  isRealWord(word) {
    // If dictionaries not loaded yet, allow all corrections (graceful fallback)
    if (!this.dictsLoaded) return true;

    // Single characters are handled by the whitelist, not the dictionary
    if (word.length === 1) return true;

    const lowerWord = word.toLowerCase();

    if (this.hasArabic(word)) {
      return this.dictAr.has(word);
    } else {
      return this.dictEn.has(lowerWord);
    }
  }

  // L9/L10: Skip URLs and emails from correction
  shouldSkipWord(word) {
    // URLs: http://, https://, ftp://, www.
    if (/^(https?:\/\/|ftp:\/\/|www\.)/i.test(word)) return true;

    // Emails: user@domain.com
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(word)) return true;

    // File paths: C:\folder, /usr/bin, ./file
    if (/^([a-zA-Z]:\\|\/|\.\/|\.\.\/)/i.test(word)) return true;

    return false;
  }

  shouldAutoCorrect(word, converted) {
    if (word === converted) return false;

    // L9/L10: Skip URLs, emails
    if (this.shouldSkipWord(word)) return false;

    // Skip pure-digit words — numbers are not keyboard layout mistakes
    if (/^\d+$/.test(word)) return false;

    if (word.length === 1) {
      const isArabic = this.hasArabic(word);
      return this.shouldAutoCorrectSingleChar(word, isArabic);
    }

    // L14: Don't convert words already correct in their current language
    if (this.isRealWord(word)) {
      return false;
    }

    // L14: Dictionary validation — only correct if converted result is a real word
    if (!this.isRealWord(converted)) {
      return false;
    }

    return word.length >= 2;
  }

  // ─── KEYBOARD SHORTCUTS ────────────────────────────────────────────

  handleKeydown(event) {
    if (this.pauseExtension) return;

    // Ctrl+Z for undo — only intercept if focused on the corrected element
    // event.code used (not event.key) so shortcuts fire regardless of OS keyboard language (Arabic/English)
    if ((event.ctrlKey || event.metaKey) && event.code === 'KeyZ' && !event.shiftKey) {
      const lastEntry = this.undoHistory[this.undoHistory.length - 1];
      if (lastEntry && document.activeElement === lastEntry.element) {
        event.preventDefault();
        this.undoLastCorrection();
      }
      return;
    }

    // Ctrl+Alt for Epic Auto-Fix All
    if (event.ctrlKey && event.altKey && !event.shiftKey && !event.metaKey) {
      const element = document.activeElement;
      if (this.isInputElement(element)) {
        event.preventDefault();
        this.startEpicProgressiveHighlighting(element);
      }
      return;
    }

    // Ctrl+Shift+Q for Force Fix All Words (bypass dictionary)
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.code === 'KeyQ') {
      const element = document.activeElement;
      if (this.isInputElement(element)) {
        event.preventDefault();
        this.forceFixAllWords(element);
      }
      return;
    }

    // Ctrl+Q for Fix Current Word
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.code === 'KeyQ') {
      const element = document.activeElement;
      if (this.isInputElement(element)) {
        event.preventDefault();
        this.fixCurrentWord((response) => {
          if (!response.success) {
            this.showNotification(`❌ ${response.message}`, 'warning');
          }
        });
      }
      return;
    }
  }

  // ─── SCANNING & CORRECTION FLOWS ──────────────────────────────────

  // Smart auto-fix: scan → highlight → correct all wrong words
  async startEpicProgressiveHighlighting(element) {
    if (this.isCorrectingNow) {
      this.showNotification('⏳ Please wait, correction in progress...', 'warning');
      return;
    }

    this.isCorrectingNow = true;

    try {
      // Phase 1: Scanning Animation
      const progressBar = this.createEpicScanProgressBar();
      const scanLine = this.createEpicScanLine(element);

      progressBar.style.transition = 'width 0.6s ease-in-out';
      progressBar.style.width = '100%';
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const paddingLeft = parseInt(style.paddingLeft) || 0;
      const paddingRight = parseInt(style.paddingRight) || 0;
      const textAreaWidth = rect.width - paddingLeft - paddingRight;

      scanLine.style.transition = 'transform 0.6s ease-in-out, opacity 0.6s ease-in-out';
      scanLine.style.opacity = '1';
      scanLine.style.transform = `translateX(${textAreaWidth}px)`;

      await this.delay(660);

      // Remove scanning elements
      document.body.removeChild(progressBar);
      document.body.removeChild(scanLine);

      // Phase 2: Find Wrong Words
      const wrongWords = this.findWrongWords(element);

      if (wrongWords.length === 0) {
        this.showNotification('✅ No wrong words found! Text looks perfect.', 'success');
        this.isCorrectingNow = false;
        return;
      }

      // Phase 3: Highlight + Correct
      await this.epicHighlightWrongWords(element, wrongWords);
      await this.delay(450);
      await this.delay(240);
      await this.applyEpicCorrectionsWithAnimation(element, wrongWords);
    } catch (e) {
      console.warn('⚠️ Auto-fix failed:', e.message);
      this.showNotification('❌ Something went wrong. Please try again.', 'warning');
    } finally {
      this.isCorrectingNow = false;
    }
  }

  createEpicScanProgressBar() {
    const progressBar = document.createElement('div');
    progressBar.className = 'scan-progress';
    progressBar.style.width = '0%';
    document.body.appendChild(progressBar);
    return progressBar;
  }

  createEpicScanLine(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const paddingLeft = parseInt(style.paddingLeft) || 0;
    const paddingTop = parseInt(style.paddingTop) || 0;
    const paddingBottom = parseInt(style.paddingBottom) || 0;

    const scanLine = document.createElement('div');
    scanLine.className = 'scan-line';
    scanLine.style.position = 'fixed';
    scanLine.style.top = (rect.top + paddingTop) + 'px';
    scanLine.style.height = (rect.height - paddingTop - paddingBottom) + 'px';
    scanLine.style.left = (rect.left + paddingLeft) + 'px';
    scanLine.style.width = '2px';
    scanLine.style.opacity = '0';

    document.body.appendChild(scanLine);
    return scanLine;
  }

  findWrongWords(element) {
    const text = element.value || element.textContent || '';
    if (!text) return [];

    const words = text.split(/(\s+)/);
    const wrongWords = [];
    let position = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const trimmedWord = word.trim();

      if (trimmedWord.length >= 1) {
        const converted = this.convertText(trimmedWord);

        if (converted !== trimmedWord && this.shouldAutoCorrect(trimmedWord, converted)) {
          const isArabic = this.hasArabic(trimmedWord);

          wrongWords.push({
            original: trimmedWord,
            converted: converted,
            start: position,
            end: position + word.length,
            isArabic: isArabic,
            wordIndex: i
          });
        }
      }

      position += word.length;
    }

    return wrongWords;
  }

  // Find ALL convertible words, bypassing dictionary validation (for Ctrl+Shift+Q force fix)
  findAllConvertibleWords(element) {
    const text = element.value || element.textContent || '';
    if (!text) return [];

    const words = text.split(/(\s+)/);
    const convertibleWords = [];
    let position = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const trimmedWord = word.trim();

      if (trimmedWord.length >= 1) {
        // Skip pure-digit words — numbers are never layout mistakes
        if (/^\d+$/.test(trimmedWord)) {
          position += word.length;
          continue;
        }

        // Skip URLs, emails, file paths
        if (this.shouldSkipWord(trimmedWord)) {
          position += word.length;
          continue;
        }

        // Skip single chars protected by whitelist (i, a, I, A, و)
        if (trimmedWord.length === 1) {
          const isArabic = this.hasArabic(trimmedWord);
          if (!this.shouldAutoCorrectSingleChar(trimmedWord, isArabic)) {
            position += word.length;
            continue;
          }
        }

        // Skip words that are already correct in their language
        if (this.isRealWord(trimmedWord)) {
          position += word.length;
          continue;
        }

        let converted = this.convertText(trimmedWord);
        // Also try with numbers included (like manual Ctrl+Q)
        if (converted === trimmedWord) {
          converted = this.convertText(trimmedWord, true);
        }

        // Force convert — no dictionary check, just needs a valid layout conversion
        if (converted !== trimmedWord) {
          const isArabic = this.hasArabic(trimmedWord);
          convertibleWords.push({
            original: trimmedWord,
            converted: converted,
            start: position,
            end: position + word.length,
            isArabic: isArabic,
            wordIndex: i
          });
        }
      }

      position += word.length;
    }

    return convertibleWords;
  }

  // Force fix all words — Ctrl+Shift+Q (bypasses dictionary)
  async forceFixAllWords(element) {
    if (this.isCorrectingNow) {
      this.showNotification('⏳ Please wait, correction in progress...', 'warning');
      return;
    }

    this.isCorrectingNow = true;

    try {
      // Phase 1: Scanning animation
      const progressBar = this.createEpicScanProgressBar();
      const scanLine = this.createEpicScanLine(element);

      progressBar.style.transition = 'width 0.6s ease-in-out';
      progressBar.style.width = '100%';

      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const paddingLeft = parseInt(style.paddingLeft) || 0;
      const paddingRight = parseInt(style.paddingRight) || 0;
      const textAreaWidth = rect.width - paddingLeft - paddingRight;

      scanLine.style.transition = 'transform 0.6s ease-in-out, opacity 0.6s ease-in-out';
      scanLine.style.opacity = '1';
      scanLine.style.transform = `translateX(${textAreaWidth}px)`;

      await this.delay(660);

      document.body.removeChild(progressBar);
      document.body.removeChild(scanLine);

      // Phase 2: Find ALL convertible words (no dictionary filter)
      const convertibleWords = this.findAllConvertibleWords(element);

      if (convertibleWords.length === 0) {
        this.showNotification('✅ No convertible words found.', 'success');
        this.isCorrectingNow = false;
        return;
      }

      // Phase 3: Highlight + Correct
      await this.epicHighlightWrongWords(element, convertibleWords);
      await this.delay(450);
      await this.delay(240);
      await this.applyEpicCorrectionsWithAnimation(element, convertibleWords);
    } catch (e) {
      console.warn('⚠️ Force fix failed:', e.message);
      this.showNotification('❌ Something went wrong. Please try again.', 'warning');
    } finally {
      this.isCorrectingNow = false;
    }
  }

  // EPIC highlighting with perfect positioning
  async epicHighlightWrongWords(element, wrongWords) {
    if (wrongWords.length === 0) return;

    if (wrongWords.length === 1) {
      // Single word: highlight the word, show converted text in toast
      const wordData = wrongWords[0];
      const wordPosition = this.getPreciseWordPosition(element, wordData.start, wordData.end);

      const highlight = document.createElement('div');
      highlight.className = `wrong-word-highlight ${wordData.isArabic ? 'arabic' : 'english'}`;
      highlight.style.left = wordPosition.x + 'px';
      highlight.style.top = wordPosition.y + 'px';
      highlight.style.width = wordPosition.width + 'px';
      highlight.style.height = wordPosition.height + 'px';
      highlight.style.borderRadius = '4px';
      highlight.style.opacity = '0';
      highlight.style.transform = 'scale(0.5)';

      document.body.appendChild(highlight);

      wordData.highlightElement = highlight;
      wordData.previewElement = null; // preview is shown via toast

      this.showNotification(`→ ${wordData.converted}`, 'info');
      this.animateSingleHighlight(highlight);

    } else {
      // Multiple words: one unified highlight box + toast listing all conversions
      const unifiedBox = this.createUnifiedHighlightBox(wrongWords, element);
      document.body.appendChild(unifiedBox);

      wrongWords.forEach(wordData => {
        wordData.highlightElement = unifiedBox;
        wordData.previewElement = null; // preview is shown via toast
      });

      const previews = wrongWords.map(w => w.converted).join(' · ');
      this.showNotification(`→ ${previews}`, 'info');
      this.animateUnifiedHighlight(unifiedBox);
    }

    await this.delay(240);

    // Wait for highlight animations to settle
    await this.delay(wrongWords.length * 60 + 240);
  }

  // Precise word positioning using canvas text measurement
  getPreciseWordPosition(element, start, end) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const fontSize = parseInt(style.fontSize) || 14;
    const lineHeight = parseInt(style.lineHeight) || fontSize * 1.2;
    const paddingLeft = parseInt(style.paddingLeft) || 0;
    const paddingTop = parseInt(style.paddingTop) || 0;
    const paddingRight = parseInt(style.paddingRight) || 0;

    // Get text before the word to calculate offset
    const text = element.value || element.textContent || '';
    const textBefore = text.substring(0, start);
    const word = text.substring(start, end);

    // Check if text direction is RTL using only the element's CSS direction
    const isRTL = style.direction === 'rtl';

    // Measure text width using canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

    const textBeforeWidth = ctx.measureText(textBefore).width;
    const wordWidth = ctx.measureText(word).width;

    let wordX;
    if (isRTL) {
      // For RTL, position from right side
      const totalTextWidth = ctx.measureText(text).width;
      const elementWidth = rect.width - paddingLeft - paddingRight;
      wordX = rect.left + paddingLeft + (elementWidth - totalTextWidth) + textBeforeWidth;
    } else {
      // For LTR, position from left side
      wordX = rect.left + paddingLeft + textBeforeWidth;
    }

    return {
      x: wordX,
      y: rect.top + paddingTop,
      width: wordWidth,
      height: lineHeight
    };
  }

  // ─── TEXT REPLACEMENT & UNDO ───────────────────────────────────────

  async applyEpicCorrectionsWithAnimation(element, wrongWords) {
    // Apply corrections to text
    const originalText = element.value || element.textContent || '';
    let correctedText = originalText;

    // Apply corrections from end to start to maintain positions
    for (let i = wrongWords.length - 1; i >= 0; i--) {
      const wordData = wrongWords[i];
      correctedText = correctedText.substring(0, wordData.start) +
        wordData.converted +
        correctedText.substring(wordData.end);
    }

    // Epic correction animation sequence
    for (let i = 0; i < wrongWords.length; i++) {
      const wordData = wrongWords[i];

      if (wordData.highlightElement) {
        wordData.highlightElement.style.transition = 'all 0.12s ease';
        wordData.highlightElement.style.transform = 'scale(1.3)';

        await this.delay(60);

        wordData.highlightElement.style.transition = 'all 0.15s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        wordData.highlightElement.style.backgroundColor = '#2ed573';
        wordData.highlightElement.style.transform = 'scale(1)';

        await this.delay(90);
      }
    }

    // Apply the actual text correction
    this.writeToElement(element, correctedText);

    // Focus the element to ensure changes are visible
    element.focus();

    // Save to history
    this.undoHistory.push({
      element: element,
      originalText: originalText,
      correctedText: correctedText,
      corrections: wrongWords.map(w => ({
        original: w.original,
        converted: w.converted
      })),
      timestamp: Date.now()
    });

    // Cleanup: fade out highlights
    wrongWords.forEach((wordData, i) => {
      setTimeout(() => {
        if (wordData.highlightElement) {
          wordData.highlightElement.style.transition = 'all 0.18s cubic-bezier(0.55, 0.055, 0.675, 0.19)';
          wordData.highlightElement.style.opacity = '0';
          wordData.highlightElement.style.transform = 'scale(0.5)';
        }
        if (wordData.previewElement) {
          wordData.previewElement.style.transition = 'all 0.18s cubic-bezier(0.55, 0.055, 0.675, 0.19)';
          wordData.previewElement.style.opacity = '0';
          wordData.previewElement.style.transform = 'scale(0.5)';
        }
      }, i * 30);
    });

    setTimeout(() => {
      wrongWords.forEach(wordData => {
        if (wordData.highlightElement && document.body.contains(wordData.highlightElement)) {
          document.body.removeChild(wordData.highlightElement);
        }
        if (wordData.previewElement && document.body.contains(wordData.previewElement)) {
          document.body.removeChild(wordData.previewElement);
        }
      });
    }, 300);

    // Epic success notification
    const count = wrongWords.length;
    const arabicCount = wrongWords.filter(w => w.isArabic).length;
    const englishCount = count - arabicCount;

    let message = `🎉 EPIC SUCCESS! Corrected ${count} word${count > 1 ? 's' : ''}!`;
    if (arabicCount > 0 && englishCount > 0) {
      message += ` (${arabicCount} Arabic, ${englishCount} English)`;
    }

    this.showNotification(message, 'success');

    // Show undo button with epic animation
    this.showEpicUndoButton();

    // Reset state
    this.isCorrectingNow = false;
  }

  showEpicUndoButton() {
    this.undoButton.style.display = 'block';

    // Epic undo button entrance with pure CSS
    this.undoButton.style.opacity = '0';
    this.undoButton.style.transform = 'scale(0.5) rotate(0deg)';
    this.undoButton.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

    setTimeout(() => {
      this.undoButton.style.opacity = '1';
      this.undoButton.style.transform = 'scale(1) rotate(360deg)';
    }, 100);

    // Auto-hide with epic animation
    setTimeout(() => {
      this.undoButton.style.transition = 'all 0.6s cubic-bezier(0.55, 0.055, 0.675, 0.19)';
      this.undoButton.style.opacity = '0';
      this.undoButton.style.transform = 'scale(0.5) rotate(-180deg)';
      setTimeout(() => {
        this.undoButton.style.display = 'none';
        this.undoButton.style.transform = 'scale(1) rotate(0deg)';
      }, 600);
    }, 10000);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  undoLastCorrection() {
    if (this.undoHistory.length === 0) return false;

    const lastAction = this.undoHistory.pop();
    const element = lastAction.element;

    if (element && document.contains(element)) {
      this.isCorrectingNow = true;

      this.writeToElement(element, lastAction.originalText);

      element.focus();
      this.showNotification('↶ Correction undone with epic style!', 'info');

      setTimeout(() => {
        this.isCorrectingNow = false;
      }, 100);

      return true;
    }

    if (this.undoHistory.length === 0) {
      this.undoButton.style.display = 'none';
    }

    return false;
  }

  // ─── HIGHLIGHT BOX CREATION ────────────────────────────────────────

  // Create ONE UNIFIED highlight box covering ALL wrong words
  createUnifiedHighlightBox(wrongWords, element) {
    const positions = wrongWords.map(word =>
      this.getPreciseWordPosition(element, word.start, word.end)
    );

    // Calculate unified box dimensions covering ALL words
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x + p.width));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y + p.height));

    const unifiedBox = document.createElement('div');
    unifiedBox.className = 'wrong-word-highlight unified-highlight';
    unifiedBox.style.left = (minX - 8) + 'px'; // Extra padding
    unifiedBox.style.top = (minY - 4) + 'px';
    unifiedBox.style.width = (maxX - minX + 16) + 'px';
    unifiedBox.style.height = (maxY - minY + 8) + 'px';
    unifiedBox.style.borderRadius = '8px';
    unifiedBox.style.opacity = '0';
    unifiedBox.style.transform = 'scale(0.5)';
    unifiedBox.style.background = 'linear-gradient(135deg, rgba(255, 107, 107, 0.2) 0%, rgba(238, 90, 82, 0.2) 100%)';
    unifiedBox.style.border = '2px solid rgba(255, 107, 107, 0.5)';
    unifiedBox.style.boxShadow = '0 4px 20px rgba(255, 107, 107, 0.2)';
    unifiedBox.style.backdropFilter = 'none';
    unifiedBox.style.webkitBackdropFilter = 'none';

    return unifiedBox;
  }

  // ─── ANIMATION HELPERS ────────────────────────────────────────────

  // Animate single word highlight
  animateSingleHighlight(highlight) {
    highlight.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    highlight.style.opacity = '1';
    highlight.style.transform = 'scale(1)';
    highlight.classList.add('detected');
  }

  // 🎆 Animate unified highlight with EPIC effects
  animateUnifiedHighlight(unifiedBox) {
    unifiedBox.style.transition = 'all 0.24s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    unifiedBox.style.opacity = '1';
    unifiedBox.style.transform = 'scale(1)';
    unifiedBox.classList.add('detected');
  }

  // ─── UTILITIES ─────────────────────────────────────────────────────

  isInputElement(element) {
    const tag = element.tagName.toLowerCase();
    const allowedInputTypes = new Set(['text', 'search', 'email', 'tel', 'url']);
    return (tag === 'input' && allowedInputTypes.has(element.type)) ||
      tag === 'textarea' ||
      element.contentEditable === 'true';
  }

  hasArabic(text) {
    return window.faLayout ? window.faLayout.hasPersian(text) : /[\u0600-\u06FF]/.test(text);
  }

  convertText(text, includeNumbers = false) {
    if (!window.faLayout) {
      return text;
    }

    if (this.hasArabic(text)) {
      const asB  = window.faLayout.toEnB(text);
      const asGH = window.faLayout.toEn(text);

      if (asB  !== text && this.isRealWord(asB))  return asB;
      if (asGH !== text && this.isRealWord(asGH)) return asGH;
      return asB !== text ? asB : asGH;
    } else if (window.faLayout.hasEnglish(text) || (includeNumbers && /\d/.test(text))) {
      return window.faLayout.fromEn(text, includeNumbers);
    }

    return text;
  }

  // Write text to any supported element type.
  // For plain input/textarea: set .value directly.
  // For contentEditable (CKEditor, Teams, Notion, etc.): use execCommand('insertText')
  // so the host framework's event listeners fire and the change sticks.
  writeToElement(element, text) {
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      element.value = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (element.contentEditable === 'true') {
      element.focus();
      // Select all existing content then replace via insertText.
      // execCommand fires proper InputEvent that frameworks like CKEditor intercept.
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('insertText', false, text);
    }
  }

  getCaretPosition(element) {
    // For input/textarea — use selectionStart
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      return element.selectionStart || 0;
    }

    // For contentEditable — use window.getSelection()
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      // Calculate offset relative to the element's full text
      const preRange = document.createRange();
      preRange.selectNodeContents(element);
      preRange.setEnd(range.startContainer, range.startOffset);
      return preRange.toString().length;
    }

    return 0;
  }

  getWordAtCaret(element) {
    const text = element.value || element.textContent || '';
    if (!text) return null;

    const caretPos = this.getCaretPosition(element);

    let start = caretPos;
    let end = caretPos;

    while (start > 0 && !/\s/.test(text[start - 1])) {
      start--;
    }

    while (end < text.length && !/\s/.test(text[end])) {
      end++;
    }

    const word = text.substring(start, end);

    if (word.length >= 1) {
      let converted = this.convertText(word);
      // If no layout conversion found, try including numbers (for manual Ctrl+Q)
      if (converted === word) {
        converted = this.convertText(word, true);
      }
      // Ctrl+Q is a manual override — convert any word, no dictionary check, no replacedWords gate
      if (converted !== word) {
        return {
          original: word,
          converted: converted,
          start: start,
          end: end,
          key: `${start}-${word}`
        };
      }
    }

    return null;
  }

  replaceWord() {
    if (!this.currentElement || !this.currentWordData) return;

    const element = this.currentElement;
    const wordData = this.currentWordData;

    // Save to undo history before making changes
    const originalText = element.value || element.textContent || '';
    this.undoHistory.push({
      element: element,
      originalText: originalText,
      correctedText: null, // will be set after replacement
      corrections: [{ original: wordData.original, converted: wordData.converted }],
      timestamp: Date.now()
    });

    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      const text = element.value;
      const newText = text.substring(0, wordData.start) +
        wordData.converted +
        text.substring(wordData.end);
      element.value = newText;

      // Dispatch input event so browser updates cursor tracking
      element.dispatchEvent(new Event('input', { bubbles: true }));

      element.focus();
      element.setSelectionRange(wordData.start + wordData.converted.length,
        wordData.start + wordData.converted.length);
    } else if (element.contentEditable === 'true') {
      const text = element.textContent;
      const newText = text.substring(0, wordData.start) +
        wordData.converted +
        text.substring(wordData.end);
      this.writeToElement(element, newText);
    }

  }
}

// Start the EPIC extension
new ModernLayoutDetector();