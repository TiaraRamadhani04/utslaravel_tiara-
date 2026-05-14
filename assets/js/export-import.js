/**
 * EXPORT & IMPORT UTILITIES
 * Export data ke CSV/JSON, Import dari CSV/JSON
 */

// ============================================
// CSV EXPORT
// ============================================

const ExportCSV = {
    export: (data, filename = 'export') => {
        if (!Array.isArray(data) || data.length === 0) {
            alert('Tidak ada data untuk diexport');
            return;
        }

        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    if (typeof value === 'string' && value.includes(',')) {
                        return `"${value}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        showAlert(`✅ ${data.length} data berhasil diexport ke CSV!`, 'success');
    },

    download: (filename) => {
        const timestamp = new Date().toISOString().split('T')[0];
        return `${filename}-${timestamp}.csv`;
    }
};

// ============================================
// JSON EXPORT
// ============================================

const ExportJSON = {
    export: (data, filename = 'export') => {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showAlert(`✅ Data berhasil diexport ke JSON!`, 'success');
    },

    beautify: (json) => {
        try {
            const parsed = typeof json === 'string' ? JSON.parse(json) : json;
            return JSON.stringify(parsed, null, 2);
        } catch (e) {
            console.error('JSON format error:', e);
            return json;
        }
    }
};

// ============================================
// EXCEL EXPORT (memerlukan library terpisah)
// ============================================

const ExportExcel = {
    export: (data, filename = 'export') => {
        // Require: https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js
        if (typeof XLSX === 'undefined') {
            alert('XLSX library belum di-load. Gunakan CSV export sebagai gantinya.');
            ExportCSV.export(data, filename);
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
        
        XLSX.writeFile(workbook, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
        showAlert(`✅ Data berhasil diexport ke Excel!`, 'success');
    }
};

// ============================================
// IMPORT CSV
// ============================================

const ImportCSV = {
    parse: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const csv = e.target.result;
                    const lines = csv.split('\n').filter(line => line.trim());
                    const headers = lines[0].split(',').map(h => h.trim());
                    
                    const data = lines.slice(1).map(line => {
                        const values = line.split(',');
                        const obj = {};
                        
                        headers.forEach((header, index) => {
                            obj[header] = values[index] ? values[index].trim() : '';
                        });
                        
                        return obj;
                    });
                    
                    resolve(data);
                } catch (error) {
                    reject(new Error('Error parsing CSV: ' + error.message));
                }
            };
            
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsText(file);
        });
    },

    validate: (data) => {
        // Custom validation logic
        return data.every(row => Object.values(row).some(val => val.length > 0));
    }
};

// ============================================
// IMPORT JSON
// ============================================

const ImportJSON = {
    parse: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target.result);
                    
                    if (Array.isArray(json)) {
                        resolve(json);
                    } else {
                        reject(new Error('JSON harus berupa array'));
                    }
                } catch (error) {
                    reject(new Error('Invalid JSON: ' + error.message));
                }
            };
            
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsText(file);
        });
    },

    validate: (data) => {
        return Array.isArray(data) && data.length > 0;
    }
};

// ============================================
// FILE INPUT HANDLER
// ============================================

const FileInputHandler = {
    create: (accept, onFileSelect) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                onFileSelect(file);
            }
        });
        
        return input;
    },

    triggerImport: (accept, callback) => {
        const input = FileInputHandler.create(accept, async (file) => {
            try {
                let data;
                
                if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                    data = await ImportCSV.parse(file);
                    if (!ImportCSV.validate(data)) {
                        throw new Error('CSV format tidak valid');
                    }
                } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
                    data = await ImportJSON.parse(file);
                    if (!ImportJSON.validate(data)) {
                        throw new Error('JSON format tidak valid');
                    }
                } else {
                    throw new Error('Format file tidak didukung. Gunakan CSV atau JSON.');
                }
                
                callback(data);
            } catch (error) {
                showAlert(`❌ Error: ${error.message}`, 'danger');
            }
        });
        
        input.click();
    }
};

// ============================================
// BATCH OPERATIONS
// ============================================

const BatchImport = {
    import: async (data, endpoint, type = 'barang') => {
        const total = data.length;
        let success = 0;
        let failed = 0;
        const errors = [];

        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            
            try {
                const response = await apiCall(endpoint, 'POST', item);
                
                if (response.status === 201 || (response.status === 200 && response.data.success)) {
                    success++;
                } else {
                    failed++;
                    errors.push(`Row ${i + 1}: ${response.data.message}`);
                }
            } catch (error) {
                failed++;
                errors.push(`Row ${i + 1}: ${error.message}`);
            }

            // Show progress
            const progress = Math.round((i + 1) / total * 100);
            console.log(`Progress: ${progress}%`);
        }

        const message = `
            ✅ Import Selesai!
            ━━━━━━━━━━━━━━━━━━
            Total: ${total}
            Berhasil: ${success}
            Gagal: ${failed}
            ${errors.length > 0 ? `\n\nErrors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... dan ${errors.length - 5} error lainnya` : ''}` : ''}
        `;

        showAlert(message, failed === 0 ? 'success' : 'danger');
        return { success, failed, total, errors };
    }
};

// ============================================
// BACKUP & RESTORE
// ============================================

const Backup = {
    create: async (name = 'backup') => {
        try {
            // Get all data
            const barang = await BarangCRUD.getAll();
            const users = await UserCRUD.getAll();

            const backup = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                data: {
                    barang,
                    users
                }
            };

            const json = JSON.stringify(backup, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `backup-${name}-${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            showAlert('✅ Backup berhasil dibuat!', 'success');
        } catch (error) {
            showAlert(`❌ Error membuat backup: ${error.message}`, 'danger');
        }
    },

    restore: async (file) => {
        try {
            const data = await ImportJSON.parse(file);
            
            if (!data.data || !data.data.barang || !data.data.users) {
                throw new Error('Format backup tidak valid');
            }

            // Confirm
            if (!confirm('Apakah Anda yakin ingin restore backup? Data saat ini akan ditimpa.')) {
                return;
            }

            // Import data
            await BatchImport.import(data.data.barang, 'barang.php?action=create', 'barang');
            await BatchImport.import(data.data.users, 'user.php?path=users', 'user');

            showAlert('✅ Backup berhasil di-restore!', 'success');
        } catch (error) {
            showAlert(`❌ Error restore: ${error.message}`, 'danger');
        }
    }
};

// ============================================
// REPORT GENERATION
// ============================================

const Report = {
    generateHTML: (data, title) => {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #333; }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-top: 20px;
                    }
                    th, td { 
                        border: 1px solid #ddd; 
                        padding: 12px; 
                        text-align: left;
                    }
                    th { 
                        background-color: #667eea; 
                        color: white;
                    }
                    tr:nth-child(even) { background-color: #f5f5f5; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <p>Generated: ${new Date().toLocaleString('id-ID')}</p>
                <table>
                    <thead>
                        <tr>
                            ${Object.keys(data[0]).map(k => `<th>${k}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(row => `
                            <tr>
                                ${Object.values(row).map(v => `<td>${v}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const blob = new Blob([html], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `report-${new Date().toISOString().split('T')[0]}.html`;
        link.click();

        showAlert('✅ Report berhasil dibuat!', 'success');
    },

    printData: (data, title) => {
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(`
            <html><head><title>${title}</title></head>
            <body onload="window.print()">
                <h1>${title}</h1>
                <p>${new Date().toLocaleString('id-ID')}</p>
                <table border="1" cellpadding="10">
                    <tr>${Object.keys(data[0]).map(k => `<th>${k}</th>`).join('')}</tr>
                    ${data.map(row => `
                        <tr>${Object.values(row).map(v => `<td>${v}</td>`).join('')}</tr>
                    `).join('')}
                </table>
            </body></html>
        `);
        printWindow.document.close();
    }
};

// ============================================
// EXPORT
// ============================================

window.ExportCSV = ExportCSV;
window.ExportJSON = ExportJSON;
window.ExportExcel = ExportExcel;
window.ImportCSV = ImportCSV;
window.ImportJSON = ImportJSON;
window.FileInputHandler = FileInputHandler;
window.BatchImport = BatchImport;
window.Backup = Backup;
window.Report = Report;
