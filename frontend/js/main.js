// ============================================
// CẤU HÌNH CHUNG
// ============================================
const API_BASE = 'http://localhost:8000/api';
let danhSachBaiDang = []; 
let currentApplyId = null; // Lưu ID bài đăng đang được ứng tuyển

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
// 1. HEADER (ĐĂNG NHẬP / ĐĂNG XUẤT)
// ============================================
function updateHeaderAuth() {
    const userMenu = document.getElementById('user-menu');
    if (!userMenu) return;
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
        const user = JSON.parse(userStr);
        userMenu.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="user-menu" style="padding: 6px 12px 6px 6px; background: var(--bg-hover);">
                    <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Felix" alt="Avatar" class="avatar">
                    <span class="user-name">${user.ho_ten}</span>
                </div>
                <button onclick="dangXuat()" class="btn btn-secondary btn-sm" style="padding: 8px 16px;">Đăng xuất</button>
            </div>
        `;
    } else {
        userMenu.innerHTML = `<a href="dang-nhap.html" class="btn btn-primary" style="padding: 8px 20px;">Đăng nhập</a>`;
    }
}

function dangXuat() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html'; 
    }
}

// ============================================
// 2. TRANG KHÁM PHÁ: LOAD BÀI ĐĂNG
// ============================================
async function loadGroups() {
    const groupList = document.getElementById('group-list');
    const emptyState = document.getElementById('empty-state');
    const resultsCount = document.getElementById('results-count');
    
    if (!groupList) return;

    groupList.innerHTML = '<p style="text-align: center; padding: 40px; color: #9A8570; grid-column: 1 / -1;">Đang tải bài đăng...</p>';
    
    try {
        const data = await apiCall('/bai-dang', { method: 'GET' });
        danhSachBaiDang = data.danhSach || [];
        
        if (danhSachBaiDang.length === 0) {
            groupList.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            if (resultsCount) resultsCount.textContent = '0 bài đăng';
        } else {
            if (emptyState) emptyState.style.display = 'none';
            groupList.innerHTML = danhSachBaiDang.map(bd => renderGroupCard(bd)).join('');
            if (resultsCount) resultsCount.textContent = `${danhSachBaiDang.length} bài đăng`;
        }
    } catch (err) {
        groupList.innerHTML = `<p style="color: #B85045; text-align: center; grid-column: 1 / -1;">Lỗi tải dữ liệu!</p>`;
    }
}

function renderGroupCard(baiDang) {
    const score = baiDang.diemTuongThich || 0.5; 
    const scorePercent = formatScore(score);
    const scoreColor = score >= 0.8 ? '#5B8C5A' : score >= 0.5 ? '#E8B96D' : '#B85045';
    
    return `
        <div class="group-card" onclick="openBook(${baiDang.maBaiDang})">
            <div class="group-card-header">
                <h3 class="group-title">${baiDang.tieuDe}</h3>
                <div class="group-type">Môn: ${baiDang.tenMonHoc || 'Chưa xác định'}</div>
            </div>
            
            <p class="group-desc">${baiDang.moTaBaiDang || 'Chưa có mô tả chi tiết.'}</p>
            
            <div class="group-meta">
                <span class="group-meta-item">Địa điểm: <strong>${baiDang.diaDiem || 'Online'}</strong></span>
                <span class="group-meta-item">Cần tuyển: <strong>${baiDang.soLuongCanTuyen} thành viên</strong></span>
                <span class="group-meta-item">Sĩ số hiện tại: <strong>${baiDang.soThanhVienHienTai}/${baiDang.soThanhVienToiDa}</strong></span>
            </div>
            
            <div class="match-score">
                <div class="match-score-value" style="color: ${scoreColor};">${scorePercent}</div>
                <div class="match-score-label">Độ tương thích</div>
                <div class="match-score-bar">
                    <div class="match-score-fill" style="width: ${scorePercent}; background: ${scoreColor};"></div>
                </div>
            </div>
            
            <div class="group-actions">
                <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); openBook(${baiDang.maBaiDang})">Chi tiết</button>
                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); guiYeuCau(${baiDang.maBaiDang})">Ứng tuyển</button>
            </div>
        </div>
    `;
}

// ============================================
// 3. MODAL SÁCH
// ============================================
function openBook(maBaiDang) {
    const bd = danhSachBaiDang.find(b => b.maBaiDang === maBaiDang);
    if (!bd) return;
    
    document.getElementById('book-title').textContent = bd.tenNhom;
    document.getElementById('book-type').textContent = `Môn: ${bd.tenMonHoc || '—'} | Lĩnh vực: ${bd.linhVuc || '—'}`;
    document.getElementById('book-desc').textContent = bd.moTaBaiDang || 'Chưa có mô tả';
    
    let reqHtml = '';
    if (bd.yeuCauCung) reqHtml += `<p style="margin-bottom: 8px;"><strong>Yêu cầu bắt buộc:</strong> ${bd.yeuCauCung}</p>`;
    if (bd.yeuCauMem) reqHtml += `<p style="margin-bottom: 8px;"><strong>Yêu cầu ưu tiên:</strong> ${bd.yeuCauMem}</p>`;
    if (bd.yeuCauGpa > 0) reqHtml += `<p><strong>Điểm GPA tối thiểu:</strong> ${bd.yeuCauGpa}</p>`;
    document.getElementById('book-mon-hoc').innerHTML = reqHtml || 'Không có yêu cầu cụ thể.';
    
    document.getElementById('book-de-tai').textContent = `${bd.hinhThuc || '—'} - ${bd.diaDiem || '—'}`;
    document.getElementById('book-member-count').textContent = `${bd.soThanhVienHienTai}/${bd.soThanhVienToiDa}`;
    
    document.getElementById('book-status').innerHTML = `<div class="book-status-badge" style="background: var(--bg-warm); color: var(--text-primary); padding: 6px 12px; border-radius: 4px; display: inline-block;">Đang tuyển ${bd.soLuongCanTuyen} thành viên</div>`;
    document.getElementById('book-actions').innerHTML = `
        <button class="btn btn-primary" onclick="closeBook(); guiYeuCau(${bd.maBaiDang});">Gửi ứng tuyển</button>
        <button class="btn btn-secondary" onclick="closeBook()">Đóng</button>
    `;
    
    document.getElementById('book-modal').style.display = 'flex';
    setTimeout(() => document.getElementById('book-container').classList.add('opening'), 50);
    document.body.style.overflow = 'hidden';
}

function closeBook() {
    const modal = document.getElementById('book-modal');
    const container = document.getElementById('book-container');
    if (!modal || modal.style.display === 'none') return;
    container.classList.remove('opening');
    container.classList.add('closing');
    setTimeout(() => {
        modal.style.display = 'none';
        container.classList.remove('closing');
        document.body.style.overflow = '';
    }, 400);
}

// ============================================
// 4. ỨNG TUYỂN (ĐÃ KHÔI PHỤC)
// ============================================
function guiYeuCau(maBaiDang) {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Vui lòng đăng nhập trước khi ứng tuyển!', 'error');
        setTimeout(() => window.location.href = 'dang-nhap.html', 1500);
        return;
    }

    currentApplyId = maBaiDang;
    document.getElementById('ung-tuyen-loi-nhan').value = ''; // Reset ô nhập
    document.getElementById('modal-ung-tuyen').style.display = 'flex';
}

function closeModalUngTuyen() {
    document.getElementById('modal-ung-tuyen').style.display = 'none';
    currentApplyId = null;
}

async function submitUngTuyen() {
    if (!currentApplyId) return;
    
    const btn = document.querySelector('#modal-ung-tuyen .btn-primary');
    const loiNhan = document.getElementById('ung-tuyen-loi-nhan').value.trim();
    
    btn.textContent = 'Đang gửi...';
    btn.disabled = true;

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
        btn.textContent = 'Gửi ứng tuyển';
        btn.disabled = false;
    }
}

// ============================================
// KHỞI CHẠY KHI TẢI TRANG
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    updateHeaderAuth();
    if (document.getElementById('group-list')) {
        loadGroups();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeBook();
        closeModalUngTuyen();
    }
});