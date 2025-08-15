/**
 * security-headers.js
 * Security headers configuration for the GIKI Chronicles website
 */

// Content Security Policy configuration
const CSP_POLICY = {
    'default-src': ["'self'"],
    'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for React JSX
        "'unsafe-eval'",   // Required for Babel
        "https://www.gstatic.com",
        "https://unpkg.com",
        "https://cdn.tailwindcss.com",
        "https://fonts.googleapis.com"
    ],
    'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for Tailwind CSS
        "https://fonts.googleapis.com",
        "https://unpkg.com"
    ],
    'font-src': [
        "'self'",
        "https://fonts.gstatic.com",
        "https://fonts.googleapis.com"
    ],
    'img-src': [
        "'self'",
        "data:",
        "https:",
        "https://res.cloudinary.com",
        "https://firebasestorage.googleapis.com"
    ],
    'connect-src': [
        "'self'",
        "https://firestore.googleapis.com",
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com",
        "https://www.googleapis.com",
        "https://api.cloudinary.com",
        "wss://s-usc1c-nss-2001.firebaseio.com"
    ],
    'frame-src': [
        "'self'"
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"], // Prevents clickjacking
    'upgrade-insecure-requests': []
};

// Function to set security headers
function setSecurityHeaders() {
    // Set CSP header
    const cspString = Object.entries(CSP_POLICY)
        .map(([directive, sources]) => {
            if (Array.isArray(sources)) {
                return `${directive} ${sources.join(' ')}`;
            }
            return `${directive} ${sources}`;
        })
        .join('; ');

    // Create meta tag for CSP
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = cspString;
    document.head.appendChild(cspMeta);

    // Add other security headers via meta tags
    const securityHeaders = [
        {
            httpEquiv: 'X-Content-Type-Options',
            content: 'nosniff'
        },
        {
            httpEquiv: 'X-Frame-Options',
            content: 'DENY'
        },
        {
            httpEquiv: 'X-XSS-Protection',
            content: '1; mode=block'
        },
        {
            httpEquiv: 'Referrer-Policy',
            content: 'strict-origin-when-cross-origin'
        },
        {
            httpEquiv: 'Permissions-Policy',
            content: 'geolocation=(), microphone=(), camera=()'
        }
    ];

    securityHeaders.forEach(header => {
        const meta = document.createElement('meta');
        meta.httpEquiv = header.httpEquiv;
        meta.content = header.content;
        document.head.appendChild(meta);
    });

    console.log('Security headers applied successfully');
}

// Function to validate CSP policy
function validateCSPPolicy() {
    try {
        // Test if CSP is working by trying to load an external script
        const testScript = document.createElement('script');
        testScript.src = 'https://example.com/test.js';
        testScript.onerror = () => {
            console.log('CSP is working: External script blocked');
        };
        testScript.onload = () => {
            console.warn('CSP warning: External script loaded successfully');
        };
        document.head.appendChild(testScript);
        
        // Remove test script after a short delay
        setTimeout(() => {
            if (testScript.parentNode) {
                testScript.parentNode.removeChild(testScript);
            }
        }, 1000);
    } catch (error) {
        console.error('CSP validation error:', error);
    }
}

// Initialize security headers when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setSecurityHeaders);
} else {
    setSecurityHeaders();
}

// Export functions for use in other files
window.securityHeaders = {
    setSecurityHeaders,
    validateCSPPolicy,
    CSP_POLICY
};

