/**
 * error-handler.js
 * Enhanced error handling with sanitization and proper logging
 */

// Error handling configuration
const ERROR_CONFIG = {
    // Error levels
    levels: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        CRITICAL: 4
    },
    
    // Sensitive patterns to remove from error messages
    sensitivePatterns: [
        /api[_-]?key[=:]\s*['"][^'"]{0,100}['"]/gi,
        /password[=:]\s*['"][^'"]{0,100}['"]/gi,
        /secret[=:]\s*['"][^'"]{0,100}['"]/gi,
        /token[=:]\s*['"][^'"]{0,100}['"]/gi,
        /auth[=:]\s*['"][^'"]{0,100}['"]/gi,
        /firebase[_-]?config[=:]\s*\{[^}]{0,500}\}/gi,
        /database[_-]?url[=:]\s*['"][^'"]{0,100}['"]/gi,
        /connection[_-]?string[=:]\s*['"][^'"]{0,100}['"]/gi,
        /private[_-]?key[=:]\s*['"][^'"]{0,100}['"]/gi,
        /access[_-]?key[=:]\s*['"][^'"]{0,100}['"]/gi
    ],
    
    // Error types that should be logged but not shown to users
    internalErrors: [
        'FirebaseError',
        'NetworkError',
        'DatabaseError',
        'AuthenticationError',
        'ValidationError'
    ],
    
    // User-friendly error messages
    userMessages: {
        'auth/user-not-found': 'User account not found. Please check your credentials.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/email-already-in-use': 'This email is already registered. Please use a different email or try logging in.',
        'auth/weak-password': 'Password is too weak. Please use a stronger password.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network connection failed. Please check your internet connection.',
        'firestore/unavailable': 'Database temporarily unavailable. Please try again.',
        'firestore/deadline-exceeded': 'Request timed out. Please try again.',
        'firestore/permission-denied': 'Access denied. Please contact support if this persists.',
        'storage/unauthorized': 'Upload failed. Please try again or contact support.',
        'storage/quota-exceeded': 'Storage limit reached. Please contact support.',
        'storage/retry-limit-exceeded': 'Upload failed after multiple attempts. Please try again later.',
        'default': 'An unexpected error occurred. Please try again or contact support.'
    }
};

