let lichRanhBit = "000000000000000000000"; 
const thuMap = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
const caMap = ['Sáng', 'Chiều', 'Tối'];
let selectedKyNang = []; let allKyNangData = []; let isEditKyNang = false;
let selectedSoThich = []; let allSoThichData = []; let isEditSoThich = false;
let isEditLichRanh = false;

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
            tabs.forEach(t => t.classList.remove('active')); tab.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            const content = document.getElementById(`tab-${tab.dataset.tab}`);
            if (content) content.style.display = 'block';
            
            if (tab.dataset.tab === 'ky-nang') { isEditKyNang = false; loadKyNang(); }
            if (tab.dataset.tab === 'so-thich') { isEditSoThich = false; loadSoThich(); }
            if (tab.dataset.tab === 'lich-ranh') { isEditLichRanh = false; loadLichRanh(); }
            if (tab.dataset.tab === 'bang-cap') { loadBangCap(); }
            if (tab.dataset.tab === 'lich-su') { loadLichSuNhom(); }
            if (tab.dataset.tab === 'ho-tro') { loadHoTroCuaToi(); } // Gọi hàm tải hỗ trợ
        });
    });
}

function tuDongTaoNienKhoa() {
    const select = document.getElementById('input-nien-khoa');
    if (!select) return;
    select.innerHTML = '<option value="">-- Chọn niên khóa --</option>';
    for (let i = 65; i >= 40; i--) {
        const option = document.createElement('option'); option.value = i; option.textContent = `Khóa ${i} (K${i})`; select.appendChild(option);
    }
}

async function loadHoSo() {
    try {
        const data = await apiCall('/sinh-vien/ho-so', { method: 'GET' });
        const nienKhoaText = data.nien_khoa && data.nien_khoa > 0 ? `K${data.nien_khoa}` : 'Chưa cập nhật';
        
        document.getElementById('view-mssv').textContent = data.mssv || 'Chưa cập nhật';
        document.getElementById('header-mssv').textContent = data.mssv || 'Chưa cập nhật';
        document.getElementById('input-mssv').value = data.mssv || '';

        document.getElementById('header-ho-ten').textContent = data.ho_ten;
        document.getElementById('header-subtitle').textContent = data.chuyen_nganh || 'Chưa cập nhật ngành';
        
        const elUyTin = document.getElementById('header-uy-tin');
        if (elUyTin) {
            elUyTin.textContent = data.diem_uy_tin ? data.diem_uy_tin.toFixed(1) : "5.0";
        }
        
        if (data.anh_dai_dien) {
            document.getElementById('header-avatar').src = data.anh_dai_dien;
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                user.anh_dai_dien = data.anh_dai_dien;
                localStorage.setItem('user', JSON.stringify(user));
                if (typeof updateHeaderAuth === 'function') updateHeaderAuth(); 
            }
        }
        
        document.getElementById('view-email').textContent = data.email;
        document.getElementById('view-chuyen-nganh').textContent = data.chuyen_nganh || 'Chưa cập nhật';
        document.getElementById('view-nien-khoa').textContent = nienKhoaText;
        document.getElementById('view-lop-sinh-hoat').textContent = data.lop_sinh_hoat || 'Chưa cập nhật';
        document.getElementById('view-bio').textContent = data.mo_ta_ban_than || 'Chưa có giới thiệu.';

        document.getElementById('input-chuyen-nganh').value = data.chuyen_nganh || '';
        document.getElementById('input-nien-khoa').value = data.nien_khoa || '';
        document.getElementById('input-lop-sinh-hoat').value = data.lop_sinh_hoat || '';
        document.getElementById('input-gpa').value = data.gpa || '';
        document.getElementById('input-bio').value = data.mo_ta_ban_than || '';
    } catch (err) { showToast('Lỗi tải hồ sơ!', 'error'); }
}

function suaHoSo() { document.getElementById('tab-thong-tin').style.display = 'none'; document.getElementById('edit-form').style.display = 'block'; document.getElementById('btn-sua-ho-so').style.display = 'none'; }
function huyChinhSua() { document.getElementById('edit-form').style.display = 'none'; document.getElementById('tab-thong-tin').style.display = 'block'; document.getElementById('btn-sua-ho-so').style.display = 'block'; }

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
        showToast('Cập nhật thành công!', 'success'); await loadHoSo(); huyChinhSua();
    } catch (err) { showToast('Lỗi khi lưu!', 'error'); }
}

