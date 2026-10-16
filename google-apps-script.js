/**
 * ============================================================
 * GOOGLE APPS SCRIPT — Nhận dữ liệu học viên từ DHDT LMS
 * ============================================================
 *
 * CÁCH CÀI ĐẶT:
 *  1. Mở Google Sheets muốn lưu danh sách học viên.
 *  2. Vào menu: Extensions → Apps Script.
 *  3. Xóa code mặc định, dán toàn bộ nội dung file này vào.
 *  4. Bấm biểu tượng 💾 (Save).
 *  5. Bấm Deploy → New deployment:
 *       - Type: Web App
 *       - Execute as: Me
 *       - Who has access: Anyone
 *  6. Bấm Deploy → copy URL (dạng https://script.google.com/macros/s/…/exec).
 *  7. Dán URL đó vào Admin → Quản trị hệ thống → Cài đặt → Liên kết Google Sheets.
 *
 * CẤU TRÚC SHEET:
 *  Cột A: STT
 *  Cột B: Mã học viên
 *  Cột C: Họ và tên
 *  Cột D: Khóa học (lớp)
 *  Cột E: Gmail đăng nhập
 *  Cột F: Ngày đăng ký
 * ============================================================
 */

// Tên sheet tab để ghi dữ liệu (đổi nếu cần)
const SHEET_NAME = 'Học viên';

/**
 * Xử lý POST request từ hệ thống DHDT LMS.
 * Payload JSON: { student_code, full_name, class_name, username, registered_at }
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    let sheet   = ss.getSheetByName(SHEET_NAME);

    // Tự động tạo sheet nếu chưa có
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      // Tạo hàng tiêu đề
      sheet.appendRow(['STT', 'Mã học viên', 'Họ và tên', 'Khóa học', 'Gmail đăng nhập', 'Ngày đăng ký']);
      // Định dạng hàng tiêu đề
      const header = sheet.getRange(1, 1, 1, 6);
      header.setFontWeight('bold');
      header.setBackground('#4f46e5');
      header.setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    const lastRow = sheet.getLastRow();
    const stt     = lastRow; // STT = số hàng dữ liệu (bỏ hàng tiêu đề)

    sheet.appendRow([
      stt,
      payload.student_code  || '—',
      payload.full_name     || '',
      payload.class_name    || '',
      payload.username      || '',
      payload.registered_at || new Date().toLocaleString('vi-VN'),
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', row: lastRow + 1 }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Xử lý GET request — dùng để kiểm tra kết nối từ admin.
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'DHDT Sheet Webhook ready.' }))
    .setMimeType(ContentService.MimeType.JSON);
}
