let danhSachTatCaNhom = [];
let danhSachYeuCau = [];
let currentManageId = null;
let danhSachMonHocGlobal = []; 
let danhSachYeuCauChoDuyet = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('token')) { window.location.href = 'dang-nhap.html'; return; }
    setupTabs(); loadTatCaDuLieu();
});

function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active')); tab.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            const content = document.getElementById(`tab-${tabName}`);
            if (content) { content.style.display = 'block'; }
        });
    });
}

async function loadTatCaDuLieu() {
    try {
        const dataNhom = await apiCall('/nhom/cua-toi', { method: 'GET' });
        danhSachTatCaNhom = dataNhom.danhSach || [];
        renderDangThamGia(); 
        renderDaTao(); 
        
        const dataYeuCau = await apiCall('/nhom/yeu-cau-gui-di', { method: 'GET' });
        danhSachYeuCau = dataYeuCau.danhSach || [];
        renderYeuCau();
    } catch (err) { showToast('Lỗi tải dữ liệu!', 'error'); }
}

function renderDangThamGia() {
    const list = document.getElementById('list-dang-tham-gia'); 
    const count = document.getElementById('count-dang-tham-gia');
    const dsHoatDong = danhSachTatCaNhom.filter(n => n.trangThai !== 'da_giai_tan');
    count.textContent = dsHoatDong.length;
    if (dsHoatDong.length === 0) { list.innerHTML = `<div class="empty-tab"><p>Bạn chưa tham gia nhóm nào.</p></div>`; return; }
    list.innerHTML = dsHoatDong.map(nhom => renderNhomCard(nhom, 'dang-tham-gia')).join('');
}

function renderDaTao() {
    const list = document.getElementById('list-da-tao'); 
    const count = document.getElementById('count-da-tao');
    const nhomDaTao = danhSachTatCaNhom.filter(n => n.vaiTro === 'truong_nhom' && n.trangThai !== 'da_giai_tan');
    count.textContent = nhomDaTao.length;
    if (nhomDaTao.length === 0) { list.innerHTML = `<div class="empty-tab"><p>Bạn chưa có nhóm nào.</p></div>`; return; }
    list.innerHTML = nhomDaTao.map(nhom => renderNhomCard(nhom, 'da-tao')).join('');
}

function renderYeuCau() {
    const list = document.getElementById('list-yeu-cau'); 
    const count = document.getElementById('count-yeu-cau');
    count.textContent = danhSachYeuCau.length;
    if (danhSachYeuCau.length === 0) { list.innerHTML = `<div class="empty-tab"><p>Bạn chưa gửi yêu cầu nào.</p></div>`; return; }
    list.innerHTML = danhSachYeuCau.map(yc => `
        <div class="nhom-card" onclick="openGroupModal(${yc.maNhom})">
            <div class="nhom-vai-tro" style="background: var(--bg-hover); color: var(--text-secondary);">Đã gửi</div>
            <div><h3 class="nhom-title">${yc.tenNhom}</h3></div>
            <p class="nhom-desc">${yc.moTa || 'Chưa có mô tả'}</p>
            <div class="nhom-meta"><span class="nhom-meta-item">Sĩ số: ${yc.soThanhVienHienTai}/${yc.soThanhVienToiDa}</span></div>
        </div>`).join('');
}

