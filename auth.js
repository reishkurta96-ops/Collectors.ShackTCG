// Handle Signup
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const phone = document.getElementById('phone').value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        
        // Check if user already exists
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const existingUser = users.find(u => u.email === email);
        
        if (existingUser) {
            alert('An account with this email already exists!');
            return;
        }
        
        // Create new user
        const newUser = {
            fullName,
            email,
            password, // In real app, this would be encrypted!
            phone,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        alert('Account created successfully! Please login.');
        window.location.href = 'login.html';
    });
}

// Handle Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // Check if it's admin login
        if (email === 'admin@collectorsshack.com' && password === 'admin123') {
            localStorage.setItem('adminLoggedIn', 'true');
            alert('Admin login successful!');
            window.location.href = 'admin-panel.html';
            return;
        }
        
        // Get users from storage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Save logged in user
            localStorage.setItem('currentUser', JSON.stringify(user));
            alert('Login successful!');
            window.location.href = 'products.html';
        } else {
            alert('Invalid email or password!');
        }
    });
}

// Check if user is logged in (for all pages)
function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    alert('Logged out successfully!');
    window.location.href = 'index.html';
}