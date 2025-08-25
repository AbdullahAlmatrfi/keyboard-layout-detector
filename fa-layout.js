// Arabic keyboard layout mappings for accurate conversion
// Based on standard Arabic QWERTY keyboard layout

const faLayoutMap = {
    // English to Arabic mappings - Standard Arabic QWERTY layout
    "q": "ض", "w": "ص", "e": "ث", "r": "ق", "t": "ف", "y": "غ", "u": "ع",
    "i": "ه", "o": "خ", "p": "ح", "a": "ش", "s": "س", "d": "ي", "f": "ب",
    "g": "ل", "h": "ا", "j": "ت", "k": "ن", "l": "م", "z": "ئ", "x": "ء",
    "c": "ؤ", "v": "ر", "b": "لا", "n": "ى", "m": "ة", ",": "و", ".": "ز",
    "/": "ظ", ";": "ك", "'": "ط", "`": "ذ", "[": "ج", "]": "د",

    // Numbers
    "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴",
    "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹",

    // Special characters
    "!": "!", "@": "٬", "#": "٫", "$": "﷼", "%": "٪", "^": "×", "&": "،",
    "*": "*", "(": ")", ")": "(", "-": "-", "_": "ـ", "=": "=", "+": "+",
    "\\": "\\", "|": "|", "?": "؟", "<": ">", ">": "<", ":": ":", "\"": "\""
};

// Create reverse mapping (Arabic to English)
const enLayoutMap = {};
for (const [en, ar] of Object.entries(faLayoutMap)) {
    enLayoutMap[ar] = en;
}

// Explicit mappings for correct character conversion
enLayoutMap["ي"] = "d";   // ي maps back to d
enLayoutMap["ب"] = "f";   // ب maps back to f
enLayoutMap["لا"] = "b";  // لا maps back to b

// Arabic layout converter object
const faLayout = {
    // Convert English text to Arabic (like typing English on Arabic keyboard)
    fromEn: function (text) {
        return text.split('').map(char => {
            const lowerChar = char.toLowerCase();
            if (faLayoutMap[lowerChar]) {
                return faLayoutMap[lowerChar];
            }
            return char; // Return unchanged if no mapping found
        }).join('');
    },

    // Convert Arabic text to English (like typing Arabic on English keyboard)
    toEn: function (text) {
        // First, handle compound characters like لا
        let processedText = text.replace(/لا/g, 'b');

        // Then process remaining characters individually
        return processedText.split('').map(char => {
            if (enLayoutMap[char]) {
                return enLayoutMap[char];
            }
            return char; // Return unchanged if no mapping found
        }).join('');
    },

    // Check if text contains Arabic characters
    hasPersian: function (text) {
        return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
    },

    // Check if text contains English characters that could be converted
    hasEnglish: function (text) {
        return /[a-zA-Z0-9]/.test(text);
    }
};

// Make faLayout available globally for the content script
window.faLayout = faLayout;
