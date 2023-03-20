(function () {
  const btnSend = document.querySelector("form button");
  let language = "English";
  let delayTime = 1000;
  let wordLimit = 1500;

  // Prompt generation
  let articleParts = [];
  let currentIndex = 0;
  let summaryParts = [];
  function generateCurrentPrompt() {
    if (articleParts.length == 0) return;
    if (articleParts.length == 1) {
      return `Summarize the following text in ${language}:
 
 ${articleParts[0]}
 `;
    } else {
      return `The article has ${articleParts.length} sections, please summarize section ${currentIndex + 1} below:

${articleParts[currentIndex]}
`;
    }
  }

  function generateFinalPrompt() {
    let prompt = `Please organize a complete summary in ${language} based on the summaries of the following sections:\n`;
    for (let i = 0; i < articleParts.length; i++) {
      prompt += `Section ${i + 1}:\n${summaryParts[i]}\n`;
    }
    return prompt;
  }

  // Split article if it is too long (Currently does not support languages like CN and JP)
  function splitArticle(article, wordLimitInSection) {
    let parts = [];
    let sentences = article.match(/[^.!?]+[.!?]*\s*/g) || [article];
    let part = [];

    for (let i = 0; i < sentences.length; i++) {
      let sentenceWords = sentences[i].trim().split(" ");
      if (part.length + sentenceWords.length <= wordLimitInSection) {
        part.push(...sentenceWords);
      } else {
        parts.push(part.join(' '));
        part = [...sentenceWords];
      }
    }

    if (part.length > 0) {
      parts.push(part.join(' '));
    }

    return parts;
  }

  function sendChatMessage(message) {
    document.querySelector("textarea").value = message;

    const clickEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    btnSend.dispatchEvent(clickEvent);
  }

  function handleAIMessage(message) {
    summaryParts.push(message);
    currentIndex++;
    if (currentIndex < articleParts.length) {
      sendChatMessage(generateCurrentPrompt());
    } else {
      sendChatMessage(generateFinalPrompt());
      observer.disconnect();
    }
  }

  function startSummarizeOperation() {
    articleParts = splitArticle(window.textToSummarize, wordLimit);
    sendChatMessage(generateCurrentPrompt());
    if (articleParts.length > 1) {
      observer.observe(targetNode, { attributes: false, childList: true, subtree: true });
    }
  }

  // Main
  chrome.storage.sync.get("config", ({ config }) => {
    if (config) {
      if (config.delayTime !== undefined) {
        delayTime = config.delayTime;
      }
      if (config.language !== undefined) {
        language = config.language;
      }
      if (config.wordLimit !== undefined) {
        wordLimit = config.wordLimit;
      }
    }
    setTimeout(() => {
      startSummarizeOperation();
    }, delayTime);
  });

  const targetNode = document.querySelector('main');
  const observer = new MutationObserver((mutationsList) => {
    for (let mutation of mutationsList) {
      if (mutation.type === "childList") {
        if (mutation.addedNodes.length > 0) {
          let addedNode = mutation.addedNodes[0];
          // Input button is enabled again, AI generation finished.
          if (addedNode.nodeName === 'svg') {
            const messageNodes = document.querySelectorAll("main > div > div > div > div > div > div");
            const lastMessage = messageNodes[messageNodes.length - 1].innerText;
            setTimeout(() => {
              handleAIMessage(lastMessage);
            }, delayTime);
          }
        }
      }
    }
  });
})();
