import "./BanVe.css";
import { useBanVe } from "./useBanVe.js";
import { MdMovie, MdChair, MdCheckCircle } from "react-icons/md";

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
  } = useBanVe();

  return (
    <div className="staff-banve-container">
      <h4 className="staff-banve-title">
        <MdMovie className="staff-banve-title-icon" />
        Bán Vé Tại Quầy
      </h4>

      {error && (
        <div className="staff-alert-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {successReceipt && (
        <div className="receipt-success-card">
          <div className="receipt-success-icon">
            <MdCheckCircle />
          </div>

          <div className="receipt-success-content">
            <h5>Thanh Toán & Xuất Vé Thành Công!</h5>

            <div className="receipt-info-grid">
              <div>
                <strong>Mã hóa đơn:</strong> {successReceipt.ticketCode}
              </div>

              <div>
                <strong>Khách hàng:</strong> {successReceipt.customerName}{" "}
                {successReceipt.customerPhone
                  ? `(${successReceipt.customerPhone})`
                  : ""}
              </div>

              <div>
                <strong>Phim:</strong> {successReceipt.movieTitle}
              </div>

              <div>
                <strong>Phòng chiếu:</strong> {successReceipt.roomName}
              </div>

              <div>
                <strong>Suất chiếu:</strong> {successReceipt.showtimeTime} -{" "}
                {successReceipt.showtimeDate}
              </div>

              <div>
                <strong>Ghế đã mua:</strong> {successReceipt.seats}
              </div>

              <div className="receipt-total-row">
                <span>Tổng tiền đã thu:</span>
                <strong>{formatMoney(successReceipt.totalAmount)} đ</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSuccessReceipt(null)}
              className="receipt-continue-btn"
            >
              Tiếp tục bán vé
            </button>
          </div>
        </div>
      )}

      <div className="date-tabs-bar">
        {dates.map((dateItem) => {
          const isActive = selectedDateIso === dateItem.iso;
          const [year, month, day] = dateItem.iso.split("-");
          const dateObj = new Date(Number(year), Number(month) - 1, Number(day));

          const daysOfWeek = [
            "CN",
            "Thứ 2",
            "Thứ 3",
            "Thứ 4",
            "Thứ 5",
            "Thứ 6",
            "Thứ 7",
          ];

          const weekday = daysOfWeek[dateObj.getDay()];
          const dateDisplay = `${day}/${month}`;

          return (
            <button
              key={dateItem.iso}
              type="button"
              onClick={() => {
                setSelectedDateIso(dateItem.iso);
                setSelectedShowtime(null);
                setSelectedMovie(null);
              }}
              className={`date-tab-btn ${isActive ? "active" : ""}`}
            >
              <span className="date-tab-day">{dateDisplay}</span>
              <span className="date-tab-weekday">{weekday}</span>
            </button>
          );
        })}
      </div>

      <div className="staff-banve-layout">
        <div className="showtime-panel">
          <h5 className="staff-panel-title">
            <span></span>
            Lịch Chiếu Phim
          </h5>

          {loading ? (
            <p className="staff-loading-text">Đang tải lịch chiếu...</p>
          ) : moviesWithShowtimes.length === 0 ? (
            <p className="staff-empty-text">
              Không có lịch chiếu phim nào trong ngày này.
            </p>
          ) : (
            <div className="movie-showtime-list">
              {moviesWithShowtimes.map((movie) => (
                <div
                  key={movie.id || movie.movieId || movie.MovieId || movie.title}
                  className="movie-showtime-item"
                >
                  <div className="movie-showtime-info">
                    {movie.posterUrl && (
                      <img
                        src={movie.posterUrl}
                        alt={movie.title || ""}
                        className="movie-showtime-poster"
                      />
                    )}

                    <div className="movie-showtime-text">
                      <span className="movie-age-badge">
                        {movie.ageRating}
                      </span>

                      <h6>{movie.title}</h6>

                      <p>{movie.duration}</p>
                    </div>
                  </div>

                  <div className="counter-showtime-grid">
                    {movie.showtimes.map((showtime) => {
                      const hour = getShowtimeHour(showtime);

                      const isSelected =
                        selectedShowtime &&
                        String(getShowtimeId(selectedShowtime)) ===
                          String(getShowtimeId(showtime));

                      return (
                        <button
                          key={
                            getShowtimeId(showtime) ||
                            showtime.id ||
                            showtime.showtimeId ||
                            showtime.ShowtimeId
                          }
                          type="button"
                          onClick={() => {
                            setSelectedShowtime(showtime);
                            setSelectedMovie(movie);
                          }}
                          className={`counter-showtime-btn ${
                            isSelected ? "active" : ""
                          }`}
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
        </div>

        <div className="seat-panel">
          <h5 className="staff-panel-title">
            <span></span>
            Sơ Đồ Ghế
          </h5>

          {!selectedShowtime ? (
            <div className="seat-empty-state">
              <MdChair className="seat-empty-icon" />
              <p>Vui lòng chọn suất chiếu từ danh sách phim bên cạnh.</p>
            </div>
          ) : loadingSeats ? (
            <div className="seat-loading-state">
              <span className="seat-loading-spinner"></span>
              Đang tải sơ đồ ghế...
            </div>
          ) : (
            <>
              <div className="counter-seat-map">
                <div className="counter-screen">MÀN HÌNH</div>

                <div className="counter-seat-rows">
                  {sortRows(rowKeys).map((row) => (
                    <div key={row} className="counter-seat-row">
                      <span className="counter-row-letter">{row}</span>

                      <div className="counter-seat-cols">
                        {sortSeatsByPosition(groupedSeats[row] || []).map(
                          (seat) => {
                            const seatId = getSeatId(seat);
                            const label = getSeatDisplayLabel(seat, row);
                            const booked = isSeatBooked(seat);
                            const seatTypeLabel = getSeatTypeLabel(seat);
                            const price = getSeatPrice(seat, selectedShowtime);

                            return (
                              <button
                                key={seatId}
                                type="button"
                                disabled={booked}
                                onClick={() => handleSeatClick(seat)}
                                className={getSeatClassName(seat)}
                                title={`${label} (${seatTypeLabel} - ${formatMoney(
                                  price
                                )} đ)`}
                              >
                                {label}
                              </button>
                            );
                          }
                        )}
                      </div>

                      <span className="counter-row-letter">{row}</span>
                    </div>
                  ))}
                </div>

                <div className="counter-seat-legend">
                  <div className="counter-legend-item">
                    <span className="counter-legend-box legend-standard"></span>
                    Thường
                  </div>

                  <div className="counter-legend-item">
                    <span className="counter-legend-box legend-vip"></span>
                    VIP
                  </div>

                  <div className="counter-legend-item">
                    <span className="counter-legend-box legend-couple"></span>
                    Couple
                  </div>

                  <div className="counter-legend-item">
                    <span className="counter-legend-box legend-selected"></span>
                    Đang chọn
                  </div>

                  <div className="counter-legend-item counter-legend-disabled">
                    <span className="counter-legend-box legend-taken"></span>
                    Đã bán
                  </div>
                </div>
              </div>

              <form onSubmit={handleSellTickets} className="sell-ticket-form">
                <div className="customer-form-fields">
                  <div className="counter-form-group">
                    <label>
                      Tên Khách Hàng <span>*</span>
                    </label>

                    <input
                      type="text"
                      required
                      placeholder="Nhập tên khách hàng"
                      value={customer.name}
                      onChange={(event) =>
                        setCustomer({ ...customer, name: event.target.value })
                      }
                    />
                  </div>

                  <div className="counter-form-group">
                    <label>Số Điện Thoại</label>

                    <input
                      type="text"
                      placeholder="Nhập số điện thoại"
                      value={customer.phone}
                      onChange={(event) =>
                        setCustomer({ ...customer, phone: event.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="counter-payment-summary">
                  <div className="counter-payment-info">
                    <div>
                      Ghế đã chọn: <strong>{getSelectedSeatsText()}</strong>
                    </div>

                    <div>
                      Phòng chiếu:{" "}
                      <strong>
                        {selectedShowtime.roomName ||
                          selectedShowtime.RoomName ||
                          `Phòng ${getShowtimeRoomId(selectedShowtime)}`}
                      </strong>
                    </div>

                    <div>
                      Giá vé cơ bản:{" "}
                      <strong>{formatMoney(getSelectedShowtimeBasePrice())} đ</strong>
                    </div>
                  </div>

                  <div className="counter-total-row">
                    <span>Tổng tiền:</span>
                    <strong>{formatMoney(totalAmount)} đ</strong>
                  </div>

                  <button
                    type="submit"
                    disabled={selectedSeats.length === 0 || loading}
                    className="counter-submit-btn"
                  >
                    {loading ? "Đang xử lý..." : "XUẤT VÉ & THANH TOÁN"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}