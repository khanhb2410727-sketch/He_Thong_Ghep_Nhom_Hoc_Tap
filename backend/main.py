import os
import shutil
import uuid
from sqlalchemy import Column, Integer, String, Text, Float, Date, DateTime, ForeignKey, func
from datetime import datetime
from typing import Optional, List, Dict

from fastapi import FastAPI, Depends, Header, HTTPException, File, UploadFile, WebSocket, WebSocketDisconnect, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel
from jose import jwt, JWTError

from database import get_db
import models
from auth import hash_password, verify_password, create_access_token, SECRET_KEY, ALGORITHM

import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import timedelta

app = FastAPI(title="API Hệ Thống Ghép Nhóm")
from fastapi import Request
from fastapi.responses import JSONResponse

# ==========================================
# BẢO VỆ CỔNG (MIDDLEWARE CHẶN ADMIN GỌI API SINH VIÊN)
# ==========================================
@app.middleware("http")
async def chan_admin_vao_trang_sinh_vien(request: Request, call_next):
    path = request.url.path
    
    # Danh sách các API CHỈ DÀNH CHO SINH VIÊN (Admin không được phép gọi)
    student_only_paths = [
        "/api/nhom",         # Tạo nhóm, duyệt thành viên, chat...
        "/api/bai-dang",     # Đăng tuyển, ứng tuyển
        "/api/danh-gia",     # Đánh giá thành viên
        "/api/ho-tro",       # Gửi yêu cầu hỗ trợ
        "/api/bao-cao",      # Gửi báo cáo
        "/api/khieu-nai-diem" # Gửi khiếu nại
    ]
    
    # Bỏ qua nếu không phải là API sinh viên
    if not any(path.startswith(p) for p in student_only_paths):
        return await call_next(request)

    # Lấy Token từ Header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            ma_tai_khoan = int(payload.get("sub"))
            
            # Truy vấn Database để xem ai đang gọi
            db = next(get_db())
            user = db.query(models.TaiKhoan).filter(models.TaiKhoan.ma_tai_khoan == ma_tai_khoan).first()
            
            # NẾU LÀ ADMIN -> CHẶN LẠI
            if user and user.loai_tai_khoan == 'admin':
                return JSONResponse(
                    status_code=403, 
                    content={"detail": "Quản trị viên không được phép thực hiện chức năng của Sinh viên!"}
                )
        except Exception:
            pass # Nếu token lỗi, cứ để các API bên dưới tự xử lý

    return await call_next(request)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "): raise HTTPException(status_code=401, detail="Chưa đăng nhập")
    try:
        payload = jwt.decode(authorization.split(" ")[1], SECRET_KEY, algorithms=[ALGORITHM])
        user = db.query(models.TaiKhoan).filter(models.TaiKhoan.ma_tai_khoan == int(payload.get("sub"))).first()
        if not user: raise HTTPException(status_code=401, detail="Tài khoản không tồn tại")
        return user
    except JWTError: raise HTTPException(status_code=401, detail="Token không hợp lệ")

# THÊM HÀM NÀY VÀO NGAY DƯỚI HÀM get_current_user
def get_current_admin(authorization: str = Header(None), db: Session = Depends(get_db)):
    user = get_current_user(authorization, db)
    if user.loai_tai_khoan != 'admin':
        raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập!")
    return user

