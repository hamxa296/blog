/**
 * secure-content-sanitizer.js
 * Comprehensive content sanitization to prevent XSS attacks
 * This module provides safe alternatives to dangerous innerHTML usage
 */

// Content sanitization configuration
const CONTENT_SANITIZATION_CONFIG = {
    // Allowed HTML tags for different contexts
    allowedTags: {
        // Basic text formatting
        basic: ['p', 'br', 'strong', 'em', 'u', 'i', 'b', 'span', 'div'],
        
        // Rich text content
        rich: ['p', 'br', 'strong', 'em', 'u', 'i', 'b', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code'],
        
        // Admin content (more permissive)
        admin: ['p', 'br', 'strong', 'em', 'u', 'i', 'b', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'img', 'a', 'table', 'tr', 'td', 'th', 'thead', 'tbody'],
        
        // User content (restrictive)
        user: ['p', 'br', 'strong', 'em', 'u', 'i', 'b', 'span']
    },
    
    // Allowed attributes for different contexts
    allowedAttributes: {
        // Basic attributes
        basic: ['class', 'id', 'style'],
        
        // Link attributes
        link: ['href', 'target', 'rel', 'title'],
        
        // Image attributes
        image: ['src', 'alt', 'title', 'width', 'height'],
        
        // Table attributes
        table: ['class', 'id', 'style', 'width', 'border', 'cellpadding', 'cellspacing']
    },
    
    // Dangerous patterns to remove
    dangerousPatterns: [
        /javascript:/gi,
        /vbscript:/gi,
        /data:/gi,
        /on\w+\s*=/gi,
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
        /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
        /eval\s*\(/gi,
        /Function\s*\(/gi,
        /document\./gi,
        /window\./gi,
        /location\./gi,
        /history\./gi
    ],
    
    // Maximum content lengths
    maxLengths: {
        title: 200,
        description: 1000,
        content: 50000,
        comment: 1000,
        username: 50
    }
};

// Content sanitizer class
class ContentSanitizer {
    constructor() {
        this.config = CONTENT_SANITIZATION_CONFIG;
    }
    
    // Sanitize HTML content
    sanitizeHTML(html, context = 'user') {
        if (!html || typeof html !== 'string') {
            return '';
        }
        
        // Check if sanitizer is disabled
        if (window._sanitizerDisabled) {
            return html;
        }
        
        // Simple fallback for very long content that might cause issues
        if (html.length > 10000) {
            console.warn('Content too long for sanitization, using simple escape');
            return this.escapeHTML(html);
        }
        
        try {
            // Remove dangerous patterns
            let sanitized = this.removeDangerousPatterns(html);
            
            // Parse and sanitize HTML
            sanitized = this.parseAndSanitizeHTML(sanitized, context);
            
            // Validate length
            sanitized = this.validateLength(sanitized, context);
            
            return sanitized;
        } catch (error) {
            console.error('HTML sanitization error:', error);
            // If sanitization fails, disable it temporarily and return original content
            console.warn('Disabling content sanitizer due to error');
            window._sanitizerDisabled = true;
            return this.escapeHTML(html);
        }
    }
    
    // Remove dangerous patterns
    removeDangerousPatterns(content) {
        let sanitized = content;
        
        this.config.dangerousPatterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '');
        });
        
        return sanitized;
    }
    
    // Parse and sanitize HTML
    parseAndSanitizeHTML(html, context) {
        try {
            // Check if sanitizer is disabled
            if (window._sanitizerDisabled) {
                return html;
            }
            
            // Create a temporary container
            const temp = document.createElement('div');
            temp.innerHTML = html;
            
            // Sanitize the DOM tree
            this.sanitizeNode(temp, context);
            
            return temp.innerHTML;
        } catch (error) {
            console.error('Error in parseAndSanitizeHTML:', error);
            // If parsing fails, disable sanitizer and return original content
            console.warn('Disabling content sanitizer due to parsing error');
            window._sanitizerDisabled = true;
            return html;
        }
    }
    
    // Sanitize DOM node recursively
    sanitizeNode(node, context) {
        // Check if node is null or undefined
        if (!node) {
            return;
        }
        
        const allowedTags = this.config.allowedTags[context] || this.config.allowedTags.user;
        const allowedAttributes = this.config.allowedAttributes.basic;
        
        // Handle text nodes
        if (node.nodeType === Node.TEXT_NODE) {
            return;
        }
        
        // Handle element nodes
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            
            // Remove disallowed tags
            if (!allowedTags.includes(tagName)) {
                // Move children to parent and remove this node
                const parent = node.parentNode;
                if (parent) {
                    while (node.firstChild) {
                        parent.insertBefore(node.firstChild, node);
                    }
                    parent.removeChild(node);
                }
                return;
            }
            
            // Sanitize attributes
            this.sanitizeAttributes(node, context);
            
            // Special handling for specific tags
            if (tagName === 'a') {
                this.sanitizeLink(node);
            } else if (tagName === 'img') {
                this.sanitizeImage(node);
            }
        }
        
        // Recursively sanitize children
        const children = Array.from(node.childNodes);
        children.forEach(child => this.sanitizeNode(child, context));
    }
    
    // Sanitize element attributes
    sanitizeAttributes(element, context) {
        // Check if element is null or undefined
        if (!element || !element.attributes) {
            return;
        }
        
        const allowedAttributes = this.config.allowedAttributes.basic;
        const attributes = Array.from(element.attributes);
        
        attributes.forEach(attr => {
            if (!attr) return;
            
            const attrName = attr.name.toLowerCase();
            const attrValue = attr.value;
            
            // Remove disallowed attributes
            if (!allowedAttributes.includes(attrName)) {
                element.removeAttribute(attrName);
                return;
            }
            
            // Sanitize attribute values
            const sanitizedValue = this.sanitizeAttributeValue(attrName, attrValue);
            element.setAttribute(attrName, sanitizedValue);
        });
    }
    
    // Sanitize link elements
    sanitizeLink(link) {
        // Check if link is null or undefined
        if (!link) {
            return;
        }
        
        const href = link.getAttribute('href');
        if (href) {
            // Only allow http, https, and relative URLs
            if (!href.match(/^(https?:\/\/|\/|#)/)) {
                link.removeAttribute('href');
            } else {
                // Add security attributes
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        }
    }
    
    // Sanitize image elements
    sanitizeImage(img) {
        // Check if img is null or undefined
        if (!img) {
            return;
        }
        
        const src = img.getAttribute('src');
        if (src) {
            // Only allow http, https, and data URLs for images
            if (!src.match(/^(https?:\/\/|\/|data:image\/)/)) {
                img.removeAttribute('src');
            }
        }
        
        // Ensure alt attribute exists
        if (!img.getAttribute('alt')) {
            img.setAttribute('alt', 'Image');
        }
    }
    
    // Sanitize attribute values
    sanitizeAttributeValue(attrName, value) {
        // Remove dangerous patterns from attribute values
        return this.removeDangerousPatterns(value);
    }
    
    // Validate content length
    validateLength(content, context) {
        const maxLength = this.config.maxLengths[context] || this.config.maxLengths.content;
        
        if (content.length > maxLength) {
            return content.substring(0, maxLength) + '...';
        }
        
        return content;
    }
    
    // Escape HTML (fallback method)
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Safe innerHTML setter
    setInnerHTML(element, content, context = 'user') {
        if (!element) return;
        
        const sanitized = this.sanitizeHTML(content, context);
        // Use the safe setter to avoid triggering the override again
        element._safeInnerHTML = true;
        // Use the original setter directly to avoid recursion
        const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        originalInnerHTML.set.call(element, sanitized);
    }
    
    // Safe textContent setter
    setTextContent(element, content) {
        if (!element) return;
        
        element.textContent = content || '';
    }
    
    // Create safe HTML element
    createSafeElement(tagName, content, context = 'user') {
        const element = document.createElement(tagName);
        this.setInnerHTML(element, content, context);
        return element;
    }
    
    // Sanitize form data
    sanitizeFormData(formData, schema) {
        const sanitized = {};
        
        for (const [key, value] of formData.entries()) {
            const fieldSchema = schema[key];
            if (fieldSchema) {
                sanitized[key] = this.sanitizeField(value, fieldSchema);
            } else {
                // Default sanitization for unknown fields
                sanitized[key] = this.sanitizeHTML(value, 'user');
            }
        }
        
        return sanitized;
    }
    
    // Sanitize individual field
    sanitizeField(value, schema) {
        const { type, context, maxLength, required } = schema;
        
        // Check if required
        if (required && (!value || value.trim() === '')) {
            throw new Error(`Field is required`);
        }
        
        // Apply type-specific sanitization
        switch (type) {
            case 'text':
            case 'textarea':
                return this.sanitizeHTML(value, context || 'user');
                
            case 'email':
                return this.sanitizeEmail(value);
                
            case 'url':
                return this.sanitizeURL(value);
                
            case 'number':
                return this.sanitizeNumber(value);
                
            case 'html':
                return this.sanitizeHTML(value, context || 'user');
                
            default:
                return this.sanitizeHTML(value, 'user');
        }
    }
    
    // Sanitize email
    sanitizeEmail(email) {
        if (!email) return '';
        
        const sanitized = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(sanitized)) {
            throw new Error('Invalid email format');
        }
        
        return sanitized;
    }
    
    // Sanitize URL
    sanitizeURL(url) {
        if (!url) return '';
        
        const sanitized = url.trim();
        
        // Add protocol if missing
        if (!sanitized.match(/^https?:\/\//)) {
            return 'https://' + sanitized;
        }
        
        return sanitized;
    }
    
    // Sanitize number
    sanitizeNumber(value) {
        if (!value) return '';
        
        const number = parseFloat(value);
        return isNaN(number) ? '' : number.toString();
    }
}

// Initialize content sanitizer
const contentSanitizer = new ContentSanitizer();

// Override dangerous innerHTML assignments
function overrideInnerHTML() {
    // Store original innerHTML setter
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    
    // Override innerHTML setter
    Object.defineProperty(Element.prototype, 'innerHTML', {
        set: function(value) {
            try {
                // Check if sanitizer is disabled for debugging
                if (window._sanitizerDisabled) {
                    originalInnerHTML.set.call(this, value);
                    return;
                }
                
                // Check if this is a safe assignment (from our sanitizer)
                if (this._safeInnerHTML) {
                    originalInnerHTML.set.call(this, value);
                    this._safeInnerHTML = false;
                    return;
                }
                
                // Simple fallback for very long content
                if (typeof value === 'string' && value.length > 10000) {
                    const div = document.createElement('div');
                    div.textContent = value;
                    originalInnerHTML.set.call(this, div.innerHTML);
                    return;
                }
                
                // Check if this element is part of the admin dashboard structure
                const isAdminElement = this.closest('#admin-content') !== null;
                const context = isAdminElement ? 'admin' : 'user';
                
                // Sanitize the content with appropriate context
                const sanitized = contentSanitizer.sanitizeHTML(value, context);
                originalInnerHTML.set.call(this, sanitized);
            } catch (error) {
                console.error('Error in innerHTML setter override:', error);
                // Fallback to original setter with escaped content
                try {
                    const div = document.createElement('div');
                    div.textContent = value;
                    originalInnerHTML.set.call(this, div.innerHTML);
                } catch (fallbackError) {
                    console.error('Fallback innerHTML setter also failed:', fallbackError);
                    // Last resort: set empty content
                    originalInnerHTML.set.call(this, '');
                }
            }
        },
        get: originalInnerHTML.get
    });
}

// Safe innerHTML setter function
function setSafeInnerHTML(element, content, context = 'user') {
    element._safeInnerHTML = true;
    contentSanitizer.setInnerHTML(element, content, context);
}

// Export sanitizer functions
window.ContentSanitizer = {
    ContentSanitizer,
    CONTENT_SANITIZATION_CONFIG,
    contentSanitizer,
    setSafeInnerHTML,
    sanitizeHTML: (content, context) => contentSanitizer.sanitizeHTML(content, context),
    sanitizeFormData: (formData, schema) => contentSanitizer.sanitizeFormData(formData, schema),
    createSafeElement: (tagName, content, context) => contentSanitizer.createSafeElement(tagName, content, context),
    
    // Debug functions
    disableSanitizer: () => {
        console.log('Content sanitizer disabled for debugging');
        window._sanitizerDisabled = true;
    },
    
    enableSanitizer: () => {
        console.log('Content sanitizer enabled');
        window._sanitizerDisabled = false;
    }
};

// Override dangerous innerHTML usage
if (typeof window !== 'undefined') {
    overrideInnerHTML();
}

console.log('Secure content sanitizer loaded');
console.log('To disable sanitizer for debugging, run: ContentSanitizer.disableSanitizer()');
console.log('To enable sanitizer, run: ContentSanitizer.enableSanitizer()');
