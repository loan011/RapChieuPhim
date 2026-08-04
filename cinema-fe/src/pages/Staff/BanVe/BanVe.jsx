import "./BanVe.css";
import { useState } from "react";
import { useBanVe } from "./useBanVe";
import { MdMovie, MdChair, MdCheckCircle, MdClose, MdSearch, MdRestaurant, MdWarning, MdHourglassTop, MdRefresh } from "react-icons/md";
import "../../../styles/Booking.css";
import TicketExchangeModal from "../../../components/TicketExchangeModal";

/* ── QR Payment Modal with confirmation checkbox ── */
function QrPaymentModal({ paymentQrCode, totalAmount, paymentTicketIds, formatMoney, onCancel, onConfirm }) {
  const BANK_ID = "TPB";
  const ACCOUNT_NO = "15145686888";
  const ACCOUNT_NAME = "Nguyen Quang Vinh";

  return (
    <div className="qr-modal-overlay">
      <div className="qr-modal-card" onClick={(e) => e.stopPropagation()}>
        <button onClick={onCancel} className="qr-close-btn">
          <MdClose />
        </button>

        <h3 className="qr-modal-title">QUÉT MÃ THANH TOÁN QR</h3>
        <p className="qr-modal-subtitle">
          Vui lòng hướng dẫn khách hàng quét mã QR dưới đây để<br />
          thực hiện thanh toán chuyển khoản tại quầy.
        </p>

        {/* QR Code */}
        <div className="qr-image-wrapper">
          <img
            src={
              paymentQrCode.startsWith("data:image") || paymentQrCode.startsWith("http")
                ? paymentQrCode
                : `data:image/png;base64,${paymentQrCode}`
            }
            alt="VietQR Payment"
            className="qr-image"
          />
        </div>

        {/* Thông tin tài khoản */}
        <div className="qr-info-box">
          <div>
            <span className="qr-info-icon">💰</span> Số tiền: <strong>{formatMoney(totalAmount)}đ</strong>
          </div>
          <div>
            <span className="qr-info-icon">🏦</span> Ngân hàng: <strong>TPBank - {ACCOUNT_NO}</strong>
          </div>
          <div>
            <span className="qr-info-icon">👤</span> Chủ TK: <strong>{ACCOUNT_NAME}</strong>
          </div>
          <div>
            <span className="qr-info-icon">📋</span> Nội dung: <strong>DATVE {paymentTicketIds[0]}</strong>
          </div>
        </div>

        {/* Banner trạng thái thanh toán */}
        <div
          style={{
            margin: "14px 0 6px",
            padding: "11px 16px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.9rem",
            fontWeight: 600,
            background: "#fffbeb",
            color: "#b45309",
            border: "1.5px solid #fcd34d",
            textAlign: "left",
          }}
        >
          <MdHourglassTop style={{ fontSize: "1.3rem", flexShrink: 0, animation: "spin 1.5s linear infinite" }} />
          Đang chờ khách hàng quét mã và chuyển khoản...
        </div>

        <p style={{ fontSize: "0.78rem", color: "#9ca3af", textAlign: "center", margin: "2px 0 10px" }}>
          Hệ thống tự động xác nhận khi nhận được thanh toán. Nút xác nhận sẽ mở khóa sau khi nhận tiền.
        </p>

        {/* Action buttons */}
        <div className="qr-modal-actions">
          <button onClick={onCancel} className="qr-btn-cancel">
            HỦY GIAO DỊCH
          </button>
          <button
            disabled={true}
            className="qr-btn-confirm"
          >
            Chờ thanh toán...
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   STUDENT VERIFY MODAL
   Nhân viên xem ảnh thẻ SV + nhập thông tin để xác nhận
   OCR tự động bằng Tesseract.js
════════════════════════════════════════════════════ */

/* ── Helper: trích xuất thông tin từ text OCR ── */
/* ── Phân loại loại thẻ từ text OCR ── */
function classifyCardType(text) {
  const t = text.toLowerCase();

  // Từ khoá CHẮC CHẮN là thẻ nhân viên / thẻ đi làm
  const employeeKeywords = [
    "chức vụ", "chuc vu", "kỹ sư", "ky su", "giám đốc", "giam doc",
    "trưởng phòng", "truong phong", "nhân viên", "nhan vien",
    "ngày làm việc", "ngay lam viec", "ngày vào làm", "date of employment",
    "employee", "staff id", "company", "công ty", "cong ty",
    "phòng ban", "phong ban", "department", "position", "chức danh",
    "đơn vị công tác", "don vi cong tac",
  ];

  // Từ khoá CHẮC CHẮN là CCCD / CMND (thẻ căn cước)
  const cccdKeywords = [
    "căn cước", "can cuoc", "chứng minh nhân dân", "chung minh nhan dan",
    "cmnd", "cccd", "citizen", "quê quán", "que quan",
    "nơi thường trú", "noi thuong tru", "nơi đăng ký ktt",
    "số cccd", "số cmnd", "national id",
  ];

  // Từ khoá PHẢI CÓ để là thẻ SV / HS
  const studentKeywords = [
    "sinh viên", "sinh vien", "student", "học sinh", "hoc sinh",
    "mssv", "mã số sinh viên", "ma so sinh vien",
    "ma hs", "mã hs", "mã học sinh",
    "lớp", "khoa", "ngành", "nganh", "faculty", "major",
    "trường đại học", "truong dai hoc", "đại học", "dai hoc",
    "trường cao đẳng", "truong cao dang", "cao đẳng", "cao dang",
    "trường thpt", "trung học phổ thông", "trung hoc pho thong",
    "học viện", "hoc vien", "university", "college",
    "institute", "viện", "thẻ sinh viên", "the sinh vien",
    "student card", "student id", "school id",
  ];

  // Phát hiện từ khoá xấu
  for (const kw of employeeKeywords) {
    if (t.includes(kw)) return { type: "employee", keyword: kw };
  }
  for (const kw of cccdKeywords) {
    if (t.includes(kw)) return { type: "cccd", keyword: kw };
  }

  // Phát hiện từ khoá tốt
  for (const kw of studentKeywords) {
    if (t.includes(kw)) return { type: "student", keyword: kw };
  }

  return { type: "unknown", keyword: null };
}

function extractStudentInfo(text) {
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  const fullText = lines.join(" ");

  // ── Mã số sinh viên / học sinh ──
  let studentId = "";

  // 1. Ưu tiên tìm theo nhãn định danh đi kèm (Mã SV, MSSV, Mã số, Student ID, Mã học sinh, Mã số SV...)
  // Chấp nhận khoảng trắng rác ở giữa các chữ như "M a S V", "M a SV", "M a s o" do OCR nhận diện lỗi font
  const labeledIdMatch = fullText.match(
    /(?:m\s*[\u00e3a]\s*s\s*v|m\s*[\u00e3a]\s*s\s*[\u1ed1o]|m\s*s\s*s\s*v|s\s*t\s*u\s*d\s*e\s*n\s*t\s*i\s*d|m\s*[\u00e3a]\s*h\s*s|s\s*[\u1ed1o]\s*t\s*h\u1ebb)[:\s]*([A-Z0-9\.\-\/]{5,20})/i
  );
  if (labeledIdMatch) {
    studentId = labeledIdMatch[1].trim().toUpperCase();
  }

  // 2. Nếu không tìm thấy nhãn, tìm tất cả các chuỗi có định dạng mã sinh viên phổ biến
  if (!studentId) {
    const patterns = [
      /\b([BNb][1-2]\d{7,9})\b/,                   // B21DCCN001
      /\b(SV\d{6,10})\b/i,                           // SV001234
      /\b(HS\d{6,10})\b/i,                           // HS001234
      /\b([A-Z]{1,4}\d{1,2}\.\d{2,4}\.\d{2,4})\b/, // TV14.101.282
      /\b([A-Z]{1,3}\d{2,4}[\/\-]\d{2,6})\b/,       // SV21/0045
      /\b([A-Z0-9]{12,16})\b/i,                     // Chuỗi chữ + số hỗn hợp dài 12-16 ký tự (VD: 177D3403010099)
      /\b(\d{12,16})\b/,                            // Chuỗi số dài 12-16 chữ số
      /\b(\d{8,11})\b/,                             // Chuỗi số 8-11 chữ số
      /\b([A-Z0-9]{8,11})\b/i,                      // Chuỗi chữ + số hỗn hợp 8-11 ký tự
      /\b(\d{6,7})\b/,                              // 6-7 chữ số
    ];
    for (const p of patterns) {
      const m = fullText.match(p);
      if (m) { studentId = m[1].toUpperCase(); break; }
    }
  }

  // Chuẩn hoá: nếu có dấu hai chấm rác hoặc khoảng trắng thì làm sạch
  if (studentId) {
    studentId = studentId.replace(/^[:\s\-\.]+/, "").trim();
  }

  // ── Hạn thẻ ──
  let expiryDate = "";

  // 1. Tìm các niên khoá dạng năm (Ví dụ: "2023 - 2027", "Khóa học: 2022-2026", "Hạn dùng: 2027", "Hạn thẻ: 2023 - 2027")
  const yearIntervalMatch = fullText.match(
    /(?:kh[o\u00f3a]*a\s*h[o\u1ecdc]*c|h[a\u1ea1n]*n\s*th[\u1ebb]*e|h[a\u1ea1n]*n\s*d\u00f9ng|valid\s*thru|h[a\u1ea1n]*n|expiry|expires?|h\.l|ni\u00ean\s*kh\u00f3a|nien\s*khoa)[:\s]*\d{4}\s*[\-\u2013\u2014]\s*(20\d{2})/i
  );
  if (yearIntervalMatch) {
    expiryDate = yearIntervalMatch[1]; // Điền trực tiếp: "2027"
  }

  // 2. Tìm định dạng MM/YYYY (Ví dụ: "Hạn dùng: 12/2027")
  if (!expiryDate) {
    const monthYearMatch = fullText.match(
      /(?:h[a\u1ea1n]*n\s*th[\u1ebb]*e|h[a\u1ea1n]*n\s*d\u00f9ng|valid\s*thru|h[a\u1ea1n]*n|expiry|expires?|h\.l|ni\u00ean\s*kh\u00f3a|nien\s*khoa)[:\s]*(\d{1,2})[\/\-\.](20\d{2})/i
    );
    if (monthYearMatch) {
      expiryDate = `${monthYearMatch[1]}/${monthYearMatch[2]}`; // Điền trực tiếp: "12/2027"
    }
  }

  // 3. Ưu tiên: dòng có nhãn cụ thể + DD/MM/YYYY đầy đủ
  if (!expiryDate) {
    const labeledDateMatch = fullText.match(
      /(?:c\u00f3 gi\u00e1 tr\u1ecb[\s\S]{0,10}\u0111\u1ebfn|h[a\u1ea1]n th\u1ebb|h[a\u1ea1]n\s*th\u1ebb|h[a\u1ea1]n\s*d\u00f9ng|h[a\u1ea1n]*n|ng[a\u00e0]y h[\u1ebfe\u1ebf]t h[a\u1ea1]n|expired?|expiry|h\.l|ni\u00ean\s*kh\u00f3a|nien\s*khoa)[:\s]*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/i
    );
    if (labeledDateMatch) {
      expiryDate = `${labeledDateMatch[1]}/${labeledDateMatch[2]}/${labeledDateMatch[3]}`; // Điền: "31/12/2027"
    }
  }

  // 4. Fallback: tìm TẤT CẢ ngày DD/MM/YYYY, loại trừ các ngày sinh và chọn hạn thẻ lớn nhất
  if (!expiryDate) {
    const birthKeywords = /(?:ng\u00e0y sinh|sinh ng\u00e0y|d\.o\.b|dob|birth|n\u0103m sinh)/i;
    const allLines = text.split(/\n/);
    let candidateDates = [];

    for (const line of allLines) {
      if (birthKeywords.test(line)) {
        continue;
      }
      const matches = [...line.matchAll(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/g)];
      for (const m of matches) {
        const d = m[1].padStart(2,"0"), mo = m[2].padStart(2,"0"), y = m[3];
        if (Number(mo) <= 12 && Number(y) >= 2000) {
          candidateDates.push({ iso: `${y}-${mo}-${d}`, display: `${d}/${mo}/${y}` });
        }
      }
    }

    if (candidateDates.length > 0) {
      candidateDates.sort((a, b) => a.iso.localeCompare(b.iso));
      expiryDate = candidateDates[candidateDates.length - 1].display;
    }
  }


  // ── Trường học ──
  let school = "";
  const schoolKeywords = [
    /(?:tr[ươ][ờ]ng|university|college|school|vi[eệ]n|cao đ[ẳa]ng|đ[aạ]i h[oọ]c|học viện)[:\s]+([^\n,;]+)/i,
    /(đ(?:h|ại học)[^\n,;]{3,40})/i,
    /(university of[^\n,;]{3,40})/i,
  ];
  for (const p of schoolKeywords) {
    const m = fullText.match(p);
    if (m) {
      school = m[1].trim().replace(/\s+/g," ");
      break;
    }
  }
  if (!school) {
    for (const line of lines) {
      if (/tr[ươ][ờ]ng|đ[aạ]i\s*h[oọ]c|cao\s*đ[ẳa]ng|vi[eệ]n|university/i.test(line)) {
        school = line.replace(/^(tr[ươ][ờ]ng|trường:|school:)\s*/i, "").trim();
        break;
      }
    }
  }

  // Loại bỏ các phần không mong muốn (hạn thẻ, mssv, lớp, khoa...) bị gom nhầm vào tên trường
  if (school) {
    const cutKeywords = [
      /(?:h[aạ]n\s*th\u1ebb|h\u1ea1n\s*d\u1ee5ng|expiry|valid|h\.l|co\s*gia\s*tri)/i,
      /(?:mssv|m\u00e3\s*s\u1ed1|m\u00e3\s*sv|student\s*id)/i,
      /(?:l\u1edbp|class)/i,
      /(?:khoa|faculty|ng\u00e0nh|major)/i,
      /(?:ng\u00e0y\s*sinh|sinh\s*ng\u00e0y|dob)/i
    ];
    for (const kw of cutKeywords) {
      const idx = school.search(kw);
      if (idx !== -1) {
        school = school.substring(0, idx).trim();
      }
    }
    // Loại bỏ các ký tự thừa ở cuối sau khi cắt
    school = school.replace(/[\-\|:=,\+<\s]+$/, "").trim();
    // Giới hạn độ dài tên trường học tối đa 80 ký tự để tránh nuốt thông tin
    if (school.length > 80) {
      school = school.substring(0, 80).trim();
    }
  }

  return { studentId, expiryDate, school };
}

function StudentVerifyModal({ onConfirm, onCancel, getStudentMonthlyUsage }) {
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [studentId, setStudentId] = useState("");
  const [school, setSchool] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ocrStatus, setOcrStatus] = useState(null); // null | "scanning" | "done" | "failed" | "rejected"
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrLog, setOcrLog] = useState("");
  const [rotation, setRotation] = useState(0); // Xoay 0, 90, 180, 270

  function handleRotate() {
    setRotation(prev => (prev + 90) % 360);
  }

  const hasStudentId = studentId.trim().length > 0;
  const usedCount = hasStudentId ? getStudentMonthlyUsage(studentId.trim()) : 0;
  const remaining = Math.max(0, 3 - usedCount);

  async function runOcr(dataUrl) {
    setOcrStatus("scanning");
    setOcrProgress(0);
    setOcrLog("Đang khởi động OCR...");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("vie+eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setOcrProgress(Math.round((m.progress || 0) * 100));
          }
          if (m.status) setOcrLog(m.status);
        },
      });
      const { data: { text } } = await worker.recognize(dataUrl);
      await worker.terminate();

      // ── Bước 1: Phân loại loại thẻ ──
      const cardType = classifyCardType(text);

      if (cardType.type === "employee") {
        setOcrStatus("rejected");
        setOcrLog(`🚫 Đây là thẻ nhân viên/đi làm (phát hiện: "${cardType.keyword}"). Vui lòng cung cấp đúng thẻ sinh viên hoặc học sinh.`);
        return;
      }

      if (cardType.type === "cccd") {
        setOcrStatus("rejected");
        setOcrLog(`🚫 Đây là CCCD/CMND (phát hiện: "${cardType.keyword}"). Hệ thống chỉ chấp nhận thẻ sinh viên hoặc thẻ học sinh.`);
        return;
      }

      if (cardType.type === "unknown") {
        setOcrStatus("rejected");
        setOcrLog("⚠️ Không nhận ra thẻ sinh viên/học sinh. Vui lòng tải ảnh thẻ sinh viên hoặc thẻ học sinh hợp lệ.");
        return;
      }

      // ── Bước 2: Đúng thẻ SV/HS → trích xuất thông tin ──
      const extracted = extractStudentInfo(text);
      if (extracted.studentId) setStudentId(extracted.studentId);
      if (extracted.expiryDate) setExpiryDate(extracted.expiryDate);
      if (extracted.school) setSchool(s => s || extracted.school);

      setOcrStatus(extracted.studentId ? "done" : "failed");
      setOcrLog(extracted.studentId
        ? `✅ Đọc được MSSV: ${extracted.studentId}`
        : "⚠️ Nhận diện thẻ SV thành công nhưng không đọc được mã số, vui lòng nhập tay."
      );
    } catch (err) {
      console.error("OCR error:", err);
      setOcrStatus("failed");
      setOcrLog("❌ OCR thất bại. Vui lòng nhập thông tin thủ công.");
    }
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    setImageFile(file || null);
    if (!file) return;
    // Reset toàn bộ state cũ trước khi quét ảnh mới
    setStudentId("");
    setSchool("");
    setExpiryDate("");
    setError("");
    setOcrStatus(null);
    setOcrProgress(0);
    setOcrLog("");
    setRotation(0);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setImagePreview(dataUrl);
      setImageUrl(dataUrl);
      runOcr(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    setError("");
    if (!imagePreview) {
      setError("Vui lòng tải ảnh thẻ sinh viên lên để xác minh.");
      return;
    }
    if (!studentId.trim()) {
      setError("Vui lòng nhập mã sinh viên.");
      return;
    }
    if (!expiryDate) {
      setError("Vui lòng nhập hạn sử dụng thẻ.");
      return;
    }

    setIsSubmitting(true);
    const result = onConfirm({ studentId: studentId.trim(), school: school.trim(), expiryDate, imageUrl, imageFile });
    setIsSubmitting(false);
    if (result && !result.ok) {
      setError(result.error);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="sv-modal-overlay" onClick={onCancel}>
      <div className="sv-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sv-modal-header">
          <div className="sv-modal-title">
            <span className="sv-modal-icon">🎓</span>
            <div>
              <h3>Xác Minh Thẻ Sinh Viên</h3>
              <p>Kiểm tra thẻ để áp dụng ưu đãi <strong>-15%</strong> giá vé</p>
            </div>
          </div>
          <button className="sv-modal-close" onClick={onCancel}>✕</button>
        </div>

        {/* Usage badge */}
        <div className={`sv-usage-banner ${
          !hasStudentId ? "sv-usage-idle"
          : remaining === 0 ? "sv-usage-full"
          : remaining === 1 ? "sv-usage-warn"
          : "sv-usage-ok"
        }`}>
          <span className="sv-usage-dots">
            {[0,1,2].map(i => (
              <span key={i} className={`sv-usage-dot ${hasStudentId && i < usedCount ? "used" : ""}`} />
            ))}
          </span>
          <span className="sv-usage-text">
            {!hasStudentId
              ? "ℹ️ Nhập mã sinh viên để kiểm tra lượt sử dụng"
              : remaining === 0
              ? "⛔ Đã dùng hết 3/3 lượt trong tháng này"
              : `✅ Còn ${remaining} lượt trong tháng (đã dùng ${usedCount}/3)`
            }
          </span>
        </div>

        <div className="sv-modal-body">
          {/* Upload ảnh */}
          <div className="sv-upload-section">
            <label className="sv-upload-label" htmlFor="sv-card-img">
              {imagePreview ? (
                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                  <img src={imagePreview} alt="Thẻ sinh viên" className="sv-card-preview" style={{ transform: `rotate(${rotation}deg)` }} />
                  <button type="button" className="sv-rotate-btn" onClick={(e) => { e.preventDefault(); handleRotate(); }}>🔄 Xoay</button>
                </div>
              ) : (
                <div className="sv-upload-placeholder">
                  <span className="sv-upload-icon">📷</span>
                  <span className="sv-upload-hint">Tải ảnh hoặc chụp thẻ sinh viên</span>
                  <span className="sv-upload-sub">JPG, PNG, WEBP</span>
                </div>
              )}
              <input
                id="sv-card-img"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </label>
            {imagePreview && (
              <button
                type="button"
                className="sv-reupload-btn"
                onClick={() => {
                  setImagePreview(""); setImageUrl("");
                  setOcrStatus(null); setOcrProgress(0); setOcrLog("");
                }}
              >
                🔄 Đổi ảnh
              </button>
            )}

            {/* OCR Status */}
            {ocrStatus === "scanning" && (
              <div className="sv-ocr-status scanning">
                <div className="sv-ocr-header">
                  <span className="sv-ocr-spinner" />
                  <span>🔍 Đang quét thẻ sinh viên...</span>
                  <span className="sv-ocr-pct">{ocrProgress}%</span>
                </div>
                <div className="sv-ocr-bar-wrap">
                  <div className="sv-ocr-bar" style={{ width: `${ocrProgress}%` }} />
                </div>
                <p className="sv-ocr-log">{ocrLog}</p>
              </div>
            )}
            {(ocrStatus === "done" || ocrStatus === "failed") && (
              <div className={`sv-ocr-status ${ocrStatus}`}>
                <span>{ocrLog}</span>
              </div>
            )}
            {ocrStatus === "rejected" && (
              <div className="sv-ocr-status rejected">
                <div className="sv-rejected-icon">🚫</div>
                <div className="sv-rejected-text">{ocrLog}</div>
              </div>
            )}
          </div>

          {/* Form nhập thông tin - Chỉ hiển thị khi không bị từ chối */}
          <div className="sv-form" style={{ display: ocrStatus === "rejected" ? "none" : "flex", flexDirection: "column", gap: "10px" }}>
            <div className="sv-field">
              <div className="sv-field-header">
                <label className="sv-field-label">Mã sinh viên <span className="sv-required">*</span></label>
                {ocrStatus === "done" && studentId && (
                  <span className="sv-ocr-badge">✨ Tự động điền</span>
                )}
              </div>
              <input
                type="text"
                className={`sv-input ${ocrStatus === "done" && studentId ? "sv-input-ocr" : ""}`}
                placeholder="VD: 21030045"
                value={studentId}
                onChange={e => setStudentId(e.target.value.toUpperCase())}
              />
            </div>
            <div className="sv-field">
              <div className="sv-field-header">
                <label className="sv-field-label">Trường học</label>
                {ocrStatus === "done" && school && (
                  <span className="sv-ocr-badge">✨ Tự động điền</span>
                )}
              </div>
              <input
                type="text"
                className={`sv-input ${ocrStatus === "done" && school ? "sv-input-ocr" : ""}`}
                placeholder="VD: ĐH Bách Khoa Hà Nội"
                value={school}
                onChange={e => setSchool(e.target.value)}
              />
            </div>
            <div className="sv-field">
              <div className="sv-field-header">
                <label className="sv-field-label">Hạn thẻ <span className="sv-required">*</span></label>
                {ocrStatus === "done" && expiryDate && (
                  <span className="sv-ocr-badge">✨ Tự động điền</span>
                )}
              </div>
              <input
                type="text"
                className={`sv-input ${expiryDate && (expiryDate.length === 4 ? Number(expiryDate) < new Date().getFullYear() : expiryDate < today) ? "sv-input-error" : ocrStatus === "done" && expiryDate ? "sv-input-ocr" : ""}`}
                placeholder="VD: 2027 hoặc 31/12/2027"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
              />
              {expiryDate && (expiryDate.length === 4 ? Number(expiryDate) < new Date().getFullYear() : expiryDate < today) && (
                <span className="sv-field-hint error">Thẻ đã hết hạn</span>
              )}
            </div>
          </div>

          {/* Thông báo lỗi */}
          {error && (
            <div className="sv-error-box">
              <span>⚠️</span> {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sv-modal-actions">
          <button type="button" className="sv-btn-cancel" onClick={onCancel}>
            ❌ Hủy
          </button>
          <button
            type="button"
            className="sv-btn-confirm"
            onClick={handleSubmit}
          disabled={isSubmitting || remaining === 0 || ocrStatus === "scanning"}
          >
            {isSubmitting ? "Đang xử lý..." : "✅ Xác Nhận Hợp Lệ"}
          </button>
        </div>
      </div>
    </div>
  );
}


export default function StaffBanVe() {
  const {
    dates,
    selectedDateIso,
    setSelectedDateIso,
    moviesWithShowtimes,
    selectedShowtime,
    setSelectedShowtime,
    setSelectedMovie,
    availableSeats,
    selectedSeats,
    customer,
    setCustomer,
    loading,
    loadingSeats,
    error,
    successReceipt,
    setSuccessReceipt,
    rowKeys,
    groupedSeats,
    handleSeatClick,
    getSeatPrice,
    totalAmount,
    handleSellTickets,
    getShowtimeHour,
    getShowtimeRoomId,
    getShowtimeId,
    getSeatId,
    formatMoney,
    sortRows,
    sortSeatsByPosition,
    getSeatClassName,
    getSeatDisplayLabel,
    isSeatBooked,
    getSeatTypeLabel,
    getSelectedSeatsText,
    getSelectedShowtimeBasePrice,

    // QR states
    showQrModal,
    paymentQrCode,
    paymentTicketIds,
    handleCompleteStaffQrPayment,
    handleCancelStaffQrPayment,

    // Payment Method
    paymentMethod,
    setPaymentMethod,

    // Foods States & Handlers
    foodMenu,
    selectedFoods,
    setSelectedFoods,
    showFoodModal,
    setShowFoodModal,
    foodSearchQuery,
    setFoodSearchQuery,
    foodFilterType,
    setFoodFilterType,
    filteredFoodMenu,
    selectedFoodsList,
    foodTotalAmount,
    handleFoodQuantityChange,
    configuringCombo, setConfiguringCombo, comboSlots, setComboSlots, confirmComboSlots,
    cashReceived,
    setCashReceived,
    isStudent,
    setIsStudent,
    studentCount,
    setStudentCount,
    showStudentVerifyModal,
    studentVerified,
    studentCardInfo,
    handleStudentVerifyConfirm,
    handleStudentVerifyCancel,
    getStudentMonthlyUsage,
    discountCodeInput,
    setDiscountCodeInput,
    appliedDiscount,
    availableDiscounts,
    showVoucherModal,
    setShowVoucherModal,
    handleApplyDiscount,
    removeDiscount,
    ticketSubtotal,
    studentDiscountAmount,
  } = useBanVe();

  const [showExchangeModal, setShowExchangeModal] = useState(false);

  return (
    <div className="bv-root">
      {/* ───── HEADER ───── */}
      <div className="bv-header">
        <div className="bv-header-left">
          <MdMovie className="bv-header-icon" />
          <h4 className="bv-header-title">Bán Vé Tại Quầy</h4>
          <button 
            type="button"
            onClick={() => setShowExchangeModal(true)}
            className="ml-6 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-extrabold hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            🔄 Đổi Ghế Tại Quầy
          </button>
        </div>

        {/* Date tabs */}
        <div className="bv-date-tabs">
          {dates.map((dateItem) => {
            const isActive = selectedDateIso === dateItem.iso;
            const [year, month, day] = dateItem.iso.split("-");
            const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
            const daysOfWeek = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
            const weekday = daysOfWeek[dateObj.getDay()];
            return (
              <button
                key={dateItem.iso}
                type="button"
                onClick={() => {
                  setSelectedDateIso(dateItem.iso);
                  setSelectedShowtime(null);
                  setSelectedMovie(null);
                }}
                className={`bv-date-btn ${isActive ? "active" : ""}`}
              >
                <span className="bv-date-day">{day}/{month}</span>
                <span className="bv-date-wd">{weekday}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ───── ERROR ALERT ───── */}
      {error && (
        <div className="bv-alert-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* ───── SUCCESS RECEIPT ───── */}
      {successReceipt && (
        <div className="bv-receipt-card">
          <div className="bv-receipt-icon"><MdCheckCircle /></div>
          <div className="bv-receipt-body">
            <h5>Thanh Toán &amp; Xuất Vé Thành Công!</h5>
            <span className="bv-paid-badge">✓ Đã thanh toán thành công</span>

            <div className="bv-receipt-grid">
              <div><strong>Khách hàng:</strong> {successReceipt.customerName}{successReceipt.customerPhone ? ` (${successReceipt.customerPhone})` : ""}</div>
              <div><strong>Phim:</strong> {successReceipt.movieTitle}</div>
              <div><strong>Suất chiếu:</strong> {successReceipt.showtimeDate} {successReceipt.showtimeTime}</div>
              <div><strong>Phòng:</strong> {successReceipt.roomName}</div>
              <div><strong>Ghế:</strong> {successReceipt.seats}</div>
              {successReceipt.foodsText && (
                <div className="bv-receipt-full"><strong>Đồ ăn:</strong> {successReceipt.foodsText}</div>
              )}
              <div><strong>Thanh toán:</strong> {successReceipt.paymentMethod}</div>
              {successReceipt.cashReceived > 0 && (
                <>
                  <div><strong>Tiền nhận:</strong> {formatMoney(successReceipt.cashReceived)} đ</div>
                  <div><strong>Tiền thừa:</strong> {formatMoney(Math.max(0, successReceipt.cashReceived - successReceipt.totalAmount))} đ</div>
                </>
              )}
              {successReceipt.studentDiscountAmount > 0 && successReceipt.isStudent && (
                <div className="bv-receipt-full text-red-600 font-bold">
                  <strong>Khấu trừ HS/SV (-15% × {successReceipt.studentCount || 1} vé):</strong> -{formatMoney(successReceipt.studentDiscountAmount)} đ
                </div>
              )}
              {successReceipt.promoDiscountAmount > 0 && successReceipt.appliedDiscount && (
                <div className="bv-receipt-full text-red-600 font-bold">
                  <strong>Mã ưu đãi ({successReceipt.appliedDiscount.discountCode}):</strong> -{formatMoney(successReceipt.promoDiscountAmount)} đ
                </div>
              )}
              <div><strong>Ngày xuất:</strong> {successReceipt.dateBooked}</div>
              <div className="bv-receipt-full bv-receipt-total">
                <span>Tổng tiền:</span>
                <strong>{formatMoney(successReceipt.totalAmount)} đ</strong>
              </div>
            </div>

            <button type="button" onClick={() => setSuccessReceipt(null)} className="bv-continue-btn">
              ＋ Bán vé tiếp theo
            </button>
          </div>
        </div>
      )}

      {/* ───── 3-COLUMN POS LAYOUT ───── */}
      <div className="bv-layout">

        {/* COL 1: Lịch chiếu phim dọc bên trái */}
        <aside className="bv-col-schedule">
          <div className="bv-panel-title">
            <span className="bv-title-bar"></span>
            Lịch Chiếu Phim
          </div>

          {loading ? (
            <p className="bv-text-muted">Đang tải lịch chiếu...</p>
          ) : moviesWithShowtimes.length === 0 ? (
            <p className="bv-text-muted bv-text-italic">Không có lịch chiếu hôm nay.</p>
          ) : (
            <div className="bv-movie-list">
              {moviesWithShowtimes.map((movie) => (
                <div key={movie.id || movie.movieId || movie.title} className="bv-movie-card">
                  {/* Poster + info */}
                  <div className="bv-movie-meta">
                    {movie.posterUrl && (
                      <img src={movie.posterUrl} alt={movie.title || ""} className="bv-movie-poster" />
                    )}
                    <div className="bv-movie-info">
                      <span className="bv-age-badge">{movie.ageRating}</span>
                      <h6 className="bv-movie-title" title={movie.title}>{movie.title}</h6>
                      <p className="bv-movie-duration">{movie.duration} phút</p>
                    </div>
                  </div>

                  {/* Showtimes */}
                  <div className="bv-showtime-grid">
                    {movie.showtimes.map((showtime) => {
                      const hour = getShowtimeHour(showtime);
                      const isSelected =
                        selectedShowtime &&
                        String(getShowtimeId(selectedShowtime)) === String(getShowtimeId(showtime));
                      return (
                        <button
                          key={getShowtimeId(showtime) || showtime.id}
                          type="button"
                          onClick={() => {
                            setSelectedShowtime(showtime);
                            setSelectedMovie(movie);
                          }}
                          className={`bv-showtime-btn ${isSelected ? "active" : ""}`}
                        >
                          {hour}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* COL 2: Sơ đồ ghế ở giữa */}
        <main className="bv-col-seats">
          <div className="bv-panel-title">
            <span className="bv-title-bar"></span>
            Sơ Đồ Ghế
            {selectedShowtime && (
              <span className="bv-showtime-badge">
                {selectedShowtime.roomName || selectedShowtime.RoomName || `Phòng ${getShowtimeRoomId(selectedShowtime)}`}
                {" · "}
                {getShowtimeHour(selectedShowtime)}
              </span>
            )}
          </div>

          {!selectedShowtime ? (
            <div className="bv-seat-empty">
              <MdChair className="bv-seat-empty-icon" />
              <p>Vui lòng chọn suất chiếu từ danh sách bên trái.</p>
            </div>
          ) : loadingSeats ? (
            <div className="bv-seat-loading">
              <span className="bv-seat-spinner"></span>
              Đang tải sơ đồ ghế...
            </div>
          ) : (
            <div className="bv-seatmap">
              <div className="bv-screen">MÀN HÌNH</div>

              <div className="bv-seat-rows">
                {sortRows(rowKeys).map((row) => (
                  <div key={row} className="bv-seat-row">
                    <span className="bv-row-letter">{row}</span>
                    <div className="bv-seat-cols">
                      {(() => {
                        const sorted = sortSeatsByPosition(groupedSeats[row] || []);
                        const rendered = [];
                        for (let i = 0; i < sorted.length; i++) {
                          const seat = sorted[i];
                          const seatClassName = getSeatClassName(seat);
                          const isCouple = seatClassName.includes("seat-couple");

                          if (isCouple && i < sorted.length - 1) {
                            const nextSeat = sorted[i + 1];
                            const nextClassName = getSeatClassName(nextSeat);
                            const isNextCouple = nextClassName.includes("seat-couple");

                            const groupId = seat?.coupleGroupId ?? seat?.CoupleGroupId;
                            const nextGroupId = nextSeat?.coupleGroupId ?? nextSeat?.CoupleGroupId;
                            if (isNextCouple && groupId && String(groupId) === String(nextGroupId)) {
                              const seatId1 = getSeatId(seat);
                              const seatId2 = getSeatId(nextSeat);
                              const label1 = getSeatDisplayLabel(seat, row);
                              const label2 = getSeatDisplayLabel(nextSeat, row);
                              const booked1 = isSeatBooked(seat);
                              const booked2 = isSeatBooked(nextSeat);
                              rendered.push(
                                <div key={`${seatId1}_${seatId2}_pair`} className="bv-couple-pair">
                                  <button
                                    type="button"
                                    disabled={booked1 || booked2}
                                    onClick={() => handleSeatClick(seat)}
                                    className={seatClassName + " seat-couple-left"}
                                    title={`${label1} (Couple - ${formatMoney(getSeatPrice(seat, selectedShowtime))} đ)`}
                                  >
                                    {label1}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={booked1 || booked2}
                                    onClick={() => handleSeatClick(nextSeat)}
                                    className={nextClassName + " seat-couple-right"}
                                    title={`${label2} (Couple - ${formatMoney(getSeatPrice(nextSeat, selectedShowtime))} đ)`}
                                  >
                                    {label2}
                                  </button>
                                </div>
                              );
                              i++;
                              continue;
                            }
                          }

                          const seatId = getSeatId(seat);
                          const label = getSeatDisplayLabel(seat, row);
                          const booked = isSeatBooked(seat);
                          const seatTypeLabel = getSeatTypeLabel(seat);
                          const price = getSeatPrice(seat, selectedShowtime);
                          rendered.push(
                            <button
                              key={seatId}
                              type="button"
                              disabled={booked}
                              onClick={() => handleSeatClick(seat)}
                              className={seatClassName}
                              title={`${label} (${seatTypeLabel} - ${formatMoney(price)} đ)`}
                            >
                              {label}
                            </button>
                          );
                        }
                        return rendered;
                      })()}
                    </div>
                    <span className="bv-row-letter">{row}</span>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="bv-legend">
                <div className="bv-legend-item"><span className="bv-legend-box legend-standard"></span>Thường</div>
                <div className="bv-legend-item"><span className="bv-legend-box legend-vip"></span>VIP</div>
                <div className="bv-legend-item"><span className="bv-legend-box legend-couple"></span>Couple</div>
                <div className="bv-legend-item"><span className="bv-legend-box legend-selected"></span>Đang chọn</div>
                <div className="bv-legend-item"><span className="bv-legend-box legend-holding" style={{ background: "#f97316", borderColor: "#ea580c", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "bold" }}>⏳</span>Đang giữ chỗ</div>
                <div className="bv-legend-item bv-legend-dim"><span className="bv-legend-box legend-taken"></span>Đã bán</div>
              </div>
            </div>
          )}
        </main>

        {/* COL 3: Panel thanh toán */}
        <aside className="bv-col-payment">
          <form onSubmit={handleSellTickets} className="bv-payment-panel">
            {/* Tiêu đề */}
            <div className="bv-panel-title">
              <span className="bv-title-bar"></span>
              Thông Tin Đơn Hàng
            </div>

            {/* Scrollable Body */}
            <div className="bv-payment-body">
              {/* Tóm tắt đơn */}
              <div className="bv-order-summary">
                <div className="bv-order-row">
                <span>Ghế đã chọn</span>
                <strong>{getSelectedSeatsText() || "Chưa chọn"}</strong>
              </div>
              <div className="bv-order-row">
                <span>Phòng chiếu</span>
                <strong>
                  {selectedShowtime
                    ? (() => {
                        const rName = selectedShowtime.roomName || selectedShowtime.RoomName || `Phòng ${getShowtimeRoomId(selectedShowtime)}`;
                        const rType = selectedShowtime.roomType || selectedShowtime.RoomType || selectedShowtime.format || selectedShowtime.Format || selectedShowtime.room?.roomType || selectedShowtime.room?.RoomType || selectedShowtime.room?.type || selectedShowtime.room?.Type || "2D";
                        return `${rName} (${rType})`;
                      })()
                    : "—"}
                </strong>
              </div>
              {studentDiscountAmount > 0 && (
                <div className="bv-order-row text-red-600 font-bold">
                  <span>
                    {appliedDiscount 
                      ? `Giảm giá mã ${appliedDiscount.discountCode} (${appliedDiscount.discountType === "Percent" ? appliedDiscount.discountValue + "%" : formatMoney(appliedDiscount.discountValue) + "đ"})` 
                      : `Giảm giá HS/SV (15% × ${Math.min(Math.max(1, Number(studentCount) || 1), selectedSeats.length || 1)} vé)`}
                  </span>
                  <span>-{formatMoney(studentDiscountAmount)} đ</span>
                </div>
              )}
            </div>

            {/* Đồ ăn */}
            <div className="bv-food-section">
              <div className="bv-food-header">
                <div className="bv-food-label">
                  <MdRestaurant className="bv-food-icon" />
                  Đồ ăn &amp; Nước uống
                </div>
                <button
                  type="button"
                  onClick={() => setShowFoodModal(true)}
                  className="bv-food-add-btn"
                >
                  {selectedFoodsList.length > 0 ? "✏️ Sửa" : "＋ Thêm"}
                </button>
              </div>
              {selectedFoodsList.length === 0 ? (
                <p className="bv-food-empty">Chưa chọn đồ ăn / nước uống</p>
              ) : (
                <div className="bv-food-list">
                  {selectedFoodsList.map(item => (
                    <div key={`${item.id}_${item.type}`} className="bv-food-row">
                      <span>🍿 {item.name} <strong>×{item.quantity}</strong></span>
                      <span>{formatMoney(item.price * item.quantity)} đ</span>
                    </div>
                  ))}
                  <div className="bv-food-subtotal">
                    <span>Tổng đồ ăn</span>
                    <span>+{formatMoney(foodTotalAmount)} đ</span>
                  </div>
                </div>
              )}
            </div>

            {/* Phương thức thanh toán */}
            <div className="bv-pay-method-section">
              <label className="bv-section-label">Hình thức thanh toán</label>
              <div className="bv-pay-method-btns">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("Cash")}
                  className={`bv-method-btn ${paymentMethod === "Cash" ? "active" : ""}`}
                >
                  💵 Tiền mặt
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("QR")}
                  className={`bv-method-btn ${paymentMethod === "QR" ? "active" : ""}`}
                >
                  📱 Quét QR
                </button>
              </div>

              {/* Ưu đãi Học sinh / Sinh viên */}
              <div className="mt-2.5 p-3 bg-red-50/60 border border-red-200/80 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-red-700 select-none">
                  <input
                    type="checkbox"
                    checked={isStudent}
                    onChange={(e) => setIsStudent(e.target.checked)}
                    disabled={appliedDiscount !== null}
                    className="w-5 h-5 text-red-600 rounded border-gray-300 focus:ring-red-500 accent-red-600 disabled:opacity-50"
                  />
                  <span>🎓 Khách là Học sinh / Sinh viên (-15% vé)</span>
                  {studentVerified && (
                    <span className="ml-auto text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                      ✓ Đã xác minh
                    </span>
                  )}
                </label>

                {/* Hiển thị info thẻ đã xác minh */}
                {isStudent && studentVerified && studentCardInfo && (
                  <div className="mt-2 pt-2 border-t border-red-200/60 space-y-2">
                    <div className="sv-verified-info">
                      <div className="sv-verified-row">
                        <span className="sv-verified-lbl">📋 MSSV:</span>
                        <span className="sv-verified-val">{studentCardInfo.studentId || "—"}</span>
                      </div>
                      {studentCardInfo.school && (
                        <div className="sv-verified-row">
                          <span className="sv-verified-lbl">🏫 Trường:</span>
                          <span className="sv-verified-val">{studentCardInfo.school}</span>
                        </div>
                      )}
                      {studentCardInfo.expiryDate && (
                        <div className="sv-verified-row">
                          <span className="sv-verified-lbl">📅 Hạn thẻ:</span>
                          <span className="sv-verified-val">
                            {new Date(studentCardInfo.expiryDate).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      )}
                      <div className="sv-verified-row">
                        <span className="sv-verified-lbl">🎟️ Lượt còn:</span>
                        <span className="sv-verified-val">
                          {Math.max(0, 3 - getStudentMonthlyUsage(studentCardInfo.studentId))}/3 lần/tháng
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-red-800">Số lượng vé HS/SV:</span>
                      <span className="text-xxs text-gray-500">(Tối đa {selectedSeats.length || 1} vé)</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max={selectedSeats.length || 1}
                      value={studentCount}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") { setStudentCount(""); return; }
                        const num = parseInt(val, 10);
                        if (!isNaN(num)) {
                          const maxSeats = selectedSeats.length || 1;
                          setStudentCount(num > maxSeats ? maxSeats : num);
                        }
                      }}
                      onBlur={() => {
                        const num = parseInt(studentCount, 10);
                        const maxSeats = selectedSeats.length || 1;
                        if (isNaN(num) || num < 1) setStudentCount(1);
                        else if (num > maxSeats) setStudentCount(maxSeats);
                      }}
                      className="w-full border border-red-200 rounded-xl px-3 py-1.5 text-sm font-bold text-red-700 bg-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                    {ticketSubtotal > 0 && (
                      <div className="text-xs font-bold text-red-600 flex justify-between items-center pt-1">
                        <span>Giảm 15% cho {Math.min(Math.max(1, Number(studentCount) || 1), selectedSeats.length || 1)} vé:</span>
                        <span className="font-extrabold text-sm">-{formatMoney(studentDiscountAmount)} đ</span>
                      </div>
                    )}
                  </div>
                )}
              </div>



              {paymentMethod === "Cash" && (
                <div className="mt-3 p-3.5 bg-gray-50 border border-gray-150 rounded-2xl space-y-2.5">
                  <div className="flex justify-between items-center text-sm font-bold text-gray-700">
                    <span>Tiền nhận (khách đưa):</span>
                  </div>
                  <input
                    type="number"
                    placeholder="Nhập số tiền khách đưa..."
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-base font-bold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {totalAmount > 0 && (
                      <button
                        type="button"
                        onClick={() => setCashReceived(totalAmount)}
                        className="col-span-2 px-3 py-2 bg-green-50 border-2 border-green-200 rounded-xl text-xs font-bold text-green-700 hover:bg-green-100 active:scale-97 transition-all flex items-center justify-center gap-1"
                      >
                        {formatMoney(totalAmount)}đ (Đúng số tiền)
                      </button>
                    )}
                    {[50000, 100000, 200000, 500000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashReceived(amt)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 active:scale-97 transition-all flex items-center justify-center gap-1"
                      >
                        {formatMoney(amt)}đ
                      </button>
                    ))}
                  </div>

                  {cashReceived !== "" && Number(cashReceived) < totalAmount ? (
                    <div className="pt-2.5 border-t border-red-200 text-xs font-bold text-red-600 flex items-center justify-between">
                      <span>⚠️ Chưa đủ</span>
                      <span className="text-sm font-black">Thiếu: {formatMoney(totalAmount - Number(cashReceived))} đ</span>
                    </div>
                  ) : Number(cashReceived) >= totalAmount && totalAmount > 0 ? (
                    <div className="pt-2.5 border-t border-gray-200 flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-600">Tiền thừa trả khách:</span>
                      <span className="text-green-600 text-base font-black">
                        {formatMoney(Number(cashReceived) - totalAmount)} đ
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
            </div> {/* Close bv-pay-method-section */}
          </div> {/* Close bv-payment-body */}

            {/* Fixed Footer */}
            <div className="bv-payment-footer">
              {/* Tổng tiền */}
              <div className="bv-total-row">
                <span>Tổng tiền</span>
                <strong>{formatMoney(totalAmount)} đ</strong>
              </div>

              {/* Nút xuất vé */}
              <button
                type="submit"
                disabled={selectedSeats.length === 0 || loading || (paymentMethod === "Cash" && cashReceived !== "" && Number(cashReceived) < totalAmount)}
                className="bv-submit-btn"
              >
                {loading ? "Đang xử lý..." : "🎟 XUẤT VÉ & THANH TOÁN"}
              </button>
            </div> {/* Close bv-payment-footer */}
          </form>
        </aside>
      </div>

      {/* ───── QR MODAL ───── */}
      {showQrModal && (
        <QrPaymentModal
          paymentQrCode={paymentQrCode}
          totalAmount={totalAmount}
          paymentTicketIds={paymentTicketIds}
          formatMoney={formatMoney}
          onCancel={handleCancelStaffQrPayment}
          onConfirm={handleCompleteStaffQrPayment}
        />
      )}

      {/* ───── FOOD MODAL ───── */}
      {configuringCombo && (
        <div className="bv-modal-overlay bv-combo-config-overlay">
          <div className="bv-modal-box bv-food-modal">
            <div className="bv-food-modal-header"><h3>CHỌN THÀNH PHẦN COMBO</h3><button onClick={()=>setConfiguringCombo(null)}>×</button></div>
            <div className="bv-food-items" style={{display:'grid',gap:10,padding:18}}>
              {comboSlots.map((slot,index)=><label key={index} style={{display:'grid',gap:5}}>{slot.itemType==='DRINK'?'Nước uống':'Bắp rang'}
                <select value={slot.foodId||''} onChange={e=>setComboSlots(rows=>rows.map((x,i)=>i===index?{...x,foodId:Number(e.target.value)}:x))}>
                  <option value="">-- Chọn --</option>
                  {(configuringCombo.allowedItems||[]).filter(x=>(x.itemType??x.ItemType)===slot.itemType).map(x=><option key={x.foodId??x.FoodId} value={x.foodId??x.FoodId} disabled={x.isAvailable === false || Number(x.quantity) <= 0}>{x.foodName??x.FoodName}{x.isAvailable === false || Number(x.quantity) <= 0 ? ' (Hết hàng)' : ''}</option>)}
                </select>
              </label>)}
            </div>
            <div className="bv-food-modal-footer"><button className="bv-food-confirm-btn" disabled={comboSlots.some(x=>!x.foodId)} onClick={confirmComboSlots}>Xác nhận lựa chọn</button></div>
          </div>
        </div>
      )}
      {showFoodModal && (
        <div className="bv-modal-overlay">
          <div className="bv-modal-box bv-food-modal">
            {/* Header */}
            <div className="bv-food-modal-header">
              <h3>🍿 Chọn Đồ Ăn &amp; Nước Uống</h3>
              <button
                type="button"
                onClick={() => { setShowFoodModal(false); setFoodSearchQuery(""); setFoodFilterType("all"); }}
                className="bv-modal-close"
              >
                <MdClose />
              </button>
            </div>

            {/* Search */}
            <div className="bv-food-search-wrap">
              <MdSearch className="bv-search-icon" />
              <input
                type="text"
                value={foodSearchQuery}
                onChange={e => setFoodSearchQuery(e.target.value)}
                placeholder="Tìm kiếm đồ ăn, nước uống..."
                className="bv-food-search"
              />
              {foodSearchQuery && (
                <button type="button" onClick={() => setFoodSearchQuery("")} className="bv-search-clear">
                  <MdClose />
                </button>
              )}
            </div>

            {/* Filter tabs */}
            <div className="bv-food-tabs">
              {[
                { id: "all", label: "Tất cả" },
                { id: "combo", label: "Combo" },
                { id: "drink", label: "Nước uống" },
                { id: "food", label: "Đồ ăn" },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFoodFilterType(tab.id)}
                  className={`bv-food-tab ${foodFilterType === tab.id ? "active" : ""}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Menu items */}
            <div className="bv-food-items">
              {filteredFoodMenu.length === 0 ? (
                <div className="bv-food-no-result">Không tìm thấy kết quả phù hợp.</div>
              ) : (
                filteredFoodMenu.map(item => {
                  const qty = selectedFoods[`${item.id}_${item.type}`] || 0;
                  return (
                    <div key={`${item.id}_${item.type}`} className={`bv-food-item ${qty > 0 ? "selected" : ""}`}>
                      <span className="bv-food-thumb">
                        {item.image && (item.image.startsWith("http") || item.image.startsWith("/")) ? (
                          <img src={item.image} alt={item.name} />
                        ) : (
                          item.image || "🍿"
                        )}
                      </span>
                      <div className="bv-food-item-info">
                        <h6>{item.name}</h6>
                        <p>{item.description}</p>
                        <span className="bv-food-price">{formatMoney(item.price)} đ</span>
                      </div>
                      <div className="bv-qty-control">
                        <button type="button" onClick={() => handleFoodQuantityChange(item, -1)} className="bv-qty-btn">−</button>
                        <span className="bv-qty-num">{qty}</span>
                        <button type="button" onClick={() => handleFoodQuantityChange(item, 1)} className="bv-qty-btn" disabled={item.isAvailable === false || (Number(item.quantity) > 0 && qty >= Number(item.quantity))}>＋</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom */}
            <div className="bv-food-modal-footer">
              <div>
                <p className="bv-food-count">Đã chọn {selectedFoodsList.reduce((s, i) => s + i.quantity, 0)} phần</p>
                <p className="bv-food-total">+{formatMoney(foodTotalAmount)} đ</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowFoodModal(false); setFoodSearchQuery(""); setFoodFilterType("all"); }}
                className="bv-food-confirm-btn"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chọn Voucher dành cho Nhân viên Bán vé tại Quầy Chi Nhánh */}
      {showVoucherModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4" onClick={() => setShowVoucherModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                🎟️ Danh Sách Ưu Đãi Admin ({availableDiscounts.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowVoucherModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {availableDiscounts.length > 0 ? (
                availableDiscounts.map((disc) => {
                  const minOrder = Number(disc.minOrderAmount || 0);
                  const totalBill = ticketSubtotal + foodTotalAmount;
                  const isEligible = totalBill >= minOrder;
                  const isSelected = appliedDiscount?.discountCode === disc.discountCode;

                  return (
                    <div
                      key={disc.discountId || disc.discountCode}
                      className={`p-3.5 rounded-xl border transition-all flex justify-between items-center gap-3 ${
                        isSelected
                          ? "border-green-500 bg-green-50/70"
                          : isEligible
                          ? "border-blue-200 bg-blue-50/30 hover:border-blue-400"
                          : "border-gray-200 bg-gray-50 opacity-60"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                            🏷️ {disc.discountCode}
                          </span>
                          <span className="text-xs font-bold text-gray-500">
                            {disc.discountType === "Percent" ? `Giảm ${disc.discountValue}%` : `Giảm ${formatMoney(disc.discountValue)}đ`}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-gray-700 mt-1 truncate">
                          {disc.programName || disc.description}
                        </p>
                        {minOrder > 0 && (
                          <p className="text-[11px] font-medium text-gray-500 mt-0.5">
                            Đơn tối thiểu: <strong>{formatMoney(minOrder)}đ</strong>
                          </p>
                        )}
                        {!isEligible && (
                          <p className="text-[10px] font-bold text-red-500 mt-0.5">
                            * Chưa đủ điều kiện đơn tối thiểu ({formatMoney(minOrder)}đ)
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyDiscount(disc.discountCode)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex-shrink-0 ${
                          isSelected
                            ? "bg-green-600 text-white"
                            : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                        }`}
                      >
                        {isSelected ? "Đã dùng" : "Áp dụng"}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-sm font-bold text-gray-400">
                  Không có mã giảm giá nào sẵn có từ Admin.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───── STUDENT VERIFY MODAL ───── */}
      {showStudentVerifyModal && (
        <StudentVerifyModal
          onConfirm={handleStudentVerifyConfirm}
          onCancel={handleStudentVerifyCancel}
          getStudentMonthlyUsage={getStudentMonthlyUsage}
        />
      )}

      {/* ───── TICKET EXCHANGE MODAL ───── */}
      {showExchangeModal && (
        <TicketExchangeModal
          isOpen={showExchangeModal}
          onClose={() => setShowExchangeModal(false)}
        />
      )}

    </div>
  );
}
