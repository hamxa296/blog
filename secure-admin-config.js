/**
 * secure-admin-config.js
 * Secure admin configuration with server-side validation only
 * This replaces the original admin-config.js with enhanced security
 */

// Secure admin configuration
const SECURE_ADMIN_CONFIG = {
    // Admin validation settings
    validation: {
        cacheTimeout: 5 * 60 * 1000, // 5 minutes
        maxRetries: 3,
        retryDelay: 1000 // 1 second
    },
    
    // Security settings
    security: {
        requireReauth: true,
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        maxFailedAttempts: 5
    }
};

// Secure admin validator class
class SecureAdminValidator {
    constructor() {
        this.adminCache = new Map();
        this.failedAttempts = new Map();
        this.lastValidation = new Map();
    }
    
    // Validate admin status securely (server-side only)
    async validateAdminStatus(userId, requireReauth = false) {
        try {
            // Check if user is authenticated
            const user = firebase.auth().currentUser;
            if (!user || user.uid !== userId) {
                return { isAdmin: false, reason: 'Not authenticated' };
            }
            
            // Check failed attempts
            const failedCount = this.failedAttempts.get(userId) || 0;
            if (failedCount >= SECURE_ADMIN_CONFIG.security.maxFailedAttempts) {
                return { isAdmin: false, reason: 'Too many failed attempts' };
            }
            
            // Check cache first
            const cached = this.adminCache.get(userId);
            const now = Date.now();
            
            if (cached && (now - cached.timestamp) < SECURE_ADMIN_CONFIG.validation.cacheTimeout) {
                // Check if re-authentication is required
                if (requireReauth && (now - cached.timestamp) > SECURE_ADMIN_CONFIG.security.sessionTimeout) {
                    return { isAdmin: false, reason: 'Re-authentication required' };
                }
                
                return { isAdmin: cached.isAdmin, reason: 'Cached validation' };
            }
            
            // Validate against Firestore (server-side rules will enforce this)
            const userDoc = await firebase.firestore().collection('users').doc(userId).get();
            
            if (!userDoc.exists) {
                this.recordFailedAttempt(userId);
                return { isAdmin: false, reason: 'User document not found' };
            }
            
            const userData = userDoc.data();
            const isAdmin = userData.isAdmin === true;
            
            // Cache the result
            this.adminCache.set(userId, { 
                isAdmin, 
                timestamp: now,
                lastValidation: now
            });
            
            // Clear failed attempts on success
            this.failedAttempts.delete(userId);
            
            return { isAdmin, reason: 'Server validation' };
            
        } catch (error) {
            this.recordFailedAttempt(userId);
            console.error('Admin validation error:', error);
            return { isAdmin: false, reason: 'Validation error' };
        }
    }
    
    // Record failed validation attempt
    recordFailedAttempt(userId) {
        const current = this.failedAttempts.get(userId) || 0;
        this.failedAttempts.set(userId, current + 1);
        
        // Clear failed attempts after timeout
        setTimeout(() => {
            this.failedAttempts.delete(userId);
        }, 15 * 60 * 1000); // 15 minutes
    }
    
    // Clear admin cache
    clearCache(userId = null) {
        if (userId) {
            this.adminCache.delete(userId);
            this.failedAttempts.delete(userId);
        } else {
            this.adminCache.clear();
            this.failedAttempts.clear();
        }
    }
    
    // Clear expired cache entries
    cleanupCache() {
        const now = Date.now();
        
        for (const [userId, data] of this.adminCache.entries()) {
            if (now - data.timestamp > SECURE_ADMIN_CONFIG.validation.cacheTimeout) {
                this.adminCache.delete(userId);
            }
        }
        
        // Clear old failed attempts
        for (const [userId, timestamp] of this.failedAttempts.entries()) {
            if (now - timestamp > 15 * 60 * 1000) {
                this.failedAttempts.delete(userId);
            }
        }
    }
    
