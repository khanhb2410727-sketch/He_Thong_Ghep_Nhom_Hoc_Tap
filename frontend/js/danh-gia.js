// ============================================
// TRANG ĐÁNH GIÁ
// ============================================

// ===== MOCK DATA =====
const MOCK_NHOM_CAN_DANH_GIA = [
    {
        maNhom: 1,
        tenNhom: 'Nhóm AI - Đồ án Chatbot',
        tenLoai: 'Đồ án môn học',
        kyDanhGia: 'Kết thúc học kỳ 1/2024',
        ngayBatDau: '2024-10-06',
        hanDanhGia: '2024-10-20T23:59:00',
        trangThaiKy: 'dang-danh-gia',
        thanhVien: [
            {
                maTaiKhoan: 2,
                hoTen: 'Trần Thị Bình',
                vaiTro: 'Thành viên',
                ngayThamGia: '2024-09-01',
                daDanhGia: true
            },
            {
                maTaiKhoan: 3,
                hoTen: 'Lê Văn Cường',
                vaiTro: 'Thành viên',
                ngayThamGia: '2024-09-01',
                daDanhGia: false
            },
            {
                maTaiKhoan: 4,
                hoTen: 'Phạm Thị Dung',
                vaiTro: 'Thành viên',
                ngayThamGia: '2024-09-15',
                daDanhGia: false
            }
        ]
    }
];

// ===== STATE =====
let nhomDangDanhGia = null;
let nguoiDangDanhGia = null;
let diemDanhGia = {
    'thai-do': 0,
    'dong-gop': 0,
    'giao-tiep': 0,
    'dung-han': 0
};

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadDanhSachDanhGia();
    setupStarRating();
    setupCharCount();
    
    // ESC đóng modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
});

// ============================================
// LOAD DANH SÁCH
// ============================================

