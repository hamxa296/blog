/**
 * multi-factor-authentication.js
 * Multi-Factor Authentication (MFA) implementation for enhanced admin security
 * This module provides TOTP-based MFA for admin accounts
 */

// MFA configuration
const MFA_CONFIG = {
    // TOTP settings
    totp: {
        algorithm: 'SHA1',
        digits: 6,
        period: 30, // 30 seconds
        window: 1 // Allow 1 period before/after for clock skew
    },
    
    // Security settings
    security: {
        maxAttempts: 3,
        lockoutDuration: 15 * 60 * 1000, // 15 minutes
        backupCodesCount: 10,
        requireMFAForAdmin: true,
        requireMFAForSensitiveActions: true
    },
    
    // Sensitive actions that require MFA
    sensitiveActions: [
        'delete_user',
        'delete_post',
        'delete_event',
        'delete_photo',
        'change_admin_status',
        'export_data',
        'system_configuration'
    ]
};

// MFA Manager class
class MFAManager {
    constructor() {
        this.attempts = new Map();
        this.backupCodes = new Map();
        this.secrets = new Map();
        this.isEnabled = false;
    }
    
    // Initialize MFA for a user
    async initializeMFA(userId) {
        try {
            // Generate secret key
            const secret = this.generateSecret();
            
            // Generate backup codes
            const backupCodes = this.generateBackupCodes();
            
            // Store in Firestore
            await this.storeMFAData(userId, secret, backupCodes);
            
            // Generate QR code URL
            const qrCodeUrl = this.generateQRCodeUrl(userId, secret);
            
            return {
                success: true,
                secret: secret,
                backupCodes: backupCodes,
                qrCodeUrl: qrCodeUrl
            };
        } catch (error) {
            console.error('MFA initialization error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Generate TOTP secret
    generateSecret() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        for (let i = 0; i < 32; i++) {
            secret += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return secret;
    }
    
    // Generate backup codes
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < MFA_CONFIG.security.backupCodesCount; i++) {
            codes.push(this.generateBackupCode());
        }
        return codes;
    }
    
    // Generate single backup code
    generateBackupCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    
    // Generate QR code URL for authenticator apps
    generateQRCodeUrl(userId, secret) {
        const user = firebase.auth().currentUser;
        const email = user ? user.email : userId;
        const issuer = 'GIKI Chronicles';
        const account = email;
        
        return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=${MFA_CONFIG.totp.algorithm}&digits=${MFA_CONFIG.totp.digits}&period=${MFA_CONFIG.totp.period}`;
    }
    
    // Store MFA data in Firestore
    async storeMFAData(userId, secret, backupCodes) {
        const mfaData = {
            userId: userId,
            secret: secret,
            backupCodes: backupCodes,
            enabled: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastUsed: null
        };
        
        await firebase.firestore().collection('mfa_data').doc(userId).set(mfaData);
    }
    
    // Verify TOTP code
    async verifyTOTP(userId, code) {
        try {
            // Check attempts
            if (this.isLockedOut(userId)) {
                return { success: false, error: 'Account temporarily locked due to too many failed attempts' };
            }
            
            // Get user's MFA data
            const mfaData = await this.getMFAData(userId);
            if (!mfaData || !mfaData.enabled) {
                return { success: false, error: 'MFA not enabled for this user' };
            }
            
            // Verify TOTP code
            const isValid = this.verifyTOTPCode(mfaData.secret, code);
            
            if (isValid) {
                // Reset attempts on success
                this.resetAttempts(userId);
                
                // Update last used timestamp
                await this.updateLastUsed(userId);
                
                return { success: true };
            } else {
                // Record failed attempt
                this.recordFailedAttempt(userId);
                
                return { success: false, error: 'Invalid MFA code' };
            }
        } catch (error) {
            console.error('TOTP verification error:', error);
            return { success: false, error: 'Verification failed' };
        }
    }
    
    // Verify TOTP code using current time
    verifyTOTPCode(secret, code) {
        const now = Math.floor(Date.now() / 1000);
        const period = MFA_CONFIG.totp.period;
        const window = MFA_CONFIG.totp.window;
        
        // Check current period and window periods
        for (let i = -window; i <= window; i++) {
            const time = now + (i * period);
            const expectedCode = this.generateTOTP(secret, time);
            if (code === expectedCode) {
                return true;
            }
        }
        
        return false;
    }
    
    // Generate TOTP code for a specific time
    generateTOTP(secret, time) {
        // This is a simplified TOTP implementation
        // In production, use a proper TOTP library
        const counter = Math.floor(time / MFA_CONFIG.totp.period);
        const hash = this.hmacSHA1(secret, counter.toString());
        const offset = hash[hash.length - 1] & 0xf;
        const code = ((hash[offset] & 0x7f) << 24) |
                    ((hash[offset + 1] & 0xff) << 16) |
                    ((hash[offset + 2] & 0xff) << 8) |
                    (hash[offset + 3] & 0xff);
        
        return (code % Math.pow(10, MFA_CONFIG.totp.digits)).toString().padStart(MFA_CONFIG.totp.digits, '0');
    }
    
    // Simplified HMAC-SHA1 implementation
    hmacSHA1(key, message) {
        // This is a placeholder - use a proper crypto library in production
        // For now, return a mock hash
        const hash = new Array(20);
        for (let i = 0; i < 20; i++) {
            hash[i] = Math.floor(Math.random() * 256);
        }
        return hash;
    }
    
    // Verify backup code
    async verifyBackupCode(userId, code) {
        try {
            const mfaData = await this.getMFAData(userId);
            if (!mfaData || !mfaData.backupCodes) {
                return { success: false, error: 'No backup codes found' };
            }
            
            const index = mfaData.backupCodes.indexOf(code);
            if (index === -1) {
                return { success: false, error: 'Invalid backup code' };
            }
            
            // Remove used backup code
            mfaData.backupCodes.splice(index, 1);
            await this.updateBackupCodes(userId, mfaData.backupCodes);
            
            return { success: true };
        } catch (error) {
            console.error('Backup code verification error:', error);
            return { success: false, error: 'Verification failed' };
        }
    }
    
    // Check if action requires MFA
    requiresMFA(action) {
        if (!MFA_CONFIG.security.requireMFAForSensitiveActions) {
            return false;
        }
        
        return MFA_CONFIG.sensitiveActions.includes(action);
    }
    
    // Validate MFA for action
    async validateMFAForAction(userId, action, code) {
        if (!this.requiresMFA(action)) {
            return { success: true };
        }
        
        return await this.verifyTOTP(userId, code);
    }
    
    // Get MFA data from Firestore
    async getMFAData(userId) {
        const doc = await firebase.firestore().collection('mfa_data').doc(userId).get();
        return doc.exists ? doc.data() : null;
    }
    
    // Update last used timestamp
    async updateLastUsed(userId) {
        await firebase.firestore().collection('mfa_data').doc(userId).update({
            lastUsed: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
    
    // Update backup codes
    async updateBackupCodes(userId, backupCodes) {
        await firebase.firestore().collection('mfa_data').doc(userId).update({
            backupCodes: backupCodes
        });
    }
    
    // Record failed attempt
    recordFailedAttempt(userId) {
        const attempts = this.attempts.get(userId) || [];
        attempts.push(Date.now());
        this.attempts.set(userId, attempts);
    }
    
    // Reset attempts
    resetAttempts(userId) {
        this.attempts.delete(userId);
    }
    
    // Check if user is locked out
    isLockedOut(userId) {
        const attempts = this.attempts.get(userId) || [];
        const now = Date.now();
        const recentAttempts = attempts.filter(time => now - time < MFA_CONFIG.security.lockoutDuration);
        
        return recentAttempts.length >= MFA_CONFIG.security.maxAttempts;
    }
    
    // Get remaining attempts
    getRemainingAttempts(userId) {
        const attempts = this.attempts.get(userId) || [];
        const now = Date.now();
        const recentAttempts = attempts.filter(time => now - time < MFA_CONFIG.security.lockoutDuration);
        
        return Math.max(0, MFA_CONFIG.security.maxAttempts - recentAttempts.length);
    }
    
    // Disable MFA for user
    async disableMFA(userId) {
        try {
            await firebase.firestore().collection('mfa_data').doc(userId).update({
                enabled: false,
                disabledAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error('MFA disable error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Generate new backup codes
    async generateNewBackupCodes(userId) {
        try {
            const newCodes = this.generateBackupCodes();
            await this.updateBackupCodes(userId, newCodes);
            
            return { success: true, backupCodes: newCodes };
        } catch (error) {
            console.error('Backup codes generation error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Initialize MFA manager
const mfaManager = new MFAManager();

// Export MFA functions
window.MFA = {
    MFAManager,
    MFA_CONFIG,
    mfaManager,
    
    // Convenience functions
    initializeMFA: (userId) => mfaManager.initializeMFA(userId),
    verifyTOTP: (userId, code) => mfaManager.verifyTOTP(userId, code),
    verifyBackupCode: (userId, code) => mfaManager.verifyBackupCode(userId, code),
    requiresMFA: (action) => mfaManager.requiresMFA(action),
    validateMFAForAction: (userId, action, code) => mfaManager.validateMFAForAction(userId, action, code),
    disableMFA: (userId) => mfaManager.disableMFA(userId),
    generateNewBackupCodes: (userId) => mfaManager.generateNewBackupCodes(userId),
    getRemainingAttempts: (userId) => mfaManager.getRemainingAttempts(userId),
    isLockedOut: (userId) => mfaManager.isLockedOut(userId)
};

console.log('Multi-factor authentication module loaded');
