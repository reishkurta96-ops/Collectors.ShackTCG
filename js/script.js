// Product Data with Subcategories
const products = [
    // Yu-Gi-Oh! - Singles
    { id: 1, name: 'Blue-Eyes White Dragon', category: 'yugioh', subcategory: 'singles', price: 45.99, icon: '🐉', stock: 25, description: '- Iconic legendary dragon card\n- First edition print\n- Near mint condition' },
    { id: 2, name: 'Dark Magician', category: 'yugioh', subcategory: 'singles', price: 35.99, icon: '🧙', stock: 30, description: '- Classic spellcaster card\n- Tournament legal\n- Holographic finish' },
    { id: 3, name: 'Red-Eyes Black Dragon', category: 'yugioh', subcategory: 'singles', price: 38.99, icon: '🐲', stock: 20, description: '- Powerful dragon-type monster\n- Rare collector\'s edition\n- Excellent condition' },
    
    // Pokémon - Singles
    { id: 10, name: 'Charizard VMAX', category: 'pokemon', subcategory: 'singles', price: 125.99, icon: '🔥', stock: 8, description: '- Ultra rare VMAX card\n- 330 HP powerhouse\n- Perfect for competitive play' },
    { id: 11, name: 'Pikachu V', category: 'pokemon', subcategory: 'singles', price: 45.99, icon: '⚡', stock: 35, description: '- Full art illustration\n- Lightning-type staple\n- Tournament legal' },
    
    // Magic: The Gathering - Singles
    { id: 18, name: 'Black Lotus', category: 'magic', subcategory: 'singles', price: 299.99, icon: '🌸', stock: 2, description: '- Power Nine card\n- Unlimited edition\n- Professionally graded' },
    
    // Accessories
    { id: 25, name: 'Premium Sleeves (100pk)', category: 'accessories', subcategory: 'sleeves', price: 12.99, icon: '🛡️', stock: 100, description: '- 100 card sleeves\n- Archival quality\n- Fits standard cards' },
];

// Subcategory definitions
const subcategories = JSON.parse(localStorage.getItem('customCategories')) || {
    yugioh: ['singles', 'structure-decks', 'booster-boxes'],
    pokemon: ['singles', 'booster-boxes', 'elite-trainer-boxes'],
    magic: ['singles', 'booster-boxes', 'commander-decks'],
    accessories: ['sleeves', 'deck-boxes', 'play-mats']
};

// Shopping Cart
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let currentFilter = 'all';
let currentSubcategory = 'all';
let currentSearchTerm = '';
let currentSortOrder = 'default';
let currentPriceFilter = 'all';

// STOCK RESERVATION SYSTEM
// Get all reserved stock from all users' carts
function getAllReservedStock() {
    const allCarts = JSON.parse(localStorage.getItem('allCarts') || '{}');
    const reserved = {};
    
    Object.values(allCarts).forEach(userCart => {
        userCart.forEach(item => {
            reserved[item.id] = (reserved[item.id] || 0) + item.quantity;
        });
    });
    
    return reserved;
}

// Get current user's cart ID (unique identifier)
function getCurrentCartId() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        return `user_${currentUser.email}`;
    }
    
    // For guest users, create or get a session ID
    let guestId = localStorage.getItem('guestCartId');
    if (!guestId) {
        guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('guestCartId', guestId);
    }
    return guestId;
}

// Update global cart reservations
function updateGlobalCartReservations() {
    const cartId = getCurrentCartId();
    const allCarts = JSON.parse(localStorage.getItem('allCarts') || '{}');
    
    if (cart.length > 0) {
        allCarts[cartId] = cart;
    } else {
        delete allCarts[cartId];
    }
    
    localStorage.setItem('allCarts', JSON.stringify(allCarts));
}

// Get available stock for a product (accounting for reservations)
function getAvailableStock(productId, actualStock) {
    const reserved = getAllReservedStock();
    const cartId = getCurrentCartId();
    const myCart = cart.find(item => item.id === productId);
    const myReserved = myCart ? myCart.quantity : 0;
    
    // Available = actual stock - (total reserved - my reserved)
    const available = actualStock - ((reserved[productId] || 0) - myReserved);
    return Math.max(0, available);
}

