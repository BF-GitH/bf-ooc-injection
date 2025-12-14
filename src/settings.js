// BF's OOC Injection - Settings Module

const EXTENSION_NAME = 'bf-ooc-injection';

let extensionSettings = null;
let messageCounter = 0;
let lastRollResults = [];

const DEFAULT_SETTINGS = {
    enabled: true,
    systemPrompt: {
        enabled: false,
        text: '',
        targets: [],
        triggerMode: 'always',
        chance: 100,
        interval: 1
    },
    generalMessage: {
        enabled: false,
        text: ''
    },
    categories: [
        {
            name: 'Max Word Count',
            enabled: true,
            triggerMode: 'always',
            chance: 100,
            interval: 1,
            options: [
                '40 words',
                '70 words',
                '100 words',
                '130 words',
                '170 words',
                '200 words'
            ]
        },
        {
            name: 'Plot Direction',
            enabled: true,
            triggerMode: 'always',
            chance: 100,
            interval: 1,
            options: [
                'Throw in a twist',
                'Reject the idea',
                'Accept and expand on it',
                'Add a complication',
                'Introduce a new element',
                'Slow down the pace',
                'Speed up the action'
            ]
        },
        {
            name: 'Character Behavior',
            enabled: true,
            triggerMode: 'always',
            chance: 100,
            interval: 1,
            options: [
                'Turn emotional',
                'Turn irrational',
                'Stay calm and logical',
                'Show vulnerability',
                'Become defensive',
                'Be playful or teasing',
                'Act suspicious'
            ]
        },
        {
            name: 'Scene Focus',
            enabled: true,
            triggerMode: 'always',
            chance: 100,
            interval: 1,
            options: [
                'Focus on dialogue',
                'Focus on internal thoughts',
                'Focus on physical actions',
                'Focus on environment details',
                'Balance all elements',
                'Focus on sensory details'
            ]
        },
        {
            name: 'Tone & Mood',
            enabled: true,
            triggerMode: 'always',
            chance: 100,
            interval: 1,
            options: [
                'Lighthearted and fun',
                'Tense and dramatic',
                'Intimate and personal',
                'Mysterious and suspenseful',
                'Melancholic and reflective',
                'Energetic and exciting',
                'Calm and peaceful'
            ]
        }
    ],
    formatting: {
        injectionMode: 'append',
        prefix: '',
        suffix: ''
    },
    showToast: true
};

export function getSettings() {
    return extensionSettings;
}

