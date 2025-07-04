async function getEmojiFromEmojipedia(url) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: "fetchEmojipedia", url }, (response) => {
            if (response.error) {
                reject(response.error);
                return;
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(response.html, 'text/html');

            const emojiElement = doc.querySelector('.Emoji_emoji-large__GG4kj');

            if (emojiElement) {
                resolve(emojiElement.innerText.trim());
            } else {
                reject('Emoji not found on page.');
            }
        });
    });
}

function createBox(emoji, searchResult) {
  if (!searchResult) return;

  if (searchResult.querySelector('.emoji-copy-box')) return;

  const box = document.createElement('div');
  box.className = 'emoji-copy-box';
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
    border: 1px solid #ccc;
    background-color: #f8f9fa;
    box-sizing: border-box;
    color: inherit;
  `;

  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (isDark) {
    box.style.backgroundColor = '#303134';
    box.style.borderColor = '#5f6368';
    box.style.color = '#e8eaed';
  }

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
  `;

  copyButton.addEventListener('click', () => {
    navigator.clipboard.writeText(emoji).then(() => {
      copyButton.textContent = 'Copied!';
      setTimeout(() => {
        copyButton.textContent = 'Copy';
      }, 1200);
    }).catch(err => {
      console.error('Clipboard error:', err);
      copyButton.textContent = 'Error';
    });
  });

  box.appendChild(emojiSpan);
  box.appendChild(copyButton);

  searchResult.appendChild(box);
}

chrome.storage.local.get(['enabled'], (data) => {
    if (data.enabled !== false) {
        window.addEventListener('DOMContentLoaded', function() {
        //  const prompt = document.getElementById('APjFqb').value.toLowerCase();
        //  if (prompt.includes('emoji')) {
                const resultLinks = document.getElementsByClassName('zReHs');

                Array.from(resultLinks).forEach((link) => {
                    let searchResult = link.closest('.MjjYud');
                    if (searchResult) {
                    
                        let n = searchResult.firstElementChild?.firstElementChild
                        if (n && !n.hasAttribute('data-initq')) {
                            if (link.href.startsWith("https://emojipedia.org")) {
                                getEmojiFromEmojipedia(link.href)
                                    .then(emoji => createBox(emoji, searchResult))
                                    .catch(err => console.error('Error:', err));
                            }
                        }
                    }
                });
        //  }
        });
    }
});