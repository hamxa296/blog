/**
 * gallery-admin.js
 * Handles admin functionality for photo gallery management
 */

let currentPhotoStatus = 'approved';
let currentPhoto = null;
let isAdmin = false;

// Pagination variables
let currentPage = 0;
const PHOTOS_PER_PAGE = 12;
let hasMorePhotos = true;
let isLoading = false;

// Initialize admin functionality
async function initializeGalleryAdmin() {
    // Check if user is admin
    const user = auth.currentUser;
    if (!user) return;

    try {
        const adminCheck = await isUserAdmin();
        isAdmin = adminCheck;
        
        if (isAdmin) {
            showAdminInterface();
            loadAdminStats();
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
    }
}

// Show admin interface elements
function showAdminInterface() {
    document.getElementById('admin-photo-tabs').classList.remove('hidden');
    document.getElementById('admin-stats').classList.remove('hidden');
    
    // Add event listeners for admin tabs
    document.getElementById('tab-approved').addEventListener('click', () => switchPhotoTab('approved'));
    document.getElementById('tab-pending').addEventListener('click', () => switchPhotoTab('pending'));
    document.getElementById('tab-rejected').addEventListener('click', () => switchPhotoTab('rejected'));
    
    // Set default active tab
    document.getElementById('tab-approved').classList.add('bg-green-200');
}

// Switch between photo status tabs
async function switchPhotoTab(status) {
    currentPhotoStatus = status;
    
    // Update tab styling
    document.querySelectorAll('#admin-photo-tabs button').forEach(btn => {
        btn.classList.remove('bg-green-200', 'bg-yellow-200', 'bg-red-200');
    });
    
    const activeTab = document.getElementById(`tab-${status}`);
    if (status === 'approved') activeTab.classList.add('bg-green-200');
    else if (status === 'pending') activeTab.classList.add('bg-yellow-200');
    else if (status === 'rejected') activeTab.classList.add('bg-red-200');
    
    // Load photos for selected status
    await loadPhotosByStatus(status);
}

// Load photos by status with pagination
async function loadPhotosByStatus(status, page = 0, append = false) {
    if (isLoading) return;
    isLoading = true;
    
    try {
        const result = await getGalleryPhotosByStatus(status, page, PHOTOS_PER_PAGE);
        if (result.success) {
            if (append) {
                appendPhotoGrid(result.photos, status);
            } else {
                renderPhotoGrid(result.photos, status);
            }
            hasMorePhotos = result.photos.length === PHOTOS_PER_PAGE;
            currentPage = page;
        } else {
            console.error('Error loading photos:', result.error);
        }
    } catch (error) {
        console.error('Error loading photos:', error);
    } finally {
        isLoading = false;
    }
}

// Load more photos (for infinite scroll)
async function loadMorePhotos() {
    if (!hasMorePhotos || isLoading) return;
    
    const nextPage = currentPage + 1;
    await loadPhotosByStatus(currentPhotoStatus, nextPage, true);
}

// Render photo grid with admin controls
function renderPhotoGrid(photos, status) {
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = '';
    
    if (photos.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-500">
                <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <h3 class="text-xl font-semibold mb-2">No ${status} photos</h3>
                <p>There are no ${status} photos to display.</p>
            </div>
        `;
        return;
    }
    
    photos.forEach(photo => {
        const photoCard = createPhotoCard(photo, status);
        grid.appendChild(photoCard);
    });
    
    // Add load more button if there are more photos
    if (hasMorePhotos) {
        addLoadMoreButton();
    }
    
    // Initialize lazy loading
    initializeLazyLoading();
}

// Append photos to existing grid (for pagination)
function appendPhotoGrid(photos, status) {
    const grid = document.getElementById('gallery-grid');
    
    // Remove existing load more button
    const existingLoadMore = grid.querySelector('.load-more-container');
    if (existingLoadMore) {
        existingLoadMore.remove();
    }
    
    photos.forEach(photo => {
        const photoCard = createPhotoCard(photo, status);
        grid.appendChild(photoCard);
    });
    
    // Add load more button if there are more photos
    if (hasMorePhotos) {
        addLoadMoreButton();
    }
    
    // Initialize lazy loading for new images
    initializeLazyLoading();
}

// Add load more button
function addLoadMoreButton() {
    const grid = document.getElementById('gallery-grid');
    const loadMoreContainer = document.createElement('div');
    loadMoreContainer.className = 'load-more-container col-span-full text-center py-8';
    loadMoreContainer.innerHTML = `
        <button onclick="loadMorePhotos()" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Load More Photos
        </button>
    `;
    grid.appendChild(loadMoreContainer);
}

// Create photo card with admin controls
function createPhotoCard(photo, status) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300';
    
    const photoDate = photo.createdAt ? photo.createdAt.toDate().toLocaleDateString() : 'N/A';
    const statusBadge = getStatusBadge(status);
    
    // Generate optimized image URLs with different sizes
    const imageUrl = photo.imageUrl;
    const optimizedImageUrl = imageUrl.includes('cloudinary') ? 
        imageUrl.replace('/upload/', '/upload/c_fill,w_400,h_300,q_auto,f_auto/') : imageUrl;
    
    card.innerHTML = `
        <div class="relative">
            <img class="h-48 w-full object-cover cursor-pointer" 
                 loading="lazy"
                 src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3C/svg%3E"
                 data-src="${optimizedImageUrl}"
                 alt="${photo.caption}" 
                 onclick="openPhotoReview('${photo.id}')">
            ${statusBadge}
            <div class="absolute top-2 right-2 flex space-x-2">
                ${status === 'pending' ? `
                    <button onclick="approvePhoto('${photo.id}')" class="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </button>
                    <button onclick="rejectPhoto('${photo.id}')" class="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                ` : ''}
                <button onclick="deletePhoto('${photo.id}', '${photo.cloudinaryId}')" class="bg-gray-500 text-white p-2 rounded-full hover:bg-gray-600 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        </div>
        <div class="p-6">
            <div class="flex items-center justify-between mb-2">
                <p class="text-sm text-gray-500">${photoDate} • by ${photo.uploaderName}</p>
                <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">${photo.category}</span>
            </div>
            <h4 class="text-xl font-semibold mb-3">${photo.caption}</h4>
            ${photo.rejectionReason ? `<p class="text-sm text-red-600 mb-2"><strong>Rejection Reason:</strong> ${photo.rejectionReason}</p>` : ''}
            <button onclick="openPhotoReview('${photo.id}')" class="font-semibold text-blue-600 hover:underline">View Details &rarr;</button>
        </div>
    `;
    
    return card;
}

// Get status badge HTML
function getStatusBadge(status) {
    const badges = {
        approved: '<span class="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">Approved</span>',
        pending: '<span class="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">Pending</span>',
        rejected: '<span class="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">Rejected</span>'
    };
    return badges[status] || '';
}

// Load admin statistics
async function loadAdminStats() {
    const result = await getGalleryStats();
    if (result.success) {
        const stats = result.stats;
        document.getElementById('stats-approved').textContent = `Approved: ${stats.approved}`;
        document.getElementById('stats-pending').textContent = `Pending: ${stats.pending}`;
        document.getElementById('stats-rejected').textContent = `Rejected: ${stats.rejected}`;
    }
}

// Open photo review modal
async function openPhotoReview(photoId) {
    try {
        const doc = await db.collection("galleryPhotos").doc(photoId).get();
        if (!doc.exists) {
            alert('Photo not found');
            return;
        }
        
        currentPhoto = { id: photoId, ...doc.data() };
        
        const modal = document.getElementById('admin-review-modal');
        const content = document.getElementById('review-photo-content');
        
        content.innerHTML = `
            <div class="text-center">
                <img src="${currentPhoto.fullSizeUrl}" alt="${currentPhoto.caption}" class="max-w-full h-auto rounded-lg shadow-lg">
            </div>
            <div class="space-y-4">
                <div>
                    <h3 class="font-semibold text-lg">${currentPhoto.caption}</h3>
                    <p class="text-gray-600">${currentPhoto.category}</p>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <strong>Uploaded by:</strong> ${currentPhoto.uploaderName}
                    </div>
                    <div>
                        <strong>Date:</strong> ${currentPhoto.createdAt ? currentPhoto.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </div>
                    <div>
                        <strong>Status:</strong> <span class="capitalize">${currentPhoto.status}</span>
                    </div>
                    ${currentPhoto.rejectionReason ? `
                        <div class="col-span-2">
                            <strong>Rejection Reason:</strong> ${currentPhoto.rejectionReason}
                        </div>
                    ` : ''}
                </div>
                <div class="flex items-center space-x-4">
                    <label class="flex items-center">
                        <input type="checkbox" id="highlight-photo" ${currentPhoto.isHighlighted ? 'checked' : ''} class="mr-2">
                        <span>Highlight in slideshow</span>
                    </label>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
        
        // Add event listeners
        document.getElementById('approve-photo-btn').onclick = () => approvePhoto(currentPhoto.id);
        document.getElementById('reject-photo-btn').onclick = () => rejectPhoto(currentPhoto.id);
        document.getElementById('close-review-modal').onclick = () => modal.classList.add('hidden');
        
    } catch (error) {
        console.error('Error opening photo review:', error);
        alert('Error loading photo details');
    }
}

// Approve photo
async function approvePhoto(photoId) {
    if (!confirm('Are you sure you want to approve this photo?')) return;
    
    const isHighlighted = document.getElementById('highlight-photo')?.checked || false;
    
    const result = await updateGalleryPhotoStatus(photoId, 'approved', { isHighlighted });
    if (result.success) {
        alert('Photo approved successfully!');
        document.getElementById('admin-review-modal').classList.add('hidden');
        await switchPhotoTab(currentPhotoStatus);
        await loadAdminStats();
    } else {
        alert('Error approving photo: ' + result.error);
    }
}

// Reject photo
async function rejectPhoto(photoId) {
    const modal = document.getElementById('rejection-modal');
    modal.classList.remove('hidden');
    
    document.getElementById('confirm-rejection').onclick = async () => {
        const reason = document.getElementById('rejection-reason').value;
        
        const result = await updateGalleryPhotoStatus(photoId, 'rejected', { rejectionReason: reason });
        if (result.success) {
            alert('Photo rejected successfully!');
            modal.classList.add('hidden');
            document.getElementById('admin-review-modal').classList.add('hidden');
            document.getElementById('rejection-reason').value = '';
            await switchPhotoTab(currentPhotoStatus);
            await loadAdminStats();
        } else {
            alert('Error rejecting photo: ' + result.error);
        }
    };
    
    document.getElementById('cancel-rejection').onclick = () => {
        modal.classList.add('hidden');
        document.getElementById('rejection-reason').value = '';
    };
}

// Delete photo
async function deletePhoto(photoId, cloudinaryId) {
    const modal = document.getElementById('delete-photo-modal');
    modal.classList.remove('hidden');
    
    document.getElementById('confirm-delete').onclick = async () => {
        const result = await deleteGalleryPhoto(photoId, cloudinaryId);
        if (result.success) {
            alert('Photo deleted successfully!');
            modal.classList.add('hidden');
            await switchPhotoTab(currentPhotoStatus);
            await loadAdminStats();
        } else {
            alert('Error deleting photo: ' + result.error);
        }
    };
    
    document.getElementById('cancel-delete').onclick = () => {
        modal.classList.add('hidden');
    };
}

// Initialize lazy loading
function initializeLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth to be ready
    auth.onAuthStateChanged((user) => {
        if (user) {
            initializeGalleryAdmin();
        }
    });
    
    // Initialize lazy loading for any existing images
    initializeLazyLoading();
});
