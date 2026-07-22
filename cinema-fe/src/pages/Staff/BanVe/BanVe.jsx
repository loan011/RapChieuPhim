import "./BanVe.css";
import { useState } from "react";
import { useBanVe } from "./useBanVe";
import { MdMovie, MdChair, MdCheckCircle, MdClose, MdSearch, MdRestaurant, MdWarning, MdHourglassTop } from "react-icons/md";

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
    cashReceived,
    setCashReceived,
    isStudent,
    setIsStudent,
    studentCount,
    setStudentCount,
    discountCodeInput,
    setDiscountCodeInput,
    appliedDiscount,
    handleApplyDiscount,
    removeDiscount,
    ticketSubtotal,
    studentDiscountAmount,
  } = useBanVe();

  return (
    <div className="bv-root">
      {/* ───── HEADER ───── */}
      <div className="bv-header">
        <div className="bv-header-left">
          <MdMovie className="bv-header-icon" />
          <h4 className="bv-header-title">Bán Vé Tại Quầy</h4>
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
              <div><strong>Mã hóa đơn:</strong> {successReceipt.ticketCode}</div>
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
              {successReceipt.studentDiscountAmount > 0 && (
                <div className="bv-receipt-full text-red-600 font-bold">
                  <strong>{successReceipt.appliedDiscount ? `Mã ưu đãi (${successReceipt.appliedDiscount.discountCode}):` : `Khấu trừ HS/SV (-15% × ${successReceipt.studentCount || 1} vé):`}</strong> -{formatMoney(successReceipt.studentDiscountAmount)} đ
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

      {/* ───── 3-COLUMN LAYOUT ───── */}
      <div className="bv-layout">

        {/* COL 1: Lịch chiếu */}
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
                      <h6 className="bv-movie-title">{movie.title}</h6>
                      <p className="bv-movie-duration">{movie.duration}</p>
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

        {/* COL 2: Sơ đồ ghế */}
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

                            if (isNextCouple) {
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
                                    disabled={booked1}
                                    onClick={() => handleSeatClick(seat)}
                                    className={seatClassName + " seat-couple-left"}
                                    title={`${label1} (Couple - ${formatMoney(getSeatPrice(seat, selectedShowtime))} đ)`}
                                  >
                                    {label1}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={booked2}
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
                    ? (selectedShowtime.roomName || selectedShowtime.RoomName || `Phòng ${getShowtimeRoomId(selectedShowtime)}`)
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
              <div className="mt-3 p-3 bg-red-50/60 border border-red-200/80 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-red-700 select-none">
                  <input
                    type="checkbox"
                    checked={isStudent}
                    onChange={(e) => setIsStudent(e.target.checked)}
                    disabled={appliedDiscount !== null}
                    className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 accent-red-600 disabled:opacity-50"
                  />
                  <span>🎓 Khách là Học sinh / Sinh viên (-15% vé)</span>
                </label>
                {isStudent && (
                  <div className="mt-2.5 pt-2 border-t border-red-200/60 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-red-800">Số lượng vé HS/SV:</span>
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
                        if (val === "") {
                          setStudentCount("");
                          return;
                        }
                        const num = parseInt(val, 10);
                        if (!isNaN(num)) {
                          const maxSeats = selectedSeats.length || 1;
                          if (num > maxSeats) {
                            setStudentCount(maxSeats);
                          } else {
                            setStudentCount(num);
                          }
                        }
                      }}
                      onBlur={() => {
                        const num = parseInt(studentCount, 10);
                        const maxSeats = selectedSeats.length || 1;
                        if (isNaN(num) || num < 1) {
                          setStudentCount(1);
                        } else if (num > maxSeats) {
                          setStudentCount(maxSeats);
                        }
                      }}
                      className="w-full border border-red-200 rounded-lg px-3 py-1.5 text-xs font-bold text-red-700 bg-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                    {ticketSubtotal > 0 && (
                      <div className="text-xxs font-semibold text-red-600 flex justify-between items-center pt-1">
                        <span>Giảm 15% cho {Math.min(Math.max(1, Number(studentCount) || 1), selectedSeats.length || 1)} vé:</span>
                        <span className="font-bold text-xs">-{formatMoney(studentDiscountAmount)} đ</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Nhập mã ưu đãi */}
              <div className="mt-3 p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl">
                <label className="block text-xs font-bold text-blue-800 mb-2">
                  🎟️ Mã giảm giá / Ưu đãi
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={isStudent ? "Không áp dụng cùng lúc với thẻ HS/SV" : "Nhập mã ưu đãi..."}
                    value={discountCodeInput}
                    onChange={(e) => setDiscountCodeInput(e.target.value)}
                    disabled={appliedDiscount !== null || isStudent}
                    className="flex-1 border border-blue-200 rounded-lg px-3 py-1.5 text-xs font-bold text-blue-900 bg-white focus:outline-none focus:border-blue-500 uppercase disabled:bg-gray-100 disabled:text-gray-400 placeholder:normal-case"
                  />
                  {!appliedDiscount ? (
                    <button
                      type="button"
                      onClick={handleApplyDiscount}
                      disabled={isStudent}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 active:scale-95 transition-transform disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Áp dụng
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={removeDiscount}
                      className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 active:scale-95 transition-transform"
                    >
                      Hủy mã
                    </button>
                  )}
                </div>
                {appliedDiscount && ticketSubtotal > 0 && (
                  <div className="mt-2 pl-2 text-xxs font-semibold text-blue-700 flex justify-between">
                    <span>Mã {appliedDiscount.discountCode} đã áp dụng:</span>
                    <span className="font-bold text-xs text-red-600">-{formatMoney(studentDiscountAmount)} đ</span>
                  </div>
                )}
              </div>

              {paymentMethod === "Cash" && (
                <div className="mt-3 p-3 bg-gray-50 border border-gray-150 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-600">
                    <span>Tiền nhận (khách đưa):</span>
                  </div>
                  <input
                    type="number"
                    placeholder="Nhập số tiền khách đưa..."
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                  <div className="flex flex-wrap gap-1">
                    {totalAmount > 0 && (
                      <button
                        type="button"
                        onClick={() => setCashReceived(totalAmount)}
                        className="px-2.5 py-1 bg-green-50 border border-green-200 rounded text-xxs font-bold text-green-700 hover:bg-green-100 transition-colors"
                      >
                        {formatMoney(totalAmount)}đ (Đúng tiền)
                      </button>
                    )}
                    {[50000, 100000, 200000, 500000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashReceived(amt)}
                        className="px-2 py-1 bg-white border border-gray-200 rounded text-xxs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        {formatMoney(amt)}đ
                      </button>
                    ))}
                  </div>

                  {cashReceived !== "" && Number(cashReceived) < totalAmount ? (
                    <div className="pt-2 border-t border-red-200 text-xs font-bold text-red-600 flex items-center justify-between">
                      <span>⚠️ Tiền nhận chưa đủ</span>
                      <span>Thiếu: {formatMoney(totalAmount - Number(cashReceived))} đ</span>
                    </div>
                  ) : Number(cashReceived) >= totalAmount && totalAmount > 0 ? (
                    <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-600">Tiền thừa trả khách:</span>
                      <span className="text-green-600 text-sm font-extrabold">
                        {formatMoney(Number(cashReceived) - totalAmount)} đ
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

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
                        <button type="button" onClick={() => handleFoodQuantityChange(item, 1)} className="bv-qty-btn">＋</button>
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
    </div>
  );
}