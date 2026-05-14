/**
 * CRUD OPERATIONS MANAGER
 * Full admin access untuk semua data tabel dengan smooth transitions
 */

// ============================================
// ADMIN DASHBOARD INITIALIZATION
// ============================================

let currentModule = 'barang'; // Current module: barang, user, dll
let currentEditingId = null;
let currentEditingType = null;

const adminDashboard = {
    init: async () => {
        const user = UserManager.get();
        
        if (!user || user.role !== 'admin') {
            window.location.href = 'login.html';
            return;
        }

        // Setup event listeners
        adminDashboard.setupEventListeners();
        
        // Load initial data
        await loadBarangData();
        
        console.log('✅ Admin Dashboard initialized');
    },

    setupEventListeners: () => {
        // Module switcher
        document.querySelectorAll('[data-module]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const module = btn.getAttribute('data-module');
                await adminDashboard.switchModule(module);
            });
        });

        // Modal close buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) animateModalClose(modal);
            });
        });

        // Modal background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) animateModalClose(modal);
            });
        });

        // Auto-animate on page load
        setTimeout(() => {
            AnimationManager.fadeIn(document.querySelector('.dashboard-container'));
        }, 100);
    },

    switchModule: async (module) => {
        currentModule = module;
        
        // Animate transition
        const container = document.querySelector('.dashboard-container');
        await AnimationManager.fadeOut(container, 300);
        
        // Load appropriate data
        switch(module) {
            case 'barang':
                await loadBarangData();
                break;
            case 'user':
                await loadUserList();
                break;
            case 'dashboard':
                await loadDashboardStats();
                break;
        }
        
        await AnimationManager.fadeIn(container, 300);
    }
};

// ============================================
// BARANG CRUD OPERATIONS
// ============================================

const BarangCRUD = {
    // CREATE
    create: async (data) => {
        try {
            AnimationManager.pulse(document.querySelector('.btn-primary'));
            
            const response = await apiCall('barang.php?action=create', 'POST', data);
            
            if (response.status === 201 && response.data.success) {
                showAlert('✅ Barang berhasil ditambahkan!', 'success');
                hideModal('barangModal');
                await loadBarangData();
            } else {
                showAlert(response.data.message || 'Gagal menambahkan barang', 'danger');
            }
        } catch (error) {
            console.error('Error creating barang:', error);
            showAlert('Terjadi kesalahan saat menambahkan barang', 'danger');
        }
    },

    // READ (sudah ada di barang.js)
    getAll: async () => {
        try {
            const response = await apiCall('barang.php?action=list');
            if (response.status === 200 && response.data.success) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching barang:', error);
            return [];
        }
    },

    // UPDATE
    update: async (id, data) => {
        try {
            const response = await apiCall('barang.php', 'PUT', { ...data, id });
            
            if (response.status === 200 && response.data.success) {
                showAlert('✅ Barang berhasil diupdate!', 'success');
                hideModal('barangModal');
                await loadBarangData();
            } else {
                showAlert(response.data.message || 'Gagal mengupdate barang', 'danger');
            }
        } catch (error) {
            console.error('Error updating barang:', error);
            showAlert('Terjadi kesalahan saat mengupdate barang', 'danger');
        }
    },

    // DELETE
    delete: async (id, kode) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus barang "${kode}"?`)) {
            return;
        }

        try {            
            const response = await apiCall('barang.php', 'DELETE', { id });
            
            if (response.status === 200 && response.data.success) {
                showAlert('✅ Barang berhasil dihapus!', 'success');
                await loadBarangData();
            } else {
                showAlert(response.data.message || 'Gagal menghapus barang', 'danger');
            }
        } catch (error) {
            console.error('Error deleting barang:', error);
            showAlert('Terjadi kesalahan saat menghapus barang', 'danger');
        }
    }
};

// ============================================
// USER CRUD OPERATIONS (ENHANCED)
// ============================================

const UserCRUD = {
    // CREATE
    create: async (data) => {
        try {
            const response = await apiCall('user.php?path=users', 'POST', data);
            
            if (response.status === 201 && response.data.success) {
                showAlert('✅ User berhasil ditambahkan!', 'success');
                hideModal('userModal');
                await loadUserList();
            } else {
                showAlert(response.data.message || 'Gagal menambahkan user', 'danger');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            showAlert('Terjadi kesalahan saat menambahkan user', 'danger');
        }
    },

    // READ
    getAll: async () => {
        try {
            const response = await apiCall('user.php?path=users');
            if (response.status === 200 && response.data.success) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    },

    // UPDATE
    update: async (id, data) => {
        try {
            const response = await apiCall('user.php?path=users', 'PUT', { ...data, id });
            
            if (response.status === 200 && response.data.success) {
                showAlert('✅ User berhasil diupdate!', 'success');
                hideModal('userModal');
                await loadUserList();
            } else {
                showAlert(response.data.message || 'Gagal mengupdate user', 'danger');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            showAlert('Terjadi kesalahan saat mengupdate user', 'danger');
        }
    },

    // DELETE
    delete: async (id, username) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus user "${username}"?`)) {
            return;
        }

        try {
            const response = await apiCall('user.php?path=users', 'DELETE', { id });
            
            if (response.status === 200 && response.data.success) {
                showAlert('✅ User berhasil dihapus!', 'success');
                await loadUserList();
            } else {
                showAlert(response.data.message || 'Gagal menghapus user', 'danger');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            showAlert('Terjadi kesalahan saat menghapus user', 'danger');
        }
    }
};

