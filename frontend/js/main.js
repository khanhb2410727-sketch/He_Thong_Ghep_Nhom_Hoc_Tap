// ============================================
// CẤU HÌNH CHUNG
// ============================================
const API_BASE = 'http://localhost:8000/api';
let danhSachBaiDang = []; 
let currentApplyId = null; 
let isAutoMatchActive = false;

// ============================================
// BẢO VỆ PHÂN QUYỀN (ROUTE GUARD)
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        const path = window.location.pathname;
        const isAdminPage = path.includes('admin.html');

        // Nếu là Admin mà cố vào trang của Sinh viên -> Đá về trang Admin
        if (user.loai_tai_khoan === 'admin' && !isAdminPage) {
            window.location.href = 'admin.html';
        }
        // Nếu là Sinh viên mà cố vào trang Admin -> Đá về trang chủ
        else if (user.loai_tai_khoan !== 'admin' && isAdminPage) {
            window.location.href = 'index.html';
        }
    }
});

// ============================================
// CÁC HÀM TIỆN ÍCH
// ============================================
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };
    
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    
    if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showToast('Phiên đăng nhập đã hết hạn!', 'error');
        setTimeout(() => window.location.href = 'dang-nhap.html', 1500);
        return;
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.error || 'Lỗi API');
    return data;
}

function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : '❌';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatScore(score) { return Math.round(score * 100) + '%'; }

