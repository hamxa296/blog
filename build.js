/**
 * Build script to combine and minify JavaScript files
 * Run with: node build.js
 */

const fs = require('fs');
const path = require('path');

// Files to combine in order
const filesToCombine = [
    'firebase-init.js',
    'admin-config.js',
    'auth.js',
    'gallery.js',
    'gallery-admin.js',
    'script.js',
    'app.js',
    'theme-manager.js',
    'posts.js',
    'users.js',
    'comments.js',
    'security.js',
    'submissions.js',
    'database-optimization.js',
    'image-optimizer.js',
    'request-optimizer.js',
    'performance-monitor.js'
];

// Minification function (basic)
function minifyJS(code) {
    // For now, just return the code as-is to avoid template literal issues
    return code;
}

// Combine files
function combineFiles() {
    let combinedCode = '';
    
    filesToCombine.forEach(file => {
        try {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                combinedCode += `\n// ${file}\n${content}\n`;
                console.log(`✓ Added ${file}`);
            } else {
                console.log(`⚠ File not found: ${file}`);
            }
        } catch (error) {
            console.error(`✗ Error reading ${file}:`, error.message);
        }
    });
    
    return combinedCode;
}

// Main build process
function build() {
    console.log('🚀 Starting build process...\n');
    
    // Combine files
    const combinedCode = combineFiles();
    
    // Minify
    const minifiedCode = minifyJS(combinedCode);
    
    // Write combined file
    fs.writeFileSync('combined.min.js', minifiedCode);
    
    // Calculate size reduction
    const originalSize = combinedCode.length;
    const minifiedSize = minifiedCode.length;
    const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
    
    console.log('\n📊 Build Results:');
    console.log(`Original size: ${(originalSize / 1024).toFixed(1)} KB`);
    console.log(`Minified size: ${(minifiedSize / 1024).toFixed(1)} KB`);
    console.log(`Size reduction: ${reduction}%`);
    console.log('\n✅ Build complete! Use combined.min.js in your HTML files.');
}

// Run build
build();
