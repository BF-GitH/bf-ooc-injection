// BF's OOC Injection - Main Entry Point

export const extension_name = 'bf-ooc-injection';

jQuery(async () => {
    try {
        const { initSettings } = await import('./src/settings.js');
        await initSettings();

        const { initInjector } = await import('./src/injector.js');
        initInjector();

        console.log('[BFOOC] Extension loaded successfully');
    } catch (error) {
        console.error('[BFOOC] Failed to load extension:', error);
    }
});