// ============================================
// ENHANCED TABLE RENDERING
// ============================================

const renderAdvancedTable = (data, columns, actions) => {
    if (data.length === 0) {
        return `
            <tr>
                <td colspan="${columns.length + 1}" class="text-center" style="padding: 40px;">
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <p>Tidak ada data ditemukan</p>
                    </div>
                </td>
            </tr>
        `;
    }

    return data.map((row, index) => {
        const actionButtons = actions.map(action => 
            `<button class="btn-sm btn-${action.type}" onclick="${action.handler}(${row.id})">${action.icon} ${action.label}</button>`
        ).join('');

        return `
            <tr data-row-index="${index}" style="animation-delay: ${index * 50}ms;">
                <td>${index + 1}</td>
                ${columns.map(col => `<td>${formatCellValue(row[col.key], col.type)}</td>`).join('')}
                <td>${actionButtons}</td>
            </tr>
        `;
    }).join('');
};

const formatCellValue = (value, type) => {
    switch(type) {
        case 'currency':
            return formatCurrency(value);
        case 'date':
            return new Date(value).toLocaleDateString('id-ID');
        case 'badge':
            const statusClass = value === 'aktif' ? 'success' : 'danger';
            return `<span class="badge badge-${statusClass}">${value}</span>`;
        case 'badge-role':
            const roleClass = value === 'admin' ? 'warning' : 'info';
            return `<span class="badge badge-${roleClass}">${value === 'admin' ? 'Admin' : 'Input'}</span>`;
        default:
            return value || '-';
    }
};

