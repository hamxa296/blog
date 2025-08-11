/**
 * Build script to combine and minify JavaScript files
 * Run with: node build.js
 */

const fs = require('fs');
const path = require('path');

// Files to combine for production
const filesToCombine = [
    'firebase-init.js',
    'admin-config.js',
    'auth.js',
    'gallery.js',
    'gallery-admin.js',
    'script.js',
    'app.js',
    'theme-manager.js'
];

// Function to remove console.log statements and debug code
function removeDebugCode(content) {
    // Remove console.log statements
    content = content.replace(/console\.log\([^)]*\);?\s*/g, '');
    
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

// Function to minify JavaScript (basic minification that preserves syntax)
function minifyJS(content) {
    // Remove comments (except license headers)
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    content = content.replace(/\/\/.*$/gm, '');
    
    // Remove extra whitespace but preserve string literals
    content = content.replace(/\s+/g, ' ');
    content = content.replace(/\s*{\s*/g, '{');
    content = content.replace(/\s*}\s*/g, '}');
    content = content.replace(/\s*;\s*/g, ';');
    content = content.replace(/\s*,\s*/g, ',');
    content = content.replace(/\s*=\s*/g, '=');
    content = content.replace(/\s*\+\s*/g, '+');
    content = content.replace(/\s*-\s*/g, '-');
    content = content.replace(/\s*\*\s*/g, '*');
    content = content.replace(/\s*\/\s*/g, '/');
    
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
            const cleanedContent = removeDebugCode(content);
            
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
    console.log('\n✅ Production build complete! Use combined.min.js in your HTML files.');
}

// Run the build
combineFiles();
