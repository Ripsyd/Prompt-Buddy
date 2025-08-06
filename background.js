chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "callOpenAI") {
    fetch(request.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + request.apiKey
      },
      body: JSON.stringify(request.payload)
    })
      .then(response => response.json())
      .then(data => sendResponse({ data }))
      .catch(error => sendResponse({ error: error.message }));
    // Required for async response
    return true;
  }
});