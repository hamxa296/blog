/**
 * input-sanitizer.js
 * Comprehensive input sanitization and validation for security
 */

// Input sanitization configuration
const SANITIZATION_CONFIG = {
    // HTML tags that are allowed (whitelist approach)
    allowedTags: [
        'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'blockquote', 'code', 'pre', 'a', 'img', 'div', 'span'
    ],
    
    // HTML attributes that are allowed
    allowedAttributes: {
        'a': ['href', 'title', 'target'],
        'img': ['src', 'alt', 'title', 'width', 'height'],
        'div': ['class', 'id'],
        'span': ['class', 'id'],
        'p': ['class'],
        'h1': ['class'], 'h2': ['class'], 'h3': ['class'], 'h4': ['class'], 'h5': ['class'], 'h6': ['class']
    },
    
    // Maximum lengths for different input types
    maxLengths: {
        title: 200,
        content: 10000,
        caption: 500,
        comment: 1000,
        bio: 500,
        displayName: 50,
        category: 100
    },
    
    // Patterns for validation
    patterns: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        url: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
        phone: /^[\+]?[1-9][\d]{0,15}$/,
        username: /^[a-zA-Z0-9_-]{3,20}$/
    }
};

// Input sanitization class
class InputSanitizer {
    constructor() {
        this.config = SANITIZATION_CONFIG;
    }
    
    // Sanitize HTML content
    sanitizeHTML(html, options = {}) {
        if (!html || typeof html !== 'string') {
            return '';
        }
        
        const allowedTags = options.allowedTags || this.config.allowedTags;
        const allowedAttributes = options.allowedAttributes || this.config.allowedAttributes;
        
        // Create a temporary div to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Recursively sanitize nodes
        this.sanitizeNode(tempDiv, allowedTags, allowedAttributes);
        
        return tempDiv.innerHTML;
    }
    
    // Recursively sanitize DOM nodes
    sanitizeNode(node, allowedTags, allowedAttributes) {
        if (node.nodeType === Node.TEXT_NODE) {
            return; // Text nodes are safe
        }
        
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            
            // Remove disallowed tags
            if (!allowedTags.includes(tagName)) {
                // Move children to parent and remove this node
                const parent = node.parentNode;
                while (node.firstChild) {
                    parent.insertBefore(node.firstChild, node);
                }
                parent.removeChild(node);
                return;
            }
            
            // Sanitize attributes
            const allowedAttrs = allowedAttributes[tagName] || [];
            const attributes = Array.from(node.attributes);
            
            attributes.forEach(attr => {
                if (!allowedAttrs.includes(attr.name)) {
                    node.removeAttribute(attr.name);
                } else {
                    // Sanitize attribute values
                    const sanitizedValue = this.sanitizeAttributeValue(attr.name, attr.value);
                    node.setAttribute(attr.name, sanitizedValue);
                }
            });
            
            // Special handling for specific tags
            if (tagName === 'a') {
                this.sanitizeLink(node);
            } else if (tagName === 'img') {
                this.sanitizeImage(node);
            }
        }
        
