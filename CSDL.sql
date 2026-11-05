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
  `yeu_cau_cung` text COLLATE utf8mb4_unicode_ci,
  `yeu_cau_mem` text COLLATE utf8mb4_unicode_ci,
  `yeu_cau_gpa` float DEFAULT NULL,
  `yeu_cau_ky_nang` text COLLATE utf8mb4_unicode_ci,
  `yeu_cau_so_thich` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `han_chot` datetime DEFAULT NULL,
  PRIMARY KEY (`ma_bai_dang`),
  KEY `ma_nhom` (`ma_nhom`),
  KEY `nguoi_dang` (`nguoi_dang`),
  CONSTRAINT `bai_dang_tuyen_ibfk_1` FOREIGN KEY (`ma_nhom`) REFERENCES `nhom_hoc` (`ma_nhom`) ON DELETE CASCADE,
  CONSTRAINT `bai_dang_tuyen_ibfk_2` FOREIGN KEY (`nguoi_dang`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bai_dang_tuyen`
--

LOCK TABLES `bai_dang_tuyen` WRITE;
/*!40000 ALTER TABLE `bai_dang_tuyen` DISABLE KEYS */;
INSERT INTO `bai_dang_tuyen` VALUES (1,1,1,'Cần tuyển 2 bạn làm Chatbot AI','Yêu cầu biết Python cơ bản, có tinh thần trách nhiệm.',2,'dang_mo','2026-10-23 09:34:01',NULL,NULL,NULL,NULL,NULL,NULL),(2,2,1,'Tìm 1 bạn làm chung đồ án ML','Cùng nhau nghiên cứu mô hình dự đoán giá nhà.',1,'dang_mo','2026-10-23 09:34:01',NULL,NULL,NULL,NULL,NULL,NULL),(3,3,2,'Tìm thành viên cho nhóm: Nhóm học ATTT','',2,'da_dong','2026-10-23 10:37:48','','',0,'',NULL,NULL),(5,3,2,'Tìm thành viên nhóm ATTT','',2,'da_dong','2026-10-23 15:38:42','','',0,'',NULL,NULL),(7,7,2,'Tìm thành viên nhóm Mạng máy tính','',2,'da_dong','2026-11-04 23:47:28','','',0,'1,5,8','1,3,6','2026-11-05 00:00:00');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bang_cap_sinh_vien`
--

LOCK TABLES `bang_cap_sinh_vien` WRITE;
/*!40000 ALTER TABLE `bang_cap_sinh_vien` DISABLE KEYS */;
INSERT INTO `bang_cap_sinh_vien` VALUES (1,2,4,'2','2026-10-23'),(2,2,2,'','2026-10-16'),(3,3,3,'','2026-10-29');
/*!40000 ALTER TABLE `bang_cap_sinh_vien` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bao_cao_vi_pham`
--

DROP TABLE IF EXISTS `bao_cao_vi_pham`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bao_cao_vi_pham` (
  `ma_bao_cao` int NOT NULL AUTO_INCREMENT,
  `nguoi_bao_cao` int DEFAULT NULL,
  `loai_doi_tuong` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ma_doi_tuong` int DEFAULT NULL,
  `ly_do` text COLLATE utf8mb4_unicode_ci,
  `bang_chung` text COLLATE utf8mb4_unicode_ci,
  `trang_thai` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'cho_xu_ly',
  `ngay_bao_cao` datetime DEFAULT CURRENT_TIMESTAMP,
  `nguoi_xu_ly` int DEFAULT NULL,
  `ghi_chu_admin` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`ma_bao_cao`),
  KEY `nguoi_bao_cao` (`nguoi_bao_cao`),
  KEY `nguoi_xu_ly` (`nguoi_xu_ly`),
  CONSTRAINT `bao_cao_vi_pham_ibfk_1` FOREIGN KEY (`nguoi_bao_cao`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE CASCADE,
  CONSTRAINT `bao_cao_vi_pham_ibfk_2` FOREIGN KEY (`nguoi_xu_ly`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bao_cao_vi_pham`
--

LOCK TABLES `bao_cao_vi_pham` WRITE;
/*!40000 ALTER TABLE `bao_cao_vi_pham` DISABLE KEYS */;
INSERT INTO `bao_cao_vi_pham` VALUES (1,2,'khieu_nai_diem',3,'Bạn đánh giá không hợp lý','http://localhost:8000/uploads/0330dbc716da4b1595cd0117ba989ecd.png','da_xu_ly','2026-11-05 20:37:39',5,NULL);
/*!40000 ALTER TABLE `bao_cao_vi_pham` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `danh_gia`
--

DROP TABLE IF EXISTS `danh_gia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `danh_gia` (
  `ma_danh_gia` int NOT NULL AUTO_INCREMENT,
  `ma_nhom` int NOT NULL,
  `nguoi_danh_gia` int NOT NULL,
  `nguoi_duoc_danh_gia` int NOT NULL,
  `diem_thai_do` int DEFAULT '0',
  `diem_dong_gop` int DEFAULT '0',
  `diem_giao_tiep` int DEFAULT '0',
  `diem_dung_han` int DEFAULT '0',
  `diem_trung_binh` float DEFAULT '0',
  `nhan_xet` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ngay_danh_gia` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_danh_gia`),
  KEY `ma_nhom` (`ma_nhom`),
  KEY `nguoi_danh_gia` (`nguoi_danh_gia`),
  KEY `nguoi_duoc_danh_gia` (`nguoi_duoc_danh_gia`),
  CONSTRAINT `danh_gia_ibfk_1` FOREIGN KEY (`ma_nhom`) REFERENCES `nhom_hoc` (`ma_nhom`) ON DELETE CASCADE,
  CONSTRAINT `danh_gia_ibfk_2` FOREIGN KEY (`nguoi_danh_gia`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE CASCADE,
  CONSTRAINT `danh_gia_ibfk_3` FOREIGN KEY (`nguoi_duoc_danh_gia`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `danh_gia`
--

LOCK TABLES `danh_gia` WRITE;
/*!40000 ALTER TABLE `danh_gia` DISABLE KEYS */;
INSERT INTO `danh_gia` VALUES (1,3,2,3,4,4,3,4,3.75,'','2026-11-01 00:24:58'),(2,3,3,2,4,3,3,4,3.5,'','2026-11-01 02:16:37');
/*!40000 ALTER TABLE `danh_gia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deadline`
--

DROP TABLE IF EXISTS `deadline`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deadline` (
  `ma_deadline` int NOT NULL AUTO_INCREMENT,
  `ma_nhom` int NOT NULL,
  `tieu_de` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `han_chot` datetime NOT NULL,
  `nguoi_tao` int NOT NULL,
  `trang_thai` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'chua_xong',
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_deadline`),
  KEY `ma_nhom` (`ma_nhom`),
  KEY `nguoi_tao` (`nguoi_tao`),
  CONSTRAINT `deadline_ibfk_1` FOREIGN KEY (`ma_nhom`) REFERENCES `nhom_hoc` (`ma_nhom`) ON DELETE CASCADE,
  CONSTRAINT `deadline_ibfk_2` FOREIGN KEY (`nguoi_tao`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deadline`
--

LOCK TABLES `deadline` WRITE;
/*!40000 ALTER TABLE `deadline` DISABLE KEYS */;
/*!40000 ALTER TABLE `deadline` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ky_nang`
--

LOCK TABLES `ky_nang` WRITE;
/*!40000 ALTER TABLE `ky_nang` DISABLE KEYS */;
INSERT INTO `ky_nang` VALUES (1,'C / C++','Lập trình'),(2,'Java','Lập trình'),(3,'Python','Lập trình'),(4,'JavaScript','Lập trình'),(5,'React / Node.js','Lập trình'),(6,'SQL / NoSQL','Lập trình'),(7,'HTML / CSS','Lập trình'),(8,'Tiếng Anh','Ngoại ngữ'),(9,'Tiếng Nhật','Ngoại ngữ'),(10,'Tiếng Trung','Ngoại ngữ');
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
INSERT INTO `ky_nang_sinh_vien` VALUES (2,1,'co_ban'),(2,2,'co_ban'),(2,3,'co_ban'),(2,4,'co_ban'),(2,9,'co_ban'),(3,1,'co_ban');
/*!40000 ALTER TABLE `ky_nang_sinh_vien` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lich_hop`
--

DROP TABLE IF EXISTS `lich_hop`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lich_hop` (
  `ma_lich_hop` int NOT NULL AUTO_INCREMENT,
  `ma_nhom` int NOT NULL,
  `tieu_de` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `thoi_gian_bat_dau` datetime NOT NULL,
  `thoi_gian_ket_thuc` datetime NOT NULL,
  `dia_diem` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `noi_dung` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `nguoi_tao` int NOT NULL,
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_lich_hop`),
  KEY `ma_nhom` (`ma_nhom`),
  KEY `nguoi_tao` (`nguoi_tao`),
  CONSTRAINT `lich_hop_ibfk_1` FOREIGN KEY (`ma_nhom`) REFERENCES `nhom_hoc` (`ma_nhom`) ON DELETE CASCADE,
  CONSTRAINT `lich_hop_ibfk_2` FOREIGN KEY (`nguoi_tao`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lich_hop`
--

LOCK TABLES `lich_hop` WRITE;
/*!40000 ALTER TABLE `lich_hop` DISABLE KEYS */;
/*!40000 ALTER TABLE `lich_hop` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loai_bang_cap`
--

LOCK TABLES `loai_bang_cap` WRITE;
/*!40000 ALTER TABLE `loai_bang_cap` DISABLE KEYS */;
INSERT INTO `loai_bang_cap` VALUES (1,'Chứng chỉ Tiếng Anh B1/B2','Ngoại ngữ'),(2,'Chứng chỉ TOEIC 500+','Ngoại ngữ'),(3,'Chứng chỉ IELTS 5.5+','Ngoại ngữ'),(4,'Chứng chỉ MOS Word/Excel','Tin học'),(5,'Chứng chỉ IC3','Tin học'),(6,'Chứng chỉ Lập trình viên quốc tế','Chuyên môn'),(7,'Bằng lái xe hạng A1','Kỹ năng mềm'),(8,'Chứng chỉ An toàn thông tin cơ bản','Chuyên môn');
/*!40000 ALTER TABLE `loai_bang_cap` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mon_hoc`
--

DROP TABLE IF EXISTS `mon_hoc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mon_hoc` (
  `ma_mon_hoc` int NOT NULL AUTO_INCREMENT,
  `ma_mon` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ten_mon_hoc` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `so_tin_chi` int DEFAULT '3',
  `nganh_ap_dung` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Tất cả',
  `nhom_mon_hoc` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Chưa xác định',
  PRIMARY KEY (`ma_mon_hoc`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mon_hoc`
--

LOCK TABLES `mon_hoc` WRITE;
/*!40000 ALTER TABLE `mon_hoc` DISABLE KEYS */;
INSERT INTO `mon_hoc` VALUES (1,'CT100','Nhập môn An toàn thông tin',3,'Tất cả','Chưa xác định'),(2,'CT101','Lập trình hướng đối tượng',3,'Tất cả','Chưa xác định'),(3,'CT112','Cấu trúc dữ liệu và giải thuật',3,'Tất cả','Chưa xác định'),(4,'CT176','Mạng máy tính',3,'Tất cả','Chưa xác định'),(5,'CT182','Hệ điều hành',3,'Tất cả','Chưa xác định'),(6,'CT200','Mật mã học',3,'Tất cả','Chưa xác định'),(7,'CT201','An toàn hệ điều hành',3,'Tất cả','Chưa xác định'),(8,'CT202','An toàn mạng máy tính',3,'Tất cả','Chưa xác định'),(9,'CT203','Kiểm thử xâm nhập (Penetration Testing)',3,'Tất cả','Chưa xác định'),(10,'CT204','Pháp lý và đạo đức trong ATTT',3,'Tất cả','Chưa xác định'),(11,'CT205','Ứng dụng Blockchain và An toàn dữ liệu',3,'Tất cả','Chưa xác định'),(12,'CT206','Đồ án chuyên ngành An toàn thông tin',3,'Tất cả','Chưa xác định'),(13,'CNTT01','Phát triển ứng dụng Web',3,'Công nghệ thông tin','Chuyên ngành'),(14,'CNTT02','Quản trị dự án CNTT',3,'Công nghệ thông tin','Chuyên ngành'),(15,'CNTT03','Điện toán đám mây',3,'Công nghệ thông tin','Chuyên ngành'),(16,'CNTT04','Hệ quản trị cơ sở dữ liệu nâng cao',3,'Công nghệ thông tin','Chuyên ngành'),(17,'CNTT05','An toàn hệ thống thông tin',3,'Công nghệ thông tin','Chuyên ngành'),(18,'KTPM01','Kiểm thử phần mềm',3,'Kỹ thuật phần mềm','Chuyên ngành'),(19,'KTPM02','Phát triển phần mềm mã nguồn mở',3,'Kỹ thuật phần mềm','Chuyên ngành'),(20,'KTPM03','Kiến trúc phần mềm',3,'Kỹ thuật phần mềm','Chuyên ngành'),(21,'KTPM04','Phân tích và thiết kế hệ thống',3,'Kỹ thuật phần mềm','Chuyên ngành'),(22,'KTPM05','Quản lý dự án phần mềm',3,'Kỹ thuật phần mềm','Chuyên ngành'),(23,'HTTT01','Hệ thống thông tin quản lý',3,'Hệ thống thông tin','Chuyên ngành'),(24,'HTTT02','Hệ thống thông tin địa lý',3,'Hệ thống thông tin','Chuyên ngành'),(25,'HTTT03','Cơ sở dữ liệu NoSQL',3,'Hệ thống thông tin','Chuyên ngành'),(26,'HTTT04','Blockchain và ứng dụng',3,'Hệ thống thông tin','Chuyên ngành'),(27,'HTTT05','Web ngữ nghĩa và ứng dụng',3,'Hệ thống thông tin','Chuyên ngành'),(28,'KHMT01','Máy học ứng dụng',3,'Khoa học máy tính','Chuyên ngành'),(29,'KHMT02','Xử lý ảnh và Thị giác máy tính',3,'Khoa học máy tính','Chuyên ngành'),(30,'KHMT03','Khai thác dữ liệu lớn',3,'Khoa học máy tính','Chuyên ngành'),(31,'KHMT04','Hệ thống hỏi đáp thông minh',3,'Khoa học máy tính','Chuyên ngành'),(32,'KHMT05','Đồ họa máy tính',3,'Khoa học máy tính','Chuyên ngành'),(33,'MMT01','Quản trị mạng',3,'Mạng máy tính và truyền thông dữ liệu','Chuyên ngành'),(34,'MMT02','An ninh mạng',3,'Mạng máy tính và truyền thông dữ liệu','Chuyên ngành'),(35,'MMT03','Lập trình mạng',3,'Mạng máy tính và truyền thông dữ liệu','Chuyên ngành'),(36,'MMT04','Điện toán đám mây và IoT',3,'Mạng máy tính và truyền thông dữ liệu','Chuyên ngành'),(37,'MMT05','Thiết kế và triển khai hạ tầng mạng',3,'Mạng máy tính và truyền thông dữ liệu','Chuyên ngành'),(38,'AI01','Nền tảng Trí tuệ nhân tạo',3,'Trí tuệ nhân tạo','Chuyên ngành'),(39,'AI02','Học máy và ứng dụng',3,'Trí tuệ nhân tạo','Chuyên ngành'),(40,'AI03','Học sâu',3,'Trí tuệ nhân tạo','Chuyên ngành'),(41,'AI04','Xử lý ngôn ngữ tự nhiên',3,'Trí tuệ nhân tạo','Chuyên ngành'),(42,'AI05','Hệ thống gợi ý',3,'Trí tuệ nhân tạo','Chuyên ngành'),(43,'TT01','Thiết kế đồ họa ứng dụng',3,'Truyền thông đa phương tiện','Chuyên ngành'),(44,'TT02','Thiết kế quảng cáo truyền hình',3,'Truyền thông đa phương tiện','Chuyên ngành'),(45,'TT03','Xây dựng trò chơi đa phương tiện',3,'Truyền thông đa phương tiện','Chuyên ngành'),(46,'TT04','Hệ thống quản trị nội dung',3,'Truyền thông đa phương tiện','Chuyên ngành'),(47,'TT05','Quản trị dự án Truyền thông đa phương tiện',3,'Truyền thông đa phương tiện','Chuyên ngành'),(48,'ATTT01','Mật mã học',3,'An toàn thông tin','Chuyên ngành'),(49,'ATTT02','An toàn hệ điều hành',3,'An toàn thông tin','Chuyên ngành'),(50,'ATTT03','Kiểm thử xâm nhập',3,'An toàn thông tin','Chuyên ngành'),(51,'ATTT04','Pháp lý và đạo đức trong ATTT',3,'An toàn thông tin','Chuyên ngành'),(52,'ATTT05','Đồ án chuyên ngành An toàn thông tin',3,'An toàn thông tin','Chuyên ngành');
/*!40000 ALTER TABLE `mon_hoc` ENABLE KEYS */;
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
  `trang_thai` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'hoat_dong',
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  `nguoi_tao` int NOT NULL,
  `ma_loai_nhom` int DEFAULT NULL,
  `ten_mon_hoc` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `linh_vuc` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mo_ta_de_tai` text COLLATE utf8mb4_unicode_ci,
  `muc_tieu` text COLLATE utf8mb4_unicode_ci,
  `so_thanh_vien_toi_thieu` int DEFAULT '2',
  `ma_mon_hoc` int DEFAULT NULL,
  PRIMARY KEY (`ma_nhom`),
  KEY `nguoi_tao` (`nguoi_tao`),
  CONSTRAINT `nhom_hoc_ibfk_1` FOREIGN KEY (`nguoi_tao`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nhom_hoc`
--

LOCK TABLES `nhom_hoc` WRITE;
/*!40000 ALTER TABLE `nhom_hoc` DISABLE KEYS */;
INSERT INTO `nhom_hoc` VALUES (1,'Nhóm AI - Đồ án Chatbot','Làm chatbot AI','Offline','Thư viện',5,1,NULL,'hoat_dong','2026-10-23 09:28:50',1,NULL,NULL,NULL,NULL,NULL,2,NULL),(2,'Nhóm ML - Dự đoán giá nhà','Nghiên cứu ML','Online','Google Meet',4,1,NULL,'hoat_dong','2026-10-23 09:28:50',1,NULL,NULL,NULL,NULL,NULL,2,NULL),(3,'Nhóm học ATTT','','Offline','Thư viện',10,2,NULL,'da_giai_tan','2026-10-23 10:37:48',2,NULL,'ATTT','Tin Học','','',2,NULL),(4,'Nhóm học ATTT','','Offline','Thư viện',10,2,NULL,'hoat_dong','2026-10-23 10:46:52',2,NULL,'Nhập môn An toàn thông tin','An toàn thông tin','','',2,1),(5,'Nhóm học ATTT','','Offline','Thư viện',10,1,NULL,'hoat_dong','2026-10-23 10:54:45',2,NULL,'Nhập môn An toàn thông tin','An toàn thông tin','','',2,1),(6,'Nhóm Mật Mã Học','','Offline','Thư viện',10,1,NULL,'hoat_dong','2026-10-23 15:33:46',2,NULL,'Mật mã học','An toàn thông tin','','',2,6),(7,'Nhóm mạng MT','','Offline','Thư viện',10,1,NULL,'hoat_dong','2026-10-23 15:36:53',2,NULL,'Mạng máy tính','An toàn thông tin','','',2,4);
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
  `nien_khoa` int DEFAULT NULL,
  `gpa` float DEFAULT NULL,
  `muc_tieu_hoc_tap` text COLLATE utf8mb4_unicode_ci,
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
INSERT INTO `sinh_vien` VALUES (1,'SV001','Nguyễn Văn Test','CNTT-K68',NULL,NULL,NULL,5.00,'000000000000000000000',NULL,'Khoa học máy tính',NULL,NULL,NULL),(2,'SV888','Nguyễn Thị Test','',NULL,'http://localhost:8000/uploads/432c2464c01c4873bcc098214086aace.jpg','hello',4.00,'110010111010010010011','2026-10-31 19:02:08','Kỹ thuật phần mềm',50,3.02,''),(3,'test1111@gmail.com','Nguyễn Văn Test','',NULL,'http://localhost:8000/uploads/52c3c50e5191456eb227894b6f8529db.jpg','',5.00,'010011011010010010010','2026-11-01 02:18:25','Công nghệ thông tin',49,0,''),(4,'B2410222','Nguyễn Văn Hai',NULL,NULL,'http://localhost:8000/uploads/3ea16b8cb6634f939d3370e8852bf892.jpg',NULL,5.00,'000000000000000000000',NULL,NULL,NULL,NULL,NULL),(5,'ADMIN001','Quản trị viên 1',NULL,NULL,NULL,NULL,5.00,'000000000000000000000',NULL,NULL,NULL,NULL,NULL),(6,'ADMIN002','Quản trị viên 2',NULL,NULL,NULL,NULL,5.00,'000000000000000000000',NULL,NULL,NULL,NULL,NULL),(7,'ADMIN003','Quản trị viên 3',NULL,NULL,NULL,NULL,5.00,'000000000000000000000',NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `sinh_vien` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `so_thich`
--

DROP TABLE IF EXISTS `so_thich`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `so_thich` (
  `ma_so_thich` int NOT NULL AUTO_INCREMENT,
  `ten_so_thich` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`ma_so_thich`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `so_thich`
--

LOCK TABLES `so_thich` WRITE;
/*!40000 ALTER TABLE `so_thich` DISABLE KEYS */;
INSERT INTO `so_thich` VALUES (1,'Bảo mật / Hacking'),(2,'Lập trình thi đấu'),(3,'Nghiên cứu khoa học'),(4,'UI/UX Design'),(5,'Âm nhạc'),(6,'Thể thao'),(7,'Game'),(8,'Khởi nghiệp');
/*!40000 ALTER TABLE `so_thich` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `so_thich_sinh_vien`
--

DROP TABLE IF EXISTS `so_thich_sinh_vien`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `so_thich_sinh_vien` (
  `ma_tai_khoan` int NOT NULL,
  `ma_so_thich` int NOT NULL,
  PRIMARY KEY (`ma_tai_khoan`,`ma_so_thich`),
  KEY `stsv_ibfk_2` (`ma_so_thich`),
  CONSTRAINT `stsv_ibfk_1` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `sinh_vien` (`ma_tai_khoan`) ON DELETE CASCADE,
  CONSTRAINT `stsv_ibfk_2` FOREIGN KEY (`ma_so_thich`) REFERENCES `so_thich` (`ma_so_thich`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `so_thich_sinh_vien`
--

LOCK TABLES `so_thich_sinh_vien` WRITE;
/*!40000 ALTER TABLE `so_thich_sinh_vien` DISABLE KEYS */;
INSERT INTO `so_thich_sinh_vien` VALUES (2,1),(3,1),(2,3);
/*!40000 ALTER TABLE `so_thich_sinh_vien` ENABLE KEYS */;
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
  `loai_tai_khoan` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` enum('hoat_dong','bi_khoa') COLLATE utf8mb4_unicode_ci DEFAULT 'hoat_dong',
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  `lan_dang_nhap_cuoi` datetime DEFAULT NULL,
  `otp_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `otp_expiry` datetime DEFAULT NULL,
  PRIMARY KEY (`ma_tai_khoan`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `ten_dang_nhap` (`ten_dang_nhap`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tai_khoan`
--

LOCK TABLES `tai_khoan` WRITE;
/*!40000 ALTER TABLE `tai_khoan` DISABLE KEYS */;
INSERT INTO `tai_khoan` VALUES (1,NULL,'123','test@gmail.com','sinh_vien','hoat_dong','2026-10-23 09:28:50',NULL,NULL,NULL),(2,NULL,'$2b$12$4RyMHRpwna2RdJBibrWFLuLCPZKpg.Wrw5eRgugPZ5Op4Ao.qBXiS','test888@gmail.com','sinh_vien','hoat_dong',NULL,NULL,NULL,NULL),(3,NULL,'$2b$12$/.DTCa4rWLVS8n8yTgAqj.E1hMVOFUmyN70.booqXlCCDneqvWwYm','test1111@gmail.com','sinh_vien','hoat_dong',NULL,NULL,NULL,NULL),(4,NULL,'$2b$12$xWAWOq2a6mlHytJeLrPqYeLWNgrkXSUfcIy4gv2o5lE2UhOO9JMD6','test222@gmail.com','sinh_vien','hoat_dong',NULL,NULL,NULL,NULL),(5,NULL,'$2b$12$V5Xu4ZeGaxkZUg5iJ.EAge6zMRvJrDO2GYxo6QSGXmPRmTcsReppS','admin1@studygroup.com','admin','hoat_dong',NULL,NULL,NULL,NULL),(6,NULL,'$2b$12$V5Xu4ZeGaxkZUg5iJ.EAge6zMRvJrDO2GYxo6QSGXmPRmTcsReppS','admin2@studygroup.com','admin','hoat_dong',NULL,NULL,NULL,NULL),(7,NULL,'$2b$12$V5Xu4ZeGaxkZUg5iJ.EAge6zMRvJrDO2GYxo6QSGXmPRmTcsReppS','admin3@studygroup.com','admin','hoat_dong',NULL,NULL,NULL,NULL);
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
INSERT INTO `thanh_vien_nhom` VALUES (3,2,'truong_nhom','2026-10-23 10:37:48',NULL),(3,3,'thanh_vien','2026-10-31 18:21:01','hoat_dong'),(4,2,'truong_nhom','2026-10-23 10:46:52',NULL),(4,4,'thanh_vien','2026-11-01 02:13:48','hoat_dong'),(5,2,'truong_nhom','2026-10-23 10:54:45',NULL),(6,2,'truong_nhom','2026-10-23 15:33:46',NULL),(7,2,'truong_nhom','2026-10-23 15:36:53',NULL);
/*!40000 ALTER TABLE `thanh_vien_nhom` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tin_nhan`
--

DROP TABLE IF EXISTS `tin_nhan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tin_nhan` (
  `ma_tin_nhan` int NOT NULL AUTO_INCREMENT,
  `ma_nhom` int NOT NULL,
  `nguoi_gui` int NOT NULL,
  `noi_dung` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ngay_gui` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_tin_nhan`),
  KEY `ma_nhom` (`ma_nhom`),
  KEY `nguoi_gui` (`nguoi_gui`),
  CONSTRAINT `tin_nhan_ibfk_1` FOREIGN KEY (`ma_nhom`) REFERENCES `nhom_hoc` (`ma_nhom`) ON DELETE CASCADE,
  CONSTRAINT `tin_nhan_ibfk_2` FOREIGN KEY (`nguoi_gui`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tin_nhan`
--

LOCK TABLES `tin_nhan` WRITE;
/*!40000 ALTER TABLE `tin_nhan` DISABLE KEYS */;
INSERT INTO `tin_nhan` VALUES (1,4,2,'hello','2026-11-01 00:48:08'),(2,4,2,'hi','2026-11-01 00:48:30'),(3,4,3,'chào bạn','2026-11-01 00:53:55'),(4,4,4,'hello ae','2026-11-01 02:14:05'),(5,4,2,'hello','2026-11-04 19:54:02');
/*!40000 ALTER TABLE `tin_nhan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `yeu_cau_ho_tro`
--

DROP TABLE IF EXISTS `yeu_cau_ho_tro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `yeu_cau_ho_tro` (
  `ma_ho_tro` int NOT NULL AUTO_INCREMENT,
  `nguoi_gui` int DEFAULT NULL,
  `tieu_de` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `noi_dung` text COLLATE utf8mb4_unicode_ci,
  `trang_thai` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'cho_xu_ly',
  `phan_hoi` text COLLATE utf8mb4_unicode_ci,
  `ngay_gui` datetime DEFAULT CURRENT_TIMESTAMP,
  `ngay_xu_ly` datetime DEFAULT NULL,
  `loai_su_co` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Khác',
  PRIMARY KEY (`ma_ho_tro`),
  KEY `nguoi_gui` (`nguoi_gui`),
  CONSTRAINT `yeu_cau_ho_tro_ibfk_1` FOREIGN KEY (`nguoi_gui`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `yeu_cau_ho_tro`
--

LOCK TABLES `yeu_cau_ho_tro` WRITE;
/*!40000 ALTER TABLE `yeu_cau_ho_tro` DISABLE KEYS */;
INSERT INTO `yeu_cau_ho_tro` VALUES (1,2,'Lỗi không đổi được mật khẩu','Không đổi được mật khẩu','da_xu_ly','ok','2026-11-05 20:24:15','2026-11-05 20:36:40','Khác');
/*!40000 ALTER TABLE `yeu_cau_ho_tro` ENABLE KEYS */;
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
  `trang_thai` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'cho_duyet',
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  `nguoi_duyet` int DEFAULT NULL,
  `ly_do_tu_choi` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`ma_yeu_cau`),
  KEY `ma_bai_dang` (`ma_bai_dang`),
  KEY `ma_nhom` (`ma_nhom`),
  KEY `nguoi_ung_tuyen` (`nguoi_ung_tuyen`),
  CONSTRAINT `yeu_cau_tham_gia_ibfk_1` FOREIGN KEY (`ma_bai_dang`) REFERENCES `bai_dang_tuyen` (`ma_bai_dang`) ON DELETE CASCADE,
  CONSTRAINT `yeu_cau_tham_gia_ibfk_2` FOREIGN KEY (`ma_nhom`) REFERENCES `nhom_hoc` (`ma_nhom`) ON DELETE CASCADE,
  CONSTRAINT `yeu_cau_tham_gia_ibfk_3` FOREIGN KEY (`nguoi_ung_tuyen`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `yeu_cau_tham_gia`
--

LOCK TABLES `yeu_cau_tham_gia` WRITE;
/*!40000 ALTER TABLE `yeu_cau_tham_gia` DISABLE KEYS */;
INSERT INTO `yeu_cau_tham_gia` VALUES (1,1,1,2,'','cho_duyet','2026-10-23 10:32:36',NULL,NULL),(2,1,1,2,'','cho_duyet','2026-10-23 16:36:51',NULL,NULL),(3,3,3,3,'','da_chap_nhan','2026-10-31 18:11:55',2,NULL),(5,1,1,3,'','cho_duyet','2026-11-01 00:52:22',NULL,NULL),(6,2,2,3,'','cho_duyet','2026-11-01 00:52:24',NULL,NULL),(7,NULL,4,4,'Trưởng nhóm đã mời bạn tham gia nhóm.','da_chap_nhan','2026-11-01 02:13:27',2,NULL),(8,1,1,4,'','cho_duyet','2026-11-04 23:45:23',NULL,NULL),(9,2,2,4,'','cho_duyet','2026-11-04 23:45:25',NULL,NULL),(10,7,7,2,'','cho_duyet','2026-11-04 23:47:45',NULL,NULL),(11,7,7,4,'','cho_duyet','2026-11-04 23:49:15',NULL,NULL),(12,7,7,3,'Xin chào bạn cho mình vào với','cho_duyet','2026-11-04 23:54:49',NULL,NULL);
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

-- Dump completed on 2026-11-05 21:54:59
