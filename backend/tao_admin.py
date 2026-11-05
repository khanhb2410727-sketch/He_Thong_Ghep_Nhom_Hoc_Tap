# Tài khoản 1: admin1@studygroup.com - Pass: admin123

# Tài khoản 2: admin2@studygroup.com - Pass: admin123

# Tài khoản 3: admin3@studygroup.com - Pass: admin123

from database import SessionLocal
import models
from auth import hash_password

db = SessionLocal()

# Mật khẩu chung cho các acc admin test
mat_khau_hash = hash_password("admin123")

print("Bắt đầu tạo tài khoản Admin...")

for i in range(1, 4): # Tạo 3 tài khoản
    email = f"admin{i}@studygroup.com"
    
    # Kiểm tra xem đã tồn tại chưa để tránh lỗi
    if db.query(models.TaiKhoan).filter(models.TaiKhoan.email == email).first():
        print(f"Tài khoản {email} đã tồn tại, bỏ qua.")
        continue
        
    # Tạo tài khoản
    tk = models.TaiKhoan(
        email=email,
        mat_khau_hash=mat_khau_hash,
        loai_tai_khoan="admin", # Cấp quyền admin
        trang_thai="hoat_dong"
    )
    db.add(tk)
    db.commit()
    db.refresh(tk)
    
    # Tạo hồ sơ sinh viên (vì hệ thống có thể yêu cầu)
    sv = models.SinhVien(
        ma_tai_khoan=tk.ma_tai_khoan,
        mssv=f"ADMIN{i:03d}",
        ho_ten=f"Quản trị viên {i}"
    )
    db.add(sv)
    db.commit()
    
    print(f"Đã tạo: {email} | Mật khẩu: admin123")

print("Hoàn tất!")
db.close()