// ============================================
// TRANG NHÓM CỦA BẠN
// ============================================

// ===== MOCK DATA =====

const MOCK_NHOM_DANG_THAM_GIA = [
    {
        maNhom: 1,
        tenNhom: 'Nhóm AI - Đồ án Chatbot',
        maLoaiNhom: 'DO_AN_MON',
        tenLoai: 'Đồ án môn học',
        moTa: 'Nhóm làm đồ án môn Trí tuệ nhân tạo, xây dựng chatbot tư vấn tuyển sinh',
        tenMonHoc: 'Trí tuệ nhân tạo',
        tenDeTai: 'Chatbot tư vấn tuyển sinh',
        soThanhVienHienTai: 3,
        soThanhVienToiDa: 5,
        trangThai: 'hoat_dong',
        vaiTro: 'truong_nhom',
        nguoiTao: 'Nguyễn Văn An'
    },
    {
        maNhom: 5,
        tenNhom: 'Nhóm ôn thi Giải tích 2',
        maLoaiNhom: 'ON_THI',
        tenLoai: 'Ôn thi',
        moTa: 'Ôn tập cuối kỳ Giải tích 2, giải đề thi các năm',
        tenMonHoc: 'Giải tích 2',
        soThanhVienHienTai: 4,
        soThanhVienToiDa: 8,
        trangThai: 'hoat_dong',
        vaiTro: 'thanh_vien',
        nguoiTao: 'Trần Thị Bình'
    }
];

const MOCK_NHOM_DA_TAO = [
    {
        maNhom: 1,
        tenNhom: 'Nhóm AI - Đồ án Chatbot',
        maLoaiNhom: 'DO_AN_MON',
        tenLoai: 'Đồ án môn học',
        moTa: 'Nhóm làm đồ án môn Trí tuệ nhân tạo',
        tenMonHoc: 'Trí tuệ nhân tạo',
        soThanhVienHienTai: 3,
        soThanhVienToiDa: 5,
        trangThai: 'hoat_dong',
        vaiTro: 'truong_nhom',
        nguoiTao: 'Nguyễn Văn An'
    }
];

const MOCK_LOI_MOI = [
    {
        maLoiMoi: 1,
        maNhom: 3,
        tenNhom: 'CLB AI Bách Khoa',
        maLoaiNhom: 'CLB_HOC_THUAT',
        tenLoai: 'Câu lạc bộ học thuật',
        moTa: 'Câu lạc bộ sinh hoạt về AI, ML, DL',
        tenLinhVuc: 'Trí tuệ nhân tạo',
        soThanhVienHienTai: 12,
        soThanhVienToiDa: 20,
        nguoiMoi: 'Lê Văn Cường',
        loiNhan: 'Chào An, mình thấy bạn có kinh nghiệm Python. Tham gia CLB bọn mình nhé!',
        ngayTao: '2024-10-05'
    },
    {
        maLoiMoi: 2,
        maNhom: 2,
        tenNhom: 'Nhóm ML - Dự đoán giá nhà',
        maLoaiNhom: 'NGHIEN_CUU',
        tenLoai: 'Nghiên cứu khoa học',
        moTa: 'Nghiên cứu mô hình ML dự đoán giá nhà',
        tenLinhVuc: 'Machine Learning',
        soThanhVienHienTai: 2,
        soThanhVienToiDa: 4,
        nguoiMoi: 'Trần Thị Bình',
        loiNhan: 'An ơi, join nhóm mình làm nghiên cứu ML đi!',
        ngayTao: '2024-10-04'
    }
];

