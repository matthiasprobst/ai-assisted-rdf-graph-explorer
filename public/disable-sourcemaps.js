// Runtime source map disable script for Firefox compatibility
// This completely prevents source map loading in Firefox

(function() {
    'use strict';
    
    // Override source map loading functions
    const originalFetch = window.fetch;
    const originalCreateElement = document.createElement;
    
    // Override fetch to block .map requests
    window.fetch = function(...args) {
        const url = args[0];
        if (typeof url === 'string' && url.includes('.map')) {
            return Promise.reject(new Error('Source maps disabled'));
        }
        return originalFetch.apply(this, args);
    };
    
    // Override createElement to remove sourceMappingURL from scripts
    document.createElement = function(tagName) {
        const element = originalCreateElement.call(this, tagName);
        
        if (tagName.toLowerCase() === 'script') {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && 
                        mutation.attributeName === 'src' && 
                        element.src && 
                        element.src.includes('.map')) {
                        element.removeAttribute('src');
                        element.removeAttribute('integrity');
                    }
                });
            });
            
            observer.observe(element, {
                attributes: true,
                attributeFilter: ['src', 'integrity']
            });
        }
        
        return element;
    };
    
    // Remove any existing sourceMappingURL
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
        if (script.textContent && script.textContent.includes('sourceMappingURL')) {
            script.textContent = script.textContent.replace(/\/\/# sourceMappingURL=.*$/gm, '');
        }
    });
    
    console.log('Source maps disabled for Firefox compatibility');
})();