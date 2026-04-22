// Default admin credentials (in real app, this would be in a secure database)
const ADMIN_CREDENTIALS = {
    email: 'admin@collectorsshack.com',
    password: 'admin123'
};

// Handle Admin Login
const adminLoginForm = document.getElementById('adminLoginForm');
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        
        // Check credentials
        if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
            // Save admin session
            localStorage.setItem('adminLoggedIn', 'true');
            alert('Admin login successful!');
            window.location.href = 'admin-panel.html';
        } else {
            alert('Invalid admin credentials!');
        }
    });
}