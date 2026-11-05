# Hệ Thống Ghép Nhóm Học Tập (StudyGroup)

**Thông tin tác giả:**
*   **Họ và tên:** Phan Duy Khánh
*   **Mã sinh viên:** B2410727

---

Dự án xây dựng nền tảng hỗ trợ sinh viên tìm kiếm và kết nối nhóm học tập. Hệ thống cung cấp thuật toán tự động tính điểm tương thích giữa người dùng và nhóm dựa trên các tiêu chí: lịch rảnh, kỹ năng, điểm GPA, điểm uy tín và sở thích cá nhân.

## Công nghệ sử dụng

**Backend:**
*   Ngôn ngữ: Python
*   Framework: FastAPI
*   ORM: SQLAlchemy
*   Xác thực: JWT (JSON Web Token), Passlib (Bcrypt)
*   Giao tiếp thời gian thực: WebSockets
*   Dịch vụ Email: SMTP (tích hợp Mailtrap cho môi trường phát triển)

**Frontend:**
*   HTML5, CSS3
*   JavaScript (ES6+), Fetch API

**Cơ sở dữ liệu:**
*   MySQL

## Chức năng hệ thống

Hệ thống được chia thành các phân hệ chính:

1.  **Xác thực và Phân quyền:** Đăng ký, đăng nhập cho Sinh viên và Quản trị viên. Khôi phục mật khẩu qua mã OTP gửi về email. Phân quyền truy cập nghiêm ngặt giữa các vai trò.
2.  **Ghép nhóm và Tìm kiếm:** Tính điểm tương thích tự động. Bộ lọc tìm kiếm nhóm theo môn học, lĩnh vực. Gợi ý danh sách nhóm phù hợp nhất với hồ sơ người dùng.
3.  **Quản lý Nhóm:** Khởi tạo nhóm, đăng bài tuyển thành viên, duyệt/từ chối yêu cầu tham gia, mời thành viên qua MSSV. Tự động giải tán nhóm hoặc chuyển nhượng quyền trưởng nhóm khi cần thiết.
4.  **Tương tác và Lịch trình:** Chat nội bộ thời gian thực. Quản lý lịch họp, deadline công việc và thống kê khung giờ rảnh chung của cả nhóm.
5.  **Đánh giá và Uy tín:** Đánh giá chéo giữa các thành viên sau khi kết thúc nhóm. Hệ thống tự động tính điểm uy tín. Hỗ trợ gửi khiếu nại kèm minh chứng nếu điểm bị sai lệch.
6.  **Quản trị Hệ thống:** Xử lý báo cáo vi phạm (khóa tài khoản, gỡ bài đăng). Tiếp nhận và phản hồi yêu cầu hỗ trợ kỹ thuật từ sinh viên.

## Hướng dẫn cài đặt

### 1. Yêu cầu hệ thống
*   Python (>= 3.9)
*   MySQL Server & MySQL Workbench

### 2. Thiết lập Cơ sở dữ liệu
1. Khởi động MySQL Server.
2. Tạo cơ sở dữ liệu trống với tên: `he_thong_ghep_nhom_hoc_tap`.
3. Import file `CSDL.sql` (tại thư mục gốc của dự án) vào cơ sở dữ liệu vừa tạo để khởi tạo cấu trúc bảng và dữ liệu mẫu.
4. Mở file `backend/database.py`, cập nhật thông tin `user` và `password` để kết nối với MySQL cục bộ.

### 3. Khởi chạy Backend
Mở Terminal tại thư mục gốc của dự án và thực hiện:

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Đối với Windows
# source venv/bin/activate  # Đối với macOS/Linux

pip install -r requirements.txt
uvicorn main:app --reload