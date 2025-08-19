/**
 * Performance Optimizer
 * Comprehensive performance improvements for GIKI Chronicles
 */

class PerformanceOptimizer {
    constructor() {
        this.initialized = false;
        this.criticalCSS = '';
        this.deferredScripts = [];
        this.init();
    }

    async init() {
        if (this.initialized) return;
        
        // Apply critical optimizations immediately
        this.optimizeCriticalPath();
        this.setupResourceHints();
        this.optimizeImages();
        this.setupIntersectionObserver();
        
        // Defer non-critical operations
        this.deferNonCriticalOperations();
        
        this.initialized = true;
    }

    optimizeCriticalPath() {
        // Inline critical CSS
        this.inlineCriticalCSS();
        
        // Preload critical resources
        this.preloadCriticalResources();
        
        // Optimize font loading
        this.optimizeFontLoading();
    }

    inlineCriticalCSS() {
        // Critical CSS for above-the-fold content
        const criticalCSS = `
            body { font-family: 'Inter', sans-serif; }
            .hero-section { min-height: 100vh; }
            .loading { opacity: 0; transition: opacity 0.3s; }
            .loaded { opacity: 1; }
        `;
        
        const style = document.createElement('style');
        style.textContent = criticalCSS;
        document.head.insertBefore(style, document.head.firstChild);
        
        // Add loading class to body
        document.body.classList.add('loading');
        
        // Remove loading class when content is ready
        window.addEventListener('load', () => {
            document.body.classList.remove('loading');
            document.body.classList.add('loaded');
        });
    }

    preloadCriticalResources() {
        // Preload critical images
        const criticalImages = [
            '/logo.png',
            '/background.jpeg'
        ];
        
        criticalImages.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
        });
        
        // Preload critical fonts
        const fontLink = document.createElement('link');
        fontLink.rel = 'preload';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
        fontLink.as = 'style';
        document.head.appendChild(fontLink);
    }

    optimizeFontLoading() {
        // Optimize Google Fonts loading
        const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
        fontLinks.forEach(link => {
            link.setAttribute('media', 'print');
            link.setAttribute('onload', "this.media='all'");
        });
        
        // Add font-display: swap for better performance
        const fontStyle = document.createElement('style');
        fontStyle.textContent = `
            @font-face {
                font-family: 'Inter';
                font-display: swap;
            }
        `;
        document.head.appendChild(fontStyle);
    }

    setupResourceHints() {
        // DNS prefetch for external domains
        const domains = [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://cdn.tailwindcss.com'
        ];
        
        domains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = domain;
            document.head.appendChild(link);
        });
        
        // Preconnect to critical domains
        const criticalDomains = [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com'
        ];
        
        criticalDomains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = domain;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }

    optimizeImages() {
        // Convert all images to lazy loading
        const images = document.querySelectorAll('img:not([loading="lazy"])');
        images.forEach(img => {
            if (!img.classList.contains('critical-image')) {
                img.loading = 'lazy';
                img.decoding = 'async';
            }
        });
        
        // Add responsive images for large images
        this.addResponsiveImages();
    }

    addResponsiveImages() {
        const largeImages = document.querySelectorAll('img[src*=".jpeg"], img[src*=".jpg"], img[src*=".png"]');
        largeImages.forEach(img => {
            if (img.naturalWidth > 800) {
                this.createResponsiveImage(img);
            }
        });
    }

    createResponsiveImage(img) {
        const src = img.src;
        const alt = img.alt || '';
        
        // Create picture element for responsive images
        const picture = document.createElement('picture');
        
        // WebP version (if supported)
        if (this.supportsWebP()) {
            const webpSource = document.createElement('source');
            webpSource.srcset = this.generateWebPUrl(src);
            webpSource.type = 'image/webp';
            picture.appendChild(webpSource);
        }
        
        // Original format as fallback
        const fallbackImg = img.cloneNode(true);
        fallbackImg.loading = 'lazy';
        picture.appendChild(fallbackImg);
        
        // Replace original image
        img.parentNode.replaceChild(picture, img);
    }

    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    generateWebPUrl(originalUrl) {
        // Simple WebP conversion (you can enhance this with Cloudinary or similar)
        return originalUrl.replace(/\.(jpeg|jpg|png)$/, '.webp');
    }

    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) return;
        
        // Lazy load images and other content
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    
                    if (target.tagName === 'IMG') {
                        this.loadImage(target);
                    } else if (target.classList.contains('lazy-content')) {
                        this.loadLazyContent(target);
                    }
                    
                    observer.unobserve(target);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.1
        });
        
        // Observe lazy elements
        const lazyElements = document.querySelectorAll('img[loading="lazy"], .lazy-content');
        lazyElements.forEach(el => observer.observe(el));
    }

    loadImage(img) {
        if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        }
    }

    loadLazyContent(element) {
        if (element.dataset.content) {
            element.innerHTML = element.dataset.content;
            element.removeAttribute('data-content');
        }
    }

    deferNonCriticalOperations() {
        // Defer non-critical JavaScript
        this.deferScripts();
        
        // Defer non-critical CSS
        this.deferNonCriticalCSS();
        
        // Defer analytics and tracking
        this.deferAnalytics();
    }

    deferScripts() {
        const nonCriticalScripts = [
            'performance-monitor.js',
            'image-optimizer.js',
            'tour-manager.js'
        ];
        
        nonCriticalScripts.forEach(script => {
            const scriptElement = document.createElement('script');
            scriptElement.src = script;
            scriptElement.defer = true;
            document.body.appendChild(scriptElement);
        });
    }

    deferNonCriticalCSS() {
        // Defer non-critical CSS files
        const nonCriticalCSS = [
            'calendar_styles.css'
        ];
        
        nonCriticalCSS.forEach(css => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = css;
            link.media = 'print';
            link.setAttribute('onload', "this.media='all'");
            document.head.appendChild(link);
        });
    }

    deferAnalytics() {
        // Defer analytics loading
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.loadAnalytics();
            }, 2000);
        });
    }

    loadAnalytics() {
        // Load analytics scripts here
        console.log('Loading analytics...');
    }

    // Performance monitoring
    measurePerformance() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.entryType === 'navigation') {
                        this.logPerformanceMetrics(entry);
                    }
                });
            });
            observer.observe({ entryTypes: ['navigation'] });
        }
    }

    logPerformanceMetrics(navigationEntry) {
        const metrics = {
            dnsLookup: navigationEntry.domainLookupEnd - navigationEntry.domainLookupStart,
            tcpConnection: navigationEntry.connectEnd - navigationEntry.connectStart,
            serverResponse: navigationEntry.responseEnd - navigationEntry.requestStart,
            domContentLoaded: navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart,
            loadComplete: navigationEntry.loadEventEnd - navigationEntry.loadEventStart
        };
        
        console.log('Performance Metrics:', metrics);
        
        // Send to analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', 'performance_metrics', metrics);
        }
    }
}

// Initialize performance optimizer
const performanceOptimizer = new PerformanceOptimizer();

// Export for use in other scripts
window.performanceOptimizer = performanceOptimizer;
