# Cơ chế tính điểm tương thích hệ thống ghép nhóm
Điểm tương thích (từ 0% đến 100%) được tính dựa trên 5 tiêu chí với trọng số tương ứng. Dưới đây là chi tiết cách cho điểm trong các trường hợp cụ thể.
## 1. Lịch rảnh (Trọng số: 40%)
Hệ thống tổng hợp lịch rảnh của các thành viên hiện tại để tìm ra khung giờ chung của nhóm.
Các trường hợp cho điểm:
- Trùng khớp hoàn toàn: Điểm tối đa (100%).
- Trùng khớp một phần: Điểm bằng tỷ lệ giữa số buổi trùng khớp và tổng số buổi có thể họp chung.
- Một trong hai bên chưa cập nhật lịch: Điểm mặc định là 50%.
## 2. Kỹ năng (Trọng số: 25%)
Hệ thống đối chiếu kỹ năng sinh viên khai báo với kỹ năng nhóm yêu cầu.
Các trường hợp cho điểm:
- Đáp ứng đủ yêu cầu: Điểm tối đa.
- Đáp ứng một phần: Điểm bằng tỷ lệ giữa số kỹ năng đáp ứng và tổng số kỹ năng nhóm cần.
- Nhóm không yêu cầu kỹ năng: Điểm tối đa.
- Sinh viên không có kỹ năng nào: 0 điểm.
## 3. Học vấn (Trọng số: 15%)
Điểm số dựa trên GPA và Chuyên ngành.
Các trường hợp cho điểm:
- GPA lớn hơn hoặc bằng yêu cầu: Điểm tối đa.
- GPA thấp hơn yêu cầu: Điểm bằng tỷ lệ (GPA sinh viên / GPA yêu cầu).
- Nhóm không yêu cầu GPA: Điểm tối đa.
- Sinh viên cùng chuyên ngành: Điểm cao hơn so với trái ngành.
## 4. Điểm uy tín (Trọng số: 10%)
Điểm này phản ánh lịch sử làm việc nhóm.
Các trường hợp cho điểm:
- Sinh viên mới chưa có đánh giá: Mặc định 5.0/5.0 (Điểm tối đa).
- Sinh viên có lịch sử đánh giá: Điểm bằng (Điểm uy tín hiện tại / 5.0).
## 5. Sở thích (Trọng số: 10%)
Hệ thống đối chiếu các thẻ sở thích của sinh viên với thẻ sở thích nhóm tìm kiếm.
Các trường hợp cho điểm:
- Trùng khớp thẻ sở thích: Điểm bằng tỷ lệ giữa số thẻ trùng và tổng số thẻ nhóm cần.
- Nhóm không yêu cầu sở thích: Điểm tối đa.
- Sinh viên không khai báo sở thích: 0 điểm.
## Ý nghĩa điểm số
Điểm tương thích từ 80% trở lên được xem là rất phù hợp để ứng tuyển vào nhóm.