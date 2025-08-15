/**
 * api-security.js
 * Comprehensive API security with validation, rate limiting, and logging
 */

// API security configuration
const API_SECURITY_CONFIG = {
    // Rate limiting settings
    rateLimits: {
        default: {
            requests: 100,
            window: 60 * 1000, // 1 minute
            blockDuration: 5 * 60 * 1000 // 5 minutes
        },
        auth: {
            requests: 5,
            window: 60 * 1000, // 1 minute
            blockDuration: 15 * 60 * 1000 // 15 minutes
        },
        upload: {
            requests: 10,
            window: 60 * 1000, // 1 minute
            blockDuration: 10 * 60 * 1000 // 10 minutes
        },
        admin: {
            requests: 50,
            window: 60 * 1000, // 1 minute
            blockDuration: 30 * 60 * 1000 // 30 minutes
        }
    },
    
    // Request validation
    validation: {
        maxRequestSize: 10 * 1024 * 1024, // 10MB
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        requiredHeaders: ['Content-Type'],
        blockedUserAgents: [
            /bot/i,
            /crawler/i,
            /spider/i,
            /scraper/i
        ],
        suspiciousPatterns: [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /eval\s*\(/i,
            /document\./i,
            /window\./i
        ]
    },
    
    // Logging settings
    logging: {
        enabled: true,
        logLevels: ['error', 'warn', 'info', 'debug'],
        maxLogSize: 1000,
        sensitiveFields: ['password', 'token', 'secret', 'apiKey', 'auth']
    },
    
    // Security headers
    securityHeaders: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    }
};

// API security class
class APISecurity {
    constructor() {
        this.rateLimiters = new Map();
        this.requestLog = [];
        this.blockedIPs = new Map();
        this.suspiciousRequests = new Map();
        
        this.initializeRateLimiters();
        this.setupRequestInterception();
        this.setupResponseInterception();
    }
    
    /**
     * Initialize rate limiters for different endpoints
     */
    initializeRateLimiters() {
        Object.keys(API_SECURITY_CONFIG.rateLimits).forEach(endpoint => {
            const config = API_SECURITY_CONFIG.rateLimits[endpoint];
            this.rateLimiters.set(endpoint, {
                requests: [],
                blockedUntil: null,
                config
            });
        });
    }
    
    /**
     * Setup request interception
     */
    setupRequestInterception() {
        // Override fetch to intercept all requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const request = this.createRequestObject(...args);
            
            // Validate request
            const validation = this.validateRequest(request);
            if (!validation.valid) {
                this.logSecurityEvent('request_validation_failed', {
                    request,
                    reason: validation.reason
                });
                throw new Error(`Request validation failed: ${validation.reason}`);
            }
            
            // Check rate limiting
            const rateLimitCheck = this.checkRateLimit(request);
            if (!rateLimitCheck.allowed) {
                this.logSecurityEvent('rate_limit_exceeded', {
                    request,
                    endpoint: rateLimitCheck.endpoint,
                    blockedUntil: rateLimitCheck.blockedUntil
                });
                throw new Error(`Rate limit exceeded. Try again after ${new Date(rateLimitCheck.blockedUntil).toLocaleTimeString()}`);
            }
            
            // Log request
            this.logRequest(request);
            
            try {
                const response = await originalFetch(...args);
                
                // Log response
                this.logResponse(request, response);
                
                // Check for suspicious response patterns
                this.checkResponseSecurity(response);
                
                return response;
            } catch (error) {
                this.logSecurityEvent('request_failed', {
                    request,
                    error: error.message
                });
                throw error;
            }
        };
        