const MOCK_YEU_CAU = [
    {
        maYeuCau: 1,
        maNhom: 4,
        tenNhom: 'Nhóm ôn thi Toán rời rạc',
        maLoaiNhom: 'ON_THI',
        tenLoai: 'Ôn thi',
        moTa: 'Ôn tập và giải đề thi môn Toán rời rạc',
        tenMonHoc: 'Toán rời rạc',
        soThanhVienHienTai: 4,
        soThanhVienToiDa: 8,
        trangThai: 'cho_duyet',
        ngayTao: '2024-10-06'
    }
];

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Setup tabs
    setupTabs();
    
    // Load tất cả
    renderDangThamGia();
    renderDaTao();
    renderLoiMoi();
    renderYeuCau();
    
    // Đóng sách bằng ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeBook();
    });
});

// ============================================
// TABS
// ============================================

function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Đổi active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Ẩn tất cả content
            document.querySelectorAll('.tab-content').forEach(c => {
                c.style.display = 'none';
            });
            
            // Hiện tab được chọn
            const content = document.getElementById(`tab-${tabName}`);
            if (content) {
                content.style.display = 'block';
                // Re-trigger animation
                content.style.animation = 'none';
                content.offsetHeight;
                content.style.animation = 'fadeInUp 0.3s ease';
            }
        });
    });
}

// ============================================
// RENDER — TAB 1: ĐANG THAM GIA
// ============================================

function renderDangThamGia() {
    const list = document.getElementById('list-dang-tham-gia');
    const empty = document.getElementById('empty-dang-tham-gia');
    const count = document.getElementById('count-dang-tham-gia');
    
    if (MOCK_NHOM_DANG_THAM_GIA.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
        count.textContent = '0';
        return;
    }
    
    empty.style.display = 'none';
    count.textContent = MOCK_NHOM_DANG_THAM_GIA.length;
    list.innerHTML = MOCK_NHOM_DANG_THAM_GIA.map(nhom => 
        renderNhomCard(nhom, 'dang-tham-gia')
    ).join('');
}

// ============================================
// RENDER — TAB 2: ĐÃ TẠO
// ============================================

function renderDaTao() {
    const list = document.getElementById('list-da-tao');
    const empty = document.getElementById('empty-da-tao');
    const count = document.getElementById('count-da-tao');
    
    if (MOCK_NHOM_DA_TAO.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
        count.textContent = '0';
        return;
    }
    
    empty.style.display = 'none';
    count.textContent = MOCK_NHOM_DA_TAO.length;
    list.innerHTML = MOCK_NHOM_DA_TAO.map(nhom => 
        renderNhomCard(nhom, 'da-tao')
    ).join('');
}

// ============================================
// RENDER — TAB 3: LỜI MỜI
// ============================================

function renderLoiMoi() {
    const list = document.getElementById('list-loi-moi');
    const empty = document.getElementById('empty-loi-moi');
    const count = document.getElementById('count-loi-moi');
    
    if (MOCK_LOI_MOI.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
        count.textContent = '0';
        count.classList.remove('badge-fire');
        return;
    }
    
    empty.style.display = 'none';
    count.textContent = MOCK_LOI_MOI.length;
    count.classList.add('badge-fire');
    list.innerHTML = MOCK_LOI_MOI.map(lm => 
        renderLoiMoiCard(lm)
    ).join('');
}

// ============================================
// RENDER — TAB 4: YÊU CẦU
// ============================================

function renderYeuCau() {
    const list = document.getElementById('list-yeu-cau');
    const empty = document.getElementById('empty-yeu-cau');
    const count = document.getElementById('count-yeu-cau');
    
    if (MOCK_YEU_CAU.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
        count.textContent = '0';
        return;
    }
    
    empty.style.display = 'none';
    count.textContent = MOCK_YEU_CAU.length;
    list.innerHTML = MOCK_YEU_CAU.map(yc => 
        renderYeuCauCard(yc)
    ).join('');
}

// ============================================
// RENDER NHÓM CARD
// ============================================

