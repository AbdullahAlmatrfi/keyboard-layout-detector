// Keyboard Layout Detector Popup Logic
const fixCurrentWordBtn = document.getElementById('fixCurrentWord');
const autoFixAllBtn = document.getElementById('autoFixAll');
const pauseExtension = document.getElementById('pauseExtension');
const status = document.getElementById('status');

// Load pause setting from chrome.storage
chrome.storage.sync.get(['pauseExtension'], (data) => {
  pauseExtension.checked = !!data.pauseExtension;
  updateStatus();
});

function updateStatus() {
  if (pauseExtension.checked) {
    status.textContent = 'Extension is paused';
    fixCurrentWordBtn.disabled = true;
    autoFixAllBtn.disabled = true;
    fixCurrentWordBtn.style.opacity = '0.5';
    autoFixAllBtn.style.opacity = '0.5';
  } else {
    status.textContent = 'Ready to fix layouts';
    fixCurrentWordBtn.disabled = false;
    autoFixAllBtn.disabled = false;
    fixCurrentWordBtn.style.opacity = '1';
    autoFixAllBtn.style.opacity = '1';
  }
}

// Fix Current Word button
fixCurrentWordBtn.addEventListener('click', () => {
  if (pauseExtension.checked) return;
  
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'fixCurrentWord'}, (response) => {
      if (response && response.success) {
        status.textContent = '✅ Fixed current word!';
        setTimeout(() => updateStatus(), 2000);
      } else {
        status.textContent = '❌ No word to fix found';
        setTimeout(() => updateStatus(), 2000);
      }
    });
  });
});

// Auto-Fix All Words button
autoFixAllBtn.addEventListener('click', () => {
  if (pauseExtension.checked) return;
  
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'autoFixAll'}, (response) => {
      if (response && response.count > 0) {
        status.textContent = `✅ Fixed ${response.count} word(s)!`;
        setTimeout(() => updateStatus(), 3000);
      } else {
        status.textContent = '✅ No wrong words found';
        setTimeout(() => updateStatus(), 2000);
      }
    });
  });
});

// Pause Extension toggle
pauseExtension.addEventListener('change', () => {
  chrome.storage.sync.set({ pauseExtension: pauseExtension.checked });
  updateStatus();
});