function loadDanhSachDanhGia() {
    const container = document.getElementById('list-nhom-danh-gia');
    const emptyState = document.getElementById('empty-state-page');
    
    if (MOCK_NHOM_CAN_DANH_GIA.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    container.innerHTML = MOCK_NHOM_CAN_DANH_GIA
        .map(nhom => renderNhomDanhGia(nhom))
        .join('');
}

// ============================================
// RENDER NHÓM ĐÁNH GIÁ
// ============================================

function renderNhomDanhGia(nhom) {
    const soDaDanhGia = nhom.thanhVien.filter(tv => tv.daDanhGia).length;
    const tongThanhVien = nhom.thanhVien.length;
    const phanTram = Math.round((soDaDanhGia / tongThanhVien) * 100);
    
    const statusMap = {
        'dang-danh-gia': { text: 'Đang đánh giá', class: 'dang-danh-gia' },
        'da-hoan-thanh': { text: 'Đã hoàn thành', class: 'da-hoan-thanh' },
        'qua-han': { text: 'Quá hạn', class: 'qua-han' }
    };
    const status = statusMap[nhom.trangThaiKy] || statusMap['dang-danh-gia'];
    
    return `
        <div class="nhom-danh-gia">
            <!-- Header nhóm -->
            <div class="nhom-danh-gia-header">
                <div>
                    <h2 class="nhom-danh-gia-title">${nhom.tenNhom}</h2>
                    <div class="nhom-danh-gia-meta">
                        <div class="nhom-danh-gia-meta-item">
                            Loại: <strong>${nhom.tenLoai}</strong>
                        </div>
                        <div class="nhom-danh-gia-meta-item">
                            Kỳ đánh giá: <strong>${nhom.kyDanhGia}</strong>
                        </div>
                        <div class="nhom-danh-gia-meta-item">
                            Hạn: <strong>${formatDateTime(nhom.hanDanhGia)}</strong>
                        </div>
                    </div>
                </div>
                <span class="ky-danh-gia-status ${status.class}">${status.text}</span>
            </div>
            
            <!-- Tiến độ -->
            <div class="tien-do-wrapper">
                <div class="tien-do-header">
                    <span class="tien-do-label">Tiến độ đánh giá của bạn</span>
                    <span class="tien-do-value">${soDaDanhGia}/${tongThanhVien} thành viên</span>
                </div>
                <div class="tien-do-bar">
                    <div class="tien-do-fill" style="width: ${phanTram}%"></div>
                </div>
                <div class="tien-do-note">
                    ${soDaDanhGia === tongThanhVien 
                        ? 'Bạn đã hoàn thành đánh giá tất cả thành viên!' 
                        : `Còn ${tongThanhVien - soDaDanhGia} thành viên cần đánh giá`}
                </div>
            </div>
            
            <!-- Danh sách thành viên -->
            <div class="thanh-vien-list">
                ${nhom.thanhVien.map(tv => renderThanhVienItem(tv, nhom.maNhom)).join('')}
            </div>
        </div>
    `;
}

function renderThanhVienItem(tv, maNhom) {
    const chuCaiDau = tv.hoTen.split(' ').pop().charAt(0);
    
    return `
        <div class="thanh-vien-item ${tv.daDanhGia ? 'da-danh-gia' : ''}">
            <div class="thanh-vien-info">
                <div class="thanh-vien-avatar">${chuCaiDau}</div>
                <div class="thanh-vien-details">
                    <div class="thanh-vien-name">${tv.hoTen}</div>
                    <div class="thanh-vien-role">${tv.vaiTro}</div>
                    <div class="thanh-vien-date">Tham gia ${formatDate(tv.ngayThamGia)}</div>
                </div>
            </div>
            
            <div class="thanh-vien-actions">
                ${tv.daDanhGia 
                    ? `<span class="da-danh-gia-badge">Đã đánh giá</span>`
                    : `<button class="btn btn-primary btn-sm" 
                               onclick="openModal(${maNhom}, ${tv.maTaiKhoan})">
                            Đánh giá ngay
                       </button>`
                }
            </div>
        </div>
    `;
}

// ============================================
// MODAL
// ============================================

function openModal(maNhom, maTaiKhoan) {
    const nhom = MOCK_NHOM_CAN_DANH_GIA.find(n => n.maNhom === maNhom);
    const thanhVien = nhom?.thanhVien.find(tv => tv.maTaiKhoan === maTaiKhoan);
    
    if (!nhom || !thanhVien) return;
    
    nhomDangDanhGia = nhom;
    nguoiDangDanhGia = thanhVien;
    
    // Reset điểm
    diemDanhGia = {
        'thai-do': 0,
        'dong-gop': 0,
        'giao-tiep': 0,
        'dung-han': 0
    };
    
    // Reset stars
    document.querySelectorAll('.star-rating').forEach(rating => {
        rating.querySelectorAll('.star').forEach(star => {
            star.classList.remove('active');
        });
    });
    
    // Reset nhận xét
    document.getElementById('nhan-xet').value = '';
    document.getElementById('char-count').textContent = '0';
    document.getElementById('an-danh').checked = true;
    
    // Điền thông tin
    document.getElementById('modal-nguoi-name').textContent = thanhVien.hoTen;
    document.getElementById('modal-nguoi-role').textContent = thanhVien.vaiTro;
    document.getElementById('modal-ten-nguoi-duoc-dg').textContent = 
        `Đánh giá: ${thanhVien.hoTen}`;
    
    // Hiện modal
    document.getElementById('modal-danh-gia').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('modal-danh-gia');
    if (!modal) return;
    
    modal.style.display = 'none';
    document.body.style.overflow = '';
    nhomDangDanhGia = null;
    nguoiDangDanhGia = null;
}

// ============================================
// STAR RATING
// ============================================

function setupStarRating() {
    document.querySelectorAll('.star-rating').forEach(rating => {
        const tieuChi = rating.dataset.tieuChi;
        const stars = rating.querySelectorAll('.star');
        
        stars.forEach(star => {
            // Hover
            star.addEventListener('mouseenter', () => {
                const value = parseInt(star.dataset.value);
                stars.forEach((s, index) => {
                    if (index < value) {
                        s.style.color = 'var(--secondary)';
                        s.style.borderColor = 'var(--secondary)';
                    } else {
                        s.style.color = '';
                        s.style.borderColor = '';
                    }
                });
            });
            
            // Click
            star.addEventListener('click', () => {
                const value = parseInt(star.dataset.value);
                diemDanhGia[tieuChi] = value;
                
                // Update active
                stars.forEach((s, index) => {
                    s.classList.toggle('active', index < value);
                });
                
                // Reset hover effect
                stars.forEach(s => {
                    s.style.color = '';
                    s.style.borderColor = '';
                });
            });
        });
        
        // Mouse leave
        rating.addEventListener('mouseleave', () => {
            stars.forEach(s => {
                s.style.color = '';
                s.style.borderColor = '';
            });
        });
    });
}

// ============================================
// CHAR COUNT
// ============================================

function setupCharCount() {
    const textarea = document.getElementById('nhan-xet');
    const counter = document.getElementById('char-count');
    
    textarea.addEventListener('input', () => {
        const length = textarea.value.length;
        counter.textContent = length;
        
        // Đổi màu khi gần đạt giới hạn
        counter.parentElement.classList.remove('warning', 'danger');
        if (length >= 450) {
            counter.parentElement.classList.add('danger');
        } else if (length >= 350) {
            counter.parentElement.classList.add('warning');
        }
    });
}

// ============================================
// GỬI ĐÁNH GIÁ
// ============================================

function guiDanhGia() {
    // Validate
    const thieuTieuChi = Object.entries(diemDanhGia)
        .filter(([key, value]) => value === 0)
        .map(([key]) => getTieuChiText(key));
    
    if (thieuTieuChi.length > 0) {
        alert(`Vui lòng đánh giá các tiêu chí sau:\n• ${thieuTieuChi.join('\n• ')}`);
        return;
    }
    
    const nhanXet = document.getElementById('nhan-xet').value.trim();
    const anDanh = document.getElementById('an-danh').checked;
    
    // Giả lập gửi API
    const data = {
        maNhom: nhomDangDanhGia.maNhom,
        maNguoiDanhGia: 1, // Nguyễn Văn An
        maNguoiDuocDanhGia: nguoiDangDanhGia.maTaiKhoan,
        diemThaiDo: diemDanhGia['thai-do'],
        diemDongGop: diemDanhGia['dong-gop'],
        diemGiaoTiep: diemDanhGia['giao-tiep'],
        diemDungHan: diemDanhGia['dung-han'],
        nhanXet: nhanXet,
        anDanh: anDanh
    };
    
    console.log('Gửi đánh giá:', data);
    
    // Cập nhật state
    nguoiDangDanhGia.daDanhGia = true;
    
    // Đóng modal
    closeModal();
    
    // Reload danh sách
    loadDanhSachDanhGia();
    
    // Thông báo
    setTimeout(() => {
        showToast(`Đã gửi đánh giá cho ${nguoiDangDanhGia.hoTen}`, 'success');
    }, 100);
}

// ============================================
// HELPER
// ============================================

function getTieuChiText(key) {
    const map = {
        'thai-do': 'Thái độ',
        'dong-gop': 'Mức độ đóng góp',
        'giao-tiep': 'Giao tiếp',
        'dung-han': 'Đúng hạn'
    };
    return map[key] || key;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const date = formatDate(dateStr);
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${date} ${time}`;
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 14px 20px;
        background: ${type === 'success' ? '#5B8C5A' : '#B85045'};
        color: white;
        border-radius: 12px;
        font-weight: 600;
        font-size: 14px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        font-family: 'Inter', sans-serif;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Thêm animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);