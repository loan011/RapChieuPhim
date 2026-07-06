import { Link } from "react-router-dom";
import {
  MdLocationOn,
  MdCalendarToday,
  MdAccessTime,
  MdPayment,
  MdCheckCircle,
  MdQrCode2,
} from "react-icons/md";

import CustomerProfileDropdown from "../../components/CustomerProfileDropdown";
import "../../styles/Booking.css";

import {
  useBooking,

  getMovieTitle,
  getMoviePoster,
  getMovieAgeRating,
  getMovieDuration,
  getMovieDirector,

  getCinemaId,
  getCinemaName,
  getCinemaNameById,

  getRoomName,
  findRoomByShowtime,

  getShowtimeId,
  getShowtimeHour,
  getShowtimeBasePrice,

  getSeatId,
  getSeatType,
  getSeatLabel,
  getSeatDisplayNumber,
  isSeatAvailable,
  getSeatPrice,
} from "./usebooking.js";

export default function Booking() {
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
  } = useBooking();

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getSeatSortNumber = (seat) => {
    const raw =
      seat?.seatNumber ??
      seat?.SeatNumber ??
      seat?.seatNo ??
      seat?.SeatNo ??
      getSeatDisplayNumber(seat) ??
      getSeatLabel(seat);

    const match = String(raw).match(/\d+/);

    return match ? Number(match[0]) : 0;
  };

  const sortSeatsByNumber = (seats = []) => {
    return [...seats].sort(
      (a, b) => getSeatSortNumber(a) - getSeatSortNumber(b)
    );
  };

  const sortRows = (rows = []) => {
    return [...rows].sort((a, b) =>
      String(a).localeCompare(String(b), "vi", { numeric: true })
    );
  };

  const normalizeSeatClassType = (seatType) => {
    const type = String(seatType || "").toLowerCase();

    if (type === "normal") return "standard";
    if (type === "thường") return "standard";
    if (type === "sweetbox") return "couple";

    return type;
  };

  const isImageSrc = (value) => {
    const text = String(value || "").trim();

    return (
      text.startsWith("/") ||
      text.startsWith("http://") ||
      text.startsWith("https://") ||
      text.startsWith("data:image")
    );
  };

  const renderComboImage = (image, name) => {
    if (isImageSrc(image)) {
      return (
        <img
          src={image}
          alt={name}
          style={{
            width: "42px",
            height: "42px",
            objectFit: "contain",
            borderRadius: "8px",
          }}
        />
      );
    }

    return <span style={{ fontSize: "2rem" }}>{image || "🍿"}</span>;
  };

  if (loading) {
    return (
      <div className="booking-loading">
        Đang tải thông tin phim và phòng chiếu...
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="booking-loading">
        Không tìm thấy thông tin bộ phim này!
        {bookingError && (
          <p style={{ marginTop: "8px", color: "#ef4444" }}>
            {bookingError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="booking-page-layout">
      <div className="movie-top-login">
        {userEmail ? (
          <CustomerProfileDropdown />
        ) : (
          <>
            <Link to="/login">Đăng nhập</Link>
            <span style={{ margin: "0 6px" }}>|</span>
            <Link to="/register">Đăng ký</Link>
          </>
        )}
      </div>

      <header className="movie-header">
        <div className="movie-logo">
          <span>Cinemas</span>
          <b>HCM</b>
        </div>

        <nav>
          <Link to="/movies">PHIM</Link>
          <Link to="/">LỊCH CHIẾU THEO RẠP</Link>
          <Link to="/cinema">RẠP</Link>
          <Link to="/ticket-price">GIÁ VÉ</Link>
          <a href="#news">TIN MỚI VÀ ƯU ĐÃI</a>
          <a href="#franchise">NHƯỢNG QUYỀN</a>
          <a href="#member">THÀNH VIÊN</a>
        </nav>
      </header>

      <div className="booking-main-container">
        <div className="booking-left-section">
          <div className="booking-movie-summary-card">
            <img
              src={getMoviePoster(movie)}
              alt={getMovieTitle(movie)}
              className="booking-summary-poster"
            />

            <div className="booking-summary-info">
              <span className="age-badge-style">
                {getMovieAgeRating(movie)}
              </span>

              <h1>{getMovieTitle(movie)}</h1>

              <p>⏱ Thời lượng: {getMovieDuration(movie)}</p>
              <p>🎬 Đạo diễn: {getMovieDirector(movie)}</p>
            </div>
          </div>

          <div className="booking-section-card">
            <h2 className="step-title">
              <span className="step-num-icon">1</span>
              Chọn Suất Chiếu
            </h2>

            <div className="params-selectors-grid">
              <div className="param-group">
                <label>
                  <MdLocationOn /> Chọn Rạp
                </label>

                <select
                  value={selectedCinemaId}
                  onChange={(e) => handleCinemaChange(e.target.value)}
                >
                  <option value="">Chọn rạp</option>

                  {cinemas.map((cinema) => {
                    const id = getCinemaId(cinema);

                    return (
                      <option key={id} value={String(id)}>
                        {getCinemaName(cinema)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="param-group">
                <label>
                  <MdCalendarToday /> Chọn Ngày
                </label>

                <select
                  value={selectedDateIso}
                  onChange={(e) => handleDateChange(e.target.value)}
                >
                  {dates.map((date) => (
                    <option key={date.iso} value={date.iso}>
                      {date.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="showtimes-selector-block">
              <label className="sub-param-label">
                <MdAccessTime /> Khung Giờ Chiếu Trong Ngày
              </label>

              <div className="booking-showtimes-grid">
                {filteredShowtimes.length > 0 ? (
                  filteredShowtimes.map((showtime) => {
                    const showtimeId = getShowtimeId(showtime);
                    const time = getShowtimeHour(showtime);
                    const room = findRoomByShowtime(showtime, rooms);
                    const roomName = room ? getRoomName(room) : "N/A";

                    const isActive =
                      String(getShowtimeId(selectedShowtime)) ===
                      String(showtimeId);

                    return (
                      <button
                        key={showtimeId}
                        type="button"
                        className={`booking-time-btn ${
                          isActive ? "active" : ""
                        }`}
                        onClick={() => handleShowtimeClick(showtime)}
                      >
                        {time} ({roomName})
                      </button>
                    );
                  })
                ) : (
                  <p className="no-showtimes-text">
                    Không có suất chiếu nào phù hợp trong ngày này.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="booking-section-card">
            <h2 className="step-title">
              <span className="step-num-icon">2</span>
              Chọn Ghế Ngồi
            </h2>

            {loadingSeats ? (
              <div className="seats-loading">
                Đang tải sơ đồ ghế ngồi...
              </div>
            ) : selectedShowtime && allSeats.length > 0 ? (
              <>
                <div className="cinema-screen-container">
                  <div className="cinema-screen-curved"></div>
                  <p className="screen-label">MÀN HÌNH CHIẾU</p>
                </div>

                <div className="seats-map-matrix">
                  {sortRows(rowsKeys).map((row) => (
                    <div key={row} className="seats-row">
                      <span className="row-letter">{row}</span>

                      <div className="seats-row-cols">
                        {sortSeatsByNumber(groupedSeats[row] || []).map(
                          (seat) => {
                            const available = isSeatAvailable(
                              seat,
                              availableSeats
                            );

                            const selected = selectedSeats.some(
                              (s) =>
                                String(getSeatId(s)) === String(getSeatId(seat))
                            );

                            const seatType = getSeatType(seat);
                            const seatClassType =
                              normalizeSeatClassType(seatType);

                            let seatClass = "seat-node";

                            if (!available) {
                              seatClass += " taken";
                            } else if (selected) {
                              seatClass += " selected";
                            } else {
                              seatClass += ` ${seatClassType}`;
                            }

                            return (
                              <div
                                key={getSeatId(seat)}
                                className={seatClass}
                                onClick={() => handleSeatClick(seat)}
                                title={`${getSeatLabel(
                                  seat
                                )} (${seatType} - ${getSeatPrice(
                                  seat,
                                  selectedShowtime
                                ).toLocaleString("vi-VN")}đ)`}
                              >
                                {getSeatDisplayNumber(seat)}
                              </div>
                            );
                          }
                        )}
                      </div>

                      <span className="row-letter">{row}</span>
                    </div>
                  ))}
                </div>

                <div className="seats-legend-bar">
                  <div className="legend-item">
                    <div className="seat-node legend-box standard"></div>
                    <span>
                      Thường (
                      {Number(
                        getShowtimeBasePrice(selectedShowtime)
                      ).toLocaleString("vi-VN")}
                      đ)
                    </span>
                  </div>

                  <div className="legend-item">
                    <div className="seat-node legend-box vip"></div>
                    <span>
                      VIP (
                      {(
                        Number(getShowtimeBasePrice(selectedShowtime)) + 20000
                      ).toLocaleString("vi-VN")}
                      đ)
                    </span>
                  </div>

                  <div className="legend-item">
                    <div className="seat-node legend-box couple"></div>
                    <span>
                      Couple (
                      {(
                        Number(getShowtimeBasePrice(selectedShowtime)) + 40000
                      ).toLocaleString("vi-VN")}
                      đ)
                    </span>
                  </div>

                  <div className="legend-item">
                    <div className="seat-node legend-box selected"></div>
                    <span>Đang chọn</span>
                  </div>

                  <div className="legend-item">
                    <div className="seat-node legend-box taken"></div>
                    <span>Đã đặt</span>
                  </div>
                </div>
              </>
            ) : selectedShowtime && allSeats.length === 0 ? (
              <p className="no-seats-text">
                Phòng chiếu này chưa có dữ liệu ghế.
              </p>
            ) : (
              <p className="no-seats-text">
                Vui lòng chọn suất chiếu để hiển thị sơ đồ ghế.
              </p>
            )}
          </div>
        </div>

        <div className="booking-right-sidebar">
          <div className="checkout-summary-card">
            <h2 className="summary-title">Tóm Tắt Đặt Vé</h2>

            {isHoldActive && (
              <div className="seat-hold-timer-alert">
                ⏱ Giữ ghế tạm thời: <strong>{formatTime(timeLeft)}</strong>
              </div>
            )}

            <div className="summary-divider"></div>

            <div className="summary-detail-list">
              <div className="summary-row-item">
                <span className="label">Phim:</span>
                <span className="value font-bold text-red-500">
                  {getMovieTitle(movie)}
                </span>
              </div>

              <div className="summary-row-item">
                <span className="label">Rạp:</span>
                <span className="value">
                  {getCinemaNameById(cinemas, selectedCinemaId)}
                </span>
              </div>

              <div className="summary-row-item">
                <span className="label">Ngày chiếu:</span>
                <span className="value">
                  {dates.find((d) => d.iso === selectedDateIso)?.label ||
                    selectedDateIso ||
                    "Chưa chọn"}
                </span>
              </div>

              <div className="summary-row-item">
                <span className="label">Suất chiếu:</span>
                <span className="value font-bold">
                  {selectedShowtime
                    ? getShowtimeHour(selectedShowtime)
                    : "Chưa chọn"}
                </span>
              </div>

              <div className="summary-row-item">
                <span className="label">Ghế đã chọn:</span>
                <span className="value font-bold text-yellow-500">
                  {selectedSeats.length > 0
                    ? selectedSeats.map(getSeatLabel).join(", ")
                    : "Chưa chọn"}
                </span>
              </div>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total-price-box">
              <span>TỔNG TIỀN</span>
              <h2>{totalAmount.toLocaleString("vi-VN")}đ</h2>
            </div>

            {bookingError && (
              <p className="booking-error-text">{bookingError}</p>
            )}

            <button
              type="button"
              className="booking-checkout-submit-btn"
              onClick={handleCheckout}
              disabled={selectedSeats.length === 0 || !selectedShowtime}
            >
              <MdPayment /> THANH TOÁN
            </button>
          </div>
        </div>
      </div>

      {showComboModal && (
        <div className="payment-success-modal-overlay" style={{ zIndex: 100 }}>
          <div
            className="payment-success-modal-box"
            style={{
              maxWidth: "600px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "24px",
            }}
          >
            <h2
              className="modal-title"
              style={{
                fontSize: "1.3rem",
                fontWeight: "800",
                color: "#16a34a",
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
                color: "#6b7280",
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
                const itemId = item.comboId ?? item.foodId ?? item.id;
                const quantity = comboQuantities[itemId] || 0;

                return (
                  <div
                    key={itemId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px",
                      border: "1px solid #f3f4f6",
                      borderRadius: "12px",
                      background: "#f9fafb",
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
                            color: "#374151",
                            fontSize: "0.9rem",
                            margin: 0,
                          }}
                        >
                          {item.name}
                        </h4>

                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#9ca3af",
                            margin: "2px 0 0",
                            lineHeight: "1.2",
                          }}
                        >
                          {item.description}
                        </p>

                        <p
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            color: "#f97316",
                            margin: "4px 0 0",
                          }}
                        >
                          {Number(item.price).toLocaleString("vi-VN")}đ
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginLeft: "12px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => updateComboQuantity(itemId, -1)}
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          border: "1px solid #d1d5db",
                          background: "#fff",
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                        disabled={quantity <= 0}
                      >
                        -
                      </button>

                      <span
                        style={{
                          width: "16px",
                          textAlign: "center",
                          fontWeight: "bold",
                        }}
                      >
                        {quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateComboQuantity(itemId, 1)}
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          border: "1px solid #d1d5db",
                          background: "#fff",
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                background: "#f3f4f6",
                borderRadius: "10px",
                padding: "14px",
                marginBottom: "20px",
              }}
            >
              <h4
                style={{
                  margin: "0 0 10px",
                  fontWeight: "700",
                  fontSize: "0.85rem",
                  color: "#374151",
                  borderBottom: "1px dashed #d1d5db",
                  paddingBottom: "6px",
                }}
              >
                CHI TIẾT ĐƠN HÀNG
              </h4>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "0.8rem",
                  color: "#4b5563",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Tiền vé ({selectedSeats.length} ghế):</span>
                  <span>{totalAmount.toLocaleString("vi-VN")}đ</span>
                </div>

                {totalCombosAmount > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#16a34a",
                      fontWeight: "600",
                    }}
                  >
                    <span>Bắp nước mua thêm:</span>
                    <span>+{totalCombosAmount.toLocaleString("vi-VN")}đ</span>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.95rem",
                    fontWeight: "800",
                    color: "#111827",
                    borderTop: "1px solid #d1d5db",
                    paddingTop: "8px",
                    marginTop: "4px",
                  }}
                >
                  <span>TỔNG CỘNG:</span>
                  <span style={{ color: "#ef4444" }}>
                    {finalTotalAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                className="modal-finish-close-btn"
                style={{ flex: 1, background: "#9ca3af", padding: "10px 0" }}
                onClick={() => setShowComboModal(false)}
              >
                HỦY
              </button>

              <button
                type="button"
                className="modal-finish-close-btn"
                style={{ flex: 2, background: "#f97316", padding: "10px 0" }}
                onClick={handleConfirmBooking}
              >
                XÁC NHẬN ĐẶT VÉ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}