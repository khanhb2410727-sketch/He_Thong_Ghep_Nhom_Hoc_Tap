# Hệ thống ghép nhóm học tập StudyGroup

Đồ án môn học: [Điền tên môn học]
Sinh viên thực hiện: Phan Duy Khánh - B2410727
Lớp: [Điền tên lớp]

## Giới thiệu
Đây là hệ thống giúp sinh viên tìm kiếm và ghép nhóm học tập. Hệ thống sẽ tự động tính điểm tương thích dựa trên lịch rảnh, kỹ năng, GPA, điểm uy tín và sở thích để gợi ý những nhóm phù hợp nhất.

## Công nghệ sử dụng
- Backend: Python, FastAPI, SQLAlchemy, JWT, WebSockets.
- Frontend: HTML, CSS, JavaScript thuần (không dùng framework).
- Database: MySQL.
- Dịch vụ email: Mailtrap (dùng để test gửi mã OTP).

## Hướng dẫn chạy chương trình

Bước 1: Cài đặt Database
- Mở MySQL Workbench, tạo database với tên: he_thong_ghep_nhom_hoc_tap
- Import file CSDL.sql (nằm ở thư mục gốc) vào database vừa tạo.
- Mở file backend/database.py, sửa lại user và password MySQL cho đúng với máy của bạn.

Bước 2: Chạy Backend
Mở terminal, di chuyển vào thư mục backend và chạy các lệnh sau:

cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

Backend sẽ chạy ở cổng 8000.

Bước 3: Chạy Frontend
- Mở thư mục frontend.
- Chạy file index.html (khuyên dùng Live Server trên VSCode).

## Tài khoản test (dành cho giảng viên)
Dùng các tài khoản này để test tính năng phân quyền:

Quản trị viên:
- Email: admin1@studygroup.com
- Mật khẩu: admin123

Sinh viên:
- Email: test888@gmail.com
- Mật khẩu: 123456