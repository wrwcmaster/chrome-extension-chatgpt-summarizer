document.addEventListener("DOMContentLoaded", () => {
  const saveButton = document.getElementById("save");
  const delayTimeInput = document.getElementById("delayTime");
  const languageInput = document.getElementById("language");
  const modelSelect = document.getElementById("model");
  const wordLimitInput = document.getElementById("wordLimit");

  modelSelect.addEventListener('change', function () {
    if (modelSelect.value === 'gpt-4') {
      wordLimitInput.value = 10000;
    } else {
      wordLimitInput.value = 1500;
    }
  });

  // Load saved config from storage
  chrome.storage.sync.get("config", ({ config }) => {
    if (config === undefined) config = {};
    if (config.delayTime === undefined) {
      config.delayTime = 1000;
    }
    delayTimeInput.value = config.delayTime;

    if (config.language === undefined) {
      config.language = "English";
    }
    languageInput.value = config.language;

    if (config.model === undefined) {
      config.model = "default";
    }
    modelSelect.value = config.model;

    if (config.wordLimit === undefined) {
      config.wordLimit = 1500;
    }
    wordLimitInput.value = config.wordLimit;
  });

  // Save config to storage
  saveButton.addEventListener("click", () => {
    const delayTime = parseInt(delayTimeInput.value, 10);
    const wordLimit = parseInt(wordLimitInput.value, 10);
    if (isNaN(delayTime) || isNaN(wordLimit)) {
      alert("Invalid input. Please enter a valid number.");
    }
    const language = languageInput.value;
    const model = modelSelect.value;
    chrome.storage.sync.set({ config: { delayTime: delayTime, language: language, model: model, wordLimit: wordLimit } }, () => {
      // Send a message to the background script to reload the config
      chrome.runtime.sendMessage({ action: "reloadConfig" }, function(response) {
        console.log(response);
        window.close(); // Close the popup after saving the config
      });
    });
  });
});
