# Prompt Buddy

**One toggle. Auto-engineer every ChatGPT prompt with GPT intelligence. No drama, no bloat, just better prompts.**

## Design Philosophy

“Plain talk in. Engineer-grade prompts out.”

Prompt Buddy delivers exactly that:
- **One toggle**: Enable/disable with beautiful glassmorphism panel
- **Auto-intercept**: Every prompt you type gets automatically engineered
- **Zero failures**: Clear error messages, no mysterious black holes
- **Minimal UI**: Beautiful, modern interface with maximum impact

## How It Works

1. **Install** the extension
2. **Configure** your API endpoint and key
3. **Toggle ON** the beautiful floating panel on ChatGPT
4. **Type any prompt** and click "⚡ Engineer Prompt"
5. **Watch** as Prompt Buddy auto-engineers it before sending

When the toggle is ON, Prompt Buddy intercepts every prompt on ChatGPT, sends it to your API, and replaces it with the optimized/debugged/analyzed version. GPT-4o decides what your prompt needs.

## Supported Platforms

- **ChatGPT**: chat.openai.com, chatgpt.com
- **Future**: Cursor web support planned

## Installation

1. Download or clone this repository
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" → select the extension folder
5. Done! The extension is ready.

## Configuration

Click the Prompt Buddy extension icon and enter:
- **API Endpoint**: `https://api.openai.com/v1/chat/completions`
- **API Key**: Your OpenAI API key

## Features

- **🎨 Beautiful glassmorphism UI**: Modern gradient panel with iOS-style toggle
- **⚡ One-click engineering**: Integrated button with hover effects
- **🔄 Real-time status**: Live updates with color-coded feedback
- **📱 Minimizable panel**: Collapse to save screen space
- **🛡️ CORS-free architecture**: Background service worker handles API calls
- **🎯 Smart detection**: Bulletproof ChatGPT input detection
- **💾 Persistent settings**: Remembers your configuration and toggle state

## Technical Achievements

- **Direct DOM manipulation** bypassing React/ProseMirror event blocking
- **Background service worker** for API calls (no CORS issues)
- **MutationObserver** for robust UI injection
- **Comprehensive error handling** and user feedback
- **Modern Chrome Extension Manifest V3** compliance

## API Integration

The extension uses OpenAI's GPT-4o with this system prompt:

> "You are Prompt Buddy, an expert prompt engineer, code debugger, and analyst. When a user sends a prompt, intelligently determine if it is a bug report, a feature request, or a prompt to optimize. Reply with an improved, more technical version of the prompt if optimization is needed, a step-by-step debugging guide if a bug, or an engineering-level analysis if a feature. Start each response with one of: [OPTIMIZED], [DEBUG], or [ANALYSIS]."

## Privacy & Security

- All configuration stored locally in Chrome sync storage
- No data collection or tracking
- Direct communication with your API only
- Open source and auditable
- Zero secrets in source code

## Troubleshooting

**Panel not appearing?**
- Refresh ChatGPT page
- Check browser console for errors

**Button not working?**
- Ensure toggle is ON (green)
- Verify API configuration in extension popup
- Check console for error messages

**API errors?**
- Verify your OpenAI API key is valid
- Check you have sufficient API credits
- Ensure endpoint URL is correct

## Version History

**v1.0 - PRODUCTION READY** 🚀
- Beautiful glassmorphism UI with gradient backgrounds
- Modern iOS-style toggle switch with smooth animations  
- Integrated 'Engineer Prompt' button with hover effects
- CORS-free background script architecture
- Real-time status updates with color coding
- GPT-4o powered prompt engineering

## License

MIT License - Build upon it, improve it, make it yours.

---

**Design Philosophy Fulfilled:**
*"Just make it work, no drama, no bloat. One toggle. One button. Actual intelligence."*

**Status: PRODUCTION READY ✅**

*Built for builders who want results, not complexity.*