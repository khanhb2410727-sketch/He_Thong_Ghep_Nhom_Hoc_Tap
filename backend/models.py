from sqlalchemy import Column, Integer, String, Text, Float, Date, DateTime, ForeignKey
from database import Base

class TaiKhoan(Base):
    __tablename__ = "tai_khoan"
    ma_tai_khoan = Column(Integer, primary_key=True, index=True)
    ten_dang_nhap = Column(String(100), unique=True)
    mat_khau_hash = Column(String(255))
    email = Column(String(255), unique=True)
    loai_tai_khoan = Column(String(20))
    trang_thai = Column(String(20))
    ngay_tao = Column(DateTime)
    lan_dang_nhap_cuoi = Column(DateTime)

class SinhVien(Base):
    __tablename__ = "sinh_vien"
    ma_tai_khoan = Column(Integer, ForeignKey("tai_khoan.ma_tai_khoan", ondelete="CASCADE"), primary_key=True, index=True)
    mssv = Column(String(20), unique=True)
    ho_ten = Column(String(150))
    chuyen_nganh = Column(String(100))
    lop_sinh_hoat = Column(String(50))
    so_dien_thoai = Column(String(20))
    anh_dai_dien = Column(String(500))
    mo_ta_ban_than = Column(Text)
    diem_uy_tin = Column(Float, default=5.0)
    lich_ranh_bit = Column(String(21), default="000000000000000000000")
    cap_nhat_lich_cuoi = Column(DateTime)
    nien_khoa = Column(Integer, nullable=True)
    gpa = Column(Float, nullable=True)
    muc_tieu_hoc_tap = Column(Text, nullable=True)

class MonHoc(Base):
    __tablename__ = "mon_hoc"
    ma_mon_hoc = Column(Integer, primary_key=True, index=True)
    ma_mon = Column(String(20))
    ten_mon_hoc = Column(String(200))
    so_tin_chi = Column(Integer)

class NhomHoc(Base):
    __tablename__ = "nhom_hoc"
    ma_nhom = Column(Integer, primary_key=True, index=True)
    ten_nhom = Column(String(200))
    mo_ta = Column(Text)
    hinh_thuc_hoat_dong = Column(String(100))
    dia_diem_co_dinh = Column(String(200))
    so_thanh_vien_toi_da = Column(Integer)
    so_thanh_vien_hien_tai = Column(Integer)
    lich_sinh_hoat_chung_bit = Column(String(21))
    trang_thai = Column(String(20))
    ngay_tao = Column(DateTime)
    nguoi_tao = Column(Integer, ForeignKey("tai_khoan.ma_tai_khoan", ondelete="CASCADE"))
    ma_mon_hoc = Column(Integer, ForeignKey("mon_hoc.ma_mon_hoc", ondelete="SET NULL"), nullable=True)
    ten_mon_hoc = Column(String(100), nullable=True)
    linh_vuc = Column(String(100), nullable=True)
    mo_ta_de_tai = Column(Text, nullable=True)
    muc_tieu = Column(Text, nullable=True)
    so_thanh_vien_toi_thieu = Column(Integer, default=2)

class ThanhVienNhom(Base):
    __tablename__ = "thanh_vien_nhom"
    ma_nhom = Column(Integer, ForeignKey("nhom_hoc.ma_nhom", ondelete="CASCADE"), primary_key=True)
    ma_tai_khoan = Column(Integer, ForeignKey("tai_khoan.ma_tai_khoan", ondelete="CASCADE"), primary_key=True)
    vai_tro = Column(String(20))
    ngay_tham_gia = Column(DateTime)
    trang_thai = Column(String(20))

class KyNang(Base):
    __tablename__ = "ky_nang"
    ma_ky_nang = Column(Integer, primary_key=True)
    ten_ky_nang = Column(String(100))
    nhom_ky_nang = Column(String(50))

class KyNangSinhVien(Base):
    __tablename__ = "ky_nang_sinh_vien"
    ma_tai_khoan = Column(Integer, ForeignKey("sinh_vien.ma_tai_khoan", ondelete="CASCADE"), primary_key=True)
    ma_ky_nang = Column(Integer, ForeignKey("ky_nang.ma_ky_nang", ondelete="CASCADE"), primary_key=True)
    trinh_do = Column(String(20))

