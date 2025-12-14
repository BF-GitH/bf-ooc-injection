// BF's OOC Injection - Injector Module

import { getSettings, getOOCMessage, showRollToast, incrementMessageCounter } from './settings.js';

const OOC_MARKER = 'BF OOC Injection:';

let injectionCompleted = false;
let cachedOOC = null;

export function initInjector() {
    const context = SillyTavern.getContext();

    if (!context || !context.eventSource || !context.eventTypes) {
        console.error('[BFOOC] Failed to get SillyTavern context');
        return;
    }

    const { eventSource, eventTypes } = context;

    eventSource.on(eventTypes.USER_MESSAGE_RENDERED, () => {
        incrementMessageCounter();
        console.log('[BFOOC] User message rendered - counter incremented');
    });

    eventSource.on(eventTypes.GENERATION_STARTED, () => {
        injectionCompleted = false;
        cachedOOC = null;
        console.log('[BFOOC] Generation started - reset state');
    });

    // For chat completion APIs (OpenAI, Claude, etc.)
    eventSource.on(eventTypes.CHAT_COMPLETION_PROMPT_READY, (data) => {
        handlePromptReady(data);
    });

    // For text completion APIs (AI Horde, KoboldAI, etc.)
    // Use GENERATE_AFTER_DATA which passes the full context we can modify
    eventSource.on(eventTypes.GENERATE_AFTER_DATA, (data) => {
        handleTextCompletionPrompt(data);
    });

    console.log('[BFOOC] Injector initialized');
}

function getCachedOOC() {
    if (cachedOOC !== null) {
        return cachedOOC;
    }

    const ooc = getOOCMessage();
    if (!ooc || ooc.trim().length === 0) {
        cachedOOC = null;
        return null;
    }

    cachedOOC = ooc;
    return ooc;
}

function shouldTriggerSystemPrompt(settings) {
    const { triggerMode, chance, interval } = settings.systemPrompt;

    if (triggerMode === 'always') {
        return true;
    }

    if (triggerMode === 'chance') {
        const roll = Math.random() * 100;
        return roll < chance;
    }

    if (triggerMode === 'interval') {
        // This would need a counter, but for now we'll use the same message counter
        // that's used for categories. We'd need to import/access it properly.
        // For simplicity, always trigger for now - can be enhanced later
        return true;
    }

    return false;
}

function injectIntoSystemPrompts(data, settings) {
    // System prompts are now extracted and included in user message OOC
    // This function is no longer needed but kept for compatibility
    return;
}

function injectIntoSystemMessages(messages, targets, oocContent) {
    let count = 0;
    const separator = '\n\n';

    for (const msg of messages) {
        if (!msg || msg.role !== 'system') {
            continue;
        }

        // Check if this system message has an identifier that matches our targets
        // The identifier might be in msg.identifier or we might need to match by content/name
        const identifier = msg.identifier || msg.name;

        if (!identifier || !targets.includes(identifier)) {
            continue;
        }

        // Skip if already injected
        if (typeof msg.content === 'string' && msg.content.includes(OOC_MARKER)) {
            continue;
        }

        // Inject into string content
        if (typeof msg.content === 'string') {
            msg.content = msg.content + separator + oocContent;
            count++;
            console.log(`[BFOOC] Injected into system prompt: ${identifier}`);
        }
    }

    return count;
}

