let danhSachNhom = [];
let nhomDangDanhGia = null;
let diemDanhGia = { 'thai-do': 0, 'dong-gop': 0, 'giao-tiep': 0, 'dung-han': 0 };

document.addEventListener('DOMContentLoaded', async () => {
    if (!localStorage.getItem('token')) { window.location.href = 'dang-nhap.html'; return; }
    await loadDanhSachNhom();
    setupStarRating();
    setupCharCount();
});

async function loadDanhSachNhom() {
    const selector = document.getElementById('chon-nhom');
    const emptyState = document.getElementById('empty-state-page');
    const listContainer = document.getElementById('list-nhom-danh-gia');
    
    try {
        const data = await apiCall('/nhom/cua-toi', { method: 'GET' });
        danhSachNhom = data.danhSach || [];
        
        // CHỈ LẤY NHỮNG NHÓM ĐÃ GIẢI TÁN
        const nhomDaKetThuc = danhSachNhom.filter(n => n.trangThai === 'da_giai_tan');
        
        if (nhomDaKetThuc.length === 0) {
            selector.innerHTML = '<option value="">-- Chưa có nhóm nào kết thúc --</option>';
            if (emptyState) emptyState.style.display = 'block';
            listContainer.innerHTML = '';
            return;
        }

        selector.innerHTML = '<option value="">-- Chọn nhóm để đánh giá --</option>' + 
            nhomDaKetThuc.map(n => `<option value="${n.maNhom}">${n.tenNhom}</option>`).join('');
            
    } catch (err) {
        console.error(err);
        selector.innerHTML = '<option value="">Lỗi tải danh sách nhóm</option>';
    }
}

async function doiNhom() {
    const maNhom = parseInt(document.getElementById('chon-nhom').value);
    const list = document.getElementById('list-nhom-danh-gia');
    const emptyState = document.getElementById('empty-state-page');
    
    if (!maNhom) {
        list.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    list.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--text-muted);">Đang tải thành viên...</p>';
    if (emptyState) emptyState.style.display = 'none';

    try {
        const data = await apiCall(`/nhom/${maNhom}/thanh-vien-danh-gia`, { method: 'GET' });
        const nhom = danhSachNhom.find(n => n.maNhom === maNhom);
        const danhSachTV = data.danhSach || [];

        if (danhSachTV.length === 0) {
            list.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--text-muted);">Nhóm không có thành viên nào khác.</p>';
            return;
        }

        const soDaDanhGia = danhSachTV.filter(tv => tv.daDanhGia).length;
        const tongThanhVien = danhSachTV.length;
        const phanTram = Math.round((soDaDanhGia / tongThanhVien) * 100);

        list.innerHTML = `
            <div class="nhom-danh-gia" style="background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-xl); padding: 24px;">
                <div style="margin-bottom: 24px;">
                    <h2 style="font-size: 20px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">${nhom.tenNhom}</h2>
                    <div style="font-size: 14px; color: var(--text-secondary);">Môn: ${nhom.tenMonHoc || '—'} | Trạng thái: Đã kết thúc</div>
                </div>
                
                <div style="margin-bottom: 24px; background: var(--bg-main); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; font-weight: 500;">
                        <span>Tiến độ đánh giá của bạn</span>
                        <span>${soDaDanhGia}/${tongThanhVien} thành viên</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: var(--bg-hover); border-radius: 4px; overflow: hidden;">
                        <div style="width: ${phanTram}%; height: 100%; background: var(--primary); transition: width 0.3s;"></div>
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${danhSachTV.map(tv => `
                        <div style="background: var(--bg-main); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 16px; display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--bg-hover); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold;">${tv.hoTen.split(' ').pop().charAt(0)}</div>
                                <div>
                                    <div style="font-weight: 600; color: var(--text-primary); font-size: 16px;">${tv.hoTen}</div>
                                    <div style="font-size: 13px; color: var(--text-secondary);">${tv.vaiTro}</div>
                                </div>
                            </div>
                            ${tv.daDanhGia 
                                ? `<span style="color: var(--secondary); font-weight: 600; font-size: 14px; padding: 8px 12px; background: rgba(16, 185, 129, 0.1); border-radius: var(--radius-md);">Đã đánh giá</span>`
                                : `<button class="btn btn-primary btn-sm" onclick="openModal(${maNhom}, ${tv.maTaiKhoan}, '${tv.hoTen}')">Đánh giá ngay</button>`
                            }
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (err) {
        console.error(err);
        list.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">Lỗi tải dữ liệu thành viên!</p>';
    }
}