// Enhanced error handler class
class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 1000;
        this.isProduction = window.location.hostname !== 'localhost' && 
                           window.location.hostname !== '127.0.0.1';
        
        this.setupGlobalErrorHandlers();
        this.setupUnhandledRejectionHandler();
    }
    
    /**
     * Setup global error handlers
     */
    setupGlobalErrorHandlers() {
        // Override console.error to capture errors
        const originalConsoleError = console.error;
        console.error = (...args) => {
            this.logError('ERROR', args.join(' '), { source: 'console.error' });
            originalConsoleError.apply(console, args);
        };
        
        // Override console.warn to capture warnings
        const originalConsoleWarn = console.warn;
        console.warn = (...args) => {
            this.logError('WARN', args.join(' '), { source: 'console.warn' });
            originalConsoleWarn.apply(console, args);
        };
        
        // Global error handler
        window.addEventListener('error', (event) => {
            this.handleError(event.error || new Error(event.message), {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                source: 'global-error'
            });
        });
    }
    
    /**
     * Setup unhandled promise rejection handler
     */
    setupUnhandledRejectionHandler() {
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, {
                source: 'unhandled-rejection',
                promise: event.promise
            });
        });
    }
    
    /**
     * Sanitize error message to remove sensitive information
     */
    sanitizeErrorMessage(message) {
        if (!message || typeof message !== 'string') {
            return 'An error occurred';
        }
        
        let sanitized = message;
        
        // Remove sensitive patterns with error handling
        try {
            ERROR_CONFIG.sensitivePatterns.forEach(pattern => {
                try {
                    sanitized = sanitized.replace(pattern, '[REDACTED]');
                } catch (patternError) {
                    console.warn('Failed to apply regex pattern:', patternError);
                }
            });
        } catch (error) {
            console.warn('Error during message sanitization:', error);
            // Fallback: simple string replacement for common patterns
            sanitized = sanitized.replace(/api[_-]?key[=:]\s*['"][^'"]{0,50}['"]/gi, '[REDACTED]');
            sanitized = sanitized.replace(/password[=:]\s*['"][^'"]{0,50}['"]/gi, '[REDACTED]');
            sanitized = sanitized.replace(/token[=:]\s*['"][^'"]{0,50}['"]/gi, '[REDACTED]');
        }
        
        // Remove stack traces in production
        if (this.isProduction) {
            try {
                sanitized = sanitized.replace(/at\s+.*\s+\(.*\)/g, '');
                sanitized = sanitized.replace(/at\s+.*/g, '');
            } catch (stackError) {
                console.warn('Failed to remove stack traces:', stackError);
            }
        }
        
        return sanitized.trim() || 'An error occurred';
    }
    
    /**
     * Get user-friendly error message
     */
    getUserFriendlyMessage(error) {
        if (!error) return ERROR_CONFIG.userMessages.default;
        
        // Check for Firebase error codes
        if (error.code && ERROR_CONFIG.userMessages[error.code]) {
            return ERROR_CONFIG.userMessages[error.code];
        }
        
        // Check for common error patterns
        const errorMessage = error.message || error.toString();
        
        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            return ERROR_CONFIG.userMessages['auth/network-request-failed'];
        }
        
        if (errorMessage.includes('timeout') || errorMessage.includes('deadline')) {
            return ERROR_CONFIG.userMessages['firestore/deadline-exceeded'];
        }
        
        if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
            return ERROR_CONFIG.userMessages['firestore/permission-denied'];
        }
        
        return ERROR_CONFIG.userMessages.default;
    }
    
    /**
     * Handle and log an error
     */
    handleError(error, context = {}) {
        const errorInfo = {
            timestamp: new Date().toISOString(),
            message: this.sanitizeErrorMessage(error.message || error.toString()),
            stack: this.isProduction ? undefined : error.stack,
            name: error.name || 'Error',
            code: error.code,
            source: context.source || 'unknown',
            filename: context.filename,
            lineno: context.lineno,
            colno: context.colno,
            userId: this.getCurrentUserId(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        // Log the error
        this.logError('ERROR', errorInfo.message, errorInfo);
        
        // Show user-friendly message if needed
        if (this.shouldShowUserMessage(error, context)) {
            this.showUserMessage(error);
        }
        
        // Send to server for logging
        this.sendErrorToServer(errorInfo);
        
        return errorInfo;
    }
    
    /**
     * Log error to local storage and console
     */
    logError(level, message, context = {}) {
        // Prevent infinite loops by checking if this is an error handler error
        if (context.source === 'error-handler' || context.source === 'console.error') {
            // Use simple console logging for error handler errors
            console.warn(`[${level}] Error handler error:`, message);
            return;
        }
        
        try {
            const logEntry = {
                timestamp: new Date().toISOString(),
                level,
                message: this.sanitizeErrorMessage(message),
                context: this.sanitizeContext(context)
            };
            
            this.errorLog.push(logEntry);
            
            // Keep log size manageable
            if (this.errorLog.length > this.maxLogSize) {
                this.errorLog = this.errorLog.slice(-this.maxLogSize / 2);
            }
            
            // Save to localStorage
            try {
                localStorage.setItem('errorLog', JSON.stringify(this.errorLog));
            } catch (e) {
                // If localStorage fails, keep only in memory
                console.warn('Failed to save error log to localStorage:', e);
            }
            
            // Log to console in development
            if (!this.isProduction) {
                console.group(`[${level}] ${logEntry.message}`);
                console.log('Context:', logEntry.context);
                console.log('Timestamp:', logEntry.timestamp);
                console.groupEnd();
            }
        } catch (error) {
            // If error logging fails, use simple console logging
            console.warn(`[${level}] Error logging failed:`, error);
            console.warn(`Original message:`, message);
        }
    }
    
    /**
     * Sanitize context object to remove sensitive data
     */
    sanitizeContext(context) {
        if (!context || typeof context !== 'object') {
            return context;
        }
        
        const sanitized = { ...context };
        const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'auth', 'firebaseConfig'];
        
        sensitiveKeys.forEach(key => {
            if (sanitized[key]) {
                sanitized[key] = '[REDACTED]';
            }
        });
        
        return sanitized;
    }
    
    /**
     * Determine if error should be shown to user
     */
    shouldShowUserMessage(error, context) {
        // Don't show internal errors to users
        if (ERROR_CONFIG.internalErrors.includes(error.name)) {
            return false;
        }
        
        // Don't show errors from console methods
        if (context.source === 'console.error' || context.source === 'console.warn') {
            return false;
        }
        
        // Show user-facing errors
        return true;
    }
    
    /**
     * Show user-friendly error message
     */
    showUserMessage(error) {
        const message = this.getUserFriendlyMessage(error);
        
        // Try to use existing toast notification system
        if (window.showToast) {
            window.showToast(message, 'error');
        } else if (window.showNotification) {
            window.showNotification(message, 'error');
        } else {
            // Fallback to alert
            alert(message);
        }
    }
    
    /**
     * Send error to server for logging
     */
    async sendErrorToServer(errorInfo) {
        try {
            if (window.db && window.auth && window.auth.currentUser) {
                await window.db.collection('error_logs').add({
                    ...errorInfo,
                    createdAt: new Date(),
                    userId: window.auth.currentUser.uid
                });
            }
        } catch (e) {
            // Don't log logging errors to avoid infinite loops
            console.warn('Failed to send error to server:', e);
        }
    }
    
    /**
     * Get current user ID
     */
    getCurrentUserId() {
        try {
            return window.auth && window.auth.currentUser ? window.auth.currentUser.uid : null;
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Create error boundary for React components
     */
    createErrorBoundary(Component) {
        return class ErrorBoundary extends Component {
            constructor(props) {
                super(props);
                this.state = { hasError: false, error: null };
            }
            
            static getDerivedStateFromError(error) {
                return { hasError: true, error };
            }
            
            componentDidCatch(error, errorInfo) {
                window.errorHandler.handleError(error, {
                    source: 'react-error-boundary',
                    componentStack: errorInfo.componentStack
                });
            }
            
            render() {
                if (this.state.hasError) {
                    // Create error boundary element
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error-boundary';
                    errorDiv.innerHTML = `
                        <h2>Something went wrong</h2>
                        <p>Please refresh the page or contact support if the problem persists.</p>
                        <button onclick="window.location.reload()">Refresh Page</button>
                    `;
                    return errorDiv;
                }
                
                return this.props.children;
            }
        };
    }
    
    /**
     * Wrap async functions with error handling
     */
    wrapAsync(fn, context = {}) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                this.handleError(error, {
                    source: 'async-function',
                    functionName: fn.name || 'anonymous',
                    ...context
                });
                throw error;
            }
        };
    }
    
    /**
     * Get error statistics
     */
    getErrorStats() {
        const stats = {
            total: this.errorLog.length,
            byLevel: {},
            bySource: {},
            recent: this.errorLog.slice(-10)
        };
        
        this.errorLog.forEach(entry => {
            stats.byLevel[entry.level] = (stats.byLevel[entry.level] || 0) + 1;
            stats.bySource[entry.context.source] = (stats.bySource[entry.context.source] || 0) + 1;
        });
        
        return stats;
    }
    
    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
        try {
            localStorage.removeItem('errorLog');
        } catch (e) {
            console.warn('Failed to clear error log from localStorage:', e);
        }
    }
    
    /**
     * Export error log
     */
    exportErrorLog() {
        const dataStr = JSON.stringify(this.errorLog, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `error-log-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }
}

// Initialize error handler with DOM readiness check
let errorHandler = null;

function initializeErrorHandler() {
    if (!errorHandler) {
        errorHandler = new ErrorHandler();
        
        // Make available globally
        window.errorHandler = errorHandler;
        window.ErrorHandler = ErrorHandler;
        window.ERROR_CONFIG = ERROR_CONFIG;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeErrorHandler);
} else {
    // DOM is already loaded
    initializeErrorHandler();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ErrorHandler, errorHandler, ERROR_CONFIG };
}
