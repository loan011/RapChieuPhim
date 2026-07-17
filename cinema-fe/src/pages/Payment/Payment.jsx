import React, { useState, useEffect } from "react";
import { usePayment } from "./Payment.js";
import { MdCheckCircle, MdQrCode2, MdCreditCard, MdOutlineArrowBack } from "react-icons/md";
import {
  getMovieTitle,
  getSeatLabel,
  getShowtimeHour,
  getMoviePoster,
  getSeatPrice,
  getCinemaNameById,
  findRoomByShowtime,
  getRoomName,
  getSeatType,
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
    selectedCinemaId,
    selectedDateIso,
    selectedShowtime,
    selectedSeats,
    selectedCombos,
    rooms,
    cinemas,
  } = bookingData;

  const cinemaName = cinemas && selectedCinemaId ? getCinemaNameById(cinemas, selectedCinemaId) : "Rạp Chiếu Phim";
  const room = rooms && selectedShowtime ? findRoomByShowtime(selectedShowtime, rooms) : null;
  const roomName = room ? getRoomName(room) : "";
  const displayCinema = roomName ? `${cinemaName} - ${roomName}` : cinemaName;

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
              <p className="movie-meta-item">📍 Rạp: <strong>{displayCinema}</strong></p>
            </div>
          </div>

          <div className="payment-card ticket-detail-card">
            <h4>Chi tiết đơn hàng</h4>
            <div className="detail-row" style={{ alignItems: 'flex-start' }}>
              <span>Ghế đã chọn:</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flex: 1, marginLeft: '16px' }}>
                {(() => {
                  const elements = [];
                  for (let i = 0; i < selectedSeats.length; i++) {
                    const seat = selectedSeats[i];
                    const type = String(getSeatType(seat)).toLowerCase();
                    const isCouple = type.includes("sweetbox") || type.includes("couple") || type.includes("đôi");
                    
                    if (isCouple) {
                      const nextSeat = selectedSeats[i + 1];
                      if (nextSeat) {
                        const nextType = String(getSeatType(nextSeat)).toLowerCase();
                        const nextIsCouple = nextType.includes("sweetbox") || nextType.includes("couple") || nextType.includes("đôi");
                        
                        if (nextIsCouple) {
                          const price = rooms ? getSeatPrice(seat, selectedShowtime, rooms) * 2 : 0;
                          elements.push(
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '16px' }}>
                              <strong>{getSeatLabel(seat)}, {getSeatLabel(nextSeat)}</strong>
                              <span style={{ color: '#aaa', fontSize: '0.9rem', fontWeight: '500' }}>{price > 0 ? price.toLocaleString("vi-VN") + 'đ' : ''}</span>
                            </div>
                          );
                          i++; // skip next
                          continue;
                        }
                      }
                    }
                    
                    const price = rooms ? getSeatPrice(seat, selectedShowtime, rooms) : 0;
                    elements.push(
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '16px' }}>
                        <strong>{getSeatLabel(seat)}</strong>
                        <span style={{ color: '#aaa', fontSize: '0.9rem', fontWeight: '500' }}>{price > 0 ? price.toLocaleString("vi-VN") + 'đ' : ''}</span>
                      </div>
                    );
                  }
                  return elements;
                })()}
              </div>
            </div>
            {selectedCombos && selectedCombos.length > 0 && (
              <div className="detail-row combos-row" style={{ alignItems: 'flex-start', marginTop: '12px' }}>
                <span>Bắp nước:</span>
                <div className="combos-list-text" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, marginLeft: '16px' }}>
                  {selectedCombos.map((c, i) => (
                    <div key={i} className="combo-item-text" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '16px' }}>
                      <strong style={{ color: '#eee', fontWeight: '600' }}>{c.name} (x{c.quantity})</strong>
                      <span style={{ color: '#aaa', fontSize: '0.9rem', fontWeight: '500' }}>{(c.price * c.quantity).toLocaleString("vi-VN")}đ</span>
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
        <div className="payment-success-modal-overlay" style={{ zIndex: 102 }}>
          <div className="payment-success-modal-box" style={{ maxWidth: "400px", textAlign: "center", padding: "30px", animation: "popIn 0.3s ease-out forwards", background: "white", borderRadius: "20px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
            <div style={{ fontSize: "5rem", color: "#22c55e", marginBottom: "16px" }}>
              <MdCheckCircle />
            </div>
            <h2 className="modal-title" style={{ fontSize: "1.5rem", color: "#22c55e", marginBottom: "12px", fontWeight: "bold" }}>
              THANH TOÁN THÀNH CÔNG!
            </h2>
            <p className="modal-desc" style={{ fontSize: "0.95rem", color: "#4b5563", marginBottom: "24px" }}>
              Cảm ơn bạn đã đặt vé. Hệ thống đang chuyển hướng đến trang Vé Của Tôi...
            </p>
            <button
              type="button"
              className="pay-now-btn"
              style={{ width: "100%", background: "#22c55e", border: "none", padding: "14px", borderRadius: "12px", color: "white", fontWeight: "bold", cursor: "pointer" }}
              onClick={handleFinishBooking}
            >
              Xem vé ngay
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}