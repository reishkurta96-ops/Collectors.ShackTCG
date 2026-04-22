// Load purchase history with order tracking
function loadPurchaseHistory() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    document.getElementById('userName').textContent = `Hi, ${currentUser.fullName.split(' ')[0]}!`;
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const userOrders = orders.filter(order => order.userEmail === currentUser.email);
    
    const historyDiv = document.getElementById('purchaseHistory');
    
    if (userOrders.length === 0) {
        historyDiv.innerHTML = `
            <p style="text-align: center; color: #666; padding: 2rem;">
                You haven't placed any orders yet.
                <br><br>
                <a href="products.html" style="color: #dc143c; text-decoration: underline; font-weight: 600;">Start Shopping</a>
            </p>
        `;
        return;
    }
    
    // Sort orders by date (newest first)
    userOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    historyDiv.innerHTML = userOrders.map(order => {
        const orderDate = new Date(order.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Get order status with color coding
        const statusInfo = getOrderStatusInfo(order.status || 'Processing');
        
        return `
            <div class="order-item">
                <div class="order-header">
                    <div>
                        <div class="order-number">Order #${order.orderNumber}</div>
                        <div class="order-date">${orderDate}</div>
                    </div>
                    <div class="order-status">
                        <div class="status-badge" style="background: ${statusInfo.color}; color: white; padding: 0.5rem 1rem; border-radius: 5px; font-weight: 600;">
                            ${statusInfo.icon} ${order.status || 'Processing'}
                        </div>
                        ${getTrackingButton(order)}
                    </div>
                </div>
                
                <!-- Order Tracking Progress Bar -->
                <div class="order-tracking-bar">
                    ${getTrackingProgress(order.status || 'Processing')}
                </div>
                
                <div class="order-products">
                    ${order.items.map(item => `
                        <div class="order-product-item">
                            <div>
                                <strong>${item.name}</strong>
                                <div style="color: #666; font-size: 0.9rem;">Quantity: ${item.quantity}</div>
                            </div>
                            <div>$${(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="order-shipping-info" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee; color: #666; font-size: 0.9rem;">
                    <strong>Shipping to:</strong> ${order.shipping.fullName}<br>
                    ${order.shipping.address}, ${order.shipping.city}${order.shipping.state ? ', ' + order.shipping.state : ''} ${order.shipping.zip}
                    ${order.trackingNumber ? `<br><strong>Tracking #:</strong> ${order.trackingNumber}` : ''}
                    ${order.estimatedDelivery ? `<br><strong>Estimated Delivery:</strong> ${order.estimatedDelivery}` : ''}
                </div>
                
                <div class="order-total">Total: $${order.total.toFixed(2)}</div>
                
                <div class="order-actions" style="margin-top: 1rem; display: flex; gap: 1rem;">
                    ${getCancelButton(order)}
                    <button onclick="reorder('${order.orderNumber}')" style="padding: 0.6rem 1.2rem; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-family: 'Poppins', sans-serif; font-weight: 600;">
                        Reorder
                    </button>
                    <button onclick="viewDetails('${order.orderNumber}')" style="padding: 0.6rem 1.2rem; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-family: 'Poppins', sans-serif; font-weight: 600;">
                        View Details
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Get order status information with color and icon
function getOrderStatusInfo(status) {
    const statusMap = {
        'Processing': { color: '#ffc107', icon: '⏳' },
        'Confirmed': { color: '#17a2b8', icon: '✓' },
        'Shipped': { color: '#007bff', icon: '🚚' },
        'Out for Delivery': { color: '#6610f2', icon: '📦' },
        'Delivered': { color: '#28a745', icon: '✅' },
        'Cancelled': { color: '#dc3545', icon: '❌' }
    };
    
    return statusMap[status] || { color: '#6c757d', icon: '❓' };
}

// Get tracking progress bar
function getTrackingProgress(status) {
    const stages = ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];
    const currentStageIndex = stages.indexOf(status);
    
    if (status === 'Cancelled') {
        return '<div style="text-align: center; color: #dc3545; padding: 1rem; font-weight: 600;">Order Cancelled</div>';
    }
    
    return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 1.5rem 0; padding: 0 1rem;">
            ${stages.map((stage, index) => {
                const isCompleted = index <= currentStageIndex;
                const isActive = index === currentStageIndex;
                return `
                    <div style="flex: 1; text-align: center; position: relative;">
                        <div style="width: 30px; height: 30px; border-radius: 50%; background: ${isCompleted ? '#28a745' : '#e0e0e0'}; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; position: relative; z-index: 2;">
                            ${isCompleted ? '✓' : index + 1}
                        </div>
                        <div style="font-size: 0.75rem; margin-top: 0.5rem; font-weight: ${isActive ? '700' : '400'}; color: ${isActive ? '#dc143c' : '#666'};">
                            ${stage}
                        </div>
                        ${index < stages.length - 1 ? `
                            <div style="position: absolute; top: 15px; left: 50%; width: 100%; height: 3px; background: ${index < currentStageIndex ? '#28a745' : '#e0e0e0'}; z-index: 1;"></div>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Get tracking button
function getTrackingButton(order) {
    if (order.status === 'Shipped' || order.status === 'Out for Delivery') {
        return `
            <button onclick="trackOrder('${order.orderNumber}')" style="margin-top: 0.5rem; padding: 0.4rem 0.8rem; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.9rem; font-weight: 600;">
                Track Package
            </button>
        `;
    }
    return '';
}

// Get cancel button (only for processing/confirmed orders)
function getCancelButton(order) {
    if (order.status === 'Processing' || order.status === 'Confirmed') {
        return `
            <button onclick="cancelOrder('${order.orderNumber}')" style="padding: 0.6rem 1.2rem; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-family: 'Poppins', sans-serif; font-weight: 600;">
                Cancel Order
            </button>
        `;
    }
    return '';
}

// Cancel order function
function cancelOrder(orderNumber) {
    if (!confirm('Are you sure you want to cancel this order?')) {
        return;
    }
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const orderIndex = orders.findIndex(o => o.orderNumber === orderNumber);
    
    if (orderIndex !== -1) {
        orders[orderIndex].status = 'Cancelled';
        localStorage.setItem('orders', JSON.stringify(orders));
        alert('Order cancelled successfully.');
        loadPurchaseHistory();
    }
}

// Track order function
function trackOrder(orderNumber) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.orderNumber === orderNumber);
    
    if (order) {
        const trackingInfo = `
Order #${order.orderNumber}
Status: ${order.status}
${order.trackingNumber ? `Tracking Number: ${order.trackingNumber}` : 'Tracking number not yet available'}
${order.estimatedDelivery ? `Estimated Delivery: ${order.estimatedDelivery}` : ''}

Your package is on its way!
        `;
        alert(trackingInfo);
    }
}

// Reorder function
function reorder(orderNumber) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.orderNumber === orderNumber);
    
    if (order) {
        // Add all items back to cart
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        order.items.forEach(item => {
            const existingItem = cart.find(c => c.id === item.id);
            if (existingItem) {
                existingItem.quantity += item.quantity;
            } else {
                cart.push({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                });
            }
        });
        
        localStorage.setItem('cart', JSON.stringify(cart));
        alert('Items added to cart!');
        window.location.href = 'products.html';
    }
}

// View order details
function viewDetails(orderNumber) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.orderNumber === orderNumber);
    
    if (order) {
        let details = `
ORDER DETAILS
Order #${order.orderNumber}
Date: ${new Date(order.date).toLocaleDateString()}
Status: ${order.status}

ITEMS:
${order.items.map(item => `- ${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`).join('\n')}

SHIPPING ADDRESS:
${order.shipping.fullName}
${order.shipping.address}
${order.shipping.city}${order.shipping.state ? ', ' + order.shipping.state : ''} ${order.shipping.zip}

TOTAL: $${order.total.toFixed(2)}
        `;
        alert(details);
    }
}

function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        alert('Logged out successfully!');
        window.location.href = 'index.html';
    }
}

// Update cart count
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadPurchaseHistory();
    updateCartCount();
});