// Clean Cart - Remove products that no longer exist
function cleanCart() {
    const adminProducts = JSON.parse(localStorage.getItem('adminProducts'));
    const productsToUse = adminProducts && adminProducts.length > 0 ? adminProducts : products;
    const productIds = productsToUse.map(p => p.id);
    
    const originalLength = cart.length;
    cart = cart.filter(item => productIds.includes(item.id));
    
    if (cart.length !== originalLength) {
        console.log(`Removed ${originalLength - cart.length} deleted products from cart`);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateGlobalCartReservations();
    }
}

// Clean expired guest carts (carts older than 24 hours)
function cleanExpiredGuestCarts() {
    const allCarts = JSON.parse(localStorage.getItem('allCarts') || '{}');
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    Object.keys(allCarts).forEach(cartId => {
        if (cartId.startsWith('guest_')) {
            const timestamp = parseInt(cartId.split('_')[1]);
            if (now - timestamp > dayInMs) {
                delete allCarts[cartId];
            }
        }
    });
    
    localStorage.setItem('allCarts', JSON.stringify(allCarts));
}

// Search, Filter & Sort Functions
function handleSearch() {
    currentSearchTerm = document.getElementById('searchInput').value.toLowerCase();
    displayProducts(currentFilter, currentSubcategory);
}

function handleSort() {
    currentSortOrder = document.getElementById('sortSelect').value;
    displayProducts(currentFilter, currentSubcategory);
}

function handlePriceFilter() {
    currentPriceFilter = document.getElementById('priceFilter').value;
    displayProducts(currentFilter, currentSubcategory);
}

function resetFilters() {
    currentSearchTerm = '';
    currentSortOrder = 'default';
    currentPriceFilter = 'all';
    
    document.getElementById('searchInput').value = '';
    document.getElementById('sortSelect').value = 'default';
    document.getElementById('priceFilter').value = 'all';
    
    displayProducts(currentFilter, currentSubcategory);
}

