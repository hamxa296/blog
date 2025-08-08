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
    return code
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\/\/.*$/gm, '') // Remove single line comments
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\s*{\s*/g, '{') // Remove spaces around braces
        .replace(/\s*}\s*/g, '}') // Remove spaces around braces
        .replace(/\s*;\s*/g, ';') // Remove spaces around semicolons
        .replace(/\s*,\s*/g, ',') // Remove spaces around commas
        .replace(/\s*=\s*/g, '=') // Remove spaces around equals
        .replace(/\s*\+\s*/g, '+') // Remove spaces around plus
        .replace(/\s*-\s*/g, '-') // Remove spaces around minus
        .replace(/\s*\*\s*/g, '*') // Remove spaces around multiply
        .replace(/\s*\/\s*/g, '/') // Remove spaces around divide
        .trim();
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
