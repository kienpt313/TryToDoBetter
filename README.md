# Lịch học PhD (IELTS + Graph + AI y sinh)

Trang web nhỏ để xem việc hằng ngày trên điện thoại và máy tính.

## Mở nhanh trên máy này

Trong thư mục project:

```bash
npx --yes serve .
```

Rồi mở địa chỉ in ra (thường là `http://localhost:3000`).

Hoặc double-click `index.html` — một số trình duyệt hạn chế PWA khi mở file local, nên cách `serve` ổn định hơn.

## Xem trên mọi thiết bị (cùng một link)

Đưa cả thư mục lên **GitHub Pages**, **Netlify Drop** (kéo thả folder), hoặc **Cloudflare Pages**. Mở URL đó trên điện thoại và laptop.

Trên điện thoại: Chrome/Safari → **Thêm vào màn hình chính**.

## Đồng bộ tick giữa máy tính và điện thoại

GitHub Pages **không** tự lưu tick. Trong app, tab **Đồng bộ**:

1. Tạo Personal Access Token (classic) với quyền **gist**.
2. Máy tính: dán token → **Tạo kho đồng bộ** → copy mã Gist.
3. Điện thoại: dán cùng token + mã Gist → **Lưu và tải**.

Sau đó tick sẽ tự gộp khi có mạng. Token chỉ nằm trên máy bạn.
