// Fixed Arabic to English keyboard mapping
const arabicToEnglish = {
  'ض': 'q', 'ص': 'w', 'ث': 'e', 'ق': 'r', 'ف': 't', 'غ': 'y', 'ع': 'u', 'ه': 'i', 'خ': 'o', 'ح': 'p',
  'ج': '[', 'د': ']', 'ش': 'a', 'س': 's', 'ي': 'd', 'ب': 'f', 'ل': 'g', 'ا': 'h', 'ت': 'j', 'ن': 'k',
  'م': 'l', 'ك': ';', 'ط': "'", 'ئ': 'z', 'ء': 'x', 'ؤ': 'c', 'ر': 'v', 'لا': 'b', 'ى': 'n', 'ة': 'm',
  'و': ',', 'ز': '.', 'ظ': '/', 'ذ': '`', 'إ': 'Y', 'أ': 'T', 'آ': 'U'
};

// Fixed English to Arabic keyboard mapping  
const englishToArabic = {
  'q': 'ض', 'w': 'ص', 'e': 'ث', 'r': 'ق', 't': 'ف', 'y': 'غ', 'u': 'ع', 'i': 'ه', 'o': 'خ', 'p': 'ح',
  '[': 'ج', ']': 'د', 'a': 'ش', 's': 'س', 'd': 'ي', 'f': 'ب', 'g': 'ل', 'h': 'ا', 'j': 'ت', 'k': 'ن',
  'l': 'م', ';': 'ك', "'": 'ط', 'z': 'ئ', 'x': 'ء', 'c': 'ؤ', 'v': 'ر', 'b': 'لا', 'n': 'ى', 'm': 'ة',
  ',': 'و', '.': 'ز', '/': 'ظ', '`': 'ذ'
};

class LayoutDetector {
  constructor() {
    this.tooltip = null;
    this.currentElement = null;
    this.currentWordData = null;
    this.hideTimeout = null;
    this.isTooltipHovered = false;
    this.replacedWords = new Set();
    this.wordPosition = null; // Store word position
    this.init();
  }

  init() {
    this.createTooltip();
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
  }

  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'layout-tooltip';
    this.tooltip.style.display = 'none';
    
    this.tooltip.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.replaceWord();
    });
    
    this.tooltip.addEventListener('mouseenter', () => {
      this.isTooltipHovered = true;
      this.clearHideTimeout();
    });
    
    this.tooltip.addEventListener('mouseleave', () => {
      this.isTooltipHovered = false;
      this.scheduleHide();
    });
    
    document.body.appendChild(this.tooltip);
  }

  isInputElement(element) {
    const tag = element.tagName.toLowerCase();
    return (tag === 'input' && element.type === 'text') || 
           (tag === 'input' && element.type === 'search') || 
           tag === 'textarea' || 
           element.contentEditable === 'true';
  }

  hasArabic(text) {
    return /[\u0600-\u06FF]/.test(text);
  }

  convertText(text) {
    if (this.hasArabic(text)) {
      return text.split('').map(char => arabicToEnglish[char] || char).join('');
    } else {
      return text.split('').map(char => englishToArabic[char.toLowerCase()] || char).join('');
    }
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
    
    // Find start of word
    while (start > 0 && !/\s/.test(text[start - 1])) {
      start--;
    }
    
    // Find end of word  
    while (end < text.length && !/\s/.test(text[end])) {
      end++;
    }
    
    const word = text.substring(start, end);
    
    if (word.length >= 2) {
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
    // Calculate approximate position of word in the element
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const fontSize = parseInt(style.fontSize) || 14;
    const charWidth = fontSize * 0.6; // Approximate character width
    
    // Calculate word position
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
    }, 300);
  }

  handleMouseMove(event) {
    const element = event.target;
    
    this.clearHideTimeout();
    
    if (!this.isInputElement(element)) {
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
      
      // FIXED: Calculate position right above the word
      const wordPos = this.getWordPositionInElement(element, foundWord.start, foundWord.end);
      this.wordPosition = wordPos;
      
      this.showTooltipAboveWord(foundWord.converted, wordPos);
    } else {
      this.scheduleHide();
    }
  }

  handleMouseOut(event) {
    const element = event.target;
    const relatedTarget = event.relatedTarget;
    
    if (this.isInputElement(element)) {
      if (relatedTarget && (relatedTarget === this.tooltip || this.tooltip.contains(relatedTarget))) {
        return; // Don't hide when moving to tooltip
      }
      
      this.scheduleHide();
    }
  }

  showTooltipAboveWord(text, wordPos) {
    this.tooltip.textContent = `Click to change to: ${text}`;
    this.tooltip.style.display = 'block';
    
    // FIXED: Position tooltip right above the word
    const tooltipX = Math.max(10, Math.min(wordPos.x, window.innerWidth - 250));
    const tooltipY = Math.max(10, wordPos.y - 60); // 60px above the word
    
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

    // Hide tooltip after replacement
    this.hideTooltip();
    
    // Clean up
    setTimeout(() => {
      if (this.replacedWords.size > 10) {
        this.replacedWords.clear();
      }
    }, 5000);
  }
}

// Start the extension
new LayoutDetector();