# CMS Tử Vi

Trang quản trị (CMS) viết bằng Node.js + Express + MongoDB, dùng để:

1. **Xem lá số đã tạo** — đọc dữ liệu từ collection `tuvi.laso_history`, hiển thị danh sách và sinh link click-to-open đến trang tử vi để xem lá số ngay.
2. **Quản lý thư viện "Học Tử Vi"** — đăng/sửa/xóa bài viết dài về tử vi (kinh nghiệm các trường phái, chia sẻ cá nhân, v.v.). Nội dung lưu xuống MongoDB dạng văn bản dài, hỗ trợ paste nội dung lớn.
3. **Đăng nhập có bảo mật** — mật khẩu được hash bằng bcrypt, session lưu trong MongoDB.

## Yêu cầu

- Node.js 18+
- Tài khoản MongoDB Atlas (đã cấu hình sẵn trong `.env`)

## Cài đặt

```bash
npm install
```

Mở `.env` và chỉnh các biến (đặc biệt là `SESSION_SECRET` và `TUVI_BASE_URL`):

```dotenv
MONGODB_URI=mongodb+srv://...        # Connection string Atlas
SESSION_SECRET=<chuỗi ngẫu nhiên dài>
PORT=4000
TUVI_BASE_URL=http://localhost:3000  # URL của trang tử vi để ghép với link
ADMIN_USERNAME=admin
ADMIN_DEFAULT_PASSWORD=Tuvi@2025
```

## Chạy

```bash
npm start          # production
npm run dev        # auto-reload (node --watch)
```

Mở: <http://localhost:4000>

**Tài khoản mặc định**: `admin` / `Tuvi@2025`
→ Sau khi đăng nhập lần đầu, vào **Đổi mật khẩu** ở góc phải để đổi ngay.

## Cấu trúc

```
admin-tu-vi/
├── server.js              # Entry point: Express + session + routes + seed admin
├── config/db.js           # Kết nối Mongoose tới database "tuvi"
├── models/
│   ├── User.js            # Collection cms_users (bcrypt password hash)
│   ├── Article.js         # Collection cms_articles (bài viết Học Tử Vi)
│   └── Laso.js            # Map collection laso_history (read-only)
├── middleware/auth.js     # requireLogin + injectUser (locals)
├── routes/
│   ├── auth.js            # /login, /logout, /change-password
│   ├── laso.js            # /laso (list, detail)
│   └── articles.js        # /articles (CRUD)
├── views/                 # EJS templates
└── public/css/style.css   # Style
```

## Collections trong MongoDB (database `tuvi`)

| Collection      | Mô tả                                                     |
|-----------------|-----------------------------------------------------------|
| `laso_history`  | (đã có sẵn) Lịch sử lá số đã tạo từ trang tử vi.          |
| `cms_users`     | Tài khoản đăng nhập CMS, password hash bằng bcrypt cost 12. |
| `cms_articles`  | Bài viết "Học Tử Vi".                                     |
| `cms_sessions`  | Session lưu bởi `connect-mongo`, TTL 7 ngày.              |

## Bảo mật

- Mật khẩu hash bằng **bcrypt** (cost 12) — không lưu plain-text.
- Session lưu MongoDB qua `connect-mongo`, cookie `httpOnly` + `sameSite=lax`.
- Trên production, đặt `cookie.secure = true` (đang để `false` cho local). Sửa trong `server.js` khi deploy có HTTPS.
- Đổi `SESSION_SECRET` thành chuỗi ngẫu nhiên đủ dài trước khi deploy.
- Đổi `ADMIN_DEFAULT_PASSWORD` ngay sau khi cài (qua trang `/change-password`).

## Tính năng lá số

- Danh sách `/laso` có tìm kiếm theo họ tên / IP / link, phân trang.
- Mỗi dòng có 2 nút:
  - **Chi tiết** → mở trang `/laso/:id` xem toàn bộ input.
  - **Xem lá số ↗** → mở `TUVI_BASE_URL + link` ở tab mới, hiển thị lá số ngay trên trang tử vi.

## Tính năng Học Tử Vi

- `/articles` — danh sách, tìm kiếm, phân trang.
- `/articles/new` — đăng bài (title, trường phái, tags, summary, nội dung).
- Nội dung lưu dưới dạng text (whitespace preserved khi hiển thị). Phù hợp paste nội dung dài.
- Sửa/Xóa từ trang chi tiết bài viết.
- Tự sinh `slug` từ tiêu đề (loại bỏ dấu, không trùng).

## Mở rộng sau này

- Thêm trình soạn thảo WYSIWYG (TinyMCE / Quill) khi cần định dạng phong phú.
- Upload hình ảnh (chưa cần theo yêu cầu hiện tại).
- Thêm role `editor`, phân quyền chi tiết.
- API JSON cho frontend khác đọc bài viết.
# cms-tu-vi
