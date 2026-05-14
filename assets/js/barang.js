// Barang management functions
const BarangManager = {
    list: async (search = '', kategori = '') => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (kategori) params.append('kategori', kategori);

        const response = await apiCall('barang.php?' + params.toString(), 'GET');
        return response.data;
    },

    getById: async (id) => {
        const response = await apiCall('barang.php?id=' + id, 'GET');
        return response.data;
    },

    create: async (data) => {
        const response = await apiCall('barang.php', 'POST', data);
        return response.data;
    },

    update: async (id, data) => {
        data.id = id;
        const response = await apiCall('barang.php', 'PUT', data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiCall('barang.php', 'DELETE', { id: id });
        return response.data;
    }
};

// Dashboard page
if (document.getElementById('dashboardContainer')) {
    let allBarang = [];
    let editingId = null;

    // Load data on page load
    window.addEventListener('load', async () => {
        await loadBarangList();
        await loadCategories();
    });

    // Load barang list
    const loadBarangList = async (search = '', kategori = '') => {
        const tbody = document.querySelector('#daftarBarangSection table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '<tr><td colspan="9" class="loading"><div class="spinner"></div>Loading...</td></tr>';

        const result = await BarangManager.list(search, kategori);

        if (result.success) {
            allBarang = result.data;
            renderBarangTable(allBarang);
        } else {
            showAlert(result.message, 'danger');
        }
    };

    // Render table
    const renderBarangTable = (items) => {
        const tbody = document.querySelector('#daftarBarangSection table tbody');
        if (!tbody) return;
        
        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty-state"><div class="empty-state-icon">📭</div>Tidak ada data barang</td></tr>';
            return;
        }

        tbody.innerHTML = items.map(item => {
            const user = UserManager.get();
            const canEdit = user.role === 'admin' || item.created_by === user.id;
            const canDelete = user.role === 'admin';

            return `
                <tr>
                    <td>${item.kode}</td>
                    <td>${item.nama}</td>
                    <td>${item.satuan}</td>
                    <td>${formatCurrency(item.harga)}</td>
                    <td>${item.stok}</td>
                    <td>${item.kategori || '-'}</td>
                    <td>${item.deskripsi ? item.deskripsi.substring(0, 30) + '...' : '-'}</td>
                    <td>${item.created_by_name}</td>
                    <td>
                        <div class="action-buttons">
                            ${canEdit ? `<button class="btn-edit" onclick="editBarang(${item.id})">Edit</button>` : ''}
                            ${canDelete ? `<button class="btn-delete" onclick="deleteBarang(${item.id})">Hapus</button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    };

    // Load categories
    const loadCategories = async () => {
        const kategoriSelect = document.getElementById('filterKategori');
        if (!kategoriSelect) return;

        const result = await BarangManager.list();
        const categories = [...new Set(result.data.map(b => b.kategori).filter(k => k))];

        kategoriSelect.innerHTML = '<option value="">Semua Kategori</option>' + 
            categories.map(k => `<option value="${k}">${k}</option>`).join('');
    };

    // Add/Edit form submission
    const formId = document.getElementById('barangForm');
    if (formId) {
        formId.addEventListener('submit', async (e) => {
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

            let result;
            if (editingId) {
                result = await BarangManager.update(editingId, data);
            } else {
                result = await BarangManager.create(data);
            }

            if (result.success) {
                showAlert(result.message, 'success');
                formId.reset();
                document.getElementById('kode').readOnly = false;
                document.querySelector('#formBarangSection h3').textContent = '➕ Tambah / Edit Barang';
                editingId = null;
                await loadBarangList();
            } else {
                showAlert(result.message, 'danger');
            }
        });
    }

    // Edit barang
    window.editBarang = async (id) => {
        const result = await BarangManager.getById(id);
        
        if (result.success) {
            const item = result.data;
            editingId = id;
            
            document.getElementById('kode').value = item.kode;
            document.getElementById('kode').readOnly = true;
            document.getElementById('nama').value = item.nama;
            document.getElementById('satuan').value = item.satuan;
            document.getElementById('harga').value = item.harga;
            document.getElementById('stok').value = item.stok;
            document.getElementById('kategori').value = item.kategori || '';
            document.getElementById('deskripsi').value = item.deskripsi || '';
            
            // Show form section
            document.querySelectorAll('.section').forEach(section => {
                section.style.display = 'none';
            });
            document.getElementById('formBarangSection').style.display = 'block';
            
            // Update form title
            document.querySelector('#formBarangSection h3').textContent = `✏️ Edit Barang - ${item.nama}`;
            
            // Scroll to form
            setTimeout(() => {
                document.getElementById('barangForm').scrollIntoView({ behavior: 'smooth' });
            }, 100);
            
            // Mark "Tambah Barang" menu as active
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            document.getElementById('menuTambah').closest('.nav-item').classList.add('active');
        } else {
            showAlert(result.message, 'danger');
        }
    };

    // Delete barang
    window.deleteBarang = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus barang ini?')) return;

        const result = await BarangManager.delete(id);
        
        if (result.success) {
            showAlert(result.message, 'success');
            await loadBarangList();
        } else {
            showAlert(result.message, 'danger');
        }
    };

    // Reset form for add new
    const addBtn = document.getElementById('addBarangBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            editingId = null;
            document.getElementById('barangForm').reset();
            document.getElementById('kode').readOnly = false;
            
            // Show form section
            document.querySelectorAll('.section').forEach(section => {
                section.style.display = 'none';
            });
            document.getElementById('formBarangSection').style.display = 'block';
            
            // Scroll to form
            setTimeout(() => {
                document.getElementById('barangForm').scrollIntoView({ behavior: 'smooth' });
            }, 100);
            
            // Mark "Tambah Barang" menu as active
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            document.getElementById('menuTambah').closest('.nav-item').classList.add('active');
        });
    }

    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', debounce(() => {
            const search = searchInput.value;
            const kategori = document.getElementById('filterKategori').value;
            loadBarangList(search, kategori);
        }, 500));
    }

    // Filter by category
    const filterKategori = document.getElementById('filterKategori');
    if (filterKategori) {
        filterKategori.addEventListener('change', () => {
            const search = searchInput.value;
            const kategori = filterKategori.value;
            loadBarangList(search, kategori);
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Yakin ingin logout?')) {
                Auth.logout();
            }
        });
    }
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
