/**
 * production-security.js
 * Production security configuration and environment management
 * This file handles secure configuration loading and validation
 */

// Production security configuration
const PRODUCTION_SECURITY_CONFIG = {
    // Environment detection
    isProduction: () => {
        return window.location.hostname !== 'localhost' && 
               window.location.hostname !== '127.0.0.1' &&
               window.location.protocol === 'https:';
    },
    
    // Security levels
    securityLevels: {
        DEVELOPMENT: 'development',
        STAGING: 'staging',
        PRODUCTION: 'production'
    },
    
    // Configuration validation
    validateConfig: (config) => {
        const required = ['apiKey', 'authDomain', 'projectId'];
        const missing = required.filter(field => !config[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required configuration: ${missing.join(', ')}`);
        }
        
        return true;
    }
};

// Secure configuration loader
class SecureConfigLoader {
    constructor() {
        this.config = null;
        this.loaded = false;
    }
    
    // Load configuration securely
    async loadConfig() {
        try {
            // In production, this should come from environment variables
            // For now, we'll use a more secure approach
            const config = await this.getSecureConfig();
            
            if (PRODUCTION_SECURITY_CONFIG.validateConfig(config)) {
                this.config = config;
                this.loaded = true;
                return config;
            }
        } catch (error) {
            console.error('Failed to load secure configuration:', error);
            throw new Error('Configuration loading failed');
        }
    }
    
    // Get secure configuration based on environment
    async getSecureConfig() {
        const isProd = PRODUCTION_SECURITY_CONFIG.isProduction();
        
        if (isProd) {
            // In production, use environment variables or secure API
            return this.getProductionConfig();
        } else {
            // In development, use development config
            return this.getDevelopmentConfig();
        }
    }
    
    // Production configuration (should be loaded from secure source)
    getProductionConfig() {
        // Use hardcoded values for browser environment
        return {
            apiKey: "AIzaSyC1Q9tIEHLqAKZj6IjJN8aPiQCAPYbsi7I",
            authDomain: "giki-chronicles.firebaseapp.com",
            projectId: "giki-chronicles",
            storageBucket: "giki-chronicles.firebasestorage.app",
            messagingSenderId: "80968785263",
            appId: "1:80968785263:web:666d2e69fef2ef6f5a5c9a"
        };
    }
    
    // Development configuration
    getDevelopmentConfig() {
        return {
            apiKey: "AIzaSyC1Q9tIEHLqAKZj6IjJN8aPiQCAPYbsi7I",
            authDomain: "giki-chronicles.firebaseapp.com",
            projectId: "giki-chronicles",
            storageBucket: "giki-chronicles.firebasestorage.app",
            messagingSenderId: "80968785263",
            appId: "1:80968785263:web:666d2e69fef2ef6f5a5c9a"
        };
    }
    
    // Get current configuration
    getConfig() {
        if (!this.loaded) {
            throw new Error('Configuration not loaded. Call loadConfig() first.');
        }
        return this.config;
    }
}

// Secure admin validation is now handled by secure-admin-config.js
// This prevents duplicate class declarations

// Production console logger (removes sensitive data)
class ProductionLogger {
    constructor() {
        this.isProduction = PRODUCTION_SECURITY_CONFIG.isProduction();
        this.logLevel = this.isProduction ? 'error' : 'debug';
    }
    
    // Secure logging
    log(level, message, data = null) {
        if (this.shouldLog(level)) {
            const sanitizedData = this.sanitizeData(data);
            console[level](message, sanitizedData);
        }
    }
    
    // Check if should log based on level
    shouldLog(level) {
        if (!this.isProduction) return true;
        
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        return levels[level] >= levels[this.logLevel];
    }
    
    // Sanitize data for logging
    sanitizeData(data) {
        if (!data) return data;
        
        const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'auth'];
        const sanitized = { ...data };
        
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });
        
        return sanitized;
    }
    
    // Debug logging (only in development)
    debug(message, data) {
        this.log('debug', message, data);
    }
    
    // Info logging
    info(message, data) {
        this.log('info', message, data);
    }
    
    // Warning logging
    warn(message, data) {
        this.log('warn', message, data);
    }
    
    // Error logging
    error(message, data) {
        this.log('error', message, data);
    }
}

// Initialize production security
const secureConfigLoader = new SecureConfigLoader();
const secureAdminValidator = new SecureAdminValidator();
const productionLogger = new ProductionLogger();

// Export for use in other modules
window.ProductionSecurity = {
    SecureConfigLoader,
    SecureAdminValidator,
    ProductionLogger,
    PRODUCTION_SECURITY_CONFIG,
    secureConfigLoader,
    secureAdminValidator,
    productionLogger
};

// Auto-cleanup admin cache every 10 minutes
setInterval(() => {
    secureAdminValidator.cleanupCache();
}, 10 * 60 * 1000);

console.log('Production security module loaded');
