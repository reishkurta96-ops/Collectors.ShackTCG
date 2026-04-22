// GUEST CHECKOUT ENABLED - No login required
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
let isGuest = !currentUser;

// Display user info or guest notice
const userInfo = document.getElementById('userInfo');
if (userInfo) {
    if (currentUser) {
        userInfo.innerHTML = `Welcome, ${currentUser.fullName.split(' ')[0]}! <a href="#" onclick="logout()" style="color: white; text-decoration: underline; margin-left: 1rem;">Logout</a>`;
    } else {
        userInfo.innerHTML = `Checking out as Guest | <a href="login.html" style="color: white; text-decoration: underline;">Login</a> for faster checkout`;
    }
}

// Load cart from localStorage
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

// Stock Reservation Functions (must match script.js)
function getCurrentCartId() {
    if (currentUser) {
        return `user_${currentUser.email}`;
    }
    
    let guestId = localStorage.getItem('guestCartId');
    if (!guestId) {
        guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('guestCartId', guestId);
    }
    return guestId;
}

function releaseStockReservation() {
    const cartId = getCurrentCartId();
    const allCarts = JSON.parse(localStorage.getItem('allCarts') || '{}');
    delete allCarts[cartId];
    localStorage.setItem('allCarts', JSON.stringify(allCarts));
}

function deductStockPermanently() {
    const adminProducts = JSON.parse(localStorage.getItem('adminProducts') || '[]');
    
    if (adminProducts.length === 0) return;
    
    // Deduct stock for each purchased item
    cart.forEach(cartItem => {
        const product = adminProducts.find(p => p.id === cartItem.id);
        if (product) {
            product.stock = Math.max(0, product.stock - cartItem.quantity);
        }
    });
    
    localStorage.setItem('adminProducts', JSON.stringify(adminProducts));
}

// Display order items
function displayOrderSummary() {
    const orderItems = document.getElementById('orderItems');
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');
    
    if (cart.length === 0) {
        orderItems.innerHTML = '<p style="text-align: center; color: #666;">Your cart is empty</p>';
        if (subtotalEl) subtotalEl.textContent = '$0.00';
        if (shippingEl) shippingEl.textContent = '$0.00';
        if (taxEl) taxEl.textContent = '$0.00';
        if (totalEl) totalEl.textContent = '$0.00';
        return;
    }
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + shipping + tax;
    
    // Display items
    orderItems.innerHTML = cart.map(item => `
        <div class="order-row">
            <div>
                <div style="font-weight: 600;">${item.name}</div>
                <div style="color: #666; font-size: 0.9rem;">Qty: ${item.quantity} × $${item.price.toFixed(2)}</div>
            </div>
            <div style="font-weight: 600;">$${(item.price * item.quantity).toFixed(2)}</div>
        </div>
    `).join('');
    
    // Display totals
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

// Auto-format card number
const cardNumberInput = document.getElementById('cardNumber');
if (cardNumberInput) {
    cardNumberInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formattedValue;
    });
}

// Auto-format expiry date
const expiryInput = document.getElementById('expiry');
if (expiryInput) {
    expiryInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        e.target.value = value;
    });
}

// Process Payment with Stock Integration
function processPayment() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        window.location.href = 'products.html';
        return;
    }
    
    // Validate forms
    const shippingForm = document.getElementById('shippingForm');
    const paymentForm = document.getElementById('paymentForm');
    
    if (!shippingForm.checkValidity()) {
        alert('Please fill in all shipping information!');
        shippingForm.reportValidity();
        return;
    }
    
    if (!paymentForm.checkValidity()) {
        alert('Please fill in all payment information!');
        paymentForm.reportValidity();
        return;
    }
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;
    
    // Get form data
    const shippingData = {
        fullName: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: '',
        zip: document.getElementById('zipCode').value,
        country: document.getElementById('country').value,
        phone: document.getElementById('phone').value
    };
    
    const orderNumber = `ORD-${Date.now()}`;
    
    // Create order data
    const orderData = {
        orderNumber: orderNumber,
        userEmail: currentUser ? currentUser.email : 'guest',
        guestEmail: null,
        shipping: shippingData,
        items: cart.map(item => ({...item})), // Deep copy
        subtotal: subtotal,
        shippingCost: shipping,
        tax: tax,
        total: total,
        date: new Date().toISOString(),
        status: 'Processing',
        trackingNumber: null,
        estimatedDelivery: null
    };
    
    // Save order
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(orderData);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // CRITICAL: Deduct stock permanently
    deductStockPermanently();
    
    // CRITICAL: Release reservation from global carts
    releaseStockReservation();
    
    // Clear user's cart
    localStorage.removeItem('cart');
    cart = [];
    
    // Clear guest cart ID if guest
    if (isGuest) {
        localStorage.removeItem('guestCartId');
    }
    
    // Show success message
    alert(`🎉 Order Placed Successfully!

Order Number: ${orderNumber}
Total: $${total.toFixed(2)}

${isGuest ? 'Thank you for your guest purchase!' : 'Thank you for your purchase!'}

(This is a demo - no real charges were made)`);
    
    // Redirect
    if (currentUser) {
        window.location.href = 'order-history.html';
    } else {
        window.location.href = 'products.html';
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout? Your cart will be saved.')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    displayOrderSummary();
    
    // Pre-fill shipping info if logged in
    if (currentUser && currentUser.address) {
        const nameParts = currentUser.fullName.split(' ');
        document.getElementById('firstName').value = nameParts[0] || '';
        document.getElementById('lastName').value = nameParts.slice(1).join(' ') || '';
        if (currentUser.phone) document.getElementById('phone').value = currentUser.phone;
    }
});