function openModal(maNhom, maTaiKhoan, hoTen) {
    nhomDangDanhGia = maNhom;
    document.getElementById('modal-ten-nguoi-duoc-dg').textContent = `Đánh giá: ${hoTen}`;
    
    diemDanhGia = { 'thai-do': 0, 'dong-gop': 0, 'giao-tiep': 0, 'dung-han': 0 };
    document.querySelectorAll('.star').forEach(s => { s.classList.remove('active'); s.style.color = ''; });
    document.getElementById('nhan-xet').value = '';
    document.getElementById('char-count').textContent = '0';
    
    document.getElementById('modal-danh-gia').setAttribute('data-ma-tai-khoan', maTaiKhoan);
    document.getElementById('modal-danh-gia').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modal-danh-gia').style.display = 'none';
    document.body.style.overflow = '';
}

function setupStarRating() {
    document.querySelectorAll('.star-rating').forEach(rating => {
        const tieuChi = rating.dataset.tieuChi;
        const stars = rating.querySelectorAll('.star');
        
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const value = parseInt(star.dataset.value);
                diemDanhGia[tieuChi] = value;
                stars.forEach((s, index) => {
                    if (index < value) { s.classList.add('active'); s.style.color = 'var(--secondary)'; }
                    else { s.classList.remove('active'); s.style.color = ''; }
                });
            });
            star.addEventListener('mouseenter', () => {
                const value = parseInt(star.dataset.value);
                stars.forEach((s, index) => s.style.color = index < value ? 'var(--secondary)' : '');
            });
        });
        rating.addEventListener('mouseleave', () => {
            stars.forEach((s, index) => {
                const value = parseInt(s.dataset.value);
                s.style.color = (diemDanhGia[tieuChi] >= value) ? 'var(--secondary)' : '';
            });
        });
    });
}

function setupCharCount() {
    const textarea = document.getElementById('nhan-xet');
    if (!textarea) return;
    textarea.addEventListener('input', () => {
        document.getElementById('char-count').textContent = textarea.value.length;
    });
}

async function submitDanhGia() {
    const maNguoiDuocDanhGia = parseInt(document.getElementById('modal-danh-gia').getAttribute('data-ma-tai-khoan'));
    
    if (Object.values(diemDanhGia).includes(0)) {
        showToast('Vui lòng đánh giá đầy đủ tất cả các tiêu chí (1-5 sao)!', 'error');
        return;
    }

    const payload = {
        maNhom: nhomDangDanhGia,
        maNguoiDuocDanhGia: maNguoiDuocDanhGia,
        diemThaiDo: diemDanhGia['thai-do'],
        diemDongGop: diemDanhGia['dong-gop'],
        diemGiaoTiep: diemDanhGia['giao-tiep'],
        diemDungHan: diemDanhGia['dung-han'],
        nhanXet: document.getElementById('nhan-xet').value.trim()
    };

    const btn = document.querySelector('#modal-danh-gia .btn-primary');
    btn.textContent = 'Đang gửi...'; btn.disabled = true;

    try {
        const data = await apiCall('/danh-gia', { method: 'POST', body: JSON.stringify(payload) });
        if (data.error) {
            showToast(data.error, 'error');
        } else {
            showToast('Gửi đánh giá thành công!', 'success');
            closeModal();
            doiNhom(); 
        }
    } catch (err) {
        showToast(err.message || 'Lỗi khi gửi đánh giá!', 'error');
    } finally {
        btn.textContent = 'Gửi đánh giá'; btn.disabled = false;
    }
}