function renderNhomCard(nhom, context) {
    const vaiTroClass = `vai-tro-${nhom.vaiTro}`;
    const vaiTroText = getVaiTroText(nhom.vaiTro);
    
    // Actions theo context
    let actions = '';
    if (context === 'dang-tham-gia') {
        actions = `
            <button class="btn btn-secondary btn-sm" 
                    onclick="event.stopPropagation(); xemChiTiet(${nhom.maNhom})">
                📖 Mở sách
            </button>
            <button class="btn btn-primary btn-sm" 
                    onclick="event.stopPropagation(); vaoNhom(${nhom.maNhom})">
                Vào nhóm →
            </button>
        `;
    } else if (context === 'da-tao') {
        actions = `
            <button class="btn btn-secondary btn-sm" 
                    onclick="event.stopPropagation(); quanLyNhom(${nhom.maNhom})">
                ⚙️ Quản lý
            </button>
            <button class="btn btn-primary btn-sm" 
                    onclick="event.stopPropagation(); vaoNhom(${nhom.maNhom})">
                Vào nhóm →
            </button>
        `;
    }
    
    return `
        <div class="nhom-card ${vaiTroClass}" onclick="xemChiTiet(${nhom.maNhom})">
            <div class="nhom-vai-tro">${vaiTroText}</div>
            
            <div class="nhom-icon">📖</div>
            
            <div>
                <h3 class="nhom-title">${nhom.tenNhom}</h3>
                <div class="nhom-type" style="margin-top: 6px;">${nhom.tenLoai}</div>
            </div>
            
            <p class="nhom-desc">${nhom.moTa}</p>
            
            <div class="nhom-meta">
                ${nhom.tenMonHoc ? `<span class="nhom-meta-item">📚 ${nhom.tenMonHoc}</span>` : ''}
                ${nhom.tenLinhVuc ? `<span class="nhom-meta-item">🏷️ ${nhom.tenLinhVuc}</span>` : ''}
                <span class="nhom-meta-item">👥 ${nhom.soThanhVienHienTai}/${nhom.soThanhVienToiDa}</span>
            </div>
            
            <div class="nhom-actions">
                ${actions}
            </div>
        </div>
    `;
}

// ============================================
// RENDER LỜI MỜI CARD
// ============================================

function renderLoiMoiCard(lm) {
    return `
        <div class="nhom-card loi-moi-card" onclick="xemChiTiet(${lm.maNhom})">
            <div class="nhom-vai-tro" style="background: linear-gradient(135deg, #FFEDD5 0%, #E8C4A8 100%); color: #6B3D28;">
                📩 Lời mời
            </div>
            
            <div class="nhom-icon">📩</div>
            
            <div>
                <h3 class="nhom-title">${lm.tenNhom}</h3>
                <div class="nhom-type" style="margin-top: 6px;">${lm.tenLoai}</div>
            </div>
            
            <p class="nhom-desc">${lm.moTa}</p>
            
            <div class="loi-moi-message">
                <strong>${lm.nguoiMoi}:</strong> ${lm.loiNhan}
            </div>
            
            <div class="nhom-meta">
                ${lm.tenLinhVuc ? `<span class="nhom-meta-item">🏷️ ${lm.tenLinhVuc}</span>` : ''}
                <span class="nhom-meta-item">👥 ${lm.soThanhVienHienTai}/${lm.soThanhVienToiDa}</span>
            </div>
            
            <div class="nhom-actions">
                <button class="btn btn-reject btn-sm" 
                        onclick="event.stopPropagation(); tuChoiLoiMoi(${lm.maLoiMoi})">
                    ❌ Từ chối
                </button>
                <button class="btn btn-accept btn-sm" 
                        onclick="event.stopPropagation(); chapNhanLoiMoi(${lm.maLoiMoi})">
                    ✅ Chấp nhận
                </button>
            </div>
        </div>
    `;
}

// ============================================
// RENDER YÊU CẦU CARD
// ============================================

