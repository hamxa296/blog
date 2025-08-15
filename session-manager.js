/**
 * session-manager.js
 * Comprehensive session management with security features
 */

// Session management configuration
const SESSION_CONFIG = {
    // Session timeout settings (in milliseconds)
    timeouts: {
        idle: 30 * 60 * 1000, // 30 minutes of inactivity
        absolute: 24 * 60 * 60 * 1000, // 24 hours maximum
        warning: 5 * 60 * 1000 // 5 minutes before timeout
    },
    
    // Session storage keys
    storageKeys: {
        sessionData: 'giki_session_data',
        lastActivity: 'giki_last_activity',
        sessionStart: 'giki_session_start',
        sessionId: 'giki_session_id',
        userAgent: 'giki_user_agent',
        ipAddress: 'giki_ip_address'
    },
    
    // Security settings
    security: {
        regenerateSessionInterval: 15 * 60 * 1000, // 15 minutes
        maxConcurrentSessions: 3,
        requireReauthForSensitive: true,
        sensitiveActions: ['admin_access', 'delete_post', 'approve_content', 'user_management']
    },
    
    // Activity tracking
    activity: {
        trackPageViews: true,
        trackUserActions: true,
        trackApiCalls: true,
        maxActivityLogSize: 100
    }
};

// Session management class
class SessionManager {
    constructor() {
        this.sessionData = null;
        this.sessionId = null;
        this.lastActivity = null;
        this.sessionStart = null;
        this.activityLog = [];
        this.timeoutWarnings = [];
        this.isInitialized = false;
        
        this.initializeSession();
        this.setupActivityTracking();
        this.setupTimeoutHandlers();
    }
    
