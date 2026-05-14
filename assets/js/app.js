// API Base URL
const API_BASE_URL = 'http://localhost/latihan1/api/';

// Token management
const TokenManager = {
    set: (token) => localStorage.setItem('auth_token', token),
    get: () => localStorage.getItem('auth_token'),
    remove: () => localStorage.removeItem('auth_token'),
    exists: () => !!localStorage.getItem('auth_token')
};

// User management
const UserManager = {
    set: (user) => localStorage.setItem('current_user', JSON.stringify(user)),
    get: () => {
        const user = localStorage.getItem('current_user');
        return user ? JSON.parse(user) : null;
    },
    remove: () => localStorage.removeItem('current_user')
};

// API Helper
const apiCall = async (endpoint, method = 'GET', data = null) => {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + TokenManager.get()
        }
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(API_BASE_URL + endpoint, options);
        const result = await response.json();

        if (response.status === 401) {
            // Token invalid/expired
            TokenManager.remove();
            UserManager.remove();
            window.location.href = 'login.html';
        }

        return {
            status: response.status,
            data: result
        };
    } catch (error) {
        console.error('API Error:', error);
        return {
            status: 500,
            data: { success: false, message: 'Terjadi kesalahan koneksi' }
        };
    }
};

// Show alert
const showAlert = (message, type = 'danger') => {
    const alertEl = document.getElementById('alert');
    if (!alertEl) return;
    
    alertEl.className = 'alert show alert-' + type;
    alertEl.innerHTML = message;
    
    setTimeout(() => {
        alertEl.classList.remove('show');
    }, 4000);
};

// Show modal
const showModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
};

// Hide modal
const hideModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
};

// Format currency (Rupiah)
const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
};

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal.show');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    });
});

// Close modal with close button
document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.modal').classList.remove('show');
    });
});
