NMINHIOS — PERSONAL LINK BIO / AURORA EDITION

Đây là website link bio cá nhân dạng tĩnh. Giao diện đã được làm mới theo phong cách Aurora / Neon Glass, ưu tiên hiển thị đẹp trên điện thoại và desktop.

CÁC TỆP ĐƯỢC ĐẶT CÙNG MỘT CẤP:
- index.html        Trang bio chính
- style.css         Giao diện, responsive và hiệu ứng
- script.js         Hiệu ứng, tương tác, chia sẻ và playlist SoundCloud
- config.js         Avatar, liên kết cá nhân và 2 bài nhạc
- cover.webp        Ảnh nền
- cover-poster.jpg  Ảnh nền tĩnh dự phòng
- favicon.svg       Icon trình duyệt
- robots.txt        Quy tắc crawler

PLAYLIST SOUNDCloud:
1. JACK - J97 (Remix): link SoundCloud thứ nhất bạn cung cấp.
2. Thương Nhau Đến Thế (Remix): link SoundCloud thứ hai bạn cung cấp.

Khi bài 1 phát hết, trình phát tự chuyển sang bài 2. Khi bài 2 kết thúc, playlist quay lại bài 1 và tiếp tục lặp. Nút nhạc nổi ở góc dưới phải dùng để bật/tạm dừng và hiển thị thứ tự bài hiện tại.

Lưu ý: Safari/iPhone và một số trình duyệt chặn autoplay có âm thanh. Website vẫn thử tự phát; khi bị chặn, chạm nút NHẠC NỀN hoặc chạm vào trang một lần để cho phép phát. Việc chuyển bài tự động cần SoundCloud tải được bài và Widget API.

CHỈNH SỬA LIÊN KẾT:
Mở config.js và sửa URL tương ứng trong object links, avatar hoặc mảng music.tracks. Không cần sửa HTML/CSS.

CÁCH ĐƯA LÊN GITHUB PAGES:
1. Giải nén ZIP.
2. Upload toàn bộ 9 tệp nằm trực tiếp trong thư mục vào repository GitHub.
3. Chọn Commit changes.
4. Vào Settings > Pages.
5. Chọn Deploy from a branch, branch main và folder /(root), rồi Save.

HIỆU ỨNG:
Nền vũ trụ nhiều lớp, aurora, hạt sáng canvas, đường tiến độ cuộn, thẻ kính đổi ánh sáng theo con trỏ, avatar quỹ đạo, hiệu ứng reveal, hover/ripple, gradient glint, nút nhạc animated và bố cục responsive. Người bật Reduce Motion sẽ được giảm animation.

BẢO MẬT:
Đây là website tĩnh. Mã nguồn và liên kết hiển thị công khai cho khách truy cập. Không đặt mật khẩu, token hoặc API secret trong các tệp này.


KIỂM TRA BẢN BUILD:
- Đã kiểm tra cú pháp JavaScript bằng Node.js.
- Đã phân tích stylesheet: không có lỗi cú pháp CSS cấp stylesheet.
- Đã kiểm tra HTML: không có ID trùng; các tệp CSS/JS/favicon nội bộ đều tồn tại.
- Đã kiểm tra ZIP: tất cả mục trong archive đọc/giải nén được.
- Đã mô phỏng SoundCloud Widget API: bài 1 -> bài 2 -> bài 1; nhãn track và lệnh phát được cập nhật đúng.
- Chưa thể xác nhận phát nhạc thực tế trên mọi thiết bị/tài khoản vì SoundCloud, quyền autoplay và kết nối mạng phụ thuộc trình duyệt của khách truy cập.
