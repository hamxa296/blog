/**
 * admin-config.js
 * Centralized admin configuration for the application
 */

// Array of admin UIDs - add new admin UIDs here
const ADMIN_UIDS = [
    "DNDjKZRt0yQNh4d3inNchRcs0oY2", // Your working admin account
    "zCINcUAy84aMwHF83wlRUTO2Dn32",
    "gn2AlkdswANjVg58rUXOLoPaX192",
    "b7QYLqpUCNbCKGvU1SQgr1pHBJj1"
];

/**
 * Checks if a user UID is in the admin list
 * @param {string} uid - The user UID to check
 * @returns {boolean} - True if the user is an admin
 */
function isAdminUID(uid) {
    return ADMIN_UIDS.includes(uid);
}

/**
 * Gets all admin UIDs
 * @returns {string[]} - Array of admin UIDs
 */
function getAdminUIDs() {
    return [...ADMIN_UIDS]; // Return a copy to prevent modification
}

// Make functions globally available
window.isAdminUID = isAdminUID;
window.getAdminUIDs = getAdminUIDs;
window.ADMIN_UIDS = ADMIN_UIDS; 