    // Get admin statistics
    getAdminStats() {
        return {
            cachedAdmins: this.adminCache.size,
            failedAttempts: this.failedAttempts.size,
            cacheTimeout: SECURE_ADMIN_CONFIG.validation.cacheTimeout,
            maxFailedAttempts: SECURE_ADMIN_CONFIG.security.maxFailedAttempts
        };
    }
}

// Secure admin action validator
class SecureAdminActionValidator {
    constructor() {
        this.actionHistory = new Map();
        this.rateLimits = new Map();
    }
    
    // Validate admin action with rate limiting
    async validateAdminAction(userId, action, data = null) {
        try {
            // Check rate limiting
            if (!this.checkRateLimit(userId, action)) {
                return { 
                    valid: false, 
                    reason: 'Rate limit exceeded',
                    retryAfter: this.getRetryAfter(userId, action)
                };
            }
            
            // Validate admin status
            const adminValidation = await secureAdminValidator.validateAdminStatus(userId, true);
            if (!adminValidation.isAdmin) {
                return { 
                    valid: false, 
                    reason: adminValidation.reason 
                };
            }
            
            // Log action
            this.logAction(userId, action, data);
            
            return { valid: true, reason: 'Action validated' };
            
        } catch (error) {
            console.error('Admin action validation error:', error);
            return { valid: false, reason: 'Validation error' };
        }
    }
    
    // Check rate limiting for actions
    checkRateLimit(userId, action) {
        const key = `${userId}-${action}`;
        const now = Date.now();
        const userActions = this.rateLimits.get(key) || [];
        
        // Remove old actions (older than 1 minute)
        const recentActions = userActions.filter(time => now - time < 60 * 1000);
        
        // Allow max 10 actions per minute
        if (recentActions.length >= 10) {
            return false;
        }
        
        recentActions.push(now);
        this.rateLimits.set(key, recentActions);
        
        return true;
    }
    
    // Get retry after time
    getRetryAfter(userId, action) {
        const key = `${userId}-${action}`;
        const userActions = this.rateLimits.get(key) || [];
        if (userActions.length === 0) return 0;
        
        const oldestAction = Math.min(...userActions);
        return Math.max(0, 60 * 1000 - (Date.now() - oldestAction));
    }
    
    // Log admin action
    logAction(userId, action, data) {
        const actionLog = {
            userId,
            action,
            timestamp: Date.now(),
            data: this.sanitizeData(data)
        };
        
        this.actionHistory.set(`${userId}-${Date.now()}`, actionLog);
        
        // Keep only last 100 actions
        if (this.actionHistory.size > 100) {
            const keys = Array.from(this.actionHistory.keys());
            keys.slice(0, 50).forEach(key => this.actionHistory.delete(key));
        }
    }
    
    // Sanitize data for logging
    sanitizeData(data) {
        if (!data) return null;
        
        const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
        const sanitized = { ...data };
        
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });
        
        return sanitized;
    }
    
    // Get action history
    getActionHistory(userId = null, limit = 50) {
        const actions = Array.from(this.actionHistory.values());
        
        if (userId) {
            return actions
                .filter(action => action.userId === userId)
                .slice(-limit);
        }
        
        return actions.slice(-limit);
    }
}

// Initialize secure admin components
const secureAdminValidator = new SecureAdminValidator();
const secureAdminActionValidator = new SecureAdminActionValidator();

// Cleanup cache every 10 minutes
setInterval(() => {
    secureAdminValidator.cleanupCache();
}, 10 * 60 * 1000);

// Export secure admin functions
window.SecureAdmin = {
    SecureAdminValidator,
    SecureAdminActionValidator,
    SECURE_ADMIN_CONFIG,
    secureAdminValidator,
    secureAdminActionValidator,
    
    // Convenience functions
    async isAdmin(userId) {
        const validation = await secureAdminValidator.validateAdminStatus(userId);
        return validation.isAdmin;
    },
    
    async validateAction(userId, action, data) {
        return await secureAdminActionValidator.validateAdminAction(userId, action, data);
    },
    
    getStats() {
        return {
            admin: secureAdminValidator.getAdminStats(),
            actions: secureAdminActionValidator.getActionHistory()
        };
    }
};

console.log('Secure admin configuration loaded');
