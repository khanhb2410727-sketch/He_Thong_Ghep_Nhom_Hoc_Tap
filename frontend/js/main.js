// ===== API CONFIG =====
const API_BASE = 'http://localhost:8000/api';
const USE_MOCK = true;

// ===== MOCK DATA =====
const MOCK_GROUPS = [
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
        diemTuongThich: 0.92,
        nguoiTao: 'Nguyễn Văn An'
    },
    {
        maNhom: 2,
        tenNhom: 'Nhóm ML - Dự đoán giá nhà',
        maLoaiNhom: 'NGHIEN_CUU',
        tenLoai: 'Nghiên cứu khoa học',
        moTa: 'Nghiên cứu mô hình Machine Learning dự đoán giá nhà',
        tenMonHoc: null,
        tenLinhVuc: 'Machine Learning',
        tenDeTai: 'Dự đoán giá nhà',
        soThanhVienHienTai: 2,
        soThanhVienToiDa: 4,
        trangThai: 'hoat_dong',
        diemTuongThich: 0.85,
        nguoiTao: 'Trần Thị Bình'
    },
    {
        maNhom: 3,
        tenNhom: 'CLB AI Bách Khoa',
        maLoaiNhom: 'CLB_HOC_THUAT',
        tenLoai: 'Câu lạc bộ học thuật',
        moTa: 'Câu lạc bộ sinh hoạt về AI, Machine Learning, Deep Learning',
        tenMonHoc: null,
        tenLinhVuc: 'Trí tuệ nhân tạo',
        soThanhVienHienTai: 12,
        soThanhVienToiDa: 20,
        trangThai: 'hoat_dong',
        diemTuongThich: 0.78,
        nguoiTao: 'Lê Văn Cường'
    },
    {
        maNhom: 4,
        tenNhom: 'Nhóm ôn thi Toán rời rạc',
        maLoaiNhom: 'ON_THI',
        tenLoai: 'Ôn thi',
        moTa: 'Ôn tập và giải đề thi môn Toán rời rạc',
        tenMonHoc: 'Toán rời rạc',
        soThanhVienHienTai: 4,
        soThanhVienToiDa: 8,
        trangThai: 'hoat_dong',
        diemTuongThich: 0.65,
        nguoiTao: 'Phạm Thị Dung'
    }
];

// ===== HELPER FUNCTIONS =====
async function apiCall(endpoint, options = {}) {
    if (USE_MOCK) {
        await sleep(300);
        return mockApiCall(endpoint, options);
    }
    
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };
    
    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });
    
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

function mockApiCall(endpoint) {
    if (endpoint === '/nhom/tim-kiem') {
        return { danhSach: MOCK_GROUPS };
    }
    return {};
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatScore(score) {
    return Math.round(score * 100) + '%';
}

function getScoreColor(score) {
    if (score >= 0.85) return '#D4A350';
    if (score >= 0.7) return '#E8B96D';
    if (score >= 0.5) return '#E8C4A8';
    return '#B85045';
}

function getBadgeColor(maLoaiNhom) {
    const map = {
        'HOC_MON': 'sage',
        'CLB_HOC_THUAT': 'mauve',
        'DU_AN_CA_NHAN': 'terracotta',
        'NGHIEN_CUU': 'cinnamon',
        'DO_AN_MON': 'honey',
        'ON_THI': 'rose',
        'KY_NANG': 'sage'
    };
    return map[maLoaiNhom] || 'cream';
}