const loadUserList = async () => {
    try {
        const users = await UserCRUD.getAll();
        
        const columns = [
            { key: 'username', label: 'Username' },
            { key: 'email', label: 'Email' },
            { key: 'nama_lengkap', label: 'Nama Lengkap' },
            { key: 'role', label: 'Role', type: 'badge-role' },
            { key: 'status', label: 'Status', type: 'badge' },
            { key: 'created_at', label: 'Dibuat', type: 'date' }
        ];

        const actions = [
            { type: 'edit', icon: '✏️', label: 'Edit', handler: 'editUser' },
            { type: 'delete', icon: '🗑️', label: 'Hapus', handler: 'deleteUser' }
        ];

        const tbody = document.getElementById('userTableBody');
        if (tbody) {
            tbody.innerHTML = renderAdvancedTable(users, columns, actions);
            animateTableRows(tbody);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
};

const loadDashboardStats = async () => {
    try {
        const [barangList, userList] = await Promise.all([
            BarangCRUD.getAll(),
            UserCRUD.getAll()
        ]);

        const totalStok = barangList.reduce((sum, item) => sum + (parseInt(item.stok) || 0), 0);
        const categories = [...new Set(barangList.map(b => b.kategori).filter(Boolean))];

        document.getElementById('statTotalBarang').textContent = barangList.length;
        document.getElementById('statTotalStok').textContent = totalStok;
        document.getElementById('statTotalKategori').textContent = categories.length;

        // Animate counters
        animateCounter(document.getElementById('statTotalBarang'), barangList.length);
        animateCounter(document.getElementById('statTotalStok'), totalStok);
        animateCounter(document.getElementById('statTotalKategori'), categories.length);

    } catch (error) {
        console.error('Error loading stats:', error);
    }
};

const loadBarangData = async () => {
    try {
        const barangList = await BarangCRUD.getAll();
        
        const columns = [
            { key: 'kode', label: 'Kode' },
            { key: 'nama', label: 'Nama' },
            { key: 'satuan', label: 'Satuan' },
            { key: 'harga', label: 'Harga', type: 'currency' },
            { key: 'stok', label: 'Stok' },
            { key: 'kategori', label: 'Kategori' },
            { key: 'deskripsi', label: 'Deskripsi' }
        ];

        const actions = [
            { type: 'edit', icon: '✏️', label: 'Edit', handler: 'editBarang' },
            { type: 'delete', icon: '🗑️', label: 'Hapus', handler: 'deleteBarang' }
        ];

        const tbody = document.querySelector('table tbody');
        if (tbody) {
            tbody.innerHTML = renderAdvancedTable(barangList, columns, actions);
            animateTableRows(tbody);
        }
    } catch (error) {
        console.error('Error loading barang:', error);
    }
};

// ============================================
// GLOBAL CRUD FUNCTIONS (for table actions)
// ============================================

// Barang CRUD functions for table actions
window.editBarang = async (id) => {
    try {
        const response = await apiCall(`barang.php?id=${id}`, 'GET');
        
        if (response.status === 200 && response.data.success) {
            const item = response.data.data;
            
            // Populate form
            document.getElementById('kode').value = item.kode;
            document.getElementById('nama').value = item.nama;
            document.getElementById('satuan').value = item.satuan;
            document.getElementById('harga').value = item.harga;
            document.getElementById('stok').value = item.stok;
            document.getElementById('kategori').value = item.kategori || '';
            document.getElementById('deskripsi').value = item.deskripsi || '';
            
            // Set editing state
            currentEditingId = id;
            currentEditingType = 'barang';
            
            // Update modal title
            const modal = document.getElementById('barangModal');
            const titleEl = modal.querySelector('.modal-header h4');
            titleEl.textContent = 'Edit Barang';
            
            // Show modal
            animateModalOpen(modal);
        } else {
            showAlert('Gagal memuat data barang', 'danger');
        }
    } catch (error) {
        console.error('Error loading barang for edit:', error);
        showAlert('Terjadi kesalahan saat memuat data', 'danger');
    }
};

window.deleteBarang = async (id) => {
    try {
        // Get barang info for confirmation
        const response = await apiCall(`barang.php?id=${id}`, 'GET');
        
        if (response.status === 200 && response.data.success) {
            const item = response.data.data;
            await BarangCRUD.delete(id, item.kode);
        } else {
            showAlert('Gagal memuat data barang', 'danger');
        }
    } catch (error) {
        console.error('Error loading barang for delete:', error);
        showAlert('Terjadi kesalahan saat menghapus', 'danger');
    }
};

// User CRUD functions for table actions
window.editUser = async (id) => {
    try {
        const response = await apiCall('user.php?path=users', 'GET');
        
        if (response.status === 200 && response.data.success) {
            const users = response.data.data;
            const user = users.find(u => u.id == id);
            
            if (user) {
                // Populate form
                document.getElementById('userEmail').value = user.email;
                document.getElementById('userUsername').value = user.username;
                document.getElementById('userNamaLengkap').value = user.nama_lengkap;
                document.getElementById('userRole').value = user.role;
                document.getElementById('userStatus').value = user.status;
                
                // Set editing state
                currentEditingId = id;
                currentEditingType = 'user';
                
                // Update modal title
                const modal = document.getElementById('userModal');
                const titleEl = modal.querySelector('.modal-header h4');
                titleEl.textContent = 'Edit User';
                
                // Show modal
                animateModalOpen(modal);
            } else {
                showAlert('User tidak ditemukan', 'danger');
            }
        } else {
            showAlert('Gagal memuat data user', 'danger');
        }
    } catch (error) {
        console.error('Error loading user for edit:', error);
        showAlert('Terjadi kesalahan saat memuat data', 'danger');
    }
};

window.deleteUser = async (id) => {
    try {
        // Get user info for confirmation
        const response = await apiCall('user.php?path=users', 'GET');
        
        if (response.status === 200 && response.data.success) {
            const users = response.data.data;
            const user = users.find(u => u.id == id);
            
            if (user) {
                await UserCRUD.delete(id, user.username);
            } else {
                showAlert('User tidak ditemukan', 'danger');
            }
        } else {
            showAlert('Gagal memuat data user', 'danger');
        }
    } catch (error) {
        console.error('Error loading user for delete:', error);
        showAlert('Terjadi kesalahan saat menghapus', 'danger');
    }
};

// ============================================
// FORM SUBMISSION HANDLERS
// ============================================

// Barang form submission
const barangForm = document.getElementById('barangForm');
if (barangForm) {
    barangForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            kode: document.getElementById('kode').value,
            nama: document.getElementById('nama').value,
            satuan: document.getElementById('satuan').value,
            harga: parseFloat(document.getElementById('harga').value),
            stok: parseInt(document.getElementById('stok').value),
            kategori: document.getElementById('kategori').value,
            deskripsi: document.getElementById('deskripsi').value
        };

        if (currentEditingId && currentEditingType === 'barang') {
            await BarangCRUD.update(currentEditingId, data);
        } else {
            await BarangCRUD.create(data);
        }
        
        // Reset form state
        currentEditingId = null;
        currentEditingType = null;
    });
}

