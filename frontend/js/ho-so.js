// ============================================
// TRANG HỒ SƠ CÁ NHÂN
// ============================================

// MOCK DATA
const MOCK_MON_HOC = [
    { maMonHoc: 1, tenMonHoc: 'Trí tuệ nhân tạo', maCode: 'INT3401', mucDo: 5 },
    { maMonHoc: 2, tenMonHoc: 'Học máy', maCode: 'INT3403', mucDo: 4 },
    { maMonHoc: 3, tenMonHoc: 'Cơ sở dữ liệu', maCode: 'INT2211', mucDo: 4 },
    { maMonHoc: 4, tenMonHoc: 'Cấu trúc dữ liệu', maCode: 'INT2210', mucDo: 5 }
];

const MOCK_KY_NANG = {
    'Lập trình': [
        { ten: 'Python', trinhDo: 'kha' },
        { ten: 'Java', trinhDo: 'co_ban' },
        { ten: 'SQL', trinhDo: 'kha' },
        { ten: 'JavaScript', trinhDo: 'co_ban' }
    ],
    'Dữ liệu & AI': [
        { ten: 'Pandas', trinhDo: 'kha' },
        { ten: 'Scikit-learn', trinhDo: 'co_ban' },
        { ten: 'TensorFlow', trinhDo: 'moi_bat_dau' }
    ],
    'Kỹ năng mềm': [
        { ten: 'Làm việc nhóm', trinhDo: 'kha' },
        { ten: 'Thuyết trình', trinhDo: 'co_ban' }
    ],
    'Ngoại ngữ': [
        { ten: 'Tiếng Anh (IELTS 7.0)', trinhDo: 'kha' }
    ]
};

const MOCK_BANG_CAP = [
    {
        ten: 'IELTS Academic',
        toChuc: 'British Council',
        diem: '7.0',
        ngayCap: '15/03/2024',
        daXacThuc: true
    },
    {
        ten: 'AWS Cloud Practitioner',
        toChuc: 'Amazon Web Services',
        diem: 'Pass',
        ngayCap: '20/06/2024',
        daXacThuc: true
    },
    {
        ten: 'Giải Nhì Olympic Tin học',
        toChuc: 'Đại học Bách Khoa',
        diem: '—',
        ngayCap: '10/11/2023',
        daXacThuc: false
    }
];

// Lịch rảnh (true = rảnh)
let lichRanh = {
    '2-0': true,  // T2 sáng
    '2-2': true,  // T2 tối
    '4-0': true,  // T4 sáng
    '4-2': true,  // T4 tối
    '6-0': true,  // T6 sáng
};

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    renderMonHoc();
    renderKyNang();
    renderBangCap();
    renderLichRanh();
});

function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(c => {
                c.style.display = 'none';
            });
            
            const content = document.getElementById(`tab-${tabName}`);
            if (content) {
                content.style.display = 'block';
                content.style.animation = 'none';
                content.offsetHeight;
                content.style.animation = 'fadeInUp 0.3s ease';
            }
        });
    });
}

// ============================================
// RENDER MÔN HỌC
// ============================================

function renderMonHoc() {
    const list = document.getElementById('list-mon-hoc');
    
    list.innerHTML = MOCK_MON_HOC.map(mh => {
        const dots = Array.from({ length: 5 }, (_, i) => 
            `<span class="level-dot ${i < mh.mucDo ? 'filled' : ''}"></span>`
        ).join('');
        
        return `
            <div class="mon-hoc-item">
                <div class="mon-hoc-info">
                    <div class="mon-hoc-name">${mh.tenMonHoc}</div>
                    <div class="mon-hoc-code">${mh.maCode}</div>
                </div>
                <div class="mon-hoc-level">
                    <div class="level-bar">${dots}</div>
                    <div class="level-text">Mức độ ${mh.mucDo}/5</div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// RENDER KỸ NĂNG
// ============================================

function renderKyNang() {
    const container = document.getElementById('list-ky-nang');
    
    const levelText = {
        'moi_bat_dau': 'Mới bắt đầu',
        'co_ban': 'Cơ bản',
        'kha': 'Khá',
        'chuyen_gia': 'Chuyên gia'
    };
    
    container.innerHTML = Object.entries(MOCK_KY_NANG).map(([nhom, list]) => `
        <div class="ky-nang-group">
            <h3 class="ky-nang-group-title">${nhom}</h3>
            <div class="ky-nang-list">
                ${list.map(kn => `
                    <span class="ky-nang-tag ${kn.trinhDo === 'kha' || kn.trinhDo === 'chuyen_gia' ? 'level-cao' : ''}">
                        ${kn.ten}
                        <span class="ky-nang-level">${levelText[kn.trinhDo]}</span>
                    </span>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// ============================================
// RENDER BẰNG CẤP
// ============================================

function renderBangCap() {
    const list = document.getElementById('list-bang-cap');
    
    list.innerHTML = MOCK_BANG_CAP.map(bc => `
        <div class="bang-cap-item ${bc.daXacThuc ? 'verified' : ''}">
            <div class="bang-cap-name">${bc.ten}</div>
            <div class="bang-cap-org">${bc.toChuc}</div>
            <div class="bang-cap-details">
                <span class="bang-cap-score">${bc.diem}</span>
                <span class="bang-cap-date">Cấp ngày ${bc.ngayCap}</span>
            </div>
        </div>
    `).join('');
}

// ============================================
// RENDER LỊCH RẢNH
// ============================================

function renderLichRanh() {
    const grid = document.getElementById('lich-ranh-grid');
    const thuList = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const caList = ['Sáng', 'Chiều', 'Tối'];
    
    let html = '<div class="lich-ranh-header"></div>';
    
    thuList.forEach(thu => {
        html += `<div class="lich-ranh-header">${thu}</div>`;
    });
    
    caList.forEach((ca, caIndex) => {
        html += `<div class="lich-ranh-ca-label">${ca}</div>`;
        
        thuList.forEach((thu, thuIndex) => {
            const key = `${thuIndex + 2}-${caIndex}`;
            const isAvailable = lichRanh[key] || false;
            
            html += `
                <div class="lich-ranh-cell ${isAvailable ? 'available' : ''}" 
                     onclick="toggleLichRanh('${key}')">
                </div>
            `;
        });
    });
    
    grid.innerHTML = html;
}

function toggleLichRanh(key) {
    lichRanh[key] = !lichRanh[key];
    renderLichRanh();
}

function luuLichRanh() {
    // Chuyển thành chuỗi bit
    const bitString = Array.from({ length: 21 }, (_, i) => {
        const thu = Math.floor(i / 3) + 2;
        const ca = i % 3;
        const key = `${thu}-${ca}`;
        return lichRanh[key] ? '1' : '0';
    }).join('');
    
    console.log('Lịch rảnh bit:', bitString);
    alert(`Đã lưu lịch rảnh!\nChuỗi bit: ${bitString}`);
}

// ============================================
// ACTIONS
// ============================================

function suaHoSo() {
    alert('Chức năng chỉnh sửa hồ sơ đang phát triển');
}