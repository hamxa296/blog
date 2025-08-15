/**
 * ip-restriction.js
 * IP restriction and geolocation-based access control
 * This module provides campus-only access for admin functions
 */

// IP restriction configuration
const IP_RESTRICTION_CONFIG = {
    // Campus IP ranges (GIKI campus)
    campusIPRanges: [
        // GIKI main campus IP ranges (example - replace with actual ranges)
        { start: '192.168.1.0', end: '192.168.1.255' },
        { start: '10.0.0.0', end: '10.255.255.255' },
        { start: '172.16.0.0', end: '172.31.255.255' }
    ],
    
    // Allowed countries for admin access
    allowedCountries: ['PK'], // Pakistan only
    
    // Security settings
    security: {
        requireCampusIP: true,
        requireCountryMatch: true,
        allowVPN: false,
        maxFailedAttempts: 5,
        lockoutDuration: 30 * 60 * 1000, // 30 minutes
        logAccessAttempts: true
    },
    
    // Geolocation settings
    geolocation: {
        enabled: true,
        timeout: 5000, // 5 seconds
        fallbackCountry: 'PK'
    }
};

// IP Restriction Manager class
class IPRestrictionManager {
    constructor() {
        this.failedAttempts = new Map();
        this.allowedIPs = new Set();
        this.blockedIPs = new Set();
        this.geolocationCache = new Map();
    }
    
    // Check if IP is allowed for admin access
    async checkIPAccess(userId, action = 'admin_access') {
        try {
            const clientIP = await this.getClientIP();
            const userAgent = navigator.userAgent;
            
            // Check if IP is blocked
            if (this.blockedIPs.has(clientIP)) {
                await this.logAccessAttempt(userId, clientIP, action, 'BLOCKED_IP', userAgent);
                return { allowed: false, reason: 'IP address is blocked' };
            }
            
            // Check if IP is in allowed list
            if (this.allowedIPs.has(clientIP)) {
                await this.logAccessAttempt(userId, clientIP, action, 'ALLOWED_WHITELIST', userAgent);
                return { allowed: true, reason: 'IP in whitelist' };
            }
            
            // Check campus IP ranges
            if (IP_RESTRICTION_CONFIG.security.requireCampusIP) {
                const isCampusIP = this.isCampusIP(clientIP);
                if (!isCampusIP) {
                    await this.logAccessAttempt(userId, clientIP, action, 'NON_CAMPUS_IP', userAgent);
                    return { allowed: false, reason: 'Access restricted to campus IP addresses' };
                }
            }
            
            // Check geolocation
            if (IP_RESTRICTION_CONFIG.security.requireCountryMatch) {
                const countryCheck = await this.checkCountryAccess(clientIP);
                if (!countryCheck.allowed) {
                    await this.logAccessAttempt(userId, clientIP, action, 'COUNTRY_BLOCKED', userAgent);
                    return countryCheck;
                }
            }
            
            // Check for VPN usage
            if (!IP_RESTRICTION_CONFIG.security.allowVPN) {
                const vpnCheck = await this.detectVPN(clientIP);
                if (vpnCheck.isVPN) {
                    await this.logAccessAttempt(userId, clientIP, action, 'VPN_DETECTED', userAgent);
                    return { allowed: false, reason: 'VPN access not allowed' };
                }
            }
            
            // All checks passed
            await this.logAccessAttempt(userId, clientIP, action, 'ALLOWED', userAgent);
            return { allowed: true, reason: 'Access granted' };
            
        } catch (error) {
            console.error('IP access check error:', error);
            await this.logAccessAttempt(userId, 'UNKNOWN', action, 'ERROR', navigator.userAgent, error.message);
            return { allowed: false, reason: 'Access check failed' };
        }
    }
    
    // Get client IP address
    async getClientIP() {
        try {
            // Try to get IP from a public service
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.warn('Could not get public IP, using fallback');
            // Fallback to local IP detection
            return this.getLocalIP();
        }
    }
    
    // Get local IP address (fallback)
    getLocalIP() {
        // This is a simplified local IP detection
        // In production, use a more robust method
        return '127.0.0.1';
    }
    
    // Check if IP is within campus ranges
    isCampusIP(ip) {
        const ipNum = this.ipToNumber(ip);
        
        return IP_RESTRICTION_CONFIG.campusIPRanges.some(range => {
            const startNum = this.ipToNumber(range.start);
            const endNum = this.ipToNumber(range.end);
            return ipNum >= startNum && ipNum <= endNum;
        });
    }
    
    // Convert IP address to number for comparison
    ipToNumber(ip) {
        return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
    }
    
    // Check country access
    async checkCountryAccess(ip) {
        try {
            const country = await this.getCountryFromIP(ip);
            
            if (!IP_RESTRICTION_CONFIG.allowedCountries.includes(country)) {
                return { 
                    allowed: false, 
                    reason: `Access not allowed from country: ${country}` 
                };
            }
            
            return { allowed: true, country: country };
        } catch (error) {
            console.error('Country check error:', error);
            return { allowed: false, reason: 'Could not verify country' };
        }
    }
    
