// == Prompt Buddy Chrome Extension Content Script ==
// Purpose: One toggle. When ON, intercept every ChatGPT prompt and route it through your API for auto debug/analyze/optimize.
// You only need to set your API endpoint and key in the CONFIG section below.

///////////////////////
// --- CONFIG --- //
///////////////////////
let API_URL = "";
let API_KEY = "";

// Load from Chrome Storage at startup
chrome.storage.sync.get(['apiEndpoint', 'apiKey'], function(result) {
  if (result.apiEndpoint) API_URL = result.apiEndpoint;
  if (result.apiKey) API_KEY = result.apiKey;
});

// Listen for storage changes (if user updates in popup)
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (changes.apiEndpoint) API_URL = changes.apiEndpoint.newValue;
  if (changes.apiKey) API_KEY = changes.apiKey.newValue;
});

//////////////////////////////////////
// --- Inject Beautiful Prompt Buddy Panel --- //
//////////////////////////////////////
function injectPromptBuddyToggle() {
  if (document.getElementById('promptBuddyPanel')) return;
  
  // Create main panel
  const panel = document.createElement('div');
  panel.id = 'promptBuddyPanel';
  Object.assign(panel.style, {
    position: 'fixed',
    top: '50%',
    right: '20px',
    transform: 'translateY(-50%)',
    zIndex: '10000',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    padding: '20px',
    minWidth: '280px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)'
  });

  // Header
  const header = document.createElement('div');
  header.innerHTML = '🤖 Prompt Buddy';
  Object.assign(header.style, {
    color: '#fff',
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '16px',
    textAlign: 'center'
  });

  // Toggle container
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

  // Modern toggle switch
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

  // Toggle functionality
  toggle.addEventListener('change', function() {
    chrome.storage.sync.set({ promptBuddyEnabled: toggle.checked });
    if (toggle.checked) {
      slider.style.background = '#4ade80';
      sliderButton.style.transform = 'translateX(26px)';
    } else {
      slider.style.background = 'rgba(255,255,255,0.3)';
      sliderButton.style.transform = 'translateX(0px)';
    }
  });

  // Load saved state
  chrome.storage.sync.get(['promptBuddyEnabled'], function(result) {
    toggle.checked = result.promptBuddyEnabled || false;
    if (toggle.checked) {
      slider.style.background = '#4ade80';
      sliderButton.style.transform = 'translateX(26px)';
    }
  });

  slider.appendChild(sliderButton);
  toggleSwitch.appendChild(toggle);
  toggleSwitch.appendChild(slider);
  
  toggleContainer.appendChild(toggleLabel);
  toggleContainer.appendChild(toggleSwitch);

  // Neon status dot in bottom right corner
  const statusContainer = document.createElement('div');
  Object.assign(statusContainer.style, {
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  });

  const statusDot = document.createElement('div');
  statusDot.id = 'promptBuddyStatusDot';
  Object.assign(statusDot.style, {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#4ade80',
    boxShadow: '0 0 10px #4ade80, 0 0 20px #4ade80, 0 0 30px #4ade80',
    animation: 'pulse 2s ease-in-out infinite'
  });

  const statusText = document.createElement('span');
  statusText.id = 'promptBuddyStatusText';
  statusText.textContent = 'Ready';
  Object.assign(statusText.style, {
    color: '#4ade80',
    fontSize: '10px',
    fontWeight: '500',
    textShadow: '0 0 5px #4ade80',
    textTransform: 'capitalize'
  });

  // Add CSS animation for neon pulse effect
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

  // Minimize button
  const minimizeBtn = document.createElement('button');
  minimizeBtn.innerHTML = '−';
  Object.assign(minimizeBtn.style, {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  });

  let isMinimized = false;
  minimizeBtn.addEventListener('click', function() {
    isMinimized = !isMinimized;
    if (isMinimized) {
      header.style.display = 'none';
      toggleContainer.style.display = 'none';
      statusContainer.style.display = 'none';
      panel.style.minWidth = '60px';
      panel.style.padding = '12px';
      minimizeBtn.innerHTML = '+';
    } else {
      header.style.display = 'block';
      toggleContainer.style.display = 'flex';
      statusContainer.style.display = 'flex';
      panel.style.minWidth = '280px';
      panel.style.padding = '20px 20px 40px 20px';
      minimizeBtn.innerHTML = '−';
    }
  });

  panel.appendChild(minimizeBtn);
  panel.appendChild(header);
  panel.appendChild(toggleContainer);
  panel.appendChild(statusContainer);
  document.body.appendChild(panel);
}

