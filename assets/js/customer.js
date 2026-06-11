// Customer SPA logic integrated into dashboard
(async ()=>{
    // Wait for app.js to load TokenManager and apiCall
    const waitFor = (cond, timeout=3000) => new Promise((res,rej)=>{
        const t0 = Date.now();
        (function check(){
            if (cond()) return res();
            if (Date.now()-t0 > timeout) return res();
            setTimeout(check,50);
        })();
    });

    await waitFor(()=>window.apiCall && window.TokenManager);

    const menuCustomer = document.getElementById('menuCustomer');
    const customersSection = document.getElementById('customersSection');
    const customersTableBody = document.getElementById('customersTableBody');
    const btnAddCustomer = document.getElementById('btnAddCustomer');
    const searchInput = document.getElementById('searchCustomerInput');
    const btnSearch = document.getElementById('btnSearchCustomer');

    function showSection(sectionId) {
        document.querySelectorAll('.section').forEach(s=>s.style.display='none');
        const s = document.getElementById(sectionId);
        if (s) s.style.display = '';
    }

    function setActiveMenu(id){
        document.querySelectorAll('.nav-item').forEach(item=>item.classList.remove('active'));
        const el = document.getElementById(id);
        if (el) el.closest('.nav-item').classList.add('active');
    }

    menuCustomer.addEventListener('click', (e)=>{
        e.preventDefault();
        setActiveMenu('menuCustomer');
        showSection('customersSection');
        loadCustomers();
    });

    // If other menu handlers exist, they should call showSection with their ids accordingly.

    // CRUD functions (similar to customers.html)
    const render = (list)=>{
        customersTableBody.innerHTML = '';
        if (!list || list.length === 0) {
            customersTableBody.innerHTML = '<tr><td colspan="6">Tidak ada data</td></tr>';
            return;
        }
        list.forEach(c=>{
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${c.kode}</td>
                <td>${c.nama}</td>
                <td>${c.alamat||''}</td>
                <td>${c.telepon||''}</td>
                <td>${c.email||''}</td>
                <td>
                  <button class="btn" data-id="${c.id}" onclick="window.editCustomerInline(${c.id})">Edit</button>
                  <button class="btn" data-id="${c.id}" onclick="window.deleteCustomerInline(${c.id})">Hapus</button>
                </td>
            `;
            customersTableBody.appendChild(tr);
        });
    };

    window.editCustomerInline = async (id) => {
        const res = await apiCall(`customers.php?id=${id}`, 'GET');
        if (res.status===200 && res.data.success) {
            const c = res.data.data;
            openCustomerModal(c);
        } else alert(res.data.message||'Gagal mengambil data');
    };

    window.deleteCustomerInline = async (id) => {
        if (!confirm('Hapus customer ini?')) return;
        const res = await apiCall('customers.php', 'DELETE', {id});
        if (res.data.success) {
            alert(res.data.message);
            loadCustomers();
        } else alert(res.data.message||'Gagal menghapus');
    };

    const loadCustomers = async (search='') => {
        const endpoint = search ? `customers.php?search=${encodeURIComponent(search)}` : 'customers.php';
        const res = await apiCall(endpoint, 'GET');
        if (res.status===200 && res.data.success) render(res.data.data); else customersTableBody.innerHTML = '<tr><td colspan="6">Gagal memuat data</td></tr>';
    };

    // Simple modal reuse by creating one dynamically
    let modalEl = null;
    function openCustomerModal(data=null){
        if (modalEl) modalEl.remove();
        modalEl = document.createElement('div');
        modalEl.className = 'modal';
        modalEl.style.display = 'block';
        modalEl.innerHTML = `
            <div class="modal-content" style="max-width:600px;margin:80px auto;padding:16px;background:#fff;border-radius:6px;">
              <h3>${data? 'Edit Customer' : 'Tambah Customer'}</h3>
              <form id="_customer_inline_form">
                <input type="hidden" name="id" value="${data?data.id:''}">
                <div style="margin-bottom:8px;"><label>Kode</label><br><input name="kode" value="${data?data.kode:''}" required style="width:100%"></div>
                <div style="margin-bottom:8px;"><label>Nama</label><br><input name="nama" value="${data?data.nama:''}" required style="width:100%"></div>
                <div style="margin-bottom:8px;"><label>Alamat</label><br><textarea name="alamat" style="width:100%">${data?data.alamat:''}</textarea></div>
                <div style="margin-bottom:8px;"><label>Telepon</label><br><input name="telepon" value="${data?data.telepon:''}" style="width:100%"></div>
                <div style="margin-bottom:8px;"><label>Email</label><br><input name="email" value="${data?data.email:''}" type="email" style="width:100%"></div>
                <div style="text-align:right;margin-top:8px;">
                  <button type="button" id="_cust_cancel" class="btn">Batal</button>
                  <button type="submit" class="btn btn-primary">Simpan</button>
                </div>
              </form>
            </div>
        `;
        document.body.appendChild(modalEl);
        document.getElementById('_cust_cancel').addEventListener('click', ()=>{ modalEl.remove(); modalEl=null; });
        document.getElementById('_customer_inline_form').addEventListener('submit', async (e)=>{
            e.preventDefault();
            const form = e.target;
            const fd = new FormData(form);
            const payload = {};
            fd.forEach((v,k)=> payload[k]=v);
            if (payload.id) {
                payload.id = parseInt(payload.id);
                const res = await apiCall('customers.php', 'PUT', payload);
                if (res.data.success) { alert(res.data.message); modalEl.remove(); modalEl=null; loadCustomers(); }
                else alert(res.data.message||'Gagal update');
            } else {
                const res = await apiCall('customers.php', 'POST', payload);
                if (res.data.success) { alert(res.data.message); modalEl.remove(); modalEl=null; loadCustomers(); }
                else alert(res.data.message||'Gagal simpan');
            }
        });
    }

    btnAddCustomer.addEventListener('click', ()=> openCustomerModal());
    btnSearch.addEventListener('click', ()=> loadCustomers(searchInput.value.trim()));

    // Optionally, if page loads with #customers in hash, open it
    if (location.hash === '#customers') {
        menuCustomer.click();
    }

})();
