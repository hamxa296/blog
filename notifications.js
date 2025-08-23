/**
 * notifications.js
 * Unified, premium toast notifications and confirm dialogs for the site.
 * - Injects its own minimal CSS and containers
 * - Exposes window.showToast(message, type?, options?)
 * - Exposes window.showConfirmModal(message, options?) => Promise<boolean>
 * - Soft-overrides window.alert to display an info toast
 */

(function () {
    if (window.__gcNotificationsLoaded) return; // prevent double load
    window.__gcNotificationsLoaded = true;

    // ---------- CSS ----------
    const style = document.createElement('style');
    style.setAttribute('data-gc-notifications', '');
    style.textContent = `
    :root {
        --gc-toast-bg: rgba(17,23,38,0.92);
        --gc-toast-color: #ffffff;
        --gc-toast-success: #00d18f;
        --gc-toast-error: #ff4d4f;
        --gc-toast-warning: #ffb020;
        --gc-toast-info: #4ea7ff;
        --gc-shadow: 0 16px 40px rgba(0,0,0,0.45);
    }
    .gc-toast-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        pointer-events: none;
    }
    .gc-pos-top-left { top: 1rem; left: 1rem; right: auto; }
    .gc-pos-top-center { top: 1rem; left: 50%; transform: translateX(-50%); }
    .gc-pos-bottom-right { bottom: 1rem; top: auto; right: 1rem; }
    .gc-pos-bottom-left { bottom: 1rem; top: auto; left: 1rem; right: auto; }
    .gc-pos-bottom-center { bottom: 1rem; top: auto; left: 50%; transform: translateX(-50%); }
    @media (max-width: 640px) {
        .gc-toast-container { right: 0.75rem; left: 0.75rem; }
    }
    .gc-toast {
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1rem;
        border-radius: 0.75rem;
        background: linear-gradient(135deg, rgba(20,25,41,0.96), rgba(15,18,30,0.92));
        color: var(--gc-toast-color);
        box-shadow: var(--gc-shadow);
        transform: translateY(-8px);
        opacity: 0;
        transition: transform 200ms ease, opacity 200ms ease;
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        border: 1px solid rgba(255,255,255,0.12);
    }
    .gc-toast.gc-show { transform: translateY(0); opacity: 1; }
    .gc-toast .gc-icon { width: 20px; height: 20px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.25)); }
    .gc-toast .gc-content-wrap { display:flex; flex-direction: column; gap: 2px; }
    .gc-toast .gc-title { font-weight: 700; letter-spacing: .2px; }
    .gc-toast .gc-message { opacity: .95; }
    .gc-toast.gc-success { border-left: 4px solid var(--gc-toast-success); box-shadow: 0 8px 30px rgba(0,209,143,0.25); }
    .gc-toast.gc-error   { border-left: 4px solid var(--gc-toast-error);   box-shadow: 0 8px 30px rgba(255,77,79,0.25); }
    .gc-toast.gc-warning { border-left: 4px solid var(--gc-toast-warning); box-shadow: 0 8px 30px rgba(255,176,32,0.25); }
    .gc-toast.gc-info    { border-left: 4px solid var(--gc-toast-info);    box-shadow: 0 8px 30px rgba(78,167,255,0.25); }
    /* Close button removed; swipe up to dismiss */
    .gc-progress { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: transparent; overflow: hidden; border-radius: 0 0 .75rem .75rem; }
    .gc-progress > span { display:block; height:100%; width:100%; transform-origin: left; }
    .gc-success .gc-progress > span{ background: linear-gradient(90deg, #34d399, #10b981); }
    .gc-error .gc-progress > span{ background: linear-gradient(90deg, #f87171, #ef4444); }
    .gc-warning .gc-progress > span{ background: linear-gradient(90deg, #fbbf24, #f59e0b); }
    .gc-info .gc-progress > span{ background: linear-gradient(90deg, #60a5fa, #3b82f6); }

    /* Confirm Modal */
    .gc-confirm-overlay {
        position: fixed; inset: 0; z-index: 9998; background: rgba(0,0,0,0.5);
        display: flex; align-items: center; justify-content: center; padding: 1rem;
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
    }
    .gc-confirm-modal {
        width: 100%; max-width: 420px;
        background: var(--gc-toast-bg);
        color: var(--gc-toast-color);
        border-radius: 0.75rem;
        box-shadow: var(--gc-shadow);
        border: 1px solid rgba(255,255,255,0.08);
        transform: translateY(8px);
        opacity: 0;
        transition: transform 180ms ease, opacity 180ms ease;
    }
    .gc-confirm-modal.gc-show { transform: translateY(0); opacity: 1; }
    .gc-confirm-body { padding: 1rem 1rem 0.5rem; display: flex; gap: 0.75rem; }
    .gc-confirm-actions { display: flex; gap: 0.5rem; justify-content: flex-end; padding: 0 1rem 1rem; }
    .gc-btn { border: 0; border-radius: 0.55rem; padding: 0.625rem 0.95rem; font-weight: 700; cursor: pointer; transition: transform .12s ease, filter .12s ease; }
    .gc-btn:active { transform: translateY(1px); }
    .gc-btn-secondary { background: rgba(255,255,255,0.10); color: #e5e7eb; border: 1px solid rgba(255,255,255,0.12); }
    .gc-btn-secondary:hover { background: rgba(255,255,255,0.16); }
    .gc-btn-primary { background: linear-gradient(135deg, #66b8ff, #3b82f6); color: white; box-shadow: 0 6px 18px rgba(59,130,246,0.35); }
    .gc-btn-primary:hover { filter: brightness(1.05); }
    .gc-btn-danger { background: linear-gradient(135deg, #ff6b6e, #ef4444); color: white; box-shadow: 0 6px 18px rgba(239,68,68,0.35); }
    .gc-btn-danger:hover { filter: brightness(1.05); }
    .gc-title { font-weight: 700; margin: 0; font-size: 1rem; }
    .gc-message { margin: 0.25rem 0 0; color: #d1d5db; font-size: 0.95rem; }
    `;
    document.head.appendChild(style);

    // ---------- Containers ----------
    function getContainer(position = 'top-right') {
        const id = `gc-toast-container-${position}`;
        let node = document.getElementById(id);
        if (!node) {
            node = document.createElement('div');
            node.id = id;
            node.className = 'gc-toast-container';
            // add position class
            const posClassMap = {
                'top-left': 'gc-pos-top-left',
                'top-center': 'gc-pos-top-center',
                'top-right': '',
                'bottom-left': 'gc-pos-bottom-left',
                'bottom-center': 'gc-pos-bottom-center',
                'bottom-right': 'gc-pos-bottom-right',
            };
            const cls = posClassMap[position] || '';
            if (cls) node.classList.add(cls);
            document.body.appendChild(node);
        }
        return node;
    }

    // ---------- Helpers ----------
    function iconFor(type) {
        const map = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return map[type] || map.info;
    }

    // ---------- Toast API ----------
    function showToast(message, type = 'info', options = {}) {
        try {
            const { duration = 4200, title = '', position = 'top-right', actionText = '', onAction } = options;
            const container = getContainer(position);
            const toast = document.createElement('div');
            toast.className = `gc-toast gc-${type}`;
            toast.style.position = 'relative';
            // Create toast content safely without innerHTML
            const iconSpan = document.createElement('span');
            iconSpan.className = 'gc-icon';
            iconSpan.setAttribute('aria-hidden', 'true');
            iconSpan.textContent = iconFor(type);
            
            const contentWrap = document.createElement('div');
            contentWrap.className = 'gc-content-wrap';
            contentWrap.setAttribute('role', 'status');
            
            if (title) {
                const titleDiv = document.createElement('div');
                titleDiv.className = 'gc-title';
                titleDiv.textContent = title;
                contentWrap.appendChild(titleDiv);
            }
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'gc-message';
            messageDiv.textContent = message;
            contentWrap.appendChild(messageDiv);
            
            if (actionText) {
                const actionButton = document.createElement('button');
                actionButton.className = 'gc-btn-action gc-btn gc-btn-secondary';
                actionButton.textContent = actionText;
                toast.appendChild(actionButton);
            }
            
            const progressDiv = document.createElement('div');
            progressDiv.className = 'gc-progress';
            const progressSpan = document.createElement('span');
            progressDiv.appendChild(progressSpan);
            
            toast.appendChild(iconSpan);
            toast.appendChild(contentWrap);
            toast.appendChild(progressDiv);
            const close = () => {
                toast.classList.remove('gc-show');
                setTimeout(() => toast.remove(), 200);
            };
            const act = toast.querySelector('.gc-btn-action');
            if (act && typeof onAction === 'function') {
                act.addEventListener('click', () => { try { onAction(); } catch(_){} close(); });
            }
            container.appendChild(toast);
            requestAnimationFrame(() => toast.classList.add('gc-show'));
            // swipe to dismiss (mouse/touch)
            let startY = null; let currentY = 0; let isDown = false; let swipeDismissed = false;
            const getY = (e) => (e.touches ? e.touches[0].clientY : e.clientY);
            const onStart = (e) => { isDown = true; startY = getY(e); currentY = 0; toast.style.willChange = 'transform, opacity'; toast.style.transition = 'none'; };
            const onMove = (e) => {
                if (!isDown) return;
                currentY = getY(e) - startY;
                if (currentY < 0) {
                    const translate = Math.max(currentY, -120);
                    toast.style.transform = `translateY(${translate}px)`;
                    toast.style.opacity = String(1 + translate / 120);
                }
            };
            const onEnd = () => {
                if (!isDown) return;
                isDown = false;
                toast.style.transition = 'transform 200ms ease, opacity 200ms ease';
                if (currentY < -40) { swipeDismissed = true; close(); }
                else { toast.style.transform = 'translateY(0)'; toast.style.opacity = '1'; }
                startY = null; currentY = 0;
            };
            toast.addEventListener('touchstart', onStart, { passive: true });
            toast.addEventListener('touchmove', onMove, { passive: true });
            toast.addEventListener('touchend', onEnd);
            toast.addEventListener('mousedown', onStart);
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onEnd);
            // animate progress
            if (duration !== 0) {
                const bar = toast.querySelector('.gc-progress > span');
                if (bar) {
                    bar.style.transition = `transform ${duration}ms linear`;
                    requestAnimationFrame(() => { bar.style.transform = 'scaleX(0)'; });
                }
                setTimeout(() => { if (!swipeDismissed) close(); }, duration);
            }
            return toast;
        } catch (e) {
            // As a last resort
            console.warn('Toast failed, falling back to console:', e);
            // console.log(`[${type}]`, message);
        }
    }

    // ---------- Confirm Modal API ----------
    function showConfirmModal(message, options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Please confirm',
                confirmText = 'Confirm',
                cancelText = 'Cancel',
                variant = 'primary' // or 'danger'
            } = options;

            const overlay = document.createElement('div');
            overlay.className = 'gc-confirm-overlay';
            // Create confirm modal content safely without innerHTML
            const modalDiv = document.createElement('div');
            modalDiv.className = 'gc-confirm-modal';
            
            const bodyDiv = document.createElement('div');
            bodyDiv.className = 'gc-confirm-body';
            
            const contentDiv = document.createElement('div');
            
            const titleH3 = document.createElement('h3');
            titleH3.className = 'gc-title';
            titleH3.textContent = title;
            
            const messageP = document.createElement('p');
            messageP.className = 'gc-message';
            messageP.textContent = message;
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'gc-confirm-actions';
            
            const cancelButton = document.createElement('button');
            cancelButton.className = 'gc-btn gc-btn-secondary';
            cancelButton.setAttribute('data-action', 'cancel');
            cancelButton.textContent = cancelText;
            
            const confirmButton = document.createElement('button');
            confirmButton.className = `gc-btn ${variant === 'danger' ? 'gc-btn-danger' : 'gc-btn-primary'}`;
            confirmButton.setAttribute('data-action', 'confirm');
            confirmButton.textContent = confirmText;
            
            // Assemble the DOM structure
            contentDiv.appendChild(titleH3);
            contentDiv.appendChild(messageP);
            bodyDiv.appendChild(contentDiv);
            actionsDiv.appendChild(cancelButton);
            actionsDiv.appendChild(confirmButton);
            modalDiv.appendChild(bodyDiv);
            modalDiv.appendChild(actionsDiv);
            overlay.appendChild(modalDiv);

            const modal = overlay.firstElementChild;
            document.body.appendChild(overlay);
            requestAnimationFrame(() => modal.classList.add('gc-show'));

            function cleanup(result) {
                modal.classList.remove('gc-show');
                setTimeout(() => overlay.remove(), 150);
                resolve(result);
            }

            // Clicking outside should not close the confirm – user must choose
            overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => cleanup(false));
            overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => cleanup(true));

            document.addEventListener('keydown', function onKey(e) {
                if (e.key === 'Escape') { cleanup(false); document.removeEventListener('keydown', onKey); }
                if (e.key === 'Enter') { cleanup(true); document.removeEventListener('keydown', onKey); }
            });
        });
    }

    // Expose APIs
    window.showToast = showToast;
    window.showConfirmModal = showConfirmModal;

    // Soft override: route native alert to a non-intrusive toast
    const nativeAlert = window.alert;
    window.alert = function (msg) {
        try {
            const text = typeof msg === 'string' ? msg : JSON.stringify(msg);
            const lowered = (text || '').toLowerCase();
            let type = 'info';
            if (lowered.includes('error') || lowered.includes('failed')) type = 'error';
            else if (lowered.includes('success') || lowered.includes('saved')) type = 'success';
            else if (lowered.includes('warn') || lowered.includes('please')) type = 'warning';
            showToast(text, type);
        } catch (e) {
            nativeAlert(msg);
        }
    };
})();


