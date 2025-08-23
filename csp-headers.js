/**
 * Content Security Policy Configuration
 * This file provides CSP headers and meta tags for enhanced security
 */

// CSP meta tag for HTML files (uses unsafe-inline to allow dynamic inline style mutations)
const cspMetaTag = `
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' https://cdn.tailwindcss.com https://www.gstatic.com https://fonts.googleapis.com 'unsafe-inline';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https: blob:;
    connect-src 'self' https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com;
    frame-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
">
`;

// Function to add CSP meta tag to document head
function addCSPMetaTag() {
    if (typeof document !== 'undefined' && document.head) {
        // Check if CSP meta tag already exists
        const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (!existingCSP) {
            const meta = document.createElement('meta');
            meta.setAttribute('http-equiv', 'Content-Security-Policy');
            
            // Build CSP content that allows inline styles (unsafe-inline) so runtime element.style mutations work
            const cspContent = `
                default-src 'self';
                script-src 'self' https://cdn.tailwindcss.com https://www.gstatic.com https://fonts.googleapis.com 'unsafe-inline';
                style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
                font-src 'self' https://fonts.gstatic.com;
                img-src 'self' data: https: blob:;
                connect-src 'self' https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com;
                frame-src 'self';
                object-src 'none';
                base-uri 'self';
                form-action 'self';
                upgrade-insecure-requests;
            `.replace(/\s+/g, ' ').trim();

            meta.setAttribute('content', cspContent);
            document.head.appendChild(meta);
        }
    }
}

// Function to validate URLs against CSP
function validateURL(url, allowedDomains = []) {
    try {
        const urlObj = new URL(url);
        return allowedDomains.some(domain => urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain));
    } catch {
        return false;
    }
}

// Function to sanitize user input
function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return '';
    }
    
    // Remove potentially dangerous characters and patterns
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .trim();
}

// Function to validate and sanitize HTML attributes
function validateAttribute(name, value) {
    const dangerousAttributes = ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur'];
    
    if (dangerousAttributes.includes(name.toLowerCase())) {
        console.warn(`Blocked potentially dangerous attribute: ${name}`);
        return false;
    }
    
    if (name.toLowerCase().startsWith('on') && typeof value === 'string') {
        console.warn(`Blocked event handler attribute: ${name}`);
        return false;
    }
    
    return true;
}

// Initialize CSP when DOM is ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addCSPMetaTag);
    } else {
        addCSPMetaTag();
    }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        cspMetaTag,
        addCSPMetaTag,
        validateURL,
        sanitizeInput,
        validateAttribute
    };
} else {
    // Make functions available globally
    window.CSPUtils = {
        cspMetaTag,
        addCSPMetaTag,
        validateURL,
        sanitizeInput,
        validateAttribute
    };
}