function renderNhomCard(nhom, context) {
    const vaiTroClass = `vai-tro-${nhom.vaiTro === 'truong_nhom' ? 'truong' : nhom.vaiTro === 'pho_nhom' ? 'pho' : 'thanh-vien'}`;
    const vaiTroText = nhom.vaiTro === 'truong_nhom' ? 'Trưởng nhóm' : nhom.vaiTro === 'pho_nhom' ? 'Phó nhóm' : 'Thành viên';
    
    let actions = '';
    if (context === 'dang-tham-gia') { 
        actions = `
            <div style="display: flex; gap: 8px; justify-content: flex-end; width: 100%;">
                <!-- NÚT RỜI NHÓM ĐƯỢC ĐƯA RA NGOÀI -->
                <button class="btn btn-secondary btn-sm" style="color: #EF4444; border-color: #EF4444;" onclick="event.stopPropagation(); xacNhanRoiNhom(${nhom.maNhom})">Rời nhóm</button>
                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); vaoNhom(${nhom.maNhom})">Vào nhóm (Chat)</button>
            </div>
        `; 
    } else if (context === 'da-tao') { 
        actions = `
            <div style="display: flex; gap: 8px; justify-content: flex-end; width: 100%;">
                <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); moModalQuanLy(${nhom.maNhom})">Quản lý</button>
                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); moModalDangTuyen(${nhom.maNhom})">Đăng tuyển</button>
            </div>
        `; 
    }
    
    return `
        <div class="nhom-card ${vaiTroClass}" onclick="openGroupModal(${nhom.maNhom})">
            <div class="nhom-vai-tro">${vaiTroText}</div>
            <div><h3 class="nhom-title">${nhom.tenNhom}</h3><div class="nhom-type" style="margin-top: 6px;">${nhom.tenMonHoc || 'Chưa rõ môn'}</div></div>
            <p class="nhom-desc">${nhom.moTa || 'Chưa có mô tả'}</p>
            <div class="nhom-meta"><span class="nhom-meta-item">Sĩ số: ${nhom.soThanhVienHienTai}/${nhom.soThanhVienToiDa}</span></div>
            <div class="nhom-actions">${actions}</div>
        </div>
    `;
}

function vaoNhom(maNhom) { window.location.href = `chat.html?maNhom=${maNhom}`; }

