// Keyboard Layout Detector Popup Logic
const fixCurrentWordBtn = document.getElementById('fixCurrentWord');
const autoFixAllBtn = document.getElementById('autoFixAll');
const forceFixAllBtn = document.getElementById('forceFixAll');
const undoBtn = document.getElementById('undoBtn');
const pauseExtension = document.getElementById('pauseExtension');
const status = document.getElementById('status');
const statusIcon = document.getElementById('statusIcon');

// Feedback UI
const FEEDBACK_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdkButKdnqvsIuW0e02t2vb32AAipIpwBI2OFIl6VNe9C7fvw/formResponse';
const FEEDBACK_DRAFT_KEY = 'kld-feedback-draft-v1';
const feedbackBtn = document.getElementById('feedbackBtn');
const feedbackPanel = document.getElementById('feedbackPanel');
const feedbackText = document.getElementById('feedbackText');
const feedbackSubmit = document.getElementById('feedbackSubmit');
const feedbackSuccess = document.getElementById('feedbackSuccess');
const feedbackTypes = document.getElementById('feedbackTypes');

let selectedFeedbackType = 'bug';
let lastShortcutUsed = 'none';

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
    forceFixAllBtn.disabled = true;
    undoBtn.disabled = true;
    fixCurrentWordBtn.style.opacity = '0.5';
    autoFixAllBtn.style.opacity = '0.5';
    forceFixAllBtn.style.opacity = '0.5';
    undoBtn.style.opacity = '0.5';
  } else {
    status.textContent = 'Ready to fix layouts';
    statusIcon.className = 'status-icon active';
    statusIcon.textContent = '●';
    fixCurrentWordBtn.disabled = false;
    autoFixAllBtn.disabled = false;
    forceFixAllBtn.disabled = false;
    undoBtn.disabled = false;
    fixCurrentWordBtn.style.opacity = '1';
    autoFixAllBtn.style.opacity = '1';
    forceFixAllBtn.style.opacity = '1';
    undoBtn.style.opacity = '1';
    checkUndoAvailability();
  }
}

function checkUndoAvailability() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { action: 'checkUndo' }, (response) => {
      if (chrome.runtime.lastError) return;
      undoBtn.style.display = response && response.hasUndo ? 'block' : 'none';
    });
  });
}

function setFeedbackType(type) {
  selectedFeedbackType = type;
  feedbackTypes.querySelectorAll('.feedback-chip').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
  saveFeedbackDraft();
}

function saveFeedbackDraft() {
  localStorage.setItem(FEEDBACK_DRAFT_KEY, JSON.stringify({
    text: feedbackText.value,
    type: selectedFeedbackType
  }));
}

function loadFeedbackDraft() {
  try {
    const raw = localStorage.getItem(FEEDBACK_DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    if (draft && typeof draft.text === 'string') feedbackText.value = draft.text;
    if (draft && typeof draft.type === 'string') setFeedbackType(draft.type);
  } catch (_) {
    // ignore corrupted draft
  }
}

function clearFeedbackDraft() {
  localStorage.removeItem(FEEDBACK_DRAFT_KEY);
}

function getActiveTabContext() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs && tabs[0] ? tabs[0] : null;
      if (!tab || !tab.url) {
        resolve({ url: 'N/A', host: 'N/A', title: tab?.title || 'N/A' });
        return;
      }
      try {
        const u = new URL(tab.url);
        resolve({ url: tab.url, host: u.hostname, title: tab.title || 'N/A' });
      } catch (_) {
        resolve({ url: tab.url, host: 'N/A', title: tab.title || 'N/A' });
      }
    });
  });
}

// Fix Current Word button
fixCurrentWordBtn.addEventListener('click', () => {
  lastShortcutUsed = 'Ctrl+Q';
  if (pauseExtension.checked) return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { action: 'fixCurrentWord' }, (response) => {
      if (chrome.runtime.lastError) { status.textContent = '❌ No active text field'; setTimeout(() => updateStatus(), 2000); return; }
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
  lastShortcutUsed = 'Ctrl+Alt';
  if (pauseExtension.checked) return;

  status.textContent = '🔍 Scanning for wrong words...';

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { action: 'autoFixAll' }, (response) => {
      if (chrome.runtime.lastError) { status.textContent = '❌ No active text field'; setTimeout(() => updateStatus(), 2000); return; }
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

// Force Fix All Words button
forceFixAllBtn.addEventListener('click', () => {
  lastShortcutUsed = 'Ctrl+Shift+Q';
  if (pauseExtension.checked) return;

  status.textContent = '💪 Force-converting all words...';

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { action: 'forceFixAll' }, (response) => {
      if (chrome.runtime.lastError) { status.textContent = '❌ No active text field'; setTimeout(() => updateStatus(), 2000); return; }
      if (response && response.success) {
        status.textContent = '💪 Force-fixed all words!';
        checkUndoAvailability();
        setTimeout(() => updateStatus(), 4000);
      } else {
        status.textContent = response?.message || '❌ No words to convert';
        setTimeout(() => updateStatus(), 2000);
      }
    });
  });
});

// Undo button
undoBtn.addEventListener('click', () => {
  if (pauseExtension.checked) return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { action: 'undo' }, (response) => {
      if (chrome.runtime.lastError) { status.textContent = '❌ Nothing to undo'; setTimeout(() => updateStatus(), 2000); return; }
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

// Feedback open/close
feedbackBtn.addEventListener('click', () => {
  const isOpen = feedbackPanel.classList.contains('open');
  feedbackPanel.classList.toggle('open', !isOpen);
  if (!isOpen) feedbackText.focus();
});

feedbackTypes.addEventListener('click', (e) => {
  const chip = e.target.closest('.feedback-chip');
  if (!chip) return;
  setFeedbackType(chip.dataset.type);
});

feedbackText.addEventListener('input', saveFeedbackDraft);

feedbackSubmit.addEventListener('click', async () => {
  const text = feedbackText.value.trim();
  if (!text) {
    feedbackText.style.borderColor = '#ef4444';
    setTimeout(() => { feedbackText.style.borderColor = ''; }, 1200);
    return;
  }

  feedbackSubmit.disabled = true;
  feedbackSubmit.textContent = '⏳ Sending...';

  const ctx = await getActiveTabContext();
  const manifest = chrome.runtime.getManifest();
  const payload = [
    `[Type] ${selectedFeedbackType}`,
    `[Message] ${text}`,
    `[Page] ${ctx.url}`,
    `[Host] ${ctx.host}`,
    `[Title] ${ctx.title}`,
    `[Shortcut] ${lastShortcutUsed}`,
    `[Version] ${manifest.version}`,
    `[Lang] ${navigator.language || 'N/A'}`,
    `[Time] ${new Date().toISOString()}`
  ].join('\n');

  const body = new FormData();
  body.append('entry.706574375', payload);
  await fetch(FEEDBACK_FORM_URL, { method: 'POST', mode: 'no-cors', body }).catch(() => { });

  feedbackText.value = '';
  clearFeedbackDraft();
  setFeedbackType('bug');
  feedbackPanel.classList.remove('open');
  feedbackSuccess.classList.add('show');
  setTimeout(() => { feedbackSuccess.classList.remove('show'); }, 3500);

  feedbackSubmit.disabled = false;
  feedbackSubmit.textContent = '✉️ Send';
});

// Initial setup
loadFeedbackDraft();
setTimeout(checkUndoAvailability, 100);

// How to use KLD link
document.getElementById('howToUseBtn').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});