    // Get country from IP address
    async getCountryFromIP(ip) {
        // Check cache first
        if (this.geolocationCache.has(ip)) {
            return this.geolocationCache.get(ip);
        }
        
        try {
            // Use a free geolocation service
            const response = await fetch(`https://ipapi.co/${ip}/json/`);
            const data = await response.json();
            
            const country = data.country_code || IP_RESTRICTION_CONFIG.geolocation.fallbackCountry;
            
            // Cache the result
            this.geolocationCache.set(ip, country);
            
            // Clear cache after 1 hour
            setTimeout(() => {
                this.geolocationCache.delete(ip);
            }, 60 * 60 * 1000);
            
            return country;
        } catch (error) {
            console.error('Geolocation error:', error);
            return IP_RESTRICTION_CONFIG.geolocation.fallbackCountry;
        }
    }
    
    // Detect VPN usage
    async detectVPN(ip) {
        try {
            // This is a simplified VPN detection
            // In production, use a more sophisticated VPN detection service
            
            // Check for common VPN providers
            const vpnProviders = [
                'vpn', 'proxy', 'tor', 'anonymous'
            ];
            
            const response = await fetch(`https://ipapi.co/${ip}/json/`);
            const data = await response.json();
            
            const org = (data.org || '').toLowerCase();
            const isVPN = vpnProviders.some(provider => org.includes(provider));
            
            return { isVPN: isVPN, provider: isVPN ? org : null };
        } catch (error) {
            console.error('VPN detection error:', error);
            return { isVPN: false, provider: null };
        }
    }
    
    // Add IP to whitelist
    addToWhitelist(ip) {
        this.allowedIPs.add(ip);
        this.blockedIPs.delete(ip);
    }
    
    // Remove IP from whitelist
    removeFromWhitelist(ip) {
        this.allowedIPs.delete(ip);
    }
    
    // Block IP address
    blockIP(ip) {
        this.blockedIPs.add(ip);
        this.allowedIPs.delete(ip);
    }
    
    // Unblock IP address
    unblockIP(ip) {
        this.blockedIPs.delete(ip);
    }
    
    // Record failed access attempt
    recordFailedAttempt(ip) {
        const attempts = this.failedAttempts.get(ip) || [];
        attempts.push(Date.now());
        this.failedAttempts.set(ip, attempts);
        
        // Check if IP should be blocked
        const recentAttempts = attempts.filter(time => 
            Date.now() - time < IP_RESTRICTION_CONFIG.security.lockoutDuration
        );
        
        if (recentAttempts.length >= IP_RESTRICTION_CONFIG.security.maxFailedAttempts) {
            this.blockIP(ip);
        }
    }
    
    // Reset failed attempts for IP
    resetFailedAttempts(ip) {
        this.failedAttempts.delete(ip);
    }
    
    // Check if IP is blocked
    isIPBlocked(ip) {
        return this.blockedIPs.has(ip);
    }
    
    // Check if IP is whitelisted
    isIPWhitelisted(ip) {
        return this.allowedIPs.has(ip);
    }
    
    // Get access statistics
    getAccessStats() {
        return {
            whitelistedIPs: this.allowedIPs.size,
            blockedIPs: this.blockedIPs.size,
            failedAttempts: this.failedAttempts.size,
            geolocationCache: this.geolocationCache.size
        };
    }
    
    // Log access attempt
    async logAccessAttempt(userId, ip, action, result, userAgent, error = null) {
        if (!IP_RESTRICTION_CONFIG.security.logAccessAttempts) {
            return;
        }
        
        try {
            const logEntry = {
                userId: userId,
                ip: ip,
                action: action,
                result: result,
                userAgent: userAgent,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                error: error
            };
            
            await firebase.firestore().collection('ip_access_logs').add(logEntry);
        } catch (error) {
            console.error('Failed to log access attempt:', error);
        }
    }
    
    // Get recent access logs
    async getRecentAccessLogs(limit = 50) {
        try {
            const snapshot = await firebase.firestore()
                .collection('ip_access_logs')
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Failed to get access logs:', error);
            return [];
        }
    }
    
    // Clear old access logs
    async clearOldAccessLogs(daysOld = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            const snapshot = await firebase.firestore()
                .collection('ip_access_logs')
                .where('timestamp', '<', cutoffDate)
                .get();
            
            const batch = firebase.firestore().batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            console.log(`Cleared ${snapshot.docs.length} old access logs`);
        } catch (error) {
            console.error('Failed to clear old access logs:', error);
        }
    }
}

// Initialize IP restriction manager
const ipRestrictionManager = new IPRestrictionManager();

// Export IP restriction functions
window.IPRestriction = {
    IPRestrictionManager,
    IP_RESTRICTION_CONFIG,
    ipRestrictionManager,
    
    // Convenience functions
    checkIPAccess: (userId, action) => ipRestrictionManager.checkIPAccess(userId, action),
    addToWhitelist: (ip) => ipRestrictionManager.addToWhitelist(ip),
    removeFromWhitelist: (ip) => ipRestrictionManager.removeFromWhitelist(ip),
    blockIP: (ip) => ipRestrictionManager.blockIP(ip),
    unblockIP: (ip) => ipRestrictionManager.unblockIP(ip),
    isIPBlocked: (ip) => ipRestrictionManager.isIPBlocked(ip),
    isIPWhitelisted: (ip) => ipRestrictionManager.isIPWhitelisted(ip),
    getAccessStats: () => ipRestrictionManager.getAccessStats(),
    getRecentAccessLogs: (limit) => ipRestrictionManager.getRecentAccessLogs(limit),
    clearOldAccessLogs: (days) => ipRestrictionManager.clearOldAccessLogs(days)
};

console.log('IP restriction module loaded');
