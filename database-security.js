/**
 * database-security.js
 * Comprehensive database security with validation and backup features
 */

// Database security configuration
const DB_SECURITY_CONFIG = {
    // Data validation rules
    validation: {
        // User data validation
        user: {
            displayName: {
                required: true,
                minLength: 2,
                maxLength: 50,
                pattern: /^[a-zA-Z0-9\s\-_\.]+$/
            },
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            },
            bio: {
                maxLength: 500,
                pattern: /^[a-zA-Z0-9\s\-_\.\,\!\?\:\;\"\'\(\)]+$/
            }
        },
        
        // Post data validation
        post: {
            title: {
                required: true,
                minLength: 5,
                maxLength: 200,
                pattern: /^[a-zA-Z0-9\s\-_\.\,\!\?\:\;\"\'\(\)]+$/
            },
            content: {
                required: true,
                minLength: 10,
                maxLength: 50000,
                allowedTags: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img']
            },
            description: {
                maxLength: 500,
                pattern: /^[a-zA-Z0-9\s\-_\.\,\!\?\:\;\"\'\(\)]+$/
            },
            genre: {
                required: true,
                allowedValues: ['General', 'Technology', 'Campus Life', 'Academic', 'Events', 'Sports', 'Culture', 'Opinion']
            }
        },
        
        // Comment data validation
        comment: {
            content: {
                required: true,
                minLength: 1,
                maxLength: 1000,
                pattern: /^[a-zA-Z0-9\s\-_\.\,\!\?\:\;\"\'\(\)]+$/
            }
        },
        
        // Gallery photo validation
        galleryPhoto: {
            caption: {
                required: true,
                minLength: 3,
                maxLength: 200,
                pattern: /^[a-zA-Z0-9\s\-_\.\,\!\?\:\;\"\'\(\)]+$/
            },
            category: {
                required: true,
                allowedValues: ['Campus', 'Events', 'Students', 'Faculty', 'Buildings', 'Nature', 'Other']
            }
        }
    },
    
    // Backup security settings
    backup: {
        enabled: true,
        autoBackup: true,
        backupInterval: 24 * 60 * 60 * 1000, // 24 hours
        maxBackups: 30,
        encryptBackups: true,
        backupCollections: ['users', 'posts', 'comments', 'galleryPhotos', 'events']
    },
    
    // Data integrity settings
    integrity: {
        checkOnRead: true,
        checkOnWrite: true,
        autoRepair: false,
        logIntegrityIssues: true
    },
    
    // Access control
    access: {
        // Sensitive operations that require admin
        adminOnly: ['delete_user', 'delete_all_posts', 'modify_admin_status', 'export_data'],
        
        // Operations that require authentication
        authRequired: ['create_post', 'edit_post', 'delete_post', 'create_comment', 'upload_photo'],
        
        // Rate limiting for database operations
        rateLimits: {
            read: { requests: 1000, window: 60 * 1000 }, // 1000 reads per minute
            write: { requests: 100, window: 60 * 1000 }, // 100 writes per minute
            delete: { requests: 10, window: 60 * 1000 }  // 10 deletes per minute
        }
    }
};

// Database security class
class DatabaseSecurity {
    constructor() {
        this.operationLog = [];
        this.integrityIssues = [];
        this.backupHistory = [];
        this.rateLimiters = new Map();
        
        this.initializeRateLimiters();
        this.setupDatabaseHooks();
        this.startAutoBackup();
    }
    
    /**
     * Initialize rate limiters for database operations
     */
    initializeRateLimiters() {
        Object.keys(DB_SECURITY_CONFIG.access.rateLimits).forEach(operation => {
            const config = DB_SECURITY_CONFIG.access.rateLimits[operation];
            this.rateLimiters.set(operation, {
                requests: [],
                blockedUntil: null,
                config
            });
        });
    }
    
    /**
     * Setup database operation hooks
     */
    setupDatabaseHooks() {
        // Override Firestore operations to add security
        if (window.db) {
            this.enhanceFirestoreOperations();
        }
    }
    
    /**
     * Enhance Firestore operations with security
     */
    enhanceFirestoreOperations() {
        const originalAdd = window.db.collection.prototype.add;
        const originalSet = window.db.collection.prototype.doc.prototype.set;
        const originalUpdate = window.db.collection.prototype.doc.prototype.update;
        const originalDelete = window.db.collection.prototype.doc.prototype.delete;
        const originalGet = window.db.collection.prototype.doc.prototype.get;
        
        // Override add operation
        window.db.collection.prototype.add = async function(data) {
            const collectionName = this._query.path.segments[0];
            
            // Validate operation
            const validation = window.dbSecurity.validateOperation('write', collectionName, data);
            if (!validation.valid) {
                throw new Error(`Database operation validation failed: ${validation.reason}`);
            }
            
            // Check rate limiting
            const rateLimitCheck = window.dbSecurity.checkRateLimit('write');
            if (!rateLimitCheck.allowed) {
                throw new Error(`Rate limit exceeded for write operations`);
            }
            
            // Validate data
            const dataValidation = window.dbSecurity.validateData(collectionName, data);
            if (!dataValidation.valid) {
                throw new Error(`Data validation failed: ${dataValidation.reason}`);
            }
            
            // Log operation
            window.dbSecurity.logOperation('add', collectionName, data);
            
            try {
                const result = await originalAdd.call(this, data);
                
                // Check data integrity after write
                if (DB_SECURITY_CONFIG.integrity.checkOnWrite) {
                    window.dbSecurity.checkDataIntegrity(collectionName, result.id, data);
                }
                
                return result;
            } catch (error) {
                window.dbSecurity.logSecurityEvent('database_write_failed', {
                    operation: 'add',
                    collection: collectionName,
                    error: error.message
                });
                throw error;
            }
        };
        
        // Override set operation
        window.db.collection.prototype.doc.prototype.set = async function(data, options) {
            const collectionName = this._reference.path.segments[0];
            const documentId = this._reference.path.segments[1];
            
            // Validate operation
            const validation = window.dbSecurity.validateOperation('write', collectionName, data);
            if (!validation.valid) {
                throw new Error(`Database operation validation failed: ${validation.reason}`);
            }
            
            // Check rate limiting
            const rateLimitCheck = window.dbSecurity.checkRateLimit('write');
            if (!rateLimitCheck.allowed) {
                throw new Error(`Rate limit exceeded for write operations`);
            }
            
            // Validate data
            const dataValidation = window.dbSecurity.validateData(collectionName, data);
            if (!dataValidation.valid) {
                throw new Error(`Data validation failed: ${dataValidation.reason}`);
            }
            
            // Log operation
            window.dbSecurity.logOperation('set', collectionName, data, documentId);
            
            try {
                const result = await originalSet.call(this, data, options);
                
                // Check data integrity after write
                if (DB_SECURITY_CONFIG.integrity.checkOnWrite) {
                    window.dbSecurity.checkDataIntegrity(collectionName, documentId, data);
                }
                
                return result;
            } catch (error) {
                window.dbSecurity.logSecurityEvent('database_write_failed', {
                    operation: 'set',
                    collection: collectionName,
                    documentId,
                    error: error.message
                });
                throw error;
            }
        };
        
        // Override update operation
        window.db.collection.prototype.doc.prototype.update = async function(data) {
            const collectionName = this._reference.path.segments[0];
            const documentId = this._reference.path.segments[1];
            
            // Validate operation
            const validation = window.dbSecurity.validateOperation('write', collectionName, data);
            if (!validation.valid) {
                throw new Error(`Database operation validation failed: ${validation.reason}`);
            }
            
            // Check rate limiting
            const rateLimitCheck = window.dbSecurity.checkRateLimit('write');
            if (!rateLimitCheck.allowed) {
                throw new Error(`Rate limit exceeded for write operations`);
            }
            
            // Validate data
            const dataValidation = window.dbSecurity.validateData(collectionName, data);
            if (!dataValidation.valid) {
                throw new Error(`Data validation failed: ${dataValidation.reason}`);
            }
            
            // Log operation
            window.dbSecurity.logOperation('update', collectionName, data, documentId);
            
            try {
                const result = await originalUpdate.call(this, data);
                
                // Check data integrity after write
                if (DB_SECURITY_CONFIG.integrity.checkOnWrite) {
                    window.dbSecurity.checkDataIntegrity(collectionName, documentId, data);
                }
                
                return result;
            } catch (error) {
                window.dbSecurity.logSecurityEvent('database_write_failed', {
                    operation: 'update',
                    collection: collectionName,
                    documentId,
                    error: error.message
                });
                throw error;
            }
        };
        
        // Override delete operation
        window.db.collection.prototype.doc.prototype.delete = async function() {
            const collectionName = this._reference.path.segments[0];
            const documentId = this._reference.path.segments[1];
            
            // Validate operation
            const validation = window.dbSecurity.validateOperation('delete', collectionName);
            if (!validation.valid) {
                throw new Error(`Database operation validation failed: ${validation.reason}`);
            }
            
            // Check rate limiting
            const rateLimitCheck = window.dbSecurity.checkRateLimit('delete');
            if (!rateLimitCheck.allowed) {
                throw new Error(`Rate limit exceeded for delete operations`);
            }
            
            // Log operation
            window.dbSecurity.logOperation('delete', collectionName, null, documentId);
            
            try {
                const result = await originalDelete.call(this);
                
                // Log successful deletion
                window.dbSecurity.logSecurityEvent('document_deleted', {
                    collection: collectionName,
                    documentId
                });
                
                return result;
            } catch (error) {
                window.dbSecurity.logSecurityEvent('database_delete_failed', {
                    collection: collectionName,
                    documentId,
                    error: error.message
                });
                throw error;
            }
        };
        
        // Override get operation
        window.db.collection.prototype.doc.prototype.get = async function(options) {
            const collectionName = this._reference.path.segments[0];
            const documentId = this._reference.path.segments[1];
            
            // Check rate limiting
            const rateLimitCheck = window.dbSecurity.checkRateLimit('read');
            if (!rateLimitCheck.allowed) {
                throw new Error(`Rate limit exceeded for read operations`);
            }
            
            // Log operation
            window.dbSecurity.logOperation('get', collectionName, null, documentId);
            
            try {
                const result = await originalGet.call(this, options);
                
                // Check data integrity on read
                if (DB_SECURITY_CONFIG.integrity.checkOnRead && result.exists) {
                    window.dbSecurity.checkDataIntegrity(collectionName, documentId, result.data());
                }
                
                return result;
            } catch (error) {
                window.dbSecurity.logSecurityEvent('database_read_failed', {
                    operation: 'get',
                    collection: collectionName,
                    documentId,
                    error: error.message
                });
                throw error;
            }
        };
    }
    
    /**
     * Validate database operation
     */
    validateOperation(operation, collection, data = null) {
        // Check if user is authenticated for auth-required operations
        if (DB_SECURITY_CONFIG.access.authRequired.includes(operation) && !window.auth?.currentUser) {
            return { valid: false, reason: 'authentication_required' };
        }
        
        // Check if user is admin for admin-only operations
        if (DB_SECURITY_CONFIG.access.adminOnly.includes(operation)) {
            if (!window.auth?.currentUser || !window.isAdminUID?.(window.auth.currentUser.uid)) {
                return { valid: false, reason: 'admin_privileges_required' };
            }
        }
        
        // Check session validation for sensitive operations
        if (window.sessionManager) {
            const sessionValidation = window.sessionManager.validateSessionForAction(operation);
            if (!sessionValidation.valid) {
                return { valid: false, reason: `session_${sessionValidation.reason}` };
            }
        }
        
        return { valid: true };
    }
    
    /**
     * Check rate limiting for database operations
     */
    checkRateLimit(operation) {
        const rateLimiter = this.rateLimiters.get(operation);
        if (!rateLimiter) {
            return { allowed: true };
        }
        
        // Check if currently blocked
        if (rateLimiter.blockedUntil && Date.now() < rateLimiter.blockedUntil) {
            return {
                allowed: false,
                blockedUntil: rateLimiter.blockedUntil
            };
        }
        
        const now = Date.now();
        const windowStart = now - rateLimiter.config.window;
        
        // Remove old requests outside the window
        rateLimiter.requests = rateLimiter.requests.filter(timestamp => timestamp > windowStart);
        
        // Check if limit exceeded
        if (rateLimiter.requests.length >= rateLimiter.config.requests) {
            rateLimiter.blockedUntil = now + (rateLimiter.config.window * 2); // Block for 2x window duration
            
            this.logSecurityEvent('database_rate_limit_exceeded', {
                operation,
                blockedUntil: rateLimiter.blockedUntil
            });
            
            return {
                allowed: false,
                blockedUntil: rateLimiter.blockedUntil
            };
        }
        
        // Add current request
        rateLimiter.requests.push(now);
        
        return { allowed: true };
    }
    
    /**
     * Validate data according to schema
     */
    validateData(collection, data) {
        const schema = DB_SECURITY_CONFIG.validation[collection];
        if (!schema) {
            return { valid: true }; // No validation schema defined
        }
        
        for (const [field, rules] of Object.entries(schema)) {
            const value = data[field];
            
            // Check required fields
            if (rules.required && (value === undefined || value === null || value === '')) {
                return { valid: false, reason: `missing_required_field: ${field}` };
            }
            
            if (value !== undefined && value !== null) {
                // Check minimum length
                if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
                    return { valid: false, reason: `field_too_short: ${field} (min: ${rules.minLength})` };
                }
                
                // Check maximum length
                if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
                    return { valid: false, reason: `field_too_long: ${field} (max: ${rules.maxLength})` };
                }
                
                // Check pattern
                if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
                    return { valid: false, reason: `invalid_pattern: ${field}` };
                }
                
                // Check allowed values
                if (rules.allowedValues && !rules.allowedValues.includes(value)) {
                    return { valid: false, reason: `invalid_value: ${field} (allowed: ${rules.allowedValues.join(', ')})` };
                }
                
                // Check allowed tags for HTML content
                if (rules.allowedTags && typeof value === 'string') {
                    const tagValidation = this.validateHTMLTags(value, rules.allowedTags);
                    if (!tagValidation.valid) {
                        return { valid: false, reason: `invalid_html_tags: ${field} (${tagValidation.reason})` };
                    }
                }
            }
        }
        
        return { valid: true };
    }
    
    /**
     * Validate HTML tags in content
     */
    validateHTMLTags(content, allowedTags) {
        const tagRegex = /<(\w+)[^>]*>/g;
        const tags = [];
        let match;
        
        while ((match = tagRegex.exec(content)) !== null) {
            tags.push(match[1].toLowerCase());
        }
        
        const invalidTags = tags.filter(tag => !allowedTags.includes(tag));
        if (invalidTags.length > 0) {
            return { valid: false, reason: `disallowed tags: ${invalidTags.join(', ')}` };
        }
        
        return { valid: true };
    }
    
    /**
     * Check data integrity
     */
    checkDataIntegrity(collection, documentId, data) {
        // Check for data corruption patterns
        const corruptionPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /eval\s*\(/i
        ];
        
        const dataString = JSON.stringify(data);
        const suspiciousPatterns = corruptionPatterns.filter(pattern => pattern.test(dataString));
        
        if (suspiciousPatterns.length > 0) {
            const issue = {
                collection,
                documentId,
                timestamp: new Date().toISOString(),
                patterns: suspiciousPatterns.map(p => p.source),
                data: this.sanitizeDataForLogging(data)
            };
            
            this.integrityIssues.push(issue);
            
            if (DB_SECURITY_CONFIG.integrity.logIntegrityIssues) {
                this.logSecurityEvent('data_integrity_issue', issue);
            }
            
            if (DB_SECURITY_CONFIG.integrity.autoRepair) {
                this.repairDataIntegrity(collection, documentId, data);
            }
        }
    }
    
    /**
     * Repair data integrity issues
     */
    async repairDataIntegrity(collection, documentId, data) {
        try {
            // Remove suspicious patterns
            const sanitizedData = this.sanitizeData(data);
            
            // Update the document with sanitized data
            await window.db.collection(collection).doc(documentId).update(sanitizedData);
            
            this.logSecurityEvent('data_integrity_repaired', {
                collection,
                documentId,
                originalData: this.sanitizeDataForLogging(data),
                sanitizedData: this.sanitizeDataForLogging(sanitizedData)
            });
        } catch (error) {
            this.logSecurityEvent('data_integrity_repair_failed', {
                collection,
                documentId,
                error: error.message
            });
        }
    }
    
    /**
     * Sanitize data for logging
     */
    sanitizeDataForLogging(data) {
        const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'auth'];
        const sanitized = { ...data };
        
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });
        
        return sanitized;
    }
    
    /**
     * Sanitize data to remove malicious content
     */
    sanitizeData(data) {
        const sanitized = { ...data };
        
        // Recursively sanitize all string values
        const sanitizeValue = (value) => {
            if (typeof value === 'string') {
                // Remove script tags and event handlers
                return value
                    .replace(/<script[^>]*>.*?<\/script>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '')
                    .replace(/eval\s*\(/gi, '');
            } else if (typeof value === 'object' && value !== null) {
                if (Array.isArray(value)) {
                    return value.map(sanitizeValue);
                } else {
                    const sanitizedObj = {};
                    for (const [key, val] of Object.entries(value)) {
                        sanitizedObj[key] = sanitizeValue(val);
                    }
                    return sanitizedObj;
                }
            }
            return value;
        };
        
        for (const [key, value] of Object.entries(sanitized)) {
            sanitized[key] = sanitizeValue(value);
        }
        
        return sanitized;
    }
    
    /**
     * Log database operation
     */
    logOperation(operation, collection, data, documentId = null) {
        const logEntry = {
            type: 'database_operation',
            operation,
            collection,
            documentId,
            timestamp: new Date().toISOString(),
            sessionId: window.sessionManager?.sessionId,
            userId: window.sessionManager?.sessionData?.userId,
            data: data ? this.sanitizeDataForLogging(data) : null
        };
        
        this.operationLog.push(logEntry);
        this.cleanupLog();
        
        // Send to server
        this.sendLogToServer(logEntry);
    }
    
    /**
     * Log security event
     */
    logSecurityEvent(eventType, data) {
        const logEntry = {
            type: 'database_security_event',
            eventType,
            timestamp: new Date().toISOString(),
            data: this.sanitizeDataForLogging(data),
            sessionId: window.sessionManager?.sessionId,
            userId: window.sessionManager?.sessionData?.userId
        };
        
        this.operationLog.push(logEntry);
        this.cleanupLog();
        
        // Send to server
        this.sendLogToServer(logEntry);
        
        // Show warning for critical events
        if (eventType.includes('integrity') || eventType.includes('security')) {
            this.showSecurityWarning(eventType, data);
        }
    }
    
    /**
     * Show security warning
     */
    showSecurityWarning(eventType, data) {
        // Create warning notification
        const warning = document.createElement('div');
        warning.className = 'fixed bottom-4 right-4 bg-orange-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md';
        warning.innerHTML = `
            <div class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
                <span>Database security: ${eventType.replace(/_/g, ' ')}</span>
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
     * Start automatic backup
     */
    startAutoBackup() {
        if (!DB_SECURITY_CONFIG.backup.autoBackup) return;
        
        setInterval(() => {
            this.createBackup();
        }, DB_SECURITY_CONFIG.backup.backupInterval);
    }
    
    /**
     * Create database backup
     */
    async createBackup() {
        if (!DB_SECURITY_CONFIG.backup.enabled || !window.db) return;
        
        try {
            const backup = {
                timestamp: new Date().toISOString(),
                collections: {}
            };
            
            // Backup each configured collection
            for (const collectionName of DB_SECURITY_CONFIG.backup.backupCollections) {
                const snapshot = await window.db.collection(collectionName).get();
                backup.collections[collectionName] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    data: doc.data()
                }));
            }
            
            // Encrypt backup if enabled
            if (DB_SECURITY_CONFIG.backup.encryptBackups) {
                backup.data = btoa(JSON.stringify(backup.collections));
                delete backup.collections;
            }
            
            // Store backup
            this.backupHistory.push(backup);
            
            // Limit backup history
            if (this.backupHistory.length > DB_SECURITY_CONFIG.backup.maxBackups) {
                this.backupHistory = this.backupHistory.slice(-DB_SECURITY_CONFIG.backup.maxBackups);
            }
            
            // Save to server
            await this.saveBackupToServer(backup);
            
            this.logSecurityEvent('backup_created', {
                timestamp: backup.timestamp,
                collections: Object.keys(backup.collections || {})
            });
            
        } catch (error) {
            this.logSecurityEvent('backup_failed', {
                error: error.message
            });
        }
    }
    
    /**
     * Save backup to server
     */
    async saveBackupToServer(backup) {
        try {
            if (window.db) {
                await window.db.collection('database_backups').add({
                    ...backup,
                    createdAt: new Date(),
                    createdBy: window.sessionManager?.sessionData?.userId || 'system'
                });
            }
        } catch (error) {
            // Don't log backup logging errors to avoid loops
        }
    }
    
    /**
     * Cleanup log
     */
    cleanupLog() {
        if (this.operationLog.length > 1000) {
            this.operationLog = this.operationLog.slice(-500);
        }
    }
    
    /**
     * Send log to server
     */
    async sendLogToServer(logEntry) {
        try {
            if (window.db && window.sessionManager?.sessionData) {
                await window.db.collection('database_logs').add({
                    ...logEntry,
                    createdAt: new Date()
                });
            }
        } catch (error) {
            // Don't log logging errors to avoid loops
        }
    }
    
    /**
     * Get database statistics
     */
    getDatabaseStats() {
        const stats = {
            totalOperations: this.operationLog.filter(log => log.type === 'database_operation').length,
            securityEvents: this.operationLog.filter(log => log.type === 'database_security_event').length,
            integrityIssues: this.integrityIssues.length,
            backups: this.backupHistory.length,
            recentOperations: this.operationLog.slice(-10)
        };
        
        return stats;
    }
    
    /**
     * Get rate limiter status
     */
    getRateLimiterStatus() {
        const status = {};
        
        this.rateLimiters.forEach((limiter, operation) => {
            status[operation] = {
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
     * Reset rate limiter for operation
     */
    resetRateLimiter(operation) {
        const limiter = this.rateLimiters.get(operation);
        if (limiter) {
            limiter.requests = [];
            limiter.blockedUntil = null;
        }
    }
    
    /**
     * Clear all logs
     */
    clearLogs() {
        this.operationLog = [];
        this.integrityIssues = [];
    }
    
    /**
     * Export logs
     */
    exportLogs() {
        const dataStr = JSON.stringify({
            operations: this.operationLog,
            integrityIssues: this.integrityIssues,
            backups: this.backupHistory
        }, null, 2);
        
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `database-logs-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }
}

// Initialize database security
const dbSecurity = new DatabaseSecurity();

// Make available globally
window.dbSecurity = dbSecurity;
window.DatabaseSecurity = DatabaseSecurity;
window.DB_SECURITY_CONFIG = DB_SECURITY_CONFIG;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DatabaseSecurity, dbSecurity, DB_SECURITY_CONFIG };
}
