/**
 * Prompt Buddy Chrome Extension Content Script
 * Auto-engineers ChatGPT prompts using GPT intelligence
 * @version 1.0.1
 * @author Prompt Buddy Team
 */

// Production build - disable verbose logging
const DEBUG_MODE = false;

// Configuration constants
const CONFIG = {
  CACHE_EXPIRY: 300000, // 5 minutes
  MAX_CACHE_SIZE: 50,
  REQUEST_TIMEOUT: 8000, // 8 seconds
  PANEL_BREAKPOINT: { width: 1200, height: 800 },
  COLORS: {
    primary: '#4ade80',
    secondary: '#22c55e', 
    error: '#ef4444',
    processing: '#3b82f6'
  }
};

// Global state
let API_URL = "";
let API_KEY = "";

// Speed optimization: Simple cache for similar prompts
const promptCache = new Map();


/**
 * Simple decryption helper for content script
 * Note: Simplified version for content script compatibility
 */
async function decryptData(encryptedData) {
  try {
    // If data is not encrypted (backward compatibility), return as-is
    if (!encryptedData || typeof encryptedData !== 'string') {
      return encryptedData;
    }
    
    // Check if data looks like it might be encrypted (base64 format)
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encryptedData)) {
      return encryptedData; // Not base64, return as plain text
    }
    
    // Try to decrypt - if it fails, assume it's plain text (backward compatibility)
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('promptbuddy-' + navigator.userAgent.slice(0, 20)),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('promptbuddy-salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

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
    // Fallback to original data (backward compatibility)
    if (DEBUG_MODE) console.log('Prompt Buddy: Decryption failed, using original data:', error.message);
    return encryptedData;
  }
}

/**
 * Initialize API configuration from storage with error handling and decryption
 */
function initializeConfig() {
  try {
    // Check if chrome.runtime is available (extension context valid)
    if (!chrome || !chrome.runtime || !chrome.storage) {
      if (DEBUG_MODE) console.warn('Prompt Buddy: Chrome APIs not available');
      return;
    }
    
    chrome.storage.sync.get(['apiEndpoint', 'apiKey'], async function(result) {
      if (chrome.runtime.lastError) {
        if (DEBUG_MODE) console.warn('Prompt Buddy: Failed to load settings:', chrome.runtime.lastError);
        return;
      }
      
      try {
        if (result.apiEndpoint) {
          API_URL = await decryptData(result.apiEndpoint);
        }
        if (result.apiKey) {
          API_KEY = await decryptData(result.apiKey);
        }
      } catch (error) {
        if (DEBUG_MODE) console.warn('Prompt Buddy: Failed to decrypt settings:', error);
      }
    });
  } catch (error) {
    if (DEBUG_MODE) console.warn('Prompt Buddy: Storage access failed:', error);
  }
}

/**
 * Handle configuration changes with decryption
 */
async function handleConfigurationChanges(changes, namespace) {
  try {
    // Check if chrome.runtime is available (extension context valid)
    if (!chrome || !chrome.runtime) {
      if (DEBUG_MODE) console.warn('Prompt Buddy: Chrome APIs not available for config changes');
      return;
    }
    
    if (changes.apiEndpoint) {
      API_URL = await decryptData(changes.apiEndpoint.newValue);
    }
    if (changes.apiKey) {
      API_KEY = await decryptData(changes.apiKey.newValue);
    }
  } catch (error) {
    if (DEBUG_MODE) console.warn('Prompt Buddy: Failed to handle config changes:', error);
  }
}

/**
 * Listen for configuration changes with decryption
 */
try {
  if (chrome && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(handleConfigurationChanges);
  }
} catch (error) {
  if (DEBUG_MODE) console.warn('Prompt Buddy: Failed to register storage listener:', error);
}

// Initialize configuration
initializeConfig();

/**
 * Inject the Prompt Buddy panel into the page
 */
