/**
 * Database Optimization Functions
 * Advanced Firestore query optimizations for better performance
 */

// Cache for frequently accessed data
const queryCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Optimized query with caching
async function getOptimizedGalleryPhotos(status = "approved", page = 0, limit = 12) {
    const cacheKey = `gallery_${status}_${page}_${limit}`;
    const cached = queryCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Serving from cache:', cacheKey);
        return cached.data;
    }
    
    try {
        // Use composite indexes for better performance
        let query = db.collection("galleryPhotos")
            .where("status", "==", status)
            .orderBy("createdAt", "desc")
            .orderBy("isHighlighted", "desc"); // Secondary sort for better UX
        
        // Apply pagination with cursor
        if (page > 0) {
            const prevPageQuery = db.collection("galleryPhotos")
                .where("status", "==", status)
                .orderBy("createdAt", "desc")
                .orderBy("isHighlighted", "desc")
                .limit(page * limit);
            
            const prevPageSnapshot = await prevPageQuery.get();
            const lastDoc = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
            
            if (lastDoc) {
                query = query.startAfter(lastDoc);
            }
        }
        
        const snapshot = await query.limit(limit).get();
        const photos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const result = { success: true, photos };
        
        // Cache the result
        queryCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
        
        return result;
    } catch (error) {
        console.error("Error fetching optimized gallery photos:", error);
        return { success: false, error: "Could not load photos." };
    }
}

// Batch operations for better performance
async function batchUpdatePhotoStatus(updates) {
    const batch = db.batch();
    
    updates.forEach(({ photoId, newStatus, options }) => {
        const photoRef = db.collection("galleryPhotos").doc(photoId);
        const updateData = {
            status: newStatus,
            reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
            reviewedBy: auth.currentUser.uid
        };
        
        if (typeof options.isHighlighted === 'boolean') {
            updateData.isHighlighted = options.isHighlighted;
        }
        
        if (newStatus === "rejected" && options.rejectionReason) {
            updateData.rejectionReason = options.rejectionReason;
        }
        
        batch.update(photoRef, updateData);
    });
    
    try {
        await batch.commit();
        return { success: true };
    } catch (error) {
        console.error("Error in batch update:", error);
        return { success: false, error: "Could not update photos." };
    }
}

// Optimized stats query with aggregation
async function getOptimizedGalleryStats() {
    const cacheKey = 'gallery_stats';
    const cached = queryCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    
    try {
        // Use Promise.all for parallel queries
        const [approved, pending, rejected] = await Promise.all([
            db.collection("galleryPhotos").where("status", "==", "approved").get(),
            db.collection("galleryPhotos").where("status", "==", "pending").get(),
            db.collection("galleryPhotos").where("status", "==", "rejected").get()
        ]);
        
        const stats = {
            approved: approved.size,
            pending: pending.size,
            rejected: rejected.size,
            total: approved.size + pending.size + rejected.size
        };
        
        const result = { success: true, stats };
        
        // Cache the result
        queryCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
        
        return result;
    } catch (error) {
        console.error("Error fetching optimized gallery stats:", error);
        return { success: false, error: "Could not load statistics." };
    }
}

// Query with field selection for reduced data transfer
async function getPhotoMetadata(photoIds) {
    try {
        const photoRefs = photoIds.map(id => db.collection("galleryPhotos").doc(id));
        const snapshot = await db.getAll(...photoRefs);
        
        return snapshot.map(doc => ({
            id: doc.id,
            caption: doc.data().caption,
            category: doc.data().category,
            status: doc.data().status,
            createdAt: doc.data().createdAt,
            uploaderName: doc.data().uploaderName
        }));
    } catch (error) {
        console.error("Error fetching photo metadata:", error);
        return [];
    }
}

// Optimized search with indexing
async function searchPhotos(query, status = "approved", limit = 20) {
    try {
        // Use Firestore's built-in text search capabilities
        let firestoreQuery = db.collection("galleryPhotos")
            .where("status", "==", status);
        
        // Add search filters if query provided
        if (query) {
            // Search in caption and category
            firestoreQuery = firestoreQuery
                .where("searchableCaption", ">=", query.toLowerCase())
                .where("searchableCaption", "<=", query.toLowerCase() + '\uf8ff');
        }
        
        const snapshot = await firestoreQuery
            .orderBy("createdAt", "desc")
            .limit(limit)
            .get();
        
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error searching photos:", error);
        return [];
    }
}

// Cache management
function clearCache() {
    queryCache.clear();
    console.log('Query cache cleared');
}

function getCacheStats() {
    return {
        size: queryCache.size,
        keys: Array.from(queryCache.keys())
    };
}

// Export functions
window.getOptimizedGalleryPhotos = getOptimizedGalleryPhotos;
window.batchUpdatePhotoStatus = batchUpdatePhotoStatus;
window.getOptimizedGalleryStats = getOptimizedGalleryStats;
window.getPhotoMetadata = getPhotoMetadata;
window.searchPhotos = searchPhotos;
window.clearCache = clearCache;
window.getCacheStats = getCacheStats;