function handlePromptReady(data) {
    try {
        console.log('[BFOOC] Prompt ready event fired');

        if (injectionCompleted) {
            console.log('[BFOOC] Already injected this cycle, skipping');
            return;
        }

        const settings = getSettings();
        if (!settings || !settings.enabled) {
            console.log('[BFOOC] Extension disabled, skipping');
            return;
        }

        if (data && data.dryRun) {
            console.log('[BFOOC] Dry run detected, skipping');
            return;
        }

        // Handle system prompt injection into selected targets
        injectIntoSystemPrompts(data, settings);

        const ooc = getCachedOOC();
        if (!ooc) {
            console.log('[BFOOC] No OOC content generated');
            return;
        }

        let success = false;

        if (data && data.chat && Array.isArray(data.chat)) {
            console.log('[BFOOC] Attempting injection into data.chat, length:', data.chat.length);
            success = injectIntoLastUserMessage(data.chat, ooc, settings);
        }

        if (!success && data && data.messages && Array.isArray(data.messages)) {
            console.log('[BFOOC] Attempting injection into data.messages, length:', data.messages.length);
            success = injectIntoLastUserMessage(data.messages, ooc, settings);
        }

        if (success) {
            injectionCompleted = true;
            showRollToast();
            console.log('[BFOOC] Injection successful');
        } else {
            console.log('[BFOOC] Injection failed - no suitable user message found');
        }
    } catch (error) {
        console.error('[BFOOC] Error in handlePromptReady:', error);
    }
}

function injectIntoLastUserMessage(messages, ooc, settings) {
    try {
        // Always use double newline for spacing
        const separator = '\n\n';

        // Find last user message
        let lastUserIndex = -1;
        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            if (!msg) continue;

            if (msg.role === 'user') {
                lastUserIndex = i;
                break;
            }
        }

        if (lastUserIndex === -1) {
            console.log('[BFOOC] No user message found');
            return false;
        }

        const msg = messages[lastUserIndex];
        console.log('[BFOOC] Found user message at index', lastUserIndex);

        // Handle string content
        if (typeof msg.content === 'string') {
            if (msg.content.includes(OOC_MARKER)) {
                console.log('[BFOOC] Message already contains OOC marker, skipping');
                return false;
            }

            const originalContent = msg.content;

            if (settings.formatting.injectionMode === 'prepend') {
                msg.content = ooc + separator + originalContent;
            } else {
                msg.content = originalContent + separator + ooc;
            }

            console.log('[BFOOC] Injected into string content, length:', originalContent.length, '->', msg.content.length);
            return true;
        }

        // Handle array content (multimodal)
        if (Array.isArray(msg.content)) {
            for (let part of msg.content) {
                if (part && part.type === 'text' && typeof part.text === 'string') {
                    if (part.text.includes(OOC_MARKER)) {
                        console.log('[BFOOC] Message already contains OOC marker, skipping');
                        return false;
                    }

                    const originalText = part.text;

                    if (settings.formatting.injectionMode === 'prepend') {
                        part.text = ooc + separator + originalText;
                    } else {
                        part.text = originalText + separator + ooc;
                    }

                    console.log('[BFOOC] Injected into array content');
                    return true;
                }
            }
        }

        return false;
    } catch (error) {
        console.error('[BFOOC] Error in injectIntoLastUserMessage:', error);
        return false;
    }
}

function handleTextCompletionPrompt(data) {
    try {
        console.log('[BFOOC] Text completion prompt event fired');

        if (injectionCompleted) {
            console.log('[BFOOC] Already injected this cycle, skipping');
            return;
        }

        const settings = getSettings();
        if (!settings || !settings.enabled) {
            console.log('[BFOOC] Extension disabled, skipping');
            return;
        }

        const ooc = getCachedOOC();
        if (!ooc) {
            console.log('[BFOOC] No OOC content generated');
            return;
        }

        // Check if data has a prompt property we can modify
        if (!data || typeof data.prompt !== 'string') {
            console.log('[BFOOC] No prompt string found in data');
            return;
        }

        // Check if already injected
        if (data.prompt.includes(OOC_MARKER)) {
            console.log('[BFOOC] Prompt already contains OOC marker, skipping');
            return;
        }

        const separator = '\n\n';

        // Modify the prompt in place
        if (settings.formatting.injectionMode === 'prepend') {
            data.prompt = ooc + separator + data.prompt;
        } else {
            data.prompt = data.prompt + separator + ooc;
        }

        injectionCompleted = true;
        showRollToast();
        console.log('[BFOOC] Text completion injection successful, new length:', data.prompt.length);
    } catch (error) {
        console.error('[BFOOC] Error in handleTextCompletionPrompt:', error);
    }
}
