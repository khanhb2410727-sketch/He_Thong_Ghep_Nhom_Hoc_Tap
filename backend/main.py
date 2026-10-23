import os
import shutil
import uuid
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, Depends, Header, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel
from jose import jwt, JWTError

from database import get_db
import models
from auth import hash_password, verify_password, create_access_token, SECRET_KEY, ALGORITHM

app = FastAPI(title="API Hệ Thống Ghép Nhóm")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ==========================================
# HÀM XÁC THỰC
# ==========================================
def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "): raise HTTPException(status_code=401, detail="Chưa đăng nhập")
    try:
        payload = jwt.decode(authorization.split(" ")[1], SECRET_KEY, algorithms=[ALGORITHM])
        user = db.query(models.TaiKhoan).filter(models.TaiKhoan.ma_tai_khoan == int(payload.get("sub"))).first()
        if not user: raise HTTPException(status_code=401, detail="Tài khoản không tồn tại")
        return user
    except JWTError: raise HTTPException(status_code=401, detail="Token không hợp lệ")

# ==========================================
# THUẬT TOÁN TÍNH ĐIỂM TƯƠNG THÍCH
# ==========================================
def tinh_diem_tuong_thich(db: Session, sinh_vien: models.SinhVien, nhom: models.NhomHoc, bai_dang: models.BaiDangTuyen):
    # 1. LỊCH RẢNH (Dynamic)
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

    # 2. KỸ NĂNG
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

    # 3. HỌC VẤN
    diem_gpa = 1.0
    if bai_dang.yeu_cau_gpa and bai_dang.yeu_cau_gpa > 0:
        sv_gpa = sinh_vien.gpa or 0.0
        diem_gpa = min(1.0, sv_gpa / bai_dang.yeu_cau_gpa)
    diem_hoc_van = (diem_gpa * 0.7) + (0.8 * 0.3) 

    # 4. UY TÍN
    diem_uy_tin = (sinh_vien.diem_uy_tin or 5.0) / 5.0

    # 5. SỞ THÍCH
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
def lay_mon_hoc(db: Session = Depends(get_db)):
    return [{"ma_mon_hoc": m.ma_mon_hoc, "ma_mon": m.ma_mon, "ten_mon_hoc": m.ten_mon_hoc} for m in db.query(models.MonHoc).all()]

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
    if db.query(models.TaiKhoan).filter(models.TaiKhoan.email == req.email).first(): return {"error": "Email đã được sử dụng!"}
    final_mssv = req.mssv if req.mssv else req.ma_sinh_vien
    new_tk = models.TaiKhoan(email=req.email, mat_khau_hash=hash_password(req.mat_khau), loai_tai_khoan="sinh_vien", trang_thai="hoat_dong")
    db.add(new_tk); db.commit(); db.refresh(new_tk)
    db.add(models.SinhVien(ma_tai_khoan=new_tk.ma_tai_khoan, mssv=final_mssv, ho_ten=req.ho_ten)); db.commit()
    return {"message": "Đăng ký thành công!"}

@app.post("/api/dang-nhap")
def dang_nhap(req: DangNhapRequest, db: Session = Depends(get_db)):
    tk = db.query(models.TaiKhoan).filter(models.TaiKhoan.email == req.email).first()
    if not tk or not verify_password(req.mat_khau, tk.mat_khau_hash): return {"error": "Sai email hoặc mật khẩu!"}
    token = create_access_token(data={"sub": str(tk.ma_tai_khoan), "email": tk.email})
    sv = db.query(models.SinhVien).filter(models.SinhVien.ma_tai_khoan == tk.ma_tai_khoan).first()
    return {"message": "Đăng nhập thành công!", "access_token": token, "user": {"ma_tai_khoan": tk.ma_tai_khoan, "ho_ten": sv.ho_ten if sv else "Sinh viên"}}

