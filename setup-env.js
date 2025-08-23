#!/usr/bin/env node

/**
 * Environment Setup Script for GIKI Chronicles
 * This script helps validate and set up environment variables
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
    log(`\n${'='.repeat(50)}`, 'cyan');
    log(` ${message}`, 'bright');
    log(`${'='.repeat(50)}`, 'cyan');
}

function logSection(message) {
    log(`\n${message}`, 'yellow');
    log('-'.repeat(message.length));
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Check if environment files exist
function checkEnvironmentFiles() {
    logSection('Checking Environment Files');
    
    const envFiles = [
        '.env.local',
        '.env.production',
        '.env.staging',
        'env.development',
        'env.production',
        'env.staging'
    ];
    
    envFiles.forEach(file => {
        if (fs.existsSync(file)) {
            logSuccess(`${file} exists`);
        } else {
            logWarning(`${file} not found`);
        }
    });
}

// Validate Firebase configuration
function validateFirebaseConfig() {
    logSection('Validating Firebase Configuration');
    
    try {
        // Check if firebase-config-secure.js exists
        if (!fs.existsSync('firebase-config-secure.js')) {
            logError('firebase-config-secure.js not found');
            return false;
        }
        
        const configContent = fs.readFileSync('firebase-config-secure.js', 'utf8');
        
        // Check for placeholder values
        if (configContent.includes('YOUR_API_KEY_HERE')) {
            logWarning('Firebase config contains placeholder values');
            logInfo('Update firebase-config-secure.js with actual values for production');
        } else {
            logSuccess('Firebase config appears to have actual values');
        }
        
        // Check for process.env usage
        if (configContent.includes('process.env')) {
            logSuccess('Firebase config uses environment variables');
        } else {
            logWarning('Firebase config does not use environment variables');
        }
        
        return true;
    } catch (error) {
        logError(`Error validating Firebase config: ${error.message}`);
        return false;
    }
}

// Check security files
function checkSecurityFiles() {
    logSection('Checking Security Files');
    
    const securityFiles = [
        'security-utils.js',
        'csp-headers.js',
        'firebase-config-secure.js'
    ];
    
    securityFiles.forEach(file => {
        if (fs.existsSync(file)) {
            logSuccess(`${file} exists`);
        } else {
            logError(`${file} not found`);
        }
    });
}

// Check .gitignore
function checkGitignore() {
    logSection('Checking .gitignore');
    
    if (!fs.existsSync('.gitignore')) {
        logError('.gitignore not found');
        return;
    }
    
    const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
    const envPatterns = ['.env', '.env.local', '.env.production', '.env.staging'];
    
    envPatterns.forEach(pattern => {
        if (gitignoreContent.includes(pattern)) {
            logSuccess(`${pattern} is ignored by git`);
        } else {
            logWarning(`${pattern} is NOT ignored by git`);
        }
    });
}

// Generate environment setup instructions
function generateInstructions() {
    logSection('Environment Setup Instructions');
    
    logInfo('For Local Development:');
    log('1. Copy env.development to .env.local');
    log('2. Update .env.local with your actual Firebase values');
    log('3. Never commit .env.local to version control');
    
    logInfo('\nFor Production Deployment:');
    log('1. Set environment variables in your hosting platform:');
    log('   - Vercel: Add in Project Settings > Environment Variables');
    log('   - Netlify: Add in Site Settings > Environment Variables');
    log('   - Firebase Hosting: Use .env.production file');
    
    logInfo('\nFor Staging/Testing:');
    log('1. Create a separate Firebase project for staging');
    log('2. Use env.staging as a template');
    log('3. Set environment variables in staging hosting platform');
}

// Main execution
function main() {
    logHeader('GIKI Chronicles Environment Setup');
    
    checkEnvironmentFiles();
    validateFirebaseConfig();
    checkSecurityFiles();
    checkGitignore();
    generateInstructions();
    
    logHeader('Setup Complete');
    logInfo('Review the output above and follow the instructions to complete your environment setup.');
    logInfo('For help with specific hosting platforms, check their documentation.');
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    checkEnvironmentFiles,
    validateFirebaseConfig,
    checkSecurityFiles,
    checkGitignore,
    generateInstructions
};
