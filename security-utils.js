/**
 * Security Utilities for GIKI Chronicles
 * Provides safe alternatives to dangerous DOM manipulation methods
 */

// Safe HTML sanitization function
function sanitizeHTML(html) {
    if (typeof html !== 'string') {
        return '';
    }
    
    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.textContent = html; // This automatically escapes HTML
    
    return temp.innerHTML;
}

// Safe innerHTML setter that automatically sanitizes content
function setSafeInnerHTML(element, content) {
    if (!element || !(element instanceof Element)) {
        console.warn('setSafeInnerHTML: Invalid element provided');
        return;
    }
    
    if (typeof content !== 'string') {
        console.warn('setSafeInnerHTML: Content must be a string');
        return;
    }
    
    // Sanitize the content before setting
    const sanitizedContent = sanitizeHTML(content);
    element.innerHTML = sanitizedContent;
}

// Safe DOM content creation
function createSafeElement(tagName, attributes = {}, content = '') {
    const element = document.createElement(tagName);
    
    // Set attributes safely
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'innerHTML' || key === 'innerText') {
            // Handle content separately
            return;
        }
        
        if (key.startsWith('on')) {
            // Block event handler attributes for security
            console.warn(`Blocked potentially unsafe attribute: ${key}`);
            return;
        }
        
        element.setAttribute(key, String(value));
    });
    
    // Set content safely
    if (content) {
        if (typeof content === 'string') {
            element.textContent = content;
        } else if (content instanceof Node) {
            element.appendChild(content);
        }
    }
    
    return element;
}

// Safe event handler attachment
function addSafeEventListener(element, eventType, handler, options = {}) {
    if (!element || !(element instanceof Element)) {
        console.warn('addSafeEventListener: Invalid element provided');
        return;
    }
    
    if (typeof handler !== 'function') {
        console.warn('addSafeEventListener: Handler must be a function');
        return;
    }
    
    // Wrap handler to catch errors
    const safeHandler = (event) => {
        try {
            return handler(event);
        } catch (error) {
            console.error('Error in event handler:', error);
            // Prevent error from breaking the application
        }
    };
    
    element.addEventListener(eventType, safeHandler, options);
    return safeHandler; // Return for potential removal
}

// Safe JSON parsing with error handling
function safeJSONParse(jsonString, fallback = null) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.warn('Failed to parse JSON:', error);
        return fallback;
    }
}

// Safe localStorage operations
function safeLocalStorageSet(key, value) {
    try {
        if (typeof value === 'object') {
            value = JSON.stringify(value);
        }
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        console.error('Failed to set localStorage item:', error);
        return false;
    }
}

function safeLocalStorageGet(key, fallback = null) {
    try {
        const value = localStorage.getItem(key);
        if (value === null) return fallback;
        
        // Try to parse as JSON, fallback to string
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    } catch (error) {
        console.error('Failed to get localStorage item:', error);
        return fallback;
    }
}

// Override dangerous innerHTML setter globally
function enableSecurityOverrides() {
    if (typeof Element !== 'undefined' && Element.prototype) {
        const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        
        Object.defineProperty(Element.prototype, 'innerHTML', {
            set: function(value) {
                if (typeof value === 'string' && value.includes('<script')) {
                    console.warn('Blocked potentially unsafe innerHTML assignment with script tag');
                    return;
                }
                // Allow the assignment but log it for monitoring
                if (typeof value === 'string' && value.length > 100) {
                    // console.log('Large innerHTML assignment detected, consider using setSafeInnerHTML');
                }
                originalInnerHTML.set.call(this, value);
            },
            get: originalInnerHTML.get,
            configurable: true
        });
    }
}

// Initialize security features
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', enableSecurityOverrides);
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sanitizeHTML,
        setSafeInnerHTML,
        createSafeElement,
        addSafeEventListener,
        safeJSONParse,
        safeLocalStorageSet,
        safeLocalStorageGet,
        enableSecurityOverrides
    };
} else {
    // Make functions available globally
    window.SecurityUtils = {
        sanitizeHTML,
        setSafeInnerHTML,
        createSafeElement,
        addSafeEventListener,
        safeJSONParse,
        safeLocalStorageSet,
        safeLocalStorageGet,
        enableSecurityOverrides
    };
}
