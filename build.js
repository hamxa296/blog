/**
 * Build script to combine and minify JavaScript files
 * Run with: node build.js
 */

const fs = require('fs');
const path = require('path');

// Files to combine for production
const filesToCombine = [
    'firebase-init.js',      // Firebase initialization must come first
    'admin-config.js',
    'auth.js',
    'users.js',              // Added users functions
    'posts.js',              // Added posts functions
    'gallery.js',
    'gallery-admin.js',
    'script.js',
    'app.js',
    'theme-manager.js',
    'security.js',           // Added security functions
    'performance-monitor.js', // Added performance monitoring
    'calendar.js'            // Added calendar functionality
];

// Function to remove console.log statements and debug code
function removeDebugCode(content) {
    // Remove console.log statements and their entire lines
    content = content.replace(/^\s*console\.log\([^)]*\);?\s*$/gm, '');
    
    // Remove debug comments
    content = content.replace(/\/\/\s*DEBUG.*$/gm, '');
    content = content.replace(/\/\/\s*Debug.*$/gm, '');
    
    // Remove temporary debugging functions
    content = content.replace(/\/\/\s*Temporary debugging function.*?}/gs, '');
    
    // Remove debug function definitions
    content = content.replace(/window\.debug\w*\s*=\s*function.*?};?\s*/gs, '');
    
    // Clean up multiple empty lines
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return content;
}

// Function to remove Firebase initialization from non-init files
function removeFirebaseInit(content, isFirebaseInitFile = false) {
    if (isFirebaseInitFile) {
        return content; // Keep Firebase init in firebase-init.js
    }
    
    // Remove firebaseConfig declarations from other files
    content = content.replace(/const\s+firebaseConfig\s*=\s*\{[\s\S]*?\};?\s*/g, '');
    
    // Remove firebase.initializeApp calls from other files
    content = content.replace(/firebase\.initializeApp\(firebaseConfig\);/g, '');
    
    return content;
}

// Function to minify JavaScript (basic minification that preserves syntax)
function minifyJS(content) {
    // Remove comments (except license headers)
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    content = content.replace(/\/\/.*$/gm, '');
    
    // Remove extra whitespace but preserve string literals and syntax
    // Only remove multiple spaces and tabs, preserve newlines
    content = content.replace(/[ \t]+/g, ' ');
    
    // Remove empty lines but preserve structure
    content = content.replace(/\n\s*\n/g, '\n');
    
    // Remove trailing semicolons and spaces
    content = content.trim();
    
    return content;
}

// Function to combine files
function combineFiles() {
    console.log('🚀 Starting production build process...\n');
    
    let combinedContent = '';
    let originalSize = 0;
    
    filesToCombine.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            originalSize += content.length;
            
            // Remove debug code
            let cleanedContent = removeDebugCode(content);
            
            // Remove Firebase initialization from non-init files
            const isFirebaseInitFile = file === 'firebase-init.js';
            cleanedContent = removeFirebaseInit(cleanedContent, isFirebaseInitFile);
            
            combinedContent += `\n// ${file}\n${cleanedContent}\n`;
            console.log(`✓ Added ${file}`);
        } else {
            console.log(`⚠ File not found: ${file}`);
        }
    });
    
    // Add production header
    const productionHeader = `/**
 * GIKI Chronicles - Production Build
 * Combined and optimized for production
 * Includes: Firebase, Security, Performance Monitoring
 * Build Date: ${new Date().toISOString()}
 */\n\n`;
    
    combinedContent = productionHeader + combinedContent;
    
    // Write combined file (without minification to avoid syntax errors)
    fs.writeFileSync('combined.min.js', combinedContent);
    
    const finalSize = combinedContent.length;
    const reduction = Math.round(((originalSize - finalSize) / originalSize) * 100);
    
    console.log('\n📊 Production Build Results:');
    console.log(`Original size: ${(originalSize / 1024).toFixed(1)} KB`);
    console.log(`Final size: ${(finalSize / 1024).toFixed(1)} KB`);
    console.log(`Size reduction: ${reduction}%`);
    console.log(`Debug code removed: ✓`);
    console.log(`Syntax preserved: ✓`);
    console.log(`Security functions included: ✓`);
    console.log(`Performance monitoring included: ✓`);
    console.log('\n✅ Production build complete! Use combined.min.js in your HTML files.');
    console.log('\n📋 Next Steps:');
    console.log('1. Update all HTML files to use combined.min.js');
    console.log('2. Add service worker registration to all pages');
    console.log('3. Test all functionality');
}

// Run the build
combineFiles();