class SoThich(Base):
    __tablename__ = "so_thich"
    ma_so_thich = Column(Integer, primary_key=True)
    ten_so_thich = Column(String(100))

class SoThichSinhVien(Base):
    __tablename__ = "so_thich_sinh_vien"
    ma_tai_khoan = Column(Integer, ForeignKey("sinh_vien.ma_tai_khoan", ondelete="CASCADE"), primary_key=True)
    ma_so_thich = Column(Integer, ForeignKey("so_thich.ma_so_thich", ondelete="CASCADE"), primary_key=True)

class LoaiBangCap(Base):
    __tablename__ = "loai_bang_cap"
    ma_loai_bang_cap = Column(Integer, primary_key=True)
    ten_bang_cap = Column(String(200))
    loai = Column(String(50))

class BangCapSinhVien(Base):
    __tablename__ = "bang_cap_sinh_vien"
    ma_bang_cap_sv = Column(Integer, primary_key=True)
    ma_tai_khoan = Column(Integer, ForeignKey("sinh_vien.ma_tai_khoan", ondelete="CASCADE"))
    ma_loai_bang_cap = Column(Integer, ForeignKey("loai_bang_cap.ma_loai_bang_cap", ondelete="CASCADE"))
    diem_so = Column(String(50))
    ngay_cap = Column(Date)

class BaiDangTuyen(Base):
    __tablename__ = "bai_dang_tuyen"
    ma_bai_dang = Column(Integer, primary_key=True, index=True)
    ma_nhom = Column(Integer, ForeignKey("nhom_hoc.ma_nhom", ondelete="CASCADE"))
    nguoi_dang = Column(Integer, ForeignKey("tai_khoan.ma_tai_khoan", ondelete="CASCADE"))
    tieu_de = Column(String(200))
    mo_ta = Column(Text)
    so_luong_can_tuyen = Column(Integer)
    trang_thai = Column(String(20))
    ngay_tao = Column(DateTime)
    yeu_cau_cung = Column(Text, nullable=True)
    yeu_cau_mem = Column(Text, nullable=True)
    yeu_cau_gpa = Column(Float, nullable=True)
    yeu_cau_ky_nang = Column(Text, nullable=True)
    yeu_cau_so_thich = Column(String(255), nullable=True)

class YeuCauThamGia(Base):
    __tablename__ = "yeu_cau_tham_gia"
    ma_yeu_cau = Column(Integer, primary_key=True, index=True)
    ma_bai_dang = Column(Integer, ForeignKey("bai_dang_tuyen.ma_bai_dang", ondelete="CASCADE"), nullable=True)
    ma_nhom = Column(Integer, ForeignKey("nhom_hoc.ma_nhom", ondelete="CASCADE"))
    nguoi_ung_tuyen = Column(Integer, ForeignKey("tai_khoan.ma_tai_khoan", ondelete="CASCADE"))
    loi_nhan = Column(Text)
    trang_thai = Column(String(20))
    ngay_tao = Column(DateTime)
    nguoi_duyet = Column(Integer, ForeignKey("tai_khoan.ma_tai_khoan", ondelete="SET NULL"), nullable=True)
    ly_do_tu_choi = Column(Text, nullable=True)

class DanhGia(Base):
    __tablename__ = "danh_gia"
    ma_danh_gia = Column(Integer, primary_key=True, index=True)
    ma_nhom = Column(Integer, ForeignKey("nhom_hoc.ma_nhom", ondelete="CASCADE"))
    nguoi_danh_gia = Column(Integer, ForeignKey("tai_khoan.ma_tai_khoan", ondelete="CASCADE"))
    nguoi_duoc_danh_gia = Column(Integer, ForeignKey("tai_khoan.ma_tai_khoan", ondelete="CASCADE"))
    diem_thai_do = Column(Integer)
    diem_dong_gop = Column(Integer)
    diem_giao_tiep = Column(Integer)
    diem_dung_han = Column(Integer)
    diem_trung_binh = Column(Float)
    nhan_xet = Column(Text)
    ngay_danh_gia = Column(DateTime)