// User form submission
const userForm = document.getElementById('userForm');
if (userForm) {
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            email: document.getElementById('userEmail').value,
            username: document.getElementById('userUsername').value,
            nama_lengkap: document.getElementById('userNamaLengkap').value,
            role: document.getElementById('userRole').value,
            status: document.getElementById('userStatus').value
        };

        // Add password only if provided (for updates)
        const password = document.getElementById('userPassword').value;
        if (password) {
            data.password = password;
        }

        if (currentEditingId && currentEditingType === 'user') {
            await UserCRUD.update(currentEditingId, data);
        } else {
            await UserCRUD.create(data);
        }
        
        // Reset form state
        currentEditingId = null;
        currentEditingType = null;
    });
}

// ============================================
// ADD BUTTON HANDLERS
// ============================================

// Add Barang button
const addBarangBtn = document.getElementById('addBarangBtn');
if (addBarangBtn) {
    addBarangBtn.addEventListener('click', () => {
        currentEditingId = null;
        currentEditingType = null;
        document.getElementById('barangForm').reset();
        document.getElementById('kode').readOnly = false;
        
        const modal = document.getElementById('barangModal');
        const titleEl = modal.querySelector('.modal-header h4');
        titleEl.textContent = 'Tambah Barang';
        
        animateModalOpen(modal);
    });
}

// Add User button
const addUserBtn = document.getElementById('addUserBtn');
if (addUserBtn) {
    addUserBtn.addEventListener('click', () => {
        currentEditingId = null;
        currentEditingType = null;
        document.getElementById('userForm').reset();
        
        const modal = document.getElementById('userModal');
        const titleEl = modal.querySelector('.modal-header h4');
        titleEl.textContent = 'Tambah User';
        
        animateModalOpen(modal);
    });
}

// ============================================
// EXPORT & IMPORT
// ============================================

const ExportImport = {
    exportToCSV: async (data, filename) => {
        const csv = [
            Object.keys(data[0]).join(','),
            ...data.map(row => Object.values(row).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        showAlert('✅ Data berhasil diexport!', 'success');
    },

    exportToJSON: async (data, filename) => {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showAlert('✅ Data berhasil diexport!', 'success');
    }
};

// ============================================
// BULK OPERATIONS
// ============================================

const BulkOperations = {
    selectedItems: new Set(),

    toggleSelect: (id) => {
        if (BulkOperations.selectedItems.has(id)) {
            BulkOperations.selectedItems.delete(id);
        } else {
            BulkOperations.selectedItems.add(id);
        }
        BulkOperations.updateUI();
    },

    selectAll: () => {
        document.querySelectorAll('[data-item-id]').forEach(el => {
            const id = el.getAttribute('data-item-id');
            BulkOperations.selectedItems.add(parseInt(id));
        });
        BulkOperations.updateUI();
    },

    clearSelection: () => {
        BulkOperations.selectedItems.clear();
        BulkOperations.updateUI();
    },

    updateUI: () => {
        const count = BulkOperations.selectedItems.size;
        const bulkActions = document.querySelector('.bulk-actions');
        
        if (count > 0) {
            if (!bulkActions) {
                const div = document.createElement('div');
                div.className = 'bulk-actions';
                div.style.cssText = `
                    padding: 15px;
                    background: rgba(102, 126, 234, 0.1);
                    border-radius: 8px;
                    margin-bottom: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                `;
                div.innerHTML = `
                    <span>${count} item dipilih</span>
                    <button class="btn-primary" onclick="BulkOperations.clearSelection()">Batal Pilih</button>
                `;
                document.querySelector('.search-filter').after(div);
            } else {
                bulkActions.querySelector('span').textContent = `${count} item dipilih`;
            }
        } else {
            const bulkEl = document.querySelector('.bulk-actions');
            if (bulkEl) bulkEl.remove();
        }
    }
};

// ============================================
// AUTO-INITIALIZE ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const user = UserManager.get();
    if (user && user.role === 'admin') {
        adminDashboard.init();
    }
});
