let danhSachTatCaNhom = [];
let danhSachYeuCau = [];
let currentManageId = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('token')) { window.location.href = 'dang-nhap.html'; return; }
    setupTabs(); loadTatCaDuLieu();
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { closeBook(); dongModalTaoNhom(); dongModalDangTuyen(); closeModalQuanLy(); closeModalTuChoi(); }
    });
});

function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active')); tab.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            const content = document.getElementById(`tab-${tabName}`);
            if (content) { content.style.display = 'block'; content.style.animation = 'none'; content.offsetHeight; content.style.animation = 'fadeInUp 0.3s ease'; }
        });
    });
}

async function loadTatCaDuLieu() {
    try {
        const dataNhom = await apiCall('/nhom/cua-toi', { method: 'GET' });
        danhSachTatCaNhom = dataNhom.danhSach || [];
        renderDangThamGia(); renderDaTao();
        const dataYeuCau = await apiCall('/nhom/yeu-cau-gui-di', { method: 'GET' });
        danhSachYeuCau = dataYeuCau.danhSach || [];
        renderYeuCau();
        document.getElementById('count-loi-moi').textContent = '0';
        document.getElementById('list-loi-moi').innerHTML = `<div class="empty-tab"><p>Tính năng Lời mời đang phát triển</p></div>`;
    } catch (err) { showToast('Lỗi tải dữ liệu!', 'error'); console.error(err); }
}

function renderDangThamGia() {
    const list = document.getElementById('list-dang-tham-gia'); const count = document.getElementById('count-dang-tham-gia');
    count.textContent = danhSachTatCaNhom.length;
    if (danhSachTatCaNhom.length === 0) { list.innerHTML = `<div class="empty-tab"><p>Bạn chưa tham gia nhóm nào.</p></div>`; return; }
    list.innerHTML = danhSachTatCaNhom.map(nhom => renderNhomCard(nhom, 'dang-tham-gia')).join('');
}

function renderDaTao() {
    const list = document.getElementById('list-da-tao'); const count = document.getElementById('count-da-tao');
    const nhomDaTao = danhSachTatCaNhom.filter(n => n.vaiTro === 'truong_nhom');
    count.textContent = nhomDaTao.length;
    if (nhomDaTao.length === 0) { list.innerHTML = `<div class="empty-tab"><p>Bạn chưa tạo nhóm nào.</p></div>`; return; }
    list.innerHTML = nhomDaTao.map(nhom => renderNhomCard(nhom, 'da-tao')).join('');
}

function renderYeuCau() {
    const list = document.getElementById('list-yeu-cau'); const count = document.getElementById('count-yeu-cau');
    count.textContent = danhSachYeuCau.length;
    if (danhSachYeuCau.length === 0) { list.innerHTML = `<div class="empty-tab"><p>Bạn chưa gửi yêu cầu nào.</p></div>`; return; }
    list.innerHTML = danhSachYeuCau.map(yc => `
        <div class="nhom-card" onclick="xemChiTiet(${yc.maNhom})">
            <div class="nhom-vai-tro" style="background: var(--bg-hover); color: var(--text-secondary);">Đã gửi</div>
            <div><h3 class="nhom-title">${yc.tenNhom}</h3><div class="nhom-type" style="margin-top: 6px;">Nhóm học tập</div></div>
            <p class="nhom-desc">${yc.moTa || 'Chưa có mô tả'}</p>
            <div class="nhom-meta">
                ${yc.tenMonHoc ? `<span class="nhom-meta-item">Môn: ${yc.tenMonHoc}</span>` : ''}
                <span class="nhom-meta-item">Sĩ số: ${yc.soThanhVienHienTai}/${yc.soThanhVienToiDa}</span>
            </div>
            <div class="yeu-cau-status ${yc.trangThai === 'cho_duyet' ? 'status-pending' : yc.trangThai === 'da_chap_nhan' ? 'status-accepted' : 'status-rejected'}" style="margin-top: 8px;">
                ${yc.trangThai === 'cho_duyet' ? 'Chờ duyệt' : yc.trangThai === 'da_chap_nhan' ? 'Đã chấp nhận' : 'Bị từ chối'}
            </div>
        </div>`).join('');
}