# ==========================================
# THUẬT TOÁN TÍNH ĐIỂM TƯƠNG THÍCH
# ==========================================
def tinh_diem_tuong_thich(db: Session, sinh_vien: models.SinhVien, nhom: models.NhomHoc, bai_dang: models.BaiDangTuyen):
    thanh_viens = db.query(models.SinhVien.lich_ranh_bit).join(
        models.ThanhVienNhom, models.SinhVien.ma_tai_khoan == models.ThanhVienNhom.ma_tai_khoan
    ).filter(models.ThanhVienNhom.ma_nhom == nhom.ma_nhom).all()
    
    lich_chung = [0] * 21
    if thanh_viens:
        for tv in thanh_viens:
            lich_str = tv.lich_ranh_bit or "000000000000000000000"
            for i in range(21):
                if lich_str[i] == '1': lich_chung[i] += 1
        so_nguoi_can = max(1, len(thanh_viens) // 2)
        lich_chung_bit = "".join(['1' if x >= so_nguoi_can else '0' for x in lich_chung])
    else: lich_chung_bit = "000000000000000000000"

    sv_lich = sinh_vien.lich_ranh_bit or "000000000000000000000"
    giao = sum(1 for i in range(21) if sv_lich[i] == '1' and lich_chung_bit[i] == '1')
    hop = sum(1 for i in range(21) if sv_lich[i] == '1' or lich_chung_bit[i] == '1')
    diem_lich = (giao / hop) if hop > 0 else 0.5

    diem_ky_nang = 1.0 
    if bai_dang.yeu_cau_ky_nang:
        try:
            ds_kn_yeu_cau = [int(k) for k in bai_dang.yeu_cau_ky_nang.split(",") if k.isdigit()]
            if ds_kn_yeu_cau:
                sv_kns = db.query(models.KyNangSinhVien.ma_ky_nang).filter(models.KyNangSinhVien.ma_tai_khoan == sinh_vien.ma_tai_khoan).all()
                sv_kn_ids = [k.ma_ky_nang for k in sv_kns]
                match = sum(1 for k in ds_kn_yeu_cau if k in sv_kn_ids)
                diem_ky_nang = match / len(ds_kn_yeu_cau)
        except: pass

    diem_gpa = 1.0
    if bai_dang.yeu_cau_gpa and bai_dang.yeu_cau_gpa > 0:
        sv_gpa = sinh_vien.gpa or 0.0
        diem_gpa = min(1.0, sv_gpa / bai_dang.yeu_cau_gpa)
    diem_hoc_van = (diem_gpa * 0.7) + (0.8 * 0.3) 

    diem_uy_tin = (sinh_vien.diem_uy_tin or 5.0) / 5.0

    diem_so_thich = 1.0
    if bai_dang.yeu_cau_so_thich:
        try:
            ds_tag_yeu_cau = [int(x) for x in bai_dang.yeu_cau_so_thich.split(",") if x.isdigit()]
            if ds_tag_yeu_cau:
                sv_tags = db.query(models.SoThichSinhVien.ma_so_thich).filter(models.SoThichSinhVien.ma_tai_khoan == sinh_vien.ma_tai_khoan).all()
                sv_tag_ids = [t.ma_so_thich for t in sv_tags]
                match_tag = sum(1 for t in ds_tag_yeu_cau if t in sv_tag_ids)
                diem_so_thich = match_tag / len(ds_tag_yeu_cau)
        except: pass

    tong_diem = (0.40 * diem_lich) + (0.25 * diem_ky_nang) + (0.15 * diem_hoc_van) + (0.10 * diem_uy_tin) + (0.10 * diem_so_thich)
    return round(tong_diem, 2)

# ==========================================
# SCHEMA DỮ LIỆU
# ==========================================
class DangKyRequest(BaseModel):
    email: str
    mat_khau: str
    ho_ten: str
    mssv: Optional[str] = None
    ma_sinh_vien: Optional[str] = None

class DangNhapRequest(BaseModel):
    email: str
    mat_khau: str

class CapNhatHoSoRequest(BaseModel):
    chuyen_nganh: str = ""
    lop_sinh_hoat: str = ""
    mo_ta_ban_than: str = ""
    nien_khoa: int = 0
    gpa: float = 0.0
    muc_tieu_hoc_tap: str = ""

class TaoNhomRequest(BaseModel):
    ten_nhom: str
    ma_mon_hoc: int
    linh_vuc: str = ""
    mo_ta: str
    mo_ta_de_tai: str = ""
    muc_tieu: str = ""
    hinh_thuc_hoat_dong: str
    dia_diem_co_dinh: str
    so_thanh_vien_toi_da: int = 5

# ==========================================
# API DANH MỤC
# ==========================================
@app.get("/api/mon-hoc")
def lay_mon_hoc(authorization: str = Header(None), db: Session = Depends(get_db)):
    user_major = "Tất cả"
    if authorization and authorization.startswith("Bearer "):
        try:
            token = authorization.split(" ")[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            ma_tai_khoan = int(payload.get("sub"))
            sv = db.query(models.SinhVien).filter(models.SinhVien.ma_tai_khoan == ma_tai_khoan).first()
            if sv and sv.chuyen_nganh: user_major = sv.chuyen_nganh
        except: pass

    mon_hocs = db.query(models.MonHoc).filter(
        (models.MonHoc.nganh_ap_dung == "Tất cả") | (models.MonHoc.nganh_ap_dung == user_major)
    ).all()

    return [{"ma_mon_hoc": m.ma_mon_hoc, "ma_mon": m.ma_mon, "ten_mon_hoc": m.ten_mon_hoc, "nhom_mon_hoc": m.nhom_mon_hoc} for m in mon_hocs]

@app.get("/api/danh-muc/ky-nang")
def lay_ky_nang(db: Session = Depends(get_db)):
    return db.query(models.KyNang).all()

@app.get("/api/danh-muc/so-thich")
def lay_so_thich(db: Session = Depends(get_db)):
    return db.query(models.SoThich).all()

@app.get("/api/danh-muc/bang-cap")
def lay_danh_muc_bang_cap(db: Session = Depends(get_db)): 
    return db.query(models.LoaiBangCap).all()

# ==========================================
# API ĐĂNG NHẬP / ĐĂNG KÝ / HỒ SƠ
# ==========================================
@app.post("/api/dang-ky")
def dang_ky(req: DangKyRequest, db: Session = Depends(get_db)):
    if db.query(models.TaiKhoan).filter(models.TaiKhoan.email == req.email).first(): 
        return {"error": "Email này đã được sử dụng!"}
    
    final_mssv = req.mssv if req.mssv else req.ma_sinh_vien
    if db.query(models.SinhVien).filter(models.SinhVien.mssv == final_mssv).first():
        return {"error": "Mã số sinh viên này đã được đăng ký bởi tài khoản khác!"}
    
    new_tk = models.TaiKhoan(
        email=req.email, 
        mat_khau_hash=hash_password(req.mat_khau), 
        loai_tai_khoan="sinh_vien", 
        trang_thai="hoat_dong"
    )
    db.add(new_tk)
    db.commit()
    db.refresh(new_tk)
    
    db.add(models.SinhVien(
        ma_tai_khoan=new_tk.ma_tai_khoan, 
        mssv=final_mssv, 
        ho_ten=req.ho_ten
    ))
    db.commit()
    return {"message": "Đăng ký thành công!"}

@app.post("/api/dang-nhap")
def dang_nhap(req: DangNhapRequest, db: Session = Depends(get_db)):
    tk = db.query(models.TaiKhoan).filter(models.TaiKhoan.email == req.email).first()
    if not tk or not verify_password(req.mat_khau, tk.mat_khau_hash): 
        return {"error": "Sai email hoặc mật khẩu!"}
    
    if tk.trang_thai == 'bi_khoa':
        return {"error": "Tài khoản của bạn đã bị khóa do vi phạm tiêu chuẩn cộng đồng!"}
        
    token = create_access_token(data={"sub": str(tk.ma_tai_khoan), "email": tk.email})
    sv = db.query(models.SinhVien).filter(models.SinhVien.ma_tai_khoan == tk.ma_tai_khoan).first()
    
    return {
        "message": "Đăng nhập thành công!", "access_token": token, 
        "user": {
            "ma_tai_khoan": tk.ma_tai_khoan, 
            "ho_ten": sv.ho_ten if sv else "Sinh viên", 
            "anh_dai_dien": sv.anh_dai_dien if sv else "",
            "loai_tai_khoan": tk.loai_tai_khoan # <--- DÒNG QUAN TRỌNG NHẤT BẮT BUỘC PHẢI CÓ
        }
    }

# ==========================================
# API ĐỔI MẬT KHẨU
# ==========================================
class DoiMatKhauRequest(BaseModel):
    mat_khau_cu: str
    mat_khau_moi: str

@app.post("/api/tai-khoan/doi-mat-khau")
def doi_mat_khau(req: DoiMatKhauRequest, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Kiểm tra mật khẩu cũ có đúng không
    if not verify_password(req.mat_khau_cu, current_user.mat_khau_hash):
        return {"error": "Mật khẩu hiện tại không đúng!"}
    
    # 2. Kiểm tra mật khẩu mới
    if len(req.mat_khau_moi) < 6:
        return {"error": "Mật khẩu mới phải có ít nhất 6 ký tự!"}
        
    if req.mat_khau_cu == req.mat_khau_moi:
        return {"error": "Mật khẩu mới không được trùng với mật khẩu cũ!"}

    # 3. Cập nhật mật khẩu mới
    current_user.mat_khau_hash = hash_password(req.mat_khau_moi)
    db.commit()
    
    return {"message": "Đổi mật khẩu thành công!"}

@app.get("/api/sinh-vien/ho-so")
def lay_ho_so(current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    sv = db.query(models.SinhVien).filter(models.SinhVien.ma_tai_khoan == current_user.ma_tai_khoan).first()
    if not sv: raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ")
    
    # TỰ ĐỘNG TÍNH LẠI ĐIỂM UY TÍN TỪ BẢNG ĐÁNH GIÁ (Luôn chính xác 100%)
    diem_tb = db.query(func.avg(models.DanhGia.diem_trung_binh)).filter(
        models.DanhGia.nguoi_duoc_danh_gia == current_user.ma_tai_khoan
    ).scalar()
    
    # Nếu có đánh giá thì lấy điểm trung bình, nếu chưa có thì mặc định 5.0
    diem_uy_tin_thuc_te = round(diem_tb, 2) if diem_tb is not None else 5.0

    return {
        "ho_ten": sv.ho_ten, "email": current_user.email, "anh_dai_dien": sv.anh_dai_dien or "",
        "mssv": sv.mssv, "chuyen_nganh": sv.chuyen_nganh or "", "lop_sinh_hoat": sv.lop_sinh_hoat or "",
        "mo_ta_ban_than": sv.mo_ta_ban_than or "", "lich_ranh_bit": sv.lich_ranh_bit or "000000000000000000000",
        "nien_khoa": sv.nien_khoa or 0, "gpa": sv.gpa or 0.0, "muc_tieu_hoc_tap": sv.muc_tieu_hoc_tap or "",
        "diem_uy_tin": diem_uy_tin_thuc_te # <--- TRẢ VỀ ĐIỂM ĐÃ TÍNH TOÁN
    }

@app.put("/api/sinh-vien/ho-so")
def cap_nhat_ho_so(req: CapNhatHoSoRequest, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    sv = db.query(models.SinhVien).filter(models.SinhVien.ma_tai_khoan == current_user.ma_tai_khoan).first()
    if not sv: raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ")
    sv.chuyen_nganh = req.chuyen_nganh; sv.lop_sinh_hoat = req.lop_sinh_hoat
    sv.mo_ta_ban_than = req.mo_ta_ban_than; sv.nien_khoa = req.nien_khoa
    sv.gpa = req.gpa; sv.muc_tieu_hoc_tap = req.muc_tieu_hoc_tap
    db.commit(); return {"message": "Cập nhật hồ sơ thành công!"}

@app.post("/api/tai-khoan/avatar")
def upload_avatar(file: UploadFile = File(...), current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    file_name = f"{uuid.uuid4().hex}.{file.filename.split('.')[-1]}"
    with open(f"uploads/{file_name}", "wb") as buffer: shutil.copyfileobj(file.file, buffer)
    url = f"http://localhost:8000/uploads/{file_name}"
    sv = db.query(models.SinhVien).filter(models.SinhVien.ma_tai_khoan == current_user.ma_tai_khoan).first()
    sv.anh_dai_dien = url; db.commit(); return {"message": "Cập nhật ảnh thành công!", "avatar_url": url}

@app.get("/api/lich-ranh")
def lay_lich_ranh(current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    sv = db.query(models.SinhVien).filter(models.SinhVien.ma_tai_khoan == current_user.ma_tai_khoan).first()
    return {"lich_ranh_bit": sv.lich_ranh_bit or "000000000000000000000"}

@app.put("/api/lich-ranh")
def cap_nhat_lich_ranh(req: dict, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    sv = db.query(models.SinhVien).filter(models.SinhVien.ma_tai_khoan == current_user.ma_tai_khoan).first()
    sv.lich_ranh_bit = req.get("lich_ranh_bit"); sv.cap_nhat_lich_cuoi = datetime.now(); db.commit(); return {"message": "OK"}

@app.get("/api/sinh-vien/ky-nang")
def get_sv_ky_nang(current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    res = db.query(models.KyNangSinhVien.ma_ky_nang).filter(models.KyNangSinhVien.ma_tai_khoan == current_user.ma_tai_khoan).all()
    return {"danhSach": [r.ma_ky_nang for r in res]}

@app.post("/api/sinh-vien/ky-nang")
def luu_sv_ky_nang(req: dict, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(models.KyNangSinhVien).filter(models.KyNangSinhVien.ma_tai_khoan == current_user.ma_tai_khoan).delete()
    for ma in req.get("danh_sach_ma", []): db.add(models.KyNangSinhVien(ma_tai_khoan=current_user.ma_tai_khoan, ma_ky_nang=ma, trinh_do='co_ban'))
    db.commit(); return {"message": "Lưu kỹ năng thành công!"}

@app.get("/api/sinh-vien/so-thich")
def get_sv_so_thich(current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    res = db.query(models.SoThichSinhVien.ma_so_thich).filter(models.SoThichSinhVien.ma_tai_khoan == current_user.ma_tai_khoan).all()
    return {"danhSach": [r.ma_so_thich for r in res]}

@app.post("/api/sinh-vien/so-thich")
def luu_sv_so_thich(req: dict, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(models.SoThichSinhVien).filter(models.SoThichSinhVien.ma_tai_khoan == current_user.ma_tai_khoan).delete()
    for ma in req.get("danh_sach_ma", []): db.add(models.SoThichSinhVien(ma_tai_khoan=current_user.ma_tai_khoan, ma_so_thich=ma))
    db.commit(); return {"message": "Lưu sở thích thành công!"}

@app.get("/api/sinh-vien/bang-cap")
def lay_bang_cap(current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    ket_qua = db.query(models.BangCapSinhVien, models.LoaiBangCap).join(models.LoaiBangCap, models.LoaiBangCap.ma_loai_bang_cap == models.BangCapSinhVien.ma_loai_bang_cap).filter(models.BangCapSinhVien.ma_tai_khoan == current_user.ma_tai_khoan).all()
    return {"danhSach": [{"ten_bang_cap": loai_bc.ten_bang_cap, "loai": loai_bc.loai, "diem_so": bc_sv.diem_so, "ngay_cap": str(bc_sv.ngay_cap)} for bc_sv, loai_bc in ket_qua]}

@app.post("/api/sinh-vien/bang-cap")
def them_bang_cap(req: dict, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    ngay_cap = datetime.strptime(req.get("ngay_cap"), "%Y-%m-%d").date() if req.get("ngay_cap") else None
    db.add(models.BangCapSinhVien(ma_tai_khoan=current_user.ma_tai_khoan, ma_loai_bang_cap=req.get("ma_loai_bang_cap"), diem_so=req.get("diem_so"), ngay_cap=ngay_cap))
    db.commit(); return {"message": "Thêm bằng cấp thành công!"}

# ==========================================
# API NHÓM HỌC & BÀI ĐĂNG
# ==========================================
@app.post("/api/nhom/tao-moi")
def tao_nhom_moi(req: TaoNhomRequest, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    mon_hoc = db.query(models.MonHoc).filter(models.MonHoc.ma_mon_hoc == req.ma_mon_hoc).first()
    new_nhom = models.NhomHoc(
        ten_nhom=req.ten_nhom, mo_ta=req.mo_ta, ma_mon_hoc=req.ma_mon_hoc, ten_mon_hoc=mon_hoc.ten_mon_hoc if mon_hoc else "",
        linh_vuc=req.linh_vuc, mo_ta_de_tai=req.mo_ta_de_tai, muc_tieu=req.muc_tieu,
        hinh_thuc_hoat_dong=req.hinh_thuc_hoat_dong, dia_diem_co_dinh=req.dia_diem_co_dinh,
        so_thanh_vien_toi_da=req.so_thanh_vien_toi_da, nguoi_tao=current_user.ma_tai_khoan,
        trang_thai='hoat_dong', so_thanh_vien_hien_tai=1, ngay_tao=datetime.now()
    )
    db.add(new_nhom); db.commit(); db.refresh(new_nhom)
    db.add(models.ThanhVienNhom(ma_nhom=new_nhom.ma_nhom, ma_tai_khoan=current_user.ma_tai_khoan, vai_tro='truong_nhom', ngay_tham_gia=datetime.now(), trang_thai='hoat_dong'))
    db.commit(); return {"message": "Tạo nhóm thành công!"}

@app.post("/api/nhom/{ma_nhom}/tao-bai-dang")
def tao_bai_dang(ma_nhom: int, req: dict, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    bai_dang_hien_tai = db.query(models.BaiDangTuyen).filter(
        models.BaiDangTuyen.ma_nhom == ma_nhom,
        models.BaiDangTuyen.trang_thai == 'dang_mo'
    ).first()
    
    if bai_dang_hien_tai:
        return {"error": "Nhóm này đã có một bài đăng tuyển đang mở. Vui lòng đóng bài cũ trước khi tạo bài mới!"}

    nhom = db.query(models.NhomHoc).filter(models.NhomHoc.ma_nhom == ma_nhom).first()
    han_chot_date = datetime.strptime(req.get("han_chot"), "%Y-%m-%d").date() if req.get("han_chot") else None
    
    new_bd = models.BaiDangTuyen(
        ma_nhom=ma_nhom, nguoi_dang=current_user.ma_tai_khoan,
        tieu_de=f"Tìm thành viên nhóm {nhom.ten_mon_hoc or nhom.ten_nhom}", mo_ta=nhom.mo_ta,
        so_luong_can_tuyen=req.get("so_luong_can_tuyen", 1), trang_thai="dang_mo", ngay_tao=datetime.now(),
        han_chot=han_chot_date,
        yeu_cau_cung=req.get("yeu_cau_cung", ""), yeu_cau_mem=req.get("yeu_cau_mem", ""),
        yeu_cau_gpa=req.get("yeu_cau_gpa", 0.0), yeu_cau_ky_nang=req.get("yeu_cau_ky_nang", ""), yeu_cau_so_thich=req.get("yeu_cau_so_thich", "")
    )
    db.add(new_bd); db.commit(); return {"message": "Đăng tuyển thành công!"}

class CapNhatNhomRequest(BaseModel):
    ten_nhom: str
    mo_ta: str
    hinh_thuc_hoat_dong: str
    dia_diem_co_dinh: str
    so_thanh_vien_toi_da: int

@app.put("/api/nhom/{ma_nhom}/cap-nhat")
def cap_nhat_nhom(ma_nhom: int, req: CapNhatNhomRequest, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Kiểm tra quyền trưởng nhóm
    check_quyen = db.query(models.ThanhVienNhom).filter(
        models.ThanhVienNhom.ma_nhom == ma_nhom, 
        models.ThanhVienNhom.ma_tai_khoan == current_user.ma_tai_khoan, 
        models.ThanhVienNhom.vai_tro == 'truong_nhom'
    ).first()
    if not check_quyen: 
        raise HTTPException(status_code=403, detail="Bạn không phải trưởng nhóm!")

    nhom = db.query(models.NhomHoc).filter(models.NhomHoc.ma_nhom == ma_nhom).first()
    if not nhom: return {"error": "Nhóm không tồn tại!"}

    # 2. Kiểm tra sĩ số mới không được nhỏ hơn sĩ số hiện tại
    if req.so_thanh_vien_toi_da < nhom.so_thanh_vien_hien_tai:
        return {"error": f"Sĩ số tối đa không được nhỏ hơn số lượng thành viên hiện tại ({nhom.so_thanh_vien_hien_tai} người)!"}

    # 3. Cập nhật
    nhom.ten_nhom = req.ten_nhom
    nhom.mo_ta = req.mo_ta
    nhom.hinh_thuc_hoat_dong = req.hinh_thuc_hoat_dong
    nhom.dia_diem_co_dinh = req.dia_diem_co_dinh
    nhom.so_thanh_vien_toi_da = req.so_thanh_vien_toi_da
    
    # Cập nhật lại tiêu đề bài đăng tuyển (nếu có) để đồng bộ tên mới
    db.query(models.BaiDangTuyen).filter(
        models.BaiDangTuyen.ma_nhom == ma_nhom, 
        models.BaiDangTuyen.trang_thai == 'dang_mo'
    ).update({"tieu_de": f"Tìm thành viên nhóm {nhom.ten_mon_hoc or nhom.ten_nhom}"})

    db.commit()
    return {"message": "Cập nhật thông tin nhóm thành công!"}

@app.get("/api/bai-dang")
def lay_danh_sach_bai_dang(authorization: str = Header(None), db: Session = Depends(get_db)):
    # TỰ ĐỘNG ĐÓNG CÁC BÀI ĐĂNG QUÁ HẠN CHÓT
    hom_nay = datetime.now()
    db.query(models.BaiDangTuyen).filter(
        models.BaiDangTuyen.trang_thai == 'dang_mo',
        models.BaiDangTuyen.han_chot != None,
        models.BaiDangTuyen.han_chot < hom_nay
    ).update({"trang_thai": "da_dong"})
    db.commit()

    sinh_vien = None
    if authorization and authorization.startswith("Bearer "):
        try:
            payload = jwt.decode(authorization.split(" ")[1], SECRET_KEY, algorithms=[ALGORITHM])
            sinh_vien = db.query(models.SinhVien).filter(models.SinhVien.ma_tai_khoan == int(payload.get("sub"))).first()
        except: pass

    bai_dangs = db.query(models.BaiDangTuyen, models.NhomHoc).join(models.NhomHoc, models.BaiDangTuyen.ma_nhom == models.NhomHoc.ma_nhom).filter(models.BaiDangTuyen.trang_thai == 'dang_mo', models.NhomHoc.trang_thai != 'da_giai_tan').all()
    
    ket_qua = []
    for bd, nhom in bai_dangs:
        diem = tinh_diem_tuong_thich(db, sinh_vien, nhom, bd) if sinh_vien else 0.5
        ket_qua.append({
            "maBaiDang": bd.ma_bai_dang, "maNhom": bd.ma_nhom, "tenNhom": nhom.ten_nhom,
            "tieuDe": bd.tieu_de, "moTaBaiDang": bd.mo_ta, "soLuongCanTuyen": bd.so_luong_can_tuyen,
            "hinhThuc": nhom.hinh_thuc_hoat_dong, "diaDiem": nhom.dia_diem_co_dinh,
            "soThanhVienHienTai": nhom.so_thanh_vien_hien_tai, "soThanhVienToiDa": nhom.so_thanh_vien_toi_da,
            "tenMonHoc": nhom.ten_mon_hoc, "linhVuc": nhom.linh_vuc,
            "yeuCauCung": bd.yeu_cau_cung, "yeuCauMem": bd.yeu_cau_mem,
            "yeuCauGpa": bd.yeu_cau_gpa, "yeuCauKyNang": bd.yeu_cau_ky_nang, 
            "diemTuongThich": diem, "ngayTao": str(bd.ngay_tao)
        })
    return {"danhSach": ket_qua}

@app.post("/api/bai-dang/{ma_bai_dang}/ung-tuyen")
def ung_tuyen(ma_bai_dang: int, req: dict, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    bd = db.query(models.BaiDangTuyen).filter(models.BaiDangTuyen.ma_bai_dang == ma_bai_dang).first()
    if not bd: return {"error": "Bài đăng không tồn tại!"}
    
    nhom = db.query(models.NhomHoc).filter(models.NhomHoc.ma_nhom == bd.ma_nhom).first()
    
    # KIỂM TRA XEM NHÓM ĐÃ ĐẦY CHƯA
    if nhom.so_thanh_vien_hien_tai >= nhom.so_thanh_vien_toi_da:
        return {"error": "Nhóm này đã đủ thành viên, không thể ứng tuyển!"}

    # Kiểm tra xem user đã ứng tuyển bài này chưa (tránh spam)
    da_ung_tuyen = db.query(models.YeuCauThamGia).filter(
        models.YeuCauThamGia.ma_bai_dang == ma_bai_dang,
        models.YeuCauThamGia.nguoi_ung_tuyen == current_user.ma_tai_khoan,
        models.YeuCauThamGia.trang_thai == 'cho_duyet'
    ).first()
    if da_ung_tuyen:
        return {"error": "Bạn đã gửi yêu cầu ứng tuyển cho nhóm này rồi!"}

    db.add(models.YeuCauThamGia(ma_bai_dang=ma_bai_dang, ma_nhom=bd.ma_nhom, nguoi_ung_tuyen=current_user.ma_tai_khoan, loi_nhan=req.get("loi_nhan", ""), trang_thai="cho_duyet", ngay_tao=datetime.now()))
    db.commit()
    return {"message": "Gửi ứng tuyển thành công!"}

@app.get("/api/nhom/cua-toi")
def lay_nhom_cua_toi(current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    ket_qua = db.query(models.ThanhVienNhom, models.NhomHoc).join(
        models.NhomHoc, models.ThanhVienNhom.ma_nhom == models.NhomHoc.ma_nhom
    ).filter(models.ThanhVienNhom.ma_tai_khoan == current_user.ma_tai_khoan).all()
    
    return {"danhSach": [{
        "maNhom": nhom.ma_nhom, "tenNhom": nhom.ten_nhom, "moTa": nhom.mo_ta, 
        "soThanhVienHienTai": nhom.so_thanh_vien_hien_tai, "soThanhVienToiDa": nhom.so_thanh_vien_toi_da, 
        "trangThai": nhom.trang_thai, "vaiTro": tv.vai_tro, "tenMonHoc": nhom.ten_mon_hoc
    } for tv, nhom in ket_qua]}

@app.get("/api/nhom/yeu-cau-gui-di")
def lay_yeu_cau_gui_di(current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    ket_qua = db.query(models.YeuCauThamGia, models.NhomHoc).join(models.NhomHoc, models.YeuCauThamGia.ma_nhom == models.NhomHoc.ma_nhom).filter(models.YeuCauThamGia.nguoi_ung_tuyen == current_user.ma_tai_khoan).order_by(models.YeuCauThamGia.ngay_tao.desc()).all()
    return {"danhSach": [{"maYeuCau": yc.ma_yeu_cau, "maNhom": nhom.ma_nhom, "tenNhom": nhom.ten_nhom, "moTa": nhom.mo_ta, "soThanhVienHienTai": nhom.so_thanh_vien_hien_tai, "soThanhVienToiDa": nhom.so_thanh_vien_toi_da, "trangThai": yc.trang_thai, "tenMonHoc": nhom.ten_mon_hoc, "ngayTao": str(yc.ngay_tao)} for yc, nhom in ket_qua]}

@app.get("/api/nhom/{ma_nhom}/chi-tiet")
def lay_chi_tiet_nhom(ma_nhom: int, db: Session = Depends(get_db)):
    nhom = db.query(models.NhomHoc).filter(models.NhomHoc.ma_nhom == ma_nhom).first()
    return {
        "maNhom": nhom.ma_nhom, "tenNhom": nhom.ten_nhom, "moTa": nhom.mo_ta, "tenMonHoc": nhom.ten_mon_hoc, 
        "linhVuc": nhom.linh_vuc, "soThanhVienHienTai": nhom.so_thanh_vien_hien_tai, "soThanhVienToiDa": nhom.so_thanh_vien_toi_da, 
        "hinhThucHoatDong": nhom.hinh_thuc_hoat_dong, "diaDiemCoDinh": nhom.dia_diem_co_dinh, "trangThai": nhom.trang_thai,
        "nguoiTao": nhom.nguoi_tao # ĐÃ THÊM NGUOI_TAO
    }

@app.get("/api/nhom/{ma_nhom}/thanh-vien")
def lay_thanh_vien(ma_nhom: int, db: Session = Depends(get_db)):
    ket_qua = db.query(models.ThanhVienNhom, models.SinhVien).join(
        models.SinhVien, models.ThanhVienNhom.ma_tai_khoan == models.SinhVien.ma_tai_khoan
    ).filter(models.ThanhVienNhom.ma_nhom == ma_nhom).all()
    
    return {"danhSach": [{
        "maTaiKhoan": tv.ma_tai_khoan, "hoTen": sv.ho_ten, "vaiTro": tv.vai_tro, 
        "ngayThamGia": str(tv.ngay_tham_gia), "anh_dai_dien": sv.anh_dai_dien or ""
    } for tv, sv in ket_qua]}

@app.get("/api/sinh-vien/{ma_tai_khoan}/ho-so-cong-khai")
def lay_ho_so_cong_khai(ma_tai_khoan: int, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    sv = db.query(models.SinhVien).filter(models.SinhVien.ma_tai_khoan == ma_tai_khoan).first()
    if not sv: raise HTTPException(status_code=404, detail="Không tìm thấy sinh viên")

    # Lấy danh sách kỹ năng
    kynangs = db.query(models.KyNang).join(models.KyNangSinhVien, models.KyNang.ma_ky_nang == models.KyNangSinhVien.ma_ky_nang).filter(models.KyNangSinhVien.ma_tai_khoan == ma_tai_khoan).all()
    ds_ky_nang = [k.ten_ky_nang for k in kynangs]

    # Lấy danh sách sở thích
    sothichs = db.query(models.SoThich).join(models.SoThichSinhVien, models.SoThich.ma_so_thich == models.SoThichSinhVien.ma_so_thich).filter(models.SoThichSinhVien.ma_tai_khoan == ma_tai_khoan).all()
    ds_so_thich = [s.ten_so_thich for s in sothichs]

    return {
        "ho_ten": sv.ho_ten,
        "mssv": sv.mssv,
        "chuyen_nganh": sv.chuyen_nganh or "Chưa cập nhật",
        "gpa": sv.gpa or 0.0,
        "diem_uy_tin": sv.diem_uy_tin or 5.0,
        "mo_ta_ban_than": sv.mo_ta_ban_than or "Chưa có mô tả bản thân.",
        "anh_dai_dien": sv.anh_dai_dien or "",
        "ky_nang": ds_ky_nang,
        "so_thich": ds_so_thich
    }

@app.get("/api/nhom/{ma_nhom}/yeu-cau-cho-duyet")
def lay_yeu_cau_cho_duyet(ma_nhom: int, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    ket_qua = db.query(models.YeuCauThamGia, models.SinhVien).join(models.SinhVien, models.YeuCauThamGia.nguoi_ung_tuyen == models.SinhVien.ma_tai_khoan).filter(models.YeuCauThamGia.ma_nhom == ma_nhom, models.YeuCauThamGia.trang_thai == 'cho_duyet').all()
    return {"danhSach": [{"maYeuCau": yc.ma_yeu_cau, "maTaiKhoan": sv.ma_tai_khoan, "hoTen": sv.ho_ten, "mssv": sv.mssv, "chuyenNganh": sv.chuyen_nganh or "Chưa cập nhật", "loiNhan": yc.loi_nhan or "", "ngayGui": str(yc.ngay_tao)} for yc, sv in ket_qua]}

@app.post("/api/nhom/yeu-cau/{ma_yeu_cau}/duyet")
def duyet_yeu_cau(ma_yeu_cau: int, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    yc = db.query(models.YeuCauThamGia).filter(models.YeuCauThamGia.ma_yeu_cau == ma_yeu_cau).first()
    nhom = db.query(models.NhomHoc).filter(models.NhomHoc.ma_nhom == yc.ma_nhom).first()
    
    yc.trang_thai = 'da_chap_nhan'; yc.nguoi_duyet = current_user.ma_tai_khoan
    db.add(models.ThanhVienNhom(ma_nhom=yc.ma_nhom, ma_tai_khoan=yc.nguoi_ung_tuyen, vai_tro='thanh_vien', trang_thai='hoat_dong', ngay_tham_gia=datetime.now()))
    nhom.so_thanh_vien_hien_tai += 1 
    
    # TỰ ĐỘNG ĐÓNG BÀI ĐĂNG TUYỂN NẾU NHÓM ĐÃ ĐỦ NGƯỜI
    if nhom.so_thanh_vien_hien_tai >= nhom.so_thanh_vien_toi_da:
        db.query(models.BaiDangTuyen).filter(
            models.BaiDangTuyen.ma_nhom == nhom.ma_nhom,
            models.BaiDangTuyen.trang_thai == 'dang_mo'
        ).update({"trang_thai": "da_dong"})
        
    db.commit()
    return {"message": "Đã duyệt!"}

@app.post("/api/nhom/yeu-cau/{ma_yeu_cau}/tu-choi")
def tu_choi_yeu_cau(ma_yeu_cau: int, req: dict, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    yc = db.query(models.YeuCauThamGia).filter(models.YeuCauThamGia.ma_yeu_cau == ma_yeu_cau).first()
    yc.trang_thai = 'da_tu_choi'; yc.nguoi_duyet = current_user.ma_tai_khoan; yc.ly_do_tu_choi = req.get("ly_do", "")
    db.commit(); return {"message": "Đã từ chối!"}

@app.post("/api/nhom/{ma_nhom}/them-thanh-vien")
def them_thanh_vien(ma_nhom: int, req: dict, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    check_quyen = db.query(models.ThanhVienNhom).filter(
        models.ThanhVienNhom.ma_nhom == ma_nhom, models.ThanhVienNhom.ma_tai_khoan == current_user.ma_tai_khoan, models.ThanhVienNhom.vai_tro == 'truong_nhom'
    ).first()
    if not check_quyen: raise HTTPException(status_code=403, detail="Bạn không phải trưởng nhóm!")
    
    mssv = req.get("mssv")
    if not mssv: return {"error": "Vui lòng nhập mã sinh viên!"}
    
    sv = db.query(models.SinhVien).filter(models.SinhVien.mssv == mssv).first()
    if not sv: return {"error": "Không tìm thấy sinh viên với mã này!"}
    
    existing = db.query(models.ThanhVienNhom).filter(models.ThanhVienNhom.ma_nhom == ma_nhom, models.ThanhVienNhom.ma_tai_khoan == sv.ma_tai_khoan).first()
    if existing: return {"error": "Sinh viên này đã ở trong nhóm!"}
    
    da_moi = db.query(models.YeuCauThamGia).filter(
        models.YeuCauThamGia.ma_nhom == ma_nhom, models.YeuCauThamGia.nguoi_ung_tuyen == sv.ma_tai_khoan, models.YeuCauThamGia.trang_thai == 'da_moi'
    ).first()
    if da_moi: return {"error": "Đã gửi lời mời cho sinh viên này rồi!"}
    
    new_loi_moi = models.YeuCauThamGia(
        ma_nhom=ma_nhom, nguoi_ung_tuyen=sv.ma_tai_khoan, loi_nhan=f"Trưởng nhóm đã mời bạn tham gia nhóm.",
        trang_thai='da_moi', ngay_tao=datetime.now(), nguoi_duyet=current_user.ma_tai_khoan
    )
    db.add(new_loi_moi); db.commit(); return {"message": f"Đã gửi lời mời đến {sv.ho_ten}!"}

@app.delete("/api/nhom/{ma_nhom}/thanh-vien/{ma_tai_khoan}")
def xoa_thanh_vien(ma_nhom: int, ma_tai_khoan: int, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    check_quyen = db.query(models.ThanhVienNhom).filter(
        models.ThanhVienNhom.ma_nhom == ma_nhom, models.ThanhVienNhom.ma_tai_khoan == current_user.ma_tai_khoan, models.ThanhVienNhom.vai_tro == 'truong_nhom'
    ).first()
    if not check_quyen: raise HTTPException(status_code=403, detail="Bạn không phải trưởng nhóm!")
    
    if ma_tai_khoan == current_user.ma_tai_khoan: return {"error": "Không thể tự xóa bản thân!"}
    
    tv = db.query(models.ThanhVienNhom).filter(models.ThanhVienNhom.ma_nhom == ma_nhom, models.ThanhVienNhom.ma_tai_khoan == ma_tai_khoan).first()
    if not tv: return {"error": "Thành viên không tồn tại trong nhóm!"}
    
    db.delete(tv)
    nhom = db.query(models.NhomHoc).filter(models.NhomHoc.ma_nhom == ma_nhom).first()
    if nhom.so_thanh_vien_hien_tai > 0: nhom.so_thanh_vien_hien_tai -= 1
    db.commit(); return {"message": "Đã xóa thành viên khỏi nhóm!"}

@app.delete("/api/nhom/{ma_nhom}/giai-tan")
def giai_tan_nhom(ma_nhom: int, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    check_quyen = db.query(models.ThanhVienNhom).filter(
        models.ThanhVienNhom.ma_nhom == ma_nhom, models.ThanhVienNhom.ma_tai_khoan == current_user.ma_tai_khoan, models.ThanhVienNhom.vai_tro == 'truong_nhom'
    ).first()
    if not check_quyen: raise HTTPException(status_code=403, detail="Bạn không phải trưởng nhóm!")
    
    nhom = db.query(models.NhomHoc).filter(models.NhomHoc.ma_nhom == ma_nhom).first()
    nhom.trang_thai = 'da_giai_tan'
    db.query(models.BaiDangTuyen).filter(models.BaiDangTuyen.ma_nhom == ma_nhom).update({"trang_thai": "da_dong"})
    db.commit(); return {"message": "Đã giải tán nhóm thành công!"}

@app.delete("/api/nhom/{ma_nhom}/roi-nhom")
def roi_nhom(ma_nhom: int, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Kiểm tra xem user có trong nhóm không
    tv = db.query(models.ThanhVienNhom).filter(
        models.ThanhVienNhom.ma_nhom == ma_nhom, 
        models.ThanhVienNhom.ma_tai_khoan == current_user.ma_tai_khoan
    ).first()
    
    if not tv:
        return {"error": "Bạn không ở trong nhóm này!"}

    nhom = db.query(models.NhomHoc).filter(models.NhomHoc.ma_nhom == ma_nhom).first()

    # 2. Xử lý logic nếu Trưởng nhóm rời đi
    if tv.vai_tro == 'truong_nhom':
        # Tìm thành viên khác để chuyển quyền (người tham gia sớm nhất)
        nguoi_ke_nhiem = db.query(models.ThanhVienNhom).filter(
            models.ThanhVienNhom.ma_nhom == ma_nhom,
            models.ThanhVienNhom.ma_tai_khoan != current_user.ma_tai_khoan
        ).order_by(models.ThanhVienNhom.ngay_tham_gia.asc()).first()

        if nguoi_ke_nhiem:
            # Chuyển quyền trưởng nhóm cho người kế nhiệm
            nguoi_ke_nhiem.vai_tro = 'truong_nhom'
            nhom.nguoi_tao = nguoi_ke_nhiem.ma_tai_khoan
        else:
            # Nếu không còn ai khác, giải tán nhóm luôn
            nhom.trang_thai = 'da_giai_tan'
            db.query(models.BaiDangTuyen).filter(models.BaiDangTuyen.ma_nhom == ma_nhom).update({"trang_thai": "da_dong"})

    # 3. Xóa thành viên khỏi nhóm và cập nhật sĩ số
    db.delete(tv)
    if nhom.so_thanh_vien_hien_tai > 0:
        nhom.so_thanh_vien_hien_tai -= 1
        
    db.commit()
    return {"message": "Đã rời nhóm thành công!"}

# ==========================================
# API ĐÁNH GIÁ
# ==========================================
@app.get("/api/nhom/{ma_nhom}/thanh-vien-danh-gia")
def lay_thanh_vien_danh_gia(ma_nhom: int, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    ket_qua = db.query(models.ThanhVienNhom, models.SinhVien).join(
        models.SinhVien, models.ThanhVienNhom.ma_tai_khoan == models.SinhVien.ma_tai_khoan
    ).filter(
        models.ThanhVienNhom.ma_nhom == ma_nhom, 
        models.ThanhVienNhom.ma_tai_khoan != current_user.ma_tai_khoan
    ).all()

    danh_sach = []
    for tv, sv in ket_qua:
        da_danh_gia = db.query(models.DanhGia).filter(
            models.DanhGia.ma_nhom == ma_nhom, 
            models.DanhGia.nguoi_danh_gia == current_user.ma_tai_khoan,
            models.DanhGia.nguoi_duoc_danh_gia == tv.ma_tai_khoan
        ).first() is not None

        danh_sach.append({
            "maTaiKhoan": tv.ma_tai_khoan, "hoTen": sv.ho_ten,
            "vaiTro": "Trưởng nhóm" if tv.vai_tro == 'truong_nhom' else "Thành viên",
            "daDanhGia": da_danh_gia
        })
    return {"danhSach": danh_sach}

@app.post("/api/danh-gia")
def gui_danh_gia(req: dict, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    ma_nhom = req.get("maNhom")
    nguoi_duoc_danh_gia = req.get("maNguoiDuocDanhGia")
    
    existing = db.query(models.DanhGia).filter(
        models.DanhGia.ma_nhom == ma_nhom, models.DanhGia.nguoi_danh_gia == current_user.ma_tai_khoan, models.DanhGia.nguoi_duoc_danh_gia == nguoi_duoc_danh_gia
    ).first()
    if existing: return {"error": "Bạn đã đánh giá thành viên này rồi!"}

    d_thai_do = req.get("diemThaiDo", 0)
    d_dong_gop = req.get("diemDongGop", 0)
    d_giao_tiep = req.get("diemGiaoTiep", 0)
    d_dung_han = req.get("diemDungHan", 0)
    diem_tb_lan_nay = (d_thai_do + d_dong_gop + d_giao_tiep + d_dung_han) / 4.0

    new_dg = models.DanhGia(
        ma_nhom=ma_nhom, nguoi_danh_gia=current_user.ma_tai_khoan, nguoi_duoc_danh_gia=nguoi_duoc_danh_gia,
        diem_thai_do=d_thai_do, diem_dong_gop=d_dong_gop, diem_giao_tiep=d_giao_tiep, diem_dung_han=d_dung_han,
        diem_trung_binh=diem_tb_lan_nay, nhan_xet=req.get("nhanXet", ""), ngay_danh_gia=datetime.now()
    )
    db.add(new_dg); db.commit()

    tat_ca_danh_gia = db.query(models.DanhGia).filter(models.DanhGia.nguoi_duoc_danh_gia == nguoi_duoc_danh_gia).all()
    if tat_ca_danh_gia:
        tong_diem = sum([dg.diem_trung_binh for dg in tat_ca_danh_gia])
        diem_uy_tin_moi = round(tong_diem / len(tat_ca_danh_gia), 2)
        sv = db.query(models.SinhVien).filter(models.SinhVien.ma_tai_khoan == nguoi_duoc_danh_gia).first()
        if sv:
            sv.diem_uy_tin = diem_uy_tin_moi
            db.commit()
    return {"message": "Gửi đánh giá thành công!"}

# ==========================================
# API & WEBSOCKET CHAT NHÓM
# ==========================================
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
    async def connect(self, websocket: WebSocket, ma_nhom: int):
        await websocket.accept()
        if ma_nhom not in self.active_connections: self.active_connections[ma_nhom] = []
        self.active_connections[ma_nhom].append(websocket)
    def disconnect(self, websocket: WebSocket, ma_nhom: int):
        if ma_nhom in self.active_connections and websocket in self.active_connections[ma_nhom]:
            self.active_connections[ma_nhom].remove(websocket)
    async def broadcast(self, message: dict, ma_nhom: int):
        if ma_nhom in self.active_connections:
            for connection in self.active_connections[ma_nhom]:
                await connection.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/chat/{ma_nhom}/{ma_tai_khoan}")
async def websocket_endpoint(websocket: WebSocket, ma_nhom: int, ma_tai_khoan: int, db: Session = Depends(get_db)):
    await manager.connect(websocket, ma_nhom)
    sv = db.query(models.SinhVien).filter(models.SinhVien.ma_tai_khoan == ma_tai_khoan).first()
    ten_nguoi_gui = sv.ho_ten if sv else "Sinh viên"
    avatar_nguoi_gui = sv.anh_dai_dien if sv and sv.anh_dai_dien else ""
    
    try:
        while True:
            data = await websocket.receive_text()
            new_msg = models.TinNhan(ma_nhom=ma_nhom, nguoi_gui=ma_tai_khoan, noi_dung=data)
            db.add(new_msg); db.commit(); db.refresh(new_msg)
            
            msg_data = {
                "ma_tin_nhan": new_msg.ma_tin_nhan, "ma_tai_khoan": ma_tai_khoan, "ten_nguoi_gui": ten_nguoi_gui,
                "anh_dai_dien": avatar_nguoi_gui, "noi_dung": data, "ngay_gui": new_msg.ngay_gui.strftime("%H:%M")
            }
            await manager.broadcast(msg_data, ma_nhom)
    except WebSocketDisconnect:
        manager.disconnect(websocket, ma_nhom)

@app.get("/api/nhom/{ma_nhom}/tin-nhan")
def lay_lich_su_tin_nhan(ma_nhom: int, db: Session = Depends(get_db)):
    ket_qua = db.query(models.TinNhan, models.SinhVien).join(
        models.SinhVien, models.TinNhan.nguoi_gui == models.SinhVien.ma_tai_khoan
    ).filter(models.TinNhan.ma_nhom == ma_nhom).order_by(models.TinNhan.ngay_gui.asc()).limit(50).all()

    return [{
        "ma_tin_nhan": tn.ma_tin_nhan, "ma_tai_khoan": tn.nguoi_gui, "ten_nguoi_gui": sv.ho_ten,
        "anh_dai_dien": sv.anh_dai_dien or "", "noi_dung": tn.noi_dung, "ngay_gui": tn.ngay_gui.strftime("%H:%M")
    } for tn, sv in ket_qua]

# ==========================================
# API QUẢN LÝ LỊCH HỌP NHÓM
# ==========================================
class TaoLichHopRequest(BaseModel):
    tieu_de: str
    thoi_gian_bat_dau: str
    thoi_gian_ket_thuc: str
    dia_diem: str = ""
    noi_dung: str = ""

@app.post("/api/nhom/{ma_nhom}/lich-hop")
def tao_lich_hop(ma_nhom: int, req: TaoLichHopRequest, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    check_quyen = db.query(models.ThanhVienNhom).filter(
        models.ThanhVienNhom.ma_nhom == ma_nhom, models.ThanhVienNhom.ma_tai_khoan == current_user.ma_tai_khoan, models.ThanhVienNhom.vai_tro == 'truong_nhom'
    ).first()
    if not check_quyen: raise HTTPException(status_code=403, detail="Chỉ trưởng nhóm mới có quyền tạo lịch họp!")

    try:
        start_time = datetime.fromisoformat(req.thoi_gian_bat_dau)
        end_time = datetime.fromisoformat(req.thoi_gian_ket_thuc)
        if end_time <= start_time: return {"error": "Thời gian kết thúc phải sau thời gian bắt đầu!"}
        new_lich = models.LichHop(
            ma_nhom=ma_nhom, tieu_de=req.tieu_de, thoi_gian_bat_dau=start_time, thoi_gian_ket_thuc=end_time,
            dia_diem=req.dia_diem, noi_dung=req.noi_dung, nguoi_tao=current_user.ma_tai_khoan
        )
        db.add(new_lich); db.commit(); db.refresh(new_lich)
        return {"message": "Tạo lịch họp thành công!", "ma_lich_hop": new_lich.ma_lich_hop}
    except ValueError:
        return {"error": "Định dạng thời gian không hợp lệ!"}

@app.get("/api/nhom/{ma_nhom}/lich-hop")
def lay_danh_sach_lich_hop(ma_nhom: int, db: Session = Depends(get_db)):
    try:
        ket_qua = db.query(models.LichHop, models.SinhVien).outerjoin(
            models.SinhVien, models.LichHop.nguoi_tao == models.SinhVien.ma_tai_khoan
        ).filter(models.LichHop.ma_nhom == ma_nhom).order_by(models.LichHop.thoi_gian_bat_dau.asc()).all()
        
        danh_sach = []
        for lh, sv in ket_qua:
            start_str = lh.thoi_gian_bat_dau.strftime("%Y-%m-%dT%H:%M:%S") if lh.thoi_gian_bat_dau else ""
            end_str = lh.thoi_gian_ket_thuc.strftime("%Y-%m-%dT%H:%M:%S") if lh.thoi_gian_ket_thuc else ""
            danh_sach.append({
                "ma_lich_hop": lh.ma_lich_hop, "tieu_de": lh.tieu_de, "thoi_gian_bat_dau": start_str, "thoi_gian_ket_thuc": end_str,
                "dia_diem": lh.dia_diem or "", "noi_dung": lh.noi_dung or "", "nguoi_tao": sv.ho_ten if sv else "Ẩn danh"
            })
        return danh_sach
    except Exception as e:
        print("LỖI API LỊCH HỌP:", str(e))
        raise HTTPException(status_code=500, detail="Lỗi server khi tải lịch họp")

@app.get("/api/nhom/{ma_nhom}/lich-ranh-chung")
def lay_lich_ranh_chung(ma_nhom: int, db: Session = Depends(get_db)):
    # 1. Lấy lịch rảnh của tất cả thành viên trong nhóm
    thanh_viens = db.query(models.SinhVien.lich_ranh_bit).join(
        models.ThanhVienNhom, models.SinhVien.ma_tai_khoan == models.ThanhVienNhom.ma_tai_khoan
    ).filter(models.ThanhVienNhom.ma_nhom == ma_nhom).all()

    if not thanh_viens:
        return {"tong_thanh_vien": 0, "mang_lich": []}

    # 2. Đếm xem ở mỗi ô (tổng cộng 21 ô) có bao nhiêu người rảnh
    mang_dem = [0] * 21
    for tv in thanh_viens:
        lich_str = tv.lich_ranh_bit or "000000000000000000000"
        for i in range(21):
            if lich_str[i] == '1':
                mang_dem[i] += 1

    return {
        "tong_thanh_vien": len(thanh_viens),
        "mang_lich": mang_dem # Trả về mảng ví dụ: [2, 0, 5, 1...] tương ứng 21 ô
    }

@app.delete("/api/nhom/{ma_nhom}/lich-hop/{ma_lich_hop}")
def xoa_lich_hop(ma_nhom: int, ma_lich_hop: int, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    check_quyen = db.query(models.ThanhVienNhom).filter(
        models.ThanhVienNhom.ma_nhom == ma_nhom, models.ThanhVienNhom.ma_tai_khoan == current_user.ma_tai_khoan, models.ThanhVienNhom.vai_tro == 'truong_nhom'
    ).first()
    if not check_quyen: raise HTTPException(status_code=403, detail="Chỉ trưởng nhóm mới có quyền xóa lịch họp!")

    lich = db.query(models.LichHop).filter(models.LichHop.ma_lich_hop == ma_lich_hop, models.LichHop.ma_nhom == ma_nhom).first()
    if not lich: return {"error": "Lịch họp không tồn tại!"}
    db.delete(lich); db.commit(); return {"message": "Đã xóa lịch họp thành công!"}

# ==========================================
# API DEADLINE (HẠN CHÓT)
# ==========================================
class TaoDeadlineRequest(BaseModel):
    tieu_de: str
    mo_ta: str = ""
    han_chot: str

@app.post("/api/nhom/{ma_nhom}/deadline")
def tao_deadline(ma_nhom: int, req: TaoDeadlineRequest, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    check_quyen = db.query(models.ThanhVienNhom).filter(
        models.ThanhVienNhom.ma_nhom == ma_nhom, models.ThanhVienNhom.ma_tai_khoan == current_user.ma_tai_khoan, models.ThanhVienNhom.vai_tro == 'truong_nhom'
    ).first()
    if not check_quyen: raise HTTPException(status_code=403, detail="Chỉ trưởng nhóm mới có quyền tạo deadline!")

    try:
        han_chot_dt = datetime.fromisoformat(req.han_chot)
        new_dl = models.Deadline(ma_nhom=ma_nhom, tieu_de=req.tieu_de, mo_ta=req.mo_ta, han_chot=han_chot_dt, nguoi_tao=current_user.ma_tai_khoan)
        db.add(new_dl); db.commit(); return {"message": "Tạo deadline thành công!"}
    except ValueError:
        return {"error": "Định dạng thời gian không hợp lệ!"}

@app.get("/api/nhom/{ma_nhom}/deadline")
def lay_danh_sach_deadline(ma_nhom: int, db: Session = Depends(get_db)):
    ket_qua = db.query(models.Deadline).filter(models.Deadline.ma_nhom == ma_nhom).order_by(models.Deadline.han_chot.asc()).all()
    return [{
        "ma_deadline": dl.ma_deadline, "tieu_de": dl.tieu_de, "mo_ta": dl.mo_ta or "",
        "han_chot": dl.han_chot.strftime("%Y-%m-%dT%H:%M:%S") if dl.han_chot else "", "trang_thai": dl.trang_thai
    } for dl in ket_qua]

@app.put("/api/nhom/{ma_nhom}/deadline/{ma_deadline}/trang-thai")
def doi_trang_thai_deadline(ma_nhom: int, ma_deadline: int, db: Session = Depends(get_db)):
    dl = db.query(models.Deadline).filter(models.Deadline.ma_deadline == ma_deadline, models.Deadline.ma_nhom == ma_nhom).first()
    if not dl: return {"error": "Không tìm thấy deadline!"}
    dl.trang_thai = 'da_xong' if dl.trang_thai == 'chua_xong' else 'chua_xong'
    db.commit(); return {"message": "Đã cập nhật trạng thái!", "trang_thai_moi": dl.trang_thai}

@app.delete("/api/nhom/{ma_nhom}/deadline/{ma_deadline}")
def xoa_deadline(ma_nhom: int, ma_deadline: int, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    check_quyen = db.query(models.ThanhVienNhom).filter(
        models.ThanhVienNhom.ma_nhom == ma_nhom, models.ThanhVienNhom.ma_tai_khoan == current_user.ma_tai_khoan, models.ThanhVienNhom.vai_tro == 'truong_nhom'
    ).first()
    if not check_quyen: raise HTTPException(status_code=403, detail="Chỉ trưởng nhóm mới có quyền xóa deadline!")

    dl = db.query(models.Deadline).filter(models.Deadline.ma_deadline == ma_deadline, models.Deadline.ma_nhom == ma_nhom).first()
    if not dl: return {"error": "Không tìm thấy deadline!"}
    db.delete(dl); db.commit(); return {"message": "Đã xóa deadline!"}

# ==========================================
# API LỜI MỜI & LỊCH SỬ NHÓM
# ==========================================
@app.get("/api/nhom/loi-moi-cua-toi")
def lay_loi_moi(current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    ket_qua = db.query(models.YeuCauThamGia, models.NhomHoc).join(
        models.NhomHoc, models.YeuCauThamGia.ma_nhom == models.NhomHoc.ma_nhom
    ).filter(
        models.YeuCauThamGia.nguoi_ung_tuyen == current_user.ma_tai_khoan, models.YeuCauThamGia.trang_thai == 'da_moi'
    ).all()
    
    return {"danhSach": [{
        "maYeuCau": yc.ma_yeu_cau, "maNhom": nhom.ma_nhom, "tenNhom": nhom.ten_nhom, 
        "moTa": nhom.mo_ta, "tenMonHoc": nhom.ten_mon_hoc,
        "nguoiMoi": db.query(models.SinhVien).filter(models.SinhVien.ma_tai_khoan == yc.nguoi_duyet).first().ho_ten if yc.nguoi_duyet else "Trưởng nhóm"
    } for yc, nhom in ket_qua]}

@app.post("/api/nhom/loi-moi/{ma_yeu_cau}/chap-nhan")
def chap_nhan_loi_moi(ma_yeu_cau: int, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    yc = db.query(models.YeuCauThamGia).filter(models.YeuCauThamGia.ma_yeu_cau == ma_yeu_cau).first()
    if not yc or yc.nguoi_ung_tuyen != current_user.ma_tai_khoan: return {"error": "Lời mời không hợp lệ!"}
    
    yc.trang_thai = 'da_chap_nhan'
    nhom = db.query(models.NhomHoc).filter(models.NhomHoc.ma_nhom == yc.ma_nhom).first()
    nhom.so_thanh_vien_hien_tai += 1
    db.add(models.ThanhVienNhom(ma_nhom=yc.ma_nhom, ma_tai_khoan=current_user.ma_tai_khoan, vai_tro='thanh_vien', trang_thai='hoat_dong', ngay_tham_gia=datetime.now()))
    db.commit(); return {"message": "Đã tham gia nhóm thành công!"}

@app.post("/api/nhom/loi-moi/{ma_yeu_cau}/tu-choi")
def tu_choi_loi_moi(ma_yeu_cau: int, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    yc = db.query(models.YeuCauThamGia).filter(models.YeuCauThamGia.ma_yeu_cau == ma_yeu_cau).first()
    if not yc or yc.nguoi_ung_tuyen != current_user.ma_tai_khoan: return {"error": "Lời mời không hợp lệ!"}
    yc.trang_thai = 'da_tu_choi'; db.commit(); return {"message": "Đã từ chối lời mời!"}

@app.get("/api/sinh-vien/lich-su-nhom")
def lay_lich_su_nhom(current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        ds_tham_gia = db.query(models.ThanhVienNhom, models.NhomHoc).join(
            models.NhomHoc, models.ThanhVienNhom.ma_nhom == models.NhomHoc.ma_nhom
        ).filter(models.ThanhVienNhom.ma_tai_khoan == current_user.ma_tai_khoan).all()

        ket_qua = []
        for tv, nhom in ds_tham_gia:
            diem_tb = db.query(func.avg(models.DanhGia.diem_trung_binh)).filter(
                models.DanhGia.ma_nhom == nhom.ma_nhom, models.DanhGia.nguoi_duoc_danh_gia == current_user.ma_tai_khoan
            ).scalar()

            ket_qua.append({
                "maNhom": nhom.ma_nhom, "tenNhom": nhom.ten_nhom, "tenMonHoc": nhom.ten_mon_hoc,
                "vaiTro": tv.vai_tro, "trangThai": nhom.trang_thai,
                "ngayThamGia": tv.ngay_tham_gia.strftime("%d/%m/%Y") if tv.ngay_tham_gia else "",
                "diemUyTin": round(diem_tb, 2) if diem_tb is not None else None
            })
        return {"danhSach": ket_qua}
    except Exception as e:
        print("LỖI API LỊCH SỬ NHÓM:", str(e))
        raise HTTPException(status_code=500, detail="Lỗi server khi tải lịch sử")

# ==========================================
# API QUẢN LÝ BÀI ĐĂNG (DÀNH CHO TRƯỞNG NHÓM)
# ==========================================
@app.get("/api/nhom/{ma_nhom}/bai-dang")
def lay_bai_dang_cua_nhom(ma_nhom: int, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    ket_qua = db.query(models.BaiDangTuyen).filter(
        models.BaiDangTuyen.ma_nhom == ma_nhom, models.BaiDangTuyen.trang_thai == 'dang_mo'
    ).all()
    return [{
        "maBaiDang": bd.ma_bai_dang, "tieuDe": bd.tieu_de, "soLuong": bd.so_luong_can_tuyen,
        "hanChot": str(bd.han_chot) if bd.han_chot else "Không có"
    } for bd in ket_qua]

@app.delete("/api/nhom/{ma_nhom}/bai-dang/{ma_bai_dang}")
def xoa_bai_dang(ma_nhom: int, ma_bai_dang: int, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    check_quyen = db.query(models.ThanhVienNhom).filter(
        models.ThanhVienNhom.ma_nhom == ma_nhom, models.ThanhVienNhom.ma_tai_khoan == current_user.ma_tai_khoan, models.ThanhVienNhom.vai_tro == 'truong_nhom'
    ).first()
    if not check_quyen: raise HTTPException(status_code=403, detail="Bạn không phải trưởng nhóm!")

    bd = db.query(models.BaiDangTuyen).filter(models.BaiDangTuyen.ma_bai_dang == ma_bai_dang, models.BaiDangTuyen.ma_nhom == ma_nhom).first()
    if not bd: return {"error": "Không tìm thấy bài đăng!"}
    db.delete(bd); db.commit(); return {"message": "Đã gỡ bài đăng thành công!"}

# ==========================================
# API QUÊN MẬT KHẨU (GỬI OTP QUA MAILTRAP)
# ==========================================
# CẤU HÌNH MAILTRAP CỦA BẠN
MAILTRAP_HOST = "sandbox.smtp.mailtrap.io"
MAILTRAP_PORT = 2525
MAILTRAP_USER = "00dcb807c4ad32" 
MAILTRAP_PASS = "f8c3dbb866394c"

class GuiOtpRequest(BaseModel):
    email: str

class XacThucOtpRequest(BaseModel):
    email: str
    otp: str
    mat_khau_moi: str

@app.post("/api/quen-mat-khau/gui-otp")
def gui_otp(req: GuiOtpRequest, db: Session = Depends(get_db)):
    tk = db.query(models.TaiKhoan).filter(models.TaiKhoan.email == req.email).first()
    if not tk:
        return {"error": "Email này không tồn tại trong hệ thống!"}

    # 1. Tạo mã OTP 6 số và thời gian hết hạn (5 phút)
    otp = str(random.randint(100000, 999999))
    tk.otp_code = otp
    tk.otp_expiry = datetime.now() + timedelta(minutes=5)
    db.commit()

    # IN MÃ OTP RA TERMINAL ĐỂ PHÒNG HỜ DEMO
    print(f"\n=========================================")
    print(f"MÃ OTP CỦA {req.email} LÀ: {otp}")
    print(f"=========================================\n")

    # 2. Gửi Email qua Mailtrap
    try:
        msg = MIMEMultipart()
        msg['From'] = "StudyGroup <no-reply@studygroup.com>"
        msg['To'] = req.email
        msg['Subject'] = "Mã OTP Khôi Phục Mật Khẩu - StudyGroup"
        
        body = f"Xin chào,\n\nMã OTP để đặt lại mật khẩu của bạn là: {otp}\nMã này sẽ hết hạn sau 5 phút."
        msg.attach(MIMEText(body, 'plain', 'utf-8'))

        server = smtplib.SMTP(MAILTRAP_HOST, MAILTRAP_PORT)
        server.starttls()
        server.login(MAILTRAP_USER, MAILTRAP_PASS)
        server.send_message(msg)
        server.quit()
        
        return {"message": "Mã OTP đã được gửi!"}
    except Exception as e:
        print("Lỗi gửi email:", str(e))
        return {"error": "Lỗi hệ thống không thể gửi email!"}

@app.post("/api/quen-mat-khau/xac-thuc-otp")
def xac_thuc_otp(req: XacThucOtpRequest, db: Session = Depends(get_db)):
    tk = db.query(models.TaiKhoan).filter(models.TaiKhoan.email == req.email).first()
    if not tk or not tk.otp_code:
        return {"error": "Yêu cầu không hợp lệ!"}

    # 1. Kiểm tra mã OTP
    if tk.otp_code != req.otp:
        return {"error": "Mã OTP không chính xác!"}

    # 2. Kiểm tra thời gian hết hạn
    if tk.otp_expiry < datetime.now():
        return {"error": "Mã OTP đã hết hạn. Vui lòng lấy mã mới!"}

    # 3. Đổi mật khẩu và xóa OTP
    if len(req.mat_khau_moi) < 6:
        return {"error": "Mật khẩu mới phải có ít nhất 6 ký tự!"}

    tk.mat_khau_hash = hash_password(req.mat_khau_moi)
    tk.otp_code = None # Xóa mã OTP sau khi dùng
    tk.otp_expiry = None
    db.commit()

    return {"message": "Đổi mật khẩu thành công! Vui lòng đăng nhập lại."}

@app.get("/api/thong-bao")
def lay_thong_bao(current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    thong_bao_list = []

    # 1. Lấy thông báo người khác ứng tuyển vào nhóm mình (Dành cho Trưởng nhóm)
    ds_nhom_lam_truong = db.query(models.ThanhVienNhom.ma_nhom).filter(
        models.ThanhVienNhom.ma_tai_khoan == current_user.ma_tai_khoan,
        models.ThanhVienNhom.vai_tro == 'truong_nhom'
    ).all()
    ma_nhoms = [n.ma_nhom for n in ds_nhom_lam_truong]
    
    if ma_nhoms:
        ds_ung_tuyen = db.query(models.YeuCauThamGia, models.SinhVien, models.NhomHoc).join(
            models.SinhVien, models.YeuCauThamGia.nguoi_ung_tuyen == models.SinhVien.ma_tai_khoan
        ).join(
            models.NhomHoc, models.YeuCauThamGia.ma_nhom == models.NhomHoc.ma_nhom
        ).filter(
            models.YeuCauThamGia.ma_nhom.in_(ma_nhoms),
            models.YeuCauThamGia.trang_thai == 'cho_duyet'
        ).order_by(models.YeuCauThamGia.ngay_tao.desc()).all()

        for yc, sv, nhom in ds_ung_tuyen:
            thong_bao_list.append({
                "loai": "ung_tuyen",
                "noi_dung": f"<strong>{sv.ho_ten}</strong> đã xin vào nhóm <strong>{nhom.ten_nhom}</strong>",
                "thoi_gian": yc.ngay_tao.strftime("%H:%M - %d/%m"),
                "link": "nhom-cua-ban.html" # Link để chuyển hướng
            })

    # 2. Lấy thông báo lời mời vào nhóm (Dành cho Thành viên)
    ds_loi_moi = db.query(models.YeuCauThamGia, models.NhomHoc).join(
        models.NhomHoc, models.YeuCauThamGia.ma_nhom == models.NhomHoc.ma_nhom
    ).filter(
        models.YeuCauThamGia.nguoi_ung_tuyen == current_user.ma_tai_khoan,
        models.YeuCauThamGia.trang_thai == 'da_moi'
    ).order_by(models.YeuCauThamGia.ngay_tao.desc()).all()

    for yc, nhom in ds_loi_moi:
        thong_bao_list.append({
            "loai": "loi_moi",
            "noi_dung": f"Nhóm <strong>{nhom.ten_nhom}</strong> đã mời bạn tham gia",
            "thoi_gian": yc.ngay_tao.strftime("%H:%M - %d/%m"),
            "link": "nhom-cua-ban.html"
        })

    # Sắp xếp lại toàn bộ (nếu cần)
    return {
        "tong_cong": len(thong_bao_list),
        "danhSach": thong_bao_list[:5] # Chỉ lấy 5 thông báo mới nhất hiển thị lên menu
    }

    # ==========================================
# API BÁO CÁO VI PHẠM & HỖ TRỢ KỸ THUẬT
# ==========================================
class BaoCaoRequest(BaseModel):
    loai_doi_tuong: str # 'nhom', 'bai_dang', 'tai_khoan'
    ma_doi_tuong: int
    ly_do: str
    bang_chung: str = ""

class HoTroRequest(BaseModel):
    tieu_de: str
    noi_dung: str

class XuLyBaoCaoRequest(BaseModel):
    trang_thai: str
    hinh_phat: str = ""
    ghi_chu_admin: str = ""
    diem_uy_tin_moi: Optional[float] = None 
class PhanHoiHoTroRequest(BaseModel):
    phan_hoi: str

# --- DÀNH CHO SINH VIÊN ---

@app.post("/api/bao-cao")
def gui_bao_cao(req: BaoCaoRequest, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    # Kiểm tra xem đã báo cáo đối tượng này chưa (tránh spam)
    da_bao_cao = db.query(models.BaoCaoViPham).filter(
        models.BaoCaoViPham.nguoi_bao_cao == current_user.ma_tai_khoan,
        models.BaoCaoViPham.loai_doi_tuong == req.loai_doi_tuong,
        models.BaoCaoViPham.ma_doi_tuong == req.ma_doi_tuong,
        models.BaoCaoViPham.trang_thai == 'cho_xu_ly'
    ).first()
    if da_bao_cao: return {"error": "Bạn đã báo cáo đối tượng này rồi, vui lòng chờ Admin xử lý!"}

    new_bc = models.BaoCaoViPham(
        nguoi_bao_cao=current_user.ma_tai_khoan,
        loai_doi_tuong=req.loai_doi_tuong,
        ma_doi_tuong=req.ma_doi_tuong,
        ly_do=req.ly_do,
        bang_chung=req.bang_chung,
        ngay_bao_cao=datetime.now()
    )
    db.add(new_bc); db.commit()
    return {"message": "Gửi báo cáo thành công! Admin sẽ sớm xử lý."}

@app.post("/api/ho-tro")
def gui_ho_tro(req: HoTroRequest, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    new_ht = models.YeuCauHoTro(
        nguoi_gui=current_user.ma_tai_khoan,
        tieu_de=req.tieu_de,
        noi_dung=req.noi_dung,
        ngay_gui=datetime.now()
    )
    db.add(new_ht); db.commit()
    return {"message": "Gửi yêu cầu hỗ trợ thành công!"}

# --- DÀNH CHO ADMIN ---

@app.get("/api/admin/bao-cao")
def admin_lay_bao_cao(admin: models.TaiKhoan = Depends(get_current_admin), db: Session = Depends(get_db)):
    try:
        ket_qua = db.query(models.BaoCaoViPham, models.SinhVien).join(
            models.SinhVien, models.BaoCaoViPham.nguoi_bao_cao == models.SinhVien.ma_tai_khoan
        ).order_by(models.BaoCaoViPham.ngay_bao_cao.desc()).all()

        danh_sach = []
        for bc, sv in ket_qua:
            ten_doi_tuong = "Không xác định"
            if bc.loai_doi_tuong == 'nhom':
                nhom = db.query(models.NhomHoc).filter(models.NhomHoc.ma_nhom == bc.ma_doi_tuong).first()
                if nhom: ten_doi_tuong = f"Nhóm: {nhom.ten_nhom}"
            elif bc.loai_doi_tuong == 'bai_dang':
                bd = db.query(models.BaiDangTuyen).filter(models.BaiDangTuyen.ma_bai_dang == bc.ma_doi_tuong).first()
                if bd: ten_doi_tuong = f"Bài đăng: {bd.tieu_de}"
            elif bc.loai_doi_tuong == 'tai_khoan':
                tk = db.query(models.SinhVien).filter(models.SinhVien.ma_tai_khoan == bc.ma_doi_tuong).first()
                if tk: ten_doi_tuong = f"Tài khoản: {tk.ho_ten} ({tk.mssv})"
            elif bc.loai_doi_tuong == 'khieu_nai_diem':
                nhom = db.query(models.NhomHoc).filter(models.NhomHoc.ma_nhom == bc.ma_doi_tuong).first()
                if nhom: ten_doi_tuong = f"Khiếu nại điểm nhóm: {nhom.ten_nhom}"

            danh_sach.append({
                "ma_bao_cao": bc.ma_bao_cao,
                "nguoi_bao_cao": f"{sv.ho_ten} ({sv.mssv})" if sv else "Ẩn danh",
                "loai_doi_tuong": bc.loai_doi_tuong,
                "ten_doi_tuong": ten_doi_tuong,
                "ly_do": bc.ly_do,
                "bang_chung": bc.bang_chung or "",
                "trang_thai": bc.trang_thai,
                "ngay_bao_cao": bc.ngay_bao_cao.strftime("%d/%m/%Y %H:%M") if bc.ngay_bao_cao else ""
            })
        return {"danhSach": danh_sach}
    except Exception as e:
        print("LỖI API BÁO CÁO:", str(e))
        raise HTTPException(status_code=500, detail="Lỗi server khi tải báo cáo")
    
@app.post("/api/admin/bao-cao/{ma_bao_cao}/xu-ly")
def admin_xu_ly_bao_cao(ma_bao_cao: int, req: XuLyBaoCaoRequest, admin: models.TaiKhoan = Depends(get_current_admin), db: Session = Depends(get_db)):
    bc = db.query(models.BaoCaoViPham).filter(models.BaoCaoViPham.ma_bao_cao == ma_bao_cao).first()
    if not bc: raise HTTPException(status_code=404, detail="Không tìm thấy báo cáo")

    if req.trang_thai == 'da_xu_ly':
        if req.hinh_phat == 'khoa_tk' and bc.loai_doi_tuong == 'tai_khoan':
            tk = db.query(models.TaiKhoan).filter(models.TaiKhoan.ma_tai_khoan == bc.ma_doi_tuong).first()
            if tk: tk.trang_thai = 'bi_khoa'
            
        elif req.hinh_phat == 'go_bai' and bc.loai_doi_tuong == 'bai_dang':
            bd = db.query(models.BaiDangTuyen).filter(models.BaiDangTuyen.ma_bai_dang == bc.ma_doi_tuong).first()
            if bd: bd.trang_thai = 'da_dong'
            
        elif req.hinh_phat == 'giai_tan_nhom' and bc.loai_doi_tuong == 'nhom':
            nhom = db.query(models.NhomHoc).filter(models.NhomHoc.ma_nhom == bc.ma_doi_tuong).first()
            if nhom: nhom.trang_thai = 'da_giai_tan'

        # XỬ LÝ KHIẾU NẠI ĐIỂM
        elif bc.loai_doi_tuong == 'khieu_nai_diem':
            sv = db.query(models.SinhVien).filter(models.SinhVien.ma_tai_khoan == bc.nguoi_bao_cao).first()
            
            if req.hinh_phat == 'xoa_danh_gia_nhom':
                # 1. Xóa đánh giá của nhóm bị khiếu nại
                db.query(models.DanhGia).filter(
                    models.DanhGia.ma_nhom == bc.ma_doi_tuong, 
                    models.DanhGia.nguoi_duoc_danh_gia == bc.nguoi_bao_cao
                ).delete()
                
                # 2. Tính lại điểm trung bình từ các nhóm CÒN LẠI
                tat_ca_danh_gia = db.query(models.DanhGia).filter(models.DanhGia.nguoi_duoc_danh_gia == bc.nguoi_bao_cao).all()
                if tat_ca_danh_gia:
                    diem_moi = round(sum([dg.diem_trung_binh for dg in tat_ca_danh_gia]) / len(tat_ca_danh_gia), 2)
                else:
                    diem_moi = 5.0 # Nếu không còn đánh giá nào thì trả về 5.0
                
                if sv: sv.diem_uy_tin = diem_moi

            elif req.hinh_phat == 'chinh_sua_diem' and req.diem_uy_tin_moi is not None:
                # Ghi đè điểm do Admin tự nhập
                if sv: sv.diem_uy_tin = req.diem_uy_tin_moi

    bc.trang_thai = req.trang_thai
    bc.nguoi_xu_ly = admin.ma_tai_khoan
    bc.ghi_chu_admin = req.ghi_chu_admin 
    db.commit()
    return {"message": "Đã xử lý báo cáo!"}
    bc = db.query(models.BaoCaoViPham).filter(models.BaoCaoViPham.ma_bao_cao == ma_bao_cao).first()
    if not bc: raise HTTPException(status_code=404, detail="Không tìm thấy báo cáo")

    if req.trang_thai == 'da_xu_ly':
        if req.hinh_phat == 'khoa_tk' and bc.loai_doi_tuong == 'tai_khoan':
            tk = db.query(models.TaiKhoan).filter(models.TaiKhoan.ma_tai_khoan == bc.ma_doi_tuong).first()
            if tk: tk.trang_thai = 'bi_khoa'
            
        elif req.hinh_phat == 'go_bai' and bc.loai_doi_tuong == 'bai_dang':
            bd = db.query(models.BaiDangTuyen).filter(models.BaiDangTuyen.ma_bai_dang == bc.ma_doi_tuong).first()
            if bd: bd.trang_thai = 'da_dong'
            
        elif req.hinh_phat == 'giai_tan_nhom' and bc.loai_doi_tuong == 'nhom':
            nhom = db.query(models.NhomHoc).filter(models.NhomHoc.ma_nhom == bc.ma_doi_tuong).first()
            if nhom: nhom.trang_thai = 'da_giai_tan'

        elif req.hinh_phat == 'chap_nhan_khieu_nai' and bc.loai_doi_tuong == 'khieu_nai_diem':
            sv = db.query(models.SinhVien).filter(models.SinhVien.ma_tai_khoan == bc.ma_doi_tuong).first()
            if sv:
                sv.diem_uy_tin = 5.0
                db.query(models.DanhGia).filter(models.DanhGia.nguoi_duoc_danh_gia == bc.ma_doi_tuong).delete()

    bc.trang_thai = req.trang_thai
    bc.nguoi_xu_ly = admin.ma_tai_khoan
    bc.ghi_chu_admin = req.ghi_chu_admin # <--- LƯU GHI CHÚ
    db.commit()
    return {"message": "Đã xử lý báo cáo!"}

    bc = db.query(models.BaoCaoViPham).filter(models.BaoCaoViPham.ma_bao_cao == ma_bao_cao).first()
    if not bc: raise HTTPException(status_code=404, detail="Không tìm thấy báo cáo")

    if req.trang_thai == 'da_xu_ly':
        if req.hinh_phat == 'khoa_tk' and bc.loai_doi_tuong == 'tai_khoan':
            tk = db.query(models.TaiKhoan).filter(models.TaiKhoan.ma_tai_khoan == bc.ma_doi_tuong).first()
            if tk: tk.trang_thai = 'bi_khoa'
            
        elif req.hinh_phat == 'go_bai' and bc.loai_doi_tuong == 'bai_dang':
            bd = db.query(models.BaiDangTuyen).filter(models.BaiDangTuyen.ma_bai_dang == bc.ma_doi_tuong).first()
            if bd: bd.trang_thai = 'da_dong'
            
        elif req.hinh_phat == 'giai_tan_nhom' and bc.loai_doi_tuong == 'nhom':
            nhom = db.query(models.NhomHoc).filter(models.NhomHoc.ma_nhom == bc.ma_doi_tuong).first()
            if nhom: nhom.trang_thai = 'da_giai_tan'

        elif req.hinh_phat == 'chap_nhan_khieu_nai' and bc.loai_doi_tuong == 'khieu_nai_diem':
            sv = db.query(models.SinhVien).filter(models.SinhVien.ma_tai_khoan == bc.ma_doi_tuong).first()
            if sv:
                sv.diem_uy_tin = 5.0
                db.query(models.DanhGia).filter(models.DanhGia.nguoi_duoc_danh_gia == bc.ma_doi_tuong).delete()

    bc.trang_thai = req.trang_thai
    bc.nguoi_xu_ly = admin.ma_tai_khoan
    db.commit()
    return {"message": "Đã xử lý báo cáo!"}
@app.get("/api/admin/ho-tro")
def admin_lay_ho_tro(admin: models.TaiKhoan = Depends(get_current_admin), db: Session = Depends(get_db)):
    ket_qua = db.query(models.YeuCauHoTro, models.SinhVien).join(
        models.SinhVien, models.YeuCauHoTro.nguoi_gui == models.SinhVien.ma_tai_khoan
    ).order_by(models.YeuCauHoTro.ngay_gui.desc()).all()

    return {"danhSach": [{
        "ma_ho_tro": ht.ma_ho_tro,
        "nguoi_gui": f"{sv.ho_ten} ({sv.mssv})",
        "tieu_de": ht.tieu_de,
        "noi_dung": ht.noi_dung,
        "trang_thai": ht.trang_thai,
        "phan_hoi": ht.phan_hoi or "",
        "ngay_gui": ht.ngay_gui.strftime("%d/%m/%Y %H:%M")
    } for ht, sv in ket_qua]}

@app.post("/api/admin/ho-tro/{ma_ho_tro}/phan-hoi")
def admin_phan_hoi_ho_tro(ma_ho_tro: int, req: PhanHoiHoTroRequest, admin: models.TaiKhoan = Depends(get_current_admin), db: Session = Depends(get_db)):
    ht = db.query(models.YeuCauHoTro).filter(models.YeuCauHoTro.ma_ho_tro == ma_ho_tro).first()
    if not ht: raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu")
    
    ht.phan_hoi = req.phan_hoi
    ht.trang_thai = 'da_xu_ly'
    ht.ngay_xu_ly = datetime.now()
    db.commit()
    return {"message": "Đã gửi phản hồi!"}

# Chặn đăng nhập nếu tài khoản bị khóa
@app.post("/api/dang-nhap")
def dang_nhap(req: DangNhapRequest, db: Session = Depends(get_db)):
    tk = db.query(models.TaiKhoan).filter(models.TaiKhoan.email == req.email).first()
    if not tk or not verify_password(req.mat_khau, tk.mat_khau_hash): 
        return {"error": "Sai email hoặc mật khẩu!"}
    
    if tk.trang_thai == 'bi_khoa':
        return {"error": "Tài khoản của bạn đã bị khóa do vi phạm tiêu chuẩn cộng đồng!"}
        
    token = create_access_token(data={"sub": str(tk.ma_tai_khoan), "email": tk.email})
    sv = db.query(models.SinhVien).filter(models.SinhVien.ma_tai_khoan == tk.ma_tai_khoan).first()
    return {
        "message": "Đăng nhập thành công!", "access_token": token, 
        "user": {
            "ma_tai_khoan": tk.ma_tai_khoan, "ho_ten": sv.ho_ten if sv else "Sinh viên", 
            "anh_dai_dien": sv.anh_dai_dien if sv else "",
            "loai_tai_khoan": tk.loai_tai_khoan
        }
    }

class KhieuNaiDiemRequest(BaseModel):
    ma_nhom: int
    ly_do: str
    bang_chung: str = ""

@app.post("/api/khieu-nai-diem")
def khieu_nai_diem(
    ma_nhom: int = Form(...), 
    ly_do: str = Form(...), 
    file: UploadFile = File(None), 
    current_user: models.TaiKhoan = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    existing = db.query(models.BaoCaoViPham).filter(
        models.BaoCaoViPham.nguoi_bao_cao == current_user.ma_tai_khoan,
        models.BaoCaoViPham.loai_doi_tuong == 'khieu_nai_diem',
        models.BaoCaoViPham.ma_doi_tuong == ma_nhom,
        models.BaoCaoViPham.trang_thai == 'cho_xu_ly'
    ).first()
    
    if existing:
        return {"error": "Bạn đã gửi khiếu nại cho nhóm này rồi, vui lòng chờ Admin xử lý!"}

    # Xử lý lưu file nếu có upload
    file_url = ""
    if file:
        file_name = f"{uuid.uuid4().hex}.{file.filename.split('.')[-1]}"
        with open(f"uploads/{file_name}", "wb") as buffer: 
            shutil.copyfileobj(file.file, buffer)
        file_url = f"http://localhost:8000/uploads/{file_name}"

    new_bc = models.BaoCaoViPham(
        nguoi_bao_cao=current_user.ma_tai_khoan,
        loai_doi_tuong='khieu_nai_diem',
        ma_doi_tuong=ma_nhom, 
        ly_do=ly_do,
        bang_chung=file_url, # Lưu URL file vào database
        ngay_bao_cao=datetime.now()
    )
    db.add(new_bc)
    db.commit()
    return {"message": "Gửi khiếu nại thành công! Admin sẽ sớm xem xét."}

@app.get("/api/ho-tro/cua-toi")
def lay_ho_tro_cua_toi(current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        ket_qua = db.query(models.YeuCauHoTro).filter(models.YeuCauHoTro.nguoi_gui == current_user.ma_tai_khoan).order_by(models.YeuCauHoTro.ngay_gui.desc()).all()
        return [{
            "ma_ho_tro": ht.ma_ho_tro,
            "tieu_de": ht.tieu_de,
            "noi_dung": ht.noi_dung,
            "loai_su_co": ht.loai_su_co,
            "trang_thai": ht.trang_thai,
            "phan_hoi": ht.phan_hoi or "",
            "ngay_gui": ht.ngay_gui.strftime("%d/%m/%Y %H:%M") if ht.ngay_gui else ""
        } for ht in ket_qua]
    except Exception as e:
        print("LỖI LẤY LỊCH SỬ HỖ TRỢ:", str(e))
        raise HTTPException(status_code=500, detail="Lỗi server")