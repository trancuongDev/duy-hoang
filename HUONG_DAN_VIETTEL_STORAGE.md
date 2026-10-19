# Hướng dẫn cấu hình Viettel Cloud Storage

## Đã thay đổi gì?

Toàn bộ upload/download file đã được chuyển từ **Supabase Storage** sang **Viettel Cloud Storage (S3-compatible)**:

| File | Bucket cũ (Supabase) | Bucket mới (Viettel) |
|------|----------------------|----------------------|
| admin.js | `lessons` (video/tài liệu) | `dhdt` |
| admin.js | `files` (file manager) | `dhdt` |
| student.js | `lessons` (xem video/tài liệu) | `dhdt` |
| homework.html | `homework-images` (ảnh bài tập) | `dhdt` |

**Lưu ý:** Database (bảng students, classes, lessons...) **vẫn giữ nguyên trên Supabase**.

---

## ⚠️ BẮT BUỘC: Cấu hình CORS cho bucket

Browser cần gửi request trực tiếp lên Viettel S3 → phải bật CORS.

### Cách cấu hình trên Viettel Cloud Console:

1. Đăng nhập vào **Viettel IDC Console** → **Cloud Object Storage**
2. Chọn bucket **`chdt`**
3. Vào tab **"Cấu hình"** hoặc **"CORS"**
4. Thêm CORS policy sau:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>*</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>DELETE</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <MaxAgeSeconds>3600</MaxAgeSeconds>
    <ExposeHeader>ETag</ExposeHeader>
  </CORSRule>
</CORSConfiguration>
```

> **Nếu chỉ muốn cho phép domain cụ thể** (bảo mật hơn), thay `<AllowedOrigin>*</AllowedOrigin>` bằng domain thật:
> `<AllowedOrigin>https://yourdomain.com</AllowedOrigin>`

---

## ⚠️ BẮT BUỘC: Đặt bucket là Public Read

Để học sinh xem được video/tài liệu mà không cần đăng nhập S3:

1. Vào bucket **`chdt`** → tab **"Quyền truy cập"** hoặc **"Bucket Policy"**
2. Thêm policy sau để cho phép đọc công khai:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::dhdt/*"
    }
  ]
}
```

---

## Cấu hình trong code (đã thiết lập sẵn)

File `viettel-storage.js` đã có thông tin:
- **Endpoint:** `https://s3-north1.viettelidc.com.vn`
- **Access Key:** `037300543b09f3537bf2`
- **Secret Key:** (đã cấu hình)
- **Bucket:** `dhdt`
- **Region:** `north1`

---

## Kiểm tra sau khi cấu hình

Mở browser DevTools → Console, thử upload 1 file nhỏ trong admin.  
Nếu thấy lỗi **CORS** → kiểm tra lại bước CORS ở trên.  
Nếu thấy lỗi **403 Forbidden** → kiểm tra lại Access Key / Secret Key.  
Nếu thấy lỗi **404** → kiểm tra tên bucket có đúng là `chdt` không.

---

## File cũ trên Supabase Storage

File cũ đã upload lên Supabase Storage **vẫn truy cập được bình thường** qua URL Supabase — vì URL được lưu trong database (cột `storage_path` và `file_url`). Chỉ **file mới upload** mới đi lên Viettel.

Nếu muốn di chuyển file cũ sang Viettel, cần tải về từ Supabase rồi upload lại lên Viettel và cập nhật URL trong database — có thể làm thủ công hoặc viết script sau.