function renderYeuCauCard(yc) {
    const statusMap = {
        'cho_duyet': { class: 'status-pending', text: '⏳ Chờ duyệt' },
        'da_chap_nhan': { class: 'status-accepted', text: '✅ Đã chấp nhận' },
        'da_tu_choi': { class: 'status-rejected', text: '❌ Bị từ chối' },
        'da_huy': { class: 'status-rejected', text: '🚫 Đã hủy' }
    };
    
    const status = statusMap[yc.trangThai] || statusMap['cho_duyet'];
    
    return `
        <div class="nhom-card" onclick="xemChiTiet(${yc.maNhom})">
            <div class="nhom-vai-tro" style="background: linear-gradient(135deg, #F5EBD9 0%, #E8DCC8 100%); color: #6B5644;">
                📤 Đã gửi
            </div>
            
            <div class="nhom-icon">📤</div>
            
            <div>
                <h3 class="nhom-title">${yc.tenNhom}</h3>
                <div class="nhom-type" style="margin-top: 6px;">${yc.tenLoai}</div>
            </div>
            
            <p class="nhom-desc">${yc.moTa}</p>
            
            <div class="nhom-meta">
                ${yc.tenMonHoc ? `<span class="nhom-meta-item">📚 ${yc.tenMonHoc}</span>` : ''}
                <span class="nhom-meta-item">👥 ${yc.soThanhVienHienTai}/${yc.soThanhVienToiDa}</span>
            </div>
            
            <div class="yeu-cau-status ${status.class}" style="margin-top: 8px;">
                ${status.text}
            </div>
            
            ${yc.trangThai === 'cho_duyet' ? `
                <div class="nhom-actions">
                    <button class="btn btn-reject btn-sm" 
                            onclick="event.stopPropagation(); huyYeuCau(${yc.maYeuCau})">
                        🚫 Hủy yêu cầu
                    </button>
                    <button class="btn btn-secondary btn-sm" 
                            onclick="event.stopPropagation(); xemChiTiet(${yc.maNhom})">
                        📖 Xem nhóm
                    </button>
                </div>
            ` : `
                <div class="nhom-actions">
                    <button class="btn btn-secondary btn-sm" 
                            onclick="event.stopPropagation(); xemChiTiet(${yc.maNhom})">
                        📖 Xem nhóm
                    </button>
                </div>
            `}
        </div>
    `;
}

// ============================================
// HELPER
// ============================================

function getVaiTroText(vaiTro) {
    const map = {
        'truong_nhom': '👑 Trưởng nhóm',
        'pho_nhom': '⭐ Phó nhóm',
        'thanh_vien': '👤 Thành viên'
    };
    return map[vaiTro] || 'Thành viên';
}

// ============================================
// ACTIONS
// ============================================

function taoNhomMoi() {
    alert('🚧 Chức năng tạo nhóm mới đang phát triển');
    // window.location.href = 'tao-nhom.html';
}

function xemChiTiet(maNhom) {
    openBook(maNhom);
}

function vaoNhom(maNhom) {
    alert(`🚪 Đang vào nhóm ${maNhom}...`);
    // window.location.href = `chi-tiet-nhom.html?id=${maNhom}`;
}

function quanLyNhom(maNhom) {
    alert(`⚙️ Mở trang quản lý nhóm ${maNhom}`);
    // window.location.href = `quan-ly-nhom.html?id=${maNhom}`;
}

function chapNhanLoiMoi(maLoiMoi) {
    const lm = MOCK_LOI_MOI.find(l => l.maLoiMoi === maLoiMoi);
    if (!lm) return;
    
    if (!confirm(`Chấp nhận lời mời vào nhóm "${lm.tenNhom}"?`)) return;
    
    // Xóa khỏi danh sách
    const index = MOCK_LOI_MOI.findIndex(l => l.maLoiMoi === maLoiMoi);
    if (index > -1) MOCK_LOI_MOI.splice(index, 1);
    
    // Render lại
    renderLoiMoi();
    
    alert(`✅ Đã tham gia nhóm "${lm.tenNhom}"!`);
}

