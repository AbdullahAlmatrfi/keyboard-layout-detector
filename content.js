// Load libraries dynamically with fallback
const loadLibraries = () => {
  return new Promise((resolve) => {
    let loadedCount = 0;
    const totalLibraries = 2;
    
    const checkComplete = () => {
      loadedCount++;
      if (loadedCount >= totalLibraries) {
        resolve();
      }
    };
    
    // Load Anime.js for smooth animations
    if (!window.anime) {
      const animeScript = document.createElement('script');
      animeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js';
      animeScript.onload = checkComplete;
      animeScript.onerror = checkComplete; // Continue even if fails
      document.head.appendChild(animeScript);
    } else {
      checkComplete();
    }

    // Load Floating UI for perfect positioning
    if (!window.FloatingUIDOM) {
      const floatingScript = document.createElement('script');
      floatingScript.src = 'https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.5.3/dist/floating-ui.dom.umd.min.js';
      floatingScript.onload = checkComplete;
      floatingScript.onerror = checkComplete; // Continue even if fails
      document.head.appendChild(floatingScript);
    } else {
      checkComplete();
    }
  });
};

class ModernLayoutDetector {
  constructor() {
    this.tooltip = null;
    this.toggleButton = null;
    this.undoButton = null;
    this.currentElement = null;
    this.currentWordData = null;
    this.hideTimeout = null;
    this.isTooltipHovered = false;
    this.replacedWords = new Set();
    this.wordPosition = null;
    this.hoverReplaceTimeout = null;
    this.autoCorrectMode = false;
    this.undoHistory = [];
    this.isCorrectingNow = false;
    this.lastCorrectedText = new Map();
    this.correctionCooldown = new Set();
    
    // Whitelists for valid single characters
    this.arabicSingleWords = new Set(['و', 'ا', 'ب', 'ل', 'ف', 'ك', 'م', 'ن', 'ه', 'ي', 'ت', 'ر', 'ع', 'ح']);
    this.englishSingleWords = new Set(['I', 'a', 'A']);
    
    this.init();
  }

  async init() {
    await loadLibraries();
    this.createToggleButton();
    this.createTooltip();
    this.createUndoButton();
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
    document.addEventListener('keydown', this.handleKeydown.bind(this));
    console.log('🚀 Modern Layout Detector loaded with libraries!');
  }

  createToggleButton() {
    this.toggleButton = document.createElement('div');
    this.toggleButton.className = 'auto-correct-toggle';
    this.toggleButton.innerHTML = `
      <div class="toggle-content">
        <span class="toggle-icon">⚡</span>
        <span class="toggle-text">Auto-Fix</span>
        <div class="toggle-switch">
          <div class="toggle-slider"></div>
        </div>
      </div>
    `;
    this.toggleButton.style.display = 'none';

    this.toggleButton.addEventListener('click', () => {
      this.toggleAutoCorrect();
    });

    document.body.appendChild(this.toggleButton);
  }

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

  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'layout-tooltip';
    this.tooltip.style.display = 'none';

    this.tooltip.addEventListener('mouseenter', () => {
      this.isTooltipHovered = true;
      this.clearHideTimeout();
      
      if (!this.autoCorrectMode) {
        this.hoverReplaceTimeout = setTimeout(() => {
          this.replaceWord();
        }, 1500);
      }
    });

    this.tooltip.addEventListener('mouseleave', () => {
      this.isTooltipHovered = false;
      this.scheduleHide();
      
      if (this.hoverReplaceTimeout) {
        clearTimeout(this.hoverReplaceTimeout);
        this.hoverReplaceTimeout = null;
      }
    });

    this.tooltip.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (this.hoverReplaceTimeout) {
        clearTimeout(this.hoverReplaceTimeout);
        this.hoverReplaceTimeout = null;
      }
      
