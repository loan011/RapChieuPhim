import React from "react";
import { usePayment } from "./Payment.js";
import { MdCheckCircle, MdQrCode2, MdCreditCard, MdOutlineArrowBack } from "react-icons/md";
import {
  getMovieTitle,
  getSeatLabel,
  getShowtimeHour,
  getMoviePoster,
} from "../Booking/usebooking.js";
import "../../styles/Payment.css";

export default function Payment() {
  const {
    bookingData,
    paymentMethod,
    setPaymentMethod,
    loading,
    paymentError,
    showQrModal,
    setShowQrModal,
    showPaymentSuccess,
    paymentQrCode,
    newTicketIds,
    handlePaymentSubmit,
    handleCompleteQrPayment,
    handleFinishBooking,
  } = usePayment();

  if (!bookingData) {
    return (
      <div className="payment-loading-screen">
        <div className="payment-spinner"></div>
        <p>Đang tải thông tin thanh toán...</p>
      </div>
    );
  }

  const {
    totalAmount,
    movie,
    selectedDateIso,
    selectedShowtime,
    selectedSeats,
    selectedCombos,
  } = bookingData;

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="payment-page-container">
      {/* Header quay lại */}
      <div className="payment-header">
        <button className="payment-back-btn" onClick={handleGoBack}>
          <MdOutlineArrowBack /> Quay lại đặt vé
        </button>
        <h2>THANH TOÁN ĐƠN VÉ</h2>
      </div>

      <div className="payment-main-layout">
        {/* Cột trái: Tóm tắt thông tin đặt vé */}
        <div className="payment-summary-column">
          <div className="payment-card movie-detail-card">
            <div className="movie-poster-wrap">
              <img src={getMoviePoster(movie)} alt={getMovieTitle(movie)} />
            </div>
            <div className="movie-info-wrap">
              <span className="age-rating-badge">{movie?.ageRating ?? "P"}</span>
              <h3>{getMovieTitle(movie)}</h3>
              <p className="movie-meta-item">📅 Ngày: <strong>{selectedDateIso}</strong></p>
              <p className="movie-meta-item">⏰ Suất chiếu: <strong>{selectedShowtime ? getShowtimeHour(selectedShowtime) : ""}</strong></p>
              <p className="movie-meta-item">📍 Rạp: <strong>Rạp Chiếu Phim</strong></p>
            </div>
          </div>

          <div className="payment-card ticket-detail-card">
            <h4>Chi tiết đơn hàng</h4>
            <div className="detail-row">
              <span>Ghế đã chọn:</span>
              <strong>{selectedSeats.map(getSeatLabel).join(", ")}</strong>
            </div>
            {selectedCombos && selectedCombos.length > 0 && (
              <div className="detail-row combos-row">
                <span>Bắp nước:</span>
                <div className="combos-list-text">
                  {selectedCombos.map((c, i) => (
                    <div key={i} className="combo-item-text">
                      {c.name} (x{c.quantity})
                    </div>
                  ))}
                </div>
              </div>
            )}
            <hr className="divider" />
            <div className="detail-row total-row">
              <span>TỔNG TIỀN:</span>
              <span className="price-text">{totalAmount.toLocaleString("vi-VN")}đ</span>
            </div>
          </div>
        </div>

        {/* Cột phải: Lựa chọn cổng thanh toán */}
        <div className="payment-methods-column">
          <form onSubmit={handlePaymentSubmit}>
            <div className="payment-card method-select-card">
              <h4>Chọn phương thức thanh toán</h4>
              
              <div className="methods-list">
                {/* Lựa chọn 1: VNPay */}
                <label className={`method-option ${paymentMethod === "VNPay" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="VNPay"
                    checked={paymentMethod === "VNPay"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="method-option-content">
                    <MdCreditCard className="method-icon vnpay-color" />
                    <div className="method-texts">
                      <strong>Cổng thanh toán VNPay</strong>
                      <span>Thanh toán qua ví điện tử VNPay, Thẻ ATM nội địa, Thẻ quốc tế hoặc quét mã QR VNPay-QR</span>
                    </div>
                  </div>
                </label>

                {/* Lựa chọn 2: Chuyển khoản QR (VietQR) */}
                <label className={`method-option ${paymentMethod === "QrCode" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="QrCode"
                    checked={paymentMethod === "QrCode"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="method-option-content">
                    <MdQrCode2 className="method-icon qr-color" />
                    <div className="method-texts">
                      <strong>Chuyển khoản VietQR (Ngân hàng)</strong>
                      <span>Quét mã QR để chuyển khoản nhanh 24/7 từ ứng dụng ngân hàng của bạn</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {paymentError && (
              <div className="payment-error-box">
                {paymentError}
              </div>
            )}

            <button type="submit" className="pay-now-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  Đang khởi tạo thanh toán...
                </>
              ) : (
                <>Thanh toán ngay ({totalAmount.toLocaleString("vi-VN")}đ)</>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Modal quét QR thanh toán */}
      {showQrModal && (
        <div className="payment-success-modal-overlay" style={{ zIndex: 101 }}>
          <div className="payment-success-modal-box" style={{ maxWidth: "450px", textAlign: "center", padding: "28px" }}>
            <h2 className="modal-title" style={{ fontSize: "1.5rem", color: "#f97316", marginBottom: "8px" }}>
              QUÉT MÃ THANH TOÁN QR
            </h2>
            <p className="modal-desc" style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0 0 20px" }}>
              Vui lòng mở ứng dụng ngân hàng hoặc ví điện tử quét mã QR dưới đây để thực hiện thanh toán đặt vé.
            </p>

            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "16px", display: "inline-block", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", marginBottom: "20px" }}>
              {paymentQrCode.startsWith("data:image") || paymentQrCode.startsWith("http") ? (
                <img 
                  src={paymentQrCode} 
                  alt="Payment QR Code" 
                  style={{ width: "240px", height: "240px", objectFit: "contain", display: "block" }} 
                />
              ) : (
                <img 
                  src={`data:image/png;base64,${paymentQrCode}`} 
                  alt="Payment QR Code" 
                  style={{ width: "240px", height: "240px", objectFit: "contain", display: "block" }} 
                />
              )}
            </div>

            <div className="ticket-invoice-receipt" style={{ textAlign: "left", marginBottom: "24px", padding: "16px", background: "#f9fafb", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              <p style={{ margin: "0 0 8px", fontSize: "0.9rem", color: "#374151" }}>
                💰 Số tiền: <strong style={{ color: "#ef4444", fontSize: "1.1rem" }}>{totalAmount.toLocaleString("vi-VN")}đ</strong>
              </p>
              <p style={{ margin: "0", fontSize: "0.85rem", color: "#4b5563" }}>
                📝 Nội dung chuyển khoản: <strong style={{ wordBreak: "break-all" }}>Thanh toan ve {newTicketIds.join(", ")}</strong>
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                className="modal-finish-close-btn"
                style={{ flex: 1, background: "#9ca3af", margin: 0, padding: "12px 0" }}
                onClick={() => setShowQrModal(false)}
              >
                HỦY
              </button>
              <button
                type="button"
                className="modal-finish-close-btn"
                style={{ flex: 2, background: "#22c55e", margin: 0, padding: "12px 0" }}
                onClick={handleCompleteQrPayment}
              >
                TÔI ĐÃ THANH TOÁN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal báo thanh toán thành công */}
      {showPaymentSuccess && (
        <div className="payment-success-modal-overlay">
          <div className="payment-success-modal-box">
            <div className="modal-success-icon-wrap">
              <MdCheckCircle className="success-icon" />
            </div>

            <h2 className="modal-title">THANH TOÁN THÀNH CÔNG</h2>

            <p className="modal-desc">
              Vé xem phim của bạn đã được thanh toán và đăng ký thành công!
            </p>

            <div className="ticket-invoice-receipt">
              <div className="invoice-header">
                <h3>VÉ XEM PHIM ĐIỆN TỬ</h3>
                <span className="invoice-id">
                  Mã vé: {newTicketIds.join(", ")}
                </span>
              </div>

              <div className="invoice-body-details">
                <p>🎬 Phim: <strong>{getMovieTitle(movie)}</strong></p>
                <p>📍 Rạp: <strong>Rạp Chiếu Phim</strong></p>
                <p>📅 Ngày chiếu: <strong>{selectedDateIso}</strong></p>
                <p>⏰ Suất chiếu: <strong>{selectedShowtime ? getShowtimeHour(selectedShowtime) : ""}</strong></p>
                <p>🎟 Ghế: <strong>{selectedSeats.map(getSeatLabel).join(", ")}</strong></p>
                {selectedCombos && selectedCombos.length > 0 && (
                  <p>
                    🍿 Bắp nước:{" "}
                    <strong>
                      {selectedCombos.map((c) => `${c.name} (x${c.quantity})`).join(", ")}
                    </strong>
                  </p>
                )}
                <p>💰 Tổng cộng: <strong>{totalAmount.toLocaleString("vi-VN")}đ</strong></p>
              </div>

              <div className="invoice-qr-wrap">
                <MdQrCode2 className="invoice-qr-code" />
                <p>Vui lòng xuất trình mã này tại quầy để nhận vé giấy</p>
              </div>
            </div>

            <button
              type="button"
              className="modal-finish-close-btn"
              onClick={handleFinishBooking}
            >
              HOÀN TẤT & ĐẾN VÉ CỦA TÔI
            </button>
          </div>
        </div>
      )}
    </div>
  );
}