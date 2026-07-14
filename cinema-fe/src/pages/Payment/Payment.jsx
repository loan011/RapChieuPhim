import React, { useState, useEffect } from "react";
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
    timeLeft,
    handleCancelAndGoBack,
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

  return (
    <div className="payment-page-layout">
      <div className="payment-page-container">
      {/* Header quay lại */}
      <div className="payment-header" style={{ flexWrap: "wrap", gap: "15px" }}>
        <button className="payment-back-btn" onClick={handleCancelAndGoBack}>
          <MdOutlineArrowBack /> Quay lại đặt vé
        </button>
        <h2>THANH TOÁN ĐƠN VÉ</h2>
        <div className="payment-timer-alert" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px", background: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "8px 16px", borderRadius: "8px", fontSize: "0.95rem", fontWeight: "700" }}>
          ⏱ Thời gian thanh toán: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
        </div>
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

             <div style={{ display: "flex", width: "100%" }}>
              <button
                type="button"
                className="modal-finish-close-btn"
                style={{ width: "100%", background: "#ef4444", margin: 0, padding: "12px 0", borderRadius: "12px", fontWeight: "bold" }}
                onClick={handleCancelAndGoBack}
              >
                HỦY GIAO DỊCH
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal báo thanh toán thành công */}
      {showPaymentSuccess && (
        <div className="payment-success-modal-overlay">
          <div className="payment-success-modal-box" style={{ maxWidth: "480px", width: "100%", margin: "auto", padding: "28px 24px", background: "#181818", borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.08)", boxShadow: "0 20px 50px rgba(0, 0, 0, 0.65)", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="modal-success-icon-wrap" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <MdCheckCircle className="success-icon" style={{ fontSize: "3.5rem", color: "#22c55e" }} />
            </div>

            <h2 className="modal-title" style={{ fontSize: "1.35rem", fontWeight: "bold", color: "#22c55e", letterSpacing: "0.5px", marginTop: "12px", marginBottom: "6px" }}>
              THANH TOÁN THÀNH CÔNG
            </h2>

            <p className="modal-desc" style={{ fontSize: "0.85rem", color: "#9ca3af", margin: "0 0 20px", textAlign: "center", lineHeight: "1.4" }}>
              Vé xem phim của bạn đã được thanh toán và đăng ký thành công!
            </p>

            {/* Premium Ticket Card */}
            <div className="ticket-invoice-receipt" style={{ width: "100%", background: "linear-gradient(135deg, #242424 0%, #1a1a1a 100%)", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.05)", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", overflow: "hidden", position: "relative" }}>
              
              {/* Ticket Header */}
              <div className="invoice-header" style={{ padding: "14px 20px", background: "rgba(255, 255, 255, 0.02)", borderBottom: "1px dashed rgba(255, 255, 255, 0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", boxSizing: "border-box" }}>
                <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "700", color: "#f97316", letterSpacing: "1px" }}>
                  VÉ XEM PHIM ĐIỆN TỬ
                </h3>
                <span className="invoice-id" style={{ fontSize: "0.8rem", color: "#38bdf8", fontWeight: "600" }}>
                  Mã vé: {newTicketIds.join(", ")}
                </span>
              </div>

              {/* Ticket Details */}
              <div className="invoice-body-details" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "10px", textAlign: "left", fontSize: "0.88rem", color: "#d1d5db" }}>
                <p style={{ margin: 0, display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "6px" }}>
                  <span>🎬 Phim:</span>
                  <strong style={{ color: "#ffffff" }}>{getMovieTitle(movie)}</strong>
                </p>
                <p style={{ margin: 0, display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "6px" }}>
                  <span>📍 Rạp:</span>
                  <strong style={{ color: "#ffffff" }}>Rạp Chiếu Phim</strong>
                </p>
                <p style={{ margin: 0, display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "6px" }}>
                  <span>📅 Ngày chiếu:</span>
                  <strong style={{ color: "#ffffff" }}>{selectedDateIso}</strong>
                </p>
                <p style={{ margin: 0, display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "6px" }}>
                  <span>⏰ Suất chiếu:</span>
                  <strong style={{ color: "#ffffff" }}>{selectedShowtime ? getShowtimeHour(selectedShowtime) : ""}</strong>
                </p>
                <p style={{ margin: 0, display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "6px" }}>
                  <span>🎟 Ghế:</span>
                  <strong style={{ color: "#ffffff" }}>{selectedSeats.map(getSeatLabel).join(", ")}</strong>
                </p>
                {selectedCombos && selectedCombos.length > 0 && (
                  <p style={{ margin: 0, display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "6px" }}>
                    <span>🍿 Bắp nước:</span>
                    <strong style={{ color: "#ffffff", textAlign: "right" }}>
                      {selectedCombos.map((c) => `${c.name} (x${c.quantity})`).join(", ")}
                    </strong>
                  </p>
                )}
                <p style={{ margin: "8px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "1rem" }}>
                  <span>💰 Tổng cộng:</span>
                  <strong style={{ color: "#ef4444", fontSize: "1.15rem", fontWeight: "700" }}>
                    {totalAmount.toLocaleString("vi-VN")}đ
                  </strong>
                </p>
              </div>

              {/* Decorative Ticket Dashed Line with Side Cutouts */}
              <div style={{ position: "relative", borderTop: "2px dashed #181818", margin: "5px 0" }}>
                <div style={{ position: "absolute", left: "-8px", top: "-9px", width: "16px", height: "16px", borderRadius: "50%", background: "#181818" }}></div>
                <div style={{ position: "absolute", right: "-8px", top: "-9px", width: "16px", height: "16px", borderRadius: "50%", background: "#181818" }}></div>
              </div>

              {/* Ticket QR Section */}
              <div className="invoice-qr-wrap" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "18px 20px" }}>
                <div style={{ background: "#ffffff", padding: "12px", borderRadius: "12px", display: "inline-block", boxShadow: "0 6px 18px rgba(0,0,0,0.25)" }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(newTicketIds.join(","))}`}
                    alt="Ticket QR Code"
                    style={{ width: "140px", height: "140px", objectFit: "contain", display: "block" }}
                  />
                </div>
                <p style={{ fontSize: "0.78rem", color: "#9ca3af", margin: "4px 0 0", textAlign: "center", lineHeight: "1.3" }}>
                  Quét mã này tại quầy bán vé hoặc máy soát vé để nhận vé giấy
                </p>
              </div>
            </div>

            {/* Auto-redirect countdown bar */}
            <div style={{ width: "100%", marginTop: "20px", textAlign: "center" }}>
              <p style={{ fontSize: "0.82rem", color: "#9ca3af", margin: "0 0 8px" }}>
                ⏳ Đang chuyển sang <strong style={{ color: "#f97316" }}>Vé của tôi</strong> trong giây lát...
              </p>
              <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    background: "linear-gradient(90deg, #f97316, #ea580c)",
                    borderRadius: "4px",
                    animation: "progressBar 2.5s linear forwards",
                  }}
                />
              </div>
            </div>

            <style>{`
              @keyframes progressBar {
                from { width: 0%; }
                to { width: 100%; }
              }
            `}</style>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}