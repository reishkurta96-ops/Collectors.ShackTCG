// Check if admin is logged in
if (!localStorage.getItem('adminLoggedIn')) {
    alert('Please login as admin first!');
    window.location.href = 'admin-login.html';
}

// Subcategories for each category (load from localStorage or use defaults)
let subcategoryOptions = JSON.parse(localStorage.getItem('customCategories')) || {
    yugioh: ['singles', 'structure-decks', 'booster-boxes'],
    pokemon: ['singles', 'booster-boxes', 'elite-trainer-boxes'],
    magic: ['singles', 'booster-boxes', 'commander-decks'],
    accessories: ['sleeves', 'deck-boxes', 'play-mats']
};

// Save categories to localStorage
function saveCategories() {
    localStorage.setItem('customCategories', JSON.stringify(subcategoryOptions));
}

// Load products from localStorage (or use default if none exist)
let products = JSON.parse(localStorage.getItem('adminProducts')) || [];

// Update category dropdown to populate subcategories
const categorySelect = document.getElementById('productCategory');
const subcategorySelect = document.getElementById('productSubcategory');
const imageInput = document.getElementById('productImage');
const imagePreview = document.getElementById('imagePreview');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');

// Load categories into the product form dropdown on page load
function loadProductCategoryDropdown() {
    if (!categorySelect) return;
    
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    Object.keys(subcategoryOptions).forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
        categorySelect.appendChild(option);
    });
}

// Call on page load
loadProductCategoryDropdown();

// Compress an image file to a smaller base64 string
function compressImage(file, maxWidth, maxHeight, quality, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            callback(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Handle image upload preview
if (imageInput) {
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Compress to max 600x600 at 75% quality before previewing/saving
            compressImage(file, 600, 600, 0.75, function(compressedData) {
                imagePreview.src = compressedData;
                imagePreviewContainer.style.display = 'block';
            });
        }
    });
}

// Remove image
function removeImage() {
    imageInput.value = '';
    imagePreview.src = '';
    imagePreviewContainer.style.display = 'none';
}

if (categorySelect) {
    categorySelect.addEventListener('change', function() {
        const category = this.value;
        subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>';
        
        if (category && subcategoryOptions[category]) {
            subcategoryOptions[category].forEach(sub => {
                const option = document.createElement('option');
                option.value = sub;
                option.textContent = sub.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
                subcategorySelect.appendChild(option);
            });
        }
    });
}

// Show Add Product Form
function showAddProductForm() {
    document.getElementById('productFormCard').style.display = 'block';
    document.getElementById('categoryManagerCard').style.display = 'none';
    document.getElementById('adminPurchaseHistoryCard').style.display = 'none';
    document.getElementById('formTitle').textContent = 'Add New Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productInStock').checked = true;
    document.getElementById('productStock').value = 0;
    imagePreview.src = '';
    imagePreviewContainer.style.display = 'none';
}

// Hide Product Form
function hideProductForm() {
    document.getElementById('productFormCard').style.display = 'none';
}

// Handle Product Form Submission
const productForm = document.getElementById('productForm');
if (productForm) {
    productForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const productId = document.getElementById('productId').value;
        
        // Get image data if uploaded
        let imageData = null;
        if (imagePreview.src && imagePreview.src !== '') {
            imageData = imagePreview.src; // Base64 encoded image
        }
        
        const productData = {
            id: productId || Date.now(),
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            subcategory: document.getElementById('productSubcategory').value,
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value) || 0,
            icon: document.getElementById('productIcon').value || '📦',
            image: imageData, // Store the image
            description: document.getElementById('productDescription').value,
            inStock: document.getElementById('productInStock').checked
        };
        
        if (productId) {
            // Update existing product
            const index = products.findIndex(p => p.id == productId);
            if (index !== -1) {
                products[index] = productData;
            }
        } else {
            // Add new product
            products.push(productData);
        }
        
        // Save to localStorage
        try {
            localStorage.setItem('adminProducts', JSON.stringify(products));
            updateStoreProducts();
            alert(productId ? 'Product updated successfully!' : 'Product added successfully!');
            hideProductForm();
            loadProducts();
        } catch (err) {
            // Most likely cause: storage full due to large images
            // Remove the product we just added/updated and try saving without the image
            if (productData.image) {
                alert('Could not save product with image — browser storage is full. Saving without image instead. Try using smaller images or deleting unused products.');
                productData.image = null;
                if (productId) {
                    const index = products.findIndex(p => p.id == productId);
                    if (index !== -1) products[index] = productData;
                } else {
                    products[products.length - 1] = productData;
                }
                try {
                    localStorage.setItem('adminProducts', JSON.stringify(products));
                    updateStoreProducts();
                    hideProductForm();
                    loadProducts();
                } catch (err2) {
                    alert('Storage is completely full. Please delete some products before adding new ones.');
                }
            } else {
                alert('Could not save product — browser storage is full. Please delete some products to free up space.');
            }
        }
    });
}

