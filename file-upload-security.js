/**
 * file-upload-security.js
 * Comprehensive file upload security validation and sanitization
 */

// File upload security configuration
const UPLOAD_SECURITY_CONFIG = {
    // Allowed file types with MIME types and extensions
    allowedTypes: {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/gif': ['.gif'],
        'image/webp': ['.webp'],
        'image/svg+xml': ['.svg']
    },
    
    // Maximum file sizes (in bytes)
    maxSizes: {
        'image/jpeg': 5 * 1024 * 1024, // 5MB
        'image/png': 5 * 1024 * 1024,  // 5MB
        'image/gif': 10 * 1024 * 1024, // 10MB
        'image/webp': 5 * 1024 * 1024, // 5MB
        'image/svg+xml': 1 * 1024 * 1024 // 1MB
    },
    
    // Maximum dimensions for images
    maxDimensions: {
        width: 4096,
        height: 4096
    },
    
    // Rate limiting
    rateLimit: {
        maxFilesPerHour: 50,
        maxFilesPerDay: 200
    }
};

// File validation class
class FileUploadValidator {
    constructor() {
        this.uploadHistory = this.loadUploadHistory();
    }
    
    // Load upload history from localStorage
    loadUploadHistory() {
        try {
            const history = localStorage.getItem('uploadHistory');
            return history ? JSON.parse(history) : { hourly: [], daily: [] };
        } catch (error) {
            console.error('Error loading upload history:', error);
            return { hourly: [], daily: [] };
        }
    }
    
    // Save upload history to localStorage
    saveUploadHistory() {
        try {
            localStorage.setItem('uploadHistory', JSON.stringify(this.uploadHistory));
        } catch (error) {
            console.error('Error saving upload history:', error);
        }
    }
    
    // Clean old upload history entries
    cleanUploadHistory() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const oneDay = 24 * 60 * 60 * 1000;
        
        this.uploadHistory.hourly = this.uploadHistory.hourly.filter(
            timestamp => now - timestamp < oneHour
        );
        this.uploadHistory.daily = this.uploadHistory.daily.filter(
            timestamp => now - timestamp < oneDay
        );
        