function openGroupModal(maNhom) {
    const group = danhSachTatCaNhom.find(g => g.maNhom === maNhom) || danhSachYeuCau.find(g => g.maNhom === maNhom);
    if (!group) return;
    document.getElementById('modal-title').textContent = group.tenNhom;
    document.getElementById('modal-desc').textContent = group.moTa || 'Chưa có mô tả';
    
    let actions = '';
    if (group.vaiTro === 'truong_nhom') {
        // Nếu là trưởng nhóm, không cho rời nhóm (phải dùng nút Giải tán hoặc Chuyển quyền)
        actions = `<button class="btn btn-secondary" onclick="closeGroupModal()">Đóng</button>
                   <button class="btn btn-primary" onclick="closeGroupModal(); moModalQuanLy(${group.maNhom});">Quản lý nhóm</button>`;
    } else {
        // Nếu là thành viên, có thêm nút Rời nhóm
        actions = `<button class="btn btn-secondary" onclick="closeGroupModal()">Đóng</button>
                   <button class="btn" style="color: #EF4444; border: 1px solid #EF4444; background: transparent;" onclick="xacNhanRoiNhom(${group.maNhom})">Rời nhóm</button>
                   <button class="btn btn-primary" onclick="closeGroupModal(); vaoNhom(${group.maNhom});">Vào nhóm (Chat)</button>`;
    }
    
    document.getElementById('modal-actions').innerHTML = actions;
    document.getElementById('group-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeGroupModal() { document.getElementById('group-modal').style.display = 'none'; document.body.style.overflow = ''; }

function taoNhomMoi() { 
    document.getElementById('modal-tao-nhom').style.display = 'flex'; 
    document.getElementById('tao-ten-nhom').value = '';
    document.getElementById('tao-mo-ta').value = '';
    loadMonHoc(); 
}
function dongModalTaoNhom() { document.getElementById('modal-tao-nhom').style.display = 'none'; }

async function loadMonHoc() {
    if (danhSachMonHocGlobal.length > 0) return;
    try { 
        const data = await apiCall('/mon-hoc', { method: 'GET' }); 
        danhSachMonHocGlobal = data; 
        const select = document.getElementById('tao-mon-hoc');
        select.innerHTML = '<option value="">-- Chọn môn học --</option>' + data.map(m => `<option value="${m.ma_mon_hoc}">${m.ma_mon} - ${m.ten_mon_hoc}</option>`).join('');
    } catch (err) { console.error('Lỗi tải môn học'); }
}

async function xuLyTaoNhom() {
    const maMonHocVal = document.getElementById('tao-mon-hoc').value;
    if (!maMonHocVal) { showToast('Vui lòng chọn Môn học!', 'error'); return; }
    const payload = { ten_nhom: document.getElementById('tao-ten-nhom').value, ma_mon_hoc: parseInt(maMonHocVal), linh_vuc: "An toàn thông tin", mo_ta: document.getElementById('tao-mo-ta').value, hinh_thuc_hoat_dong: "Offline", dia_diem_co_dinh: "Thư viện", so_thanh_vien_toi_da: 10, mo_ta_de_tai: "", muc_tieu: "" };
    if (!payload.ten_nhom) { showToast('Vui lòng nhập Tên nhóm!', 'error'); return; }
    const btn = document.querySelector('#modal-tao-nhom .btn-primary'); btn.textContent = 'Đang tạo...'; btn.disabled = true;
    try { const data = await apiCall('/nhom/tao-moi', { method: 'POST', body: JSON.stringify(payload) }); showToast(data.message || 'Tạo nhóm thành công!', 'success'); dongModalTaoNhom(); await loadTatCaDuLieu(); } catch (err) { showToast(err.message || 'Lỗi khi tạo nhóm!', 'error'); } finally { btn.textContent = 'Tạo nhóm'; btn.disabled = false; }
}

// ============================================
// LOGIC ĐĂNG TUYỂN
// ============================================
async function moModalDangTuyen(maNhom) {
    document.getElementById('dang-tuyen-ma-nhom').value = maNhom; 
    document.getElementById('modal-dang-tuyen').style.display = 'flex';
    
    const knContainer = document.getElementById('dt-list-ky-nang'); 
    const stContainer = document.getElementById('dt-list-so-thich');
    knContainer.innerHTML = 'Đang tải...'; stContainer.innerHTML = 'Đang tải...';
    
    try {
        const allKn = await apiCall('/danh-muc/ky-nang', { method: 'GET' });
        knContainer.innerHTML = allKn.map(kn => `<label style="display:inline-flex; align-items:center; gap:6px; background: var(--bg-card); padding: 6px 12px; border-radius: var(--radius-md); border: 1px solid var(--border); cursor:pointer;"><input type="checkbox" value="${kn.ma_ky_nang}" class="dt-kn-checkbox"> ${kn.ten_ky_nang}</label>`).join('');
        
        const allSt = await apiCall('/danh-muc/so-thich', { method: 'GET' });
        stContainer.innerHTML = allSt.map(st => `<label style="display:inline-flex; align-items:center; gap:6px; background: var(--bg-card); padding: 6px 12px; border-radius: var(--radius-md); border: 1px solid var(--border); cursor:pointer;"><input type="checkbox" value="${st.ma_so_thich}" class="dt-st-checkbox"> ${st.ten_so_thich}</label>`).join('');
    } catch (e) { console.error(e); }
}

function dongModalDangTuyen() { 
    document.getElementById('modal-dang-tuyen').style.display = 'none'; 
    document.getElementById('dang-tuyen-yeu-cau-cung').value = ''; 
    document.getElementById('dang-tuyen-gpa').value = '0'; 
    document.getElementById('dang-tuyen-so-luong').value = '2'; 
}

async function xuLyDangTuyen() {
    const maNhom = document.getElementById('dang-tuyen-ma-nhom').value; 
    if (!maNhom) return;
    
    const selectedKn = Array.from(document.querySelectorAll('.dt-kn-checkbox:checked')).map(cb => cb.value).join(',');
    const selectedSt = Array.from(document.querySelectorAll('.dt-st-checkbox:checked')).map(cb => cb.value).join(',');
    const hanChot = document.getElementById('dang-tuyen-han-chot').value;

    const payload = { 
        so_luong_can_tuyen: parseInt(document.getElementById('dang-tuyen-so-luong').value) || 1, 
        yeu_cau_gpa: parseFloat(document.getElementById('dang-tuyen-gpa').value) || 0, 
        yeu_cau_cung: document.getElementById('dang-tuyen-yeu-cau-cung').value, 
        yeu_cau_ky_nang: selectedKn, 
        yeu_cau_so_thich: selectedSt,
        han_chot: hanChot 
    };
    
    const btn = document.querySelector('#modal-dang-tuyen .btn-primary'); 
    btn.textContent = 'Đang đăng...'; btn.disabled = true;
    
    try { 
        const data = await apiCall(`/nhom/${maNhom}/tao-bai-dang`, { method: 'POST', body: JSON.stringify(payload) }); 
        
        if (data.error) {
            dongModalDangTuyen();
            document.getElementById('modal-da-co-bai-dang').style.display = 'flex';
            return;
        }

        showToast(data.message || 'Đăng tuyển thành công!', 'success'); 
        dongModalDangTuyen(); 
        loadTatCaDuLieu();
    } catch (err) { 
        showToast(err.message || 'Lỗi khi đăng tuyển!', 'error'); 
    } finally { 
        btn.textContent = 'Đăng tuyển ngay'; btn.disabled = false; 
    }
}

// ============================================
// QUẢN LÝ NHÓM
// ============================================
function moModalQuanLy(maNhom) { 
    currentManageId = maNhom; 
    document.getElementById('modal-quan-ly').style.display = 'flex'; 
    switchQLTab('yc'); 
    loadThongTinQuanLy(); 
    loadYeuCauQuanLy(); 
    loadThanhVienQuanLy(); 
}

function closeModalQuanLy() { 
    document.getElementById('modal-quan-ly').style.display = 'none'; 
    currentManageId = null; 
}

function switchQLTab(tab) {
    document.getElementById('ql-tab-yc').classList.remove('active'); 
    document.getElementById('ql-tab-tv').classList.remove('active'); 
    document.getElementById('ql-tab-bd').classList.remove('active');
    
    document.getElementById('ql-content-yc').style.display = 'none'; 
    document.getElementById('ql-content-tv').style.display = 'none'; 
    document.getElementById('ql-content-bd').style.display = 'none';
    
    if (tab === 'yc') { 
        document.getElementById('ql-tab-yc').classList.add('active'); 
        document.getElementById('ql-content-yc').style.display = 'block'; 
    } 
    else if (tab === 'tv') { 
        document.getElementById('ql-tab-tv').classList.add('active'); 
        document.getElementById('ql-content-tv').style.display = 'block'; 
    }
    else if (tab === 'bd') {
        document.getElementById('ql-tab-bd').classList.add('active'); 
        document.getElementById('ql-content-bd').style.display = 'block'; 
        loadBaiDangQuanLy();
    }
}

async function loadThongTinQuanLy() { try { const data = await apiCall(`/nhom/${currentManageId}/chi-tiet`, { method: 'GET' }); document.getElementById('ql-ten-nhom').textContent = data.tenNhom; document.getElementById('ql-mon-hoc').textContent = data.tenMonHoc || 'Chưa cập nhật'; document.getElementById('ql-si-so').textContent = `${data.soThanhVienHienTai}/${data.soThanhVienToiDa}`; } catch (err) { console.error(err); } }

async function loadYeuCauQuanLy() {
    const list = document.getElementById('ql-content-yc'); 
    list.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">Đang tải yêu cầu...</p>';
    try {
        const data = await apiCall(`/nhom/${currentManageId}/yeu-cau-cho-duyet`, { method: 'GET' }); 
        danhSachYeuCauChoDuyet = data.danhSach || []; // Lưu lại để dùng cho Modal
        document.getElementById('ql-count-yc').textContent = danhSachYeuCauChoDuyet.length;
        
        if (danhSachYeuCauChoDuyet.length === 0) { 
            list.innerHTML = `<div class="empty-tab"><p>Hiện tại không có yêu cầu nào chờ duyệt.</p></div>`; 
            return; 
        }
        
        list.innerHTML = danhSachYeuCauChoDuyet.map(yc => `
            <div style="background: var(--bg-main); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="font-size: 16px; color: var(--text-primary); margin-bottom: 4px;">${yc.hoTen} <span style="font-size: 13px; font-weight: normal; color: var(--text-muted);">(${yc.mssv})</span></h3>
                    <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px;">Chuyên ngành: ${yc.chuyenNganh}</p>
                    ${yc.loiNhan ? `<div style="background: var(--bg-hover); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 13px; border-left: 3px solid var(--primary); color: var(--text-primary);">"${yc.loiNhan}"</div>` : ''}
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-secondary btn-sm" onclick="xemHoSoUngVien(${yc.maTaiKhoan})">Xem hồ sơ</button>
                    <button class="btn btn-secondary btn-sm" style="color: #EF4444; border-color: #EF4444;" onclick="tuChoiYeuCau(${yc.maYeuCau})">Từ chối</button>
                    <button class="btn btn-primary btn-sm" onclick="duyetYeuCau(${yc.maYeuCau})">Chấp nhận</button>
                </div>
            </div>
        `).join('');
    } catch (err) { 
        list.innerHTML = `<p style="color: #EF4444;">Lỗi tải yêu cầu!</p>`; 
    }
}

async function loadThanhVienQuanLy() {
    const list = document.getElementById('ql-content-tv'); list.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">Đang tải thành viên...</p>';
    try {
        const data = await apiCall(`/nhom/${currentManageId}/thanh-vien`, { method: 'GET' }); const danhSach = data.danhSach || [];
        document.getElementById('ql-count-tv').textContent = danhSach.length;
        list.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px;">` + danhSach.map(tv => { 
            const chuCaiDau = tv.hoTen.split(' ').pop().charAt(0); 
            const isTruong = tv.vaiTro === 'truong_nhom'; 
            const btnXoa = !isTruong ? `<button class="btn btn-secondary btn-sm" style="padding: 4px 8px; color: #EF4444; border-color: #EF4444;" onclick="xoaThanhVien(${tv.maTaiKhoan}, '${tv.hoTen}')">Xóa</button>` : '';
            return `<div style="background: var(--bg-main); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; display: flex; align-items: center; gap: 12px; justify-content: space-between;"><div style="display: flex; align-items: center; gap: 12px;"><div style="width: 40px; height: 40px; border-radius: 50%; background: var(--bg-hover); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold;">${chuCaiDau}</div><div><div style="font-weight: 600; color: var(--text-primary); font-size: 15px; margin-bottom: 2px;">${tv.hoTen}</div><div style="font-size: 12px; color: ${isTruong ? 'var(--primary)' : 'var(--text-secondary)'}; font-weight: 500;">${isTruong ? 'Trưởng nhóm' : 'Thành viên'}</div></div></div>${btnXoa}</div>`; 
        }).join('') + `</div>`;
    } catch (err) { list.innerHTML = `<p style="color: #EF4444;">Lỗi tải thành viên!</p>`; }
}