async function uploadAvatar(input) {
    if (!input.files || input.files.length === 0) return;
    const formData = new FormData(); formData.append("file", input.files[0]);
    try {
        const res = await fetch(`${API_BASE}/tai-khoan/avatar`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: formData });
        const data = await res.json();
        if (res.ok) { 
            document.getElementById('header-avatar').src = data.avatar_url; 
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr); user.anh_dai_dien = data.avatar_url;
                localStorage.setItem('user', JSON.stringify(user));
                if (typeof updateHeaderAuth === 'function') { updateHeaderAuth(); }
            }
            showToast('Cập nhật ảnh thành công!', 'success'); 
        } else { showToast('Lỗi upload ảnh', 'error'); }
    } catch (error) { showToast('Lỗi kết nối!', 'error'); }
}

// ============================================
// LỊCH SỬ NHÓM
// ============================================
async function loadLichSuNhom() {
    const container = document.getElementById('list-lich-su-nhom');
    container.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">Đang tải lịch sử...</p>';
    
    try {
        const data = await apiCall('/sinh-vien/lich-su-nhom', { method: 'GET' });
        const danhSach = data.danhSach || [];
        
        if (danhSach.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">Bạn chưa tham gia nhóm nào.</p>';
            return;
        }

        container.innerHTML = danhSach.map(nhom => {
            let diemText = 'Chưa có đánh giá';
            let diemColor = 'var(--text-muted)';
            let btnKhieuNai = '';
            
            if (nhom.diemUyTin !== null) {
                diemText = `${nhom.diemUyTin} / 5.0`;
                diemColor = nhom.diemUyTin >= 4 ? 'var(--secondary)' : nhom.diemUyTin >= 3 ? '#F59E0B' : '#EF4444';
                
                if (nhom.diemUyTin < 5.0 && nhom.trangThai === 'da_giai_tan') {
                    btnKhieuNai = `<button class="btn btn-secondary btn-sm" style="margin-top: 12px; font-size: 12px; color: #F59E0B; border-color: #F59E0B; padding: 4px 12px;" onclick="moModalKhieuNaiDiem(${nhom.maNhom}, '${nhom.tenNhom}')">Khiếu nại điểm</button>`;
                }
            }

            const statusColor = nhom.trangThai === 'da_giai_tan' ? 'var(--text-muted)' : 'var(--primary)';
            const statusText = nhom.trangThai === 'da_giai_tan' ? 'Đã kết thúc' : 'Đang hoạt động';

            return `
                <div style="background: var(--bg-main); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <div style="font-weight: 600; color: var(--text-primary); font-size: 16px; margin-bottom: 4px;">${nhom.tenNhom}</div>
                        <div style="font-size: 13px; color: var(--text-secondary);">
                            Môn: ${nhom.tenMonHoc || '—'} | Vai trò: ${nhom.vaiTro === 'truong_nhom' ? 'Trưởng nhóm' : 'Thành viên'}
                        </div>
                        <div style="font-size: 13px; margin-top: 4px;">
                            <span style="color: ${statusColor}; font-weight: 500;">${statusText}</span>
                            <span style="color: var(--text-muted); margin-left: 8px;">Tham gia: ${nhom.ngayThamGia}</span>
                        </div>
                        ${btnKhieuNai}
                    </div>
                    <div style="text-align: right; background: var(--bg-card); padding: 8px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
                        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Điểm uy tín nhận được</div>
                        <div style="font-size: 20px; font-weight: 800; color: ${diemColor};">${diemText}</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        container.innerHTML = '<p style="color: #EF4444;">Lỗi tải lịch sử nhóm!</p>';
    }
}

// ============================================
// LỊCH SỬ HỖ TRỢ (MỚI THÊM)
// ============================================
async function loadHoTroCuaToi() {
    const container = document.getElementById('list-ho-tro-cua-toi');
    container.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">Đang tải lịch sử hỗ trợ...</p>';
    
    try {
        const data = await apiCall('/ho-tro/cua-toi', { method: 'GET' });
        
        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">Bạn chưa gửi yêu cầu hỗ trợ nào.</p>';
            return;
        }

        container.innerHTML = data.map(ht => {
            const isDaXuLy = ht.trang_thai === 'da_xu_ly';
            const badgeClass = isDaXuLy ? 'badge-success' : 'badge-warning';
            const statusText = isDaXuLy ? 'Đã phản hồi' : 'Chờ xử lý';

            // CHỈ HIỂN THỊ NHÃN KHI CÓ LOẠI SỰ CỐ VÀ KHÁC CHỮ "Khác"
            let loaiSuCoHtml = '';
            if (ht.loai_su_co && ht.loai_su_co !== 'Khác') {
                loaiSuCoHtml = `<span class="badge badge-danger" style="margin-bottom: 8px; display: inline-block;">${ht.loai_su_co}</span>`;
            }

            let phanHoiHtml = isDaXuLy && ht.phan_hoi ? `
                <div style="margin-top: 16px; text-align: left;">
                    <div style="display: inline-block; background: rgba(34, 197, 94, 0.1); border-left: 4px solid #22c55e; padding: 12px 16px; border-radius: 0 var(--radius-md) var(--radius-md) 0; max-width: 100%;">
                        <div style="font-size: 12px; color: #22c55e; font-weight: 700; margin-bottom: 4px; text-transform: uppercase;">Phản hồi từ Admin:</div>
                        <div style="font-size: 14px; color: var(--text-primary); line-height: 1.5; word-wrap: break-word;">${ht.phan_hoi}</div>
                    </div>
                </div>
            ` : '';

            return `
                <div style="background: var(--bg-main); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                        <div>
                            ${loaiSuCoHtml} <!-- CHÈN NHÃN VÀO ĐÂY -->
                            <h4 style="font-size: 16px; color: var(--text-primary); margin: 0;">${ht.tieu_de}</h4>
                        </div>
                        <span class="badge ${badgeClass}">${statusText}</span>
                    </div>
                    <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 8px;">${ht.noi_dung}</p>
                    <div style="font-size: 12px; color: var(--text-muted); text-align: right;">Gửi lúc: ${ht.ngay_gui}</div>
                    
                    ${phanHoiHtml}
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error("Lỗi khi tải lịch sử hỗ trợ:", err);
        container.innerHTML = '<p style="color: #EF4444;">Lỗi tải lịch sử hỗ trợ!</p>';
    }
}

// CÁC HÀM KHÁC (Kỹ năng, sở thích, bằng cấp, lịch rảnh...)
async function loadKyNang() {
    const container = document.getElementById('list-ky-nang'); container.innerHTML = '<p>Đang tải...</p>';
    try {
        allKyNangData = await apiCall('/danh-muc/ky-nang', { method: 'GET' });
        const myKn = await apiCall('/sinh-vien/ky-nang', { method: 'GET' }); selectedKyNang = myKn.danhSach || [];
        renderKyNangUI();
    } catch (err) { container.innerHTML = '<p style="color: red;">Lỗi tải kỹ năng!</p>'; }
}
function renderKyNangUI() {
    const container = document.getElementById('list-ky-nang');
    if (!isEditKyNang) {
        const savedKn = allKyNangData.filter(kn => selectedKyNang.includes(kn.ma_ky_nang));
        if (savedKn.length === 0) { container.innerHTML = '<p style="color: var(--text-muted); font-style: italic; margin-bottom: 20px;">Bạn chưa cập nhật kỹ năng nào.</p>'; } 
        else { container.innerHTML = `<div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">${savedKn.map(kn => `<span style="background: var(--pastel-sage-bg); color: var(--pastel-sage-text); padding: 8px 16px; border-radius: 20px; font-weight: 600; border: 1px solid rgba(122,145,96,0.3);">${kn.ten_ky_nang}</span>`).join('')}</div>`; }
        container.innerHTML += `<button class="btn btn-secondary btn-sm" onclick="batCheDoSuaKyNang()">Chỉnh sửa Kỹ năng</button>`;
    } else {
        container.innerHTML = `<div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">${allKyNangData.map(kn => `<button class="btn ${selectedKyNang.includes(kn.ma_ky_nang) ? 'btn-primary' : 'btn-secondary'}" onclick="toggleKyNang(${kn.ma_ky_nang})">${selectedKyNang.includes(kn.ma_ky_nang) ? '✓ ' : '+ '}${kn.ten_ky_nang}</button>`).join('')}</div><div style="display: flex; gap: 10px;"><button class="btn btn-primary" onclick="luuKyNang()">Lưu thay đổi</button><button class="btn btn-secondary" onclick="huySuaKyNang()">Hủy</button></div>`;
    }
}
function batCheDoSuaKyNang() { isEditKyNang = true; renderKyNangUI(); }
function huySuaKyNang() { isEditKyNang = false; loadKyNang(); }
function toggleKyNang(id) { if (selectedKyNang.includes(id)) selectedKyNang = selectedKyNang.filter(x => x !== id); else selectedKyNang.push(id); renderKyNangUI(); }
async function luuKyNang() { try { await apiCall('/sinh-vien/ky-nang', { method: 'POST', body: JSON.stringify({ danh_sach_ma: selectedKyNang }) }); showToast('Đã lưu kỹ năng!', 'success'); isEditKyNang = false; renderKyNangUI(); } catch (err) { showToast('Lỗi lưu kỹ năng!', 'error'); } }

async function loadSoThich() {
    const container = document.getElementById('list-so-thich'); container.innerHTML = '<p>Đang tải...</p>';
    try {
        allSoThichData = await apiCall('/danh-muc/so-thich', { method: 'GET' });
        const mySt = await apiCall('/sinh-vien/so-thich', { method: 'GET' }); selectedSoThich = mySt.danhSach || [];
        renderSoThichUI();
    } catch (err) { container.innerHTML = '<p style="color: red;">Lỗi tải sở thích!</p>'; }
}
function renderSoThichUI() {
    const container = document.getElementById('list-so-thich');
    if (!isEditSoThich) {
        const savedSt = allSoThichData.filter(st => selectedSoThich.includes(st.ma_so_thich));
        if (savedSt.length === 0) { container.innerHTML = '<p style="color: var(--text-muted); font-style: italic; margin-bottom: 20px;">Bạn chưa cập nhật sở thích nào.</p>'; } 
        else { container.innerHTML = `<div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">${savedSt.map(st => `<span style="background: var(--pastel-honey-bg); color: var(--pastel-honey-text); padding: 8px 16px; border-radius: 20px; font-weight: 600; border: 1px solid rgba(232,185,109,0.4);">${st.ten_so_thich}</span>`).join('')}</div>`; }
        container.innerHTML += `<button class="btn btn-secondary btn-sm" onclick="batCheDoSuaSoThich()">Chỉnh sửa Sở thích</button>`;
    } else {
        container.innerHTML = `<div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">${allSoThichData.map(st => `<button class="btn ${selectedSoThich.includes(st.ma_so_thich) ? 'btn-primary' : 'btn-secondary'}" onclick="toggleSoThich(${st.ma_so_thich})">${selectedSoThich.includes(st.ma_so_thich) ? '✓ ' : '+ '}${st.ten_so_thich}</button>`).join('')}</div><div style="display: flex; gap: 10px;"><button class="btn btn-primary" onclick="luuSoThich()">Lưu thay đổi</button><button class="btn btn-secondary" onclick="huySuaSoThich()">Hủy</button></div>`;
    }
}
function batCheDoSuaSoThich() { isEditSoThich = true; renderSoThichUI(); }
function huySuaSoThich() { isEditSoThich = false; loadSoThich(); }
function toggleSoThich(id) { if (selectedSoThich.includes(id)) selectedSoThich = selectedSoThich.filter(x => x !== id); else selectedSoThich.push(id); renderSoThichUI(); }
async function luuSoThich() { try { await apiCall('/sinh-vien/so-thich', { method: 'POST', body: JSON.stringify({ danh_sach_ma: selectedSoThich }) }); showToast('Đã lưu sở thích!', 'success'); isEditSoThich = false; renderSoThichUI(); } catch (err) { showToast('Lỗi lưu sở thích!', 'error'); } }

async function loadLichRanh() { try { const data = await apiCall('/lich-ranh', { method: 'GET' }); lichRanhBit = data.lich_ranh_bit || "000000000000000000000"; renderLichRanhGrid(); } catch (err) { console.error(err); } }
function renderLichRanhGrid() {
    const grid = document.getElementById('lich-ranh-grid'); if (!grid) return;
    let html = '<div style="font-weight: 600; color: var(--text-secondary); padding: 10px;"></div>';
    thuMap.forEach(thu => { html += `<div style="font-weight: 600; color: var(--text-secondary); padding: 10px; font-size: 14px;">${thu}</div>`; });
    for (let caIndex = 0; caIndex < 3; caIndex++) {
        html += `<div style="font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; justify-content: flex-end; padding-right: 12px;">${caMap[caIndex]}</div>`;
        for (let thuIndex = 0; thuIndex < 7; thuIndex++) {
            const bitIndex = thuIndex * 3 + caIndex; const isAvailable = lichRanhBit[bitIndex] === '1';
            const clickAction = isEditLichRanh ? `onclick="toggleLichCell(${bitIndex})"` : ''; const cursorStyle = isEditLichRanh ? 'pointer' : 'default'; const opacity = (!isEditLichRanh && !isAvailable) ? '0.4' : '1';
            html += `<div class="lich-cell ${isAvailable ? 'active' : ''}" ${clickAction} style="padding: 16px; background: ${isAvailable ? 'var(--pastel-sage-bg)' : 'var(--bg-hover)'}; border: 2px solid ${isAvailable ? 'var(--primary)' : 'transparent'}; border-radius: 8px; cursor: ${cursorStyle}; transition: all 0.2s; opacity: ${opacity};">${isAvailable ? 'Rảnh' : 'Bận'}</div>`;
        }
    }
    grid.innerHTML = html;
    const btnContainer = document.getElementById('lich-ranh-buttons');
    if (!btnContainer) { const newDiv = document.createElement('div'); newDiv.id = 'lich-ranh-buttons'; newDiv.style = 'display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px;'; grid.parentNode.insertBefore(newDiv, grid.nextSibling); }
    if (!isEditLichRanh) { document.getElementById('lich-ranh-buttons').innerHTML = `<button class="btn btn-secondary btn-sm" onclick="batCheDoSuaLich()">Chỉnh sửa Lịch rảnh</button>`; } 
    else { document.getElementById('lich-ranh-buttons').innerHTML = `<button class="btn btn-secondary" onclick="huySuaLich()">Hủy</button><button class="btn btn-primary" onclick="luuLichRanh()">Lưu lịch rảnh</button>`; }
}
function batCheDoSuaLich() { isEditLichRanh = true; renderLichRanhGrid(); }
function huySuaLich() { isEditLichRanh = false; loadLichRanh(); }
function toggleLichCell(bitIndex) { let arr = lichRanhBit.split(''); arr[bitIndex] = arr[bitIndex] === '1' ? '0' : '1'; lichRanhBit = arr.join(''); renderLichRanhGrid(); }
async function luuLichRanh() { try { const data = await apiCall('/lich-ranh', { method: 'PUT', body: JSON.stringify({ lich_ranh_bit: lichRanhBit }) }); showToast(data.message || 'Đã lưu lịch rảnh!', 'success'); isEditLichRanh = false; renderLichRanhGrid(); } catch (err) { showToast('Lỗi khi lưu lịch rảnh!', 'error'); } }

async function loadBangCap() {
    const container = document.getElementById('list-bang-cap'); container.innerHTML = '<p style="color: var(--text-muted); font-style: italic; grid-column: 1/-1;">Đang tải...</p>';
    try {
        const data = await apiCall('/sinh-vien/bang-cap', { method: 'GET' });
        if (!data.danhSach || data.danhSach.length === 0) { container.innerHTML = '<p style="color: var(--text-muted); font-style: italic; grid-column: 1/-1;">Chưa có bằng cấp nào. Hãy bấm "+ Thêm bằng cấp".</p>'; return; }
        container.innerHTML = data.danhSach.map(bc => `<div style="background: var(--bg-main); border: 2px solid var(--border-light); padding: 16px; border-radius: 12px;"><h4 style="font-size: 16px; margin-bottom: 8px; color: var(--text-primary);">${bc.ten_bang_cap}</h4><p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">Loại: ${bc.loai}</p><div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px;"><span style="font-weight: 800; color: var(--secondary-dark);">${bc.diem_so || '—'}</span><span style="color: var(--text-muted);">Cấp ngày: ${bc.ngay_cap}</span></div></div>`).join('');
    } catch (err) { container.innerHTML = '<p style="color: red; grid-column: 1/-1;">Lỗi tải dữ liệu bằng cấp!</p>'; }
}
async function moModalBangCap() {
    const select = document.getElementById('select-bang-cap'); select.innerHTML = '<option value="">Đang tải...</option>'; document.getElementById('modal-bang-cap').style.display = 'flex';
    try { const data = await apiCall('/danh-muc/bang-cap', { method: 'GET' }); if (data.length === 0) { select.innerHTML = '<option value="">Danh mục trống</option>'; return; } select.innerHTML = data.map(bc => `<option value="${bc.ma_loai_bang_cap}">${bc.ten_bang_cap}</option>`).join(''); } catch (err) { select.innerHTML = '<option value="">Lỗi tải dữ liệu</option>'; }
}
async function luuBangCap() {
    const ma_loai = document.getElementById('select-bang-cap').value; const diem_so = document.getElementById('input-diem-bc').value; const ngay_cap = document.getElementById('input-ngay-bc').value;
    if(!ma_loai || !ngay_cap) { showToast('Vui lòng chọn loại và ngày cấp!', 'error'); return; }
    try { await apiCall('/sinh-vien/bang-cap', { method: 'POST', body: JSON.stringify({ ma_loai_bang_cap: parseInt(ma_loai), diem_so, ngay_cap }) }); showToast('Thêm bằng cấp thành công!', 'success'); dongModal('modal-bang-cap'); loadBangCap(); } catch (err) { showToast('Lỗi khi thêm bằng cấp!', 'error'); }
}
function dongModal(id) { document.getElementById(id).style.display = 'none'; }

// ============================================
// ĐỔI MẬT KHẨU & KHIẾU NẠI
// ============================================
function moModalDoiMatKhau() {
    document.getElementById('input-pass-cu').value = '';
    document.getElementById('input-pass-moi').value = '';
    document.getElementById('input-pass-xac-nhan').value = '';
    document.getElementById('modal-doi-mat-khau').style.display = 'flex';
}

function dongModalDoiMatKhau() { document.getElementById('modal-doi-mat-khau').style.display = 'none'; }

async function xuLyDoiMatKhau() {
    const passCu = document.getElementById('input-pass-cu').value;
    const passMoi = document.getElementById('input-pass-moi').value;
    const passXacNhan = document.getElementById('input-pass-xac-nhan').value;

    if (!passCu || !passMoi || !passXacNhan) { showToast('Vui lòng nhập đầy đủ thông tin!', 'error'); return; }
    if (passMoi.length < 6) { showToast('Mật khẩu mới phải có ít nhất 6 ký tự!', 'error'); return; }
    if (passMoi !== passXacNhan) { showToast('Mật khẩu xác nhận không khớp!', 'error'); return; }

    const btn = document.querySelector('#modal-doi-mat-khau .btn-primary');
    btn.textContent = 'Đang xử lý...'; btn.disabled = true;

    try {
        const data = await apiCall('/tai-khoan/doi-mat-khau', {
            method: 'POST',
            body: JSON.stringify({ mat_khau_cu: passCu, mat_khau_moi: passMoi })
        });

        if (data.error) { showToast(data.error, 'error'); } 
        else { showToast('Đổi mật khẩu thành công!', 'success'); dongModalDoiMatKhau(); }
    } catch (err) { showToast(err.message || 'Lỗi kết nối server!', 'error'); } 
    finally { btn.textContent = 'Lưu thay đổi'; btn.disabled = false; }
}

function moModalKhieuNaiDiem(maNhom, tenNhom) {
    document.getElementById('kn-ma-nhom').value = maNhom;
    document.getElementById('kn-ten-nhom').textContent = tenNhom;
    document.getElementById('kn-ly-do').value = '';
    document.getElementById('kn-file-bang-chung').value = '';
    document.getElementById('modal-khieu-nai-diem').style.display = 'flex';
}

async function submitKhieuNaiDiem() {
    const maNhom = document.getElementById('kn-ma-nhom').value;
    const lyDo = document.getElementById('kn-ly-do').value.trim();
    const fileInput = document.getElementById('kn-file-bang-chung');
    
    if (!lyDo) { showToast('Vui lòng nhập lý do khiếu nại!', 'error'); return; }

    const formData = new FormData();
    formData.append("ma_nhom", maNhom);
    formData.append("ly_do", lyDo);
    
    if (fileInput.files.length > 0) { formData.append("file", fileInput.files[0]); }

    const btn = document.querySelector('#modal-khieu-nai-diem .btn-primary');
    const originalText = btn.textContent;
    btn.textContent = 'Đang gửi...'; btn.disabled = true;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/khieu-nai-diem`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await res.json();
        if (!res.ok || data.error) { showToast(data.error || data.detail || 'Lỗi khi gửi khiếu nại!', 'error'); } 
        else {
            showToast(data.message, 'success');
            document.getElementById('modal-khieu-nai-diem').style.display = 'none';
        }
    } catch (err) { showToast('Lỗi kết nối!', 'error'); } 
    finally { btn.textContent = originalText; btn.disabled = false; }
}