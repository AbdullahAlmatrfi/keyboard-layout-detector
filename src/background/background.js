const CONSENT_VERSION = '2026-03-15-v1';

function openConsentPage() {
    chrome.tabs.create({
        url: chrome.runtime.getURL('src/pages/consent.html')
    });
}

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.storage.local.set({
            kldConsentStatus: 'unknown',
            kldConsentVersion: CONSENT_VERSION,
            kldConsentUpdatedAt: new Date().toISOString()
        }, () => {
            openConsentPage();
        });
        return;
    }

    if (details.reason === 'update') {
        chrome.storage.local.get(['kldConsentStatus', 'kldConsentVersion'], (data) => {
            const currentVersion = data?.kldConsentVersion;
            if (currentVersion === CONSENT_VERSION) return;

            chrome.storage.local.set({
                kldConsentStatus: 'unknown',
                kldConsentVersion: CONSENT_VERSION,
                kldConsentUpdatedAt: new Date().toISOString()
            }, () => {
                openConsentPage();
            });
        });
    }
});