function renderNhomCard(nhom, context) {
    const vaiTroClass = `vai-tro-${nhom.vaiTro === 'truong_nhom' ? 'truong' : nhom.vaiTro === 'pho_nhom' ? 'pho' : 'thanh-vien'}`;
    const vaiTroText = nhom.vaiTro === 'truong_nhom' ? 'Trưởng nhóm' : nhom.vaiTro === 'pho_nhom' ? 'Phó nhóm' : 'Thành viên';
    let actions = '';
    
    if (context === 'dang-tham-gia') { 
        actions = `<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); xemChiTiet(${nhom.maNhom})">Chi tiết</button><button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); vaoNhom(${nhom.maNhom})">Vào nhóm</button>`; 
    } else if (context === 'da-tao') { 
        actions = `<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); moModalQuanLy(${nhom.maNhom})">Quản lý</button><button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); moModalDangTuyen(${nhom.maNhom})">Đăng tuyển</button>`; 
    }
    
    return `
        <div class="nhom-card ${vaiTroClass}" onclick="xemChiTiet(${nhom.maNhom})">
            <div class="nhom-vai-tro">${vaiTroText}</div>
            <div><h3 class="nhom-title">${nhom.tenNhom}</h3><div class="nhom-type" style="margin-top: 6px;">${nhom.tenMonHoc || 'Chưa rõ môn'}</div></div>
            <p class="nhom-desc">${nhom.moTa || 'Chưa có mô tả'}</p>
            <div class="nhom-meta">
                ${nhom.tenMonHoc ? `<span class="nhom-meta-item">Môn: ${nhom.tenMonHoc}</span>` : ''}
                <span class="nhom-meta-item">Sĩ số: ${nhom.soThanhVienHienTai}/${nhom.soThanhVienToiDa}</span>
            </div>
            <div class="nhom-actions">${actions}</div>
        </div>
    `;
}

function xemChiTiet(maNhom) { openBook(maNhom); }
function vaoNhom(maNhom) { showToast(`Chức năng phòng chat đang phát triển!`, 'success'); }

// MODAL TẠO NHÓM
function taoNhomMoi() { document.getElementById('modal-tao-nhom').style.display = 'flex'; loadMonHoc(); }
function dongModalTaoNhom() { document.getElementById('modal-tao-nhom').style.display = 'none'; }
async function loadMonHoc() {
    const select = document.getElementById('tao-mon-hoc'); if (select.options.length > 1) return;
    try { const data = await apiCall('/mon-hoc', { method: 'GET' }); select.innerHTML = '<option value="">-- Chọn môn học --</option>' + data.map(m => `<option value="${m.ma_mon_hoc}">${m.ma_mon} - ${m.ten_mon_hoc}</option>`).join(''); } catch (err) { select.innerHTML = '<option value="">Lỗi tải môn học</option>'; }
}
async function xuLyTaoNhom() {
    const maMonHocVal = document.getElementById('tao-mon-hoc').value;
    const payload = { ten_nhom: document.getElementById('tao-ten-nhom').value, ma_mon_hoc: parseInt(maMonHocVal), linh_vuc: document.getElementById('tao-linh-vuc').value, mo_ta: document.getElementById('tao-mo-ta').value, hinh_thuc_hoat_dong: "Offline", dia_diem_co_dinh: "Thư viện", so_thanh_vien_toi_da: 10, mo_ta_de_tai: "", muc_tieu: "" };
    if (!payload.ten_nhom || isNaN(payload.ma_mon_hoc)) { showToast('Vui lòng nhập Tên nhóm và chọn Môn học!', 'error'); return; }
    const btn = document.querySelector('#modal-tao-nhom .btn-primary'); btn.textContent = 'Đang tạo...'; btn.disabled = true;
    try { const data = await apiCall('/nhom/tao-moi', { method: 'POST', body: JSON.stringify(payload) }); showToast(data.message || 'Tạo nhóm thành công!', 'success'); dongModalTaoNhom(); document.getElementById('tao-ten-nhom').value = ''; document.getElementById('tao-mo-ta').value = ''; await loadTatCaDuLieu(); } catch (err) { showToast(err.message || 'Lỗi khi tạo nhóm!', 'error'); } finally { btn.textContent = 'Tạo nhóm'; btn.disabled = false; }
}