        this.saveUploadHistory();
    }
    
    // Check rate limiting
    checkRateLimit() {
        this.cleanUploadHistory();
        
        const now = Date.now();
        const hourlyCount = this.uploadHistory.hourly.length;
        const dailyCount = this.uploadHistory.daily.length;
        
        if (hourlyCount >= UPLOAD_SECURITY_CONFIG.rateLimit.maxFilesPerHour) {
            throw new Error('Hourly upload limit exceeded. Please try again later.');
        }
        
        if (dailyCount >= UPLOAD_SECURITY_CONFIG.rateLimit.maxFilesPerDay) {
            throw new Error('Daily upload limit exceeded. Please try again tomorrow.');
        }
        
        return true;
    }
    
    // Record upload attempt
    recordUpload() {
        const now = Date.now();
        this.uploadHistory.hourly.push(now);
        this.uploadHistory.daily.push(now);
        this.saveUploadHistory();
    }
    
    // Validate file type
    validateFileType(file) {
        const mimeType = file.type;
        const extension = this.getFileExtension(file.name);
        
        if (!UPLOAD_SECURITY_CONFIG.allowedTypes[mimeType]) {
            throw new Error(`File type not allowed: ${mimeType}`);
        }
        
        const allowedExtensions = UPLOAD_SECURITY_CONFIG.allowedTypes[mimeType];
        if (!allowedExtensions.includes(extension.toLowerCase())) {
            throw new Error(`File extension not allowed: ${extension}`);
        }
        
        return true;
    }
    
    // Validate file size
    validateFileSize(file) {
        const mimeType = file.type;
        const maxSize = UPLOAD_SECURITY_CONFIG.maxSizes[mimeType];
        
        if (file.size > maxSize) {
            const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
            throw new Error(`File too large. Maximum size for ${mimeType} is ${maxSizeMB}MB`);
        }
        
        return true;
    }
    
    // Validate image dimensions
    async validateImageDimensions(file) {
        if (!file.type.startsWith('image/')) {
            return true; // Not an image, skip dimension validation
        }
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            img.onload = () => {
                URL.revokeObjectURL(url);
                
                if (img.width > UPLOAD_SECURITY_CONFIG.maxDimensions.width ||
                    img.height > UPLOAD_SECURITY_CONFIG.maxDimensions.height) {
                    reject(new Error(`Image dimensions too large. Maximum: ${UPLOAD_SECURITY_CONFIG.maxDimensions.width}x${UPLOAD_SECURITY_CONFIG.maxDimensions.height}`));
                } else {
                    resolve(true);
                }
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Invalid image file'));
            };
            
            img.src = url;
        });
    }
    
    // Get file extension
    getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    }
    
    // Sanitize filename
    sanitizeFilename(filename) {
        // Remove or replace dangerous characters
        let sanitized = filename
            .replace(/[<>:"/\\|?*]/g, '_') // Replace dangerous characters
            .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
            .replace(/^\.+/, '') // Remove leading dots
            .replace(/\.+$/, ''); // Remove trailing dots
        
        // Limit length
        if (sanitized.length > 100) {
            const extension = this.getFileExtension(sanitized);
            const nameWithoutExt = sanitized.slice(0, -(extension.length + 1));
            sanitized = nameWithoutExt.slice(0, 100 - extension.length - 1) + '.' + extension;
        }
        
        return sanitized || 'uploaded_file';
    }
    
    // Comprehensive file validation
    async validateFile(file) {
        try {
            // Check rate limiting first
            this.checkRateLimit();
            
            // Validate file type
            this.validateFileType(file);
            
            // Validate file size
            this.validateFileSize(file);
            
            // Validate image dimensions
            await this.validateImageDimensions(file);
            
            // Record successful validation
            this.recordUpload();
            
            return {
                isValid: true,
                sanitizedFilename: this.sanitizeFilename(file.name),
                file: file
            };
            
        } catch (error) {
            console.error('File validation failed:', error);
            return {
                isValid: false,
                error: error.message,
                file: file
            };
        }
    }
    
    // Scan file for malicious content (basic implementation)
    async scanForMaliciousContent(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const content = e.target.result;
                
                // Check for common malicious patterns
                const maliciousPatterns = [
                    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                    /javascript:/gi,
                    /vbscript:/gi,
                    /on\w+\s*=/gi,
                    /eval\s*\(/gi,
                    /document\./gi,
                    /window\./gi
                ];
                
                for (const pattern of maliciousPatterns) {
                    if (pattern.test(content)) {
                        resolve({
                            isMalicious: true,
                            pattern: pattern.source,
                            file: file
                        });
                        return;
                    }
                }
                
                resolve({
                    isMalicious: false,
                    file: file
                });
            };
            
            reader.onerror = () => {
                resolve({
                    isMalicious: false,
                    file: file,
                    error: 'Could not read file content'
                });
            };
            
            // Read as text for scanning
            reader.readAsText(file);
        });
    }
}

// Create global instance
const fileValidator = new FileUploadValidator();

// Enhanced file upload function with security
async function secureFileUpload(file, options = {}) {
    try {
        // Validate file
        const validation = await fileValidator.validateFile(file);
        
        if (!validation.isValid) {
            throw new Error(validation.error);
        }
        
        // Scan for malicious content
        const scanResult = await fileValidator.scanForMaliciousContent(file);
        
        if (scanResult.isMalicious) {
            throw new Error('File contains potentially malicious content');
        }
        
        // Use sanitized filename
        const sanitizedFile = new File([file], validation.sanitizedFilename, {
            type: file.type,
            lastModified: file.lastModified
        });
        
        // Log upload attempt for security monitoring
        console.log('Secure file upload:', {
            filename: validation.sanitizedFilename,
            size: file.size,
            type: file.type,
            timestamp: new Date().toISOString()
        });
        
        return {
            success: true,
            file: sanitizedFile,
            originalFile: file
        };
        
    } catch (error) {
        console.error('Secure file upload failed:', error);
        return {
            success: false,
            error: error.message,
            file: file
        };
    }
}

// Export functions and classes
window.FileUploadSecurity = {
    FileUploadValidator,
    secureFileUpload,
    fileValidator,
    UPLOAD_SECURITY_CONFIG
};