        // Recursively process children
        const children = Array.from(node.childNodes);
        children.forEach(child => this.sanitizeNode(child, allowedTags, allowedAttributes));
    }
    
    // Sanitize link attributes
    sanitizeLink(node) {
        const href = node.getAttribute('href');
        if (href) {
            // Ensure external links open in new tab
            if (href.startsWith('http') && !href.includes(window.location.hostname)) {
                node.setAttribute('target', '_blank');
                node.setAttribute('rel', 'noopener noreferrer');
            }
            
            // Validate URL format
            if (!this.config.patterns.url.test(href) && !href.startsWith('#')) {
                node.removeAttribute('href');
            }
        }
    }
    
    // Sanitize image attributes
    sanitizeImage(node) {
        const src = node.getAttribute('src');
        if (src) {
            // Only allow images from trusted sources
            const allowedDomains = [
                'res.cloudinary.com',
                'firebasestorage.googleapis.com',
                window.location.hostname
            ];
            
            const url = new URL(src, window.location.href);
            if (!allowedDomains.some(domain => url.hostname.includes(domain))) {
                node.removeAttribute('src');
            }
        }
    }
    
    // Sanitize attribute values
    sanitizeAttributeValue(attrName, value) {
        if (!value) return '';
        
        // Remove dangerous patterns
        const dangerousPatterns = [
            /javascript:/gi,
            /vbscript:/gi,
            /on\w+\s*=/gi,
            /data:/gi,
            /<script/gi,
            /<\/script>/gi
        ];
        
        let sanitized = value;
        dangerousPatterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '');
        });
        
        return sanitized;
    }
    
    // Sanitize plain text (remove HTML tags)
    sanitizeText(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        // Remove HTML tags
        let sanitized = text.replace(/<[^>]*>/g, '');
        
        // Decode HTML entities
        const textarea = document.createElement('textarea');
        textarea.innerHTML = sanitized;
        sanitized = textarea.value;
        
        // Remove dangerous characters
        sanitized = sanitized.replace(/[<>]/g, '');
        
        return sanitized.trim();
    }
    
    // Validate and sanitize email
    sanitizeEmail(email) {
        if (!email || typeof email !== 'string') {
            return '';
        }
        
        const sanitized = email.toLowerCase().trim();
        
        if (!this.config.patterns.email.test(sanitized)) {
            throw new Error('Invalid email format');
        }
        
        return sanitized;
    }
    
    // Validate and sanitize URL
    sanitizeURL(url) {
        if (!url || typeof url !== 'string') {
            return '';
        }
        
        const sanitized = url.trim();
        
        if (!this.config.patterns.url.test(sanitized)) {
            throw new Error('Invalid URL format');
        }
        
        return sanitized;
    }
    
    // Validate and sanitize username
    sanitizeUsername(username) {
        if (!username || typeof username !== 'string') {
            return '';
        }
        
        const sanitized = username.trim();
        
        if (!this.config.patterns.username.test(sanitized)) {
            throw new Error('Username must be 3-20 characters long and contain only letters, numbers, underscores, and hyphens');
        }
        
        return sanitized;
    }
    
    // Validate input length
    validateLength(input, type) {
        const maxLength = this.config.maxLengths[type];
        if (maxLength && input.length > maxLength) {
            throw new Error(`${type} is too long. Maximum ${maxLength} characters allowed.`);
        }
        return true;
    }
    
    // Comprehensive input validation and sanitization
    validateAndSanitize(input, type, options = {}) {
        try {
            let sanitized = input;
            
            switch (type) {
                case 'html':
                    sanitized = this.sanitizeHTML(input, options);
                    break;
                    
                case 'text':
                    sanitized = this.sanitizeText(input);
                    break;
                    
                case 'email':
                    sanitized = this.sanitizeEmail(input);
                    break;
                    
                case 'url':
                    sanitized = this.sanitizeURL(input);
                    break;
                    
                case 'username':
                    sanitized = this.sanitizeUsername(input);
                    break;
                    
                default:
                    sanitized = this.sanitizeText(input);
            }
            
            // Validate length
            this.validateLength(sanitized, options.lengthType || type);
            
            return {
                isValid: true,
                sanitized: sanitized,
                original: input
            };
            
        } catch (error) {
            return {
                isValid: false,
                error: error.message,
                original: input
            };
        }
    }
    
    // Sanitize form data
    sanitizeFormData(formData, schema) {
        const sanitized = {};
        const errors = {};
        
        for (const [field, config] of Object.entries(schema)) {
            const value = formData[field];
            
            if (config.required && (!value || value.trim() === '')) {
                errors[field] = `${field} is required`;
                continue;
            }
            
            if (value) {
                const validation = this.validateAndSanitize(value, config.type, {
                    lengthType: config.lengthType,
                    allowedTags: config.allowedTags,
                    allowedAttributes: config.allowedAttributes
                });
                
                if (validation.isValid) {
                    sanitized[field] = validation.sanitized;
                } else {
                    errors[field] = validation.error;
                }
            }
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            sanitized: sanitized,
            errors: errors
        };
    }
}

// Create global instance
const inputSanitizer = new InputSanitizer();

// Export functions and classes
window.InputSanitizer = {
    InputSanitizer,
    inputSanitizer,
    SANITIZATION_CONFIG
};