function injectPromptBuddyToggle() {
  try {
    if (document.getElementById('promptBuddyPanel')) return;
  
  const panel = document.createElement('div');
  panel.id = 'promptBuddyPanel';

  const isWindowedMode = window.innerWidth < CONFIG.PANEL_BREAKPOINT.width || 
                        window.innerHeight < CONFIG.PANEL_BREAKPOINT.height;
  const panelWidth = isWindowedMode ? '220px' : '280px';
  const panelPadding = isWindowedMode ? '16px' : '20px';
  
  Object.assign(panel.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '10000',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    padding: panelPadding,
    minWidth: panelWidth,
    maxWidth: panelWidth,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)'
  });


  const header = document.createElement('div');
  header.innerHTML = '🤖 Prompt Buddy';
  Object.assign(header.style, {
    color: '#fff',
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '16px',
    textAlign: 'center'
  });


  const toggleContainer = document.createElement('div');
  Object.assign(toggleContainer.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '16px',
    backdropFilter: 'blur(5px)'
  });

  const toggleLabel = document.createElement('span');
  toggleLabel.textContent = 'AI Power On';
  Object.assign(toggleLabel.style, {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500'
  });


  const toggleSwitch = document.createElement('label');
  Object.assign(toggleSwitch.style, {
    position: 'relative',
    display: 'inline-block',
    width: '50px',
    height: '24px',
    cursor: 'pointer'
  });

  const toggle = document.createElement('input');
  toggle.type = 'checkbox';
  toggle.id = 'promptBuddyToggle';
  Object.assign(toggle.style, {
    opacity: '0',
    width: '0',
    height: '0'
  });

  const slider = document.createElement('span');
  Object.assign(slider.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    background: 'rgba(255,255,255,0.3)',
    borderRadius: '24px',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  });

  const sliderButton = document.createElement('span');
  Object.assign(sliderButton.style, {
    position: 'absolute',
    content: '""',
    height: '18px',
    width: '18px',
    left: '3px',
    bottom: '3px',
    background: '#fff',
    borderRadius: '50%',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  });


  /**
   * Handle toggle state changes
   */
  function updateToggleState(isEnabled) {
    if (isEnabled) {
      slider.style.background = CONFIG.COLORS.primary;
      sliderButton.style.transform = 'translateX(26px)';
      // Show the panel
      panel.style.display = 'block';
    } else {
      slider.style.background = 'rgba(255,255,255,0.3)';
      sliderButton.style.transform = 'translateX(0px)';
      // Hide the panel  
      panel.style.display = 'none';
    }
  }

  /**
   * Handle toggle change events
   */
  function handleToggleChange() {
    const isEnabled = toggle.checked;
    try {
      if (chrome && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({ promptBuddyEnabled: isEnabled });
      }
    } catch (error) {
      if (DEBUG_MODE) console.warn('Prompt Buddy: Failed to save toggle state:', error);
    }
    updateToggleState(isEnabled);
    
    // Update extension icon based on state
    try {
      chrome.runtime.sendMessage({
        action: 'updateIcon',
        isActive: isEnabled
      }, function handleIconUpdateResponse(response) {
        // Handle potential extension context invalidation
        if (chrome.runtime.lastError) {
          if (chrome.runtime.lastError.message.includes('Extension context invalidated')) {
            if (DEBUG_MODE) console.log('Prompt Buddy: Extension reloaded, ignoring response');
            return;
          }
          if (DEBUG_MODE) console.warn('Prompt Buddy: Message error:', chrome.runtime.lastError);
        }
      });
    } catch (error) {
      if (error.message && error.message.includes('Extension context invalidated')) {
        if (DEBUG_MODE) console.log('Prompt Buddy: Extension context invalidated during icon update');
        return;
      }
      if (DEBUG_MODE) console.warn('Prompt Buddy: Failed to update icon:', error);
    }
  }

  toggle.addEventListener('change', handleToggleChange);

  /**
   * Load and initialize toggle state from storage
   */
  function loadInitialToggleState(result) {
    const isEnabled = result.promptBuddyEnabled || false;
    toggle.checked = isEnabled;
    updateToggleState(isEnabled);
    
    // updateToggleState already handles panel visibility, so no need to set it again
    
    // Ensure icon reflects current state on page load
    try {
      chrome.runtime.sendMessage({
        action: 'updateIcon',
        isActive: isEnabled
      }, function handleInitialIconResponse(response) {
        // Handle potential extension context invalidation
        if (chrome.runtime.lastError) {
          if (chrome.runtime.lastError.message.includes('Extension context invalidated')) {
            if (DEBUG_MODE) console.log('Prompt Buddy: Extension reloaded, ignoring initial icon response');
            return;
          }
          if (DEBUG_MODE) console.warn('Prompt Buddy: Initial icon message error:', chrome.runtime.lastError);
        }
      });
    } catch (error) {
      if (error.message && error.message.includes('Extension context invalidated')) {
        if (DEBUG_MODE) console.log('Prompt Buddy: Extension context invalidated during initial icon set');
        return;
      }
      if (DEBUG_MODE) console.warn('Prompt Buddy: Failed to set initial icon state:', error);
    }
  }

  // Load initial toggle state
  try {
    if (chrome && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(['promptBuddyEnabled'], loadInitialToggleState);
    }
  } catch (error) {
    if (DEBUG_MODE) console.warn('Prompt Buddy: Failed to load initial toggle state:', error);
  }

  slider.appendChild(sliderButton);
  toggleSwitch.appendChild(toggle);
  toggleSwitch.appendChild(slider);
  
  toggleContainer.appendChild(toggleLabel);
  toggleContainer.appendChild(toggleSwitch);


  const statusContainer = document.createElement('div');
  Object.assign(statusContainer.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
    gap: '8px'
  });

  const statusDot = document.createElement('div');
  statusDot.id = 'promptBuddyStatusDot';
  Object.assign(statusDot.style, {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: CONFIG.COLORS.primary,
    boxShadow: `0 0 10px ${CONFIG.COLORS.primary}, 0 0 20px ${CONFIG.COLORS.primary}, 0 0 30px ${CONFIG.COLORS.primary}`,
    animation: 'pulse 2s ease-in-out infinite'
  });

  const statusText = document.createElement('span');
  statusText.id = 'promptBuddyStatusText';
  statusText.textContent = 'ready';
  Object.assign(statusText.style, {
    color: CONFIG.COLORS.primary,
    fontSize: '11px',
    fontWeight: '500',
    textShadow: `0 0 5px ${CONFIG.COLORS.primary}`,
    textTransform: 'lowercase'
  });


  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
  `;
  document.head.appendChild(style);

  statusContainer.appendChild(statusDot);
  statusContainer.appendChild(statusText);


  panel.appendChild(header);
  panel.appendChild(statusContainer);
  panel.appendChild(toggleContainer);
  document.body.appendChild(panel);


  /**
   * Handle responsive panel sizing on window resize
   */
  function handlePanelResize() {
    const currentWindowedMode = window.innerWidth < CONFIG.PANEL_BREAKPOINT.width || 
                               window.innerHeight < CONFIG.PANEL_BREAKPOINT.height;
    const currentPanelWidth = currentWindowedMode ? '220px' : '280px';
    const currentPanelPadding = currentWindowedMode ? '16px' : '20px';
    
    panel.style.minWidth = currentPanelWidth;
    panel.style.maxWidth = currentPanelWidth;
    panel.style.padding = currentPanelPadding;
  }

  // Handle responsive panel sizing
  window.addEventListener('resize', handlePanelResize);
  
  } catch (error) {
    if (DEBUG_MODE) console.warn('Prompt Buddy: Failed to inject panel:', error);
  }
}

/**
 * Detect and return the prompt input box element
 * @returns {Element|Object|null} The input element or selection object
 */
function getPromptInputBox() {
  // Primary: ChatGPT's main textarea
  let input = document.querySelector('div#prompt-textarea.ProseMirror[contenteditable="true"]');
  if (input && input.offsetParent !== null) return input;

  // Fallback: Any visible contenteditable element with text
  input = Array.from(document.querySelectorAll('[contenteditable="true"]'))
    .find(el => el.offsetParent !== null && el.innerText.trim());
  if (input) return input;

  // Last resort: Use selected text
  const selection = window.getSelection().toString();
  if (selection.trim().length > 0) return { innerText: selection, isSelection: true };
  
  return null;
}

/**
 * Add the Engineer Prompt button to the panel
 */
function addPromptBuddyButton() {
  try {
    const input = document.querySelector('div#prompt-textarea.ProseMirror[contenteditable="true"]');
    const panel = document.getElementById('promptBuddyPanel');
    if (!input || !panel || document.getElementById('promptBuddyActionBtn')) return;

  const btn = document.createElement('button');
  btn.id = 'promptBuddyActionBtn';
  btn.innerHTML = "⚡ Engineer Prompt";
  Object.assign(btn.style, {
    width: '100%',
    padding: '12px 20px',
    background: `linear-gradient(135deg, ${CONFIG.COLORS.primary} 0%, ${CONFIG.COLORS.secondary} 100%)`,
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  });


  /**
   * Handle button hover effects
   */
  function handleButtonMouseEnter() {
    btn.style.transform = 'translateY(-2px)';
    btn.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.4)';
  }

  function handleButtonMouseLeave() {
    btn.style.transform = 'translateY(0px)';
    btn.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
  }

  btn.addEventListener('mouseenter', handleButtonMouseEnter);
  btn.addEventListener('mouseleave', handleButtonMouseLeave);

  /**
   * Handle the Engineer Prompt button click
   */
  async function handleEngineerPromptClick() {
    const toggle = document.getElementById('promptBuddyToggle');
    if (!toggle || !toggle.checked) {
      showBuddyStatus("⚠️ Turn ON Prompt Buddy toggle first!", true, 3000);
      return;
    }
    
    const raw = input.innerText.trim();
    if (!raw) {
      showBuddyStatus("⚠️ Type a prompt first!", true, 2000);
      return;
    }
    

    // Check cache first for instant response
    const cacheKey = raw.toLowerCase().trim();
    const cached = promptCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < CONFIG.CACHE_EXPIRY)) {
      input.innerText = cached.result;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
      showBuddyStatus("⚡ Instant result from cache!", false, 2000);
      return;
    }

    // Performance monitoring
    const startTime = Date.now();
    showBuddyStatus("⚡ Processing...", false, 0);
    
    input.setAttribute('contenteditable', 'false');
    input.innerText = "⚡ Prompt Buddy optimizing...";

    if (!chrome || !chrome.storage || !chrome.storage.sync) {
      input.setAttribute('contenteditable', 'true');
      input.innerText = raw;
      showBuddyStatus("❌ Extension storage not available. Please reload.", true, 4000);
      return;
    }
    
    chrome.storage.sync.get(['apiEndpoint', 'apiKey'], async function(result) {
      try {
        const API_URL = result.apiEndpoint ? await decryptData(result.apiEndpoint) : "";
        const API_KEY = result.apiKey ? await decryptData(result.apiKey) : "";
      

      
      if (!API_URL || !API_KEY) {
        input.setAttribute('contenteditable', 'true');
        input.innerText = raw;
        showBuddyStatus("❌ Configure API settings first! Click extension icon.", true, 4000);
        
        return;
      }
      
      const payload = {
        model: "gpt-4o-mini", // 60% faster than gpt-4o
        messages: [
          { 
            role: "system", 
            content: "You are Prompt Buddy. Quickly analyze and improve prompts. Reply with: [OPTIMIZED] + improved prompt, [DEBUG] + solution steps, or [ANALYSIS] + brief technical analysis. Be concise." 
          },
          { 
            role: "user", 
            content: raw 
          }
        ],
        max_tokens: 300, // Reduced for 2x faster response
        temperature: 0.2, // Lower for faster, deterministic responses
        stream: false
      };
      
      

      // Add timeout for faster failure detection
      const timeoutId = setTimeout(() => {
        input.setAttribute('contenteditable', 'true');
        input.innerText = raw;
        showBuddyStatus("⚠️ Request timeout. Try again.", true, 3000);
      }, CONFIG.REQUEST_TIMEOUT);

      chrome.runtime.sendMessage(
        {
          action: "callOpenAI",
          apiUrl: API_URL,
          apiKey: API_KEY,
          payload: payload,
          timeout: CONFIG.REQUEST_TIMEOUT
        },
        function(response) {
          // Handle extension context invalidation
          if (chrome.runtime.lastError) {
            if (chrome.runtime.lastError.message.includes('Extension context invalidated')) {
              input.setAttribute('contenteditable', 'true');
              input.innerText = raw;
              showBuddyStatus("⚠️ Extension reloaded. Please try again.", true, 3000);
              return;
            }
          }
          clearTimeout(timeoutId); // Clear timeout on response
          
          input.setAttribute('contenteditable', 'true');
          
          if (response.error) {
            input.innerText = raw;
            showBuddyStatus("❌ Error: " + response.error, true, 5000);
            return;
          }
          
          const out = response.data.choices &&
                      response.data.choices[0] &&
                      response.data.choices[0].message &&
                      response.data.choices[0].message.content
                        ? response.data.choices[0].message.content.trim()
                        : raw;
                        
          
          
          input.innerText = out;
          
          // Cache the result for future instant responses
          if (promptCache.size >= CONFIG.MAX_CACHE_SIZE) {
            const firstKey = promptCache.keys().next().value;
            promptCache.delete(firstKey);
          }
          promptCache.set(cacheKey, {
            result: out,
            timestamp: Date.now()
          });
    
          input.dispatchEvent(new Event('input', { bubbles: true }));
          
        
          input.focus();
          
          // Show performance metrics
          const responseTime = ((Date.now() - startTime) / 1000).toFixed(1);
          showBuddyStatus(`✅ Done in ${responseTime}s!`, false, 3000);
          
        }
      );
    } catch (error) {
      input.setAttribute('contenteditable', 'true');
      input.innerText = raw;
      if (DEBUG_MODE) console.warn('Prompt Buddy: Storage callback error:', error);
      showBuddyStatus("❌ Configuration error. Please check settings.", true, 4000);
    }
    });
  }

  // Assign the click handler
  btn.onclick = handleEngineerPromptClick;

  panel.appendChild(btn);
  
  } catch (error) {
    if (DEBUG_MODE) console.warn('Prompt Buddy: Failed to add button:', error);
  }
}

/**
 * Update the status indicator in the panel
 * @param {string} msg - The status message
 * @param {boolean} isError - Whether this is an error status
 * @param {number} timeoutMs - Auto-reset timeout in milliseconds
 */
function showBuddyStatus(msg, isError = false, timeoutMs = 4000) {
  const statusDot = document.getElementById('promptBuddyStatusDot');
  const statusText = document.getElementById('promptBuddyStatusText');
  if (!statusDot || !statusText) return;
  
  let color, displayText;
  
  if (isError) {
    color = CONFIG.COLORS.error;
    displayText = msg.toLowerCase();
  } else if (msg.includes('Processing') || msg.includes('working')) {
    color = CONFIG.COLORS.processing;
    displayText = 'working';
  } else if (msg.includes('Done') || msg.includes('✅') || msg.includes('complete')) {
    color = CONFIG.COLORS.primary;
    displayText = 'complete';
  } else {
    color = CONFIG.COLORS.primary;
    displayText = 'ready';
  }
  
  // Apply status styling
  statusDot.style.background = color;
  statusDot.style.boxShadow = `0 0 10px ${color}, 0 0 20px ${color}, 0 0 30px ${color}`;
  statusText.style.color = color;
  statusText.style.textShadow = `0 0 5px ${color}`;
  statusText.textContent = displayText;
  
  // Auto-reset to ready state
  if (timeoutMs > 0) {
    clearTimeout(statusDot._resetTimeout);
    statusDot._resetTimeout = setTimeout(() => {
      const readyColor = CONFIG.COLORS.primary;
      statusDot.style.background = readyColor;
      statusDot.style.boxShadow = `0 0 10px ${readyColor}, 0 0 20px ${readyColor}, 0 0 30px ${readyColor}`;
      statusText.style.color = readyColor;
      statusText.style.textShadow = `0 0 5px ${readyColor}`;
      statusText.textContent = 'ready';
    }, timeoutMs);
  }
}

/**
 * Initialize the extension when DOM is ready
 */
function initializeExtension() {
  try {
    // Mutation Observer for dynamic content changes
    const observer = new MutationObserver(() => {
      try {
        injectPromptBuddyToggle();
        addPromptBuddyButton();
      } catch (error) {
        if (DEBUG_MODE) console.warn('Prompt Buddy: Observer callback failed:', error);
      }
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
      injectPromptBuddyToggle();
      setTimeout(addPromptBuddyButton, 2000);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        try {
          observer.observe(document.body, { childList: true, subtree: true });
          injectPromptBuddyToggle();
          setTimeout(addPromptBuddyButton, 2000);
        } catch (error) {
          if (DEBUG_MODE) console.warn('Prompt Buddy: DOM ready initialization failed:', error);
        }
      });
    }
  } catch (error) {
    console.error('Prompt Buddy: Critical initialization failure:', error);
  }
}

/**
 * Detect the current platform
 * @returns {string} Platform name
 */
function getPlatform() {
  const hostname = window.location.hostname;
  if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) {
    return 'ChatGPT';
  }
  if (hostname.includes('cursor.so') || hostname.includes('cursor.dev')) {
    return 'Cursor';
  }
  return 'Unknown';
}

// Initialize the extension
initializeExtension();

// Store platform info for potential future use
const CURRENT_PLATFORM = getPlatform();

