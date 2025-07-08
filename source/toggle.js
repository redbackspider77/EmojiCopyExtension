(() => {
    'use strict';

    function initializeToggle() {
        const toggle = document.getElementById('toggle');
        
        if (!toggle) {
            console.error('Toggle element not found');
            return;
        }

        chrome.storage.local.get(['enabled'], (data) => {
            if (chrome.runtime.lastError) {
                console.error('Error loading settings:', chrome.runtime.lastError);
                return;
            }
            
            toggle.checked = data.enabled !== false;
            updateToggleState(toggle.checked);
        });

        toggle.addEventListener('change', (event) => {
            const isEnabled = event.target.checked;
            
            chrome.storage.local.set({ enabled: isEnabled }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error saving settings:', chrome.runtime.lastError);
                    event.target.checked = !isEnabled;
                    return;
                }
                
                updateToggleState(isEnabled);
            });
        });
    }

    function updateToggleState(isEnabled) {
        const toggle = document.getElementById('toggle');
        if (toggle) {
            toggle.setAttribute('aria-label', 
                isEnabled ? 'Extension is enabled. Click to disable.' : 'Extension is disabled. Click to enable.'
            );
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeToggle);
    } else {
        initializeToggle();
    }
})();