        // Override XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            this._apiRequest = {
                method,
                url,
                timestamp: Date.now(),
                type: 'xhr'
            };
            return originalXHROpen.call(this, method, url, ...args);
        };
        
        XMLHttpRequest.prototype.send = function(data) {
            if (this._apiRequest) {
                this._apiRequest.data = data;
                const request = this._apiRequest;
                
                // Validate request
                const validation = window.apiSecurity.validateRequest(request);
                if (!validation.valid) {
                    this.logSecurityEvent('request_validation_failed', {
                        request,
                        reason: validation.reason
                    });
                    throw new Error(`Request validation failed: ${validation.reason}`);
                }
                
                // Check rate limiting
                const rateLimitCheck = window.apiSecurity.checkRateLimit(request);
                if (!rateLimitCheck.allowed) {
                    this.logSecurityEvent('rate_limit_exceeded', {
                        request,
                        endpoint: rateLimitCheck.endpoint,
                        blockedUntil: rateLimitCheck.blockedUntil
                    });
                    throw new Error(`Rate limit exceeded. Try again after ${new Date(rateLimitCheck.blockedUntil).toLocaleTimeString()}`);
                }
                
                // Log request
                window.apiSecurity.logRequest(request);
            }
            
            return originalXHRSend.call(this, data);
        };
    }
    
    /**
     * Setup response interception
     */
    setupResponseInterception() {
        // Monitor for suspicious response patterns
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.checkDOMSecurity(node);
                        }
                    });
                }
            });
        });
        
        // Wait for document.body to be available
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        } else {
            // If body is not available yet, wait for it
            document.addEventListener('DOMContentLoaded', () => {
                if (document.body) {
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                }
            });
        }
    }
    
    /**
     * Create request object from fetch arguments
     */
    createRequestObject(url, options = {}) {
        return {
            url: typeof url === 'string' ? url : url.toString(),
            method: options.method || 'GET',
            headers: options.headers || {},
            body: options.body,
            timestamp: Date.now(),
            type: 'fetch',
            userAgent: navigator.userAgent,
            referrer: document.referrer
        };
    }
    
    /**
     * Validate request
     */
    validateRequest(request) {
        // Check request size
        if (request.body && request.body.size > API_SECURITY_CONFIG.validation.maxRequestSize) {
            return { valid: false, reason: 'request_too_large' };
        }
        
        // Check method
        if (!API_SECURITY_CONFIG.validation.allowedMethods.includes(request.method)) {
            return { valid: false, reason: 'method_not_allowed' };
        }
        
        // Check user agent
        if (this.isBlockedUserAgent(request.userAgent)) {
            return { valid: false, reason: 'blocked_user_agent' };
        }
        
        // Check for suspicious patterns in URL
        if (this.containsSuspiciousPatterns(request.url)) {
            return { valid: false, reason: 'suspicious_url_pattern' };
        }
        
        // Check for suspicious patterns in body
        if (request.body && this.containsSuspiciousPatterns(request.body.toString())) {
            return { valid: false, reason: 'suspicious_body_pattern' };
        }
        
        // Check headers
        const headerValidation = this.validateHeaders(request.headers);
        if (!headerValidation.valid) {
            return { valid: false, reason: headerValidation.reason };
        }
        
        return { valid: true };
    }
    
    /**
     * Check if user agent is blocked
     */
    isBlockedUserAgent(userAgent) {
        return API_SECURITY_CONFIG.validation.blockedUserAgents.some(pattern => 
            pattern.test(userAgent)
        );
    }
    
    /**
     * Check for suspicious patterns
     */
    containsSuspiciousPatterns(content) {
        return API_SECURITY_CONFIG.validation.suspiciousPatterns.some(pattern => 
            pattern.test(content)
        );
    }
    
    /**
     * Validate headers
     */
    validateHeaders(headers) {
        // Check required headers for POST/PUT requests
        if (headers instanceof Headers) {
            const contentType = headers.get('Content-Type');
            if (!contentType && (request.method === 'POST' || request.method === 'PUT')) {
                return { valid: false, reason: 'missing_content_type' };
            }
        }
        
        return { valid: true };
    }
    
    /**
     * Check rate limiting
     */
    checkRateLimit(request) {
        const endpoint = this.getEndpointFromRequest(request);
        const rateLimiter = this.rateLimiters.get(endpoint) || this.rateLimiters.get('default');
        
        // Check if currently blocked
        if (rateLimiter.blockedUntil && Date.now() < rateLimiter.blockedUntil) {
            return {
                allowed: false,
                endpoint,
                blockedUntil: rateLimiter.blockedUntil
            };
        }
        
        const now = Date.now();
        const windowStart = now - rateLimiter.config.window;
        
        // Remove old requests outside the window
        rateLimiter.requests = rateLimiter.requests.filter(timestamp => timestamp > windowStart);
        
        // Check if limit exceeded
        if (rateLimiter.requests.length >= rateLimiter.config.requests) {
            rateLimiter.blockedUntil = now + rateLimiter.config.blockDuration;
            
            this.logSecurityEvent('rate_limit_triggered', {
                request,
                endpoint,
                blockedUntil: rateLimiter.blockedUntil
            });
            
            return {
                allowed: false,
                endpoint,
                blockedUntil: rateLimiter.blockedUntil
            };
        }
        
        // Add current request
        rateLimiter.requests.push(now);
        
        return { allowed: true, endpoint };
    }
    
    /**
     * Get endpoint from request
     */
    getEndpointFromRequest(request) {
        const url = request.url.toLowerCase();
        
        if (url.includes('/auth') || url.includes('login') || url.includes('signup')) {
            return 'auth';
        }
        
        if (url.includes('/upload') || url.includes('cloudinary')) {
            return 'upload';
        }
        
        if (url.includes('/admin') || url.includes('admin')) {
            return 'admin';
        }
        
        return 'default';
    }
    
    /**
     * Log request
     */
    logRequest(request) {
        if (!API_SECURITY_CONFIG.logging.enabled) return;
        
        const logEntry = {
            type: 'request',
            timestamp: new Date().toISOString(),
            method: request.method,
            url: this.sanitizeUrl(request.url),
            userAgent: request.userAgent,
            referrer: request.referrer,
            sessionId: window.sessionManager?.sessionId,
            userId: window.sessionManager?.sessionData?.userId
        };
        
        this.requestLog.push(logEntry);
        this.cleanupLog();
        
        // Send to server
        this.sendLogToServer(logEntry);
    }
    
    /**
     * Log response
     */
    logResponse(request, response) {
        if (!API_SECURITY_CONFIG.logging.enabled) return;
        
        const logEntry = {
            type: 'response',
            timestamp: new Date().toISOString(),
            method: request.method,
            url: this.sanitizeUrl(request.url),
            status: response.status,
            statusText: response.statusText,
            sessionId: window.sessionManager?.sessionId,
            userId: window.sessionManager?.sessionData?.userId
        };
        
        this.requestLog.push(logEntry);
        this.cleanupLog();
        
        // Send to server
        this.sendLogToServer(logEntry);
    }
    
    /**
     * Sanitize URL for logging
     */
    sanitizeUrl(url) {
        try {
            const urlObj = new URL(url);
            // Remove sensitive query parameters
            const sensitiveParams = ['token', 'auth', 'key', 'password'];
            sensitiveParams.forEach(param => {
                urlObj.searchParams.delete(param);
            });
            return urlObj.toString();
        } catch (error) {
            return url;
        }
    }
    
    /**
     * Check response security
     */
    checkResponseSecurity(response) {
        // Check for suspicious response headers
        const suspiciousHeaders = ['x-powered-by', 'server'];
        suspiciousHeaders.forEach(header => {
            if (response.headers.get(header)) {
                this.logSecurityEvent('suspicious_response_header', {
                    header,
                    value: response.headers.get(header)
                });
            }
        });
        
        // Check response status for potential issues
        if (response.status >= 500) {
            this.logSecurityEvent('server_error_response', {
                status: response.status,
                statusText: response.statusText
            });
        }
    }
    
    /**
     * Check DOM security
     */
    checkDOMSecurity(node) {
        // Check for suspicious script tags
        if (node.tagName === 'SCRIPT') {
            const src = node.getAttribute('src');
            if (src && !this.isTrustedSource(src)) {
                this.logSecurityEvent('suspicious_script_tag', {
                    src,
                    node: node.outerHTML
                });
            }
        }
        
        // Check for suspicious event handlers
        const suspiciousEvents = ['onload', 'onerror', 'onclick'];
        suspiciousEvents.forEach(event => {
            if (node.hasAttribute(event)) {
                this.logSecurityEvent('suspicious_event_handler', {
                    event,
                    value: node.getAttribute(event),
                    node: node.outerHTML
                });
            }
        });
    }
    
    /**
     * Check if source is trusted
     */
    isTrustedSource(src) {
        const trustedDomains = [
            'localhost',
            '127.0.0.1',
            'giki-chronicles.firebaseapp.com',
            'firebaseapp.com',
            'googleapis.com',
            'cloudinary.com'
        ];
        
        return trustedDomains.some(domain => src.includes(domain));
    }
    
    /**
     * Log security event
     */
    logSecurityEvent(eventType, data) {
        const logEntry = {
            type: 'security_event',
            eventType,
            timestamp: new Date().toISOString(),
            data: this.sanitizeLogData(data),
            sessionId: window.sessionManager?.sessionId,
            userId: window.sessionManager?.sessionData?.userId,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        this.requestLog.push(logEntry);
        this.cleanupLog();
        
        // Send to server
        this.sendLogToServer(logEntry);
        
        // Show warning for critical events
        if (eventType.includes('suspicious') || eventType.includes('security')) {
            this.showSecurityWarning(eventType, data);
        }
    }
    
    /**
     * Sanitize log data
     */
    sanitizeLogData(data) {
        const sanitized = { ...data };
        
        API_SECURITY_CONFIG.logging.sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });
        
        return sanitized;
    }
    
    /**
     * Show security warning
     */
    showSecurityWarning(eventType, data) {
        // Create warning notification
        const warning = document.createElement('div');
        warning.className = 'fixed top-4 left-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md';
        warning.innerHTML = `
            <div class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
                <span>Security warning: ${eventType.replace(/_/g, ' ')}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(warning);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (warning.parentNode) {
                warning.parentNode.removeChild(warning);
            }
        }, 10000);
    }
    
    /**
     * Cleanup log
     */
    cleanupLog() {
        if (this.requestLog.length > API_SECURITY_CONFIG.logging.maxLogSize) {
            this.requestLog = this.requestLog.slice(-API_SECURITY_CONFIG.logging.maxLogSize / 2);
        }
    }
    
    /**
     * Send log to server
     */
    async sendLogToServer(logEntry) {
        try {
            if (window.db && window.sessionManager?.sessionData) {
                await window.db.collection('api_logs').add({
                    ...logEntry,
                    createdAt: new Date()
                });
            }
        } catch (error) {
            // Don't log logging errors to avoid loops
        }
    }
    
    /**
     * Get API statistics
     */
    getAPIStats() {
        const stats = {
            totalRequests: this.requestLog.filter(log => log.type === 'request').length,
            totalResponses: this.requestLog.filter(log => log.type === 'response').length,
            securityEvents: this.requestLog.filter(log => log.type === 'security_event').length,
            rateLimitBlocks: this.requestLog.filter(log => log.eventType === 'rate_limit_exceeded').length,
            recentActivity: this.requestLog.slice(-10)
        };
        
        return stats;
    }
    
    /**
     * Get rate limiter status
     */
    getRateLimiterStatus() {
        const status = {};
        
        this.rateLimiters.forEach((limiter, endpoint) => {
            status[endpoint] = {
                requests: limiter.requests.length,
                maxRequests: limiter.config.requests,
                window: limiter.config.window,
                blockedUntil: limiter.blockedUntil,
                isBlocked: limiter.blockedUntil && Date.now() < limiter.blockedUntil
            };
        });
        
        return status;
    }
    
    /**
     * Reset rate limiter for endpoint
     */
    resetRateLimiter(endpoint) {
        const limiter = this.rateLimiters.get(endpoint);
        if (limiter) {
            limiter.requests = [];
            limiter.blockedUntil = null;
        }
    }
    
    /**
     * Clear all logs
     */
    clearLogs() {
        this.requestLog = [];
    }
    
    /**
     * Export logs
     */
    exportLogs() {
        const dataStr = JSON.stringify(this.requestLog, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `api-logs-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }
}

// Initialize API security with DOM readiness check
let apiSecurity = null;

function initializeAPISecurity() {
    if (!apiSecurity) {
        apiSecurity = new APISecurity();
        
        // Make available globally
        window.apiSecurity = apiSecurity;
        window.APISecurity = APISecurity;
        window.API_SECURITY_CONFIG = API_SECURITY_CONFIG;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAPISecurity);
} else {
    // DOM is already loaded
    initializeAPISecurity();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APISecurity, apiSecurity, API_SECURITY_CONFIG };
}