//////////////////////////////////////
// --- Input Box Detection --- //
//////////////////////////////////////
function getPromptInputBox() {
  // Explicitly target the current ChatGPT input box (Aug 2025)
  let input = document.querySelector('div#prompt-textarea.ProseMirror[contenteditable="true"]');
  if (input && input.offsetParent !== null) return input;

  // Fallback: any visible contenteditable with non-empty text
  input = Array.from(document.querySelectorAll('[contenteditable="true"]'))
    .find(el => el.offsetParent !== null && el.innerText.trim());
  if (input) return input;

  // Fallback: user selection
  const sel = window.getSelection().toString();
  if (sel.trim().length > 0) return { innerText: sel, isSelection: true };
  return null;
}

//////////////////////////////////////
// --- Add Engineer Button to Panel --- //
//////////////////////////////////////
function addPromptBuddyButton() {
  const input = document.querySelector('div#prompt-textarea.ProseMirror[contenteditable="true"]');
  const panel = document.getElementById('promptBuddyPanel');
  if (!input || !panel || document.getElementById('promptBuddyActionBtn')) return;

  // Create the engineer button
  const btn = document.createElement('button');
  btn.id = 'promptBuddyActionBtn';
  btn.innerHTML = "⚡ Engineer Prompt";
  Object.assign(btn.style, {
    width: '100%',
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
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

  // Hover effects
  btn.addEventListener('mouseenter', function() {
    btn.style.transform = 'translateY(-2px)';
    btn.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.4)';
  });

  btn.addEventListener('mouseleave', function() {
    btn.style.transform = 'translateY(0px)';
    btn.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
  });

  btn.onclick = async function() {
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
    
    // UI: show working indicator
    showBuddyStatus("Prompt Buddy thinking…");
    
    input.setAttribute('contenteditable', 'false');
    input.innerText = "Prompt Buddy is engineering your prompt…";

    chrome.storage.sync.get(['apiEndpoint', 'apiKey'], function(result) {
      const API_URL = result.apiEndpoint || "";
      const API_KEY = result.apiKey || "";
      
      console.log("🔧 Prompt Buddy Debug - Configuration:", {
        API_URL: API_URL,
        API_KEY: API_KEY ? `${API_KEY.substring(0, 10)}...` : "MISSING",
        prompt: raw
      });
      
      if (!API_URL || !API_KEY) {
        input.setAttribute('contenteditable', 'true');
        input.innerText = raw;
        showBuddyStatus("❌ Configure API settings first! Click extension icon.", true, 4000);
        console.log("❌ Missing API configuration");
        return;
      }
      
      const payload = {
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "You are Prompt Buddy, an expert prompt engineer, code debugger, and analyst. When a user sends a prompt, intelligently determine if it is a bug report, a feature request, or a prompt to optimize. Reply with an improved, more technical version of the prompt if optimization is needed, a step-by-step debugging guide if a bug, or an engineering-level analysis if a feature. Start each response with one of: [OPTIMIZED], [DEBUG], or [ANALYSIS]." 
          },
          { 
            role: "user", 
            content: raw 
          }
        ],
        max_tokens: 512,
        temperature: 0.4
      };
      
      console.log("🚀 Sending message to background script:", { API_URL, payload });

      chrome.runtime.sendMessage(
        {
          action: "callOpenAI",
          apiUrl: API_URL,
          apiKey: API_KEY,
          payload: payload
        },
        function(response) {
          console.log("📡 Background response:", response);
          
          input.setAttribute('contenteditable', 'true');
          
          if (response.error) {
            input.innerText = raw;
            showBuddyStatus("❌ Error: " + response.error, true);
            alert("Prompt Buddy failed: " + response.error);
            console.log("❌ Final error:", response.error);
            return;
          }
          
          const out = response.data.choices &&
                      response.data.choices[0] &&
                      response.data.choices[0].message &&
                      response.data.choices[0].message.content
                        ? response.data.choices[0].message.content.trim()
                        : raw;
                        
          console.log("✅ Extracted result:", out);
          
          input.innerText = out;
          
          // Trigger input event to notify ChatGPT
          input.dispatchEvent(new Event('input', { bubbles: true }));
          
          // Focus and select all for easy copying/editing
          input.focus();
          
          showBuddyStatus("✅ Prompt engineered!", false, 2000);
          console.log("✅ Prompt Buddy completed successfully!");
        }
      );
    });
  };

  // Add button to the panel
  panel.appendChild(btn);
}

