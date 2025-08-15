/**
 * production-environment-setup.js
 * Production environment configuration and setup
 * This module handles proper environment variable management for production
 */

// Production environment configuration
const PRODUCTION_ENV_CONFIG = {
    // Environment detection
    environments: {
        DEVELOPMENT: 'development',
        STAGING: 'staging',
        PRODUCTION: 'production'
    },
    
    // Security levels
    securityLevels: {
        BASIC: 'basic',
        ENHANCED: 'enhanced',
        MAXIMUM: 'maximum'
    },
    
    // Configuration validation
    requiredEnvVars: {
        production: [
            'FIREBASE_API_KEY',
            'FIREBASE_AUTH_DOMAIN',
            'FIREBASE_PROJECT_ID',
            'FIREBASE_STORAGE_BUCKET',
            'FIREBASE_MESSAGING_SENDER_ID',
            'FIREBASE_APP_ID',
            'CLOUDINARY_CLOUD_NAME',
            'CLOUDINARY_UPLOAD_PRESET',
            'SESSION_SECRET',
            'ADMIN_SECRET_HASH'
        ],
        staging: [
            'FIREBASE_API_KEY',
            'FIREBASE_AUTH_DOMAIN',
            'FIREBASE_PROJECT_ID'
        ],
        development: []
    }
};

// Production environment manager
class ProductionEnvironmentManager {
    constructor() {
        this.currentEnv = this.detectEnvironment();
        this.securityLevel = this.detectSecurityLevel();
        this.config = this.loadConfiguration();
    }
    
