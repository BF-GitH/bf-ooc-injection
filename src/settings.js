// BF's OOC Injection - Settings Module

const EXTENSION_NAME = 'bf-ooc-injection';

let extensionSettings = null;
let messageCounter = 0;
let lastRollResults = [];

const DEFAULT_SETTINGS = {
    enabled: true,
    currentPreset: 'Default',
    presets: {},
    systemPrompt: {
        enabled: true,
        text: '',
        targets: [],
        triggerMode: 'always',
        chance: 100,
        interval: 1
    },
    generalMessage: {
        enabled: true,
        text: 'Remember your System prompt and act like it'
    },
    categoriesEnabled: true,
    categories: [
        {
            name: 'Max Word Count',
            enabled: true,
            triggerMode: 'always',
            chance: 100,
            interval: 1,
            options: [
                { tag: '40', text: '40 words' },
                { tag: '70', text: '70 words' },
                { tag: '100', text: '100 words' },
                { tag: '130', text: '130 words' },
                { tag: '170', text: '170 words' },
                { tag: '200', text: '200 words' }
            ]
        },
        {
            name: 'Plot Direction',
            enabled: true,
            triggerMode: 'always',
            chance: 100,
            interval: 1,
            options: [
                { tag: 'Twist', text: 'Throw in a twist' },
                { tag: 'Reject', text: 'Reject the idea' },
                { tag: 'Accept', text: 'Accept and expand on it' },
                { tag: 'Complicate', text: 'Add a complication' },
                { tag: 'New', text: 'Introduce a new element' },
                { tag: 'Slow', text: 'Slow down the pace' },
                { tag: 'Fast', text: 'Speed up the action' }
            ]
        },
        {
            name: 'Character Behavior',
            enabled: true,
            triggerMode: 'always',
            chance: 100,
            interval: 1,
            options: [
                { tag: 'Emotional', text: 'Turn emotional' },
                { tag: 'Irrational', text: 'Turn irrational' },
                { tag: 'Calm', text: 'Stay calm and logical' },
                { tag: 'Vulnerable', text: 'Show vulnerability' },
                { tag: 'Defensive', text: 'Become defensive' },
                { tag: 'Playful', text: 'Be playful or teasing' },
                { tag: 'Suspicious', text: 'Act suspicious' }
            ]
        },
        {
            name: 'Scene Focus',
            enabled: true,
            triggerMode: 'always',
            chance: 100,
            interval: 1,
            options: [
                { tag: 'Dialogue', text: 'Focus on dialogue' },
                { tag: 'Thoughts', text: 'Focus on internal thoughts' },
                { tag: 'Actions', text: 'Focus on physical actions' },
                { tag: 'Environment', text: 'Focus on environment details' },
                { tag: 'Balanced', text: 'Balance all elements' },
                { tag: 'Sensory', text: 'Focus on sensory details' }
            ]
        },
        {
            name: 'Tone & Mood',
            enabled: true,
            triggerMode: 'always',
            chance: 100,
            interval: 1,
            options: [
                { tag: 'Fun', text: 'Lighthearted and fun' },
                { tag: 'Dramatic', text: 'Tense and dramatic' },
                { tag: 'Intimate', text: 'Intimate and personal' },
                { tag: 'Mysterious', text: 'Mysterious and suspenseful' },
                { tag: 'Melancholic', text: 'Melancholic and reflective' },
                { tag: 'Energetic', text: 'Energetic and exciting' },
                { tag: 'Peaceful', text: 'Calm and peaceful' }
            ]
        }
    ],
    formatting: {
        injectionMode: 'append',
        prefix: '',
        suffix: '',
        mainWrapper: 'BF OOC Injection:',
        systemPromptLabel: 'Systemprompt Reinject:',
        additionalPromptLabel: 'Additional Prompt Injection:',
        generalMessageLabel: 'General:',
        categoryFormat: '{category}: {option}'
    },
    showToast: true,
    toastDuration: 3000,
    toastDisplayMode: 'number',
    rerollOnSwipe: false
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
                    ${category.options.map((option, optIndex) => {
                        // Handle both old string format and new object format
                        const tag = typeof option === 'object' ? escapeHtml(option.tag || '') : '';
                        const text = typeof option === 'object' ? escapeHtml(option.text || '') : escapeHtml(option);
                        return `
                        <div class="bf-ooc-option" data-opt-index="${optIndex}">
                            <span class="bf-ooc-option-num">${optIndex + 1}.</span>
                            <input type="text" class="bf-ooc-option-tag text_pole" placeholder="Tag" value="${tag}" style="width: 80px;" title="Tag for toast display" />
                            <input type="text" class="bf-ooc-option-text text_pole" placeholder="Text" value="${text}" style="flex: 1;" title="Full option text" />
                            <button class="bf-ooc-option-delete menu_button" title="Remove option">
                                <i class="fa-solid fa-minus"></i>
                            </button>
                        </div>
                        `;
                    }).join('')}
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

    $('.bf-ooc-option-tag').off('change').on('change', function() {
        const catIndex = $(this).closest('.bf-ooc-category').data('index');
        const optIndex = $(this).closest('.bf-ooc-option').data('opt-index');
        const option = extensionSettings.categories[catIndex].options[optIndex];

        // Convert to object if it's still a string
        if (typeof option === 'string') {
            extensionSettings.categories[catIndex].options[optIndex] = {
                tag: $(this).val(),
                text: option
            };
        } else {
            option.tag = $(this).val();
        }
        saveSettings();
    });

    $('.bf-ooc-option-text').off('change').on('change', function() {
        const catIndex = $(this).closest('.bf-ooc-category').data('index');
        const optIndex = $(this).closest('.bf-ooc-option').data('opt-index');
        const option = extensionSettings.categories[catIndex].options[optIndex];

        // Convert to object if it's still a string
        if (typeof option === 'string') {
            extensionSettings.categories[catIndex].options[optIndex] = {
                tag: '',
                text: $(this).val()
            };
        } else {
            option.text = $(this).val();
        }
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
        extensionSettings.categories[index].options.push({ tag: '', text: 'New option' });
        saveSettings();
        renderCategories();
    });
}

