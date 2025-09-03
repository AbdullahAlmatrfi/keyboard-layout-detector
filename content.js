// Initialize the detector without loading external libraries
const initializeDetector = () => {
  console.log('🚀 Modern Layout Detector starting...');
  new ModernLayoutDetector();
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
    
    // 🧠 Initialize Smart Statement Detection System
    this.smartDetector = new SmartStatementDetector(this);
    
    this.init();
  }

  async init() {
    // Initialize without external libraries
    
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
    console.log('🚀 Modern Layout Detector loaded!');
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
    
    // Pure CSS notification animation
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    notification.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 100);
    
    // Auto-hide with smooth animation
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
      console.log('🎹 DEBUG: Ctrl+Alt detected, triggering epic highlighting');
      const element = document.activeElement;
      console.log('🎹 DEBUG: Active element:', element, 'isInputElement:', this.isInputElement(element));
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
    
    // Epic progress bar animation with pure CSS - 70% FASTER!
    progressBar.style.transition = 'width 0.6s ease-in-out';
    progressBar.style.width = '100%';
    
    // Epic scan line animation - 70% FASTER!
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const paddingLeft = parseInt(style.paddingLeft) || 0;
    const paddingRight = parseInt(style.paddingRight) || 0;
    const textAreaWidth = rect.width - paddingLeft - paddingRight;
    
    scanLine.style.transition = 'transform 0.6s ease-in-out, opacity 0.6s ease-in-out';
    scanLine.style.opacity = '1';
    scanLine.style.transform = `translateX(${textAreaWidth}px)`;
    
    // Wait for scan animation to complete - 70% FASTER!
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
    
    // Phase 3: Epic Progressive Highlighting
    this.showNotification(`🎯 Found ${wrongWords.length} wrong word${wrongWords.length > 1 ? 's' : ''}. Deploying epic highlights...`, 'info');
    await this.epicHighlightWrongWords(element, wrongWords);
    
    // Phase 4: Show Preview - 70% FASTER!
    await this.delay(450);
    this.showNotification(`⚡ Ready to unleash corrections on ${wrongWords.length} word${wrongWords.length > 1 ? 's' : ''}...`, 'info');
    
    // Phase 5: Epic Corrections with Animation - 70% FASTER!
    await this.delay(240);
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
    console.log('🔍 DEBUG: findWrongWords called with text:', { text, elementType: element.tagName });
    if (!text) return [];
    
    // 🧠 SMART DETECTION: Check if we should process this text
    const smartAnalysis = this.smartDetector.analyzeTextStatement(text, element);
    if (!smartAnalysis.shouldProcess) {
      console.log(`🧠 Smart Detection: Skipping - ${smartAnalysis.reason}`);
      return [];
    }
    
    // 🧠 SMART DETECTION: Use smart corrections if available
    if (smartAnalysis.wrongWords && smartAnalysis.wrongWords.length > 0) {
      console.log(`🧠 Smart Detection: Using ${smartAnalysis.wrongWords.length} smart corrections`);
      // Mark as processed to prevent re-correction
      this.smartDetector.markAsProcessed(text, element, smartAnalysis.wrongWords);
      return smartAnalysis.wrongWords;
    }
    
    // Fallback to original detection method
    const words = text.split(/(\s+)/);
    console.log('🔍 DEBUG: Split words:', words);
    const wrongWords = [];
    let position = 0;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const trimmedWord = word.trim();
      
      if (trimmedWord.length >= 1) {
        const converted = this.convertText(trimmedWord);
        console.log('🔍 DEBUG: Converting word:', { trimmedWord, converted });
        
        if (converted !== trimmedWord && this.shouldAutoCorrect(trimmedWord, converted)) {
          const isArabic = this.hasArabic(trimmedWord);
          console.log('🔍 DEBUG: Found wrong word:', { trimmedWord, converted, isArabic });
          
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
    
    console.log('🔍 DEBUG: Final wrong words:', wrongWords);
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
    
    // Wait for animations to complete - 70% FASTER!
    await this.delay(240);
    
    // All animations are now handled by the unified system above
    // No need for additional highlight animations since we're using unified boxes
    
    // Wait for all animations to complete - 70% FASTER!
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
        // Pure CSS correction pulse animation - 70% FASTER!
        wordData.highlightElement.style.transition = 'all 0.12s ease';
        wordData.highlightElement.style.transform = 'scale(1.3)';
        
        await this.delay(60);
        
        // Success transformation - 70% FASTER!
        wordData.highlightElement.style.transition = 'all 0.15s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        wordData.highlightElement.style.backgroundColor = '#2ed573';
        wordData.highlightElement.style.transform = 'scale(1)';
        
        await this.delay(90);
      }
    }
    
    // Apply the actual text correction
    console.log('🔧 Applying corrections...', { originalText, correctedText });
    
    if (element.value !== undefined) {
      element.value = correctedText;
      // Trigger input event to notify of changes
      element.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (element.textContent !== undefined) {
      element.textContent = correctedText;
    } else if (element.innerHTML !== undefined) {
      element.innerHTML = correctedText;
    }
    
    // Focus the element to ensure changes are visible
    element.focus();
    
    console.log('✅ Text correction applied successfully!');
    
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
    
    // Epic cleanup animation with pure CSS - 70% FASTER!
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
    
    // Add to cooldown
    this.correctionCooldown.add(element);
    setTimeout(() => {
      this.correctionCooldown.delete(element);
    }, 3000);
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
    unifiedBox.style.background = 'linear-gradient(135deg, rgba(255, 107, 107, 0.2) 0%, rgba(238, 90, 82, 0.2) 100%)';
    unifiedBox.style.border = '2px solid rgba(255, 107, 107, 0.5)';
    unifiedBox.style.boxShadow = '0 4px 20px rgba(255, 107, 107, 0.2)';
    unifiedBox.style.backdropFilter = 'none';
    unifiedBox.style.webkitBackdropFilter = 'none';
    
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
    unifiedLabel.style.fontSize = '13px';
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
    const text = element.value || element.textContent || '';
    const isRTL = window.getComputedStyle(element).direction === 'rtl' || this.hasArabic(text);
    
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
    // Pure CSS animation without Anime.js
    highlight.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    highlight.style.opacity = '1';
    highlight.style.transform = 'scale(1)';
    highlight.classList.add('detected');
    
    setTimeout(() => {
      preview.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      preview.style.opacity = '1';
      preview.style.transform = preview.style.transform.replace('scale(0.5)', 'scale(1)');
    }, 300);
  }

  // 🎆 Animate unified highlight with EPIC effects
  animateUnifiedHighlight(unifiedBox, unifiedLabel) {
    // Pure CSS animation without Anime.js - 70% FASTER!
    unifiedBox.style.transition = 'all 0.24s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    unifiedBox.style.opacity = '1';
    unifiedBox.style.transform = 'scale(1)';
    unifiedBox.classList.add('detected');
    
    setTimeout(() => {
      unifiedLabel.style.transition = 'all 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      unifiedLabel.style.opacity = '1';
      unifiedLabel.style.transform = unifiedLabel.style.transform.replace('scale(0.5)', 'scale(1)');
    }, 120);
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

// 🧠 Smart Statement Detection Algorithm - Prevents Re-correction Issues
class SmartStatementDetector {
  constructor(layoutDetector) {
    this.layoutDetector = layoutDetector;
    this.wrongLayoutThreshold = 0.7; // 70% wrong = complete layout mistake
    this.correctedTexts = new Map(); // Track what we've already corrected
    this.textFingerprints = new Set(); // Prevent re-correction
    this.contextPatterns = {
      completelyWrong: /^[\u0600-\u06FF\s]{10,}$|^[a-zA-Z\s]{10,}$/,
      mixedContent: /[\u0600-\u06FF].*[a-zA-Z]|[a-zA-Z].*[\u0600-\u06FF]/,
      urls: /https?:\/\/|www\.|\.com|\.org|\.net|\.edu/i,
      emails: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
      code: /[{}();]|function|const|let|var|class|import|export/
    };
  }
  
  analyzeTextStatement(text, element) {
    // Create fingerprint to prevent re-processing same text
    const fingerprint = this.createTextFingerprint(text, element);
    if (this.textFingerprints.has(fingerprint)) {
      console.log('🔄 Smart Detection: Skipping already processed text');
      return { shouldProcess: false, reason: 'already_processed' };
    }
    
    // Skip if this was recently corrected
    if (this.wasRecentlyCorrected(text, element)) {
      console.log('⏭️ Smart Detection: Skipping recently corrected text');
      return { shouldProcess: false, reason: 'recently_corrected' };
    }
    
    // Skip if this is protected content
    if (this.isProtectedContent(text)) {
      return { shouldProcess: false, reason: 'protected_content' };
    }
    
    // 🔧 FIX: Quick check for completely valid text
    const trimmedText = text.trim();
    const isCompletelyEnglish = /^[a-zA-Z\s.,!?-]+$/.test(trimmedText);
    const isCompletelyArabic = /^[\u0600-\u06FF\u0750-\u077F\s.,!?-]+$/.test(trimmedText);
    
    if (isCompletelyEnglish || isCompletelyArabic) {
      console.log(`🧠 Smart Detection: Text is completely valid ${isCompletelyEnglish ? 'English' : 'Arabic'} - skipping`);
      return { shouldProcess: false, reason: 'completely_valid_text' };
    }
    
    const analysis = this.performDeepAnalysis(text);
    
    // Check for early exit based on analysis
    if (analysis.skipReason) {
      console.log(`🧠 Smart Detection: ${analysis.skipReason}`);
      return { shouldProcess: false, reason: analysis.skipReason };
    }
    
    // Decision logic
    if (analysis.isCompletelyWrong) {
      console.log(`🧠 Smart Detection: Complete layout mistake detected (${Math.round(analysis.confidence * 100)}% confidence)`);
      this.textFingerprints.add(fingerprint);
      return { 
        shouldProcess: true, 
        confidence: analysis.confidence,
        type: 'complete_correction',
        wrongWords: analysis.wrongWords
      };
    } else if (analysis.hasMixedErrors && analysis.errorRatio > 0.3) {
      console.log(`🧠 Smart Detection: Mixed errors detected (${Math.round(analysis.confidence * 100)}% confidence)`);
      return { 
        shouldProcess: true, 
        confidence: analysis.confidence * 0.7,
        type: 'selective_correction',
        wrongWords: analysis.wrongWords.slice(0, 5) // Limit to 5 words max
      };
    }
    
    return { shouldProcess: false, reason: 'low_confidence' };
  }
  
  performDeepAnalysis(text) {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const wrongWords = [];
    let arabicCount = 0;
    let englishCount = 0;
    let mixedCount = 0;
    let validWords = 0; // Track words that are already correct
    
    words.forEach((word, index) => {
      const cleanWord = word.replace(/[^\u0600-\u06FF\u0750-\u077Fa-zA-Z]/g, '');
      if (cleanWord.length < 2) return; // Skip very short words
      
      const converted = this.layoutDetector.convertText(cleanWord);
      const isWrong = converted !== cleanWord && this.layoutDetector.shouldAutoCorrect(cleanWord, converted);
      
      // 🔧 FIX: Check if word is already in correct language/format
      const isValidEnglish = /^[a-zA-Z]+$/.test(cleanWord) && cleanWord.length > 1;
      const isValidArabic = /^[\u0600-\u06FF\u0750-\u077F]+$/.test(cleanWord) && cleanWord.length > 1;
      
      if (isValidEnglish || isValidArabic) {
        validWords++;
      }
      
      if (isWrong) {
        const position = text.indexOf(word);
        wrongWords.push({
          original: cleanWord,
          converted: converted,
          start: position,
          end: position + word.length,
          isArabic: this.layoutDetector.hasArabic(cleanWord),
          wordIndex: index
        });
      }
      
      // Count language distribution
      if (this.layoutDetector.hasArabic(cleanWord)) arabicCount++;
      else if (/[a-zA-Z]/.test(cleanWord)) englishCount++;
      if (/[\u0600-\u06FF].*[a-zA-Z]|[a-zA-Z].*[\u0600-\u06FF]/.test(cleanWord)) mixedCount++;
    });
    
    const totalWords = words.length;
    const wrongRatio = wrongWords.length / totalWords;
    const validRatio = validWords / totalWords;
    const dominantLanguage = arabicCount > englishCount ? 'arabic' : 'english';
    
    // 🔧 FIX: If most words are already valid, don't process
    if (validRatio > 0.7) { // 70% of words are already correct
      console.log(`🧠 Smart Detection: Text is mostly valid (${Math.round(validRatio * 100)}% correct words)`);
      return {
        isCompletelyWrong: false,
        hasMixedErrors: false,
        errorRatio: 0,
        confidence: 0,
        wrongWords: [],
        dominantLanguage,
        skipReason: 'mostly_valid_text',
        statistics: {
          totalWords,
          wrongWords: 0,
          validWords,
          arabicWords: arabicCount,
          englishWords: englishCount,
          mixedWords: mixedCount
        }
      };
    }
    
    // Determine if completely wrong (entire text in wrong layout)
    const isCompletelyWrong = wrongRatio >= this.wrongLayoutThreshold && 
                              mixedCount < (totalWords * 0.2) && // Less than 20% mixed words
                              totalWords >= 3 && // Minimum 3 words for statement
                              validRatio < 0.3; // Less than 30% valid words
    
    return {
      isCompletelyWrong,
      hasMixedErrors: wrongWords.length > 0 && !isCompletelyWrong,
      errorRatio: wrongRatio,
      confidence: this.calculateConfidence(wrongRatio, dominantLanguage, mixedCount, totalWords, validRatio),
      wrongWords,
      dominantLanguage,
      statistics: {
        totalWords,
        wrongWords: wrongWords.length,
        validWords,
        arabicWords: arabicCount,
        englishWords: englishCount,
        mixedWords: mixedCount
      }
    };
  }
  
  calculateConfidence(wrongRatio, dominantLanguage, mixedCount, totalWords, validRatio = 0) {
    let confidence = wrongRatio; // Base confidence on error ratio
    
    // 🔧 FIX: Reduce confidence significantly if text has many valid words
    if (validRatio > 0.5) confidence *= (1 - validRatio); // Reduce confidence based on valid words
    
    // Boost confidence for clear patterns
    if (wrongRatio > 0.8) confidence += 0.15; // Very high error rate
    if (mixedCount === 0) confidence += 0.1;   // No mixed language words
    if (totalWords >= 5) confidence += 0.05;   // Longer statements more reliable
    
    // Reduce confidence for uncertain cases
    if (mixedCount > totalWords * 0.3) confidence -= 0.2; // Too much mixing
    if (totalWords < 3) confidence -= 0.3; // Too short to be reliable
    if (validRatio > 0.6) confidence -= 0.4; // Too many valid words
    
    return Math.min(0.95, Math.max(0.1, confidence));
  }
  
  createTextFingerprint(text, element) {
    // Create unique fingerprint based on text content and element
    const elementId = element.id || element.name || element.className || 'unknown';
    const textHash = btoa(text.substring(0, 100)).substring(0, 20); // First 100 chars
    return `${elementId}_${textHash}_${text.length}`;
  }
  
  isProtectedContent(text) {
    // Check against protection patterns
    for (const [type, pattern] of Object.entries(this.contextPatterns)) {
      if (type !== 'completelyWrong' && type !== 'mixedContent' && pattern.test(text)) {
        console.log(`🛡️ Smart Detection: Protected content detected: ${type}`);
        return true;
      }
    }
    return false;
  }
  
  markAsProcessed(text, element, corrections) {
    const elementKey = this.getElementKey(element);
    this.correctedTexts.set(elementKey, {
      originalText: text,
      correctedText: this.applyCorrections(text, corrections),
      timestamp: Date.now(),
      corrections: corrections
    });
    
    console.log(`📝 Smart Detection: Marked text as processed for element ${elementKey}`);
  }
  
  wasRecentlyCorrected(text, element) {
    const elementKey = this.getElementKey(element);
    const recent = this.correctedTexts.get(elementKey);
    
    if (!recent) return false;
    
    // Check if current text matches recently corrected text
    const timeDiff = Date.now() - recent.timestamp;
    const textSimilarity = this.calculateTextSimilarity(text, recent.correctedText);
    
    const isRecent = timeDiff < 5000 && textSimilarity > 0.8; // 5 seconds, 80% similar
    
    if (isRecent) {
      console.log(`⏰ Smart Detection: Text was recently corrected (${Math.round(timeDiff/1000)}s ago, ${Math.round(textSimilarity*100)}% similar)`);
    }
    
    return isRecent;
  }
  
  calculateTextSimilarity(text1, text2) {
    if (text1 === text2) return 1.0;
    
    const longer = text1.length > text2.length ? text1 : text2;
    const shorter = text1.length > text2.length ? text2 : text1;
    
    if (longer.length === 0) return 1.0;
    
    return (longer.length - this.levenshteinDistance(longer, shorter)) / longer.length;
  }
  
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  applyCorrections(text, corrections) {
    let correctedText = text;
    
    // Apply corrections from end to start to maintain positions
    const sortedCorrections = corrections.sort((a, b) => b.start - a.start);
    for (const correction of sortedCorrections) {
      correctedText = correctedText.substring(0, correction.start) +
                     correction.converted +
                     correctedText.substring(correction.end);
    }
    
    return correctedText;
  }
  
  getElementKey(element) {
    if (!element._smartDetectorId) {
      element._smartDetectorId = 'sd_' + Math.random().toString(36).substr(2, 9);
    }
    return element._smartDetectorId;
  }
}

// Start the EPIC extension
new ModernLayoutDetector();