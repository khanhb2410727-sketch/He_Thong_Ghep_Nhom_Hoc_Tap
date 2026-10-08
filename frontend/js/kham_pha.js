// ===== TRANG KHÁM PHÁ =====

document.addEventListener('DOMContentLoaded', () => {
    loadGroups();
    
    document.getElementById('btn-tim-kiem').addEventListener('click', () => {
        loadGroups();
    });
    
    document.getElementById('filter-linh-vuc').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loadGroups();
    });
    
    // Đóng sách khi ấn ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeBook();
    });
});

async function loadGroups() {
    const groupList = document.getElementById('group-list');
    const emptyState = document.getElementById('empty-state');
    const resultsCount = document.getElementById('results-count');
    
    groupList.innerHTML = '<p style="text-align: center; padding: 40px; color: #9A8570; grid-column: 1 / -1;">⏳ Đang tải...</p>';
    
    const filters = {
        maLoaiNhom: document.getElementById('filter-loai-nhom').value,
        maMonHoc: document.getElementById('filter-mon-hoc').value,
        tenLinhVuc: document.getElementById('filter-linh-vuc').value.trim()
    };
    
    try {
        const data = await apiCall('/nhom/tim-kiem', {
            method: 'POST',
            body: JSON.stringify(filters)
        });
        
        let groups = data.danhSach || [];
        
        if (USE_MOCK) {
            groups = MOCK_GROUPS.filter(g => {
                if (filters.maLoaiNhom && g.maLoaiNhom !== filters.maLoaiNhom) return false;
                if (filters.tenLinhVuc && !g.tenLinhVuc?.toLowerCase().includes(filters.tenLinhVuc.toLowerCase())) return false;
                return true;
            });
        }
        
        if (groups.length === 0) {
            groupList.innerHTML = '';
            emptyState.style.display = 'block';
            resultsCount.textContent = '0 nhóm';
        } else {
            emptyState.style.display = 'none';
            groupList.innerHTML = groups.map(g => renderGroupCard(g)).join('');
            resultsCount.textContent = `${groups.length} nhóm`;
        }
    } catch (err) {
        console.error(err);
        groupList.innerHTML = '<p style="color: #B85045; text-align: center; grid-column: 1 / -1;">❌ Lỗi tải dữ liệu</p>';
    }
}

function renderGroupCard(group) {
    const score = group.diemTuongThich || 0;
    const scorePercent = formatScore(score);
    const scoreColor = getScoreColor(score);
    const badgeColor = getBadgeColor(group.maLoaiNhom);
    
    return `
        <div class="group-card" onclick="openBook(${group.maNhom})">
            <div class="group-book-icon">
                <span class="book-icon-anim">📖</span>
            </div>
            
            <div class="group-card-header">
                <h3 class="group-title">${group.tenNhom}</h3>
                <div class="group-type">${group.tenLoai}</div>
            </div>
            
            <p class="group-desc">${group.moTa || 'Chưa có mô tả'}</p>
            
            <div class="group-meta">
                ${group.tenMonHoc ? `<span class="group-meta-item">📚 ${group.tenMonHoc}</span>` : ''}
                ${group.tenLinhVuc ? `<span class="badge badge-${badgeColor}">${group.tenLinhVuc}</span>` : ''}
                ${group.tenDeTai ? `<span class="group-meta-item">💡 ${group.tenDeTai}</span>` : ''}
                <span class="group-meta-item">👥 ${group.soThanhVienHienTai}/${group.soThanhVienToiDa}</span>
            </div>
            
            <div class="match-score">
                <div class="match-score-value" style="color: ${scoreColor};">
                    ${scorePercent}
                </div>
                <div class="match-score-label">Độ tương thích</div>
                <div class="match-score-bar">
                    <div class="match-score-fill" 
                         style="width: ${scorePercent}; background: ${scoreColor};"></div>
                </div>
            </div>
            
            <div class="group-actions">
                <button class="btn btn-secondary btn-sm" 
                        onclick="event.stopPropagation(); xemChiTiet(${group.maNhom})">
                    Chi tiết
                </button>
                <button class="btn btn-primary btn-sm" 
                        onclick="event.stopPropagation(); guiYeuCau(${group.maNhom})">
                    📩 Xin vào
                </button>
            </div>
        </div>
    `;
}

function xemChiTiet(maNhom) {
    openBook(maNhom);
}

function guiYeuCau(maNhom) {
    const group = MOCK_GROUPS.find(g => g.maNhom === maNhom);
    if (!group) return;
    
    const loiNhan = prompt(`Gửi yêu cầu vào nhóm "${group.tenNhom}"\n\nLời nhắn (tùy chọn):`);
    if (loiNhan === null) return;
    
    alert(`✅ Đã gửi yêu cầu vào nhóm "${group.tenNhom}"\nLời nhắn: ${loiNhan || '(không có)'}`);
}

// ============================================
// HIỆU ỨNG MỞ SÁCH
// ============================================

let nhomDangMo = null;

function openBook(maNhom) {
    const group = MOCK_GROUPS.find(g => g.maNhom === maNhom);
    if (!group) return;
    
    nhomDangMo = group;
    
    document.getElementById('book-title').textContent = group.tenNhom;
    document.getElementById('book-type').textContent = group.tenLoai;
    document.getElementById('book-desc').textContent = group.moTa || 'Chưa có mô tả';
    document.getElementById('book-mon-hoc').textContent = group.tenMonHoc || '—';
    document.getElementById('book-de-tai').textContent = group.tenDeTai || '—';
    document.getElementById('book-member-count').textContent = 
        `${group.soThanhVienHienTai}/${group.soThanhVienToiDa}`;
    
    const members = [
        { name: group.nguoiTao, role: 'Trưởng nhóm', avatar: '👨‍🎓' },
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
    
    const score = group.diemTuongThich || 0;
    const scorePercent = Math.round(score * 100);
    document.getElementById('book-score').textContent = `${scorePercent}%`;
    
    const fill = document.getElementById('book-score-fill');
    fill.style.width = '0%';
    setTimeout(() => {
        fill.style.width = `${scorePercent}%`;
    }, 400);
    
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

function guiYeuCauTuBook() {
    if (!nhomDangMo) return;
    
    const loiNhan = prompt('Lời nhắn gửi đến nhóm (tùy chọn):');
    if (loiNhan === null) return;
    
    alert(`✅ Đã gửi yêu cầu vào nhóm "${nhomDangMo.tenNhom}"`);
    closeBook();
}