function getCurrentSettings() {
    // Return current settings without preset management fields
    return {
        enabled: extensionSettings.enabled,
        systemPrompt: JSON.parse(JSON.stringify(extensionSettings.systemPrompt)),
        generalMessage: JSON.parse(JSON.stringify(extensionSettings.generalMessage)),
        categoriesEnabled: extensionSettings.categoriesEnabled,
        categories: JSON.parse(JSON.stringify(extensionSettings.categories)),
        formatting: JSON.parse(JSON.stringify(extensionSettings.formatting)),
        showToast: extensionSettings.showToast,
        toastDuration: extensionSettings.toastDuration,
        toastDisplayMode: extensionSettings.toastDisplayMode,
        rerollOnSwipe: extensionSettings.rerollOnSwipe
    };
}

function getEmptySettings() {
    // Return completely empty settings for a new preset
    return {
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
        categoriesEnabled: false,
        categories: [],
        formatting: {
            injectionMode: 'append',
            prefix: '',
            suffix: '',
            mainWrapper: '',
            systemPromptLabel: '',
            additionalPromptLabel: '',
            generalMessageLabel: '',
            categoryFormat: '{category}: {option}'
        },
        showToast: true,
        toastDuration: 3000,
        toastDisplayMode: 'number'
    };
}

function loadPresetSettings(presetData) {
    // Load settings from preset data
    extensionSettings.enabled = presetData.enabled;
    extensionSettings.systemPrompt = JSON.parse(JSON.stringify(presetData.systemPrompt));
    extensionSettings.generalMessage = JSON.parse(JSON.stringify(presetData.generalMessage));
    extensionSettings.categoriesEnabled = presetData.categoriesEnabled;
    extensionSettings.categories = JSON.parse(JSON.stringify(presetData.categories));
    extensionSettings.formatting = JSON.parse(JSON.stringify(presetData.formatting));
    extensionSettings.showToast = presetData.showToast;
    extensionSettings.toastDuration = presetData.toastDuration !== undefined ? presetData.toastDuration : 3000;
    extensionSettings.toastDisplayMode = presetData.toastDisplayMode || 'number';
    extensionSettings.rerollOnSwipe = presetData.rerollOnSwipe !== undefined ? presetData.rerollOnSwipe : false;
}

