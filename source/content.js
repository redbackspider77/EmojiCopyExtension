const EMOJI_SELECTORS = [
    '.Emoji_emoji-large__GG4kj',
    '[data-emoji-char]',
    '.emoji-large'
];

const STYLES = {
    box: {
        light: {
            backgroundColor: '#f8f9fa',
            borderColor: '#ccc',
            color: 'inherit'
        },
        dark: {
            backgroundColor: '#303134',
            borderColor: '#5f6368',
            color: '#e8eaed'
        }
    }
};

function showUserError(searchResult, message) {
    if (searchResult.querySelector('.emoji-error-box')) return;
    
    const errorBox = document.createElement('div');
    errorBox.className = 'emoji-error-box';
    
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = isDark ? STYLES.box.dark : STYLES.box.light;
    
    errorBox.style.cssText = `
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        margin-top: 0px;
        margin-bottom: 20px;
        border-radius: 6px;
        font-size: 14px;
        border: 1px solid #ea4335;
        background-color: ${isDark ? '#2d1b1e' : '#fce8e6'};
        color: #ea4335;
        box-sizing: border-box;
    `;
    
    errorBox.innerHTML = `
        <span>⚠️</span>
        <span>${message}</span>
    `;
    
    searchResult.appendChild(errorBox);
    
    setTimeout(() => {
        if (errorBox.parentNode) {
            errorBox.parentNode.removeChild(errorBox);
        }
    }, 5000);
}

async function getEmojiFromEmojipedia(url) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: "fetchEmojipedia", url }, (response) => {
            if (chrome.runtime.lastError) {
                reject(`Connection error: ${chrome.runtime.lastError.message}`);
                return;
            }
            
            if (response?.error) {
                reject(`Fetch error: ${response.error}`);
                return;
            }

            if (!response?.html) {
                reject('No content received from Emojipedia');
                return;
            }

            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(response.html, 'text/html');

                for (const selector of EMOJI_SELECTORS) {
                    const emojiElement = doc.querySelector(selector);
                    if (emojiElement?.textContent?.trim()) {
                        resolve(emojiElement.textContent.trim());
                        return;
                    }
                }

                reject('Emoji not found on page');
            } catch (error) {
                reject(`Page parsing failed: ${error.message}`);
            }
        });
    });
}

function createBox(emoji, searchResult) {
    if (!searchResult || !emoji) return;

    if (searchResult.querySelector('.emoji-copy-box')) return;

    const box = document.createElement('div');
    box.className = 'emoji-copy-box';
    
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = isDark ? STYLES.box.dark : STYLES.box.light;
    
    box.style.cssText = `
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        margin-top: 0px;
        margin-bottom: 20px;
        border-radius: 6px;
        font-size: 26px;
        border: 1px solid ${theme.borderColor};
        background-color: ${theme.backgroundColor};
        box-sizing: border-box;
        color: ${theme.color};
    `;

    const emojiSpan = document.createElement('span');
    emojiSpan.textContent = emoji;

    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy';
    copyButton.style.cssText = `
        background-color: #1a73e8;
        border: none;
        color: white;
        padding: 6px 14px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        margin-left: 10px;
        transition: background-color 0.2s ease;
    `;

    copyButton.addEventListener('mouseenter', () => {
        copyButton.style.backgroundColor = '#1557b0';
    });
    
    copyButton.addEventListener('mouseleave', () => {
        copyButton.style.backgroundColor = '#1a73e8';
    });

    copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(emoji);
            const originalText = copyButton.textContent;
            copyButton.textContent = 'Copied!';
            copyButton.style.backgroundColor = '#34a853';
            
            setTimeout(() => {
                copyButton.textContent = originalText;
                copyButton.style.backgroundColor = '#1a73e8';
            }, 1200);
        } catch (err) {
            console.error('Clipboard error:', err);
            copyButton.textContent = 'Failed';
            copyButton.style.backgroundColor = '#ea4335';
            
            setTimeout(() => {
                copyButton.textContent = 'Copy';
                copyButton.style.backgroundColor = '#1a73e8';
            }, 1200);
        }
    });

    box.appendChild(emojiSpan);
    box.appendChild(copyButton);
    searchResult.appendChild(box);
}

function processSearchResults() {
    const resultLinks = document.querySelectorAll('.zReHs');
    
    resultLinks.forEach((link) => {
        const searchResult = link.closest('.MjjYud');
        if (!searchResult) return;
        
        const firstElement = searchResult.firstElementChild?.firstElementChild;
        if (!firstElement || firstElement.hasAttribute('data-initq')) return;
        
        if (link.href?.startsWith("https://emojipedia.org")) {
            getEmojiFromEmojipedia(link.href)
                .then(emoji => createBox(emoji, searchResult))
                .catch(err => {
                    console.warn('Failed to fetch emoji:', err);
                    showUserError(searchResult, 'Failed to load emoji');
                });
        }
    });
}

function initializeExtension() {
    chrome.storage.local.get(['enabled'], (data) => {
        if (data.enabled !== false) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', processSearchResults);
            } else {
                processSearchResults();
            }
            
            const observer = new MutationObserver((mutations) => {
                let shouldProcess = false;
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        shouldProcess = true;
                    }
                });
                
                if (shouldProcess) {
                    setTimeout(processSearchResults, 100);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    });
}

if (typeof chrome !== 'undefined' && chrome.storage) {
    initializeExtension();
}