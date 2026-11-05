const urlParams = new URLSearchParams(window.location.search);
const maNhom = parseInt(urlParams.get('maNhom'));
let currentUserId = null;
let ws = null;
let isTruongNhom = false;

document.addEventListener('DOMContentLoaded', async () => {
    if (!localStorage.getItem('token') || !maNhom) { window.location.href = 'nhom-cua-ban.html'; return; }
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        currentUserId = user.ma_tai_khoan;
    }

    try {
        const data = await apiCall(`/nhom/${maNhom}/chi-tiet`, { method: 'GET' });
        document.getElementById('chat-ten-nhom').textContent = data.tenNhom;
        // So sánh ID người tạo nhóm với ID người đang đăng nhập để phân quyền
        if (data.nguoiTao === currentUserId) isTruongNhom = true; 
    } catch (err) { console.error(err); }

    await loadLichSuTinNhan();
    connectWebSocket();

    document.getElementById('chat-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (text && ws && ws.readyState === WebSocket.OPEN) {
            ws.send(text);
            input.value = '';
        }
    });
});

async function loadLichSuTinNhan() {
    try {
        const data = await apiCall(`/nhom/${maNhom}/tin-nhan`, { method: 'GET' });
        const chatBox = document.getElementById('chat-box');
        chatBox.innerHTML = '';
        data.forEach(msg => renderTinNhan(msg));
    } catch (err) { console.error('Lỗi tải tin nhắn:', err); }
}

function connectWebSocket() {
    if (!currentUserId) return; // BẢO VỆ SERVER: Không kết nối nếu không có ID
    const wsUrl = API_BASE.replace('http://', 'ws://').replace('/api', '');
    ws = new WebSocket(`${wsUrl}/ws/chat/${maNhom}/${currentUserId}`);
    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (!msg.system) { renderTinNhan(msg); }
    };
    ws.onclose = () => { setTimeout(connectWebSocket, 3000); };
}

