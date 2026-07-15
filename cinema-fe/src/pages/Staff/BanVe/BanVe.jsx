import "./BanVe.css";
import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useBanVe } from "./BanVe.js";
import { MdMovie, MdChair, MdCheckCircle, MdAdd, MdClose, MdCalendarToday } from "react-icons/md";

export default function StaffBanVe() {
  const todayRef = useRef(null);
  const tabsBarRef = useRef(null);

  useEffect(() => {
    if (todayRef.current && tabsBarRef.current) {
      todayRef.current.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
    }
  }, []);
  const {
    movies,
    rooms,
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
    showAddShowtime, setShowAddShowtime,
    addShowtimeForm, setAddShowtimeForm,
    addShowtimeLoading, addShowtimeError,
    handleAddShowtime,
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

      <div className="date-tabs-bar" ref={tabsBarRef}>
        {dates.map((dateItem) => {
          const isActive = selectedDateIso === dateItem.iso;
          const isToday = dateItem.iso === new Date().toISOString().split("T")[0];
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
              ref={isToday ? todayRef : null}
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
            <div className="staff-empty-showtime">
              <p className="staff-empty-text">
                Không có lịch chiếu phim nào trong ngày này.
              </p>
              <button
                type="button"
                className="staff-add-showtime-btn"
                onClick={() => setShowAddShowtime(true)}
              >
                <MdAdd /> Tạo Suất Chiếu Mới
              </button>
            </div>
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

      {/* ── Modal Tạo Suất Chiếu Mới ── */}
      {showAddShowtime && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h5 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <MdCalendarToday className="text-green-600" /> Tạo Suất Chiếu Mới
              </h5>
              <button type="button" onClick={() => setShowAddShowtime(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none">
                <MdClose />
              </button>
            </div>

            <form onSubmit={handleAddShowtime} className="p-6 space-y-4">
              {/* Phim */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Phim <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  value={addShowtimeForm.movieId}
                  onChange={e => setAddShowtimeForm(f => ({ ...f, movieId: e.target.value }))}
                >
                  <option value="">-- Chọn phim --</option>
                  {movies.map(m => (
                    <option key={m.id || m.movieId} value={m.id || m.movieId}>
                      {m.title || m.Title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phòng chiếu */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Phòng chiếu <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  value={addShowtimeForm.roomId}
                  onChange={e => setAddShowtimeForm(f => ({ ...f, roomId: e.target.value }))}
                >
                  <option value="">-- Chọn phòng --</option>
                  {rooms.map(r => (
                    <option key={r.id || r.roomId} value={r.id || r.roomId}>
                      {r.roomName || r.RoomName || r.name} {r.cinema?.cinemaName ? `(${r.cinema.cinemaName})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ngày & Giờ bắt đầu */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Ngày chiếu <span className="text-red-500">*</span>
                  </label>
                  <input type="date"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    value={addShowtimeForm.showDate}
                    onChange={e => setAddShowtimeForm(f => ({ ...f, showDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Giờ bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input type="time"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    value={addShowtimeForm.startTime}
                    onChange={e => setAddShowtimeForm(f => ({ ...f, startTime: e.target.value }))}
                  />
                </div>
              </div>

              {/* Thời lượng & Giá */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Thời lượng (phút)
                  </label>
                  <input type="number" min="30" max="360"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    value={addShowtimeForm.duration}
                    onChange={e => setAddShowtimeForm(f => ({ ...f, duration: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Giá vé (đ)
                  </label>
                  <input type="number" min="0" step="5000"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    value={addShowtimeForm.basePrice}
                    onChange={e => setAddShowtimeForm(f => ({ ...f, basePrice: e.target.value }))}
                  />
                </div>
              </div>

              {addShowtimeError && (
                <p className="text-red-500 text-xs font-semibold">{addShowtimeError}</p>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddShowtime(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
                  Hủy
                </button>
                <button type="submit" disabled={addShowtimeLoading}
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-60">
                  {addShowtimeLoading ? "Đang tạo..." : "Tạo Suất Chiếu"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}