    /**
     * Initialize session management
     */
    initializeSession() {
        try {
            // Check if user is authenticated
            if (window.auth && window.auth.currentUser) {
                this.createOrRestoreSession();
            } else {
                this.clearSession();
            }
            
            this.isInitialized = true;
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.handleError(error, {
                    source: 'session-initialization',
                    functionName: 'initializeSession'
                });
            }
        }
    }
    
    /**
     * Create new session or restore existing session
     */
    createOrRestoreSession() {
        const user = window.auth.currentUser;
        if (!user) return;
        
        // Check for existing session
        const existingSession = this.getStoredSession();
        
        if (existingSession && this.validateStoredSession(existingSession)) {
            // Restore existing session
            this.sessionData = existingSession;
            this.sessionId = existingSession.sessionId;
            this.lastActivity = existingSession.lastActivity;
            this.sessionStart = existingSession.sessionStart;
            
            // Update activity
            this.updateActivity();
            
            if (window.errorHandler) {
                window.errorHandler.logError('INFO', 'Session restored', {
                    source: 'session-restore',
                    userId: user.uid,
                    sessionId: this.sessionId
                });
            }
        } else {
            // Create new session
            this.createNewSession(user);
        }
    }
    
    /**
     * Create a new session
     */
    createNewSession(user) {
        this.sessionId = this.generateSessionId();
        this.sessionStart = Date.now();
        this.lastActivity = Date.now();
        
        this.sessionData = {
            sessionId: this.sessionId,
            userId: user.uid,
            email: user.email,
            sessionStart: this.sessionStart,
            lastActivity: this.lastActivity,
            userAgent: navigator.userAgent,
            ipAddress: this.getClientIP(),
            isActive: true,
            securityLevel: this.calculateSecurityLevel(user),
            permissions: this.getUserPermissions(user)
        };
        
        this.saveSession();
        
        // Log session creation
        if (window.errorHandler) {
            window.errorHandler.logError('INFO', 'New session created', {
                source: 'session-creation',
                userId: user.uid,
                sessionId: this.sessionId
            });
        }
        
        // Send session data to server
        this.sendSessionToServer('created');
    }
    
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        const userAgent = navigator.userAgent.substring(0, 8);
        return `${timestamp}-${random}-${userAgent}`;
    }
    
    /**
     * Get client IP address (approximate)
     */
    getClientIP() {
        // This is a client-side approximation
        // Real IP should be obtained server-side
        return 'client-side-approximation';
    }
    
    /**
     * Calculate security level based on user
     */
    calculateSecurityLevel(user) {
        let level = 'standard';
        
        // Check if user is admin
        if (window.isAdminUID && window.isAdminUID(user.uid)) {
            level = 'admin';
        }
        
        // Check for verified email
        if (user.emailVerified) {
            level = level === 'admin' ? 'admin-verified' : 'verified';
        }
        
        return level;
    }
    
    /**
     * Get user permissions
     */
    getUserPermissions(user) {
        const permissions = {
            read: true,
            write: true,
            comment: true,
            upload: true
        };
        
        // Admin permissions
        if (window.isAdminUID && window.isAdminUID(user.uid)) {
            permissions.admin = true;
            permissions.moderate = true;
            permissions.delete = true;
            permissions.approve = true;
        }
        
        return permissions;
    }
    
    /**
     * Save session to secure storage
     */
    saveSession() {
        try {
            const sessionToStore = {
                ...this.sessionData,
                lastActivity: this.lastActivity
            };
            
            // Encrypt sensitive data before storing
            const encryptedSession = this.encryptSessionData(sessionToStore);
            
            localStorage.setItem(SESSION_CONFIG.storageKeys.sessionData, encryptedSession);
            localStorage.setItem(SESSION_CONFIG.storageKeys.lastActivity, this.lastActivity.toString());
            localStorage.setItem(SESSION_CONFIG.storageKeys.sessionStart, this.sessionStart.toString());
            localStorage.setItem(SESSION_CONFIG.storageKeys.sessionId, this.sessionId);
            localStorage.setItem(SESSION_CONFIG.storageKeys.userAgent, navigator.userAgent);
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.handleError(error, {
                    source: 'session-save',
                    functionName: 'saveSession'
                });
            }
        }
    }
    
    /**
     * Encrypt session data for storage
     */
    encryptSessionData(data) {
        try {
            // Simple obfuscation for client-side storage
            // In production, use proper encryption
            const jsonString = JSON.stringify(data);
            return btoa(jsonString);
        } catch (error) {
            return JSON.stringify(data);
        }
    }
    
    /**
     * Decrypt session data from storage
     */
    decryptSessionData(encryptedData) {
        try {
            const jsonString = atob(encryptedData);
            return JSON.parse(jsonString);
        } catch (error) {
            return JSON.parse(encryptedData);
        }
    }
    
    /**
     * Get stored session data
     */
    getStoredSession() {
        try {
            const encryptedSession = localStorage.getItem(SESSION_CONFIG.storageKeys.sessionData);
            if (!encryptedSession) return null;
            
            return this.decryptSessionData(encryptedSession);
        } catch (error) {
            return null;
        }
    }
    
    /**
     * Validate stored session
     */
    validateStoredSession(session) {
        if (!session || !session.sessionId || !session.userId) {
            return false;
        }
        
        // Check if session has expired
        const now = Date.now();
        const sessionAge = now - session.sessionStart;
        const idleTime = now - session.lastActivity;
        
        if (sessionAge > SESSION_CONFIG.timeouts.absolute) {
            return false;
        }
        
        if (idleTime > SESSION_CONFIG.timeouts.idle) {
            return false;
        }
        
        // Check user agent consistency
        if (session.userAgent !== navigator.userAgent) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Update session activity
     */
    updateActivity() {
        this.lastActivity = Date.now();
        
        if (this.sessionData) {
            this.sessionData.lastActivity = this.lastActivity;
            this.saveSession();
        }
        
        // Log activity
        this.logActivity('session_activity');
    }
    
    /**
     * Setup activity tracking
     */
    setupActivityTracking() {
        // Track page views
        if (SESSION_CONFIG.activity.trackPageViews) {
            this.trackPageView();
        }
        
        // Track user interactions
        if (SESSION_CONFIG.activity.trackUserActions) {
            this.setupUserActionTracking();
        }
        
        // Track API calls
        if (SESSION_CONFIG.activity.trackApiCalls) {
            this.setupApiCallTracking();
        }
    }
    
    /**
     * Track page view
     */
    trackPageView() {
        this.logActivity('page_view', {
            page: window.location.pathname,
            referrer: document.referrer,
            timestamp: Date.now()
        });
    }
    
    /**
     * Setup user action tracking
     */
    setupUserActionTracking() {
        // Track form submissions
        document.addEventListener('submit', (e) => {
            this.logActivity('form_submit', {
                form: e.target.id || e.target.className,
                action: e.target.action
            });
        });
        
        // Track button clicks
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                const button = e.target.tagName === 'BUTTON' ? e.target : e.target.closest('button');
                this.logActivity('button_click', {
                    button: button.id || button.className,
                    text: button.textContent?.trim()
                });
            }
        });
        
        // Track navigation
        window.addEventListener('beforeunload', () => {
            this.logActivity('page_exit', {
                page: window.location.pathname
            });
        });
    }
    
    /**
     * Setup API call tracking
     */
    setupApiCallTracking() {
        // Override fetch to track API calls
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = Date.now();
            
            try {
                const response = await originalFetch(...args);
                
                this.logActivity('api_call', {
                    url: args[0],
                    method: args[1]?.method || 'GET',
                    status: response.status,
                    duration: Date.now() - startTime
                });
                
                return response;
            } catch (error) {
                this.logActivity('api_error', {
                    url: args[0],
                    method: args[1]?.method || 'GET',
                    error: error.message,
                    duration: Date.now() - startTime
                });
                
                throw error;
            }
        };
    }
    
    /**
     * Log activity
     */
    logActivity(type, data = {}) {
        const activity = {
            type,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.sessionData?.userId,
            data
        };
        
        this.activityLog.push(activity);
        
        // Keep log size manageable
        if (this.activityLog.length > SESSION_CONFIG.activity.maxActivityLogSize) {
            this.activityLog = this.activityLog.slice(-SESSION_CONFIG.activity.maxActivityLogSize / 2);
        }
        
        // Send to server periodically
        this.sendActivityToServer(activity);
    }
    
    /**
     * Setup timeout handlers
     */
    setupTimeoutHandlers() {
        // Check session status periodically
        setInterval(() => {
            this.checkSessionStatus();
        }, 60000); // Check every minute
        
        // Show timeout warnings
        setInterval(() => {
            this.checkTimeoutWarnings();
        }, 30000); // Check every 30 seconds
    }
    
    /**
     * Check session status
     */
    checkSessionStatus() {
        if (!this.sessionData || !this.isInitialized) return;
        
        const now = Date.now();
        const idleTime = now - this.lastActivity;
        const sessionAge = now - this.sessionStart;
        
        // Check for absolute timeout
        if (sessionAge > SESSION_CONFIG.timeouts.absolute) {
            this.handleSessionTimeout('absolute');
            return;
        }
        
        // Check for idle timeout
        if (idleTime > SESSION_CONFIG.timeouts.idle) {
            this.handleSessionTimeout('idle');
            return;
        }
        
        // Regenerate session periodically
        if (sessionAge > SESSION_CONFIG.timeouts.regenerateSessionInterval) {
            this.regenerateSession();
        }
    }
    
    /**
     * Check for timeout warnings
     */
    checkTimeoutWarnings() {
        if (!this.sessionData) return;
        
        const now = Date.now();
        const idleTime = now - this.lastActivity;
        const timeUntilTimeout = SESSION_CONFIG.timeouts.idle - idleTime;
        
        // Show warning 5 minutes before timeout
        if (timeUntilTimeout <= SESSION_CONFIG.timeouts.warning && timeUntilTimeout > 0) {
            if (!this.timeoutWarnings.includes('idle_warning')) {
                this.showTimeoutWarning('idle', timeUntilTimeout);
                this.timeoutWarnings.push('idle_warning');
            }
        }
    }
    
    /**
     * Handle session timeout
     */
    handleSessionTimeout(type) {
        if (window.errorHandler) {
            window.errorHandler.logError('WARN', `Session timeout: ${type}`, {
                source: 'session-timeout',
                sessionId: this.sessionId,
                userId: this.sessionData?.userId,
                timeoutType: type
            });
        }
        
        // Clear session
        this.clearSession();
        
        // Show timeout message
        this.showTimeoutMessage(type);
        
        // Redirect to login
        setTimeout(() => {
            window.location.href = 'login.html?timeout=' + type;
        }, 3000);
    }
    
    /**
     * Show timeout warning
     */
    showTimeoutWarning(type, timeRemaining) {
        const minutes = Math.ceil(timeRemaining / 60000);
        
        // Create warning notification
        const warning = document.createElement('div');
        warning.id = 'session-timeout-warning';
        warning.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        warning.innerHTML = `
            <div class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
                <span>Session expires in ${minutes} minute${minutes > 1 ? 's' : ''}. Click to extend.</span>
                <button onclick="window.sessionManager.extendSession()" class="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm">
                    Extend
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
     * Show timeout message
     */
    showTimeoutMessage(type) {
        const message = type === 'absolute' 
            ? 'Your session has expired due to time limit. Please log in again.'
            : 'Your session has expired due to inactivity. Please log in again.';
        
        // Create timeout message
        const timeoutMsg = document.createElement('div');
        timeoutMsg.id = 'session-timeout-message';
        timeoutMsg.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        timeoutMsg.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
                <div class="text-red-500 text-6xl mb-4">⏰</div>
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Session Expired</h2>
                <p class="text-gray-600 mb-6">${message}</p>
                <button onclick="window.location.href='login.html'" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                    Log In Again
                </button>
            </div>
        `;
        
        document.body.appendChild(timeoutMsg);
    }
    
    /**
     * Extend session
     */
    extendSession() {
        this.updateActivity();
        this.timeoutWarnings = [];
        
        // Remove warning notification
        const warning = document.getElementById('session-timeout-warning');
        if (warning) {
            warning.parentNode.removeChild(warning);
        }
        
        // Show success message
        if (window.showToast) {
            window.showToast('Session extended successfully!', 'success');
        }
    }
    
    /**
     * Regenerate session
     */
    regenerateSession() {
        if (!this.sessionData) return;
        
        const oldSessionId = this.sessionId;
        this.sessionId = this.generateSessionId();
        
        this.sessionData.sessionId = this.sessionId;
        this.sessionData.sessionStart = Date.now();
        
        this.saveSession();
        
        // Send to server
        this.sendSessionToServer('regenerated', oldSessionId);
        
        if (window.errorHandler) {
            window.errorHandler.logError('INFO', 'Session regenerated', {
                source: 'session-regeneration',
                oldSessionId,
                newSessionId: this.sessionId,
                userId: this.sessionData.userId
            });
        }
    }
    
    /**
     * Validate session for sensitive actions
     */
    validateSessionForAction(action) {
        if (!this.sessionData) {
            return { valid: false, reason: 'no_session' };
        }
        
        // Check if session is active
        if (!this.sessionData.isActive) {
            return { valid: false, reason: 'inactive_session' };
        }
        
        // Check for sensitive actions
        if (SESSION_CONFIG.security.sensitiveActions.includes(action)) {
            const now = Date.now();
            const lastActivity = this.lastActivity;
            
            // Require recent activity for sensitive actions
            if (now - lastActivity > 5 * 60 * 1000) { // 5 minutes
                return { valid: false, reason: 'stale_session' };
            }
        }
        
        return { valid: true };
    }
    
    /**
     * Require re-authentication for sensitive actions
     */
    requireReauthForAction(action) {
        if (!SESSION_CONFIG.security.requireReauthForSensitive) {
            return false;
        }
        
        return SESSION_CONFIG.security.sensitiveActions.includes(action);
    }
    
    /**
     * Clear session
     */
    clearSession() {
        this.sessionData = null;
        this.sessionId = null;
        this.lastActivity = null;
        this.sessionStart = null;
        this.activityLog = [];
        this.timeoutWarnings = [];
        
        // Clear stored session data
        Object.values(SESSION_CONFIG.storageKeys).forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Send logout to server
        this.sendSessionToServer('destroyed');
    }
    
    /**
     * Send session data to server
     */
    async sendSessionToServer(action, oldSessionId = null) {
        try {
            if (window.db && this.sessionData) {
                const sessionLog = {
                    action,
                    sessionId: this.sessionId,
                    userId: this.sessionData.userId,
                    timestamp: new Date(),
                    userAgent: navigator.userAgent,
                    ipAddress: this.getClientIP(),
                    oldSessionId
                };
                
                await window.db.collection('session_logs').add(sessionLog);
            }
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.handleError(error, {
                    source: 'session-server-log',
                    functionName: 'sendSessionToServer'
                });
            }
        }
    }
    
    /**
     * Send activity to server
     */
    async sendActivityToServer(activity) {
        try {
            if (window.db && this.sessionData) {
                await window.db.collection('user_activity').add({
                    ...activity,
                    timestamp: new Date()
                });
            }
        } catch (error) {
            // Don't log activity logging errors to avoid loops
        }
    }
    
    /**
     * Get session information
     */
    getSessionInfo() {
        if (!this.sessionData) return null;
        
        return {
            sessionId: this.sessionId,
            userId: this.sessionData.userId,
            email: this.sessionData.email,
            sessionStart: this.sessionStart,
            lastActivity: this.lastActivity,
            sessionAge: Date.now() - this.sessionStart,
            idleTime: Date.now() - this.lastActivity,
            securityLevel: this.sessionData.securityLevel,
            permissions: this.sessionData.permissions,
            isActive: this.sessionData.isActive
        };
    }
    
    /**
     * Get activity log
     */
    getActivityLog(limit = 50) {
        return this.activityLog.slice(-limit);
    }
    
    /**
     * Force logout
     */
    forceLogout() {
        this.clearSession();
        
        if (window.auth) {
            window.auth.signOut();
        }
        
        window.location.href = 'login.html?logout=forced';
    }
}

// Initialize session manager
const sessionManager = new SessionManager();

// Make available globally
window.sessionManager = sessionManager;
window.SessionManager = SessionManager;
window.SESSION_CONFIG = SESSION_CONFIG;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SessionManager, sessionManager, SESSION_CONFIG };
}