// Show Remove Quantity Modal
function showRemoveModal(productId) {
    const numId = Number(productId);
    const item = cart.find(i => Number(i.id) === numId);
    
    if (!item) return;
    
    const modalHTML = `
        <div class="quantity-modal" id="removeModal" onclick="if(event.target.id==='removeModal') closeRemoveModal()">
            <div class="quantity-modal-content">
                <h3>Remove from Cart</h3>
                <p style="margin: 1rem 0; color: #666;">${item.name}</p>
                <p style="margin-bottom: 0.5rem; font-weight: 600;">Currently in cart: ${item.quantity}</p>
                <p style="margin-bottom: 1rem; color: #666; font-size: 0.9rem;">Price: $${item.price.toFixed(2)} each</p>
                <div style="margin: 1.5rem 0;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Quantity to remove:</label>
                    <input type="number" id="removeQuantityInput" min="1" max="${item.quantity}" value="${item.quantity}" 
                           style="width: 100%; padding: 0.8rem; border: 2px solid #ffffe0; border-radius: 8px; font-size: 1rem;">
                    <small style="color: #666; font-size: 0.85rem; margin-top: 0.3rem; display: block;">Enter ${item.quantity} to remove all</small>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button onclick="closeRemoveModal()" style="flex: 1; padding: 0.8rem; background: #6c757d; color: white; border: 2px solid #ffffe0; border-radius: 8px; cursor: pointer; font-family: 'Poppins', sans-serif; font-weight: 600;">Cancel</button>
                    <button onclick="confirmRemoveQuantity(${productId})" style="flex: 1; padding: 0.8rem; background: #dc143c; color: white; border: 2px solid #ffffe0; border-radius: 8px; cursor: pointer; font-family: 'Poppins', sans-serif; font-weight: 600;">Remove</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeRemoveModal() {
    const modal = document.getElementById('removeModal');
    if (modal) modal.remove();
}

// Confirm Remove Quantity
function confirmRemoveQuantity(productId) {
    const quantityInput = document.getElementById('removeQuantityInput');
    const quantityToRemove = parseInt(quantityInput.value) || 0;
    
    if (quantityToRemove <= 0) {
        alert('Please enter a valid quantity to remove.');
        return;
    }
    
    const numId = Number(productId);
    const item = cart.find(i => Number(i.id) === numId);
    
    if (!item) {
        closeRemoveModal();
        return;
    }
    
    if (quantityToRemove > item.quantity) {
        alert(`You only have ${item.quantity} of this item in your cart.`);
        return;
    }
    
    // If removing all or more, remove the item completely
    if (quantityToRemove >= item.quantity) {
        cart = cart.filter(i => Number(i.id) !== numId);
    } else {
        // Otherwise, just reduce the quantity
        item.quantity -= quantityToRemove;
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateGlobalCartReservations(); // UPDATE RESERVATION
    updateCart();
    closeRemoveModal();
    displayProducts(currentFilter, currentSubcategory); // REFRESH DISPLAY TO UPDATE STOCK
}

// Remove from Cart
function removeFromCart(productId) {
    showRemoveModal(productId);
}

// Clear entire cart function
function clearCart() {
    if (confirm('Are you sure you want to clear your entire cart?')) {
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateGlobalCartReservations(); // UPDATE RESERVATION
        updateCart();
        displayProducts(currentFilter, currentSubcategory); // REFRESH DISPLAY TO UPDATE STOCK
    }
}

// Display Products Function with Search, Filters, and Stock Reservation
function displayProducts(category = 'all', subcategory = 'all') {
    const grid = document.getElementById('productGrid');
    const countDisplay = document.getElementById('productsCount');
    
    const adminProducts = JSON.parse(localStorage.getItem('adminProducts'));
    let productsToShow = adminProducts && adminProducts.length > 0 ? adminProducts : products;
    
    productsToShow = productsToShow.map(p => ({
        ...p,
        stock: p.stock !== undefined ? p.stock : 100,
        inStock: p.inStock !== undefined ? p.inStock : true
    }));
    
    let filtered = productsToShow;
    
    // Category filter
    if (category !== 'all') {
        filtered = filtered.filter(p => p.category === category);
    }
    
    // Subcategory filter
    if (subcategory !== 'all') {
        filtered = filtered.filter(p => p.subcategory === subcategory);
    }
    
    // Search filter
    if (currentSearchTerm) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(currentSearchTerm) ||
            (p.description && p.description.toLowerCase().includes(currentSearchTerm))
        );
    }
    
    // Price filter
    if (currentPriceFilter !== 'all') {
        const [min, max] = currentPriceFilter.split('-').map(Number);
        filtered = filtered.filter(p => p.price >= min && p.price <= max);
    }
    
    // Sorting
    if (currentSortOrder !== 'default') {
        switch(currentSortOrder) {
            case 'name-asc':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                filtered.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'price-asc':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'stock-desc':
                filtered.sort((a, b) => getAvailableStock(b.id, b.stock) - getAvailableStock(a.id, a.stock));
                break;
        }
    }
    
    // Update count display
    if (countDisplay) {
        countDisplay.innerHTML = `<p style="color: white; text-align: center; margin-bottom: 1rem; font-weight: 600;">Showing ${filtered.length} product${filtered.length !== 1 ? 's' : ''}</p>`;
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: white; grid-column: 1/-1;">No products found matching your criteria.</p>';
        return;
    }
    
    grid.innerHTML = filtered.map(product => {
        const formattedDescription = (product.description || 'No description available').replace(/\n/g, '<br>');
        const availableStock = getAvailableStock(product.id, product.stock);
        const isOutOfStock = availableStock <= 0;
        
        // Check if item is in current user's cart
        const inMyCart = cart.find(item => item.id === product.id);
        const myCartQty = inMyCart ? inMyCart.quantity : 0;
        
        return `
        <div class="product-card">
            <div class="product-image-container">
                ${product.image ? 
                    `<img src="${product.image}" alt="${product.name}" class="product-image-full">` : 
                    `<div class="product-image-icon">${product.icon}</div>`
                }
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price-stock">
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <div class="product-stock ${isOutOfStock ? 'out-of-stock' : ''}" style="${isOutOfStock ? 'background: #f8d7da; color: #721c24;' : ''}">
                        ${isOutOfStock ? 'Out of Stock' : `Available: ${availableStock}`}
                        ${myCartQty > 0 ? `<br><small style="color: #28a745; font-weight: 600;">(${myCartQty} in cart)</small>` : ''}
                    </div>
                </div>
                <button class="add-to-cart" onclick="addToCart(${product.id})" ${isOutOfStock ? 'disabled style="background: #ccc; cursor: not-allowed;"' : ''}>
                    ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </button>
            </div>
            <div class="product-description-overlay">
                <p>${formattedDescription}</p>
            </div>
        </div>
        `;
    }).join('');
}

// Add to Cart - GUEST CHECKOUT ENABLED
function addToCart(productId) {
    showQuantityModal(productId);
}

// Show quantity modal
function showQuantityModal(productId) {
    const adminProducts = JSON.parse(localStorage.getItem('adminProducts'));
    const productsToUse = adminProducts && adminProducts.length > 0 ? adminProducts : products;
    const product = productsToUse.find(p => p.id == productId);
    
    if (!product) return;
    
    const availableStock = getAvailableStock(product.id, product.stock);
    
    if (availableStock <= 0) {
        alert('Sorry, this product is currently out of stock.');
        return;
    }
    
    const modalHTML = `
        <div class="quantity-modal" id="quantityModal" onclick="if(event.target.id==='quantityModal') closeQuantityModal()">
            <div class="quantity-modal-content">
                <h3>Add to Cart</h3>
                <p style="margin: 1rem 0; color: #666;">${product.name}</p>
                <p style="margin-bottom: 1rem; font-weight: 600;">Price: $${product.price.toFixed(2)}</p>
                <p style="margin-bottom: 1rem; color: #28a745; font-weight: 600;">Available: ${availableStock} in stock</p>
                <div style="margin: 1.5rem 0;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Quantity:</label>
                    <input type="number" id="quantityInput" min="1" max="${availableStock}" value="1" 
                           style="width: 100%; padding: 0.8rem; border: 2px solid #ffffe0; border-radius: 8px; font-size: 1rem;">
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button onclick="closeQuantityModal()" style="flex: 1; padding: 0.8rem; background: #6c757d; color: white; border: 2px solid #ffffe0; border-radius: 8px; cursor: pointer; font-family: 'Poppins', sans-serif; font-weight: 600;">Cancel</button>
                    <button onclick="confirmAddToCart(${productId})" style="flex: 1; padding: 0.8rem; background: #dc143c; color: white; border: 2px solid #ffffe0; border-radius: 8px; cursor: pointer; font-family: 'Poppins', sans-serif; font-weight: 600;">Add to Cart</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeQuantityModal() {
    const modal = document.getElementById('quantityModal');
    if (modal) modal.remove();
}

function confirmAddToCart(productId) {
    const quantityInput = document.getElementById('quantityInput');
    const quantity = parseInt(quantityInput.value) || 1;
    
    const adminProducts = JSON.parse(localStorage.getItem('adminProducts'));
    const productsToUse = adminProducts && adminProducts.length > 0 ? adminProducts : products;
    const product = productsToUse.find(p => p.id == productId);
    
    if (!product) return;
    
    const availableStock = getAvailableStock(product.id, product.stock);
    
    if (quantity > availableStock) {
        alert(`Only ${availableStock} items available!`);
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity + quantity > availableStock) {
            alert(`You can only add ${availableStock - existingItem.quantity} more of this item.`);
            return;
        }
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateGlobalCartReservations(); // UPDATE RESERVATION
    updateCart();
    closeQuantityModal();
    alert(`${quantity} x ${product.name} added to cart!`);
    displayProducts(currentFilter, currentSubcategory); // REFRESH DISPLAY TO UPDATE STOCK
}

// Update Cart Display with Guest Checkout Notice
function updateCart() {
    cleanCart();
    
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const guestNotice = document.getElementById('guestCheckoutNotice');
    
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Your cart is empty</p>';
            if (cartTotal) cartTotal.innerHTML = '<div style="text-align: center; font-size: 1.2rem; font-weight: bold;">Total: $0.00</div>';
            if (guestNotice) guestNotice.style.display = 'none';
            return;
        }
        
        // Show guest checkout notice if not logged in
        if (!currentUser && guestNotice) {
            guestNotice.style.display = 'block';
        } else if (guestNotice) {
            guestNotice.style.display = 'none';
        }
        
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)} × ${item.quantity}</div>
                </div>
                <div class="cart-item-actions">
                    <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            </div>
        `).join('');
        
        if (cartTotal) {
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            cartTotal.innerHTML = `
                <div style="text-align: right; font-size: 1.2rem; font-weight: bold; margin-bottom: 1rem;">
                    Total: $${total.toFixed(2)}
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button onclick="clearCart()" style="flex: 1; padding: 1rem; background: #6c757d; color: white; border: 2px solid #ffffe0; border-radius: 10px; font-family: 'Poppins', sans-serif; font-size: 1rem; font-weight: 600; cursor: pointer;">Clear Cart</button>
                    <button onclick="proceedToCheckout()" class="checkout-btn" style="flex: 2;">Proceed to Checkout</button>
                </div>
            `;
        }
    }
}

// Proceed to Checkout - Guest Checkout Enabled
function proceedToCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    window.location.href = 'checkout.html';
}

// Show Subcategories for a Category
function showSubcategories(category) {
    const subcategoryBar = document.getElementById('subcategoryBar');
    const subcategoryContainer = subcategoryBar.querySelector('.subcategory-container');
    
    if (category === 'all') {
        subcategoryBar.style.display = 'none';
        return;
    }
    
    const subs = subcategories[category];
    
    if (!subs || subs.length === 0) {
        subcategoryBar.style.display = 'none';
        return;
    }
    
    subcategoryBar.style.display = 'block';
    
    subcategoryContainer.innerHTML = `
        <button class="subcategory-btn active" onclick="filterBySubcategory('all', event)">All</button>
        ${subs.map(sub => {
            const displayName = sub.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            return `<button class="subcategory-btn" onclick="filterBySubcategory('${sub}', event)">${displayName}</button>`;
        }).join('')}
    `;
}

function filterBySubcategory(subcategory, event) {
    currentSubcategory = subcategory;
    displayProducts(currentFilter, subcategory);
    
    const buttons = document.querySelectorAll('.subcategory-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

function changeMainCategory(category) {
    currentFilter = category;
    currentSubcategory = 'all';
    
    const titles = {
        'all': 'All Products',
        'yugioh': 'Yu-Gi-Oh! Products',
        'pokemon': 'Pokémon Products',
        'magic': 'Magic: The Gathering Products',
        'accessories': 'Accessories'
    };
    const titleElement = document.getElementById('categoryTitle');
    if (titleElement) {
        titleElement.textContent = titles[category] || 'Our Products';
    }
    
    showSubcategories(category);
    displayProducts(category, 'all');
}

function toggleCart() {
    const modal = document.getElementById('cartModal');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
    updateCart();
}

window.onclick = function(event) {
    const modal = document.getElementById('cartModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

function checkURLFilter() {
    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get('filter');
    if (filter && filter !== 'all') {
        currentFilter = filter;
        changeMainCategory(filter);
    } else {
        displayProducts();
    }
}

function loadCategoryNavigation() {
    const navLinks = document.getElementById('categoryNavLinks');
    if (!navLinks) return;
    
    const customCategories = JSON.parse(localStorage.getItem('customCategories')) || {};
    
    const categoryLogos = {
        'yugioh': { logo: 'yugioh-logo.png', class: 'yugioh-logo' },
        'pokemon': { logo: 'pokemon-logo.png', class: '' },
        'magic': { logo: 'magic-logo.png', class: '' },
        'accessories': { logo: 'accessories-logo.png', class: 'accessories-logo' }
    };
    
    let html = '';
    Object.keys(customCategories).forEach(cat => {
        const logoInfo = categoryLogos[cat];
        const displayName = cat.charAt(0).toUpperCase() + cat.slice(1);
        
        if (logoInfo) {
            html += `
                <li>
                    <a href="?filter=${cat}" class="category-logo-link">
                        <img src="images/${logoInfo.logo}" alt="${displayName}" class="category-logo ${logoInfo.class}">
                    </a>
                </li>
            `;
        } else {
            html += `
                <li>
                    <a href="?filter=${cat}" style="color: white; text-decoration: none; font-weight: 600; padding: 0.5rem 1rem; border: 2px solid #ffffe0; border-radius: 8px; transition: all 0.3s;">
                        ${displayName}
                    </a>
                </li>
            `;
        }
    });
    
    navLinks.innerHTML = html;
}

function checkLoginStatus() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const authButtons = document.getElementById('authButtons');
    const userSection = document.getElementById('userSection');
    const userName = document.getElementById('userName');
    
    if (currentUser && authButtons && userSection && userName) {
        authButtons.style.display = 'none';
        userSection.style.display = 'flex';
        userName.textContent = `Hi, ${currentUser.fullName.split(' ')[0]}!`;
        updateCart();
    } else if (authButtons && userSection) {
        authButtons.style.display = 'flex';
        userSection.style.display = 'none';
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    cleanExpiredGuestCarts();
    cleanCart();
    loadCategoryNavigation();
    checkURLFilter();
    checkLoginStatus();
});