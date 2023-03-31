(function () {
  let summarizeTabId = "";
  let currentTextToSummarize = "";
  let targetURL = "https://chat.openai.com/chat";

  function loadConfig() {
    chrome.storage.sync.get("config", ({ config }) => {
      if (config && config.model !== undefined && config.model !== "default") {
        targetURL = `https://chat.openai.com/chat?model=${config.model}`;
      }
    });
  }

  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "ai-summarize",
      title: "Summarize",
      contexts: ["selection"]
    });
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "ai-summarize") {
      chrome.tabs.create({ url: targetURL }, newTab => {
        summarizeTabId = newTab.id;
        currentTextToSummarize = info.selectionText;
      });
    }
  });

  function clientSetTextToSummarize(text) {
    window.textToSummarize = text;
  }

  chrome.webNavigation.onDOMContentLoaded.addListener(async ({ tabId, url }) => {
    if (tabId !== summarizeTabId) return;
    chrome.scripting.executeScript({
      target: { tabId },
      func: clientSetTextToSummarize,
      args: [currentTextToSummarize]
    }).then(() => {
      chrome.scripting.executeScript({
        target: { tabId },
        files: ['content-script.js'],
      })
    });
  });

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "reloadConfig") {
      loadConfig();
      sendResponse({ message: "Config reloaded" });
    }
  });

  loadConfig();
})();
