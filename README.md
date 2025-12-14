# BF's OOC Injection

Dynamically inject hidden instructions into your messages for better LLM control.

---

## Why Use This?

**Break repetitive patterns**: LLMs fall into predictable behaviors. Add automatic randomization with one-time setup.

**Works with Claude Prompt Caching**: Unlike Author's Note, this is fully compatible with Claude's caching system.

**Reinforce system prompts**: System prompts at the top of context lose relevance over time. Selectively reinject them into recent messages.

**Clean chat history**: Injected content isn't saved to history—only sent with the current message. No token bloat, no permanent clutter.

**Background steering**: Add dynamic elements without manual intervention each message.

---

## Features

### System Prompt Reinjection
Extract content from your SillyTavern system prompts and reinject into user messages.

- Extension finds all system prompts from SillyTavern's prompt manager
- Select which prompts to extract via checkboxes
- Content is injected based on trigger conditions (Always/Chance/Interval)

### General Message
Static instruction included on every message when enabled.

### Random Categories
Create categories with multiple options—one random option is picked per message.

**Default categories included:**
- Max Word Count (40, 70, 100, 130, 170, 200 words)
- Plot Direction (add twists, complications, pace changes)
- Character Behavior (emotional, logical, vulnerable, defensive)
- Scene Focus (dialogue, thoughts, actions, environment)
- Tone & Mood (lighthearted, tense, intimate, mysterious)

Click "Load Defaults" to get all 5 categories instantly.

---

## Installation

### Easy Method (Recommended)
1. Open SillyTavern
2. Go to **Extensions** → **Install Extension**
3. Paste this URL: `https://github.com/BF-GitH/bf-ooc-injection`
4. Click **Install**
5. Enable the extension in Extensions settings

### Manual Method
1. Download and extract the repository
2. Place `bf-ooc-injection` folder in: `SillyTavern/public/scripts/extensions/third-party/`
3. Restart SillyTavern
4. Enable in Extensions settings

---

## Usage

### System Prompt Reinjection
1. Enable "System Prompt"
2. Choose trigger mode (Always/Chance %/Every X msg)
3. Check boxes next to system prompts you want to extract
4. Content appears under "Systemprompt Reinject:" section

**How it works**: Extension accesses `chatCompletionSettings.prompts`, filters for `role === 'system'`, and displays them by name/identifier. Selected prompts have their content extracted and injected into user messages.

### General Message
1. Enable "General Message"
2. Enter static text
3. Appears under "Additional Prompt Injection:" section

### Random Categories
1. Click "Load Defaults" for 5 roleplay categories, or
2. Click "Add Category" to create custom ones
3. Name it, choose trigger mode, add options
4. One random option picked per message

---

## Technical Details

**Injection point**: Last user message during `CHAT_COMPLETION_PROMPT_READY` event
**Chat history**: Content NOT saved—only sent with current request
**Caching**: Generated once per message and cached for consistency
**Claude compatible**: Works with Prompt Caching (unlike Author's Note)

---

## Support the Project

If you find this extension helpful and want to support continued development, consider buying me a coffee! ☕

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/bf_gith)

Your support helps keep this project maintained and enables me to create more useful tools for the SillyTavern community. Every contribution is greatly appreciated!

---

## Version
1.0.0

## License
MIT
