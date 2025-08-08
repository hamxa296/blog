/**
 * Performance Monitor
 * Tracks loading times and user experience metrics
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoadTime: 0,
            domContentLoaded: 0,
            firstContentfulPaint: 0,
            imagesLoaded: 0,
            totalImages: 0,
            lazyLoadSavings: 0
        };
        
        this.init();
    }
    
    init() {
        // Track page load time
        window.addEventListener('load', () => {
            this.metrics.pageLoadTime = performance.now();
            this.logMetrics();
        });
        
        // Track DOM content loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.metrics.domContentLoaded = performance.now();
        });
        
        // Track First Contentful Paint
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name === 'first-contentful-paint') {
                        this.metrics.firstContentfulPaint = entry.startTime;
                    }
                }
            });
            observer.observe({ entryTypes: ['paint'] });
        }
        
        // Track image loading
        this.trackImageLoading();
        
        // Track lazy loading savings
        this.trackLazyLoading();
    }
    
    trackImageLoading() {
        const images = document.querySelectorAll('img');
        this.metrics.totalImages = images.length;
        
        let loadedImages = 0;
        images.forEach(img => {
            if (img.complete) {
                loadedImages++;
            } else {
                img.addEventListener('load', () => {
                    loadedImages++;
                    this.metrics.imagesLoaded = loadedImages;
                });
            }
        });
    }
    
    trackLazyLoading() {
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        this.metrics.lazyLoadSavings = lazyImages.length;
        
        // Calculate potential bandwidth savings
        const estimatedSavings = lazyImages.length * 100; // Assume 100KB per image
        console.log(`Lazy loading enabled for ${lazyImages.length} images. Estimated bandwidth savings: ${estimatedSavings}KB`);
    }
    
    logMetrics() {
        console.log('📊 Performance Metrics:');
        console.log(`Page Load Time: ${this.metrics.pageLoadTime.toFixed(2)}ms`);
        console.log(`DOM Content Loaded: ${this.metrics.domContentLoaded.toFixed(2)}ms`);
        console.log(`First Contentful Paint: ${this.metrics.firstContentfulPaint.toFixed(2)}ms`);
        console.log(`Images Loaded: ${this.metrics.imagesLoaded}/${this.metrics.totalImages}`);
        console.log(`Lazy Loading Savings: ${this.metrics.lazyLoadSavings} images`);
        
        // Send metrics to analytics (if available)
        this.sendMetrics();
    }
    
    sendMetrics() {
        // You can send these metrics to your analytics service
        // Example: Google Analytics, Firebase Analytics, etc.
        if (typeof gtag !== 'undefined') {
            gtag('event', 'performance_metrics', {
                page_load_time: this.metrics.pageLoadTime,
                dom_content_loaded: this.metrics.domContentLoaded,
                first_contentful_paint: this.metrics.firstContentfulPaint,
                images_loaded: this.metrics.imagesLoaded,
                total_images: this.metrics.totalImages,
                lazy_load_savings: this.metrics.lazyLoadSavings
            });
        }
    }
    
    // Get current metrics
    getMetrics() {
        return this.metrics;
    }
}

// Initialize performance monitor
const performanceMonitor = new PerformanceMonitor();

// Export for use in other scripts
window.performanceMonitor = performanceMonitor;
