/**
 * Advanced Image Optimization
 * Progressive loading, WebP support, and responsive images
 */

class ImageOptimizer {
    constructor() {
        this.supportedFormats = this.checkWebPSupport();
        this.breakpoints = {
            mobile: 480,
            tablet: 768,
            desktop: 1024,
            large: 1440
        };
    }
    
    // Check WebP support
    checkWebPSupport() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    
    // Generate responsive image URLs
    generateResponsiveUrls(originalUrl, alt = '') {
        if (!originalUrl.includes('cloudinary')) {
            return this.generateFallbackResponsiveUrls(originalUrl, alt);
        }
        
        const urls = {};
        
        // Generate different sizes for different devices
        Object.entries(this.breakpoints).forEach(([device, width]) => {
            const format = this.supportedFormats ? 'f_auto,q_auto' : 'q_auto';
            // Fix: Use c_scale to preserve aspect ratio instead of c_fill
            urls[device] = originalUrl.replace('/upload/', `/upload/c_scale,w_${width},${format}/`);
        });
        
        return urls;
    }
    
    // Generate fallback URLs for non-Cloudinary images
    generateFallbackResponsiveUrls(originalUrl, alt = '') {
        return {
            mobile: originalUrl,
            tablet: originalUrl,
            desktop: originalUrl,
            large: originalUrl
        };
    }
    
    // Create optimized image element
    createOptimizedImage(originalUrl, alt = '', className = '') {
        const responsiveUrls = this.generateResponsiveUrls(originalUrl, alt);
        
        const img = document.createElement('img');
        img.alt = alt;
        img.className = className;
        img.loading = 'lazy';
        
        // Set srcset for responsive images
        const srcset = Object.entries(responsiveUrls)
            .map(([device, url]) => `${url} ${this.breakpoints[device]}w`)
            .join(', ');
        
        img.srcset = srcset;
        img.sizes = '(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw';
        
        // Set fallback src
        img.src = responsiveUrls.mobile;
        
        // Add error handling
        img.onerror = () => {
            img.src = originalUrl; // Fallback to original
        };
        
        return img;
    }
    
    // Progressive image loading with blur effect
    createProgressiveImage(originalUrl, alt = '', className = '') {
        const container = document.createElement('div');
        container.className = `progressive-image-container ${className}`;
        container.style.position = 'relative';
        container.style.overflow = 'hidden';
        
        // Create low-quality placeholder
        const placeholder = document.createElement('img');
        placeholder.src = this.generateLowQualityUrl(originalUrl);
        placeholder.className = 'progressive-placeholder';
        placeholder.style.filter = 'blur(10px)';
        placeholder.style.transition = 'opacity 0.3s ease-out';
        
        // Create high-quality image
        const highQuality = this.createOptimizedImage(originalUrl, alt);
        highQuality.className = 'progressive-high-quality';
        highQuality.style.position = 'absolute';
        highQuality.style.top = '0';
        highQuality.style.left = '0';
        highQuality.style.opacity = '0';
        highQuality.style.transition = 'opacity 0.3s ease-in';
        
        // Load high-quality image
        highQuality.onload = () => {
            highQuality.style.opacity = '1';
            placeholder.style.opacity = '0';
        };
        
        container.appendChild(placeholder);
        container.appendChild(highQuality);
        
        return container;
    }
    
    // Generate low-quality placeholder URL
    generateLowQualityUrl(originalUrl) {
        if (originalUrl.includes('cloudinary')) {
            return originalUrl.replace('/upload/', '/upload/c_scale,w_20,q_10,f_auto/');
        }
        return originalUrl;
    }
    
    // Optimize existing images on page
    optimizePageImages() {
        const images = document.querySelectorAll('img:not([data-optimized])');
        
        images.forEach(img => {
            if (img.src && !img.dataset.optimized) {
                // Skip gallery images that are already optimized by gallery-admin.js
                if (img.closest('#gallery-grid') || img.closest('.gallery-admin')) {
                    img.dataset.optimized = 'true';
                    return;
                }
                this.optimizeImage(img);
            }
        });
    }
    
    // Optimize a single image
    optimizeImage(img) {
        const originalSrc = img.src;
        const alt = img.alt || '';
        const className = img.className;
        
        // Create optimized version
        const optimizedImg = this.createOptimizedImage(originalSrc, alt, className);
        
        // Replace original image
        img.parentNode.replaceChild(optimizedImg, img);
        optimizedImg.dataset.optimized = 'true';
    }
    
    // Lazy load with intersection observer
    setupLazyLoading() {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    
                    // Load the actual image
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    
                    // Load srcset if available
                    if (img.dataset.srcset) {
                        img.srcset = img.dataset.srcset;
                        img.removeAttribute('data-srcset');
                    }
                    
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        
        // Observe all lazy images
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // Preload critical images
    preloadCriticalImages(urls) {
        urls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = url;
            document.head.appendChild(link);
        });
    }
    
    // Generate WebP URLs if supported
    generateWebPUrl(originalUrl) {
        if (!this.supportedFormats || !originalUrl.includes('cloudinary')) {
            return originalUrl;
        }
        
        return originalUrl.replace('/upload/', '/upload/f_webp,q_auto/');
    }
    
    // Get image dimensions for layout optimization
    async getImageDimensions(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    aspectRatio: img.naturalWidth / img.naturalHeight
                });
            };
            img.onerror = () => {
                resolve({ width: 0, height: 0, aspectRatio: 1 });
            };
            img.src = url;
        });
    }
}

// Initialize image optimizer
const imageOptimizer = new ImageOptimizer();

// Export for use in other scripts
window.imageOptimizer = imageOptimizer;

// Auto-optimize images when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    imageOptimizer.optimizePageImages();
    imageOptimizer.setupLazyLoading();
});

// Optimize images added dynamically
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
                const images = node.querySelectorAll ? node.querySelectorAll('img') : [];
                images.forEach(img => imageOptimizer.optimizeImage(img));
            }
        });
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
