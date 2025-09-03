// Quick debug test for Smart Detection
console.log('🧪 Testing Smart Detection Logic...');

// Simulate the extension loading
if (typeof window !== 'undefined') {
    // Test the Smart Detection algorithm
    console.log('✅ Extension environment detected');
    
    // Add test listener
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🎯 DOM ready - looking for extension...');
        
        // Check if extension content script is loaded
        setTimeout(() => {
            if (window.keyboardLayoutDetector) {
                console.log('✅ Extension detected and loaded!');
                
                // Test Smart Detection
                const detector = window.keyboardLayoutDetector;
                if (detector.smartDetector) {
                    console.log('✅ Smart Detection system found!');
                } else {
                    console.log('❌ Smart Detection system not found');
                }
            } else {
                console.log('❌ Extension not found - check if it\'s loaded');
            }
        }, 1000);
    });
} else {
    console.log('❌ Not in browser environment');
}
