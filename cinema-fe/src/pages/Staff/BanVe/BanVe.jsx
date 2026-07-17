import "./BanVe.css";
import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useBanVe } from "./BanVe.js";
import { MdMovie, MdChair, MdCheckCircle, MdAdd, MdClose, MdCalendarToday, MdFastfood, MdArrowForward, MdRemove, MdPayments, MdQrCode } from "react-icons/md";

export default function StaffBanVe() {
  const todayRef = useRef(null);
  const tabsBarRef = useRef(null);
  const [paymentMethod, setPaymentMethod] = useState("cash"); // "cash" | "qr"

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
    totalFoodAmount,
    grandTotal,
    selectedFoodItems,
    availableFoods,
    selectedFoods,
    changeFoodQty,
    foodStep,
    setFoodStep,
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

              {successReceipt.foodItems?.length > 0 && (
                <div>
                  <strong>Đồ ăn:</strong>{" "}
                  {successReceipt.foodItems.map(f => `${f.name} x${f.quantity}`).join(", ")}
                </div>
              )}

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

                {/* Step indicator */}
                {selectedSeats.length > 0 && (
                  <div className="flex items-center gap-1 mb-4 text-xs font-semibold">
                    {[["1","Ghế"],["2","Đồ ăn"],["3","Xác nhận"]].map(([n, label], i) => (
                      <div key={n} className="flex items-center gap-1">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          foodStep >= i ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"
                        }`}>{n}</span>
                        <span className={foodStep >= i ? "text-green-700" : "text-gray-400"}>{label}</span>
                        {i < 2 && <span className="text-gray-300 mx-0.5">›</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* BƯỚC 1: Ghế đã chọn → nút tiếp theo */}
                {selectedSeats.length > 0 && foodStep === 0 && (
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1.5">
                      <div>Ghế: <strong>{getSelectedSeatsText()}</strong></div>
                      <div>Vé: <strong>{formatMoney(totalAmount)} đ</strong></div>
                    </div>
                    <button type="button"
                      onClick={() => setFoodStep(1)}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                      <MdFastfood /> Chọn Đồ Ăn <MdArrowForward />
                    </button>
                    <button type="button"
                      onClick={() => setFoodStep(2)}
                      className="w-full text-center text-sm text-gray-500 hover:text-gray-700 underline py-1"
                    >
                      Bỏ qua, không mua đồ ăn
                    </button>
                  </div>
                )}

                {/* BƯỚC 2: Chọn đồ ăn */}
                {foodStep === 1 && (
                  <div>
                    <h6 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-1.5">
                      <MdFastfood className="text-green-600" /> Chọn Đồ Ăn & Combo
                    </h6>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1 mb-3">
                      {availableFoods.length === 0 && (
                        <p className="text-gray-400 text-xs text-center py-4">Không có đồ ăn nào.</p>
                      )}
                      {availableFoods.map(food => {
                        const key = `${food.type}-${food.id}`;
                        const qty = selectedFoods[key] || 0;
                        const outOfStock = (food.quantity ?? 0) <= 0;
                        return (
                          <div key={key} className={`flex items-center justify-between gap-2 p-2 rounded-xl border ${outOfStock ? "opacity-50 bg-gray-50" : "bg-white border-gray-100"}`}>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-xl">{food.image}</span>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-gray-800 truncate">{food.name}</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-xs text-green-700 font-bold">{formatMoney(food.price)} đ</span>
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                    outOfStock ? "bg-red-100 text-red-600"
                                    : food.quantity <= 10 ? "bg-amber-100 text-amber-700"
                                    : "bg-emerald-100 text-emerald-700"
                                  }`}>
                                    {outOfStock ? "Hết" : `Còn: ${food.quantity}`}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button type="button" onClick={() => changeFoodQty(food, -1)} disabled={qty === 0}
                                className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-30 hover:bg-gray-50">
                                <MdRemove className="text-sm" />
                              </button>
                              <span className="w-5 text-center text-xs font-bold">{qty}</span>
                              <button type="button" onClick={() => changeFoodQty(food, 1)} disabled={outOfStock || qty >= (food.quantity || 0)}
                                className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-30 hover:bg-gray-50">
                                <MdAdd className="text-sm" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {totalFoodAmount > 0 && (
                      <div className="text-xs text-right text-green-700 font-bold mb-2">
                        Đồ ăn: {formatMoney(totalFoodAmount)} đ
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setFoodStep(2); }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1">
                        Xác nhận <MdArrowForward />
                      </button>
                      <button type="button" onClick={() => { setFoodStep(2); }}
                        className="px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm">
                        Bỏ qua
                      </button>
                    </div>
                  </div>
                )}

                {/* BƯỚC 3: Xác nhận */}
                {(foodStep === 2 || (selectedSeats.length === 0)) && (
                  <div>
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
                      Tiền vé:{" "}
                      <strong>{formatMoney(totalAmount)} đ</strong>
                    </div>

                    {totalFoodAmount > 0 && (
                      <div>
                        Đồ ăn:{" "}
                        <strong>{formatMoney(totalFoodAmount)} đ</strong>
                      </div>
                    )}
                  </div>

                  <div className="counter-total-row">
                    <span>Tổng tiền:</span>
                    <strong>{formatMoney(grandTotal)} đ</strong>
                  </div>

                  {/* Phương thức thanh toán */}
                  <div className="mt-3 mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Phương thức thanh toán</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("cash")}
                        className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          paymentMethod === "cash"
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-200 bg-white text-gray-500 hover:border-green-300"
                        }`}
                      >
                        <MdPayments className="text-xl" />
                        Tiền mặt
                      </button>
                      <button
                        type="button"
                        disabled
                        title="Sắp ra mắt"
                        className="flex flex-col items-center gap-1 py-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-300 text-sm font-semibold cursor-not-allowed relative"
                      >
                        <MdQrCode className="text-xl" />
                        QR ngân hàng
                        <span className="absolute -top-1.5 -right-1.5 text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full font-bold">Sắp có</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={selectedSeats.length === 0 || loading}
                    className="counter-submit-btn"
                  >
                    {loading ? "Đang xử lý..." : "💵 XUẤT VÉ & THU TIỀN MẶT"}
                  </button>
                </div>
                  </div>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}