// MODAL ĐĂNG TUYỂN
async function moModalDangTuyen(maNhom) {
    document.getElementById('dang-tuyen-ma-nhom').value = maNhom; document.getElementById('modal-dang-tuyen').style.display = 'flex';
    const knContainer = document.getElementById('dt-list-ky-nang'); const stContainer = document.getElementById('dt-list-so-thich');
    knContainer.innerHTML = 'Đang tải...'; stContainer.innerHTML = 'Đang tải...';
    try {
        const allKn = await apiCall('/danh-muc/ky-nang', { method: 'GET' });
        knContainer.innerHTML = allKn.map(kn => `<label style="display:inline-flex; align-items:center; gap:5px; background: white; padding: 6px 12px; border-radius: 20px; border: 1px solid var(--border); cursor:pointer;"><input type="checkbox" value="${kn.ma_ky_nang}" class="dt-kn-checkbox"> ${kn.ten_ky_nang}</label>`).join('');
        const allSt = await apiCall('/danh-muc/so-thich', { method: 'GET' });
        stContainer.innerHTML = allSt.map(st => `<label style="display:inline-flex; align-items:center; gap:5px; background: white; padding: 6px 12px; border-radius: 20px; border: 1px solid var(--border); cursor:pointer;"><input type="checkbox" value="${st.ma_so_thich}" class="dt-st-checkbox"> ${st.ten_so_thich}</label>`).join('');
    } catch (e) { console.error(e); }
}
function dongModalDangTuyen() { document.getElementById('modal-dang-tuyen').style.display = 'none'; document.getElementById('dang-tuyen-yeu-cau-cung').value = ''; document.getElementById('dang-tuyen-gpa').value = '0'; document.getElementById('dang-tuyen-so-luong').value = '2'; }
async function xuLyDangTuyen() {
    const maNhom = document.getElementById('dang-tuyen-ma-nhom').value; if (!maNhom) return;
    const selectedKn = Array.from(document.querySelectorAll('.dt-kn-checkbox:checked')).map(cb => cb.value).join(',');
    const selectedSt = Array.from(document.querySelectorAll('.dt-st-checkbox:checked')).map(cb => cb.value).join(',');
    const payload = { so_luong_can_tuyen: parseInt(document.getElementById('dang-tuyen-so-luong').value) || 1, yeu_cau_gpa: parseFloat(document.getElementById('dang-tuyen-gpa').value) || 0, yeu_cau_cung: document.getElementById('dang-tuyen-yeu-cau-cung').value, yeu_cau_ky_nang: selectedKn, yeu_cau_so_thich: selectedSt };
    const btn = document.querySelector('#modal-dang-tuyen .btn-primary'); btn.textContent = 'Đang đăng...'; btn.disabled = true;
    try { const data = await apiCall(`/nhom/${maNhom}/tao-bai-dang`, { method: 'POST', body: JSON.stringify(payload) }); showToast(data.message || 'Đăng tuyển thành công!', 'success'); dongModalDangTuyen(); } catch (err) { showToast(err.message || 'Lỗi khi đăng tuyển!', 'error'); } finally { btn.textContent = 'Đăng tuyển ngay'; btn.disabled = false; }
}

