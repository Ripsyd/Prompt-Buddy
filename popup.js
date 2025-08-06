/**
 * Prompt Buddy Popup Configuration
 * Handles API settings and validation with encryption
 * @version 1.0.1
 */

/**
 * Simple encryption/decryption using built-in crypto
 * Note: This provides basic obfuscation, not military-grade security
 */
const CryptoHelper = {
  // Simple key derivation from a fixed string + browser info
  getKey: async function() {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('promptbuddy-' + navigator.userAgent.slice(0, 20)),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('promptbuddy-salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  },

  encrypt: async function(text) {
    try {
      const key = await this.getKey();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encodedText = new TextEncoder().encode(text);
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encodedText
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.warn('Encryption failed:', error);
      return text; // Fallback to plain text
    }
  },

  decrypt: async function(encryptedData) {
    try {
      const key = await this.getKey();
      const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
      
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encrypted
      );
      
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.warn('Decryption failed:', error);
      return encryptedData; // Fallback to original data
    }
  }
};

/**
 * Validate API endpoint URL
 * @param {string} url - The URL to validate
 * @returns {boolean} Whether the URL is valid
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return url.includes('openai.com') || url.includes('api.openai.com');
  } catch {
    return false;
  }
}

/**
 * Validate API key format
 * @param {string} key - The API key to validate
 * @returns {boolean} Whether the key format is valid
 */
function isValidApiKey(key) {
  return key.startsWith('sk-') && key.length > 20;
}

/**
 * Show message to user
 * @param {string} text - Message text
 * @param {boolean} isError - Whether this is an error message
 */
function showMessage(text, isError = false) {
  const msg = document.getElementById('msg');
  msg.textContent = text;
  msg.style.color = isError ? '#ef4444' : '#22c55e';
  
  setTimeout(() => {
    msg.textContent = "";
    msg.style.color = '';
  }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
  const endpointInput = document.getElementById('apiEndpoint');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');

  // Feedback elements
  const feedbackBtn = document.getElementById('feedbackBtn');
  const feedbackModal = document.getElementById('feedbackModal');
  const feedbackText = document.getElementById('feedbackText');
  const feedbackCancel = document.getElementById('feedbackCancel');
  const feedbackSubmit = document.getElementById('feedbackSubmit');

  // Load existing values with decryption
  chrome.storage.sync.get(['apiEndpoint', 'apiKey'], async function(result) {
    if (result.apiEndpoint) {
      // Try to decrypt, fallback to plain text for backward compatibility
      const decryptedEndpoint = await CryptoHelper.decrypt(result.apiEndpoint);
      endpointInput.value = decryptedEndpoint;
    } else {
      // Set default OpenAI endpoint
      endpointInput.value = 'https://api.openai.com/v1/chat/completions';
    }
    
    if (result.apiKey) {
      // Try to decrypt, fallback to plain text for backward compatibility
      const decryptedKey = await CryptoHelper.decrypt(result.apiKey);
      apiKeyInput.value = decryptedKey;
    }
  });

  // Save settings with validation and encryption
  saveBtn.onclick = async function() {
    const endpoint = endpointInput.value.trim();
    const key = apiKeyInput.value.trim();

    // Validation
    if (!endpoint) {
      showMessage("❌ API Endpoint is required", true);
      endpointInput.focus();
      return;
    }

    if (!isValidUrl(endpoint)) {
      showMessage("❌ Please enter a valid OpenAI API URL", true);
      endpointInput.focus();
      return;
    }

    if (!key) {
      showMessage("❌ API Key is required", true);
      apiKeyInput.focus();
      return;
    }

    if (!isValidApiKey(key)) {
      showMessage("❌ API Key must start with 'sk-' and be valid format", true);
      apiKeyInput.focus();
      return;
    }

    // Encrypt sensitive data before saving
    const encryptedEndpoint = await CryptoHelper.encrypt(endpoint);
    const encryptedKey = await CryptoHelper.encrypt(key);

    // Save if validation passes
    chrome.storage.sync.set({
      apiEndpoint: encryptedEndpoint,
      apiKey: encryptedKey
    }, function() {
      if (chrome.runtime.lastError) {
        showMessage("❌ Failed to save settings", true);
      } else {
        showMessage("✅ Settings saved and encrypted!");
      }
    });
  };

  // Add Enter key support
  [endpointInput, apiKeyInput].forEach(input => {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        saveBtn.click();
      }
    });
  });

  // Feedback functionality
  feedbackBtn.addEventListener('click', function() {
    feedbackModal.classList.add('show');
    feedbackText.focus();
  });

  feedbackCancel.addEventListener('click', function() {
    closeFeedbackModal();
  });

  feedbackModal.addEventListener('click', function(e) {
    if (e.target === feedbackModal) {
      closeFeedbackModal();
    }
  });

  feedbackSubmit.addEventListener('click', function() {
    submitFeedback();
  });

  // Handle Enter key in feedback textarea (Ctrl+Enter to submit)
  feedbackText.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitFeedback();
    }
    if (e.key === 'Escape') {
      closeFeedbackModal();
    }
  });

  /**
   * Close the feedback modal and reset form
   */
  function closeFeedbackModal() {
    feedbackModal.classList.remove('show');
    feedbackText.value = '';
  }

  /**
   * Submit feedback with validation and storage
   */
  async function submitFeedback() {
    const feedback = feedbackText.value.trim();
    
    if (!feedback) {
      showMessage("❌ Please enter your feedback before submitting", true);
      feedbackText.focus();
      return;
    }

    if (feedback.length < 10) {
      showMessage("❌ Please provide more detailed feedback (at least 10 characters)", true);
      feedbackText.focus();
      return;
    }

    try {
      // Disable submit button during processing
      feedbackSubmit.disabled = true;
      feedbackSubmit.textContent = '📤 Sending...';

      // Create feedback entry
      const feedbackEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        feedback: feedback,
        version: chrome.runtime.getManifest().version,
        userAgent: navigator.userAgent.slice(0, 100), // Limited for privacy
        submitted: false // Will be true when successfully sent to external service
      };

      // Store feedback locally (encrypted)
      const encryptedFeedback = await CryptoHelper.encrypt(JSON.stringify(feedbackEntry));
      
      // Get existing feedback array
      chrome.storage.sync.get(['userFeedback'], async function(result) {
        let feedbackArray = [];
        
        if (result.userFeedback) {
          try {
            const decryptedArray = await CryptoHelper.decrypt(result.userFeedback);
            feedbackArray = JSON.parse(decryptedArray) || [];
          } catch (error) {
            console.warn('Failed to decrypt existing feedback:', error);
            feedbackArray = [];
          }
        }

        // Add new feedback
        feedbackArray.push(feedbackEntry);

        // Keep only last 50 feedback entries to prevent storage bloat
        if (feedbackArray.length > 50) {
          feedbackArray = feedbackArray.slice(-50);
        }

        // Store encrypted feedback array
        const encryptedArray = await CryptoHelper.encrypt(JSON.stringify(feedbackArray));
        
        chrome.storage.sync.set({ userFeedback: encryptedArray }, function() {
          if (chrome.runtime.lastError) {
            showMessage("❌ Failed to save feedback locally", true);
            console.error('Feedback storage error:', chrome.runtime.lastError);
          } else {
            showMessage("✅ Feedback saved! Thank you for helping us improve Prompt Buddy!");
            closeFeedbackModal();
            
            // Optional: Send to external service (implement when you have an endpoint)
            // sendFeedbackToServer(feedbackEntry);
          }
          
          // Re-enable submit button
          feedbackSubmit.disabled = false;
          feedbackSubmit.textContent = '📤 Send Feedback';
        });
      });

    } catch (error) {
      console.error('Feedback submission error:', error);
      showMessage("❌ Failed to submit feedback. Please try again.", true);
      
      // Re-enable submit button
      feedbackSubmit.disabled = false;
      feedbackSubmit.textContent = '📤 Send Feedback';
    }
  }

  /**
   * Send feedback to external server (implement when endpoint is available)
   * @param {Object} feedbackEntry - The feedback entry to send
   */
  function sendFeedbackToServer(feedbackEntry) {
    // TODO: Implement when you have a feedback endpoint
    // This could be a simple webhook, Google Forms, or your own API
    /*
    fetch('YOUR_FEEDBACK_ENDPOINT', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feedback: feedbackEntry.feedback,
        version: feedbackEntry.version,
        timestamp: feedbackEntry.timestamp,
        id: feedbackEntry.id
      })
    })
    .then(response => response.ok)
    .then(success => {
      if (success) {
        // Mark as submitted in local storage
        markFeedbackAsSubmitted(feedbackEntry.id);
      }
    })
    .catch(error => {
      console.warn('Failed to send feedback to server:', error);
      // Feedback is still saved locally
    });
    */
  }
});