      this.replaceWord();
    });

    document.body.appendChild(this.tooltip);
  }

  toggleAutoCorrect() {
    this.autoCorrectMode = !this.autoCorrectMode;
    
    const slider = this.toggleButton.querySelector('.toggle-slider');
    const toggleText = this.toggleButton.querySelector('.toggle-text');
    
    if (this.autoCorrectMode) {
      this.toggleButton.classList.add('active');
      
      // Smooth slider animation with Anime.js or fallback
      if (window.anime) {
        anime({
          targets: slider,
          translateX: 20,
          duration: 300,
          easing: 'easeOutCubic'
        });
      } else {
        slider.style.transform = 'translateX(20px)';
        slider.style.transition = 'transform 0.3s ease';
      }
      
      toggleText.textContent = 'Auto-Fix ON';
      this.showNotification('🚀 Auto-correction enabled! Press Ctrl+Shift for epic scanning animation.', 'success');
    } else {
      this.toggleButton.classList.remove('active');
      
      // Smooth slider animation or fallback
      if (window.anime) {
        anime({
          targets: slider,
          translateX: 0,
          duration: 300,
          easing: 'easeOutCubic'
        });
      } else {
        slider.style.transform = 'translateX(0px)';
        slider.style.transition = 'transform 0.3s ease';
      }
      
      toggleText.textContent = 'Auto-Fix OFF';
      this.showNotification('Auto-correction disabled. Click words manually to fix.', 'info');
      
      this.lastCorrectedText.clear();
      this.correctionCooldown.clear();
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `auto-correct-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Smooth notification animation with Anime.js or fallback
    if (window.anime) {
      anime({
        targets: notification,
        opacity: [0, 1],
        translateY: [-20, 0],
        duration: 400,
        easing: 'easeOutBack'
      });
      
      // Auto-hide with smooth animation
      setTimeout(() => {
        anime({
          targets: notification,
          opacity: 0,
          translateY: -20,
          duration: 300,
          easing: 'easeInCubic',
          complete: () => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification);
            }
          }
        });
      }, 3000);
    } else {
      // Fallback CSS animation
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      notification.style.transition = 'all 0.4s ease';
      
      setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
      }, 100);
      
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, 3000);
    }
  }

  shouldAutoCorrectSingleChar(char, isArabic) {
    if (isArabic) {
      return !this.arabicSingleWords.has(char);
    } else {
      return !this.englishSingleWords.has(char);
    }
  }

  shouldAutoCorrect(word, converted) {
    if (word === converted) return false;
    
    if (word.length === 1) {
      const isArabic = this.hasArabic(word);
      return this.shouldAutoCorrectSingleChar(word, isArabic);
    }
    
    return word.length >= 2;
  }

  handleKeydown(event) {
    // Ctrl+Z for undo
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      if (this.undoHistory.length > 0) {
        event.preventDefault();
        this.undoLastCorrection();
      }
      return;
    }
    
    // Ctrl+Shift for Epic Progressive Highlighting Animation
    if (event.ctrlKey && event.shiftKey && !event.altKey && !event.metaKey) {
      const element = document.activeElement;
      if (this.isInputElement(element)) {
        event.preventDefault();
        
        if (this.autoCorrectMode) {
          this.startEpicProgressiveHighlighting(element);
        } else {
          this.showNotification('⚠️ Auto-correction is disabled. Enable it first by clicking the toggle button.', 'warning');
        }
      }
      return;
    }
  }

  // 🎬 EPIC PROGRESSIVE HIGHLIGHTING WITH ANIME.JS 🎬
  async startEpicProgressiveHighlighting(element) {
    if (this.isCorrectingNow) {
      this.showNotification('⏳ Please wait, correction in progress...', 'warning');
      return;
    }
    
    if (this.correctionCooldown.has(element)) {
      this.showNotification('⏳ This field was recently corrected. Please wait a moment.', 'warning');
      return;
    }
    
    this.isCorrectingNow = true;
    
    // Phase 1: Epic Scanning Animation
    this.showNotification('🔍 Initiating epic scan sequence...', 'info');
    
    const progressBar = this.createEpicScanProgressBar();
    const scanLine = this.createEpicScanLine(element);
    
    // Epic progress bar animation
    if (window.anime) {
      anime({
        targets: progressBar,
        width: '100%',
        duration: 2000,
        easing: 'easeInOutQuad'
      });
    } else {
      progressBar.style.transition = 'width 2s ease-in-out';
      progressBar.style.width = '100%';
    }
    
    // Epic scan line animation
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const paddingLeft = parseInt(style.paddingLeft) || 0;
    const paddingRight = parseInt(style.paddingRight) || 0;
    const textAreaWidth = rect.width - paddingLeft - paddingRight;
    
    if (window.anime) {
      anime({
        targets: scanLine,
        translateX: textAreaWidth,
        opacity: [0, 1, 1, 0],
        duration: 2000,
        easing: 'easeInOutQuad'
      });
    } else {
      scanLine.style.transition = 'transform 2s ease-in-out, opacity 2s ease-in-out';
      scanLine.style.opacity = '1';
      scanLine.style.transform = `translateX(${textAreaWidth}px)`;
    }
    
    // Wait for scan animation to complete
    await this.delay(2200);
    
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
    
    // Phase 3: Epic Progressive Highlighting
    this.showNotification(`🎯 Found ${wrongWords.length} wrong word${wrongWords.length > 1 ? 's' : ''}. Deploying epic highlights...`, 'info');
    await this.epicHighlightWrongWords(element, wrongWords);
    
    // Phase 4: Show Preview
    await this.delay(1500);
    this.showNotification(`⚡ Ready to unleash corrections on ${wrongWords.length} word${wrongWords.length > 1 ? 's' : ''}...`, 'info');
    
    // Phase 5: Epic Corrections with Animation
    await this.delay(800);
    await this.applyEpicCorrectionsWithAnimation(element, wrongWords);
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

  // EPIC highlighting with perfect positioning
  async epicHighlightWrongWords(element, wrongWords) {
    const highlights = [];
    
    // Create all highlights first
    for (let i = 0; i < wrongWords.length; i++) {
      const wordData = wrongWords[i];
      
      // Get precise word position using canvas measurement
      const wordPosition = this.getPreciseWordPosition(element, wordData.start, wordData.end);
      
      // Create highlight element
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
      
      // Create preview text
      const preview = document.createElement('div');
      preview.className = 'word-preview';
      preview.textContent = wordData.converted;
      preview.style.opacity = '0';
      preview.style.transform = 'scale(0.5)';
      preview.style.left = (wordPosition.x + wordPosition.width/2) + 'px';
      preview.style.top = (wordPosition.y - 35) + 'px';
      preview.style.transform += ' translateX(-50%)';
      
      document.body.appendChild(preview);
      
      // Store references
      wordData.highlightElement = highlight;
      wordData.previewElement = preview;
      highlights.push({ highlight, preview, wordData });
    }
    
    // Epic staggered animation with Anime.js or fallback
    if (window.anime) {
      anime({
        targets: highlights.map(h => h.highlight),
        opacity: [0, 1],
        scale: [0.5, 1.1, 1],
        duration: 600,
        delay: anime.stagger(200),
        easing: 'easeOutElastic(1, .8)',
        complete: () => {
          highlights.forEach(h => h.highlight.classList.add('detected'));
        }
      });
      
      // Animate preview text
      anime({
        targets: highlights.map(h => h.preview),
        opacity: [0, 1],
        scale: [0.5, 1],
        duration: 400,
        delay: anime.stagger(200, { start: 300 }),
        easing: 'easeOutBack'
      });
    } else {
      // Fallback CSS animation
      highlights.forEach((h, i) => {
        setTimeout(() => {
          h.highlight.style.transition = 'all 0.6s ease';
          h.highlight.style.opacity = '1';
          h.highlight.style.transform = 'scale(1)';
          h.highlight.classList.add('detected');
          
          h.preview.style.transition = 'all 0.4s ease';
          h.preview.style.opacity = '1';
          h.preview.style.transform = h.preview.style.transform.replace('scale(0.5)', 'scale(1)');
        }, i * 200);
      });
    }
    
    // Wait for all animations to complete
    await this.delay(wrongWords.length * 200 + 800);
  }

  // Precise word positioning using canvas text measurement
  getPreciseWordPosition(element, start, end) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const fontSize = parseInt(style.fontSize) || 14;
    const lineHeight = parseInt(style.lineHeight) || fontSize * 1.2;
    const paddingLeft = parseInt(style.paddingLeft) || 0;
    const paddingTop = parseInt(style.paddingTop) || 0;
    
    // Get text before the word to calculate offset
    const text = element.value || element.textContent || '';
    const textBefore = text.substring(0, start);
    const word = text.substring(start, end);
    
    // Measure text width using canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    
    const textBeforeWidth = ctx.measureText(textBefore).width;
    const wordWidth = ctx.measureText(word).width;
    
    return {
      x: rect.left + paddingLeft + textBeforeWidth,
      y: rect.top + paddingTop,
      width: wordWidth,
      height: lineHeight
    };
  }

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
        if (window.anime) {
          // Correction pulse animation
          anime({
            targets: wordData.highlightElement,
            scale: [1, 1.3, 1],
            duration: 400,
            easing: 'easeInOutQuad'
          });
          
          await this.delay(200);
          
          // Success transformation
          anime({
            targets: wordData.highlightElement,
            backgroundColor: [
              wordData.isArabic ? '#ff6b6b' : '#667eea',
              '#2ed573'
            ],
            scale: [1, 1.2, 1],
            duration: 500,
            easing: 'easeOutElastic(1, .6)'
          });
        } else {
          // Fallback animation
          wordData.highlightElement.style.transition = 'all 0.4s ease';
          wordData.highlightElement.style.transform = 'scale(1.3)';
          
          setTimeout(() => {
            wordData.highlightElement.style.backgroundColor = '#2ed573';
            wordData.highlightElement.style.transform = 'scale(1)';
          }, 200);
        }
        
        await this.delay(300);
      }
    }
    
    // Apply the actual text correction
    if (element.value !== undefined) {
      element.value = correctedText;
    } else if (element.textContent !== undefined) {
      element.textContent = correctedText;
    }
    
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
    
    // Epic cleanup animation
    if (window.anime) {
      anime({
        targets: wrongWords.map(w => w.highlightElement).filter(Boolean),
        opacity: 0,
        scale: 0.5,
        duration: 600,
        delay: anime.stagger(100),
        easing: 'easeInBack',
        complete: () => {
          wrongWords.forEach(wordData => {
            if (wordData.highlightElement && document.body.contains(wordData.highlightElement)) {
              document.body.removeChild(wordData.highlightElement);
            }
            if (wordData.previewElement && document.body.contains(wordData.previewElement)) {
              document.body.removeChild(wordData.previewElement);
            }
          });
        }
      });
    } else {
      // Fallback cleanup
      wrongWords.forEach((wordData, i) => {
        setTimeout(() => {
          if (wordData.highlightElement) {
            wordData.highlightElement.style.transition = 'all 0.6s ease';
            wordData.highlightElement.style.opacity = '0';
            wordData.highlightElement.style.transform = 'scale(0.5)';
          }
          if (wordData.previewElement) {
            wordData.previewElement.style.transition = 'all 0.6s ease';
            wordData.previewElement.style.opacity = '0';
            wordData.previewElement.style.transform = 'scale(0.5)';
          }
        }, i * 100);
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
      }, 1000);
    }
    
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
    
    // Add to cooldown
    this.correctionCooldown.add(element);
    setTimeout(() => {
      this.correctionCooldown.delete(element);
    }, 3000);
  }

  showEpicUndoButton() {
    this.undoButton.style.display = 'block';
    
    if (window.anime) {
      // Epic undo button entrance
      anime({
        targets: this.undoButton,
        opacity: [0, 1],
        scale: [0.5, 1.2, 1],
        rotate: [0, 360],
        duration: 800,
        easing: 'easeOutElastic(1, .8)'
      });
      
      // Auto-hide with epic animation
      setTimeout(() => {
        anime({
          targets: this.undoButton,
          opacity: 0,
          scale: 0.5,
          rotate: -180,
          duration: 600,
          easing: 'easeInBack',
          complete: () => {
            this.undoButton.style.display = 'none';
          }
        });
      }, 10000);
    } else {
      // Fallback animation
      this.undoButton.style.opacity = '0';
      this.undoButton.style.transform = 'scale(0.5)';
      this.undoButton.style.transition = 'all 0.8s ease';
      
      setTimeout(() => {
        this.undoButton.style.opacity = '1';
        this.undoButton.style.transform = 'scale(1)';
      }, 100);
      
      setTimeout(() => {
        this.undoButton.style.opacity = '0';
        this.undoButton.style.transform = 'scale(0.5)';
        setTimeout(() => {
          this.undoButton.style.display = 'none';
        }, 600);
      }, 10000);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getElementKey(element) {
    if (!element._layoutDetectorId) {
      element._layoutDetectorId = 'ld_' + Math.random().toString(36).substr(2, 9);
    }
    return element._layoutDetectorId;
  }

  undoLastCorrection() {
    if (this.undoHistory.length === 0) return;
    
    const lastAction = this.undoHistory.pop();
    const element = lastAction.element;
    
    if (element && document.contains(element)) {
      this.isCorrectingNow = true;
      
      if (element.value !== undefined) {
        element.value = lastAction.originalText;
      } else if (element.textContent !== undefined) {
        element.textContent = lastAction.originalText;
      }
      
      const elementKey = this.getElementKey(element);
      this.lastCorrectedText.set(elementKey, lastAction.originalText);
      
      element.focus();
      this.showNotification('↶ Correction undone with epic style!', 'info');
      
      setTimeout(() => {
        this.isCorrectingNow = false;
      }, 100);
    }
    
    if (this.undoHistory.length === 0) {
      this.undoButton.style.display = 'none';
    }
  }

  isInputElement(element) {
    const tag = element.tagName.toLowerCase();
    return (tag === 'input' && element.type === 'text') ||
      (tag === 'input' && element.type === 'search') ||
      tag === 'textarea' ||
      element.contentEditable === 'true';
  }

  hasArabic(text) {
    return window.faLayout ? window.faLayout.hasPersian(text) : /[\u0600-\u06FF]/.test(text);
  }

  convertText(text) {
    if (!window.faLayout) {
      return text;
    }

    if (this.hasArabic(text)) {
      return window.faLayout.toEn(text);
    } else if (window.faLayout.hasEnglish(text)) {
      return window.faLayout.fromEn(text);
    }

    return text;
  }

  getCaretPosition(element) {
    if (element.selectionStart !== undefined) {
      return element.selectionStart;
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
      const converted = this.convertText(word);
      if (converted !== word) {
        const wordKey = `${start}-${word}`;

        if (!this.replacedWords.has(wordKey)) {
          return {
            original: word,
            converted: converted,
            start: start,
            end: end,
            key: wordKey
          };
        }
      }
    }

    return null;
  }

  getWordPositionInElement(element, wordStart, wordEnd) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const fontSize = parseInt(style.fontSize) || 14;
    const charWidth = fontSize * 0.6;

    const wordX = rect.left + (wordStart * charWidth);
    const wordY = rect.top;

    return {
      x: wordX,
      y: wordY,
      width: (wordEnd - wordStart) * charWidth,
      height: rect.height
    };
  }

  clearHideTimeout() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  scheduleHide() {
    this.clearHideTimeout();

    this.hideTimeout = setTimeout(() => {
      if (!this.isTooltipHovered) {
        this.hideTooltip();
      }
    }, 50);
  }

  handleMouseMove(event) {
    const element = event.target;

    if (this.isInputElement(element)) {
      this.showToggleButton(element);
    } else {
      this.hideToggleButton();
    }

    this.clearHideTimeout();

    if (!this.isInputElement(element) || this.autoCorrectMode) {
      this.scheduleHide();
      return;
    }

    if (document.activeElement !== element) {
      this.scheduleHide();
      return;
    }

    const foundWord = this.getWordAtCaret(element);

    if (foundWord) {
      this.currentElement = element;
      this.currentWordData = foundWord;

      const wordPos = this.getWordPositionInElement(element, foundWord.start, foundWord.end);
      this.wordPosition = wordPos;

      this.showTooltipAboveWord(foundWord.converted, wordPos);
    } else {
      this.scheduleHide();
    }
  }

  showToggleButton(element) {
    const rect = element.getBoundingClientRect();
    
    this.toggleButton.style.display = 'block';
    this.toggleButton.style.left = (rect.right - 120) + 'px';
    this.toggleButton.style.top = (rect.top - 45) + 'px';
  }

  hideToggleButton() {
    setTimeout(() => {
      if (!this.toggleButton.matches(':hover')) {
        this.toggleButton.style.display = 'none';
      }
    }, 100);
  }

  handleMouseOut(event) {
    const element = event.target;
    const relatedTarget = event.relatedTarget;

    if (this.isInputElement(element)) {
      if (relatedTarget && (relatedTarget === this.tooltip || this.tooltip.contains(relatedTarget))) {
        return;
      }

      this.scheduleHide();
    }
  }

  showTooltipAboveWord(text, wordPos) {
    const word = this.currentWordData.original;
    
    if (this.autoCorrectMode) {
      if (word.length === 1) {
        const isArabic = this.hasArabic(word);
        const isWhitelisted = isArabic ? this.arabicSingleWords.has(word) : this.englishSingleWords.has(word);
        
        if (isWhitelisted) {
          this.tooltip.textContent = `"${word}" is valid - Press Ctrl+Shift for EPIC scan & fix, or click to convert "${word}" to "${text}"`;
        } else {
          this.tooltip.textContent = `Press Ctrl+Shift for EPIC scan & fix, or click to convert "${word}" to "${text}"`;
        }
      } else {
        this.tooltip.textContent = `Press Ctrl+Shift for EPIC scan & fix, or click to convert "${word}" to "${text}"`;
      }
    } else {
      this.tooltip.textContent = `Click to change to: ${text}`;
    }
    
    this.tooltip.style.display = 'block';

    const tooltipX = Math.max(10, Math.min(wordPos.x, window.innerWidth - 400));
    const tooltipY = Math.max(10, wordPos.y - 60);

    this.tooltip.style.left = tooltipX + 'px';
    this.tooltip.style.top = tooltipY + 'px';
    this.tooltip.style.position = 'fixed';
  }

  hideTooltip() {
    this.tooltip.style.display = 'none';
    this.currentElement = null;
    this.currentWordData = null;
    this.isTooltipHovered = false;
    this.wordPosition = null;
    this.clearHideTimeout();
    
    if (this.hoverReplaceTimeout) {
      clearTimeout(this.hoverReplaceTimeout);
      this.hoverReplaceTimeout = null;
    }
  }

  replaceWord() {
    if (!this.currentElement || !this.currentWordData) return;

    const element = this.currentElement;
    const wordData = this.currentWordData;

    this.replacedWords.add(wordData.key);

    if (element.value !== undefined) {
      const text = element.value;
      const newText = text.substring(0, wordData.start) +
        wordData.converted +
        text.substring(wordData.end);
      element.value = newText;

      element.focus();
      element.setSelectionRange(wordData.start + wordData.converted.length,
        wordData.start + wordData.converted.length);
    } else if (element.textContent !== undefined) {
      const text = element.textContent;
      const newText = text.substring(0, wordData.start) +
        wordData.converted +
        text.substring(wordData.end);
      element.textContent = newText;
      element.focus();
    }

    this.hideTooltip();

    setTimeout(() => {
      if (this.replacedWords.size > 10) {
        this.replacedWords.clear();
      }
    }, 5000);
  }
}

// Start the EPIC extension
new ModernLayoutDetector();