//////////////////////////////////////
// --- Integrated Status System --- //
//////////////////////////////////////
function showBuddyStatus(msg, isError = false, timeoutMs = 4000) {
  const statusDot = document.getElementById('promptBuddyStatusDot');
  const statusText = document.getElementById('promptBuddyStatusText');
  if (!statusDot || !statusText) return;
  
  // Update the neon dot and text based on status
  if (isError) {
    statusDot.style.background = '#ef4444';
    statusDot.style.boxShadow = '0 0 10px #ef4444, 0 0 20px #ef4444, 0 0 30px #ef4444';
    statusText.style.color = '#ef4444';
    statusText.style.textShadow = '0 0 5px #ef4444';
    statusText.textContent = msg.charAt(0).toUpperCase() + msg.slice(1).toLowerCase();
  } else if (msg.includes('thinking') || msg.includes('engineering')) {
    statusDot.style.background = '#3b82f6';
    statusDot.style.boxShadow = '0 0 10px #3b82f6, 0 0 20px #3b82f6, 0 0 30px #3b82f6';
    statusText.style.color = '#3b82f6';
    statusText.style.textShadow = '0 0 5px #3b82f6';
    statusText.textContent = 'Working';
  } else if (msg.includes('engineered') || msg.includes('✅')) {
    statusDot.style.background = '#4ade80';
    statusDot.style.boxShadow = '0 0 10px #4ade80, 0 0 20px #4ade80, 0 0 30px #4ade80';
    statusText.style.color = '#4ade80';
    statusText.style.textShadow = '0 0 5px #4ade80';
    statusText.textContent = 'Complete';
  } else {
    statusDot.style.background = '#4ade80';
    statusDot.style.boxShadow = '0 0 10px #4ade80, 0 0 20px #4ade80, 0 0 30px #4ade80';
    statusText.style.color = '#4ade80';
    statusText.style.textShadow = '0 0 5px #4ade80';
    statusText.textContent = 'Ready';
  }
  
  // Reset to ready state after timeout
  if (timeoutMs > 0) {
    clearTimeout(statusDot._resetTimeout);
    statusDot._resetTimeout = setTimeout(() => {
      statusDot.style.background = '#4ade80';
      statusDot.style.boxShadow = '0 0 10px #4ade80, 0 0 20px #4ade80, 0 0 30px #4ade80';
      statusText.style.color = '#4ade80';
      statusText.style.textShadow = '0 0 5px #4ade80';
      statusText.textContent = 'Ready';
    }, timeoutMs);
  }
}

//////////////////////////////////////
// --- Mutation Observer for Robustness --- //
//////////////////////////////////////
const observer = new MutationObserver(() => {
  injectPromptBuddyToggle();
  addPromptBuddyButton();
});

// Start observing when DOM is ready
if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
  injectPromptBuddyToggle();
  // Add button after panel loads
  setTimeout(addPromptBuddyButton, 2000);
} else {
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { childList: true, subtree: true });
    injectPromptBuddyToggle();
    // Add button after panel loads
    setTimeout(addPromptBuddyButton, 2000);
  });
}

///////////////////////
// That's it!
///////////////////////

// Detect platform and log
const platform = window.location.hostname.includes('openai.com') || window.location.hostname.includes('chatgpt.com') ? 'ChatGPT' :
                 window.location.hostname.includes('cursor.so') || window.location.hostname.includes('cursor.dev') ? 'Cursor' : 'Unknown';

console.log(`Prompt Buddy content script loaded and ready on ${platform}!`);

// When the toggle is ON, Prompt Buddy will intercept and auto-engineer any prompt you type. You only need to supply your API details.
// -- End of file --