/**
 * Toast Notification System
 * Modern replacement for alert() calls with better UX
 */

class ToastNotification {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createContainer());
        } else {
            this.createContainer();
        }
    }

    createContainer() {
        if (this.initialized || !document.body) return;
        
        // Create toast container if it doesn't exist
        if (!document.querySelector('.toast-container')) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector('.toast-container');
        }
        this.initialized = true;
    }

    show(message, type = 'info', title = null, duration = 5000) {
        // Ensure container is initialized
        if (!this.initialized) {
            this.init();
        }
        
        // Wait for container to be ready
        if (!this.container) {
            setTimeout(() => this.show(message, type, title, duration), 100);
            return;
        }
        
        const toast = this.createToast(message, type, title);
        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.remove(toast);
            }, duration);
        }

        return toast;
    }

    createToast(message, type, title) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getIcon(type);
        const closeButton = this.createCloseButton();
        
        toast.innerHTML = `
            <div class="toast-icon">
                ${icon}
            </div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        toast.appendChild(closeButton);
        
        // Add click handler for close button
        closeButton.addEventListener('click', () => {
            this.remove(toast);
        });

        return toast;
    }

    getIcon(type) {
        const icons = {
            success: `<svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-green-500">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>`,
            error: `<svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-red-500">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>`,
            warning: `<svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-yellow-500">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>`,
            info: `<svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-blue-500">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>`
        };
        
        return icons[type] || icons.info;
    }

    createCloseButton() {
        const button = document.createElement('button');
        button.className = 'toast-close';
        button.innerHTML = `
            <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
        `;
        return button;
    }

    remove(toast) {
        if (toast && toast.parentNode) {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                const index = this.toasts.indexOf(toast);
                if (index > -1) {
                    this.toasts.splice(index, 1);
                }
            }, 300);
        }
    }

    clear() {
        this.toasts.forEach(toast => this.remove(toast));
    }

    // Convenience methods
    success(message, title = 'Success') {
        return this.show(message, 'success', title);
    }

    error(message, title = 'Error') {
        return this.show(message, 'error', title, 8000); // Longer duration for errors
    }

    warning(message, title = 'Warning') {
        return this.show(message, 'warning', title);
    }

    info(message, title = 'Info') {
        return this.show(message, 'info', title);
    }
}

// Create global instance
window.toast = new ToastNotification();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.toast.init();
    });
} else {
    window.toast.init();
}

// Replace alert function globally
window.originalAlert = window.alert;
window.alert = function(message) {
    if (window.toast) {
        window.toast.error(message, 'Alert');
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToastNotification;
}
