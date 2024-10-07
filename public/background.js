// background.js

// Listen for messages from the React UI
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'START_SCRAPING') {
    scrapePosts(request.postUrls);
  }
});

async function scrapePosts(postUrls) {
  for (const url of postUrls) {
    await openTabAndScrape(url);
  }
  // Notify React UI that scraping is complete
  chrome.runtime.sendMessage({ type: 'SCRAPING_COMPLETE' });
}

function openTabAndScrape(url) {
  return new Promise((resolve) => {
    chrome.tabs.create({ url, active: false }, (tab) => {
      // Listen for messages from the content script
      const listener = (message, sender) => {
        if (sender.tab.id === tab.id && message.type === 'DESCRIPTION_SCRAPED') {
          // Process the scraped description
          chrome.runtime.sendMessage({
            type: 'DESCRIPTION_RECEIVED',
            data: { url, description: message.description },
          });
          // Close the tab
          chrome.tabs.remove(tab.id);
          // Remove listener
          chrome.runtime.onMessage.removeListener(listener);
          resolve();
        }
      };
      chrome.runtime.onMessage.addListener(listener);
    });
  });
}
