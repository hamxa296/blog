/**
 * security-monitor.js
 * Comprehensive security monitoring and logging system
 */

// Security monitoring configuration
const SECURITY_CONFIG = {
    // Logging levels
    levels: {
        INFO: 'info',
        WARNING: 'warning',
        ERROR: 'error',
        CRITICAL: 'critical'
    },
    
    // Event types
    eventTypes: {
        AUTH_SUCCESS: 'auth_success',
        AUTH_FAILURE: 'auth_failure',
        ADMIN_ACTION: 'admin_action',
        FILE_UPLOAD: 'file_upload',
        FILE_REJECTED: 'file_rejected',
        INPUT_SANITIZATION: 'input_sanitization',
        RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
        SUSPICIOUS_ACTIVITY: 'suspicious_activity',
        ERROR_OCCURRED: 'error_occurred'
    },
    
    // Rate limiting thresholds
    rateLimits: {
        authAttempts: { max: 5, window: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
        fileUploads: { max: 10, window: 60 * 60 * 1000 }, // 10 uploads per hour
        adminActions: { max: 20, window: 60 * 60 * 1000 }, // 20 actions per hour
        formSubmissions: { max: 30, window: 60 * 60 * 1000 } // 30 submissions per hour
    },
    
    // Suspicious activity patterns
    suspiciousPatterns: [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /eval\s*\(/i,
        /document\./i,
        /window\./i,
        /alert\s*\(/i,
        /confirm\s*\(/i,
        /prompt\s*\(/i
    ]
};

// Security monitoring class
class SecurityMonitor {
    constructor() {
        this.config = SECURITY_CONFIG;
        this.logs = [];
        this.rateLimiters = this.initializeRateLimiters();
        this.suspiciousActivities = [];
        this.maxLogs = 1000; // Keep last 1000 logs in memory
        
        // Initialize monitoring
        this.setupEventListeners();
        this.startPeriodicCleanup();
    }
    
    // Initialize rate limiters
    initializeRateLimiters() {
        const limiters = {};
        for (const [key, config] of Object.entries(this.config.rateLimits)) {
            limiters[key] = {
                attempts: [],
                config: config
            };
        }
        return limiters;
    }
    
    // Setup global event listeners
    setupEventListeners() {
        // Monitor for suspicious patterns in user input
        document.addEventListener('input', (e) => {
            this.monitorUserInput(e.target.value, e.target.id || e.target.name);
        });
        
        // Monitor form submissions
        document.addEventListener('submit', (e) => {
            this.monitorFormSubmission(e.target);
        });
        
        // Monitor for errors
        window.addEventListener('error', (e) => {
            this.logSecurityEvent(this.config.eventTypes.ERROR_OCCURRED, {
                level: this.config.levels.ERROR,
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
                error: e.error?.stack
            });
        });
        
        // Monitor for unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            this.logSecurityEvent(this.config.eventTypes.ERROR_OCCURRED, {
                level: this.config.levels.ERROR,
                message: 'Unhandled promise rejection',
                reason: e.reason
            });
        });
    }
    
    // Monitor user input for suspicious patterns
    monitorUserInput(value, fieldName) {
        if (!value || typeof value !== 'string') return;
        
        for (const pattern of this.config.suspiciousPatterns) {
            if (pattern.test(value)) {
                this.logSecurityEvent(this.config.eventTypes.SUSPICIOUS_ACTIVITY, {
                    level: this.config.levels.WARNING,
                    message: 'Suspicious input detected',
                    field: fieldName,
                    pattern: pattern.source,
                    value: value.substring(0, 100) // Log first 100 chars only
                });
                
                // Add to suspicious activities list
                this.suspiciousActivities.push({
                    timestamp: Date.now(),
                    field: fieldName,
                    pattern: pattern.source,
                    value: value.substring(0, 100)
                });
                
                break;
            }
        }
    }
    
    // Monitor form submissions
    monitorFormSubmission(form) {
        const formData = new FormData(form);
        const submissionData = {};
        
        for (const [key, value] of formData.entries()) {
            submissionData[key] = value;
        }
        
        // Check rate limiting
        if (!this.checkRateLimit('formSubmissions')) {
            this.logSecurityEvent(this.config.eventTypes.RATE_LIMIT_EXCEEDED, {
                level: this.config.levels.WARNING,
                message: 'Form submission rate limit exceeded',
                formId: form.id || 'unknown'
            });
            return false;
        }
        
        // Log form submission
        this.logSecurityEvent('form_submission', {
            level: this.config.levels.INFO,
            formId: form.id || 'unknown',
            fields: Object.keys(submissionData)
        });
        
        return true;
    }
    
    // Check rate limiting
    checkRateLimit(type) {
        const limiter = this.rateLimiters[type];
        if (!limiter) return true;
        
        const now = Date.now();
        const window = limiter.config.window;
        
        // Remove old attempts
        limiter.attempts = limiter.attempts.filter(timestamp => now - timestamp < window);
        
        // Check if limit exceeded
        if (limiter.attempts.length >= limiter.config.max) {
            return false;
        }
        
        // Add current attempt
        limiter.attempts.push(now);
        return true;
    }
    
    // Log security event
    logSecurityEvent(eventType, data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            eventType: eventType,
            level: data.level || this.config.levels.INFO,
            message: data.message || '',
            details: data,
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: this.getCurrentUserId()
        };
        
        // Add to logs
        this.logs.push(logEntry);
        
        // Keep logs under limit
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
        
        // Console output for development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log(`[SECURITY ${logEntry.level.toUpperCase()}] ${logEntry.message}`, logEntry);
        }
        
        // Send to server if available
        this.sendToServer(logEntry);
        
        // Trigger alerts for critical events
        if (logEntry.level === this.config.levels.CRITICAL) {
            this.triggerAlert(logEntry);
        }
    }
    
    // Get current user ID
    getCurrentUserId() {
        try {
            const user = firebase.auth().currentUser;
            return user ? user.uid : 'anonymous';
        } catch (error) {
            return 'unknown';
        }
    }
    
    // Send log to server
    async sendToServer(logEntry) {
        try {
            // Check if Firebase is properly initialized
            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0 && firebase.firestore) {
                const db = firebase.firestore();
                await db.collection('security_logs').add({
                    ...logEntry,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                // If Firebase is not ready, store locally for later
                this.pendingLogs = this.pendingLogs || [];
                this.pendingLogs.push(logEntry);
                
                // Try to send pending logs after a delay
                setTimeout(() => {
                    this.sendPendingLogs();
                }, 2000);
            }
        } catch (error) {
            console.error('Failed to send security log to server:', error);
        }
    }
    
    // Send pending logs when Firebase is ready
    async sendPendingLogs() {
        if (!this.pendingLogs || this.pendingLogs.length === 0) return;
        
        try {
            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0 && firebase.firestore) {
                const db = firebase.firestore();
                const batch = db.batch();
                
                this.pendingLogs.forEach(logEntry => {
                    const docRef = db.collection('security_logs').doc();
                    batch.set(docRef, {
                        ...logEntry,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });
                
                await batch.commit();
                this.pendingLogs = [];
            }
        } catch (error) {
            console.error('Failed to send pending security logs:', error);
        }
    }
    
    // Trigger alert for critical events
    triggerAlert(logEntry) {
        // Send notification to admin
        if (typeof window.showNotification === 'function') {
            window.showNotification('Security Alert', logEntry.message, 'error');
        }
        
        // Log to console
        console.error('CRITICAL SECURITY EVENT:', logEntry);
    }
    
    // Get security statistics
    getSecurityStats() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const oneDay = 24 * 60 * 60 * 1000;
        
        const recentLogs = this.logs.filter(log => 
            new Date(log.timestamp).getTime() > now - oneDay
        );
        
        const stats = {
            totalLogs: this.logs.length,
            recentLogs: recentLogs.length,
            suspiciousActivities: this.suspiciousActivities.length,
            rateLimitViolations: recentLogs.filter(log => 
                log.eventType === this.config.eventTypes.RATE_LIMIT_EXCEEDED
            ).length,
            criticalEvents: recentLogs.filter(log => 
                log.level === this.config.levels.CRITICAL
            ).length,
            errors: recentLogs.filter(log => 
                log.level === this.config.levels.ERROR
            ).length
        };
        
        return stats;
    }
    
    // Get recent logs
    getRecentLogs(limit = 50) {
        return this.logs.slice(-limit);
    }
    
    // Clear old logs
    clearOldLogs() {
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        const cutoff = Date.now() - oneWeek;
        
        this.logs = this.logs.filter(log => 
            new Date(log.timestamp).getTime() > cutoff
        );
        
        this.suspiciousActivities = this.suspiciousActivities.filter(activity => 
            activity.timestamp > cutoff
        );
    }
    
    // Start periodic cleanup
    startPeriodicCleanup() {
        setInterval(() => {
            this.clearOldLogs();
        }, 24 * 60 * 60 * 1000); // Daily cleanup
    }
    
    // Export logs for analysis
    exportLogs() {
        return {
            logs: this.logs,
            suspiciousActivities: this.suspiciousActivities,
            stats: this.getSecurityStats(),
            exportTime: new Date().toISOString()
        };
    }
}

// Create global instance with Firebase readiness check
let securityMonitor = null;

function initializeSecurityMonitor() {
    if (!securityMonitor) {
        securityMonitor = new SecurityMonitor();
        
        // Export functions and classes
        window.SecurityMonitor = {
            SecurityMonitor,
            securityMonitor,
            SECURITY_CONFIG
        };
        
        // Send any pending logs
        if (securityMonitor.pendingLogs && securityMonitor.pendingLogs.length > 0) {
            securityMonitor.sendPendingLogs();
        }
    }
}

// Initialize when Firebase is ready
if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
    initializeSecurityMonitor();
} else {
    // Wait for Firebase to be initialized
    document.addEventListener('DOMContentLoaded', () => {
        // Check again after DOM is loaded
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
            initializeSecurityMonitor();
        } else {
            // Wait a bit more and try again
            setTimeout(() => {
                if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
                    initializeSecurityMonitor();
                } else {
                    // Initialize anyway for basic functionality
                    initializeSecurityMonitor();
                }
            }, 1000);
        }
    });
}
