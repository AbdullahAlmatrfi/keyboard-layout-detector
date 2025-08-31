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
    this.undoButton = null;
    this.currentElement = null;
    this.currentWordData = null;
    this.replacedWords = new Set();
    this.undoHistory = [];
    this.isCorrectingNow = false;
    this.lastCorrectedText = new Map();
    this.correctionCooldown = new Set();
    this.pauseExtension = false;
    
    // Whitelists for valid single characters
    this.arabicSingleWords = new Set(['و', 'ا', 'ب', 'ل', 'ف', 'ك', 'م', 'ن', 'ه', 'ي', 'ت', 'ر', 'ع', 'ح']);
    this.englishSingleWords = new Set(['I', 'a', 'A']);
    
    this.init();
  }

  async init() {
    await loadLibraries();
    
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
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (this.pauseExtension) {
        sendResponse({success: false, message: 'Extension is paused'});
        return;
      }
      
      if (request.action === 'fixCurrentWord') {
        this.fixCurrentWord(sendResponse);
        return true; // Keep message channel open for async response
      } else if (request.action === 'autoFixAll') {
        this.autoFixAllWords(sendResponse);
        return true; // Keep message channel open for async response
      } else if (request.action === 'undo') {
        const success = this.undoLastCorrection();
        sendResponse({success: success});
        return true;
      } else if (request.action === 'checkUndo') {
        sendResponse({hasUndo: this.undoHistory.length > 0});
        return true;
      }
    });
    
    this.createUndoButton();
    document.addEventListener('keydown', this.handleKeydown.bind(this));
    console.log('🚀 Modern Layout Detector loaded with libraries!');
  }

  // Fix current word at cursor position
  fixCurrentWord(sendResponse) {
    const element = document.activeElement;
    if (!this.isInputElement(element)) {
      sendResponse({success: false, message: 'No input field is focused'});
      return;
    }
    
    const foundWord = this.getWordAtCaret(element);
    if (!foundWord) {
      sendResponse({success: false, message: 'No word found at cursor'});
      return;
    }
    
    // Apply the word correction
    this.currentElement = element;
    this.currentWordData = foundWord;
    this.replaceWord();
    
    this.showNotification(`✅ Fixed: "${foundWord.original}" → "${foundWord.converted}"`, 'success');
    sendResponse({success: true, original: foundWord.original, converted: foundWord.converted});
  }
  
  // Auto-fix all wrong words in the current input field
  async autoFixAllWords(sendResponse) {
    const element = document.activeElement;
    if (!this.isInputElement(element)) {
      sendResponse({success: false, message: 'No input field is focused'});
      return;
    }
    
    if (this.isCorrectingNow) {
      sendResponse({success: false, message: 'Correction already in progress'});
      return;
    }
    
    this.isCorrectingNow = true;
    
    // Start the EPIC animation sequence
    await this.startEpicProgressiveHighlighting(element);
    
    this.isCorrectingNow = false;
    
    // Get the final count for response
    const wrongWords = this.findWrongWords(element);
    sendResponse({success: true, count: wrongWords.length});
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
    if (this.pauseExtension) return;
    
    // Ctrl+Z for undo
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      if (this.undoHistory.length > 0) {
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
    
    // Ctrl+Q for Fix Current Word
    if ((event.ctrlKey || event.metaKey) && event.key === 'q') {
      const element = document.activeElement;
      if (this.isInputElement(element)) {
        event.preventDefault();
        this.fixCurrentWord(() => {});
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
    if (wrongWords.length === 0) return;
    
    if (wrongWords.length === 1) {
      // 🎯 SINGLE WORD: Keep original individual process
      const wordData = wrongWords[0];
      const wordPosition = this.getPreciseWordPosition(element, wordData.start, wordData.end);
      
      // Create individual highlight
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
      
      // Create individual preview
      const preview = document.createElement('div');
      preview.className = 'word-preview';
      preview.textContent = wordData.converted;
      preview.style.opacity = '0';
      preview.style.transform = 'scale(0.5)';
      
      // Position preview above word
      const text = element.value || element.textContent || '';
      const isRTL = window.getComputedStyle(element).direction === 'rtl' || this.hasArabic(text);
      
      if (isRTL) {
        preview.style.left = (wordPosition.x + wordPosition.width) + 'px';
        preview.style.top = (wordPosition.y - 35) + 'px';
        preview.style.transform += ' translateX(-100%)';
      } else {
        preview.style.left = (wordPosition.x + wordPosition.width/2) + 'px';
        preview.style.top = (wordPosition.y - 35) + 'px';
        preview.style.transform += ' translateX(-50%)';
      }
      
      document.body.appendChild(preview);
      
      wordData.highlightElement = highlight;
      wordData.previewElement = preview;
      
      this.animateSingleHighlight(highlight, preview);
      
    } else {
      // 🎆 MULTIPLE WORDS: ONE UNIFIED BOX FOR ALL WORDS!
      const unifiedBox = this.createUnifiedHighlightBox(wrongWords, element);
      const unifiedLabel = this.createUnifiedPreviewLabel(wrongWords, element);
      
      document.body.appendChild(unifiedBox);
      document.body.appendChild(unifiedLabel);
      
      // Store references for all words
      wrongWords.forEach(wordData => {
        wordData.highlightElement = unifiedBox;
        wordData.previewElement = unifiedLabel;
      });
      
      this.animateUnifiedHighlight(unifiedBox, unifiedLabel);
    }
    
    // Wait for animations to complete
    await this.delay(800);
    
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
    const paddingRight = parseInt(style.paddingRight) || 0;
    
    // Get text before the word to calculate offset
    const text = element.value || element.textContent || '';
    const textBefore = text.substring(0, start);
    const word = text.substring(start, end);
    
    // Check if text direction is RTL
    const isRTL = style.direction === 'rtl' || this.hasArabic(text);
    
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
    if (this.undoHistory.length === 0) return false;
    
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
      
      return true;
    }
    
    if (this.undoHistory.length === 0) {
      this.undoButton.style.display = 'none';
    }
    
    return false;
  }

  // � Create ONE UNIFIED highlight box covering ALL wrong words
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
    unifiedBox.style.background = 'linear-gradient(135deg, rgba(255, 107, 107, 0.08) 0%, rgba(238, 90, 82, 0.08) 100%)';
    unifiedBox.style.border = '2px solid rgba(255, 107, 107, 0.5)';
    unifiedBox.style.boxShadow = '0 4px 20px rgba(255, 107, 107, 0.2)';
    unifiedBox.style.backdropFilter = 'blur(1px)';
    unifiedBox.style.webkitBackdropFilter = 'blur(1px)';
    
    return unifiedBox;
  }

  // 🎆 Create ONE UNIFIED preview label showing ALL corrections
  createUnifiedPreviewLabel(wrongWords, element) {
    const positions = wrongWords.map(word => 
      this.getPreciseWordPosition(element, word.start, word.end)
    );
    
    // Calculate center position for the unified label
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x + p.width));
    const minY = Math.min(...positions.map(p => p.y));
    
    const centerX = (minX + maxX) / 2;
    
    // Create unified text showing ALL corrections
    const corrections = wrongWords.map(word => word.converted);
    const unifiedText = `Corrected words: ${corrections.join(', ')}`;
    
    const unifiedLabel = document.createElement('div');
    unifiedLabel.className = 'word-preview unified-preview';
    unifiedLabel.innerHTML = unifiedText;
    unifiedLabel.style.opacity = '0';
    unifiedLabel.style.transform = 'scale(0.5)';
    unifiedLabel.style.fontSize = '10px';
    unifiedLabel.style.maxWidth = '600px';
    unifiedLabel.style.padding = '12px 20px';
    unifiedLabel.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    unifiedLabel.style.border = '3px solid rgba(255,255,255,0.4)';
    unifiedLabel.style.boxShadow = '0 12px 50px rgba(0,0,0,0.5)';
    unifiedLabel.style.borderRadius = '12px';
    unifiedLabel.style.fontWeight = '700';
    unifiedLabel.style.backdropFilter = 'blur(10px)';
    unifiedLabel.style.webkitBackdropFilter = 'blur(10px)';
    
    // Position above the text area, not above the words
    const elementRect = element.getBoundingClientRect();
    
    if (isRTL) {
      unifiedLabel.style.left = (elementRect.right - 20) + 'px';
      unifiedLabel.style.top = (elementRect.top - 60) + 'px';
      unifiedLabel.style.transform += ' translateX(-100%)';
    } else {
      unifiedLabel.style.left = (elementRect.left + elementRect.width/2) + 'px';
      unifiedLabel.style.top = (elementRect.top - 60) + 'px';
      unifiedLabel.style.transform += ' translateX(-50%)';
    }
    
    return unifiedLabel;
  }

  // 🎆 Animate single word highlight
  animateSingleHighlight(highlight, preview) {
    if (window.anime) {
      anime({
        targets: highlight,
        opacity: [0, 1],
        scale: [0.5, 1.1, 1],
        duration: 600,
        easing: 'easeOutElastic(1, .8)',
        complete: () => highlight.classList.add('detected')
      });
      
      anime({
        targets: preview,
        opacity: [0, 1],
        scale: [0.5, 1],
        duration: 400,
        delay: 300,
        easing: 'easeOutBack'
      });
    } else {
      highlight.style.transition = 'all 0.6s ease';
      highlight.style.opacity = '1';
      highlight.style.transform = 'scale(1)';
      preview.style.transition = 'all 0.4s ease';
      preview.style.opacity = '1';
      preview.style.transform = preview.style.transform.replace('scale(0.5)', 'scale(1)');
    }
  }

  // 🎆 Animate unified highlight with EPIC effects
  animateUnifiedHighlight(unifiedBox, unifiedLabel) {
    if (window.anime) {
      anime({
        targets: unifiedBox,
        opacity: [0, 1],
        scale: [0.3, 1.2, 1],
        duration: 800,
        easing: 'easeOutElastic(1, .6)',
        complete: () => unifiedBox.classList.add('detected')
      });
      
      anime({
        targets: unifiedLabel,
        opacity: [0, 1],
        scale: [0.3, 1.1, 1],
        duration: 600,
        delay: 400,
        easing: 'easeOutBack'
      });
    } else {
      unifiedBox.style.transition = 'all 0.8s ease';
      unifiedBox.style.opacity = '1';
      unifiedBox.style.transform = 'scale(1)';
      setTimeout(() => {
        unifiedLabel.style.transition = 'all 0.6s ease';
        unifiedLabel.style.opacity = '1';
        unifiedLabel.style.transform = unifiedLabel.style.transform.replace('scale(0.5)', 'scale(1)');
      }, 400);
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

    setTimeout(() => {
      if (this.replacedWords.size > 10) {
        this.replacedWords.clear();
      }
    }, 5000);
  }
}

// Start the EPIC extension
new ModernLayoutDetector();