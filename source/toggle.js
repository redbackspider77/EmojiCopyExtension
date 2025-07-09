document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('toggle');

    chrome.storage.local.get(['enabled'], (data) => {
        toggle.checked = data.enabled ?? true;
    });

    toggle.addEventListener('change', () => {
        chrome.storage.local.set({ enabled: toggle.checked });
    });
});