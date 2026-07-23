import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MdLocationOn,
  MdCalendarToday,
  MdAccessTime,
  MdPayment,
  MdArrowBack,
} from "react-icons/md";
import "../../styles/Booking.css";
import CustomerProfileDropdown from "../../components/CustomerProfileDropdown";
import { useBooking } from "./usebooking";

import {
  getCinemaId,
  getCinemaName,
  getMovieId,
  getMovieTitle,
  getMoviePoster,
  getMovieAgeRating,
  getMovieDuration,
  getMovieDirector,
  getRoomId,
  getRoomName,
  getShowtimeId,
  getShowtimeRoomId,
  getShowtimeDate,
  getShowtimeHour,
  getShowtimeBasePrice,
  getSeatId,
  getSeatRow,
  getSeatNumber,
  getSeatType,
  getSeatLabel,
  getSeatDisplayNumber,
  isSeatAvailable,
  getSeatPrice,
  groupSeatsByRow,
  getCinemaNameById,
} from "./usebooking";

// Helper to format date like "Thứ 7, 18/05/2024"
function getFormattedDateLabel(dateIso) {
  if (!dateIso) return "Chưa chọn";
  const d = new Date(dateIso);
  if (isNaN(d.getTime())) return String(dateIso);
  const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  const dayLabel = dayNames[d.getDay()];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dayLabel}, ${dd}/${mm}/${yyyy}`;
}

function renderComboImage(image, name) {
  let imgSrc = image || "";
  
  if (imgSrc && !imgSrc.startsWith("http") && !imgSrc.startsWith("data:") && !imgSrc.startsWith("/")) {
    imgSrc = `http://localhost:7013/uploads/${imgSrc}`;
  }
  
  if (!imgSrc) {
    imgSrc = "/img/no-image.png";
  }

  return (
    <img
      src={imgSrc}
      alt={name || "Combo"}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = "/img/no-image.png";
      }}
      style={{
        width: "55px",
        height: "55px",
        borderRadius: "8px",
        objectFit: "cover",
        background: "rgba(255,255,255,0.05)",
      }}
    />
  );
}

