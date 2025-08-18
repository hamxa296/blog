/**
 * Request Optimization
 * Debouncing, throttling, and request batching for better performance
 */

class RequestOptimizer {
    constructor() {
        this.debounceTimers = new Map();
        this.throttleTimers = new Map();
        this.requestQueue = [];
        this.batchSize = 10;
        this.batchTimeout = 100; // ms
        this.isProcessingBatch = false;
    }
    
    // Debounce function calls
    debounce(key, func, delay = 300) {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }
        
        const timer = setTimeout(() => {
            func();
            this.debounceTimers.delete(key);
        }, delay);
        
        this.debounceTimers.set(key, timer);
    }
    
    // Throttle function calls
    throttle(key, func, limit = 100) {
        if (this.throttleTimers.has(key)) {
            return; // Skip if throttled
        }
        
        func();
        
        this.throttleTimers.set(key, true);
        setTimeout(() => {
            this.throttleTimers.delete(key);
        }, limit);
    }
    
    // Batch multiple requests
    batchRequest(requestFunc, data) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                func: requestFunc,
                data: data,
                resolve: resolve,
                reject: reject
            });
            
            if (this.requestQueue.length >= this.batchSize) {
                this.processBatch();
            } else if (!this.isProcessingBatch) {
                setTimeout(() => {
                    this.processBatch();
                }, this.batchTimeout);
            }
        });
    }
    
    // Process batched requests
    async processBatch() {
        if (this.isProcessingBatch || this.requestQueue.length === 0) {
            return;
        }
        
        this.isProcessingBatch = true;
        const batch = this.requestQueue.splice(0, this.batchSize);
        
        try {
            // Group similar requests
            const groupedRequests = this.groupRequests(batch);
            
            // Process each group
            for (const [type, requests] of Object.entries(groupedRequests)) {
                await this.processRequestGroup(type, requests);
            }
        } catch (error) {
            console.error('Error processing batch:', error);
            // Reject all requests in batch
            batch.forEach(({ reject }) => reject(error));
        } finally {
            this.isProcessingBatch = false;
            
            // Process remaining requests
            if (this.requestQueue.length > 0) {
                setTimeout(() => {
                    this.processBatch();
                }, this.batchTimeout);
            }
        }
    }
    
    // Group similar requests
    groupRequests(batch) {
        const groups = {};
        
        batch.forEach(({ func, data }) => {
            const key = func.name || func.toString();
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push({ func, data });
        });
        
        return groups;
    }
    
    // Process a group of similar requests
    async processRequestGroup(type, requests) {
        if (type.includes('getGalleryPhotos')) {
            // Batch gallery photo requests
            const uniqueParams = this.getUniqueParams(requests);
            const results = await Promise.all(
                uniqueParams.map(params => requests[0].func(...params))
            );
            
            // Distribute results to appropriate requests
            requests.forEach(({ resolve }, index) => {
                resolve(results[index] || results[0]);
            });
        } else {
            // Process individually
            const results = await Promise.all(
                requests.map(({ func, data }) => func(data))
            );
            
            requests.forEach(({ resolve }, index) => {
                resolve(results[index]);
            });
        }
    }
    
    // Get unique parameters from requests
    getUniqueParams(requests) {
        const params = new Set();
        requests.forEach(({ data }) => {
            params.add(JSON.stringify(data));
        });
        return Array.from(params).map(param => JSON.parse(param));
    }
    
    // Optimized search with debouncing
    createDebouncedSearch(searchFunc, delay = 500) {
        return (query) => {
            return new Promise((resolve) => {
                this.debounce(`search_${query}`, async () => {
                    const result = await searchFunc(query);
                    resolve(result);
                }, delay);
            });
        };
    }
    
    // Optimized scroll handler with throttling
    createThrottledScrollHandler(handler, limit = 100) {
        return (event) => {
            this.throttle('scroll_handler', () => {
                handler(event);
            }, limit);
        };
    }
    
    // Optimized resize handler with debouncing
    createDebouncedResizeHandler(handler, delay = 250) {
        return (event) => {
            this.debounce('resize_handler', () => {
                handler(event);
            }, delay);
        };
    }
    
    // Cancel pending requests
    cancelRequest(key) {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
            this.debounceTimers.delete(key);
        }
        
        if (this.throttleTimers.has(key)) {
            this.throttleTimers.delete(key);
        }
    }
    
    // Clear all pending requests
    clearAll() {
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        this.throttleTimers.clear();
        this.requestQueue = [];
    }
    
    // Get optimization stats
    getStats() {
        return {
            debounceTimers: this.debounceTimers.size,
            throttleTimers: this.throttleTimers.size,
            queuedRequests: this.requestQueue.length,
            isProcessingBatch: this.isProcessingBatch
        };
    }
}

// Initialize request optimizer
const requestOptimizer = new RequestOptimizer();

// Export for use in other scripts
window.requestOptimizer = requestOptimizer;

// Example usage:
// const debouncedSearch = requestOptimizer.createDebouncedSearch(searchPhotos);
// const throttledScroll = requestOptimizer.createThrottledScrollHandler(handleScroll);
// const debouncedResize = requestOptimizer.createDebouncedResizeHandler(handleResize);