@app.get("/api/sinh-vien/ho-so")
def lay_ho_so(current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    sv = db.query(models.SinhVien).filter(models.SinhVien.ma_tai_khoan == current_user.ma_tai_khoan).first()
    if not sv: raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ")
    return {
        "ho_ten": sv.ho_ten, "email": current_user.email, "anh_dai_dien": sv.anh_dai_dien or "",
        "mssv": sv.mssv, "chuyen_nganh": sv.chuyen_nganh or "", "lop_sinh_hoat": sv.lop_sinh_hoat or "",
        "mo_ta_ban_than": sv.mo_ta_ban_than or "", "lich_ranh_bit": sv.lich_ranh_bit or "000000000000000000000",
        "nien_khoa": sv.nien_khoa or 0, "gpa": sv.gpa or 0.0, "muc_tieu_hoc_tap": sv.muc_tieu_hoc_tap or ""
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

# ==========================================
# API KỸ NĂNG / SỞ THÍCH / LỊCH RẢNH / BẰNG CẤP
# ==========================================
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
    for ma in req.get("danh_sach_ma", []):
        db.add(models.KyNangSinhVien(ma_tai_khoan=current_user.ma_tai_khoan, ma_ky_nang=ma, trinh_do='co_ban'))
    db.commit(); return {"message": "Lưu kỹ năng thành công!"}

@app.get("/api/sinh-vien/so-thich")
def get_sv_so_thich(current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    res = db.query(models.SoThichSinhVien.ma_so_thich).filter(models.SoThichSinhVien.ma_tai_khoan == current_user.ma_tai_khoan).all()
    return {"danhSach": [r.ma_so_thich for r in res]}

@app.post("/api/sinh-vien/so-thich")
def luu_sv_so_thich(req: dict, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(models.SoThichSinhVien).filter(models.SoThichSinhVien.ma_tai_khoan == current_user.ma_tai_khoan).delete()
    for ma in req.get("danh_sach_ma", []):
        db.add(models.SoThichSinhVien(ma_tai_khoan=current_user.ma_tai_khoan, ma_so_thich=ma))
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
    nhom = db.query(models.NhomHoc).filter(models.NhomHoc.ma_nhom == ma_nhom).first()
    new_bd = models.BaiDangTuyen(
        ma_nhom=ma_nhom, nguoi_dang=current_user.ma_tai_khoan,
        tieu_de=f"Tìm thành viên nhóm {nhom.ten_mon_hoc or nhom.ten_nhom}", mo_ta=nhom.mo_ta,
        so_luong_can_tuyen=req.get("so_luong_can_tuyen", 1), trang_thai="dang_mo", ngay_tao=datetime.now(),
        yeu_cau_cung=req.get("yeu_cau_cung", ""), yeu_cau_mem=req.get("yeu_cau_mem", ""),
        yeu_cau_gpa=req.get("yeu_cau_gpa", 0.0),
        yeu_cau_ky_nang=req.get("yeu_cau_ky_nang", ""),
        yeu_cau_so_thich=req.get("yeu_cau_so_thich", "")
    )
    db.add(new_bd); db.commit(); return {"message": "Đăng tuyển thành công!"}

@app.get("/api/bai-dang")
def lay_danh_sach_bai_dang(authorization: str = Header(None), db: Session = Depends(get_db)):
    sinh_vien = None
    if authorization and authorization.startswith("Bearer "):
        try:
            payload = jwt.decode(authorization.split(" ")[1], SECRET_KEY, algorithms=[ALGORITHM])
            sinh_vien = db.query(models.SinhVien).filter(models.SinhVien.ma_tai_khoan == int(payload.get("sub"))).first()
        except: pass

    bai_dangs = db.query(models.BaiDangTuyen, models.NhomHoc).join(models.NhomHoc, models.BaiDangTuyen.ma_nhom == models.NhomHoc.ma_nhom).filter(models.BaiDangTuyen.trang_thai == 'dang_mo').all()
    
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
    db.add(models.YeuCauThamGia(ma_bai_dang=ma_bai_dang, ma_nhom=bd.ma_nhom, nguoi_ung_tuyen=current_user.ma_tai_khoan, loi_nhan=req.get("loi_nhan", ""), trang_thai="cho_duyet", ngay_tao=datetime.now()))
    db.commit(); return {"message": "Gửi ứng tuyển thành công!"}

# ==========================================
# API QUẢN LÝ NHÓM
# ==========================================
@app.get("/api/nhom/cua-toi")
def lay_nhom_cua_toi(current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    ket_qua = db.query(models.ThanhVienNhom, models.NhomHoc).join(models.NhomHoc, models.ThanhVienNhom.ma_nhom == models.NhomHoc.ma_nhom).filter(models.ThanhVienNhom.ma_tai_khoan == current_user.ma_tai_khoan).all()
    return {"danhSach": [{"maNhom": nhom.ma_nhom, "tenNhom": nhom.ten_nhom, "moTa": nhom.mo_ta, "soThanhVienHienTai": nhom.so_thanh_vien_hien_tai, "soThanhVienToiDa": nhom.so_thanh_vien_toi_da, "trangThai": nhom.trang_thai, "vaiTro": tv.vai_tro, "tenMonHoc": nhom.ten_mon_hoc} for tv, nhom in ket_qua]}

@app.get("/api/nhom/yeu-cau-gui-di")
def lay_yeu_cau_gui_di(current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    ket_qua = db.query(models.YeuCauThamGia, models.NhomHoc).join(models.NhomHoc, models.YeuCauThamGia.ma_nhom == models.NhomHoc.ma_nhom).filter(models.YeuCauThamGia.nguoi_ung_tuyen == current_user.ma_tai_khoan).order_by(models.YeuCauThamGia.ngay_tao.desc()).all()
    return {"danhSach": [{"maYeuCau": yc.ma_yeu_cau, "maNhom": nhom.ma_nhom, "tenNhom": nhom.ten_nhom, "moTa": nhom.mo_ta, "soThanhVienHienTai": nhom.so_thanh_vien_hien_tai, "soThanhVienToiDa": nhom.so_thanh_vien_toi_da, "trangThai": yc.trang_thai, "tenMonHoc": nhom.ten_mon_hoc, "ngayTao": str(yc.ngay_tao)} for yc, nhom in ket_qua]}

@app.get("/api/nhom/{ma_nhom}/chi-tiet")
def lay_chi_tiet_nhom(ma_nhom: int, db: Session = Depends(get_db)):
    nhom = db.query(models.NhomHoc).filter(models.NhomHoc.ma_nhom == ma_nhom).first()
    return {"maNhom": nhom.ma_nhom, "tenNhom": nhom.ten_nhom, "moTa": nhom.mo_ta, "tenMonHoc": nhom.ten_mon_hoc, "linhVuc": nhom.linh_vuc, "soThanhVienHienTai": nhom.so_thanh_vien_hien_tai, "soThanhVienToiDa": nhom.so_thanh_vien_toi_da, "hinhThucHoatDong": nhom.hinh_thuc_hoat_dong, "diaDiemCoDinh": nhom.dia_diem_co_dinh, "trangThai": nhom.trang_thai}

@app.get("/api/nhom/{ma_nhom}/thanh-vien")
def lay_thanh_vien(ma_nhom: int, db: Session = Depends(get_db)):
    ket_qua = db.query(models.ThanhVienNhom, models.SinhVien).join(models.SinhVien, models.ThanhVienNhom.ma_tai_khoan == models.SinhVien.ma_tai_khoan).filter(models.ThanhVienNhom.ma_nhom == ma_nhom).all()
    return {"danhSach": [{"maTaiKhoan": tv.ma_tai_khoan, "hoTen": sv.ho_ten, "vaiTro": tv.vai_tro, "ngayThamGia": str(tv.ngay_tham_gia)} for tv, sv in ket_qua]}

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
    nhom.so_thanh_vien_hien_tai += 1; db.commit(); return {"message": "Đã duyệt!"}

@app.post("/api/nhom/yeu-cau/{ma_yeu_cau}/tu-choi")
def tu_choi_yeu_cau(ma_yeu_cau: int, req: dict, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    yc = db.query(models.YeuCauThamGia).filter(models.YeuCauThamGia.ma_yeu_cau == ma_yeu_cau).first()
    yc.trang_thai = 'da_tu_choi'; yc.nguoi_duyet = current_user.ma_tai_khoan; yc.ly_do_tu_choi = req.get("ly_do", "")
    db.commit(); return {"message": "Đã từ chối!"}

# ==========================================
# API ĐÁNH GIÁ THÀNH VIÊN
# ==========================================
@app.get("/api/nhom/{ma_nhom}/thanh-vien-danh-gia")
def lay_thanh_vien_danh_gia(ma_nhom: int, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    ket_qua = db.query(models.ThanhVienNhom, models.SinhVien).join(models.SinhVien, models.ThanhVienNhom.ma_tai_khoan == models.SinhVien.ma_tai_khoan).filter(models.ThanhVienNhom.ma_nhom == ma_nhom, models.ThanhVienNhom.ma_tai_khoan != current_user.ma_tai_khoan).all()
    danh_sach = []
    for tv, sv in ket_qua:
        da_danh_gia = db.query(models.DanhGia).filter(models.DanhGia.ma_nhom == ma_nhom, models.DanhGia.nguoi_danh_gia == current_user.ma_tai_khoan, models.DanhGia.nguoi_duoc_danh_gia == tv.ma_tai_khoan).first() is not None
        danh_sach.append({"maTaiKhoan": tv.ma_tai_khoan, "hoTen": sv.ho_ten, "vaiTro": "Trưởng nhóm" if tv.vai_tro == 'truong_nhom' else "Thành viên", "daDanhGia": da_danh_gia})
    return {"danhSach": danh_sach}

@app.post("/api/danh-gia")
def gui_danh_gia(req: dict, current_user: models.TaiKhoan = Depends(get_current_user), db: Session = Depends(get_db)):
    ma_nhom = req.get("maNhom"); nguoi_duoc_danh_gia = req.get("maNguoiDuocDanhGia")
    existing = db.query(models.DanhGia).filter(models.DanhGia.ma_nhom == ma_nhom, models.DanhGia.nguoi_danh_gia == current_user.ma_tai_khoan, models.DanhGia.nguoi_duoc_danh_gia == nguoi_duoc_danh_gia).first()
    if existing: return {"error": "Bạn đã đánh giá thành viên này rồi!"}
    d_thai_do = req.get("diemThaiDo", 0); d_dong_gop = req.get("diemDongGop", 0); d_giao_tiep = req.get("diemGiaoTiep", 0); d_dung_han = req.get("diemDungHan", 0)
    new_dg = models.DanhGia(ma_nhom=ma_nhom, nguoi_danh_gia=current_user.ma_tai_khoan, nguoi_duoc_danh_gia=nguoi_duoc_danh_gia, diem_thai_do=d_thai_do, diem_dong_gop=d_dong_gop, diem_giao_tiep=d_giao_tiep, diem_dung_han=d_dung_han, diem_trung_binh=(d_thai_do+d_dong_gop+d_giao_tiep+d_dung_han)/4.0, nhan_xet=req.get("nhanXet", ""), ngay_danh_gia=datetime.now())
    db.add(new_dg); db.commit(); return {"message": "Gửi đánh giá thành công!"}