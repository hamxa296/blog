/**
 * security.js
 * Enhanced security measures for the GIKI Chronicles admin system
 */

// Rate limiting for admin actions
const adminActionLimiter = {
    attempts: new Map(),
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    
    checkLimit(userId, action) {
        const key = `${userId}-${action}`;
        const now = Date.now();
        const userAttempts = this.attempts.get(key) || [];
        
        // Remove old attempts outside the window
        const recentAttempts = userAttempts.filter(time => now - time < this.windowMs);
        
        if (recentAttempts.length >= this.maxAttempts) {
            return false;
        }
        
        recentAttempts.push(now);
        this.attempts.set(key, recentAttempts);
        return true;
    },
    
    reset(userId, action) {
        const key = `${userId}-${action}`;
        this.attempts.delete(key);
    }
};

// Enhanced admin validation with additional security checks
async function validateAdminAccess(action = 'general') {
    const user = auth.currentUser;
    if (!user) {
        console.error("Admin validation failed: No authenticated user");
        return { valid: false, error: "Authentication required" };
    }

    // Rate limiting check
    if (!adminActionLimiter.checkLimit(user.uid, action)) {
        console.error(`Rate limit exceeded for user ${user.uid} on action ${action}`);
        return { valid: false, error: "Too many admin actions. Please wait before trying again." };
    }

    try {
        // Verify admin status
        const isAdmin = await isUserAdmin();
        if (!isAdmin) {
            console.error(`Unauthorized admin access attempt by user ${user.uid} for action: ${action}`);
            return { valid: false, error: "Admin privileges required" };
        }

        // Additional security: Check if user account is still active
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            console.error(`Admin validation failed: User document not found for ${user.uid}`);
            return { valid: false, error: "User account not found" };
        }

        const userData = userDoc.data();
        if (userData.isSuspended) {
            console.error(`Admin validation failed: Suspended user ${user.uid} attempted admin action`);
            return { valid: false, error: "Account suspended" };
        }

        // Log admin action for audit trail
        await logAdminAction(user.uid, action, 'success');
        
        return { valid: true, user: user, userData: userData };
    } catch (error) {
        console.error("Admin validation error:", error);
        return { valid: false, error: "Validation failed" };
    }
}

// Audit trail for admin actions
async function logAdminAction(userId, action, status, details = {}) {
    try {
        await db.collection('admin_audit_log').add({
            userId: userId,
            action: action,
            status: status,
            details: details,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            userAgent: navigator.userAgent,
            ipAddress: 'client-side' // In production, this should come from server
        });
    } catch (error) {
        console.error("Failed to log admin action:", error);
    }
}

// Enhanced session validation
function validateSession() {
    const user = auth.currentUser;
    if (!user) return false;
    
    // Check if token is recent (within last hour)
    const tokenTime = user.metadata.lastSignInTime;
    if (tokenTime) {
        const lastSignIn = new Date(tokenTime);
        const now = new Date();
        const hoursSinceSignIn = (now - lastSignIn) / (1000 * 60 * 60);
        
        if (hoursSinceSignIn > 24) { // Require re-authentication after 24 hours
            console.warn("Session expired, requiring re-authentication");
            return false;
        }
    }
    
    return true;
}

// Input sanitization for admin actions
function sanitizeAdminInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous characters and scripts
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
}

// Enhanced error handling for admin functions
function handleAdminError(error, context) {
    console.error(`Admin error in ${context}:`, error);
    
    // Log security-relevant errors
    if (error.code === 'permission-denied' || error.message.includes('permission')) {
        logAdminAction('unknown', context, 'permission_denied', { error: error.message });
    }
    
    return {
        success: false,
        error: "An error occurred. Please try again or contact support.",
        context: context
    };
}

// Export functions for use in other files
window.security = {
    validateAdminAccess,
    logAdminAction,
    validateSession,
    sanitizeAdminInput,
    handleAdminError,
    adminActionLimiter
}; 