// Update store products (merge with existing products from script.js)
function updateStoreProducts() {
    localStorage.setItem('products', JSON.stringify(products));
}

// Load and display products in table
function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No products yet. Add your first product!</td></tr>';
        return;
    }
    
    tbody.innerHTML = products.map(product => `
        <tr>
            <td>
                ${product.image ? 
                    `<img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">` : 
                    `<span style="font-size: 2rem;">${product.icon}</span>`
                }
            </td>
            <td><strong>${product.name}</strong></td>
            <td>${product.category.toUpperCase()}<br><small>${product.subcategory}</small></td>
            <td>$${product.price.toFixed(2)}</td>
            <td>
                <span class="status-badge ${product.inStock ? 'in-stock' : 'out-of-stock'}">
                    ${product.inStock ? '✓ In Stock (' + product.stock + ')' : '✗ Out of Stock'}
                </span>
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="editProduct(${product.id})">Edit</button>
                <button class="action-btn delete-btn" onclick="deleteProduct(${product.id})">Delete</button>
                <button class="action-btn stock-btn" onclick="updateStock(${product.id})">Update Stock</button>
            </td>
        </tr>
    `).join('');
}

// Edit Product
function editProduct(id) {
    const product = products.find(p => p.id == id);
    if (!product) return;
    
    document.getElementById('productFormCard').style.display = 'block';
    document.getElementById('categoryManagerCard').style.display = 'none';
    document.getElementById('adminPurchaseHistoryCard').style.display = 'none';
    document.getElementById('formTitle').textContent = 'Edit Product';
    
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    
    // Trigger category change to load subcategories
    categorySelect.dispatchEvent(new Event('change'));
    
    setTimeout(() => {
        document.getElementById('productSubcategory').value = product.subcategory;
    }, 100);
    
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock || 0;
    document.getElementById('productIcon').value = product.icon;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productInStock').checked = product.inStock;
    
    // Load image preview if exists
    if (product.image) {
        imagePreview.src = product.image;
        imagePreviewContainer.style.display = 'block';
    } else {
        imagePreview.src = '';
        imagePreviewContainer.style.display = 'none';
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Delete Product
function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    products = products.filter(p => p.id != id);
    localStorage.setItem('adminProducts', JSON.stringify(products));
    updateStoreProducts();
    loadProducts();
    alert('Product deleted successfully!');
}

// Toggle Stock Status
function toggleStock(id) {
    const product = products.find(p => p.id == id);
    if (!product) return;
    
    product.inStock = !product.inStock;
    localStorage.setItem('adminProducts', JSON.stringify(products));
    updateStoreProducts();
    loadProducts();
}

// Update Stock Quantity
function updateStock(id) {
    const product = products.find(p => p.id == id);
    if (!product) return;
    
    const newStock = prompt(`Enter new stock quantity for "${product.name}":`, product.stock || 0);
    
    if (newStock === null) return; // Cancelled
    
    const stockNum = parseInt(newStock);
    if (isNaN(stockNum) || stockNum < 0) {
        alert('Please enter a valid stock number (0 or greater)');
        return;
    }
    
    product.stock = stockNum;
    product.inStock = stockNum > 0;
    
    localStorage.setItem('adminProducts', JSON.stringify(products));
    updateStoreProducts();
    loadProducts();
    alert(`Stock updated to ${stockNum} for ${product.name}`);
}

// Logout
function adminLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminLoggedIn');
        window.location.href = 'admin-login.html';
    }
}

// Category Manager Functions
function showCategoryManager() {
    document.getElementById('categoryManagerCard').style.display = 'block';
    document.getElementById('productFormCard').style.display = 'none';
    document.getElementById('adminPurchaseHistoryCard').style.display = 'none';
    loadCategorySelector();
    displayCurrentCategories();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideCategoryManager() {
    document.getElementById('categoryManagerCard').style.display = 'none';
}

function loadCategorySelector() {
    const selector = document.getElementById('subcatCategory');
    if (!selector) return;
    
    selector.innerHTML = '<option value="">Select Category</option>';
    Object.keys(subcategoryOptions).forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
        selector.appendChild(option);
    });
}

function addNewCategory() {
    const categoryId = document.getElementById('newCategoryId').value.trim().toLowerCase();
    const categoryName = document.getElementById('newCategoryName').value.trim();
    
    if (!categoryId || !categoryName) {
        alert('Please fill in both fields!');
        return;
    }
    
    if (subcategoryOptions[categoryId]) {
        alert('This category already exists!');
        return;
    }
    
    subcategoryOptions[categoryId] = [];
    saveCategories();
    
    alert(`Category "${categoryName}" added successfully!`);
    document.getElementById('newCategoryId').value = '';
    document.getElementById('newCategoryName').value = '';
    loadCategorySelector();
    displayCurrentCategories();
    
    // Reload the page to update navigation
    setTimeout(() => {
        alert('Category added! The page will reload to update the navigation.');
        window.location.reload();
    }, 1000);
}

function addNewSubcategory() {
    const category = document.getElementById('subcatCategory').value;
    const subcatId = document.getElementById('newSubcategoryId').value.trim().toLowerCase().replace(/\s+/g, '-');
    const subcatName = document.getElementById('newSubcategoryName').value.trim();
    
    if (!category || !subcatId || !subcatName) {
        alert('Please fill in all fields!');
        return;
    }
    
    if (!subcategoryOptions[category]) {
        alert('Category not found!');
        return;
    }
    
    if (subcategoryOptions[category].includes(subcatId)) {
        alert('This subcategory already exists in this category!');
        return;
    }
    
    subcategoryOptions[category].push(subcatId);
    saveCategories();
    
    alert(`Subcategory "${subcatName}" added to ${category}!`);
    document.getElementById('newSubcategoryId').value = '';
    document.getElementById('newSubcategoryName').value = '';
    displayCurrentCategories();
}

function deleteCategory(catId) {
    if (!confirm(`Are you sure you want to delete the category "${catId}" and all its products?`)) {
        return;
    }
    
    // Remove category
    delete subcategoryOptions[catId];
    saveCategories();
    
    // Remove all products in this category
    products = products.filter(p => p.category !== catId);
    localStorage.setItem('adminProducts', JSON.stringify(products));
    updateStoreProducts();
    
    alert('Category deleted successfully!');
    loadCategorySelector();
    displayCurrentCategories();
    loadProducts();
}

function deleteSubcategory(catId, subcatId) {
    if (!confirm(`Are you sure you want to delete the subcategory "${subcatId}"?`)) {
        return;
    }
    
    // Remove subcategory
    subcategoryOptions[catId] = subcategoryOptions[catId].filter(s => s !== subcatId);
    saveCategories();
    
    alert('Subcategory deleted successfully!');
    displayCurrentCategories();
}

function displayCurrentCategories() {
    const display = document.getElementById('categoriesDisplay');
    let html = '';
    
    Object.keys(subcategoryOptions).forEach(cat => {
        html += `
            <div style="background: #f9f9f9; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 2px solid #ffffe0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <h4 style="color: #dc143c;">${cat.charAt(0).toUpperCase() + cat.slice(1)}</h4>
                    <button onclick="deleteCategory('${cat}')" style="padding: 0.3rem 0.8rem; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.85rem;">Delete Category</button>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${subcategoryOptions[cat].map(sub => `
                        <span style="background: white; padding: 0.4rem 0.8rem; border-radius: 5px; border: 1px solid #ddd; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem;">
                            ${sub.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            <button onclick="deleteSubcategory('${cat}', '${sub}')" style="background: #dc3545; color: white; border: none; border-radius: 3px; padding: 0.2rem 0.4rem; cursor: pointer; font-size: 0.75rem;">✕</button>
                        </span>
                    `).join('')}
                    ${subcategoryOptions[cat].length === 0 ? '<span style="color: #666; font-size: 0.9rem;">No subcategories yet</span>' : ''}
                </div>
            </div>
        `;
    });
    
    display.innerHTML = html;
}

// Admin Purchase History Functions - FIXED VERSION
function showPurchaseHistory() {
    document.getElementById('adminPurchaseHistoryCard').style.display = 'block';
    document.getElementById('productFormCard').style.display = 'none';
    document.getElementById('categoryManagerCard').style.display = 'none';
    loadAdminPurchaseHistory();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideAdminPurchaseHistory() {
    document.getElementById('adminPurchaseHistoryCard').style.display = 'none';
}

function loadAdminPurchaseHistory() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const ordersDisplay = document.getElementById('adminOrdersDisplay');
    
    if (orders.length === 0) {
        ordersDisplay.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No orders yet.</p>';
        document.getElementById('totalOrders').textContent = '0';
        document.getElementById('totalRevenue').textContent = '$0.00';
        document.getElementById('totalCustomers').textContent = '0';
        return;
    }
    
    // Calculate stats
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const uniqueCustomers = new Set(orders.map(order => order.userEmail || 'guest')).size;
    
    document.getElementById('totalOrders').textContent = orders.length;
    document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
    document.getElementById('totalCustomers').textContent = uniqueCustomers;
    
    // Display orders (newest first)
    ordersDisplay.innerHTML = orders.slice().reverse().map(order => {
        const orderDate = new Date(order.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const customerDisplay = order.userEmail === 'guest' 
            ? `Guest Order ${order.guestEmail ? '(' + order.guestEmail + ')' : ''}` 
            : order.userEmail;
        
        const statusInfo = getOrderStatusInfo(order.status || 'Processing');
        
        return `
            <div class="order-item">
                <div class="order-header">
                    <div>
                        <div class="order-number">Order #${order.orderNumber}</div>
                        <div class="order-date">${orderDate}</div>
                        <div style="margin-top: 0.5rem; font-weight: 600; color: #007bff;">
                            Customer: ${customerDisplay}
                        </div>
                    </div>
                    <div class="order-status">
                        <div style="margin-bottom: 0.5rem;">
                            <span class="status-badge" style="background: ${statusInfo.color}; color: white; padding: 0.5rem 1rem; border-radius: 5px; font-weight: 600;">
                                ${statusInfo.icon} ${order.status || 'Processing'}
                            </span>
                        </div>
                        <div>
                            <select onchange="updateOrderStatus('${order.orderNumber}', this.value)" style="padding: 0.4rem; border-radius: 5px; border: 2px solid #ffffe0; font-weight: 600;">
                                <option value="">Change Status</option>
                                <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                                <option value="Confirmed" ${order.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                                <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                                <option value="Out for Delivery" ${order.status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
                                <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                                <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="order-products">
                    ${order.items.map(item => `
                        <div class="order-product-item">
                            <span><strong>${item.name}</strong> × ${item.quantity}</span>
                            <span>$${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #ffffe0;">
                    <div>
                        <strong>Shipping Address:</strong><br>
                        ${order.shipping.fullName}<br>
                        ${order.shipping.address}<br>
                        ${order.shipping.city}${order.shipping.state ? ', ' + order.shipping.state : ''} ${order.shipping.zip}<br>
                        ${order.shipping.country}<br>
                        Phone: ${order.shipping.phone}
                    </div>
                    <div>
                        <div style="text-align: right;">
                            <div style="margin-bottom: 0.5rem;">Subtotal: $${order.subtotal.toFixed(2)}</div>
                            <div style="margin-bottom: 0.5rem;">Shipping: $${order.shippingCost.toFixed(2)}</div>
                            <div style="margin-bottom: 0.5rem;">Tax: $${order.tax.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
                <div class="order-total">
                    Total: $${order.total.toFixed(2)}
                </div>
            </div>
        `;
    }).join('');
}

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

function updateOrderStatus(orderNumber, newStatus) {
    if (!newStatus) return;
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.orderNumber === orderNumber);
    
    if (order) {
        order.status = newStatus;
        
        // Add tracking number if shipped
        if (newStatus === 'Shipped' && !order.trackingNumber) {
            order.trackingNumber = `TRK${Date.now().toString().slice(-8)}`;
            
            // Add estimated delivery (5-7 business days)
            const deliveryDate = new Date();
            deliveryDate.setDate(deliveryDate.getDate() + 6);
            order.estimatedDelivery = deliveryDate.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
            });
        }
        
        localStorage.setItem('orders', JSON.stringify(orders));
        loadAdminPurchaseHistory(); // Refresh display
        alert(`Order ${orderNumber} status updated to: ${newStatus}`);
    }
}

// Initialize on page load
loadProducts();