function tuChoiLoiMoi(maLoiMoi) {
    const lm = MOCK_LOI_MOI.find(l => l.maLoiMoi === maLoiMoi);
    if (!lm) return;
    
    if (!confirm(`Từ chối lời mời từ nhóm "${lm.tenNhom}"?`)) return;
    
    const index = MOCK_LOI_MOI.findIndex(l => l.maLoiMoi === maLoiMoi);
    if (index > -1) MOCK_LOI_MOI.splice(index, 1);
    
    renderLoiMoi();
    
    alert('Đã từ chối lời mời');
}

function huyYeuCau(maYeuCau) {
    if (!confirm('Bạn có chắc muốn hủy yêu cầu này?')) return;
    
    const index = MOCK_YEU_CAU.findIndex(y => y.maYeuCau === maYeuCau);
    if (index > -1) {
        MOCK_YEU_CAU[index].trangThai = 'da_huy';
    }
    
    renderYeuCau();
    alert('Đã hủy yêu cầu');
}

// ============================================
// BOOK MODAL
// ============================================

let nhomDangMo = null;

function openBook(maNhom) {
    // Tìm nhóm trong tất cả danh sách
    const group = 
        MOCK_NHOM_DANG_THAM_GIA.find(g => g.maNhom === maNhom) ||
        MOCK_NHOM_DA_TAO.find(g => g.maNhom === maNhom) ||
        MOCK_LOI_MOI.find(g => g.maNhom === maNhom) ||
        MOCK_YEU_CAU.find(g => g.maNhom === maNhom);
    
    if (!group) return;
    
    nhomDangMo = group;
    
    // Điền thông tin
    document.getElementById('book-title').textContent = group.tenNhom;
    document.getElementById('book-type').textContent = group.tenLoai;
    document.getElementById('book-desc').textContent = group.moTa || 'Chưa có mô tả';
    document.getElementById('book-mon-hoc').textContent = group.tenMonHoc || '—';
    document.getElementById('book-de-tai').textContent = group.tenDeTai || '—';
    document.getElementById('book-member-count').textContent = 
        `${group.soThanhVienHienTai}/${group.soThanhVienToiDa}`;
    
    // Members
    const members = [
        { name: group.nguoiTao || 'Nguyễn Văn An', role: 'Trưởng nhóm', avatar: '👨‍🎓' },
        { name: 'Trần Thị Bình', role: 'Thành viên', avatar: '👩‍🎓' },
        { name: 'Lê Văn Cường', role: 'Thành viên', avatar: '👨‍🎓' }
    ].slice(0, group.soThanhVienHienTai);
    
    document.getElementById('book-members').innerHTML = members.map(m => `
        <div class="book-member">
            <div class="book-member-avatar">${m.avatar}</div>
            <div class="book-member-info">
                <div class="book-member-name">${m.name}</div>
                <div class="book-member-role">${m.role}</div>
            </div>
        </div>
    `).join('');
    
    // Status
    document.getElementById('book-status').innerHTML = `
        <div class="book-status-badge">Đang hoạt động</div>
    `;
    
    // Actions theo vai trò
    let actions = '';
    if (group.vaiTro === 'truong_nhom') {
        actions = `
            <button class="btn btn-primary" onclick="quanLyNhom(${group.maNhom}); closeBook();">
                ⚙️ Quản lý nhóm
            </button>
            <button class="btn btn-secondary" onclick="closeBook()">
                Đóng sách
            </button>
        `;
    } else {
        actions = `
            <button class="btn btn-primary" onclick="vaoNhom(${group.maNhom}); closeBook();">
                Vào nhóm →
            </button>
            <button class="btn btn-secondary" onclick="closeBook()">
                Đóng sách
            </button>
        `;
    }
    
    document.getElementById('book-actions').innerHTML = actions;
    
    // Hiện modal
    const modal = document.getElementById('book-modal');
    const container = document.getElementById('book-container');
    modal.style.display = 'flex';
    
    setTimeout(() => {
        container.classList.add('opening');
    }, 50);
    
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
        nhomDangMo = null;
    }, 400);
}