// MODAL QUẢN LÝ NHÓM
function moModalQuanLy(maNhom) { currentManageId = maNhom; document.getElementById('modal-quan-ly').style.display = 'flex'; switchQLTab('yc'); loadThongTinQuanLy(); loadYeuCauQuanLy(); loadThanhVienQuanLy(); }
function closeModalQuanLy() { document.getElementById('modal-quan-ly').style.display = 'none'; currentManageId = null; }
function switchQLTab(tab) {
    document.getElementById('ql-tab-yc').classList.remove('active'); document.getElementById('ql-tab-tv').classList.remove('active'); document.getElementById('ql-content-yc').style.display = 'none'; document.getElementById('ql-content-tv').style.display = 'none';
    if (tab === 'yc') { document.getElementById('ql-tab-yc').classList.add('active'); document.getElementById('ql-content-yc').style.display = 'block'; } else { document.getElementById('ql-tab-tv').classList.add('active'); document.getElementById('ql-content-tv').style.display = 'block'; }
}
async function loadThongTinQuanLy() { try { const data = await apiCall(`/nhom/${currentManageId}/chi-tiet`, { method: 'GET' }); document.getElementById('ql-ten-nhom').textContent = data.tenNhom; document.getElementById('ql-mon-hoc').textContent = data.tenMonHoc || 'Chưa cập nhật'; document.getElementById('ql-si-so').textContent = `${data.soThanhVienHienTai}/${data.soThanhVienToiDa}`; } catch (err) { console.error(err); } }
async function loadYeuCauQuanLy() {
    const list = document.getElementById('ql-content-yc'); list.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">Đang tải yêu cầu...</p>';
    try {
        const data = await apiCall(`/nhom/${currentManageId}/yeu-cau-cho-duyet`, { method: 'GET' }); const danhSach = data.danhSach || [];
        document.getElementById('ql-count-yc').textContent = danhSach.length;
        if (danhSach.length === 0) { list.innerHTML = `<div class="empty-tab"><p>Hiện tại không có yêu cầu nào chờ duyệt.</p></div>`; return; }
        list.innerHTML = danhSach.map(yc => `<div style="background: var(--bg-card); border: 2px solid var(--border-light); border-radius: var(--radius-xl); padding: 20px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s;"><div><h3 style="font-size: 18px; color: var(--text-primary); margin-bottom: 4px;">${yc.hoTen} <span style="font-size: 14px; font-weight: normal; color: var(--text-muted);">(${yc.mssv})</span></h3><p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px;">Chuyên ngành: ${yc.chuyenNganh}</p>${yc.loiNhan ? `<div style="background: var(--bg-warm); padding: 8px 12px; border-radius: var(--radius-md); font-size: 13px; border-left: 3px solid var(--secondary); font-style: italic;">"${yc.loiNhan}"</div>` : ''}</div><div style="display: flex; gap: 10px;"><button class="btn btn-secondary btn-sm" style="color: #B85045; border-color: #B85045;" onclick="moModalTuChoi(${yc.maYeuCau})">Từ chối</button><button class="btn btn-primary btn-sm" onclick="duyetYeuCau(${yc.maYeuCau})">Chấp nhận</button></div></div>`).join('');
    } catch (err) { list.innerHTML = `<p style="color: red;">Lỗi tải yêu cầu!</p>`; }
}
async function loadThanhVienQuanLy() {
    const list = document.getElementById('ql-content-tv'); list.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">Đang tải thành viên...</p>';
    try {
        const data = await apiCall(`/nhom/${currentManageId}/thanh-vien`, { method: 'GET' }); const danhSach = data.danhSach || [];
        document.getElementById('ql-count-tv').textContent = danhSach.length;
        list.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px;">` + danhSach.map(tv => { const chuCaiDau = tv.hoTen.split(' ').pop().charAt(0); const isTruong = tv.vaiTro === 'truong_nhom'; return `<div style="background: var(--bg-card); border: 2px solid var(--border-light); border-radius: var(--radius-lg); padding: 16px; display: flex; align-items: center; gap: 16px;"><div style="width: 48px; height: 48px; border-radius: 50%; background: ${isTruong ? 'var(--pastel-honey-bg)' : 'var(--bg-hover)'}; color: ${isTruong ? 'var(--pastel-honey-text)' : 'var(--text-primary)'}; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold;">${chuCaiDau}</div><div><div style="font-weight: 700; color: var(--text-primary); font-size: 15px; margin-bottom: 2px;">${tv.hoTen}</div><div style="font-size: 12px; color: ${isTruong ? 'var(--secondary-dark)' : 'var(--text-secondary)'}; font-weight: 600;">${isTruong ? 'Trưởng nhóm' : 'Thành viên'}</div><div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Tham gia: ${tv.ngayThamGia.split(' ')[0]}</div></div></div>`; }).join('') + `</div>`;
    } catch (err) { list.innerHTML = `<p style="color: red;">Lỗi tải thành viên!</p>`; }
}
async function duyetYeuCau(maYeuCau) {
    if (!confirm('Bạn có chắc chắn muốn duyệt thành viên này vào nhóm?')) return;
    try { const data = await apiCall(`/nhom/yeu-cau/${maYeuCau}/duyet`, { method: 'POST' }); if (data.error) { showToast(data.error, 'error'); return; } showToast('Đã duyệt thành viên thành công!', 'success'); loadThongTinQuanLy(); loadYeuCauQuanLy(); loadThanhVienQuanLy(); loadTatCaDuLieu(); } catch (err) { showToast(err.message || 'Có lỗi xảy ra', 'error'); }
}
function moModalTuChoi(maYeuCau) { document.getElementById('tu-choi-ma-yeu-cau').value = maYeuCau; document.getElementById('tu-choi-ly-do').value = ''; document.getElementById('modal-tu-choi').style.display = 'flex'; }
function closeModalTuChoi() { document.getElementById('modal-tu-choi').style.display = 'none'; }
async function submitTuChoi() {
    const maYeuCau = document.getElementById('tu-choi-ma-yeu-cau').value; const lyDo = document.getElementById('tu-choi-ly-do').value.trim(); if (!maYeuCau) return;
    try { const data = await apiCall(`/nhom/yeu-cau/${maYeuCau}/tu-choi`, { method: 'POST', body: JSON.stringify({ ly_do: lyDo }) }); showToast('Đã từ chối yêu cầu!', 'success'); closeModalTuChoi(); loadYeuCauQuanLy(); } catch (err) { showToast(err.message || 'Có lỗi xảy ra', 'error'); }
}

