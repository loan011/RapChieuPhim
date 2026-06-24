import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
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
  createBookingDates,
  getSavedUser,
  getUserEmail,

  getCinemas,
  getRooms,
  getMovieById,
  getShowtimesByMovie,
  getSeatsByRoomId,
  getAvailableSeats,
  createBooking,

  getMovieTitle,
  getMoviePoster,
  getMovieAgeRating,
  getMovieDuration,
  getMovieDirector,

  getCinemaId,
  getCinemaName,
  getCinemaNameById,

  getRoomName,
  getRoomCinemaId,
  findRoomByShowtime,

  getShowtimeId,
  getShowtimeRoomId,
  getShowtimeDate,
  getShowtimeHour,
  getShowtimeBasePrice,
  filterShowtimesForBooking,
  findFirstShowtime,

  getSeatId,
  getSeatRow,
  getSeatType,
  getSeatLabel,
  getSeatDisplayNumber,
  isSeatAvailable,
  getSeatPrice,
  groupSeatsByRow,
  buildBookingPayload,
} from "./booking";

export default function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const movieParam = searchParams.get("movie");
  const showtimeParam = searchParams.get("showtimeId");

  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [selectedCinemaId, setSelectedCinemaId] = useState("");
  const [selectedDateIso, setSelectedDateIso] = useState("");
  const [selectedShowtime, setSelectedShowtime] = useState(null);

  const [allSeats, setAllSeats] = useState([]);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [newTicketIds, setNewTicketIds] = useState([]);

  const savedUser = getSavedUser();
  const userEmail = getUserEmail();
  const dates = createBookingDates(7);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Vui lòng đăng nhập tài khoản của bạn để tiến hành đặt vé!");
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (!movieParam) return;

    async function init() {
      setLoading(true);
      setBookingError("");

      try {
        const [cinemaData, roomData, movieData, showtimeData] =
          await Promise.all([
            getCinemas(),
            getRooms(),
            getMovieById(movieParam),
            getShowtimesByMovie(movieParam),
          ]);

        setCinemas(cinemaData);
        setRooms(roomData);
        setMovie(movieData);
        setShowtimes(showtimeData);

        let initialShowtime = null;

        if (showtimeParam) {
          initialShowtime = showtimeData.find(
            (st) => String(getShowtimeId(st)) === String(showtimeParam)
          );
        }

        if (!initialShowtime) {
          initialShowtime = showtimeData[0] || null;
        }

        if (initialShowtime) {
          const room = roomData.find(
            (r) =>
              String(r.roomId ?? r.RoomId ?? r.id ?? r.Id) ===
              String(getShowtimeRoomId(initialShowtime))
          );

          setSelectedShowtime(initialShowtime);

          if (room) {
            setSelectedCinemaId(String(getRoomCinemaId(room)));
          }

          const date = getShowtimeDate(initialShowtime);

          if (date) {
            setSelectedDateIso(date);
          }
        } else {
          setSelectedShowtime(null);
          setSelectedCinemaId("");
          setSelectedDateIso(dates[0]?.iso || "");
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin đặt vé:", err);
        setMovie(null);
        setShowtimes([]);
        setCinemas([]);
        setRooms([]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [movieParam, showtimeParam]);

  useEffect(() => {
    if (!selectedShowtime) {
      setAllSeats([]);
      setAvailableSeats([]);
      setSelectedSeats([]);
      return;
    }

    async function fetchSeatsForShowtime() {
      setLoadingSeats(true);
      setSelectedSeats([]);
      setBookingError("");

      try {
        const showtimeId = getShowtimeId(selectedShowtime);
        const roomId = getShowtimeRoomId(selectedShowtime);

        console.log("SELECTED SHOWTIME:", selectedShowtime);
        console.log("SHOWTIME ID:", showtimeId);
        console.log("ROOM ID:", roomId);

        if (!roomId) {
          console.error("Suất chiếu không có RoomId:", selectedShowtime);
          setAllSeats([]);
          setAvailableSeats([]);
          return;
        }

        const seats = await getSeatsByRoomId(roomId);

        let available = [];

        try {
          available = await getAvailableSeats(showtimeId);
        } catch (availableErr) {
          console.error("Lỗi tải ghế trống:", availableErr);
          available = [];
        }

        console.log("ALL SEATS:", seats);
        console.log("AVAILABLE SEATS:", available);

        setAllSeats(seats);
        setAvailableSeats(available);
      } catch (err) {
        console.error("Lỗi tải thông tin ghế ngồi:", err);
        setAllSeats([]);
        setAvailableSeats([]);
      } finally {
        setLoadingSeats(false);
      }
    }

    fetchSeatsForShowtime();
  }, [selectedShowtime]);

  const filteredShowtimes = filterShowtimesForBooking({
    showtimes,
    rooms,
    selectedDateIso,
    selectedCinemaId,
  });

  function handleCinemaChange(cinemaId) {
    setSelectedCinemaId(cinemaId);
    setSelectedSeats([]);

    const found = findFirstShowtime({
      showtimes,
      rooms,
      selectedDateIso,
      selectedCinemaId: cinemaId,
    });

    setSelectedShowtime(found);
  }

  function handleDateChange(dateIso) {
    setSelectedDateIso(dateIso);
    setSelectedSeats([]);

    const found = findFirstShowtime({
      showtimes,
      rooms,
      selectedDateIso: dateIso,
      selectedCinemaId,
    });

    if (found) {
      setSelectedShowtime(found);

      const room = findRoomByShowtime(found, rooms);

      if (room) {
        setSelectedCinemaId(String(getRoomCinemaId(room)));
      }
    } else {
      setSelectedShowtime(null);
    }
  }

  function handleShowtimeClick(showtime) {
    setSelectedShowtime(showtime);
    setSelectedSeats([]);

    const room = findRoomByShowtime(showtime, rooms);

    if (room) {
      setSelectedCinemaId(String(getRoomCinemaId(room)));
    }
  }

  function handleSeatClick(seat) {
    const available = isSeatAvailable(seat, availableSeats);

    if (!available) return;

    setSelectedSeats((prev) => {
      const exists = prev.some(
        (s) => String(getSeatId(s)) === String(getSeatId(seat))
      );

      if (exists) {
        return prev.filter(
          (s) => String(getSeatId(s)) !== String(getSeatId(seat))
        );
      }

      return [...prev, seat];
    });
  }

  const totalAmount = selectedSeats.reduce(
    (sum, seat) => sum + getSeatPrice(seat, selectedShowtime),
    0
  );

  const groupedSeats = groupSeatsByRow(allSeats);
  const rowsKeys = Object.keys(groupedSeats).sort();

  async function handleCheckout() {
    if (!userEmail) {
      alert("Vui lòng đăng nhập trước khi tiến hành thanh toán!");
      navigate("/login");
      return;
    }

    if (!selectedShowtime) {
      alert("Vui lòng chọn suất chiếu hợp lệ!");
      return;
    }

    if (selectedSeats.length === 0) {
      alert("Vui lòng chọn ít nhất một ghế!");
      return;
    }

    const showtimeId = getShowtimeId(selectedShowtime);
    const userId =
      savedUser.userId ??
      savedUser.id ??
      savedUser.UserId ??
      savedUser.Id;

    if (!userId) {
      alert("Không tìm thấy thông tin tài khoản của bạn. Vui lòng đăng nhập lại!");
      navigate("/login");
      return;
    }

    setLoadingSeats(true);
    setBookingError("");

    try {
      const bookingPromises = selectedSeats.map(async (seat) => {
        const payload = buildBookingPayload({
          userId,
          showtimeId,
          seat,
          selectedShowtime,
        });

        const data = await createBooking(payload);

        return (
          data?.bookingId ??
          data?.BookingId ??
          data?.id ??
          data?.Id ??
          `BK${Math.floor(Math.random() * 90000)}`
        );
      });

      const bookedIds = await Promise.all(bookingPromises);

      setNewTicketIds(bookedIds);
      setShowPaymentSuccess(true);
    } catch (err) {
      console.error("Đặt vé thất bại:", err);
      setBookingError(err.message || "Đặt vé thất bại. Vui lòng thử lại!");
      alert(err.message || "Đặt vé thất bại. Vui lòng thử lại!");
    } finally {
      setLoadingSeats(false);
    }
  }

  function handleFinishBooking() {
    setShowPaymentSuccess(false);
    navigate("/customer/ve-cua-toi");
  }

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
                        className={`booking-time-btn ${isActive ? "active" : ""}`}
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
                  {rowsKeys.map((row) => (
                    <div key={row} className="seats-row">
                      <span className="row-letter">{row}</span>

                      <div className="seats-row-cols">
                        {groupedSeats[row].map((seat) => {
                          const available = isSeatAvailable(
                            seat,
                            availableSeats
                          );

                          const selected = selectedSeats.some(
                            (s) =>
                              String(getSeatId(s)) === String(getSeatId(seat))
                          );

                          const seatType = getSeatType(seat);
                          const seatClassType = String(seatType).toLowerCase();

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
                              title={`${getSeatLabel(seat)} (${seatType} - ${getSeatPrice(
                                seat,
                                selectedShowtime
                              ).toLocaleString("vi-VN")}đ)`}
                            >
                              {getSeatDisplayNumber(seat)}
                            </div>
                          );
                        })}
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
                      {Number(getShowtimeBasePrice(selectedShowtime)).toLocaleString(
                        "vi-VN"
                      )}
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
                    <div className="seat-node legend-box sweetbox"></div>
                    <span>
                      Sweetbox (
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
                <p>
                  🎬 Phim: <strong>{getMovieTitle(movie)}</strong>
                </p>

                <p>
                  📍 Rạp:{" "}
                  <strong>
                    {getCinemaNameById(cinemas, selectedCinemaId)}
                  </strong>
                </p>

                <p>
                  📅 Ngày chiếu:{" "}
                  <strong>
                    {dates.find((d) => d.iso === selectedDateIso)?.label ||
                      selectedDateIso}
                  </strong>
                </p>

                <p>
                  ⏰ Suất chiếu:{" "}
                  <strong>
                    {selectedShowtime
                      ? getShowtimeHour(selectedShowtime)
                      : ""}
                  </strong>
                </p>

                <p>
                  🎟 Ghế:{" "}
                  <strong>
                    {selectedSeats.map(getSeatLabel).join(", ")}
                  </strong>
                </p>

                <p>
                  💰 Tổng cộng:{" "}
                  <strong>{totalAmount.toLocaleString("vi-VN")}đ</strong>
                </p>
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