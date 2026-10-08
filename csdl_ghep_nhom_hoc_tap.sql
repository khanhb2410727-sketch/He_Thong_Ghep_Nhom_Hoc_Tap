DROP DATABASE IF EXISTS he_thong_ghep_nhom_hoc_tap;
CREATE DATABASE he_thong_ghep_nhom_hoc_tap
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE he_thong_ghep_nhom_hoc_tap;

SET FOREIGN_KEY_CHECKS = 1;
SET time_zone = '+07:00';

CREATE TABLE tai_khoan (
    ma_tai_khoan    INT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    mat_khau_hash   VARCHAR(255) NOT NULL,
    ho_ten          VARCHAR(150) NOT NULL,
    so_dien_thoai   VARCHAR(20),
    anh_dai_dien    VARCHAR(500),
    loai_tai_khoan  ENUM('sinh_vien','quan_tri') NOT NULL,
    trang_thai      ENUM('hoat_dong','khong_hoat_dong','bi_khoa') DEFAULT 'hoat_dong',
    da_xac_thuc_email BOOLEAN DEFAULT FALSE,
    ngay_tao        DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    lan_dang_nhap_cuoi DATETIME,
    INDEX idx_tk_email (email),
    INDEX idx_tk_loai (loai_tai_khoan, trang_thai)
) ENGINE=InnoDB;

CREATE TABLE token_dat_lai_mat_khau (
    ma_token        INT AUTO_INCREMENT PRIMARY KEY,
    ma_nguoi_dung   INT NOT NULL,
    token           VARCHAR(255) NOT NULL UNIQUE,
    het_han_luc     DATETIME NOT NULL,
    da_su_dung      BOOLEAN DEFAULT FALSE,
    ngay_tao        DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ma_nguoi_dung) REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE CASCADE,
    INDEX idx_token (token, da_su_dung)
) ENGINE=InnoDB;

CREATE TABLE sinh_vien (
    ma_tai_khoan    INT PRIMARY KEY,
    ma_sinh_vien    VARCHAR(8) NOT NULL UNIQUE,
    chuyen_nganh    VARCHAR(100),
    truong          VARCHAR(200),
    nien_khoa       INT,
    trinh_do        ENUM('nam_1','nam_2','nam_3','nam_4','cao_hoc'),
    gpa             DECIMAL(3,2),
    bio             TEXT,
    bio_cap_nhat    DATETIME,
    so_thich        JSON,
    tinh_cach       JSON,
	muc_tieu_hoc_tap VARCHAR(300),
    diem_uy_tin     DECIMAL(3,2) DEFAULT 5.00,
    so_nhom_da_tham_gia INT DEFAULT 0,
    so_nhom_da_hoan_thanh INT DEFAULT 0,
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE,
    CONSTRAINT chk_gpa CHECK (gpa IS NULL OR gpa BETWEEN 0 AND 4),
    CONSTRAINT chk_diem_uy_tin CHECK (diem_uy_tin BETWEEN 0 AND 5),
    INDEX idx_sv_chuyen_nganh (chuyen_nganh),
    INDEX idx_sv_trinh_do (trinh_do),
	INDEX idx_sv_diem_uy_tin (diem_uy_tin)
) ENGINE=InnoDB;

-- =====================================================
-- BẢNG DANH MỤC — Tạo TRƯỚC
-- =====================================================
CREATE TABLE loai_bang_cap (
    ma_loai_bang_cap    INT AUTO_INCREMENT PRIMARY KEY,
    ma_code             VARCHAR(50) NOT NULL UNIQUE,    -- "IELTS_ACADEMIC" (tra cứu code)
    ten_bang_cap        VARCHAR(200) NOT NULL UNIQUE,   -- "IELTS Academic"
    ten_viet_tat        VARCHAR(50),                    -- "IELTS"
    to_chuc_cap         VARCHAR(200),                   -- "British Council"
    
    loai                ENUM(
        'ngoai_ngu',
        'chuyen_mon',
        'hoc_thuat',
        'giai_thuong',
        'khac'
    ) NOT NULL,
    
    mo_ta               TEXT,
    
    -- Thang điểm
    co_thang_diem       BOOLEAN DEFAULT FALSE,
    diem_toi_thieu      DECIMAL(6,2),
    diem_toi_da         DECIMAL(6,2),
    don_vi_diem         VARCHAR(20),
    
    -- Thời hạn
    co_het_han          BOOLEAN DEFAULT FALSE,
    so_nam_hieu_luc     INT,
    
    -- Quản lý
    dang_hoat_dong      BOOLEAN DEFAULT TRUE,
    ngay_tao            DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_lbc_loai (loai, dang_hoat_dong)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE bang_cap_sinh_vien (
    ma_bang_cap_sv      INT AUTO_INCREMENT PRIMARY KEY,
    ma_tai_khoan        INT NOT NULL,
    ma_loai_bang_cap    INT NOT NULL,
    
    diem_so             VARCHAR(50),
    xep_loai            VARCHAR(50),
    
    ngay_cap            DATE,
    ngay_het_han        DATE,
    
    -- Minh chứng: hỗ trợ nhiều file
    danh_sach_file      JSON,                           -- ["/uploads/a.jpg","/uploads/b.jpg"]
    
    da_xac_thuc         BOOLEAN DEFAULT FALSE,
    nguoi_xac_thuc      INT,
    ngay_xac_thuc       DATETIME,
    
    ngay_tao            DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- KHÓA NGOẠI
    FOREIGN KEY (ma_tai_khoan)     REFERENCES sinh_vien(ma_tai_khoan) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ma_loai_bang_cap) REFERENCES loai_bang_cap(ma_loai_bang_cap) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (nguoi_xac_thuc)   REFERENCES tai_khoan(ma_tai_khoan) 
        ON DELETE SET NULL,
    
    -- Định danh thực thể yếu
    UNIQUE KEY uk_dinh_danh (ma_tai_khoan, ma_loai_bang_cap, ngay_cap),
    
    -- Index
    INDEX idx_bcsv_tai_khoan (ma_tai_khoan),
    INDEX idx_bcsv_loai (ma_loai_bang_cap),
    INDEX idx_bcsv_xac_thuc (da_xac_thuc),
    INDEX idx_bcsv_het_han (ngay_het_han)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