async function duyetYeuCau(maYeuCau) {
    showCustomConfirm('Duyệt thành viên này vào nhóm?', async () => {
        try { 
            await apiCall(`/nhom/yeu-cau/${maYeuCau}/duyet`, { method: 'POST' }); 
            showToast('Đã duyệt!', 'success'); 
            loadYeuCauQuanLy(); loadThanhVienQuanLy(); loadTatCaDuLieu(); 
            if(document.getElementById('ql-tab-bd').classList.contains('active')) loadBaiDangQuanLy();
        } catch (err) { showToast('Lỗi!', 'error'); }
    });
}

async function tuChoiYeuCau(maYeuCau) {
    showCustomConfirm('Từ chối yêu cầu tham gia này?', async () => {
        try { await apiCall(`/nhom/yeu-cau/${maYeuCau}/tu-choi`, { method: 'POST', body: JSON.stringify({ ly_do: "" }) }); showToast('Đã từ chối!', 'success'); loadYeuCauQuanLy(); } catch (err) { showToast('Lỗi!', 'error'); }
    });
}

async function xoaThanhVien(maTaiKhoan, hoTen) {
    showCustomConfirm(`Xóa ${hoTen} khỏi nhóm?`, async () => {
        try { await apiCall(`/nhom/${currentManageId}/thanh-vien/${maTaiKhoan}`, { method: 'DELETE' }); showToast('Đã xóa!', 'success'); loadThanhVienQuanLy(); loadTatCaDuLieu(); } catch (err) { showToast('Lỗi!', 'error'); }
    });
}

