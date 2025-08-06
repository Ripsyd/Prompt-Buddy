document.addEventListener('DOMContentLoaded', function() {
  const endpointInput = document.getElementById('apiEndpoint');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const msg = document.getElementById('msg');

  // Load existing values
  chrome.storage.sync.get(['apiEndpoint', 'apiKey'], function(result) {
    if (result.apiEndpoint) endpointInput.value = result.apiEndpoint;
    if (result.apiKey) apiKeyInput.value = result.apiKey;
  });

  saveBtn.onclick = function() {
    const endpoint = endpointInput.value.trim();
    const key = apiKeyInput.value.trim();
    chrome.storage.sync.set({
      apiEndpoint: endpoint,
      apiKey: key
    }, function() {
      msg.textContent = "✅ Settings saved!";
      setTimeout(() => { msg.textContent = ""; }, 1800);
    });
  };
});