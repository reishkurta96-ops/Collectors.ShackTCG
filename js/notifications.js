// Custom Notification System
// Replaces browser alert() and confirm() with styled on-page notifications

// Show a notification
function showNotification(message, type = 'info', duration = 3000) {
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    const titles = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Info'
    };
    
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.innerHTML = `
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        <div class="notification-header">
            <div class="notification-icon">${icons[type]}</div>
            <div class="notification-title">${titles[type]}</div>
        </div>
        <div class="notification-message">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideInRight 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }
}

// Show a confirmation dialog
function showConfirm(message, title = 'Confirm', onYes = () => {}, onNo = () => {}) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'custom-confirm-modal';
        modal.innerHTML = `
            <div class="custom-confirm-content">
                <div class="confirm-header">
                    <div class="confirm-icon">⚠</div>
                    <div class="confirm-title">${title}</div>
                </div>
                <div class="confirm-message">${message}</div>
                <div class="confirm-buttons">
                    <button class="confirm-btn confirm-btn-no">Cancel</button>
                    <button class="confirm-btn confirm-btn-yes">Confirm</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const yesBtn = modal.querySelector('.confirm-btn-yes');
        const noBtn = modal.querySelector('.confirm-btn-no');
        
        yesBtn.onclick = () => {
            modal.remove();
            onYes();
            resolve(true);
        };
        
        noBtn.onclick = () => {
            modal.remove();
            onNo();
            resolve(false);
        };
        
        // Close on background click
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                onNo();
                resolve(false);
            }
        };
    });
}

// Override default alert
window.alert = function(message) {
    // Determine type based on message content
    let type = 'info';
    if (message.toLowerCase().includes('success') || message.toLowerCase().includes('✓') || message.toLowerCase().includes('🎉')) {
        type = 'success';
    } else if (message.toLowerCase().includes('error') || message.toLowerCase().includes('invalid') || message.toLowerCase().includes('failed')) {
        type = 'error';
    } else if (message.toLowerCase().includes('warning') || message.toLowerCase().includes('please')) {
        type = 'warning';
    }
    
    showNotification(message, type);
};

// Note: window.confirm is intentionally NOT overridden here because the native
// confirm() is synchronous and many callers depend on its boolean return value.
// Use showConfirm() directly when you want the styled async dialog.