// ============================================
// 1. HEADER (ĐỒNG BỘ AVATAR & THÔNG BÁO)
// ============================================
function updateHeaderAuth() {
    const userMenu = document.getElementById('user-menu');
    if (!userMenu) return;
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
        const user = JSON.parse(userStr);
        const avatarUrl = user.anh_dai_dien || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.ho_ten || 'Felix'}`;
        const isAdmin = user.loai_tai_khoan === 'admin';
        
        userMenu.innerHTML = `
            <div style="display: flex; align-items: center; gap: 16px;">
                ${isAdmin ? `<a href="admin.html" class="btn btn-primary btn-sm" style="background: #8A2BE2; border-color: #8A2BE2;">Trang Quản Trị</a>` : ''}
                
                <!-- NÚT HỖ TRỢ KỸ THUẬT -->
                <a href="javascript:void(0)" onclick="moModalHoTro()" style="font-size: 14px; color: var(--text-secondary); text-decoration: none; font-weight: 500; display: ${isAdmin ? 'none' : 'block'};" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-secondary)'">Hỗ trợ</a>

                <!-- CHUÔNG THÔNG BÁO -->
                <div style="position: relative; display: ${isAdmin ? 'none' : 'block'};">
                    <button onclick="toggleThongBaoMenu(event)" style="background: var(--bg-hover); border: 1px solid var(--border); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-primary); transition: all 0.2s;">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 20px; height: 20px;">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                        </svg>
                    </button>
                    <span id="badge-thong-bao" style="display: none; position: absolute; top: -2px; right: -2px; background: #EF4444; color: white; font-size: 10px; font-weight: bold; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2px solid var(--bg-main);">0</span>
                    
                    <div id="dropdown-thong-bao" style="display: none; position: absolute; top: 50px; right: -50px; width: 320px; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-lg); box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 9999; overflow: hidden;">
                        <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-light); background: var(--bg-main); font-weight: 600; font-size: 14px; color: var(--text-primary);">Thông báo mới nhất</div>
                        <div id="list-thong-bao-dropdown" style="max-height: 300px; overflow-y: auto;"></div>
                    </div>
                </div>

                <!-- AVATAR & ĐĂNG XUẤT -->
                <div class="user-menu" style="padding: 6px 12px 6px 6px; background: var(--bg-hover); cursor: pointer;" onclick="window.location.href='ho-so.html'">
                    <img src="${avatarUrl}" alt="Avatar" class="avatar" style="object-fit: cover;">
                    <span class="user-name">${user.ho_ten}</span>
                </div>
                <button onclick="dangXuat()" class="btn btn-secondary btn-sm">Đăng xuất</button>
            </div>
        `;

        if (!isAdmin) {
            quetThongBao(); 
            if (!window.thongBaoInterval) {
                window.thongBaoInterval = setInterval(quetThongBao, 30000);
            }

            document.addEventListener('click', function(event) {
                const dropdown = document.getElementById('dropdown-thong-bao');
                if (dropdown && dropdown.style.display === 'block' && !event.target.closest('#dropdown-thong-bao') && !event.target.closest('button[onclick*="toggleThongBaoMenu"]')) {
                    dropdown.style.display = 'none';
                }
            });
        }

    } else {
        userMenu.innerHTML = `<a href="dang-nhap.html" class="btn btn-primary">Đăng nhập</a>`;
    }
}

function toggleThongBaoMenu(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('dropdown-thong-bao');
    if (dropdown) dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

async function quetThongBao() {
    if (!localStorage.getItem('token')) return;
    try {
        const data = await apiCall('/thong-bao', { method: 'GET' });
        const badge = document.getElementById('badge-thong-bao');
        const listDropdown = document.getElementById('list-thong-bao-dropdown');
        
        if (badge) {
            if (data.tong_cong > 0) {
                badge.style.display = 'flex';
                badge.textContent = data.tong_cong;
            } else {
                badge.style.display = 'none';
            }
        }

        if (listDropdown) {
            if (data.danhSach.length === 0) {
                listDropdown.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">Không có thông báo nào</div>';
            } else {
                listDropdown.innerHTML = data.danhSach.map(tb => `
                    <div onclick="window.location.href='${tb.link}'" style="padding: 12px 16px; border-bottom: 1px solid var(--border-light); cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='transparent'">
                        <div style="font-size: 14px; color: var(--text-primary); margin-bottom: 4px; line-height: 1.4;">${tb.noi_dung}</div>
                        <div style="font-size: 11px; color: var(--text-muted); text-align: right;">${tb.thoi_gian}</div>
                    </div>
                `).join('');
            }
        }
    } catch (err) { console.error('Lỗi quét thông báo:', err); }
}

function dangXuat() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'dang-nhap.html'; 
    }
}

// ============================================
// 2. TRANG KHÁM PHÁ (LOAD, LỌC, TÌM KIẾM)
// ============================================
async function loadMonHocFilter() {
    const select = document.getElementById('filter-loai-nhom');
    if (!select) return;
    try {
        const data = await apiCall('/mon-hoc', { method: 'GET' });
        select.innerHTML = '<option value="">Tất cả môn học</option>' + 
            data.map(m => `<option value="${m.ma_mon_hoc}">${m.ma_mon} - ${m.ten_mon_hoc}</option>`).join('');
    } catch (err) { console.error('Lỗi tải danh sách môn học:', err); }
}

async function loadGroups() {
    const groupList = document.getElementById('group-list');
    if (!groupList) return;

    groupList.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-muted); grid-column: 1 / -1;">Đang tải bài đăng...</p>';
    
    try {
        const data = await apiCall('/bai-dang', { method: 'GET' });
        danhSachBaiDang = data.danhSach || [];
        renderDanhSachNhom(isAutoMatchActive); 
    } catch (err) {
        groupList.innerHTML = `<p style="color: #EF4444; text-align: center; grid-column: 1 / -1;">Lỗi tải dữ liệu!</p>`;
    }
}

function handleSearchAndMatch() {
    isAutoMatchActive = !isAutoMatchActive; 
    const btn = document.getElementById('btn-auto-match');
    
    const selectEl = document.getElementById('filter-loai-nhom');
    const maMon = selectEl ? selectEl.value : "";
    const linhVuc = document.getElementById('filter-linh-vuc') ? document.getElementById('filter-linh-vuc').value.trim() : "";
    const keyword = document.getElementById('filter-mon-hoc') ? document.getElementById('filter-mon-hoc').value.trim() : "";

    if (isAutoMatchActive) {
        btn.textContent = 'Hủy lọc phù hợp nhất';
        btn.className = 'btn btn-secondary'; 
        btn.style.borderColor = '#EF4444';
        btn.style.color = '#EF4444';
        showToast('Đang hiển thị các nhóm phù hợp nhất!', 'success');
    } else {
        btn.textContent = 'Tìm nhóm phù hợp nhất';
        btn.className = 'btn btn-primary'; 
        btn.style.borderColor = '';
        btn.style.color = '';
        showToast('Đã tải lại tất cả nhóm!', 'success');
    }

    renderDanhSachNhom(isAutoMatchActive, maMon, linhVuc, keyword);
}

function renderDanhSachNhom(chiHienThiTotNhat = false, filterMonHoc = "", filterLinhVuc = "", filterKeyword = "") {
    const groupList = document.getElementById('group-list');
    const emptyState = document.getElementById('empty-state');
    const resultsCount = document.getElementById('results-count');
    if (!groupList) return;

    let dsHienThi = [...danhSachBaiDang];

    if (filterMonHoc) {
        const selectEl = document.getElementById('filter-loai-nhom');
        if (selectEl) {
            const selectedOptionText = selectEl.options[selectEl.selectedIndex].text; 
            dsHienThi = dsHienThi.filter(bd => bd.tenMonHoc && selectedOptionText.includes(bd.tenMonHoc));
        }
    }

    if (filterLinhVuc) {
        const keyword = filterLinhVuc.toLowerCase();
        dsHienThi = dsHienThi.filter(bd => (bd.linhVuc || "").toLowerCase().includes(keyword));
    }

    if (filterKeyword) {
        const kw = filterKeyword.toLowerCase();
        dsHienThi = dsHienThi.filter(bd => (bd.tieuDe || "").toLowerCase().includes(kw) || (bd.tenNhom || "").toLowerCase().includes(kw) || (bd.moTaBaiDang || "").toLowerCase().includes(kw));
    }

    dsHienThi.sort((a, b) => (b.diemTuongThich || 0) - (a.diemTuongThich || 0));

    if (chiHienThiTotNhat) {
        dsHienThi = dsHienThi.filter(bd => (bd.diemTuongThich || 0) >= 0.65);
    }

    if (dsHienThi.length === 0) {
        groupList.innerHTML = '';
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = chiHienThiTotNhat ? '<p>Không tìm thấy nhóm nào thực sự phù hợp. Hãy cập nhật thêm Kỹ năng/Lịch rảnh nhé!</p>' : '<p>Không tìm thấy nhóm nào phù hợp với bộ lọc.</p>';
        }
        if (resultsCount) resultsCount.textContent = '0 bài đăng';
    } else {
        if (emptyState) emptyState.style.display = 'none';
        groupList.innerHTML = dsHienThi.map(bd => renderGroupCard(bd)).join('');
        if (resultsCount) resultsCount.textContent = `${dsHienThi.length} bài đăng`;
    }
}

function renderGroupCard(baiDang) {
    const score = baiDang.diemTuongThich || 0.5; 
    const scorePercent = formatScore(score);
    const scoreColor = score >= 0.8 ? '#22c55e' : score >= 0.5 ? '#F59E0B' : '#EF4444';
    
    const isFull = baiDang.soThanhVienHienTai >= baiDang.soThanhVienToiDa;
    
    const buttonHtml = isFull 
        ? `<button class="btn btn-secondary btn-sm" disabled style="cursor: not-allowed; opacity: 0.6;">Đã đủ người</button>`
        : `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); guiYeuCau(${baiDang.maBaiDang})">Ứng tuyển</button>`;

    return `
        <div class="group-card" onclick="openGroupModal(${baiDang.maBaiDang})">
            <div class="group-card-header">
                <h3 class="group-title">${baiDang.tieuDe}</h3>
                <div class="group-type">Môn: ${baiDang.tenMonHoc || 'Chưa xác định'}</div>
            </div>
            
            <p class="group-desc">${baiDang.moTaBaiDang || 'Chưa có mô tả chi tiết.'}</p>
            
            <div class="group-meta">
                <span class="group-meta-item">Địa điểm: <strong>${baiDang.diaDiem || 'Online'}</strong></span>
                <span class="group-meta-item">Cần tuyển: <strong>${baiDang.soLuongCanTuyen} thành viên</strong></span>
                <span class="group-meta-item" style="color: ${isFull ? '#EF4444' : 'inherit'};">Sĩ số: <strong>${baiDang.soThanhVienHienTai}/${baiDang.soThanhVienToiDa}</strong></span>
            </div>
            
            <div class="match-score">
                <div class="match-score-value" style="color: ${scoreColor};">${scorePercent}</div>
                <div class="match-score-label">Độ tương thích</div>
                <div class="match-score-bar">
                    <div class="match-score-fill" style="width: ${scorePercent}; background: ${scoreColor};"></div>
                </div>
            </div>
            
            <div class="group-actions">
                <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); openGroupModal(${baiDang.maBaiDang})">Chi tiết</button>
                ${buttonHtml}
            </div>
        </div>
    `;
}