// ============================================
// QUẢN LÝ BÀI ĐĂNG TUYỂN
// ============================================
async function loadBaiDangQuanLy() {
    const list = document.getElementById('ql-content-bd');
    list.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">Đang tải bài đăng...</p>';
    
    try {
        const data = await apiCall(`/nhom/${currentManageId}/bai-dang`, { method: 'GET' });
        
        document.getElementById('ql-count-bd').textContent = data.length;

        if (data.length === 0) {
            list.innerHTML = `<div class="empty-tab"><p>Hiện tại nhóm không có bài đăng tuyển nào đang mở.</p></div>`;
            return;
        }

        list.innerHTML = data.map(bd => `
            <div style="background: var(--bg-main); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="font-size: 16px; color: var(--text-primary); margin-bottom: 4px;">${bd.tieuDe}</h3>
                    <p style="font-size: 14px; color: var(--text-secondary);">
                        Cần tuyển: <strong>${bd.soLuong}</strong> | Hạn chót: <strong>${bd.hanChot}</strong>
                    </p>
                </div>
                <button class="btn btn-secondary btn-sm" style="color: #EF4444; border-color: #EF4444;" onclick="xoaBaiDang(${bd.maBaiDang})">Gỡ bài đăng</button>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = `<p style="color: #EF4444;">Lỗi tải danh sách bài đăng!</p>`;
    }
}

async function xoaBaiDang(maBaiDang) {
    showCustomConfirm('Bạn có chắc chắn muốn gỡ bài đăng tuyển này? Sinh viên sẽ không thể tìm thấy nhóm của bạn nữa.', async () => {
        try {
            await apiCall(`/nhom/${currentManageId}/bai-dang/${maBaiDang}`, { method: 'DELETE' });
            showToast('Đã gỡ bài đăng thành công!', 'success');
            loadBaiDangQuanLy(); 
            loadTatCaDuLieu(); 
        } catch (err) {
            showToast('Lỗi khi gỡ bài đăng!', 'error');
        }
    });
}

// ============================================
// GIẢI TÁN NHÓM (DÀNH CHO TRƯỞNG NHÓM)
// ============================================
function giaiTanNhom() {
    showCustomConfirm('Bạn có chắc chắn muốn GIẢI TÁN nhóm này? Hành động này sẽ đóng tất cả bài đăng tuyển và không thể hoàn tác!', async () => {
        try {
            await apiCall(`/nhom/${currentManageId}/giai-tan`, { method: 'DELETE' });
            
            showToast('Đã giải tán nhóm thành công!', 'success');
            closeModalQuanLy(); 
            loadTatCaDuLieu();  
            
        } catch (err) {
            showToast(err.message || 'Lỗi khi giải tán nhóm!', 'error');
        }
    });
}

// ============================================
// XEM HỒ SƠ ỨNG VIÊN
// ============================================
async function xemHoSoUngVien(maTaiKhoan) {
    const container = document.getElementById('noi-dung-ho-so');
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Đang tải hồ sơ...</p>';
    document.getElementById('modal-xem-ho-so').style.display = 'flex';

    // Tìm lời nhắn của ứng viên này
    const yeuCau = danhSachYeuCauChoDuyet.find(yc => yc.maTaiKhoan === maTaiKhoan);
    const loiNhan = yeuCau ? yeuCau.loiNhan : "";

    try {
        const data = await apiCall(`/sinh-vien/${maTaiKhoan}/ho-so-cong-khai`, { method: 'GET' });
        
        const avatarUrl = data.anh_dai_dien || `https://api.dicebear.com/7.x/adventurer/svg?seed=${data.ho_ten}`;
        
        let kyNangHtml = data.ky_nang.length > 0 
            ? data.ky_nang.map(k => `<span style="background: var(--pastel-sage-bg); color: var(--pastel-sage-text); padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">${k}</span>`).join(' ')
            : '<span style="color: var(--text-muted); font-style: italic;">Chưa cập nhật</span>';

        let soThichHtml = data.so_thich.length > 0 
            ? data.so_thich.map(s => `<span style="background: var(--pastel-honey-bg); color: var(--pastel-honey-text); padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">${s}</span>`).join(' ')
            : '<span style="color: var(--text-muted); font-style: italic;">Chưa cập nhật</span>';

        // THIẾT KẾ LẠI KHỐI LỜI NHẮN (Tối giản, sang trọng)
        let loiNhanHtml = loiNhan ? `
            <div style="margin-top: 24px;">
                <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Lời nhắn ứng tuyển</p>
                <div style="background: var(--bg-hover); padding: 16px 20px; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
                    <p style="font-size: 15px; color: var(--text-primary); line-height: 1.6; margin: 0; font-style: italic; opacity: 0.9;">
                        "${loiNhan}"
                    </p>
                </div>
            </div>
        ` : '';

        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 24px;">
                <img src="${avatarUrl}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-light);">
                <div>
                    <h2 style="font-size: 24px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">${data.ho_ten}</h2>
                    <p style="font-size: 14px; color: var(--primary); font-weight: 600;">MSSV: ${data.mssv}</p>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                <div style="background: var(--bg-main); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
                    <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 4px; text-transform: uppercase; font-weight: 600;">Chuyên ngành</p>
                    <p style="font-size: 15px; color: var(--text-primary); font-weight: 600;">${data.chuyen_nganh}</p>
                </div>
                <div style="background: var(--bg-main); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
                    <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 4px; text-transform: uppercase; font-weight: 600;">GPA / Điểm uy tín</p>
                    <p style="font-size: 15px; color: var(--text-primary); font-weight: 600;">${data.gpa} / <span style="color: #F59E0B;">${data.diem_uy_tin} ★</span></p>
                </div>
            </div>

            <div style="margin-bottom: 24px;">
                <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600;">Giới thiệu:</p>
                <p style="font-size: 14px; color: var(--text-primary); line-height: 1.6; background: var(--bg-main); padding: 12px; border-radius: var(--radius-md);">${data.mo_ta_ban_than}</p>
            </div>

            <div style="margin-bottom: 24px;">
                <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600;">Kỹ năng:</p>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">${kyNangHtml}</div>
            </div>

            <div>
                <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600;">Sở thích:</p>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">${soThichHtml}</div>
            </div>

            ${loiNhanHtml}
        `;
    } catch (err) {
        container.innerHTML = '<p style="color: #EF4444; text-align: center;">Lỗi tải hồ sơ ứng viên!</p>';
    }
}

function dongModalXemHoSo() {
    document.getElementById('modal-xem-ho-so').style.display = 'none';
}

// ============================================
// RỜI NHÓM
// ============================================
function xacNhanRoiNhom(maNhom) {
    showCustomConfirm('Bạn có chắc chắn muốn rời khỏi nhóm này? Lịch sử chat và đánh giá của bạn vẫn sẽ được giữ lại.', async () => {
        try {
            await apiCall(`/nhom/${maNhom}/roi-nhom`, { method: 'DELETE' });
            showToast('Đã rời nhóm thành công!', 'success');
            closeGroupModal();
            loadTatCaDuLieu(); // Tải lại danh sách nhóm bên ngoài
        } catch (err) {
            showToast(err.message || 'Lỗi khi rời nhóm!', 'error');
        }
    });
}
// ============================================
// CHỈNH SỬA THÔNG TIN NHÓM
// ============================================
async function moModalSuaNhom() {
    if (!currentManageId) return;
    try {
        // Lấy thông tin nhóm hiện tại
        const data = await apiCall(`/nhom/${currentManageId}/chi-tiet`, { method: 'GET' });
        
        // Điền dữ liệu vào form
        document.getElementById('sua-ten-nhom').value = data.tenNhom;
        document.getElementById('sua-mo-ta').value = data.moTa || '';
        document.getElementById('sua-hinh-thuc').value = data.hinhThucHoatDong || '';
        document.getElementById('sua-dia-diem').value = data.diaDiemCoDinh || '';
        document.getElementById('sua-si-so').value = data.soThanhVienToiDa;
        
        document.getElementById('modal-sua-nhom').style.display = 'flex';
    } catch (err) {
        showToast('Lỗi tải thông tin nhóm!', 'error');
    }
}

function dongModalSuaNhom() {
    document.getElementById('modal-sua-nhom').style.display = 'none';
}

async function xuLySuaNhom() {
    const tenNhom = document.getElementById('sua-ten-nhom').value.trim();
    const moTa = document.getElementById('sua-mo-ta').value.trim();
    const hinhThuc = document.getElementById('sua-hinh-thuc').value.trim();
    const diaDiem = document.getElementById('sua-dia-diem').value.trim();
    const siSo = parseInt(document.getElementById('sua-si-so').value);

    if (!tenNhom || !siSo) {
        showToast('Vui lòng nhập Tên nhóm và Sĩ số!', 'error');
        return;
    }

    const btn = document.querySelector('#modal-sua-nhom .btn-primary');
    btn.textContent = 'Đang lưu...'; btn.disabled = true;

    try {
        const payload = {
            ten_nhom: tenNhom,
            mo_ta: moTa,
            hinh_thuc_hoat_dong: hinhThuc,
            dia_diem_co_dinh: diaDiem,
            so_thanh_vien_toi_da: siSo
        };

        const res = await apiCall(`/nhom/${currentManageId}/cap-nhat`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        if (res.error) {
            showToast(res.error, 'error');
        } else {
            showToast('Cập nhật thông tin thành công!', 'success');
            dongModalSuaNhom();
            loadThongTinQuanLy(); // Cập nhật lại header bảng quản lý
            loadTatCaDuLieu();    // Cập nhật lại danh sách nhóm bên ngoài
        }
    } catch (err) {
        showToast(err.message || 'Lỗi khi cập nhật!', 'error');
    } finally {
        btn.textContent = 'Lưu thay đổi'; btn.disabled = false;
    }
}