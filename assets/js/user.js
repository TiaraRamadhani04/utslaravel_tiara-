// User Management
let currentEditingUserId = null;

/**
 * Load user list
 */
const loadUserList = async () => {
    try {
        const response = await apiCall('user.php?path=users');
        
        if (response.status === 200 && response.data.success) {
            const users = response.data.data;
            renderUserTable(users);
        } else {
            showAlert(response.data.message || 'Gagal memuat data user', 'danger');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showAlert('Terjadi kesalahan saat memuat data user', 'danger');
    }
};

/**
 * Render user table
 */
const renderUserTable = (users) => {
    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Tidak ada data user</td></tr>';
        return;
    }

    tbody.innerHTML = users.map((user, index) => {
        const createdAt = new Date(user.created_at).toLocaleDateString('id-ID');
        const statusBadge = `<span class="badge badge-${user.status === 'aktif' ? 'success' : 'danger'}">${user.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</span>`;
        const roleBadge = `<span class="badge badge-${user.role === 'admin' ? 'warning' : 'info'}">${user.role === 'admin' ? 'Admin' : 'Input'}</span>`;
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.nama_lengkap}</td>
                <td>${roleBadge}</td>
                <td>${statusBadge}</td>
                <td>${createdAt}</td>
                <td>
                    <button class="btn-sm btn-edit" onclick="editUser(${user.id})">✏️ Edit</button>
                    <button class="btn-sm btn-delete" onclick="deleteUser(${user.id}, '${user.username}')">🗑️ Hapus</button>
                </td>
            </tr>
        `;
    }).join('');
};

/**
 * Show add user modal
 */
const showAddUserModal = () => {
    currentEditingUserId = null;
    document.getElementById('userModalTitle').textContent = 'Tambah User Baru';
    document.getElementById('userForm').reset();
    document.getElementById('userPassword').setAttribute('required', 'required');
    document.getElementById('userPassword').placeholder = 'Masukkan password';
    showModal('userModal');
};

/**
 * Edit user
 */
const editUser = async (userId) => {
    try {
        const response = await apiCall(`user.php?path=users/${userId}`);
        
        if (response.status === 200 && response.data.success) {
            const user = response.data.data;
            currentEditingUserId = userId;
            
            document.getElementById('userModalTitle').textContent = `Edit User - ${user.username}`;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userUsername').value = user.username;
            document.getElementById('userNamaLengkap').value = user.nama_lengkap;
            document.getElementById('userRole').value = user.role;
            document.getElementById('userStatus').value = user.status;
            
            // Password tidak required saat edit
            document.getElementById('userPassword').removeAttribute('required');
            document.getElementById('userPassword').value = '';
            document.getElementById('userPassword').placeholder = 'Kosongkan jika tidak ingin mengubah password';
            
            showModal('userModal');
        } else {
            showAlert(response.data.message || 'Gagal memuat data user', 'danger');
        }
    } catch (error) {
        console.error('Error loading user:', error);
        showAlert('Terjadi kesalahan saat memuat data user', 'danger');
    }
};

/**
 * Delete user
 */
const deleteUser = (userId, username) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus user "${username}"? Data barang yang dibuat oleh user ini juga akan dihapus.`)) {
        return;
    }

    deleteUserConfirmed(userId);
};

/**
 * Delete user confirmed
 */
const deleteUserConfirmed = async (userId) => {
    try {
        const response = await apiCall(`user.php?path=users/${userId}`, 'DELETE');
        
        if (response.status === 200 && response.data.success) {
            showAlert('User berhasil dihapus', 'success');
            loadUserList();
        } else {
            showAlert(response.data.message || 'Gagal menghapus user', 'danger');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showAlert('Terjadi kesalahan saat menghapus user', 'danger');
    }
};

/**
 * Save user (add or edit)
 */
const saveUser = async (formData) => {
    try {
        const userData = {
            email: formData.get('email'),
            username: formData.get('username'),
            nama_lengkap: formData.get('nama_lengkap'),
            role: formData.get('role'),
            status: formData.get('status')
        };

        // Include password jika tidak kosong
        const password = formData.get('password');
        if (password) {
            userData.password = password;
        }

        let response;
        if (currentEditingUserId) {
            // Update user
            response = await apiCall(`user.php?path=users/${currentEditingUserId}`, 'PUT', userData);
        } else {
            // Create user - password required
            if (!password) {
                showAlert('Password harus diisi saat membuat user baru', 'danger');
                return;
            }
            userData.password = password;
            response = await apiCall('user.php?path=users', 'POST', userData);
        }

        if ((response.status === 200 || response.status === 201) && response.data.success) {
            showAlert(response.data.message || 'User berhasil disimpan', 'success');
            hideModal('userModal');
            loadUserList();
        } else {
            showAlert(response.data.message || 'Gagal menyimpan user', 'danger');
        }
    } catch (error) {
        console.error('Error saving user:', error);
        showAlert('Terjadi kesalahan saat menyimpan user', 'danger');
    }
};

/**
 * Search users
 */
const searchUsers = async (keyword) => {
    try {
        const response = await apiCall('user.php?path=users');
        
        if (response.status === 200 && response.data.success) {
            let users = response.data.data;
            
            if (keyword.trim()) {
                keyword = keyword.toLowerCase();
                users = users.filter(user => 
                    user.username.toLowerCase().includes(keyword) ||
                    user.email.toLowerCase().includes(keyword) ||
                    user.nama_lengkap.toLowerCase().includes(keyword)
                );
            }
            
            renderUserTable(users);
        }
    } catch (error) {
        console.error('Error searching users:', error);
    }
};

// Event listeners - wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Add user button
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', showAddUserModal);
    }

    // User form submit
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(userForm);
            saveUser(formData);
        });
    }

    // Close modal buttons
    const userModal = document.getElementById('userModal');
    if (userModal) {
        const closeButtons = userModal.querySelectorAll('.close-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => hideModal('userModal'));
        });
    }

    // Search user input
    const searchUserInput = document.getElementById('searchUserInput');
    if (searchUserInput) {
        searchUserInput.addEventListener('keyup', (e) => {
            searchUsers(e.target.value);
        });
    }

    // Load user list on page load for admin
    const user = UserManager.get();
    if (user && user.role === 'admin') {
        loadUserList();
    }
});