function renderTinNhan(msg) {
    const chatBox = document.getElementById('chat-box');
    const isMine = msg.ma_tai_khoan === currentUserId;
    const avatarUrl = msg.anh_dai_dien || `https://api.dicebear.com/7.x/adventurer/svg?seed=${msg.ten_nguoi_gui}`;
    
    // Chỉ cho phép click xem hồ sơ nếu không phải là tin nhắn của mình
    const clickProfile = !isMine ? `onclick="xemHoSoChat(${msg.ma_tai_khoan})" style="cursor: pointer;"` : '';

    const div = document.createElement('div');
    div.className = `msg-wrapper ${isMine ? 'mine' : 'other'}`;
    div.innerHTML = `
        <img src="${avatarUrl}" class="msg-avatar" alt="Avatar" ${clickProfile}>
        <div class="msg-content">
            ${!isMine ? `<div class="msg-info" ${clickProfile}>${msg.ten_nguoi_gui} • ${msg.ngay_gui}</div>` : ''}
            <div class="msg-bubble">${msg.noi_dung}</div>
        </div>
    `;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// MODAL HOẠT ĐỘNG
function openActivityModal() {
    document.getElementById('activity-modal').style.display = 'flex';
    switchActivityTab('calendar');
    loadDanhSachLichHop();
    loadDanhSachDeadline();
}
function closeActivityModal() { document.getElementById('activity-modal').style.display = 'none'; }
function switchActivityTab(tab) {
    document.getElementById('tab-calendar').classList.remove('active');
    document.getElementById('tab-deadline').classList.remove('active');
    document.getElementById('tab-lich-ranh').classList.remove('active');
    
    document.getElementById('content-calendar').style.display = 'none';
    document.getElementById('content-deadline').style.display = 'none';
    document.getElementById('content-lich-ranh').style.display = 'none';

    if (tab === 'calendar') {
        document.getElementById('tab-calendar').classList.add('active');
        document.getElementById('content-calendar').style.display = 'block';
    } else if (tab === 'deadline') {
        document.getElementById('tab-deadline').classList.add('active');
        document.getElementById('content-deadline').style.display = 'block';
    } else if (tab === 'lich-ranh') {
        document.getElementById('tab-lich-ranh').classList.add('active');
        document.getElementById('content-lich-ranh').style.display = 'block';
        loadLichRanhChung(); // Gọi API tải lịch
    }
}
// LỊCH HỌP
async function loadDanhSachLichHop() {
    const list = document.getElementById('list-lich-hop');
    list.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Đang tải...</p>';
    try {
        const data = await apiCall(`/nhom/${maNhom}/lich-hop`, { method: 'GET' });
        if (data.length === 0) { list.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Chưa có lịch họp.</p>'; return; }
        
        list.innerHTML = data.map(lh => {
            let timeStr = lh.thoi_gian_bat_dau ? new Date(lh.thoi_gian_bat_dau).toLocaleString('vi-VN') : "—";
            // Chỉ hiển thị nút Xóa nếu là Trưởng nhóm
            const btnXoa = isTruongNhom ? `<button class="btn btn-secondary btn-sm" style="color:#EF4444; border-color:#EF4444;" onclick="xoaLichHop(${lh.ma_lich_hop})">Xóa</button>` : '';
            return `<div class="task-item"><div><div class="task-title">${lh.tieu_de}</div><div class="task-time">${timeStr} | ${lh.dia_diem || '—'}</div></div>${btnXoa}</div>`;
        }).join('');
    } catch (err) { list.innerHTML = '<p style="color: red; text-align: center;">Lỗi tải lịch!</p>'; }
}
function moModalTaoLich() { document.getElementById('modal-tao-lich').style.display = 'flex'; }
function closeModalTaoLich() { document.getElementById('modal-tao-lich').style.display = 'none'; }
async function xuLyTaoLich() {
    const tieuDe = document.getElementById('lich-tieu-de').value.trim();
    const ngay = document.getElementById('lich-ngay').value;
    let bd = document.getElementById('lich-gio-bat-dau').value;
    let kt = document.getElementById('lich-gio-ket-thuc').value;
    if(!tieuDe || !ngay || !bd || !kt) { showToast('Nhập thiếu thông tin!', 'error'); return; }
    bd = bd.length === 4 ? '0'+bd : bd; kt = kt.length === 4 ? '0'+kt : kt;
    const payload = { tieu_de: tieuDe, thoi_gian_bat_dau: `${ngay}T${bd}:00`, thoi_gian_ket_thuc: `${ngay}T${kt}:00`, dia_diem: document.getElementById('lich-dia-diem').value, noi_dung: document.getElementById('lich-noi-dung').value };
    try { await apiCall(`/nhom/${maNhom}/lich-hop`, { method: 'POST', body: JSON.stringify(payload) }); showToast('Tạo lịch thành công!', 'success'); closeModalTaoLich(); loadDanhSachLichHop(); } catch (err) { showToast('Lỗi!', 'error'); }
}

// ĐÃ CẬP NHẬT CUSTOM CONFIRM CHO XÓA LỊCH HỌP
async function xoaLichHop(id) {
    showCustomConfirm('Bạn có chắc chắn muốn xóa lịch họp này?', async () => {
        try {
            await apiCall(`/nhom/${maNhom}/lich-hop/${id}`, { method: 'DELETE' });
            showToast('Đã xóa lịch họp!', 'success');
            loadDanhSachLichHop();
        } catch (err) {
            showToast('Lỗi khi xóa lịch họp!', 'error');
        }
    });
}

// DEADLINE
async function loadDanhSachDeadline() {
    const list = document.getElementById('list-deadline');
    list.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Đang tải...</p>';
    try {
        const data = await apiCall(`/nhom/${maNhom}/deadline`, { method: 'GET' });
        if (data.length === 0) { list.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Chưa có deadline nào.</p>'; return; }
        list.innerHTML = data.map(dl => {
            let timeStr = dl.han_chot ? new Date(dl.han_chot).toLocaleString('vi-VN') : "—";
            const isDone = dl.trang_thai === 'da_xong';
            const btnXoa = isTruongNhom ? `<button class="btn btn-secondary btn-sm" style="color:#EF4444; border-color:#EF4444;" onclick="xoaDeadline(${dl.ma_deadline})">Xóa</button>` : '';
            return `<div class="task-item ${isDone ? 'done' : ''}"><div><div class="task-title" style="${isDone ? 'text-decoration: line-through;' : ''}">${dl.tieu_de}</div><div class="task-time">${timeStr}</div>${dl.mo_ta ? `<div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">${dl.mo_ta}</div>` : ''}</div><div style="display: flex; gap: 8px;"><button class="btn ${isDone ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="doiTrangThaiDL(${dl.ma_deadline})">${isDone ? 'Hoàn tác' : 'Đã xong'}</button>${btnXoa}</div></div>`;
        }).join('');
    } catch (err) { list.innerHTML = '<p style="color: red; text-align: center;">Lỗi tải deadline!</p>'; }
}
function moModalTaoDeadline() { document.getElementById('modal-tao-deadline').style.display = 'flex'; }
function closeModalTaoDeadline() { document.getElementById('modal-tao-deadline').style.display = 'none'; }
async function xuLyTaoDeadline() {
    const tieuDe = document.getElementById('dl-tieu-de').value.trim();
    const ngay = document.getElementById('dl-ngay').value;
    let gio = document.getElementById('dl-gio').value;
    const moTa = document.getElementById('dl-mo-ta').value.trim();
    if(!tieuDe || !ngay || !gio) { showToast('Nhập thiếu thông tin!', 'error'); return; }
    gio = gio.length === 4 ? '0'+gio : gio;
    const payload = { tieu_de: tieuDe, han_chot: `${ngay}T${gio}:00`, mo_ta: moTa };
    try { await apiCall(`/nhom/${maNhom}/deadline`, { method: 'POST', body: JSON.stringify(payload) }); showToast('Tạo Deadline thành công!', 'success'); closeModalTaoDeadline(); loadDanhSachDeadline(); } catch (err) { showToast('Lỗi!', 'error'); }
}
async function doiTrangThaiDL(id) {
    await apiCall(`/nhom/${maNhom}/deadline/${id}/trang-thai`, { method: 'PUT' });
    loadDanhSachDeadline();
}

// ĐÃ CẬP NHẬT CUSTOM CONFIRM CHO XÓA DEADLINE
async function xoaDeadline(id) {
    showCustomConfirm('Bạn có chắc chắn muốn xóa deadline này?', async () => {
        try {
            await apiCall(`/nhom/${maNhom}/deadline/${id}`, { method: 'DELETE' });
            showToast('Đã xóa deadline!', 'success');
            loadDanhSachDeadline();
        } catch (err) {
            showToast('Lỗi khi xóa deadline!', 'error');
        }
    });
}

// ============================================
// LỊCH RẢNH CHUNG CỦA NHÓM
// ============================================
async function loadLichRanhChung() {
    const grid = document.getElementById('grid-lich-ranh');
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Đang tải...</p>';
    
    try {
        const data = await apiCall(`/nhom/${maNhom}/lich-ranh-chung`, { method: 'GET' });
        
        if (data.tong_thanh_vien === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Chưa có dữ liệu.</p>';
            return;
        }

        // Tạo Header (Thứ 2 -> CN)
        let html = '<div></div>'; // Ô trống góc trên trái
        ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].forEach(thu => {
            html += `<div style="font-weight: 600; color: var(--text-secondary); font-size: 13px;">${thu}</div>`;
        });

        // Tạo các hàng (Sáng, Chiều, Tối)
        const caMap = ['Sáng', 'Chiều', 'Tối'];
        for (let ca = 0; ca < 3; ca++) {
            html += `<div style="font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; font-size: 13px;">${caMap[ca]}</div>`;
            
            for (let thu = 0; thu < 7; thu++) {
                const bitIndex = thu * 3 + ca;
                const so_nguoi_ranh = data.mang_lich[bitIndex];
                
                // Tính màu sắc dựa trên tỷ lệ người rảnh
                let bg = 'var(--bg-hover)'; // Mặc định (Xám)
                let textColor = 'var(--text-muted)';
                
                if (so_nguoi_ranh > 0) {
                    if (so_nguoi_ranh === data.tong_thanh_vien) {
                        bg = '#22c55e'; // Xanh lá đậm: Tất cả cùng rảnh
                        textColor = 'white';
                    } else {
                        bg = 'rgba(34, 197, 94, 0.3)'; // Xanh lá nhạt: Có người rảnh
                        textColor = '#22c55e';
                    }
                }

                html += `
                    <div style="background: ${bg}; color: ${textColor}; border-radius: 4px; padding: 8px 4px; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center;" title="${so_nguoi_ranh}/${data.tong_thanh_vien} người rảnh">
                        ${so_nguoi_ranh}/${data.tong_thanh_vien}
                    </div>
                `;
            }
        }
        grid.innerHTML = html;
    } catch (err) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #EF4444;">Lỗi tải lịch rảnh!</p>';
    }
}

// ============================================
// XEM HỒ SƠ THÀNH VIÊN TỪ CHAT
// ============================================
async function xemHoSoChat(maTaiKhoan) {
    const container = document.getElementById('noi-dung-ho-so-chat');
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Đang tải hồ sơ...</p>';
    document.getElementById('modal-xem-ho-so-chat').style.display = 'flex';

    try {
        const data = await apiCall(`/sinh-vien/${maTaiKhoan}/ho-so-cong-khai`, { method: 'GET' });
        
        const avatarUrl = data.anh_dai_dien || `https://api.dicebear.com/7.x/adventurer/svg?seed=${data.ho_ten}`;
        
        let kyNangHtml = data.ky_nang.length > 0 
            ? data.ky_nang.map(k => `<span style="background: var(--pastel-sage-bg); color: var(--pastel-sage-text); padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">${k}</span>`).join(' ')
            : '<span style="color: var(--text-muted); font-style: italic;">Chưa cập nhật</span>';

        let soThichHtml = data.so_thich.length > 0 
            ? data.so_thich.map(s => `<span style="background: var(--pastel-honey-bg); color: var(--pastel-honey-text); padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">${s}</span>`).join(' ')
            : '<span style="color: var(--text-muted); font-style: italic;">Chưa cập nhật</span>';

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

            <div style="margin-bottom: 20px;">
                <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600;">Kỹ năng:</p>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">${kyNangHtml}</div>
            </div>

            <div>
                <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600;">Sở thích:</p>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">${soThichHtml}</div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = '<p style="color: #EF4444; text-align: center;">Lỗi tải hồ sơ!</p>';
    }
}

function dongModalXemHoSoChat() {
    document.getElementById('modal-xem-ho-so-chat').style.display = 'none';
}