// ============================================
// 3. MODAL CHI TIẾT NHÓM & ỨNG TUYỂN
// ============================================
function openGroupModal(maBaiDang) {
    const bd = danhSachBaiDang.find(b => b.maBaiDang === maBaiDang);
    if (!bd) return;
    
    const isFull = bd.soThanhVienHienTai >= bd.soThanhVienToiDa;

    document.getElementById('modal-title').textContent = bd.tenNhom;
    document.getElementById('modal-subtitle').textContent = `Môn: ${bd.tenMonHoc || '—'} | Lĩnh vực: ${bd.linhVuc || '—'}`;
    document.getElementById('modal-desc').textContent = bd.moTaBaiDang || 'Chưa có mô tả';
    
    let reqHtml = '';
    if (bd.yeuCauCung) reqHtml += `<p style="margin-bottom: 8px;"><strong>Bắt buộc:</strong> ${bd.yeuCauCung}</p>`;
    if (bd.yeuCauMem) reqHtml += `<p style="margin-bottom: 8px;"><strong>Ưu tiên:</strong> ${bd.yeuCauMem}</p>`;
    if (bd.yeuCauGpa > 0) reqHtml += `<p><strong>GPA tối thiểu:</strong> ${bd.yeuCauGpa}</p>`;
    document.getElementById('modal-requirements').innerHTML = reqHtml || 'Không có yêu cầu cụ thể.';
    
    document.getElementById('modal-other').innerHTML = `
        <p style="margin-bottom: 8px;"><strong>Hình thức:</strong> ${bd.hinhThuc || '—'}</p>
        <p style="margin-bottom: 8px;"><strong>Địa điểm:</strong> ${bd.diaDiem || '—'}</p>
        <p style="color: ${isFull ? '#EF4444' : 'inherit'};"><strong>Trạng thái:</strong> ${isFull ? 'Đã đủ thành viên' : `Đang tuyển ${bd.soLuongCanTuyen} thành viên`}</p>
    `;
    
    let actionBtn = isFull 
        ? `<button class="btn btn-secondary" disabled style="cursor: not-allowed; opacity: 0.6;">Nhóm đã đủ người</button>`
        : `<button class="btn btn-primary" onclick="closeGroupModal(); guiYeuCau(${bd.maBaiDang});">Gửi ứng tuyển</button>`;

    // NÚT BÁO CÁO
    document.getElementById('modal-actions').innerHTML = `
        <button class="btn" style="color: #EF4444; margin-right: auto; background: transparent; border: none; font-size: 13px; text-decoration: underline;" onclick="closeGroupModal(); moModalBaoCao('nhom', ${bd.maNhom})">Báo cáo vi phạm</button>
        <button class="btn btn-secondary" onclick="closeGroupModal()">Đóng</button>
        ${actionBtn}
    `;
    
    document.getElementById('group-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeGroupModal() {
    document.getElementById('group-modal').style.display = 'none';
    document.body.style.overflow = '';
}

function guiYeuCau(maBaiDang) {
    if (!localStorage.getItem('token')) {
        showToast('Vui lòng đăng nhập trước khi ứng tuyển!', 'error');
        setTimeout(() => window.location.href = 'dang-nhap.html', 1500);
        return;
    }
    currentApplyId = maBaiDang;
    document.getElementById('ung-tuyen-loi-nhan').value = ''; 
    document.getElementById('modal-ung-tuyen').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModalUngTuyen() {
    document.getElementById('modal-ung-tuyen').style.display = 'none';
    currentApplyId = null;
    document.body.style.overflow = '';
}

async function submitUngTuyen() {
    if (!currentApplyId) return;
    const btn = document.querySelector('#modal-ung-tuyen .btn-primary');
    const loiNhan = document.getElementById('ung-tuyen-loi-nhan').value.trim();
    btn.textContent = 'Đang gửi...'; btn.disabled = true;

    try {
        const data = await apiCall(`/bai-dang/${currentApplyId}/ung-tuyen`, {
            method: 'POST',
            body: JSON.stringify({ loi_nhan: loiNhan })
        });
        showToast(data.message || 'Đã gửi ứng tuyển thành công!', 'success');
        closeModalUngTuyen();
    } catch (err) {
        showToast(err.message || 'Có lỗi xảy ra!', 'error');
    } finally {
        btn.textContent = 'Gửi ứng tuyển'; btn.disabled = false;
    }
}

// ============================================
// 4. TÍNH NĂNG BÁO CÁO & HỖ TRỢ (DÀNH CHO SINH VIÊN)
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const modalsHtml = `
        <!-- MODAL BÁO CÁO VI PHẠM -->
        <div id="modal-bao-cao" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(6px); z-index: 9999; align-items: center; justify-content: center;">
            <div style="background: var(--bg-card); padding: 32px; border-radius: var(--radius-xl); width: 100%; max-width: 450px; border: 1px solid var(--border-light);">
                <h2 style="margin-bottom: 8px; color: var(--text-primary);">Báo cáo vi phạm</h2>
                <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">Hành vi vi phạm tiêu chuẩn cộng đồng sẽ bị xử lý bởi Quản trị viên.</p>
                <input type="hidden" id="bc-loai-doi-tuong">
                <input type="hidden" id="bc-ma-doi-tuong">
                
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">Lý do vi phạm *</label>
                    <select class="form-select" id="bc-ly-do">
                        <option value="">-- Chọn lý do --</option>
                        <option value="Spam, quảng cáo">Spam, quảng cáo</option>
                        <option value="Nội dung không phù hợp">Nội dung không phù hợp</option>
                        <option value="Lừa đảo, gian lận">Lừa đảo, gian lận</option>
                        <option value="Quấy rối, xúc phạm">Quấy rối, xúc phạm</option>
                        <option value="Khác">Khác</option>
                    </select>
                </div>
                <div class="form-group" style="margin-bottom: 24px;">
                    <label class="form-label">Bằng chứng / Mô tả thêm</label>
                    <textarea class="form-textarea" id="bc-bang-chung" rows="3" placeholder="Dán link ảnh chụp màn hình hoặc mô tả chi tiết..."></textarea>
                </div>
                
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="btn btn-secondary" onclick="document.getElementById('modal-bao-cao').style.display='none'">Hủy</button>
                    <button class="btn btn-primary" onclick="submitBaoCao()">Gửi Báo Cáo</button>
                </div>
            </div>
        </div>

        <!-- MODAL HỖ TRỢ KỸ THUẬT -->
        <div id="modal-ho-tro" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(6px); z-index: 9999; align-items: center; justify-content: center;">
            <div style="background: var(--bg-card); padding: 32px; border-radius: var(--radius-xl); width: 100%; max-width: 450px; border: 1px solid var(--border-light);">
                <h2 style="margin-bottom: 8px; color: var(--text-primary);">Gửi yêu cầu Hỗ trợ</h2>
                <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">Gặp lỗi khi sử dụng hệ thống? Hãy cho chúng tôi biết.</p>
                
                <!-- Ô CHỌN LOẠI SỰ CỐ -->
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">Loại sự cố *</label>
                    <select class="form-select" id="ht-loai-su-co">
                        <option value="Lỗi giao diện">Lỗi giao diện (Hiển thị sai, vỡ khung...)</option>
                        <option value="Lỗi chức năng">Lỗi chức năng (Bấm không ăn, lỗi dữ liệu...)</option>
                        <option value="Lỗi đăng nhập">Lỗi đăng nhập / Tài khoản</option>
                        <option value="Góp ý">Góp ý tính năng mới</option>
                        <option value="Khác">Khác</option>
                    </select>
                </div>

                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">Tiêu đề *</label>
                    <input type="text" class="form-input" id="ht-tieu-de" placeholder="VD: Lỗi không đổi được mật khẩu">
                </div>
                <div class="form-group" style="margin-bottom: 24px;">
                    <label class="form-label">Nội dung chi tiết *</label>
                    <textarea class="form-textarea" id="ht-noi-dung" rows="4" placeholder="Mô tả rõ sự cố bạn đang gặp phải..."></textarea>
                </div>
                
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="btn btn-secondary" onclick="document.getElementById('modal-ho-tro').style.display='none'">Hủy</button>
                    <button class="btn btn-primary" onclick="submitHoTro()">Gửi Yêu Cầu</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalsHtml);
});

function moModalBaoCao(loai, id) {
    if (!localStorage.getItem('token')) {
        showToast('Vui lòng đăng nhập để báo cáo!', 'error');
        return;
    }
    document.getElementById('bc-loai-doi-tuong').value = loai;
    document.getElementById('bc-ma-doi-tuong').value = id;
    document.getElementById('bc-ly-do').value = '';
    document.getElementById('bc-bang-chung').value = '';
    document.getElementById('modal-bao-cao').style.display = 'flex';
}

async function submitBaoCao() {
    const loai = document.getElementById('bc-loai-doi-tuong').value;
    const id = document.getElementById('bc-ma-doi-tuong').value;
    const lyDo = document.getElementById('bc-ly-do').value;
    const bangChung = document.getElementById('bc-bang-chung').value.trim();

    if (!lyDo) { showToast('Vui lòng chọn lý do vi phạm!', 'error'); return; }

    try {
        const data = await apiCall('/bao-cao', {
            method: 'POST',
            body: JSON.stringify({ 
                loai_doi_tuong: loai, 
                ma_doi_tuong: parseInt(id), 
                ly_do: lyDo, 
                bang_chung: bangChung 
            })
        });
        if (data.error) { showToast(data.error, 'error'); } 
        else {
            showToast('Đã gửi báo cáo. Cảm ơn bạn!', 'success');
            document.getElementById('modal-bao-cao').style.display = 'none';
        }
    } catch (err) { showToast('Lỗi kết nối!', 'error'); }
}

function moModalHoTro() {
    if (!localStorage.getItem('token')) {
        showToast('Vui lòng đăng nhập để gửi yêu cầu!', 'error');
        return;
    }
    document.getElementById('ht-loai-su-co').value = 'Lỗi giao diện';
    document.getElementById('ht-tieu-de').value = '';
    document.getElementById('ht-noi-dung').value = '';
    document.getElementById('modal-ho-tro').style.display = 'flex';
}

async function submitHoTro() {
    const loaiSuCo = document.getElementById('ht-loai-su-co').value; // Đảm bảo thẻ select có id này
    const tieuDe = document.getElementById('ht-tieu-de').value.trim();
    const noiDung = document.getElementById('ht-noi-dung').value.trim();

    if (!tieuDe || !noiDung) { showToast('Vui lòng nhập đủ thông tin!', 'error'); return; }

    try {
        await apiCall('/ho-tro', {
            method: 'POST',
            body: JSON.stringify({ 
                tieu_de: tieuDe, 
                noi_dung: noiDung,
                loai_su_co: loaiSuCo // Đảm bảo gửi trường này lên backend
            })
        });
        showToast('Đã gửi yêu cầu hỗ trợ!', 'success');
        document.getElementById('modal-ho-tro').style.display = 'none';
    } catch (err) { showToast('Lỗi kết nối!', 'error'); }
}

// ============================================
// KHỞI CHẠY KHI TẢI TRANG
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    updateHeaderAuth();
    if (document.getElementById('group-list')) {
        loadGroups();
        loadMonHocFilter();
        
        const selectMon = document.getElementById('filter-loai-nhom');
        if (selectMon) {
            selectMon.addEventListener('change', () => {
                const maMon = selectMon.value;
                const linhVuc = document.getElementById('filter-linh-vuc').value.trim();
                const keyword = document.getElementById('filter-mon-hoc').value.trim();
                renderDanhSachNhom(isAutoMatchActive, maMon, linhVuc, keyword);
            });
        }

        const inputs = [document.getElementById('filter-linh-vuc'), document.getElementById('filter-mon-hoc')];
        inputs.forEach(input => {
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        isAutoMatchActive = false; 
                        const btn = document.getElementById('btn-auto-match');
                        if (btn) {
                            btn.textContent = 'Tìm nhóm phù hợp nhất';
                            btn.className = 'btn btn-primary';
                            btn.style.borderColor = '';
                            btn.style.color = '';
                        }
                        const maMon = document.getElementById('filter-loai-nhom').value;
                        const linhVuc = document.getElementById('filter-linh-vuc').value.trim();
                        const keyword = document.getElementById('filter-mon-hoc').value.trim();
                        renderDanhSachNhom(false, maMon, linhVuc, keyword);
                    }
                });
            }
        });
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeGroupModal();
        closeModalUngTuyen();
        if(document.getElementById('modal-bao-cao')) document.getElementById('modal-bao-cao').style.display = 'none';
        if(document.getElementById('modal-ho-tro')) document.getElementById('modal-ho-tro').style.display = 'none';
    }
});