function updatePresetDropdown() {
    const select = $('#bf_ooc_preset_select');
    select.empty();

    // Add Default option
    select.append('<option value="Default">Default</option>');

    // Add saved presets
    if (extensionSettings.presets && typeof extensionSettings.presets === 'object') {
        Object.keys(extensionSettings.presets).sort().forEach(presetName => {
            select.append(`<option value="${escapeHtml(presetName)}">${escapeHtml(presetName)}</option>`);
        });
    }

    // Set current selection
    if (extensionSettings.currentPreset) {
        select.val(extensionSettings.currentPreset);
    }
}

function savePreset(presetName) {
    if (!presetName || presetName.trim() === '') {
        toastr.error('Please enter a preset name', 'BF OOC Injection');
        return;
    }

    presetName = presetName.trim();

    if (presetName === 'Default') {
        toastr.error('Cannot overwrite Default preset', 'BF OOC Injection');
        return;
    }

    if (!extensionSettings.presets) {
        extensionSettings.presets = {};
    }

    extensionSettings.presets[presetName] = getCurrentSettings();
    extensionSettings.currentPreset = presetName;

    saveSettings();
    updatePresetDropdown();

    // Select the newly saved preset in the dropdown
    $('#bf_ooc_preset_select').val(presetName);

    toastr.success(`Preset "${presetName}" saved!`, 'BF OOC Injection');
    console.log('[BFOOC] Preset saved:', presetName);
}

function refreshUI() {
    // Update all UI elements to reflect current settings
    $('#bf_ooc_enabled').prop('checked', extensionSettings.enabled);
    $('#bf_ooc_show_toast').prop('checked', extensionSettings.showToast);
    $('#bf_ooc_toast_settings').toggle(extensionSettings.showToast);
    $('#bf_ooc_toast_duration').val((extensionSettings.toastDuration || 3000) / 1000);
    $('#bf_ooc_toast_display').val(extensionSettings.toastDisplayMode || 'number');
    $('#bf_ooc_reroll_on_swipe').prop('checked', extensionSettings.rerollOnSwipe || false);

    // System Prompt
    $('#bf_ooc_system_enabled').prop('checked', extensionSettings.systemPrompt.enabled);
    $('#bf_ooc_system_content').toggle(extensionSettings.systemPrompt.enabled);

    $(`input[name="bf_system_trigger"][value="${extensionSettings.systemPrompt.triggerMode}"]`).prop('checked', true);
    $('#bf_ooc_system_chance').val(extensionSettings.systemPrompt.chance);
    $('#bf_ooc_system_interval').val(extensionSettings.systemPrompt.interval);
    $('#bf_ooc_system_chance').prop('disabled', extensionSettings.systemPrompt.triggerMode !== 'chance');
    $('#bf_ooc_system_interval').prop('disabled', extensionSettings.systemPrompt.triggerMode !== 'interval');

    loadSystemPromptTargets();

    // General Message
    $('#bf_ooc_general_enabled').prop('checked', extensionSettings.generalMessage.enabled);
    $('#bf_ooc_general_text').val(extensionSettings.generalMessage.text);
    $('#bf_ooc_general_content').toggle(extensionSettings.generalMessage.enabled);

    // Random Categories
    $('#bf_ooc_categories_enabled').prop('checked', extensionSettings.categoriesEnabled);
    $('#bf_ooc_categories_content').toggle(extensionSettings.categoriesEnabled);
    renderCategories();

    // Formatting
    $('#bf_ooc_injection_mode').val(extensionSettings.formatting.injectionMode);
    $('#bf_ooc_prefix').val(extensionSettings.formatting.prefix || '');
    $('#bf_ooc_suffix').val(extensionSettings.formatting.suffix || '');
    $('#bf_ooc_main_wrapper').val(extensionSettings.formatting.mainWrapper || 'BF OOC Injection:');
    $('#bf_ooc_system_label').val(extensionSettings.formatting.systemPromptLabel || 'Systemprompt Reinject:');
    $('#bf_ooc_additional_label').val(extensionSettings.formatting.additionalPromptLabel || 'Additional Prompt Injection:');
    $('#bf_ooc_general_label').val(extensionSettings.formatting.generalMessageLabel || 'General:');
    $('#bf_ooc_category_format').val(extensionSettings.formatting.categoryFormat || '{category}: {option}');

    // Main settings content visibility
    $('#bf_ooc_settings_content').toggle(extensionSettings.enabled);

    console.log('[BFOOC] UI refreshed');
}