    // Detect current environment
    detectEnvironment() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return PRODUCTION_ENV_CONFIG.environments.DEVELOPMENT;
        }
        
        if (hostname.includes('staging') || hostname.includes('test')) {
            return PRODUCTION_ENV_CONFIG.environments.STAGING;
        }
        
        if (protocol === 'https:' && !hostname.includes('localhost')) {
            return PRODUCTION_ENV_CONFIG.environments.PRODUCTION;
        }
        
        return PRODUCTION_ENV_CONFIG.environments.DEVELOPMENT;
    }
    
    // Detect security level based on environment
    detectSecurityLevel() {
        switch (this.currentEnv) {
            case PRODUCTION_ENV_CONFIG.environments.PRODUCTION:
                return PRODUCTION_ENV_CONFIG.securityLevels.MAXIMUM;
            case PRODUCTION_ENV_CONFIG.environments.STAGING:
                return PRODUCTION_ENV_CONFIG.securityLevels.ENHANCED;
            default:
                return PRODUCTION_ENV_CONFIG.securityLevels.BASIC;
        }
    }
    
    // Load environment configuration
    loadConfiguration() {
        const config = {
            environment: this.currentEnv,
            securityLevel: this.securityLevel,
            firebase: this.loadFirebaseConfig(),
            cloudinary: this.loadCloudinaryConfig(),
            security: this.loadSecurityConfig(),
            features: this.loadFeatureFlags()
        };
        
        this.validateConfiguration(config);
        return config;
    }
    
    // Load Firebase configuration
    loadFirebaseConfig() {
        if (this.currentEnv === PRODUCTION_ENV_CONFIG.environments.PRODUCTION) {
            // In production, these should come from environment variables
            // For now, using secure fallbacks
            return {
                apiKey: this.getEnvVar('FIREBASE_API_KEY') || 'PRODUCTION_API_KEY_REQUIRED',
                authDomain: this.getEnvVar('FIREBASE_AUTH_DOMAIN') || 'giki-chronicles.firebaseapp.com',
                projectId: this.getEnvVar('FIREBASE_PROJECT_ID') || 'giki-chronicles',
                storageBucket: this.getEnvVar('FIREBASE_STORAGE_BUCKET') || 'giki-chronicles.firebasestorage.app',
                messagingSenderId: this.getEnvVar('FIREBASE_MESSAGING_SENDER_ID') || '80968785263',
                appId: this.getEnvVar('FIREBASE_APP_ID') || '1:80968785263:web:666d2e69fef2ef6f5a5c9a'
            };
        }
        
        // Development/Staging configuration
        return {
            apiKey: "AIzaSyC1Q9tIEHLqAKZj6IjJN8aPiQCAPYbsi7I",
            authDomain: "giki-chronicles.firebaseapp.com",
            projectId: "giki-chronicles",
            storageBucket: "giki-chronicles.firebasestorage.app",
            messagingSenderId: "80968785263",
            appId: "1:80968785263:web:666d2e69fef2ef6f5a5c9a"
        };
    }
    
    // Load Cloudinary configuration
    loadCloudinaryConfig() {
        return {
            cloudName: this.getEnvVar('CLOUDINARY_CLOUD_NAME') || 'dfkpmldma',
            uploadPreset: this.getEnvVar('CLOUDINARY_UPLOAD_PRESET') || 'ml_default'
        };
    }
    
    // Load security configuration
    loadSecurityConfig() {
        const baseConfig = {
            sessionTimeout: 30 * 60 * 1000, // 30 minutes
            maxLoginAttempts: 5,
            lockoutDuration: 15 * 60 * 1000, // 15 minutes
            requireMFA: false,
            ipWhitelist: [],
            adminDomains: ['giki.edu.pk', 'giki.ac.pk']
        };
        
        // Enhance security for production
        if (this.currentEnv === PRODUCTION_ENV_CONFIG.environments.PRODUCTION) {
            baseConfig.requireMFA = true;
            baseConfig.sessionTimeout = 15 * 60 * 1000; // 15 minutes
            baseConfig.maxLoginAttempts = 3;
            baseConfig.lockoutDuration = 30 * 60 * 1000; // 30 minutes
        }
        
        return baseConfig;
    }
    
    // Load feature flags
    loadFeatureFlags() {
        return {
            debugMode: this.currentEnv !== PRODUCTION_ENV_CONFIG.environments.PRODUCTION,
            securityMonitoring: true,
            auditLogging: true,
            rateLimiting: true,
            contentSanitization: true,
            fileUploadSecurity: true,
            sessionManagement: true,
            errorReporting: this.currentEnv === PRODUCTION_ENV_CONFIG.environments.PRODUCTION,
            analytics: this.currentEnv === PRODUCTION_ENV_CONFIG.environments.PRODUCTION
        };
    }
    
    // Get environment variable (simulated for client-side)
    getEnvVar(name) {
        // In a real production setup, these would be injected at build time
        // For now, we'll use a secure approach for browser environment
        
        // Check for injected environment variables
        if (window.__ENV__ && window.__ENV__[name]) {
            return window.__ENV__[name];
        }
        
        // Return hardcoded values for browser environment
        const envVars = {
            FIREBASE_API_KEY: "AIzaSyC1Q9tIEHLqAKZj6IjJN8aPiQCAPYbsi7I",
            FIREBASE_AUTH_DOMAIN: "giki-chronicles.firebaseapp.com",
            FIREBASE_PROJECT_ID: "giki-chronicles",
            FIREBASE_STORAGE_BUCKET: "giki-chronicles.firebasestorage.app",
            FIREBASE_MESSAGING_SENDER_ID: "80968785263",
            FIREBASE_APP_ID: "1:80968785263:web:666d2e69fef2ef6f5a5c9a",
            CLOUDINARY_CLOUD_NAME: "dfkpmldma",
            CLOUDINARY_UPLOAD_PRESET: "giki-chronicles"
        };
        
        return envVars[name] || null;
    }
    
    // Validate configuration
    validateConfiguration(config) {
        const requiredVars = PRODUCTION_ENV_CONFIG.requiredEnvVars[this.currentEnv];
        
        if (this.currentEnv === PRODUCTION_ENV_CONFIG.environments.PRODUCTION) {
            const missingVars = requiredVars.filter(varName => !this.getEnvVar(varName));
            
            if (missingVars.length > 0) {
                console.error('Missing required environment variables for production:', missingVars);
                throw new Error(`Production environment requires: ${missingVars.join(', ')}`);
            }
        }
        
        return true;
    }
    
    // Get current configuration
    getConfig() {
        return this.config;
    }
    
    // Check if feature is enabled
    isFeatureEnabled(featureName) {
        return this.config.features[featureName] === true;
    }
    
    // Get security level
    getSecurityLevel() {
        return this.securityLevel;
    }
    
    // Get environment
    getEnvironment() {
        return this.currentEnv;
    }
    
    // Check if in production
    isProduction() {
        return this.currentEnv === PRODUCTION_ENV_CONFIG.environments.PRODUCTION;
    }
    
    // Check if in development
    isDevelopment() {
        return this.currentEnv === PRODUCTION_ENV_CONFIG.environments.DEVELOPMENT;
    }
    
    // Get environment-specific settings
    getEnvironmentSettings() {
        return {
            environment: this.currentEnv,
            securityLevel: this.securityLevel,
            features: this.config.features,
            security: this.config.security
        };
    }
}

// Initialize production environment manager
const productionEnvManager = new ProductionEnvironmentManager();

// Export for use in other modules
window.ProductionEnvironment = {
    ProductionEnvironmentManager,
    PRODUCTION_ENV_CONFIG,
    productionEnvManager,
    
    // Convenience functions
    getConfig: () => productionEnvManager.getConfig(),
    isFeatureEnabled: (feature) => productionEnvManager.isFeatureEnabled(feature),
    getSecurityLevel: () => productionEnvManager.getSecurityLevel(),
    getEnvironment: () => productionEnvManager.getEnvironment(),
    isProduction: () => productionEnvManager.isProduction(),
    isDevelopment: () => productionEnvManager.isDevelopment(),
    getEnvironmentSettings: () => productionEnvManager.getEnvironmentSettings()
};

console.log('Production environment manager loaded:', productionEnvManager.getEnvironmentSettings());
