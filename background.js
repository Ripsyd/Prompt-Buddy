/**
 * Prompt Buddy Background Service Worker
 * Handles API communication with OpenAI
 * @version 1.0.1
 */

/**
 * Validate API request parameters
 * @param {Object} request - The request object
 * @returns {string|null} Error message or null if valid
 */
function validateApiRequest(request) {
  if (!request.apiUrl) return 'API URL is required';
  if (!request.apiKey) return 'API Key is required';
  if (!request.payload) return 'Payload is required';
  
  try {
    new URL(request.apiUrl);
  } catch {
    return 'Invalid API URL format';
  }
  
  if (!request.apiKey.startsWith('sk-')) {
    return 'Invalid API Key format';
  }
  
  return null;
}

/**
 * Make API call to OpenAI
 * @param {Object} request - Request parameters
 * @param {Function} sendResponse - Response callback
 */
async function callOpenAI(request, sendResponse) {
  // Validate request
  const validationError = validateApiRequest(request);
  if (validationError) {
    sendResponse({ error: validationError });
    return;
  }

  // Create AbortController for timeout handling
  const controller = new AbortController();
  const timeout = request.timeout || 8000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(request.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${request.apiKey}`,
        "Connection": "keep-alive"
      },
      body: JSON.stringify(request.payload),
      signal: controller.signal,
      keepalive: true,
      cache: "no-cache"
    });

    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
    }
    
    const data = await response.json();
    sendResponse({ data });
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    let errorMsg = 'Unknown error occurred';
    if (error.name === 'AbortError') {
      errorMsg = `Request timeout after ${timeout/1000}s`;
    } else if (error.message.includes('Failed to fetch')) {
      errorMsg = 'Network error - check your connection';
    } else {
      errorMsg = error.message;
    }
    
    sendResponse({ error: errorMsg });
  }
}

/**
 * Update the extension icon based on active state
 * @param {boolean} isActive - Whether the extension is active
 */
async function updateExtensionIcon(isActive) {
  try {
    // Use the custom logos for active/inactive states
    const iconPaths = isActive ? {
      "16": "activelogo.png",
      "48": "activelogo.png", 
      "128": "activelogo.png"
    } : {
      "16": "inactivelogo.png",
      "48": "inactivelogo.png",
      "128": "inactivelogo.png"
    };
    
    await chrome.action.setIcon({
      path: iconPaths
    });
    
    // Update the title to reflect current state
    const title = isActive ? 'Prompt Buddy (Active)' : 'Prompt Buddy (Inactive)';
    await chrome.action.setTitle({ title });
    
    // Remove badge to avoid obscuring the custom logo
    await chrome.action.setBadgeText({ 
      text: '' 
    });
    
  } catch (error) {
    // Handle extension context invalidation gracefully
    if (error.message && error.message.includes('Extension context invalidated')) {
      console.log('Prompt Buddy: Extension reloaded, ignoring icon update');
      return;
    }
    console.warn('Prompt Buddy: Failed to update icon:', error);
  }
}

/**
 * Handle extension state changes and icon updates
 * @param {Object} request - The message request
 */
function handleStateChange(request) {
  if (request.action === 'updateIcon') {
    updateExtensionIcon(request.isActive);
  }
}

// Initialize extension with proper state on startup
chrome.runtime.onStartup.addListener(async () => {
  try {
    const result = await chrome.storage.sync.get(['promptBuddyEnabled']);
    const isActive = result.promptBuddyEnabled || false;
    updateExtensionIcon(isActive);
  } catch (error) {
    console.warn('Failed to get initial state, defaulting to inactive:', error);
    updateExtensionIcon(false);
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  try {
    const result = await chrome.storage.sync.get(['promptBuddyEnabled']);
    const isActive = result.promptBuddyEnabled || false;
    updateExtensionIcon(isActive);
  } catch (error) {
    console.warn('Failed to get initial state, defaulting to inactive:', error);
    updateExtensionIcon(false);
  }
});

// Listen for storage changes to update icon state
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.promptBuddyEnabled) {
    const isActive = changes.promptBuddyEnabled.newValue || false;
    updateExtensionIcon(isActive);
  }
});

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "callOpenAI") {
    callOpenAI(request, sendResponse);
    return true; // Required for async response
  } else if (request.action === "updateIcon") {
    handleStateChange(request);
  }
});