export default function Booking() {
  const navigate = useNavigate();

  const {
    movie,
    cinemas,
    rooms,
    selectedCinemaId,
    selectedDateIso,
    selectedShowtime,
    allSeats,
    availableSeats,
    selectedSeats,
    setSelectedSeats,
    loading,
    loadingSeats,
    bookingError,
    userEmail,
    dates,
    filteredShowtimes,
    handleCinemaChange,
    handleDateChange,
    handleShowtimeClick,
    handleSeatClick,
    totalAmount,
    rowsKeys,
    groupedSeats,
    handleCheckout,
    timeLeft,
    isHoldActive,

    showComboModal,
    setShowComboModal,
    combos,
    comboQuantities,
    selectedCombos,
    totalCombosAmount,
    finalTotalAmount,
    updateComboQuantity,
    handleConfirmBooking,

    // Customer Coupon states
    couponInput,
    setCouponInput,
    appliedDiscount,
    discountAmount,
    discountError,
    discountSuccess,
    availableDiscounts,
    showVoucherModal,
    setShowVoucherModal,
    handleApplyCoupon,
    handleRemoveCoupon,
  } = useBooking();

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const sortSeatsByNumber = (seats = []) => {
    return [...seats].sort(
      (a, b) => {
        const aNum = parseInt(getSeatNumber(a)) || 0;
        const bNum = parseInt(getSeatNumber(b)) || 0;
        return aNum - bNum;
      }
    );
  };

  const sortRows = (rows = []) => {
    return [...rows].sort((a, b) =>
      String(a).localeCompare(String(b), "vi", { numeric: true })
    );
  };

  const normalizeSeatClassType = (seatType) => {
    const type = String(seatType || "").toLowerCase();
    if (type === "normal" || type === "thường") return "standard";
    if (type === "sweetbox") return "couple";
    return type;
  };

  // Find active room and cinema models
  const selectedCinema = useMemo(() => {
    return cinemas.find(c => String(getCinemaId(c)) === String(selectedCinemaId));
  }, [cinemas, selectedCinemaId]);

  const selectedRoom = useMemo(() => {
    if (!selectedShowtime) return null;
    const roomId = getShowtimeRoomId(selectedShowtime);
    return rooms.find(r => String(getRoomId(r)) === String(roomId));
  }, [rooms, selectedShowtime]);

  // Group and render seats, merging couple seats into double-wide capsules
  const renderSeatsRow = (row) => {
    const sortedSeats = sortSeatsByNumber(groupedSeats[row] || []);
    const elements = [];

    for (let i = 0; i < sortedSeats.length; i++) {
      const seat = sortedSeats[i];
      const seatType = getSeatType(seat);
      const seatClassType = normalizeSeatClassType(seatType);

      // Group couple seats (consecutive Sweetbox/Couple seats)
      if (seatClassType === "couple") {
        const nextSeat = sortedSeats[i + 1];
        const nextSeatType = nextSeat ? getSeatType(nextSeat) : "";
        const nextSeatClassType = nextSeat ? normalizeSeatClassType(nextSeatType) : "";

        if (nextSeat && nextSeatClassType === "couple") {
          const seatId1 = getSeatId(seat);
          const seatId2 = getSeatId(nextSeat);

          const available1 = isSeatAvailable(seat, availableSeats);
          const available2 = isSeatAvailable(nextSeat, availableSeats);
          const available = available1 && available2;

          const selected1 = selectedSeats.some(s => String(getSeatId(s)) === String(seatId1));
          const selected2 = selectedSeats.some(s => String(getSeatId(s)) === String(seatId2));
          const selected = selected1 || selected2;

          let seatClass = "seat-node couple-merged";
          if (!available) {
            seatClass += " taken";
          } else if (selected) {
            seatClass += " selected";
          } else {
            seatClass += " couple";
          }

          const num1 = getSeatDisplayNumber(seat);
          const num2 = getSeatDisplayNumber(nextSeat);

          elements.push(
            <button
              key={`${seatId1}-${seatId2}`}
              type="button"
              className={seatClass}
              disabled={!available}
              onClick={async () => {
                if (!available) return;
                // Gọi tuần tự để đảm bảo state và API hoạt động chuẩn xác
                await handleSeatClick(seat);
                await handleSeatClick(nextSeat);
              }}
              title={`Ghế đôi ${getSeatRow(seat)}${num1}-${getSeatRow(nextSeat)}${num2} (Couple - ${(getSeatPrice(seat, selectedShowtime, rooms) * 2).toLocaleString("vi-VN")}đ)`}
            >
              {selected ? (
                <span className="selected-checkmark">✓</span>
              ) : (
                `${getSeatRow(seat)}${num1} ${getSeatRow(nextSeat)}${num2}`
              )}
            </button>
          );

          i++; // Skip next seat as it is merged
          continue;
        }
      }

      // Standard seat node
      const seatId = getSeatId(seat);
      const available = isSeatAvailable(seat, availableSeats);
      const selected = selectedSeats.some(s => String(getSeatId(s)) === String(seatId));

      let seatClass = "seat-node";
      if (!available) {
        seatClass += " taken";
      } else if (selected) {
        seatClass += " selected";
      } else {
        seatClass += ` ${seatClassType}`;
      }

      elements.push(
        <button
          key={seatId}
          type="button"
          className={seatClass}
          disabled={!available}
          onClick={() => handleSeatClick(seat)}
          title={`${getSeatLabel(seat)} (${seatType} - ${getSeatPrice(seat, selectedShowtime, rooms).toLocaleString("vi-VN")}đ)`}
        >
          {selected ? (
            <span className="selected-checkmark">✓</span>
          ) : !available ? (
            <span className="seat-lock-icon">🔒</span>
          ) : (
            getSeatDisplayNumber(seat)
          )}
        </button>
      );
    }

    return elements;
  };

  return (
    <div className="booking-page-layout">
      {/* Top Login Bar */}
      <div className="movie-top-login">
        <div className="top-login-content">
          {userEmail ? (
            <CustomerProfileDropdown />
          ) : (
            <div className="auth-links">
              <Link to="/login">Đăng nhập</Link>
              <span> | </span>
              <Link to="/register">Đăng ký</Link>
            </div>
          )}
        </div>
      </div>

      {/* Header Bar */}
      <header className="movie-header">
        <div className="movie-logo-container">
          <Link to="/" className="movie-logo">
            <span>Cinemas</span><b>HCM</b>
          </Link>
        </div>

        <nav className="movie-nav">
          <Link to="/showtimes">Lịch chiếu</Link>
          <Link to="/">Phim</Link>
          <Link to="/ticket-price">Giá vé</Link>
        </nav>
      </header>

      {/* Steps indicator bar */}
      <div className="bk-steps-progress-container">
        <div className="bk-steps-progress">
          <div className="bk-step active">
            <span className="step-number">1</span>
            <span className="step-label">Chọn ghế</span>
          </div>
          <div className="bk-step-line active"></div>
          <div className="bk-step">
            <span className="step-number">2</span>
            <span className="step-label">Thanh toán</span>
          </div>
          <div className="bk-step-line"></div>
          <div className="bk-step">
            <span className="step-number">3</span>
            <span className="step-label">Hoàn tất</span>
          </div>
        </div>
      </div>

      {/* Main Grid Wrapper */}
      <div className="booking-main-container bk-booking-grid">
        {/* Left Side: Seat Map */}
        <div className="booking-left-section">
          
          {/* Showtime Static Details Card */}
          {selectedShowtime && (
            <div className="bk-showtime-detail-card">
              <img
                src={getMoviePoster(movie)}
                alt={getMovieTitle(movie)}
                className="bk-detail-poster"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/img/no-image.png";
                }}
              />
              <div className="bk-detail-info">
                <h1 className="bk-detail-title">{getMovieTitle(movie)}</h1>
                
                <div className="bk-detail-grid">
                  <div className="bk-grid-item">
                    <span className="bk-grid-icon">📍</span>
                    <div className="bk-grid-text">
                      <strong>{getCinemaNameById(cinemas, selectedCinemaId)}</strong>
                      <span>{selectedCinema?.address || selectedCinema?.Address || "135 Hai Bà Trưng, Quận 1, TP. HCM"}</span>
                    </div>
                  </div>

                  <div className="bk-grid-item">
                    <span className="bk-grid-icon">🚪</span>
                    <div className="bk-grid-text">
                      <strong>Phòng chiếu</strong>
                      <span>{selectedRoom ? getRoomName(selectedRoom) : "N/A"}</span>
                    </div>
                  </div>

                  <div className="bk-grid-item">
                    <span className="bk-grid-icon">📅</span>
                    <div className="bk-grid-text">
                      <strong>Ngày chiếu</strong>
                      <span>{getFormattedDateLabel(selectedDateIso)}</span>
                    </div>
                  </div>

                  <div className="bk-grid-item">
                    <span className="bk-grid-icon">⏰</span>
                    <div className="bk-grid-text">
                      <strong>Suất chiếu</strong>
                      <span>{getShowtimeHour(selectedShowtime)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bk-detail-format-badge">2D</div>
            </div>
          )}

          {/* Seat selection card */}
          <div className="booking-section-card bk-seat-section">
            {loadingSeats ? (
              <div className="seats-loading">Đang tải sơ đồ ghế ngồi...</div>
            ) : selectedShowtime && allSeats.length > 0 ? (
              <>
                {/* 1. Seat Type Legends Row (Moved to top) */}
                <div className="seats-legend-bar bk-legends-row">
                  <div className="legend-item">
                    <div className="seat-node legend-box standard"></div>
                    <span>
                      Ghế thường / {Number(getSeatPrice({ seatType: "standard" }, selectedShowtime, rooms)).toLocaleString("vi-VN")}đ
                    </span>
                  </div>

                  <div className="legend-item">
                    <div className="seat-node legend-box vip"></div>
                    <span>
                      Ghế VIP / {Number(getSeatPrice({ seatType: "vip" }, selectedShowtime, rooms)).toLocaleString("vi-VN")}đ
                    </span>
                  </div>

                  <div className="legend-item">
                    <div className="seat-node legend-box couple"></div>
                    <span>
                      Ghế Couple / {Number(getSeatPrice({ seatType: "couple" }, selectedShowtime, rooms) * 2).toLocaleString("vi-VN")}đ
                    </span>
                  </div>

                  <div className="legend-item">
                    <div className="seat-node legend-box taken">
                      <span className="seat-lock-icon" style={{ fontSize: "10px", opacity: 0.5 }}>✖</span>
                    </div>
                    <span>Ghế đã đặt / Không bán</span>
                  </div>
                </div>

                {/* 2. Curved screen indicator */}
                <div className="cinema-screen-container bk-screen-box">
                  <div className="cinema-screen-curved"></div>
                  <p className="screen-label">MÀN HÌNH</p>
                </div>
                
                {/* 3. Seat Grid Matrix */}
                <div className="seats-map-matrix bk-matrix-box">
                  {sortRows(rowsKeys).map((row) => (
                    <div key={row} className="seats-row">
                      <span className="row-letter">{row}</span>

                      <div className="seats-row-cols">
                        {renderSeatsRow(row)}
                      </div>

                      <span className="row-letter">{row}</span>
                    </div>
                  ))}
                </div>

                {/* 4. Scroll down note */}
                <div className="bk-scroll-down-note">
                  <span className="bk-scroll-icon">🖱️</span>
                  <span>Kéo xuống để xem thêm (nếu có)</span>
                </div>
              </>
            ) : selectedShowtime && allSeats.length === 0 ? (
              <p className="no-seats-text">Phòng chiếu này chưa có dữ liệu ghế.</p>
            ) : (
              <p className="no-seats-text">Vui lòng chọn suất chiếu để hiển thị sơ đồ ghế.</p>
            )}
          </div>
        </div>

        {/* Right Side: Detailed Booking Info Panel */}
        <div className="booking-right-sidebar">
          <div className="checkout-summary-card bk-summary-sidebar">
            <h2 className="summary-title bk-summary-title">THÔNG TIN ĐẶT VÉ</h2>

            {isHoldActive && (
              <div className="seat-hold-timer-alert">
                ⏱ Giữ ghế tạm thời: <strong>{formatTime(timeLeft)}</strong>
              </div>
            )}

            {/* Movie Info with small poster */}
            <div className="bk-sidebar-movie-row">
              <img
                src={getMoviePoster(movie)}
                alt={getMovieTitle(movie)}
                className="bk-sidebar-poster"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/img/no-image.png";
                }}
              />
              <h3 className="bk-sidebar-movie-title">{getMovieTitle(movie)}</h3>
            </div>

            <div className="summary-divider"></div>

            {/* Showtime specifications */}
            <div className="summary-detail-list bk-sidebar-details">
              <div className="summary-row-item bk-sidebar-row">
                <span className="bk-row-icon">📍</span>
                <span className="bk-row-val">{getCinemaNameById(cinemas, selectedCinemaId)}</span>
              </div>

              <div className="summary-row-item bk-sidebar-row">
                <span className="bk-row-icon">🚪</span>
                <span className="bk-row-val">Phòng chiếu: {selectedRoom ? getRoomName(selectedRoom) : "N/A"}</span>
              </div>

              <div className="summary-row-item bk-sidebar-row">
                <span className="bk-row-icon">📅</span>
                <span className="bk-row-val">Ngày chiếu: {getFormattedDateLabel(selectedDateIso)}</span>
              </div>

              <div className="summary-row-item bk-sidebar-row">
                <span className="bk-row-icon">⏰</span>
                <span className="bk-row-val">Suất chiếu: {selectedShowtime ? getShowtimeHour(selectedShowtime) : "Chưa chọn"}</span>
              </div>

              <div className="summary-row-item bk-sidebar-row">
                <span className="bk-row-icon">🎬</span>
                <span className="bk-row-val">
                  Định dạng:{" "}
                  {selectedRoom?.roomType ||
                    selectedRoom?.RoomType ||
                    selectedShowtime?.room?.roomType ||
                    selectedShowtime?.room?.RoomType ||
                    selectedShowtime?.Room?.roomType ||
                    selectedShowtime?.Room?.RoomType ||
                    "2D"}
                </span>
              </div>
            </div>

            <div className="summary-divider"></div>

            {/* Selected Seats Badges and Clear Button */}
            <div className="bk-sidebar-seats-block">
              <div className="bk-seats-header">
                <strong>GHẾ ĐÃ CHỌN</strong>
                {selectedSeats.length > 0 && (
                  <button
                    type="button"
                    className="bk-clear-all-btn"
                    onClick={() => setSelectedSeats([])}
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
              
              <div className="bk-seats-pills">
                {selectedSeats.length > 0 ? (
                  selectedSeats.map(seat => (
                    <span key={getSeatId(seat)} className="bk-seat-badge">
                      {getSeatLabel(seat)}
                    </span>
                  ))
                ) : (
                  <span className="bk-no-seats-selected">Chưa chọn ghế</span>
                )}
              </div>
            </div>

            <div className="summary-divider"></div>

            {/* Prices Breakdown */}
            <div className="bk-sidebar-prices">
              {selectedSeats.length > 0 && (
                <div className="bk-price-row">
                  <span>Ghế đã chọn ({selectedSeats.length}x)</span>
                  <strong>{totalAmount.toLocaleString("vi-VN")}đ</strong>
                </div>
              )}

              {totalCombosAmount > 0 && (
                <div className="bk-price-row">
                  <span>Combo bắp nước</span>
                  <strong>{totalCombosAmount.toLocaleString("vi-VN")}đ</strong>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="bk-price-row" style={{ color: "#22c55e" }}>
                  <span>Giảm giá ({appliedDiscount?.discountCode})</span>
                  <strong>-{discountAmount.toLocaleString("vi-VN")}đ</strong>
                </div>
              )}
            </div>

            <div className="summary-divider"></div>

            {/* Total calculation */}
            <div className="summary-total-price-box bk-sidebar-total">
              <span>Tổng tạm tính</span>
              <h2 className="bk-total-price">
                {selectedSeats.length > 0
                  ? totalAmount.toLocaleString("vi-VN") + "đ"
                  : "0đ"}
              </h2>
            </div>

            {bookingError && <p className="booking-error-text">{bookingError}</p>}

            {/* Action Buttons */}
            <div className="bk-sidebar-actions">
              <button
                type="button"
                className="booking-checkout-submit-btn bk-btn-checkout"
                onClick={handleCheckout}
                disabled={selectedSeats.length === 0 || !selectedShowtime}
              >
                <MdPayment style={{ marginRight: "8px" }} /> TIẾP TỤC THANH TOÁN
              </button>

              <button
                type="button"
                className="bk-btn-back"
                onClick={() => navigate(-1)}
              >
                <MdArrowBack style={{ marginRight: "6px" }} /> QUAY LẠI
              </button>
            </div>

            {/* Secure payment message */}
            <div className="bk-secure-note">
              <span className="bk-secure-icon">🛡️</span>
              <div className="bk-secure-text">
                <strong>Thành toán bảo mật 100%</strong>
                <span>Thông tin của bạn được bảo vệ tuyệt đối.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Combo modal choice */}
      {showComboModal && (
        <div 
          className="payment-success-modal-overlay" 
          style={{ 
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
        >
          <div
            className="payment-success-modal-box"
            style={{
              maxWidth: "600px",
              width: "90%",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "24px",
              background: "#181818",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "16px",
              color: "#fff",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
              margin: "auto"
            }}
          >
            <h2
              className="modal-title"
              style={{
                fontSize: "1.3rem",
                fontWeight: "800",
                color: "#e50914",
                textAlign: "center",
                marginBottom: "8px",
              }}
            >
              🍿 CHỌN THÊM BẮP NƯỚC 🥤
            </h2>

            <p
              style={{
                textAlign: "center",
                fontSize: "0.85rem",
                color: "rgba(255,255,255,0.6)",
                marginBottom: "20px",
              }}
            >
              Tiết kiệm hơn khi mua kèm combo bắp nước trực tuyến!
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              {combos.map((item) => {
                const itemId = item.id;
                const quantity = comboQuantities[itemId] || 0;
                const isComboItem = item._isCombo;

                return (
                  <div
                    key={itemId}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      padding: "12px",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "12px",
                      background: "#222222",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          flex: 1,
                        }}
                      >
                        {renderComboImage(item.image, item.name)}

                        <div>
                          <h4
                            style={{
                              fontWeight: "700",
                              color: "#fff",
                              fontSize: "0.9rem",
                              margin: 0,
                            }}
                          >
                            {item.name}
                          </h4>
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "rgba(255,255,255,0.5)",
                              margin: "4px 0 0",
                            }}
                          >
                            {item.description}
                          </p>
                          <p
                            style={{
                              fontSize: "0.85rem",
                              color: "#e50914",
                              fontWeight: "700",
                              margin: "4px 0 0",
                            }}
                          >
                            {item.price.toLocaleString("vi-VN")}đ
                          </p>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => updateComboQuantity(itemId, -1)}
                          disabled={quantity <= 0}
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: quantity <= 0 ? "rgba(255,255,255,0.02)" : "#333",
                            color: "#fff",
                            cursor: quantity <= 0 ? "not-allowed" : "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          -
                        </button>

                        <span style={{ minWidth: "20px", textAlign: "center", fontWeight: "700" }}>
                          {quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => updateComboQuantity(itemId, 1)}
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "#333",
                            color: "#fff",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* HIỂN THỊ CHỌN NƯỚC NẾU LÀ COMBO VÀ CÓ CHỌN SỐ LƯỢNG */}
                    {isComboItem && quantity > 0 && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                        <p style={{ fontSize: '0.8rem', color: '#aaa', margin: '0 0 8px 0' }}>Tùy chọn nước ngọt cho Combo:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                          {['Pepsi', '7up', 'Mirinda Cam', 'Trà Đào'].map(drink => (
                            <label key={drink} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#fff', cursor: 'pointer' }}>
                              <input 
                                type="radio" 
                                name={`drink_${itemId}`} 
                                defaultChecked={drink === 'Pepsi'} 
                                style={{ accentColor: '#e50914', cursor: 'pointer', width: '14px', height: '14px' }} 
                              />
                              {drink}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Customer Coupon Block inside Checkout Modal */}
            <div className="bk-sidebar-coupon-block" style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="bk-coupon-header">
                <span>MÃ GIẢM GIÁ / VOUCHER</span>
                {availableDiscounts.length > 0 && (
                  <button
                    type="button"
                    className="bk-show-vouchers-btn"
                    onClick={() => setShowVoucherModal(true)}
                  >
                    🎟️ Chọn voucher
                  </button>
                )}
              </div>

              {!appliedDiscount ? (
                <div className="bk-coupon-input-wrap">
                  <input
                    type="text"
                    className="bk-coupon-input"
                    placeholder="Nhập mã (VD: SUMMER20)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  />
                  <button
                    type="button"
                    className="bk-coupon-apply-btn"
                    onClick={() => handleApplyCoupon(couponInput)}
                    disabled={!couponInput.trim()}
                  >
                    Áp dụng
                  </button>
                </div>
              ) : (
                <div className="bk-coupon-applied-card">
                  <div className="bk-coupon-applied-info">
                    <span className="bk-coupon-applied-code">🏷️ {appliedDiscount.discountCode}</span>
                    <span className="bk-coupon-applied-val">
                      -{discountAmount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <button
                    type="button"
                    className="bk-coupon-remove-btn"
                    onClick={handleRemoveCoupon}
                    title="Gỡ mã giảm giá"
                  >
                    ✕
                  </button>
                </div>
              )}

              {discountError && <div className="bk-coupon-error">{discountError}</div>}
              {discountSuccess && <div className="bk-coupon-success">{discountSuccess}</div>}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "16px",
                marginTop: "16px",
                borderTop: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div>
                <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
                  Tổng tiền thanh toán ({selectedSeats.length}x ghế{totalCombosAmount > 0 ? " + combo" : ""}):
                </span>
                <h3 style={{ margin: 0, color: "#e50914", fontWeight: "800", fontSize: "1.3rem" }}>
                  {finalTotalAmount.toLocaleString("vi-VN")}đ
                </h3>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowComboModal(false)}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px 24px",
                    fontWeight: "700",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  HỦY
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  style={{
                    background: "#e50914",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px 24px",
                    fontWeight: "800",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(229, 9, 20, 0.4)",
                  }}
                >
                  XÁC NHẬN & ĐẶT VÉ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Selection Modal */}
      {showVoucherModal && (
        <div className="bk-voucher-modal-overlay" onClick={() => setShowVoucherModal(false)}>
          <div className="bk-voucher-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#fff" }}>🎟️ Chọn Mã Ưu Đãi</h3>
              <button
                type="button"
                onClick={() => setShowVoucherModal(false)}
                style={{ background: "none", border: "none", color: "#aaa", fontSize: "18px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "60vh", overflowY: "auto" }}>
              {availableDiscounts.length > 0 ? (
                availableDiscounts.map((disc) => {
                  const minOrder = Number(disc.minOrderAmount || 0);
                  const currentTotal = totalAmount + totalCombosAmount;
                  const isEligible = currentTotal >= minOrder;
                  const isSelected = appliedDiscount?.discountCode === disc.discountCode;

                  return (
                    <div
                      key={disc.discountId || disc.discountCode}
                      className="bk-voucher-item"
                      style={{
                        opacity: isEligible ? 1 : 0.65,
                        border: isSelected ? "1px solid #22c55e" : "1px dashed rgba(229, 9, 20, 0.5)",
                        background: isSelected ? "rgba(34, 197, 94, 0.1)" : "rgba(255, 255, 255, 0.03)",
                      }}
                    >
                      <div style={{ flex: 1, paddingRight: "12px" }}>
                        <div className="bk-voucher-code">🏷️ {disc.discountCode}</div>
                        <div className="bk-voucher-desc">
                          {disc.programName || disc.description}
                        </div>
                        <div style={{ fontSize: "11px", color: "#aaa", marginTop: "4px" }}>
                          Mức giảm: <strong>{disc.discountType === "Percent" ? `${disc.discountValue}%` : `${Number(disc.discountValue).toLocaleString("vi-VN")}đ`}</strong>
                          {minOrder > 0 ? ` (Đơn tối thiểu ${minOrder.toLocaleString("vi-VN")}đ)` : ""}
                        </div>
                        {!isEligible && (
                          <div style={{ fontSize: "10px", color: "#f87171", marginTop: "2px" }}>
                            * Đơn hàng chưa đạt mức tối thiểu {minOrder.toLocaleString("vi-VN")}đ
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        className="bk-coupon-apply-btn"
                        style={{ padding: "6px 14px", fontSize: "12px" }}
                        onClick={() => handleApplyCoupon(disc.discountCode)}
                      >
                        {isSelected ? "Đã dùng" : "Áp dụng"}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "20px", textAlign: "center", color: "#888" }}>
                  Chưa có mã giảm giá nào sẵn có.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}