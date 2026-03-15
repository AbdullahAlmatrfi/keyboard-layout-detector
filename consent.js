(function () {
    'use strict';

    var CONSENT_VERSION = '2026-03-15-v1';
    var KEY_STATUS = 'kldConsentStatus';
    var KEY_VERSION = 'kldConsentVersion';
    var KEY_UPDATED_AT = 'kldConsentUpdatedAt';

    var agreeBtn = document.getElementById('agreeBtn');
    var privacyBtn = document.getElementById('privacyBtn');
    var statusEl = document.getElementById('status');

    function setContractStatus(status) {
        return new Promise(function (resolve) {
            chrome.storage.local.set({
                [KEY_STATUS]: status,
                [KEY_VERSION]: CONSENT_VERSION,
                [KEY_UPDATED_AT]: new Date().toISOString()
            }, function () {
                resolve();
            });
        });
    }

    function readStatus() {
        return new Promise(function (resolve) {
            chrome.storage.local.get([KEY_STATUS, KEY_VERSION, KEY_UPDATED_AT], function (data) {
                resolve(data || {});
            });
        });
    }

    function openHelp() {
        window.location.href = chrome.runtime.getURL('index.html');
    }

    async function renderStatus() {
        var data = await readStatus();
        if (!data[KEY_STATUS]) {
            statusEl.textContent = 'Current mode: locked. Accept Terms to activate the extension.';
            return;
        }

        if (data[KEY_STATUS] === 'accepted' && data[KEY_VERSION] === CONSENT_VERSION) {
            statusEl.textContent = 'Current mode: active. Terms accepted.';
            agreeBtn.disabled = true;
            agreeBtn.textContent = 'Terms Accepted';
            return;
        }

        statusEl.textContent = 'Current mode: locked. Accept Terms to activate the extension.';
    }

    agreeBtn.addEventListener('click', async function () {
        await setContractStatus('accepted');
        statusEl.textContent = 'Terms accepted. Extension is now active.';
        agreeBtn.disabled = true;
        agreeBtn.textContent = 'Terms Accepted';
        setTimeout(function () {
            openHelp();
        }, 200);
    });

    privacyBtn.addEventListener('click', function () {
        chrome.tabs.create({ url: chrome.runtime.getURL('privacy.html') });
    });

    renderStatus();
})();
