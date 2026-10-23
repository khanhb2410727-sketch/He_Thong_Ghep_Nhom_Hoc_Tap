-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: he_thong_ghep_nhom_hoc_tap
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bai_dang_tuyen`
--

DROP TABLE IF EXISTS `bai_dang_tuyen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bai_dang_tuyen` (
  `ma_bai_dang` int NOT NULL AUTO_INCREMENT,
  `ma_nhom` int NOT NULL,
  `nguoi_dang` int NOT NULL,
  `tieu_de` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `so_luong_can_tuyen` int DEFAULT '1',
  `trang_thai` enum('dang_mo','da_dong') COLLATE utf8mb4_unicode_ci DEFAULT 'dang_mo',
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_bai_dang`),
  KEY `ma_nhom` (`ma_nhom`),
  KEY `nguoi_dang` (`nguoi_dang`),
  CONSTRAINT `bai_dang_tuyen_ibfk_1` FOREIGN KEY (`ma_nhom`) REFERENCES `nhom_hoc` (`ma_nhom`) ON DELETE CASCADE,
  CONSTRAINT `bai_dang_tuyen_ibfk_2` FOREIGN KEY (`nguoi_dang`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bai_dang_tuyen`
--

LOCK TABLES `bai_dang_tuyen` WRITE;
/*!40000 ALTER TABLE `bai_dang_tuyen` DISABLE KEYS */;
INSERT INTO `bai_dang_tuyen` VALUES (1,1,1,'Cần tuyển 2 bạn làm Chatbot AI','Yêu cầu biết Python cơ bản, có tinh thần trách nhiệm.',2,'dang_mo','2026-10-23 09:34:01'),(2,2,1,'Tìm 1 bạn làm chung đồ án ML','Cùng nhau nghiên cứu mô hình dự đoán giá nhà.',1,'dang_mo','2026-10-23 09:34:01');
/*!40000 ALTER TABLE `bai_dang_tuyen` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bang_cap_sinh_vien`
--

DROP TABLE IF EXISTS `bang_cap_sinh_vien`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bang_cap_sinh_vien` (
  `ma_bang_cap_sv` int NOT NULL AUTO_INCREMENT,
  `ma_tai_khoan` int NOT NULL,
  `ma_loai_bang_cap` int NOT NULL,
  `diem_so` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_cap` date DEFAULT NULL,
  PRIMARY KEY (`ma_bang_cap_sv`),
  KEY `ma_tai_khoan` (`ma_tai_khoan`),
  KEY `ma_loai_bang_cap` (`ma_loai_bang_cap`),
  CONSTRAINT `bang_cap_sinh_vien_ibfk_1` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `sinh_vien` (`ma_tai_khoan`) ON DELETE CASCADE,
  CONSTRAINT `bang_cap_sinh_vien_ibfk_2` FOREIGN KEY (`ma_loai_bang_cap`) REFERENCES `loai_bang_cap` (`ma_loai_bang_cap`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bang_cap_sinh_vien`
--

LOCK TABLES `bang_cap_sinh_vien` WRITE;
/*!40000 ALTER TABLE `bang_cap_sinh_vien` DISABLE KEYS */;
/*!40000 ALTER TABLE `bang_cap_sinh_vien` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ky_nang`
--

DROP TABLE IF EXISTS `ky_nang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ky_nang` (
  `ma_ky_nang` int NOT NULL AUTO_INCREMENT,
  `ten_ky_nang` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nhom_ky_nang` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ma_ky_nang`),
  UNIQUE KEY `ten_ky_nang` (`ten_ky_nang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ky_nang`
--

LOCK TABLES `ky_nang` WRITE;
/*!40000 ALTER TABLE `ky_nang` DISABLE KEYS */;
/*!40000 ALTER TABLE `ky_nang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ky_nang_sinh_vien`
--

DROP TABLE IF EXISTS `ky_nang_sinh_vien`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ky_nang_sinh_vien` (
  `ma_tai_khoan` int NOT NULL,
  `ma_ky_nang` int NOT NULL,
  `trinh_do` enum('moi_bat_dau','co_ban','kha','chuyen_gia') COLLATE utf8mb4_unicode_ci DEFAULT 'co_ban',
  PRIMARY KEY (`ma_tai_khoan`,`ma_ky_nang`),
  KEY `ma_ky_nang` (`ma_ky_nang`),
  CONSTRAINT `ky_nang_sinh_vien_ibfk_1` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `sinh_vien` (`ma_tai_khoan`) ON DELETE CASCADE,
  CONSTRAINT `ky_nang_sinh_vien_ibfk_2` FOREIGN KEY (`ma_ky_nang`) REFERENCES `ky_nang` (`ma_ky_nang`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ky_nang_sinh_vien`
--

LOCK TABLES `ky_nang_sinh_vien` WRITE;
/*!40000 ALTER TABLE `ky_nang_sinh_vien` DISABLE KEYS */;
/*!40000 ALTER TABLE `ky_nang_sinh_vien` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loai_bang_cap`
--

DROP TABLE IF EXISTS `loai_bang_cap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loai_bang_cap` (
  `ma_loai_bang_cap` int NOT NULL AUTO_INCREMENT,
  `ten_bang_cap` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loai` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ma_loai_bang_cap`),
  UNIQUE KEY `ten_bang_cap` (`ten_bang_cap`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loai_bang_cap`
--

LOCK TABLES `loai_bang_cap` WRITE;
/*!40000 ALTER TABLE `loai_bang_cap` DISABLE KEYS */;
/*!40000 ALTER TABLE `loai_bang_cap` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nhom_hoc`
--

DROP TABLE IF EXISTS `nhom_hoc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nhom_hoc` (
  `ma_nhom` int NOT NULL AUTO_INCREMENT,
  `ten_nhom` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `hinh_thuc_hoat_dong` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dia_diem_co_dinh` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_thanh_vien_toi_da` int DEFAULT '5',
  `so_thanh_vien_hien_tai` int DEFAULT '1',
  `lich_sinh_hoat_chung_bit` char(21) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'hoat_dong',
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  `nguoi_tao` int NOT NULL,
  PRIMARY KEY (`ma_nhom`),
  KEY `nguoi_tao` (`nguoi_tao`),
  CONSTRAINT `nhom_hoc_ibfk_1` FOREIGN KEY (`nguoi_tao`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nhom_hoc`
--

LOCK TABLES `nhom_hoc` WRITE;
/*!40000 ALTER TABLE `nhom_hoc` DISABLE KEYS */;
INSERT INTO `nhom_hoc` VALUES (1,'Nhóm AI - Đồ án Chatbot','Làm chatbot AI','Offline','Thư viện',5,1,NULL,'hoat_dong','2026-10-23 09:28:50',1),(2,'Nhóm ML - Dự đoán giá nhà','Nghiên cứu ML','Online','Google Meet',4,1,NULL,'hoat_dong','2026-10-23 09:28:50',1);
/*!40000 ALTER TABLE `nhom_hoc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sinh_vien`
--

DROP TABLE IF EXISTS `sinh_vien`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sinh_vien` (
  `ma_tai_khoan` int NOT NULL,
  `mssv` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ho_ten` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lop_sinh_hoat` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_dien_thoai` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `anh_dai_dien` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mo_ta_ban_than` text COLLATE utf8mb4_unicode_ci,
  `diem_uy_tin` decimal(3,2) DEFAULT '5.00',
  `lich_ranh_bit` char(21) COLLATE utf8mb4_unicode_ci DEFAULT '000000000000000000000',
  `cap_nhat_lich_cuoi` datetime DEFAULT NULL,
  `chuyen_nganh` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ma_tai_khoan`),
  UNIQUE KEY `mssv` (`mssv`),
  CONSTRAINT `sinh_vien_ibfk_1` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sinh_vien`
--

LOCK TABLES `sinh_vien` WRITE;
/*!40000 ALTER TABLE `sinh_vien` DISABLE KEYS */;
INSERT INTO `sinh_vien` VALUES (1,'SV001','Nguyễn Văn Test','CNTT-K68',NULL,NULL,NULL,5.00,'000000000000000000000',NULL,'Khoa học máy tính');
/*!40000 ALTER TABLE `sinh_vien` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tai_khoan`
--

DROP TABLE IF EXISTS `tai_khoan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tai_khoan` (
  `ma_tai_khoan` int NOT NULL AUTO_INCREMENT,
  `ten_dang_nhap` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mat_khau_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loai_tai_khoan` enum('sinh_vien','quan_tri') COLLATE utf8mb4_unicode_ci DEFAULT 'sinh_vien',
  `trang_thai` enum('hoat_dong','bi_khoa') COLLATE utf8mb4_unicode_ci DEFAULT 'hoat_dong',
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  `lan_dang_nhap_cuoi` datetime DEFAULT NULL,
  PRIMARY KEY (`ma_tai_khoan`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `ten_dang_nhap` (`ten_dang_nhap`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tai_khoan`
--

LOCK TABLES `tai_khoan` WRITE;
/*!40000 ALTER TABLE `tai_khoan` DISABLE KEYS */;
INSERT INTO `tai_khoan` VALUES (1,NULL,'123','test@gmail.com','sinh_vien','hoat_dong','2026-10-23 09:28:50',NULL);
/*!40000 ALTER TABLE `tai_khoan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `thanh_vien_nhom`
--

DROP TABLE IF EXISTS `thanh_vien_nhom`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `thanh_vien_nhom` (
  `ma_nhom` int NOT NULL,
  `ma_tai_khoan` int NOT NULL,
  `vai_tro` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'thanh_vien',
  `ngay_tham_gia` datetime DEFAULT CURRENT_TIMESTAMP,
  `trang_thai` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'hoat_dong',
  PRIMARY KEY (`ma_nhom`,`ma_tai_khoan`),
  KEY `ma_tai_khoan` (`ma_tai_khoan`),
  CONSTRAINT `thanh_vien_nhom_ibfk_1` FOREIGN KEY (`ma_nhom`) REFERENCES `nhom_hoc` (`ma_nhom`) ON DELETE CASCADE,
  CONSTRAINT `thanh_vien_nhom_ibfk_2` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thanh_vien_nhom`
--

LOCK TABLES `thanh_vien_nhom` WRITE;
/*!40000 ALTER TABLE `thanh_vien_nhom` DISABLE KEYS */;
/*!40000 ALTER TABLE `thanh_vien_nhom` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `yeu_cau_tham_gia`
--

DROP TABLE IF EXISTS `yeu_cau_tham_gia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `yeu_cau_tham_gia` (
  `ma_yeu_cau` int NOT NULL AUTO_INCREMENT,
  `ma_bai_dang` int DEFAULT NULL,
  `ma_nhom` int NOT NULL,
  `nguoi_ung_tuyen` int NOT NULL,
  `loi_nhan` text COLLATE utf8mb4_unicode_ci,
  `trang_thai` enum('cho_duyet','da_chap_nhan','da_tu_choi') COLLATE utf8mb4_unicode_ci DEFAULT 'cho_duyet',
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_yeu_cau`),
  KEY `ma_bai_dang` (`ma_bai_dang`),
  KEY `ma_nhom` (`ma_nhom`),
  KEY `nguoi_ung_tuyen` (`nguoi_ung_tuyen`),
  CONSTRAINT `yeu_cau_tham_gia_ibfk_1` FOREIGN KEY (`ma_bai_dang`) REFERENCES `bai_dang_tuyen` (`ma_bai_dang`) ON DELETE CASCADE,
  CONSTRAINT `yeu_cau_tham_gia_ibfk_2` FOREIGN KEY (`ma_nhom`) REFERENCES `nhom_hoc` (`ma_nhom`) ON DELETE CASCADE,
  CONSTRAINT `yeu_cau_tham_gia_ibfk_3` FOREIGN KEY (`nguoi_ung_tuyen`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `yeu_cau_tham_gia`
--

LOCK TABLES `yeu_cau_tham_gia` WRITE;
/*!40000 ALTER TABLE `yeu_cau_tham_gia` DISABLE KEYS */;
/*!40000 ALTER TABLE `yeu_cau_tham_gia` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-23  9:51:13
