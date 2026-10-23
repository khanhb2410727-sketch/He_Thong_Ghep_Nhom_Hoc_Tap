let lichRanhBit = "000000000000000000000"; 
const thuMap = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
const caMap = ['Sáng', 'Chiều', 'Tối'];
let selectedKyNang = [];
let selectedSoThich = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!localStorage.getItem('token')) { window.location.href = 'dang-nhap.html'; return; }
    setupTabs(); 
    tuDongTaoNienKhoa();
    await loadHoSo(); 
    await loadLichRanh();
});

function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active')); 
            tab.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            
            const content = document.getElementById(`tab-${tab.dataset.tab}`);
            if (content) content.style.display = 'block';
            
            if (tab.dataset.tab === 'ky-nang') loadKyNang();
            if (tab.dataset.tab === 'so-thich') loadSoThich();
            if (tab.dataset.tab === 'bang-cap') loadBangCap();
        });
    });
}

// Hàm tạo danh sách Niên khóa tự động (Từ K40 đến K65)
function tuDongTaoNienKhoa() {
    const select = document.getElementById('input-nien-khoa');
    if (!select) return;
    
    // Xóa các option cũ (nếu có) trước khi thêm mới
    select.innerHTML = '<option value="">-- Chọn niên khóa --</option>';
    
    for (let i = 65; i >= 40; i--) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Khóa ${i} (K${i})`;
        select.appendChild(option);
    }
}

async function loadHoSo() {
    try {
        const data = await apiCall('/sinh-vien/ho-so', { method: 'GET' });
        
        const nienKhoaText = data.nien_khoa && data.nien_khoa > 0 ? `K${data.nien_khoa}` : 'Chưa cập nhật';
        
        document.getElementById('header-ho-ten').textContent = data.ho_ten;
        document.getElementById('header-subtitle').textContent = data.chuyen_nganh || 'Chưa cập nhật ngành';
        if (data.anh_dai_dien) document.getElementById('header-avatar').src = data.anh_dai_dien;
        
        // Cập nhật phần View
        document.getElementById('view-ma-sv').textContent = data.mssv || 'Chưa cập nhật';
        document.getElementById('view-email').textContent = data.email;
        document.getElementById('view-chuyen-nganh').textContent = data.chuyen_nganh || 'Chưa cập nhật';
        document.getElementById('view-nien-khoa').textContent = nienKhoaText;
        document.getElementById('view-lop-sinh-hoat').textContent = data.lop_sinh_hoat || 'Chưa cập nhật';
        document.getElementById('view-bio').textContent = data.mo_ta_ban_than || 'Chưa có giới thiệu.';

        // Cập nhật phần Edit Form
        document.getElementById('input-chuyen-nganh').value = data.chuyen_nganh || '';
        document.getElementById('input-nien-khoa').value = data.nien_khoa || '';
        document.getElementById('input-lop-sinh-hoat').value = data.lop_sinh_hoat || '';
        document.getElementById('input-gpa').value = data.gpa || '';
        document.getElementById('input-bio').value = data.mo_ta_ban_than || '';
    } catch (err) { showToast('Lỗi tải hồ sơ!', 'error'); }
}

function suaHoSo() { 
    document.getElementById('tab-thong-tin').style.display = 'none'; 
    document.getElementById('edit-form').style.display = 'block'; 
    document.getElementById('btn-sua-ho-so').style.display = 'none'; 
}

function huyChinhSua() { 
    document.getElementById('edit-form').style.display = 'none'; 
    document.getElementById('tab-thong-tin').style.display = 'block'; 
    document.getElementById('btn-sua-ho-so').style.display = 'block'; 
}

async function luuHoSo() {
    const payload = {
        chuyen_nganh: document.getElementById('input-chuyen-nganh').value,
        nien_khoa: parseInt(document.getElementById('input-nien-khoa').value) || 0,
        lop_sinh_hoat: document.getElementById('input-lop-sinh-hoat').value.trim(),
        gpa: parseFloat(document.getElementById('input-gpa').value) || 0,
        mo_ta_ban_than: document.getElementById('input-bio').value.trim(),
        muc_tieu_hoc_tap: ""
    };
    
    try {
        await apiCall('/sinh-vien/ho-so', { method: 'PUT', body: JSON.stringify(payload) });
        showToast('Cập nhật thành công!', 'success'); 
        await loadHoSo(); 
        huyChinhSua();
    } catch (err) { showToast('Lỗi khi lưu!', 'error'); }
}

async function uploadAvatar(input) {
    if (!input.files || input.files.length === 0) return;
    const formData = new FormData(); formData.append("file", input.files[0]);
    const res = await fetch(`${API_BASE}/tai-khoan/avatar`, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, 
        body: formData 
    });
    const data = await res.json();
    if (res.ok) { 
        document.getElementById('header-avatar').src = data.avatar_url; 
        showToast('Cập nhật ảnh!', 'success'); 
    }
}

// ==========================================
// KỸ NĂNG
// ==========================================
async function loadKyNang() {
    const container = document.getElementById('list-ky-nang');
    container.innerHTML = '<p>Đang tải...</p>';
    try {
        const allKn = await apiCall('/danh-muc/ky-nang', { method: 'GET' });
        const myKn = await apiCall('/sinh-vien/ky-nang', { method: 'GET' });
        selectedKyNang = myKn.danhSach || [];
        
        if (allKn.length === 0) {
            container.innerHTML = '<p style="color: red;">Danh mục kỹ năng trống.</p>';
            return;
        }
        
        container.innerHTML = `
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">
                ${allKn.map(kn => `<button class="btn ${selectedKyNang.includes(kn.ma_ky_nang) ? 'btn-primary' : 'btn-secondary'}" onclick="toggleKyNang(${kn.ma_ky_nang})">${selectedKyNang.includes(kn.ma_ky_nang) ? '✓ ' : '+ '}${kn.ten_ky_nang}</button>`).join('')}
            </div>
            <button class="btn btn-primary" onclick="luuKyNang()">Lưu Kỹ năng</button>
        `;
    } catch (err) { container.innerHTML = '<p style="color: red;">Lỗi tải kỹ năng!</p>'; }
}

function toggleKyNang(id) { 
    if (selectedKyNang.includes(id)) selectedKyNang = selectedKyNang.filter(x => x !== id); 
    else selectedKyNang.push(id); 
    loadKyNang(); 
}

async function luuKyNang() { 
    try { 
        await apiCall('/sinh-vien/ky-nang', { method: 'POST', body: JSON.stringify({ danh_sach_ma: selectedKyNang }) }); 
        showToast('Đã lưu kỹ năng!', 'success'); 
    } catch (err) { showToast('Lỗi lưu kỹ năng!', 'error'); } 
}

// ==========================================
// SỞ THÍCH
// ==========================================
async function loadSoThich() {
    const container = document.getElementById('list-so-thich');
    container.innerHTML = '<p>Đang tải...</p>';
    try {
        const allSt = await apiCall('/danh-muc/so-thich', { method: 'GET' });
        const mySt = await apiCall('/sinh-vien/so-thich', { method: 'GET' });
        selectedSoThich = mySt.danhSach || [];
        
        if (allSt.length === 0) {
            container.innerHTML = '<p style="color: red;">Danh mục sở thích trống.</p>';
            return;
        }
        
        container.innerHTML = `
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">
                ${allSt.map(st => `<button class="btn ${selectedSoThich.includes(st.ma_so_thich) ? 'btn-primary' : 'btn-secondary'}" onclick="toggleSoThich(${st.ma_so_thich})">${selectedSoThich.includes(st.ma_so_thich) ? '✓ ' : '+ '}${st.ten_so_thich}</button>`).join('')}
            </div>
            <button class="btn btn-primary" onclick="luuSoThich()">Lưu Sở thích</button>
        `;
    } catch (err) { container.innerHTML = '<p style="color: red;">Lỗi tải sở thích!</p>'; }
}

function toggleSoThich(id) { 
    if (selectedSoThich.includes(id)) selectedSoThich = selectedSoThich.filter(x => x !== id); 
    else selectedSoThich.push(id); 
    loadSoThich(); 
}

async function luuSoThich() { 
    try { 
        await apiCall('/sinh-vien/so-thich', { method: 'POST', body: JSON.stringify({ danh_sach_ma: selectedSoThich }) }); 
        showToast('Đã lưu sở thích!', 'success'); 
    } catch (err) { showToast('Lỗi lưu sở thích!', 'error'); } 
}

// ==========================================
// BẰNG CẤP
// ==========================================
async function loadBangCap() {
    const container = document.getElementById('list-bang-cap');
    container.innerHTML = '<p style="color: var(--text-muted); font-style: italic; grid-column: 1/-1;">Đang tải...</p>';
    
    try {
        const data = await apiCall('/sinh-vien/bang-cap', { method: 'GET' });
        
        if (!data.danhSach || data.danhSach.length === 0) { 
            container.innerHTML = '<p style="color: var(--text-muted); font-style: italic; grid-column: 1/-1;">Chưa có bằng cấp nào. Hãy bấm "+ Thêm bằng cấp".</p>'; 
            return; 
        }
        
        container.innerHTML = data.danhSach.map(bc => `
            <div style="background: var(--bg-main); border: 2px solid var(--border-light); padding: 16px; border-radius: 12px;">
                <h4 style="font-size: 16px; margin-bottom: 8px; color: var(--text-primary);">${bc.ten_bang_cap}</h4>
                <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">Loại: ${bc.loai}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px;">
                    <span style="font-weight: 800; color: var(--secondary-dark);">${bc.diem_so || '—'}</span>
                    <span style="color: var(--text-muted);">Cấp ngày: ${bc.ngay_cap}</span>
                </div>
            </div>
        `).join('');
    } catch (err) { 
        container.innerHTML = '<p style="color: red; grid-column: 1/-1;">Lỗi tải dữ liệu bằng cấp!</p>'; 
    }
}

async function moModalBangCap() {
    const select = document.getElementById('select-bang-cap');
    select.innerHTML = '<option value="">Đang tải...</option>';
    document.getElementById('modal-bang-cap').style.display = 'flex';
    
    try { 
        const data = await apiCall('/danh-muc/bang-cap', { method: 'GET' }); 
        if (data.length === 0) {
            select.innerHTML = '<option value="">Danh mục trống (Chạy SQL nạp dữ liệu)</option>';
            return;
        }
        select.innerHTML = data.map(bc => `<option value="${bc.ma_loai_bang_cap}">${bc.ten_bang_cap}</option>`).join(''); 
    } catch (err) { 
        select.innerHTML = '<option value="">Lỗi tải danh mục</option>'; 
    }
}

async function luuBangCap() {
    const ma_loai = document.getElementById('select-bang-cap').value; 
    const diem_so = document.getElementById('input-diem-bc').value; 
    const ngay_cap = document.getElementById('input-ngay-bc').value;
    
    if(!ma_loai) { showToast('Vui lòng chọn loại bằng cấp!', 'error'); return; }
    if(!ngay_cap) { showToast('Vui lòng chọn ngày cấp!', 'error'); return; }
    
    try { 
        await apiCall('/sinh-vien/bang-cap', { 
            method: 'POST', 
            body: JSON.stringify({ ma_loai_bang_cap: parseInt(ma_loai), diem_so, ngay_cap }) 
        }); 
        showToast('Thêm bằng cấp thành công!', 'success'); 
        dongModal('modal-bang-cap'); 
        loadBangCap(); 
    } catch (err) { 
        showToast('Lỗi khi thêm bằng cấp!', 'error'); 
    }
}

function dongModal(id) { 
    document.getElementById(id).style.display = 'none'; 
}

// ==========================================
// LỊCH RẢNH
// ==========================================
async function loadLichRanh() { 
    try { 
        const data = await apiCall('/lich-ranh', { method: 'GET' }); 
        lichRanhBit = data.lich_ranh_bit || "000000000000000000000"; 
        renderLichRanhGrid(); 
    } catch (err) { console.error(err); } 
}

function renderLichRanhGrid() {
    const grid = document.getElementById('lich-ranh-grid'); 
    if (!grid) return;
    
    let html = '<div style="font-weight: 600; color: var(--text-secondary); padding: 10px;"></div>';
    thuMap.forEach(thu => { html += `<div style="font-weight: 600; color: var(--text-secondary); padding: 10px; font-size: 14px;">${thu}</div>`; });
    
    for (let caIndex = 0; caIndex < 3; caIndex++) {
        html += `<div style="font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; justify-content: flex-end; padding-right: 12px;">${caMap[caIndex]}</div>`;
        for (let thuIndex = 0; thuIndex < 7; thuIndex++) {
            const bitIndex = thuIndex * 3 + caIndex; 
            const isAvailable = lichRanhBit[bitIndex] === '1';
            html += `<div class="lich-cell ${isAvailable ? 'active' : ''}" onclick="toggleLichCell(${bitIndex})" style="padding: 16px; background: ${isAvailable ? 'var(--pastel-sage-bg)' : 'var(--bg-hover)'}; border: 2px solid ${isAvailable ? 'var(--primary)' : 'transparent'}; border-radius: 8px; cursor: pointer; transition: all 0.2s;">${isAvailable ? 'Rảnh' : 'Bận'}</div>`;
        }
    }
    grid.innerHTML = html;
}

function toggleLichCell(bitIndex) { 
    let arr = lichRanhBit.split(''); 
    arr[bitIndex] = arr[bitIndex] === '1' ? '0' : '1'; 
    lichRanhBit = arr.join(''); 
    renderLichRanhGrid(); 
}

async function luuLichRanh() { 
    try { 
        const data = await apiCall('/lich-ranh', { method: 'PUT', body: JSON.stringify({ lich_ranh_bit: lichRanhBit }) }); 
        showToast(data.message || 'Đã lưu lịch rảnh!', 'success'); 
    } catch (err) { 
        showToast('Lỗi khi lưu lịch rảnh!', 'error'); 
    } 
}