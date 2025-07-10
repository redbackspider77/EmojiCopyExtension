chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "fetchEmojipedia") {
        if (!message.url || !message.url.startsWith("https://emojipedia.org")) {
            sendResponse({ error: "Invalid URL provided" });
            return true;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        fetch(message.url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; EmojiCopyExtension/1.0)'
            }
        })
        .then(response => {
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('text/html')) {
                throw new Error('Response is not HTML content');
            }
            
            return response.text();
        })
        .then(html => {
            if (!html || html.trim().length === 0) {
                throw new Error('Empty response received');
            }
            sendResponse({ html });
        })
        .catch(err => {
            clearTimeout(timeoutId);
            console.error('Fetch error:', err);
            
            let errorMessage = 'Failed to fetch emoji data';
            if (err.name === 'AbortError') {
                errorMessage = 'Request timed out';
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            sendResponse({ error: errorMessage });
        });

        return true;
    }
});
