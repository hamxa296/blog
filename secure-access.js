/**
 * secure-access.js
 * Provides secure access to admin functionality through hash verification
 */

// Secret hash for admin access (change this to your own secret)
const ADMIN_SECRET_HASH = "1234567890";

// Function to generate a secure hash
function generateHash(input) {
    let hash = 0;
    if (input.length === 0) return hash.toString();
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
}

// Function to verify admin access
function verifyAdminAccess(providedHash) {
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const expectedHash = generateHash(ADMIN_SECRET_HASH + currentDate);
    return providedHash === expectedHash;
}

// Function to generate today's access hash (for testing)
function getTodayAccessHash() {
    const currentDate = new Date().toISOString().split('T')[0];
    return generateHash(ADMIN_SECRET_HASH + currentDate);
}

// Function to check if user should have admin access
function checkSecureAdminAccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const accessHash = urlParams.get('access');
    
    if (accessHash && verifyAdminAccess(accessHash)) {
        console.log("✅ Secure admin access verified");
        return true;
    }
    
    // Fallback: Check if user is admin in database
    return false;
}

// Function to redirect to secure admin page
function redirectToSecureAdmin() {
    const todayHash = getTodayAccessHash();
    const secureUrl = `admin.html?access=${todayHash}`;
    window.location.href = secureUrl;
}

// Function to create a secure admin link
function createSecureAdminLink() {
    const todayHash = getTodayAccessHash();
    const secureUrl = `${window.location.origin}/admin.html?access=${todayHash}`;
    console.log("🔐 Secure admin link for today:", secureUrl);
    return secureUrl;
}

// Make functions available globally
window.verifyAdminAccess = verifyAdminAccess;
window.getTodayAccessHash = getTodayAccessHash;
window.checkSecureAdminAccess = checkSecureAdminAccess;
window.redirectToSecureAdmin = redirectToSecureAdmin;
window.createSecureAdminLink = createSecureAdminLink; 