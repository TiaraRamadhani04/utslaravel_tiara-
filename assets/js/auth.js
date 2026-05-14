// Authentication functions
const Auth = {
    login: async (email, password) => {
        const response = await apiCall('auth.php?action=login', 'POST', {
            email: email,
            password: password
        });

        if (response.data.success) {
            TokenManager.set(response.data.token);
            UserManager.set(response.data.user);
            return { success: true, message: 'Login berhasil' };
        } else {
            return { success: false, message: response.data.message };
        }
    },

    register: async (email, username, password, nama_lengkap) => {
        const response = await apiCall('auth.php?action=register', 'POST', {
            email: email,
            username: username,
            password: password,
            nama_lengkap: nama_lengkap
        });

        return {
            success: response.data.success,
            message: response.data.message
        };
    },

    logout: () => {
        TokenManager.remove();
        UserManager.remove();
        window.location.href = 'login.html';
    },

    isAuthenticated: () => {
        return TokenManager.exists();
    }
};

// Login page logic
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('loginBtn');
        const btnText = document.getElementById('btnText');
        const btnLoader = document.getElementById('btnLoader');

        if (!email || !password) {
            showAlert('Email dan password harus diisi', 'danger');
            return;
        }

        // Show loading state
        if (btn) btn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoader) btnLoader.style.display = 'inline-block';

        const result = await Auth.login(email, password);
        
        if (result.success) {
            showAlert(result.message, 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showAlert(result.message, 'danger');
            // Reset button state
            if (btn) btn.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoader) btnLoader.style.display = 'none';
        }
    });
}

// Check if logged in
if (document.getElementById('dashboardContainer')) {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
    }
}

// Show user info on dashboard
window.addEventListener('load', () => {
    const user = UserManager.get();
    if (user && document.getElementById('userName')) {
        document.getElementById('userName').textContent = user.nama_lengkap || user.username;
        document.getElementById('userRole').textContent = user.role === 'admin' ? 'Admin' : 'Input User';
    }
});
