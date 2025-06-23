chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "fetchEmojipedia") {
    fetch(message.url)
      .then(res => res.text())
      .then(html => sendResponse({ html }))
      .catch(err => sendResponse({ error: err.toString() }));
    return true;
  }
});
