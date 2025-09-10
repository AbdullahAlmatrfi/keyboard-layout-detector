// Keyboard Layout Detector Popup Logic
const fixCurrentWordBtn = document.getElementById('fixCurrentWord');
const autoFixAllBtn = document.getElementById('autoFixAll');
const undoBtn = document.getElementById('undoBtn');
const pauseExtension = document.getElementById('pauseExtension');
const status = document.getElementById('status');
const statusIcon = document.getElementById('statusIcon');

// Load pause setting from chrome.storage
chrome.storage.sync.get(['pauseExtension'], (data) => {
  pauseExtension.checked = !!data.pauseExtension;
  updateStatus();
});

function updateStatus() {
  if (pauseExtension.checked) {
    status.textContent = 'Extension is paused';
    statusIcon.className = 'status-icon paused';
    statusIcon.textContent = '⏸️';
    fixCurrentWordBtn.disabled = true;
    autoFixAllBtn.disabled = true;
    undoBtn.disabled = true;
    fixCurrentWordBtn.style.opacity = '0.5';
    autoFixAllBtn.style.opacity = '0.5';
    undoBtn.style.opacity = '0.5';
  } else {
    status.textContent = 'Ready to fix layouts';
    statusIcon.className = 'status-icon active';
    statusIcon.textContent = '●';
    fixCurrentWordBtn.disabled = false;
    autoFixAllBtn.disabled = false;
    undoBtn.disabled = false;
    fixCurrentWordBtn.style.opacity = '1';
    autoFixAllBtn.style.opacity = '1';
    undoBtn.style.opacity = '1';
    
    // Check if undo is available
    checkUndoAvailability();
  }
}

function checkUndoAvailability() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'checkUndo'}, (response) => {
      if (response && response.hasUndo) {
        undoBtn.style.display = 'block';
      } else {
        undoBtn.style.display = 'none';
      }
    });
  });
}

// Fix Current Word button
fixCurrentWordBtn.addEventListener('click', () => {
  if (pauseExtension.checked) return;
  
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'fixCurrentWord'}, (response) => {
      if (response && response.success) {
        status.textContent = `✅ Fixed: "${response.original}" → "${response.converted}"`;
        checkUndoAvailability();
        setTimeout(() => updateStatus(), 3000);
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
  
  status.textContent = '🔍 Scanning for wrong words...';
  
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'autoFixAll'}, (response) => {
      if (response && response.count > 0) {
        status.textContent = `🎉 Fixed ${response.count} word(s) with epic animations!`;
        checkUndoAvailability();
        setTimeout(() => updateStatus(), 4000);
      } else {
        status.textContent = '✅ No wrong words found';
        setTimeout(() => updateStatus(), 2000);
      }
    });
  });
});

// Undo button
undoBtn.addEventListener('click', () => {
  if (pauseExtension.checked) return;
  
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'undo'}, (response) => {
      if (response && response.success) {
        status.textContent = '↶ Undone successfully!';
        checkUndoAvailability();
        setTimeout(() => updateStatus(), 2000);
      } else {
        status.textContent = '❌ Nothing to undo';
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

// Check undo availability when popup opens
setTimeout(checkUndoAvailability, 100);