function saveSettings() {
    const context = SillyTavern.getContext();
    context.extensionSettings[EXTENSION_NAME] = extensionSettings;
    context.saveSettingsDebounced();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderCategories() {
    const container = $('#bf_ooc_categories_container');
    container.empty();

    if (!extensionSettings.categories || !Array.isArray(extensionSettings.categories)) {
        return;
    }

    extensionSettings.categories.forEach((category, index) => {
        const categoryHtml = `
            <div class="bf-ooc-category" data-index="${index}">
                <div class="bf-ooc-category-header">
                    <label class="checkbox_label">
                        <input type="checkbox" class="bf-ooc-cat-enabled" ${category.enabled ? 'checked' : ''} />
                        <input type="text" class="bf-ooc-cat-name text_pole" value="${escapeHtml(category.name)}" placeholder="Category name" />
                    </label>
                    <button class="bf-ooc-cat-delete menu_button" title="Delete category">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
                <div class="bf-ooc-trigger-settings">
                    <label class="checkbox_label" title="Always apply">
                        <input type="radio" name="bf_trigger_${index}" class="bf-ooc-trigger-mode" value="always" ${category.triggerMode === 'always' ? 'checked' : ''} />
                        <span>Always</span>
                    </label>
                    <label class="checkbox_label" title="Apply by chance %">
                        <input type="radio" name="bf_trigger_${index}" class="bf-ooc-trigger-mode" value="chance" ${category.triggerMode === 'chance' ? 'checked' : ''} />
                        <span>Chance %</span>
                        <input type="number" class="bf-ooc-cat-chance text_pole" value="${category.chance || 100}" min="0" max="100" ${category.triggerMode !== 'chance' ? 'disabled' : ''} />
                    </label>
                    <label class="checkbox_label" title="Apply every X messages">
                        <input type="radio" name="bf_trigger_${index}" class="bf-ooc-trigger-mode" value="interval" ${category.triggerMode === 'interval' ? 'checked' : ''} />
                        <span>Every X msg</span>
                        <input type="number" class="bf-ooc-cat-interval text_pole" value="${category.interval || 1}" min="1" ${category.triggerMode !== 'interval' ? 'disabled' : ''} />
                    </label>
                </div>
                <div class="bf-ooc-options-list">
                    ${category.options.map((option, optIndex) => `
                        <div class="bf-ooc-option" data-opt-index="${optIndex}">
                            <span class="bf-ooc-option-num">${optIndex + 1}.</span>
                            <input type="text" class="bf-ooc-option-text text_pole" value="${escapeHtml(option)}" />
                            <button class="bf-ooc-option-delete menu_button" title="Remove option">
                                <i class="fa-solid fa-minus"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                <button class="bf-ooc-add-option menu_button" title="Add option">
                    <i class="fa-solid fa-plus"></i> Add Option
                </button>
            </div>
        `;
        container.append(categoryHtml);
    });

    attachCategoryHandlers();
}

function loadSystemPromptTargets() {
    const container = $('#bf_system_targets_list');
    container.empty();

    try {
        const context = SillyTavern.getContext();

        // Get prompts from chatCompletionSettings
        const prompts = context.chatCompletionSettings?.prompts || [];
        console.log('[BFOOC] Total prompts found:', prompts.length);

        // Filter for system prompts
        const systemPrompts = prompts.filter(p => p && p.role === 'system');
        console.log('[BFOOC] System prompts found:', systemPrompts.length);

        if (systemPrompts.length === 0) {
            container.html('<small style="color: #888;">No system prompts found. Current prompts: ' + prompts.length + '</small>');
            return;
        }

        // Ensure targets array exists
        if (!extensionSettings.systemPrompt.targets) {
            extensionSettings.systemPrompt.targets = [];
        }

        // Render checkboxes for each system prompt
        systemPrompts.forEach((prompt, index) => {
            // Use identifier, name, or index as the unique ID
            const promptId = prompt.identifier || prompt.name || `system_${index}`;
            const promptName = prompt.name || prompt.identifier || `System Prompt ${index + 1}`;
            const isSelected = extensionSettings.systemPrompt.targets.includes(promptId);

            const promptHtml = `
                <label class="checkbox_label bf-system-target-item">
                    <input type="checkbox"
                           class="bf-system-target-checkbox"
                           data-prompt-id="${escapeHtml(promptId)}"
                           ${isSelected ? 'checked' : ''} />
                    <span>${escapeHtml(promptName)}</span>
                </label>
            `;
            container.append(promptHtml);
        });

        // Attach event handlers
        $('.bf-system-target-checkbox').off('change').on('change', function() {
            const promptId = $(this).data('prompt-id');
            const checked = $(this).prop('checked');

            if (!Array.isArray(extensionSettings.systemPrompt.targets)) {
                extensionSettings.systemPrompt.targets = [];
            }

            if (checked) {
                if (!extensionSettings.systemPrompt.targets.includes(promptId)) {
                    extensionSettings.systemPrompt.targets.push(promptId);
                }
            } else {
                extensionSettings.systemPrompt.targets =
                    extensionSettings.systemPrompt.targets.filter(id => id !== promptId);
            }

            saveSettings();
            console.log('[BFOOC] System prompt targets updated:', extensionSettings.systemPrompt.targets);
        });

        console.log('[BFOOC] Loaded', systemPrompts.length, 'system prompts');
    } catch (error) {
        console.error('[BFOOC] Error loading system prompt targets:', error);
        container.html('<small style="color: #f88;">Error: ' + error.message + '</small>');
    }
}

function attachCategoryHandlers() {
    $('.bf-ooc-cat-enabled').off('change').on('change', function() {
        const index = $(this).closest('.bf-ooc-category').data('index');
        extensionSettings.categories[index].enabled = $(this).prop('checked');
        saveSettings();
    });

    $('.bf-ooc-cat-name').off('change').on('change', function() {
        const index = $(this).closest('.bf-ooc-category').data('index');
        extensionSettings.categories[index].name = $(this).val();
        saveSettings();
    });

    $('.bf-ooc-trigger-mode').off('change').on('change', function() {
        const index = $(this).closest('.bf-ooc-category').data('index');
        const mode = $(this).val();
        extensionSettings.categories[index].triggerMode = mode;

        const categoryEl = $(this).closest('.bf-ooc-category');
        categoryEl.find('.bf-ooc-cat-chance').prop('disabled', mode !== 'chance');
        categoryEl.find('.bf-ooc-cat-interval').prop('disabled', mode !== 'interval');

        saveSettings();
    });

    $('.bf-ooc-cat-chance').off('change').on('change', function() {
        const index = $(this).closest('.bf-ooc-category').data('index');
        let value = parseInt($(this).val());
        if (isNaN(value)) value = 100;
        value = Math.max(0, Math.min(100, value));
        extensionSettings.categories[index].chance = value;
        $(this).val(value);
        saveSettings();
    });

    $('.bf-ooc-cat-interval').off('change').on('change', function() {
        const index = $(this).closest('.bf-ooc-category').data('index');
        let value = parseInt($(this).val());
        if (isNaN(value) || value < 1) value = 1;
        extensionSettings.categories[index].interval = value;
        $(this).val(value);
        saveSettings();
    });

    $('.bf-ooc-cat-delete').off('click').on('click', function() {
        const index = $(this).closest('.bf-ooc-category').data('index');
        extensionSettings.categories.splice(index, 1);
        saveSettings();
        renderCategories();
    });

    $('.bf-ooc-option-text').off('change').on('change', function() {
        const catIndex = $(this).closest('.bf-ooc-category').data('index');
        const optIndex = $(this).closest('.bf-ooc-option').data('opt-index');
        extensionSettings.categories[catIndex].options[optIndex] = $(this).val();
        saveSettings();
    });

    $('.bf-ooc-option-delete').off('click').on('click', function() {
        const catIndex = $(this).closest('.bf-ooc-category').data('index');
        const optIndex = $(this).closest('.bf-ooc-option').data('opt-index');
        extensionSettings.categories[catIndex].options.splice(optIndex, 1);
        saveSettings();
        renderCategories();
    });

    $('.bf-ooc-add-option').off('click').on('click', function() {
        const index = $(this).closest('.bf-ooc-category').data('index');
        extensionSettings.categories[index].options.push('New option');
        saveSettings();
        renderCategories();
    });
}

async function loadUI() {
    const path = `scripts/extensions/third-party/${EXTENSION_NAME}`;

    try {
        const html = await $.get(`${path}/templates/settings.html`);
        $('#extensions_settings').append(html);
    } catch (error) {
        console.error('[BFOOC] Failed to load UI:', error);
        return;
    }

    // Main toggle
    $('#bf_ooc_enabled').prop('checked', extensionSettings.enabled).on('change', function() {
        extensionSettings.enabled = $(this).prop('checked');
        saveSettings();
    });

    // System Prompt
    $('#bf_ooc_system_enabled').prop('checked', extensionSettings.systemPrompt.enabled).on('change', function() {
        extensionSettings.systemPrompt.enabled = $(this).prop('checked');
        const enabled = $(this).prop('checked');
        $('#bf_system_targets_container').toggle(enabled);
        if (enabled) {
            loadSystemPromptTargets();
        }
        saveSettings();
    });

    // Show/hide targets container based on initial state
    $('#bf_system_targets_container').toggle(extensionSettings.systemPrompt.enabled);
    if (extensionSettings.systemPrompt.enabled) {
        loadSystemPromptTargets();
    }

    // Refresh system prompts button
    $('#bf_refresh_system_targets').on('click', function() {
        loadSystemPromptTargets();
    });

    $('input[name="bf_system_trigger"]').each(function() {
        if ($(this).val() === extensionSettings.systemPrompt.triggerMode) {
            $(this).prop('checked', true);
        }
    }).on('change', function() {
        extensionSettings.systemPrompt.triggerMode = $(this).val();
        const mode = $(this).val();
        $('#bf_ooc_system_chance').prop('disabled', mode !== 'chance');
        $('#bf_ooc_system_interval').prop('disabled', mode !== 'interval');
        saveSettings();
    });

    $('#bf_ooc_system_chance').val(extensionSettings.systemPrompt.chance).on('change', function() {
        let value = parseInt($(this).val());
        if (isNaN(value)) value = 100;
        value = Math.max(0, Math.min(100, value));
        extensionSettings.systemPrompt.chance = value;
        $(this).val(value);
        saveSettings();
    });

    $('#bf_ooc_system_interval').val(extensionSettings.systemPrompt.interval).on('change', function() {
        let value = parseInt($(this).val());
        if (isNaN(value) || value < 1) value = 1;
        extensionSettings.systemPrompt.interval = value;
        $(this).val(value);
        saveSettings();
    });

    $('#bf_ooc_system_chance').prop('disabled', extensionSettings.systemPrompt.triggerMode !== 'chance');
    $('#bf_ooc_system_interval').prop('disabled', extensionSettings.systemPrompt.triggerMode !== 'interval');

    // General Message
    $('#bf_ooc_general_enabled').prop('checked', extensionSettings.generalMessage.enabled).on('change', function() {
        extensionSettings.generalMessage.enabled = $(this).prop('checked');
        saveSettings();
    });

    $('#bf_ooc_general_text').val(extensionSettings.generalMessage.text).on('change', function() {
        extensionSettings.generalMessage.text = $(this).val();
        saveSettings();
    });

    // Formatting
    $('#bf_ooc_injection_mode').val(extensionSettings.formatting.injectionMode).on('change', function() {
        extensionSettings.formatting.injectionMode = $(this).val();
        saveSettings();
    });

    $('#bf_ooc_separator').val(extensionSettings.formatting.separator).on('change', function() {
        extensionSettings.formatting.separator = $(this).val();
        saveSettings();
    });

    $('#bf_ooc_prefix').val(extensionSettings.formatting.prefix).on('change', function() {
        extensionSettings.formatting.prefix = $(this).val();
        saveSettings();
    });

    $('#bf_ooc_suffix').val(extensionSettings.formatting.suffix).on('change', function() {
        extensionSettings.formatting.suffix = $(this).val();
        saveSettings();
    });

    // Toast
    $('#bf_ooc_show_toast').prop('checked', extensionSettings.showToast).on('change', function() {
        extensionSettings.showToast = $(this).prop('checked');
        saveSettings();
    });

    // Add category button
    $('#bf_ooc_add_category').on('click', function() {
        extensionSettings.categories.push({
            name: 'New Category',
            enabled: true,
            triggerMode: 'always',
            chance: 100,
            interval: 1,
            options: ['Option 1']
        });
        saveSettings();
        renderCategories();
    });

    // Load defaults button
    $('#bf_ooc_load_defaults').on('click', function() {
        if (confirm('This will replace all current categories with the default roleplay categories. Continue?')) {
            extensionSettings.categories = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.categories));
            saveSettings();
            renderCategories();
            toastr.success('Default categories loaded!', 'BF OOC Injection');
            console.log('[BFOOC] Default categories loaded');
        }
    });

    renderCategories();
    console.log('[BFOOC] UI loaded');
}

export async function initSettings() {
    const context = SillyTavern.getContext();

    extensionSettings = context.extensionSettings[EXTENSION_NAME] || JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

    // Ensure all default properties exist
    if (!extensionSettings.systemPrompt) {
        extensionSettings.systemPrompt = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.systemPrompt));
    }
    if (!Array.isArray(extensionSettings.systemPrompt.targets)) {
        extensionSettings.systemPrompt.targets = [];
    }
    if (!extensionSettings.generalMessage) {
        extensionSettings.generalMessage = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.generalMessage));
    }
    if (!extensionSettings.formatting) {
        extensionSettings.formatting = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.formatting));
    }
    if (!Array.isArray(extensionSettings.categories) || extensionSettings.categories.length === 0) {
        extensionSettings.categories = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.categories));
        console.log('[BFOOC] Loaded default categories');
    }

    context.extensionSettings[EXTENSION_NAME] = extensionSettings;
    context.saveSettingsDebounced();

    await loadUI();
    console.log('[BFOOC] Settings initialized');
}

export function incrementMessageCounter() {
    messageCounter++;
    console.log(`[BFOOC] Message count: ${messageCounter}`);
}

export function resetMessageCounter() {
    messageCounter = 0;
}

function shouldTrigger(triggerMode, chance, interval) {
    if (triggerMode === 'always') {
        return true;
    }

    if (triggerMode === 'chance') {
        const roll = Math.random() * 100;
        return roll <= chance;
    }

    if (triggerMode === 'interval') {
        return messageCounter % interval === 0;
    }

    return false;
}

export function getOOCMessage() {
    try {
        if (!extensionSettings) {
            console.warn('[BFOOC] Settings not initialized');
            return '';
        }

        const systemPromptParts = [];
        const additionalParts = [];
        lastRollResults = [];

        // System Prompt - Extract content from selected system prompts
        if (extensionSettings.systemPrompt.enabled &&
            Array.isArray(extensionSettings.systemPrompt.targets) &&
            extensionSettings.systemPrompt.targets.length > 0) {

            if (shouldTrigger(
                extensionSettings.systemPrompt.triggerMode,
                extensionSettings.systemPrompt.chance,
                extensionSettings.systemPrompt.interval
            )) {
                // Get the actual system prompt content from SillyTavern context
                const context = SillyTavern.getContext();
                const prompts = context.chatCompletionSettings?.prompts || [];
                const systemPrompts = prompts.filter(p => p && p.role === 'system');

                // Extract content from selected system prompts
                for (const target of extensionSettings.systemPrompt.targets) {
                    const prompt = systemPrompts.find(p =>
                        (p.identifier && p.identifier === target) ||
                        (p.name && p.name === target)
                    );

                    if (prompt && prompt.content) {
                        const promptName = prompt.name || prompt.identifier || 'System';
                        const content = prompt.content.trim();

                        // Add the content without the prompt name
                        systemPromptParts.push(content);
                        console.log(`[BFOOC] Including system prompt: ${promptName}`);
                    }
                }
            }
        }

        // General Message
        if (extensionSettings.generalMessage.enabled &&
            extensionSettings.generalMessage.text &&
            extensionSettings.generalMessage.text.trim()) {
            additionalParts.push(`General: ${extensionSettings.generalMessage.text.trim()}`);
        }

        // Categories
        if (extensionSettings.categories && Array.isArray(extensionSettings.categories)) {
            for (const category of extensionSettings.categories) {
                if (!category || !category.enabled || !category.options || category.options.length === 0) {
                    continue;
                }

                if (!shouldTrigger(category.triggerMode || 'always', category.chance || 100, category.interval || 1)) {
                    continue;
                }

                const randomIndex = Math.floor(Math.random() * category.options.length);
                const selectedOption = category.options[randomIndex];

                if (selectedOption && selectedOption.trim()) {
                    additionalParts.push(`${category.name}: ${selectedOption.trim()}`);
                    lastRollResults.push({
                        category: category.name,
                        rolled: randomIndex + 1,
                        total: category.options.length
                    });
                }
            }
        }

        // Build the final output with sections
        const sections = [];

        if (systemPromptParts.length > 0) {
            sections.push('Systemprompt Reinject:\n' + systemPromptParts.join('\n'));
        }

        if (additionalParts.length > 0) {
            let additionalContent = additionalParts.join('\n');

            // Apply prefix/suffix to additional parts only
            if (extensionSettings.formatting.prefix && extensionSettings.formatting.prefix.trim()) {
                additionalContent = `${extensionSettings.formatting.prefix}\n${additionalContent}`;
            }
            if (extensionSettings.formatting.suffix && extensionSettings.formatting.suffix.trim()) {
                additionalContent = `${additionalContent}\n${extensionSettings.formatting.suffix}`;
            }

            sections.push('Additional Prompt Injection:\n' + additionalContent);
        }

        if (sections.length === 0) {
            return '';
        }

        const output = `\nBF OOC Injection:\n\n${sections.join('\n\n')}`;
        console.log(`[BFOOC] Generated OOC:${output}`);

        return output;
    } catch (error) {
        console.error('[BFOOC] Error generating OOC:', error);
        return '';
    }
}

export function showRollToast() {
    if (!extensionSettings || !extensionSettings.showToast || lastRollResults.length === 0) {
        return;
    }

    const lines = lastRollResults.map(r => `<b>${r.category}:</b> ${r.rolled}/${r.total}`);
    const html = lines.join('<br>');

    toastr.info(html, "BF's OOC Roll", {
        escapeHtml: false,
        timeOut: 3000,
        extendedTimeOut: 1000
    });
}