function loadPreset(presetName) {
    if (!presetName) {
        return;
    }

    let presetData;

    if (presetName === 'Default') {
        // Load default settings
        presetData = {
            enabled: DEFAULT_SETTINGS.enabled,
            systemPrompt: JSON.parse(JSON.stringify(DEFAULT_SETTINGS.systemPrompt)),
            generalMessage: JSON.parse(JSON.stringify(DEFAULT_SETTINGS.generalMessage)),
            categoriesEnabled: DEFAULT_SETTINGS.categoriesEnabled,
            categories: JSON.parse(JSON.stringify(DEFAULT_SETTINGS.categories)),
            formatting: JSON.parse(JSON.stringify(DEFAULT_SETTINGS.formatting)),
            showToast: DEFAULT_SETTINGS.showToast,
            toastDuration: DEFAULT_SETTINGS.toastDuration,
            toastDisplayMode: DEFAULT_SETTINGS.toastDisplayMode,
            rerollOnSwipe: DEFAULT_SETTINGS.rerollOnSwipe
        };
    } else {
        if (!extensionSettings.presets || !extensionSettings.presets[presetName]) {
            toastr.error(`Preset "${presetName}" not found`, 'BF OOC Injection');
            return;
        }
        presetData = extensionSettings.presets[presetName];
    }

    loadPresetSettings(presetData);
    extensionSettings.currentPreset = presetName;

    saveSettings();
    refreshUI();

    toastr.success(`Preset "${presetName}" loaded`, 'BF OOC Injection');
    console.log('[BFOOC] Preset loaded:', presetName);
}

function deletePreset(presetName) {
    if (!presetName || presetName === 'Default') {
        toastr.error('Cannot delete Default preset', 'BF OOC Injection');
        return;
    }

    if (!extensionSettings.presets || !extensionSettings.presets[presetName]) {
        toastr.error(`Preset "${presetName}" not found`, 'BF OOC Injection');
        return;
    }

    if (!confirm(`Delete preset "${presetName}"?`)) {
        return;
    }

    delete extensionSettings.presets[presetName];

    // If we deleted the current preset, switch to Default
    if (extensionSettings.currentPreset === presetName) {
        extensionSettings.currentPreset = 'Default';
    }

    saveSettings();
    updatePresetDropdown();

    toastr.success(`Preset "${presetName}" deleted`, 'BF OOC Injection');
    console.log('[BFOOC] Preset deleted:', presetName);
}

function newPreset() {
    if (!confirm('This will clear all current settings and start fresh. Continue?')) {
        return;
    }

    const emptySettings = getEmptySettings();
    loadPresetSettings(emptySettings);
    extensionSettings.currentPreset = 'Default';

    saveSettings();
    refreshUI();

    toastr.success('All settings cleared. Ready for new preset!', 'BF OOC Injection');
    console.log('[BFOOC] New preset started - settings cleared');
}

function exportPresets() {
    try {
        const exportData = {
            version: '1.0',
            presets: extensionSettings.presets || {},
            exportDate: new Date().toISOString()
        };

        const jsonString = JSON.stringify(exportData, null, 2);

        // Create a blob and download it
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        // Generate filename with current date
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        a.href = url;
        a.download = `bf-ooc-presets-${date}.json`;

        // Trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toastr.success('Presets exported as JSON file!', 'BF OOC Injection');
        console.log('[BFOOC] Presets exported:', Object.keys(exportData.presets).length, 'presets');
    } catch (error) {
        console.error('[BFOOC] Export error:', error);
        toastr.error('Failed to export presets', 'BF OOC Injection');
    }
}