// BOOK MODAL
let nhomDangMo = null;
function openBook(maNhom) {
    const group = danhSachTatCaNhom.find(g => g.maNhom === maNhom) || danhSachYeuCau.find(g => g.maNhom === maNhom); if (!group) return;
    nhomDangMo = group; document.getElementById('book-title').textContent = group.tenNhom; document.getElementById('book-type').textContent = group.tenMonHoc ? `Môn: ${group.tenMonHoc}` : "Nhóm học tập"; document.getElementById('book-desc').textContent = group.moTa || 'Chưa có mô tả'; document.getElementById('book-mon-hoc').textContent = group.tenMonHoc || '—'; document.getElementById('book-member-count').textContent = `${group.soThanhVienHienTai}/${group.soThanhVienToiDa}`;
    document.getElementById('book-members').innerHTML = `<div class="book-member"><div class="book-member-avatar">TV</div><div class="book-member-info"><div class="book-member-name">Đang tải thành viên...</div></div></div>`;
    document.getElementById('book-status').innerHTML = `<div class="book-status-badge" style="background: var(--bg-warm); color: var(--text-primary); padding: 6px 12px; border-radius: 4px; display: inline-block;">Đang hoạt động</div>`;
    let actions = ''; if (group.vaiTro === 'truong_nhom') { actions = `<button class="btn btn-primary" onclick="moModalQuanLy(${group.maNhom}); closeBook();">Quản lý nhóm</button><button class="btn btn-secondary" onclick="closeBook()">Đóng</button>`; } else { actions = `<button class="btn btn-primary" onclick="vaoNhom(${group.maNhom}); closeBook();">Vào nhóm</button><button class="btn btn-secondary" onclick="closeBook()">Đóng</button>`; }
    document.getElementById('book-actions').innerHTML = actions; const modal = document.getElementById('book-modal'); const container = document.getElementById('book-container'); modal.style.display = 'flex'; setTimeout(() => container.classList.add('opening'), 50); document.body.style.overflow = 'hidden';
}
function closeBook() {
    const modal = document.getElementById('book-modal'); const container = document.getElementById('book-container'); if (!modal || modal.style.display === 'none') return;
    container.classList.remove('opening'); container.classList.add('closing'); setTimeout(() => { modal.style.display = 'none'; container.classList.remove('closing'); document.body.style.overflow = ''; nhomDangMo = null; }, 400);
}