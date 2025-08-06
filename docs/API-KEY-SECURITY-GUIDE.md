# 🔐 API Key Security Guide

## For Open Source Contributors & Users

This guide ensures your OpenAI API keys remain secure when working with the Prompt Buddy source code.

---

## 🚨 **CRITICAL: Never Commit API Keys**

**❌ NEVER DO THIS:**
```javascript
// DON'T hardcode API keys in source code
const API_KEY = "sk-1234567890abcdef..."; // SECURITY RISK!
```

**✅ DO THIS INSTEAD:**
Use the extension's built-in secure configuration system.

---

## 🛡️ **Secure Development Practices**

### **1. Use Environment Variables (Development)**

Create a `.env` file (use `env.example` as template):
```bash
# Copy the example file
cp env.example .env

# Edit with your actual keys
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_API_ENDPOINT=https://api.openai.com/v1/chat/completions
```

### **2. Configure Through Extension UI (Production)**

The extension provides a secure configuration interface:
1. Click the Prompt Buddy extension icon
2. Enter your API key in the popup
3. Keys are automatically encrypted with AES-256-GCM
4. Stored securely in Chrome's sync storage

### **3. Git Security Measures**

The `.gitignore` file prevents accidental commits:
```gitignore
# API Keys and Secrets
.env
.env.local
.env.production
config.local.js
api-keys.json
secrets.json
*.key
```

---

## 🔒 **How Prompt Buddy Protects Your Keys**

### **Military-Grade Encryption**
- **Algorithm**: AES-256-GCM (military standard)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Random IVs**: Cryptographically secure for each encryption
- **Local Storage**: Chrome sync storage (encrypted by Google)

### **Security Architecture**
```
Your API Key → AES-256-GCM Encryption → Chrome Sync Storage
                     ↓
            Decrypted only when needed for API calls
                     ↓
            Direct HTTPS connection to OpenAI
```

### **Zero Data Transmission**
- Keys never leave your device (except for OpenAI API calls)
- No external servers or analytics
- Complete user control

---

## ⚠️ **Security Recommendations**

### **For Developers**
1. **Never commit `.env` files** to version control
2. **Use environment variables** for development
3. **Review commits** before pushing to ensure no keys included
4. **Use separate API keys** for development and production

### **For Users**
1. **Generate dedicated API keys** for the extension
2. **Monitor API usage** in your OpenAI dashboard
3. **Revoke keys** if you suspect compromise
4. **Use Chrome's sync** to backup encrypted settings

### **For Organizations**
1. **Use separate OpenAI accounts** for different projects
2. **Implement API key rotation** policies
3. **Monitor usage** and set spending limits
4. **Train developers** on secure practices

---

## 🛠️ **Development Setup (Secure)**

```bash
# 1. Clone the repository
git clone https://github.com/Ripsyd/PromptBuddy-Extension.git
cd PromptBuddy-Extension

# 2. Set up environment (optional for development)
cp env.example .env
# Edit .env with your keys (never commit this file)

# 3. Load extension in Chrome
# - Open chrome://extensions/
# - Enable Developer mode
# - Load unpacked extension

# 4. Configure through UI (recommended)
# - Click extension icon
# - Enter API details in popup
# - Keys are automatically encrypted
```

---

## 🔍 **Security Audit Checklist**

Before contributing or deploying:

- [ ] No hardcoded API keys in source code
- [ ] `.env` files in `.gitignore`
- [ ] API keys configured through extension UI
- [ ] Encryption working properly
- [ ] No keys in commit history
- [ ] Separate keys for dev/prod environments

---

## 🚨 **If Your API Key is Compromised**

**Immediate Actions:**
1. **Revoke the key** in OpenAI dashboard
2. **Generate a new key**
3. **Update extension configuration**
4. **Review API usage** for unauthorized calls
5. **Check billing** for unexpected charges

**OpenAI Dashboard**: https://platform.openai.com/api-keys

---

## 📞 **Security Questions?**

- **Report Security Issues**: [GitHub Security](https://github.com/Ripsyd/PromptBuddy-Extension/security)
- **General Questions**: [GitHub Issues](https://github.com/Ripsyd/PromptBuddy-Extension/issues)
- **Developer Contact**: [GitHub Profile](https://github.com/Ripsyd)

---

## 🛡️ **Security Philosophy**

*"Security should be the default, not an option. Your API keys are your responsibility, and Prompt Buddy is designed to protect them with military-grade encryption while giving you complete control."*

**Remember**: The best security practice is the one you actually follow. Use the extension's built-in security features - they're designed to make security easy and automatic.