async function importPresets() {
    try {
        const jsonString = await navigator.clipboard.readText();

        if (!jsonString || jsonString.trim() === '') {
            toastr.error('Clipboard is empty', 'BF OOC Injection');
            return;
        }

        const importData = JSON.parse(jsonString);

        if (!importData.presets || typeof importData.presets !== 'object') {
            toastr.error('Invalid preset data format', 'BF OOC Injection');
            return;
        }

        const presetCount = Object.keys(importData.presets).length;

        if (!confirm(`Import ${presetCount} preset(s)? This will add to your existing presets.`)) {
            return;
        }

        if (!extensionSettings.presets) {
            extensionSettings.presets = {};
        }

        // Merge imported presets
        Object.assign(extensionSettings.presets, importData.presets);

        saveSettings();
        updatePresetDropdown();

        toastr.success(`Imported ${presetCount} preset(s)!`, 'BF OOC Injection');
        console.log('[BFOOC] Presets imported:', presetCount);
    } catch (error) {
        console.error('[BFOOC] Import error:', error);
        toastr.error('Failed to import presets. Check clipboard data.', 'BF OOC Injection');
    }
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
        const enabled = $(this).prop('checked');
        $('#bf_ooc_settings_content').toggle(enabled);
        saveSettings();
    });

    // Presets
    updatePresetDropdown();

    $('#bf_ooc_preset_reload').on('click', function() {
        const presetName = extensionSettings.currentPreset || 'Default';
        loadPreset(presetName);
        toastr.info(`Reloaded preset "${presetName}"`, 'BF OOC Injection');
    });

    $('#bf_ooc_preset_new').on('click', function() {
        newPreset();
    });

    $('#bf_ooc_preset_saveas').on('click', function() {
        $('#bf_ooc_preset_save_box').slideDown(200);
        $('#bf_ooc_preset_name').focus();
    });

    $('#bf_ooc_preset_save_confirm').on('click', function() {
        const presetName = $('#bf_ooc_preset_name').val();
        savePreset(presetName);
        $('#bf_ooc_preset_name').val('');
        $('#bf_ooc_preset_save_box').slideUp(200);
    });

    $('#bf_ooc_preset_save_cancel').on('click', function() {
        $('#bf_ooc_preset_name').val('');
        $('#bf_ooc_preset_save_box').slideUp(200);
    });

    $('#bf_ooc_preset_delete').on('click', function() {
        const presetName = $('#bf_ooc_preset_select').val();
        deletePreset(presetName);
    });

    $('#bf_ooc_preset_export').on('click', function() {
        exportPresets();
    });

    $('#bf_ooc_preset_import').on('click', function() {
        importPresets();
    });

    $('#bf_ooc_preset_select').on('change', function() {
        const presetName = $(this).val();
        loadPreset(presetName);
    });

    // System Prompt
    $('#bf_ooc_system_enabled').prop('checked', extensionSettings.systemPrompt.enabled).on('change', function() {
        extensionSettings.systemPrompt.enabled = $(this).prop('checked');
        const enabled = $(this).prop('checked');
        $('#bf_ooc_system_content').toggle(enabled);
        if (enabled) {
            loadSystemPromptTargets();
        }
        saveSettings();
    });

    // Show/hide system content based on initial state
    $('#bf_ooc_system_content').toggle(extensionSettings.systemPrompt.enabled);
    // Load system prompts list on initialization
    loadSystemPromptTargets();

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
        const enabled = $(this).prop('checked');
        $('#bf_ooc_general_content').toggle(enabled);
        saveSettings();
    });

    $('#bf_ooc_general_text').val(extensionSettings.generalMessage.text).on('change', function() {
        extensionSettings.generalMessage.text = $(this).val();
        saveSettings();
    });

    // Random Categories
    $('#bf_ooc_categories_enabled').prop('checked', extensionSettings.categoriesEnabled).on('change', function() {
        extensionSettings.categoriesEnabled = $(this).prop('checked');
        const enabled = $(this).prop('checked');
        $('#bf_ooc_categories_content').toggle(enabled);
        saveSettings();
    });

    // Formatting
    $('#bf_ooc_injection_mode').val(extensionSettings.formatting.injectionMode).on('change', function() {
        extensionSettings.formatting.injectionMode = $(this).val();
        saveSettings();
    });

    $('#bf_ooc_prefix').val(extensionSettings.formatting.prefix || '').on('change', function() {
        extensionSettings.formatting.prefix = $(this).val();
        saveSettings();
    });

    $('#bf_ooc_suffix').val(extensionSettings.formatting.suffix || '').on('change', function() {
        extensionSettings.formatting.suffix = $(this).val();
        saveSettings();
    });

    // Formatting Labels
    $('#bf_ooc_main_wrapper').val(extensionSettings.formatting.mainWrapper || 'BF OOC Injection:').on('change', function() {
        extensionSettings.formatting.mainWrapper = $(this).val();
        saveSettings();
    });

    $('#bf_ooc_system_label').val(extensionSettings.formatting.systemPromptLabel || 'Systemprompt Reinject:').on('change', function() {
        extensionSettings.formatting.systemPromptLabel = $(this).val();
        saveSettings();
    });

    $('#bf_ooc_additional_label').val(extensionSettings.formatting.additionalPromptLabel || 'Additional Prompt Injection:').on('change', function() {
        extensionSettings.formatting.additionalPromptLabel = $(this).val();
        saveSettings();
    });

    $('#bf_ooc_general_label').val(extensionSettings.formatting.generalMessageLabel || 'General:').on('change', function() {
        extensionSettings.formatting.generalMessageLabel = $(this).val();
        saveSettings();
    });

    $('#bf_ooc_category_format').val(extensionSettings.formatting.categoryFormat || '{category}: {option}').on('change', function() {
        extensionSettings.formatting.categoryFormat = $(this).val();
        saveSettings();
    });

    // Toast
    $('#bf_ooc_show_toast').prop('checked', extensionSettings.showToast).on('change', function() {
        extensionSettings.showToast = $(this).prop('checked');
        const enabled = $(this).prop('checked');
        $('#bf_ooc_toast_settings').toggle(enabled);
        saveSettings();
    });

    // Toast settings
    // Display in seconds, store in milliseconds
    const durationInSeconds = (extensionSettings.toastDuration || 3000) / 1000;
    $('#bf_ooc_toast_duration').val(durationInSeconds).on('change', function() {
        let valueInSeconds = parseFloat($(this).val());
        if (isNaN(valueInSeconds) || valueInSeconds < 0) valueInSeconds = 3;
        extensionSettings.toastDuration = Math.round(valueInSeconds * 1000);
        $(this).val(valueInSeconds);
        saveSettings();
    });

    $('#bf_ooc_toast_display').val(extensionSettings.toastDisplayMode || 'number').on('change', function() {
        extensionSettings.toastDisplayMode = $(this).val();
        saveSettings();
    });

    // Show/hide toast settings based on initial state
    $('#bf_ooc_toast_settings').toggle(extensionSettings.showToast);

    // Reroll on swipe - always visible
    $('#bf_ooc_reroll_on_swipe').prop('checked', extensionSettings.rerollOnSwipe || false).on('change', function() {
        extensionSettings.rerollOnSwipe = $(this).prop('checked');
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

    // Set initial visibility state
    $('#bf_ooc_settings_content').toggle(extensionSettings.enabled);
    $('#bf_ooc_general_content').toggle(extensionSettings.generalMessage.enabled);
    $('#bf_ooc_categories_content').toggle(extensionSettings.categoriesEnabled);

    console.log('[BFOOC] UI loaded');
}

export async function initSettings() {
    const context = SillyTavern.getContext();

    extensionSettings = context.extensionSettings[EXTENSION_NAME] || JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

    // Ensure all default properties exist
    if (!extensionSettings.currentPreset) {
        extensionSettings.currentPreset = DEFAULT_SETTINGS.currentPreset;
    }
    if (!extensionSettings.presets) {
        extensionSettings.presets = {};
    }
    if (!extensionSettings.systemPrompt) {
        extensionSettings.systemPrompt = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.systemPrompt));
    }
    if (!Array.isArray(extensionSettings.systemPrompt.targets)) {
        extensionSettings.systemPrompt.targets = [];
    }
    if (!extensionSettings.generalMessage) {
        extensionSettings.generalMessage = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.generalMessage));
    }
    if (extensionSettings.categoriesEnabled === undefined) {
        extensionSettings.categoriesEnabled = DEFAULT_SETTINGS.categoriesEnabled;
    }
    if (!extensionSettings.formatting) {
        extensionSettings.formatting = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.formatting));
    }
    if (!Array.isArray(extensionSettings.categories) || extensionSettings.categories.length === 0) {
        extensionSettings.categories = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.categories));
        console.log('[BFOOC] Loaded default categories');
    }
    if (extensionSettings.toastDuration === undefined) {
        extensionSettings.toastDuration = DEFAULT_SETTINGS.toastDuration;
    }
    if (!extensionSettings.toastDisplayMode) {
        extensionSettings.toastDisplayMode = DEFAULT_SETTINGS.toastDisplayMode;
    }
    if (extensionSettings.rerollOnSwipe === undefined) {
        extensionSettings.rerollOnSwipe = DEFAULT_SETTINGS.rerollOnSwipe;
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
            const label = extensionSettings.formatting.generalMessageLabel || 'General:';
            additionalParts.push(`${label} ${extensionSettings.generalMessage.text.trim()}`);
        }

        // Categories
        if (extensionSettings.categoriesEnabled && extensionSettings.categories && Array.isArray(extensionSettings.categories)) {
            for (const category of extensionSettings.categories) {
                if (!category || !category.enabled || !category.options || category.options.length === 0) {
                    continue;
                }

                if (!shouldTrigger(category.triggerMode || 'always', category.chance || 100, category.interval || 1)) {
                    continue;
                }

                const randomIndex = Math.floor(Math.random() * category.options.length);
                const selectedOption = category.options[randomIndex];

                // Handle both old string format and new object format
                const optionText = typeof selectedOption === 'object' ? selectedOption.text : selectedOption;
                const optionTag = typeof selectedOption === 'object' ? selectedOption.tag : '';

                if (optionText && optionText.trim()) {
                    const format = extensionSettings.formatting.categoryFormat || '{category}: {option}';
                    const formatted = format
                        .replace('{category}', category.name)
                        .replace('{option}', optionText.trim());
                    additionalParts.push(formatted);
                    lastRollResults.push({
                        category: category.name,
                        rolled: randomIndex + 1,
                        total: category.options.length,
                        tag: optionTag
                    });
                }
            }
        }

        // Build the final output with sections
        const sections = [];

        if (systemPromptParts.length > 0) {
            const label = extensionSettings.formatting.systemPromptLabel || 'Systemprompt Reinject:';
            sections.push(label + '\n' + systemPromptParts.join('\n'));
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

            const label = extensionSettings.formatting.additionalPromptLabel || 'Additional Prompt Injection:';
            sections.push(label + '\n' + additionalContent);
        }

        if (sections.length === 0) {
            return '';
        }

        const mainWrapper = extensionSettings.formatting.mainWrapper || 'BF OOC Injection:';
        const output = `\n${mainWrapper}\n\n${sections.join('\n\n')}`;
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

    const displayMode = extensionSettings.toastDisplayMode || 'number';
    const duration = extensionSettings.toastDuration !== undefined ? extensionSettings.toastDuration : 3000;

    const lines = lastRollResults.map(r => {
        let displayValue;
        if (displayMode === 'tag' && r.tag) {
            // Show tag if available
            displayValue = r.tag;
        } else {
            // Show number (position/total)
            displayValue = `${r.rolled}/${r.total}`;
        }
        return `<b>${r.category}:</b> ${displayValue}`;
    });
    const html = lines.join('<br>');

    const toastOptions = {
        escapeHtml: false,
        timeOut: duration,
        extendedTimeOut: duration === 0 ? 0 : 1000
    };

    toastr.info(html, "BF's OOC Roll", toastOptions);
}
