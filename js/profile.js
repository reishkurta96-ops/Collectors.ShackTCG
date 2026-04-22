// Check if user is logged in
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) {
    alert('Please login to view your profile!');
    window.location.href = 'login.html';
}

// Load user data
function loadUserData() {
    if (!currentUser) return;
    
    document.getElementById('fullName').value = currentUser.fullName || '';
    document.getElementById('email').value = currentUser.email || '';
    document.getElementById('phone').value = currentUser.phone || '';
    
    // Load profile picture
    if (currentUser.profilePicture) {
        document.getElementById('profilePicPreview').src = currentUser.profilePicture;
    }
    
    // Update user name display
    const userName = document.getElementById('userName');
    if (userName) {
        userName.textContent = `Hi, ${currentUser.fullName.split(' ')[0]}!`;
    }
    
    // Load cart count
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    }
}

// Compress an image file to a smaller base64 string
function compressImage(file, maxWidth, maxHeight, quality, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Scale down proportionally if needed
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

// Handle profile picture upload
const profilePictureInput = document.getElementById('profilePicture');
if (profilePictureInput) {
    profilePictureInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Compress to max 300x300 at 70% quality before saving
        compressImage(file, 300, 300, 0.7, function(compressedData) {
            document.getElementById('profilePicPreview').src = compressedData;

            try {
                currentUser.profilePicture = compressedData;
                updateUserInStorage();
                alert('Profile picture updated!');
            } catch (err) {
                // Revert preview on failure
                document.getElementById('profilePicPreview').src = currentUser.profilePicture || '';
                currentUser.profilePicture = currentUser.profilePicture || null;
                alert('Could not save profile picture — browser storage is full. Try using a smaller image.');
            }
        });
    });
}

// Remove profile picture
function removeProfilePicture() {
    if (confirm('Are you sure you want to remove your profile picture?')) {
        currentUser.profilePicture = null;
        updateUserInStorage();
        document.getElementById('profilePicPreview').src = '';
        alert('Profile picture removed!');
    }
}

// Handle profile form submission
const profileForm = document.getElementById('profileForm');
if (profileForm) {
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newName = document.getElementById('fullName').value;
        const newEmail = document.getElementById('email').value;
        const newPhone = document.getElementById('phone').value;
        
        // Check if email is already taken by another user
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const emailTaken = users.find(u => u.email === newEmail && u.email !== currentUser.email);
        
        if (emailTaken) {
            alert('This email is already in use by another account!');
            return;
        }
        
        // Update current user
        currentUser.fullName = newName;
        currentUser.email = newEmail;
        currentUser.phone = newPhone;
        
        updateUserInStorage();
        alert('Profile updated successfully!');
    });
}

// Handle password change
const passwordForm = document.getElementById('passwordForm');
if (passwordForm) {
    passwordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        
        // Verify current password
        if (currentPassword !== currentUser.password) {
            alert('Current password is incorrect!');
            return;
        }
        
        // Check if new passwords match
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match!');
            return;
        }
        
        // Update password
        currentUser.password = newPassword;
        updateUserInStorage();
        
        alert('Password changed successfully!');
        passwordForm.reset();
    });
}

// Update user in localStorage
function updateUserInStorage() {
    // Store the original email before any changes (used as lookup key)
    const originalEmail = JSON.parse(localStorage.getItem('currentUser'))?.email;

    // Update current user session
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Update in users array using the original email as the key
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.email === (originalEmail || currentUser.email));
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        alert('Logged out successfully!');
        window.location.href = 'index.html';
    }
}

// Toggle user dropdown menu
function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const userDropdown = document.querySelector('.user-dropdown');
    const userMenu = document.getElementById('userMenu');
    
    if (userDropdown && userMenu && !userDropdown.contains(event.target)) {
        userMenu.classList.remove('active');
    }
});

// Initialize
loadUserData();