import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  MdMovie,
  MdLocationOn,
  MdCalendarToday,
  MdAccessTime,
  MdChair,
  MdPayment,
  MdCheckCircle,
  MdQrCode2,
} from "react-icons/md";
import CustomerProfileDropdown from "../../components/CustomerProfileDropdown";
import "../../styles/Booking.css";

// Mock movies list (consistent with Home.jsx)
const AVAILABLE_MOVIES = [
  {
    id: "doraemon",
    title: "Doraemon: Bản giao hưởng của Nobita",
    poster: "https://image.tmdb.org/t/p/w300/yOm993ls74JD5nH2iAWypAzCc5F.jpg",
    age: "P",
    genre: "Hoạt Hình, Gia Đình",
  },
  {
    id: "oc",
    title: "Lật Mặt 7: Một Điều Ước",
    poster: "https://image.tmdb.org/t/p/w300/kYnSGAZia625bX13F4J33e9d8xV.jpg",
    age: "T13",
    genre: "Tình Cảm, Gia Đình",
  },
  {
    id: "temple",
    title: "Haikyu!!: Trận Chiến Bãi Phế Thải",
    poster: "https://image.tmdb.org/t/p/w300/a3I6V5N9C6c1lS3nF4a5sK2XG8.jpg",
    age: "P",
    genre: "Anime, Học Đường",
  },
  {
    id: "kuman",
    title: "Kumanthong: Nghi Lễ Cuối Cùng",
    poster: "https://image.tmdb.org/t/p/w300/7cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    age: "T18",
    genre: "Kinh Dị, Giật Gân",
  },
];

const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
function formatDate(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm} - ${dayNames[date.getDay()]}`;
}

const DATES = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return formatDate(d);
});

const CINEMAS = [
  "CGV Vincom Đồng Khởi",
  "Galaxy Nguyễn Du",
  "Lotte Cinema Nam Sài Gòn",
  "Beta Cinemas Quốc Thanh",
];

const SHOWTIMES = ["09:30", "12:15", "14:45", "17:30", "20:00", "22:30"];

// Generate seats matrix
const rows = ["A", "B", "C", "D", "E", "F", "G"];
const cols = Array.from({ length: 12 }, (_, i) => i + 1);

// Already taken seats (mocked)
const TAKEN_SEATS = ["A4", "A5", "C6", "C7", "D8", "E2", "E3", "F10", "G5", "G6"];

export default function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const movieParam = searchParams.get("movie");
  const timeParam = searchParams.get("time");

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedCinema, setSelectedCinema] = useState(CINEMAS[0]);
  const [selectedDate, setSelectedDate] = useState(DATES[0]);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [newTicketId, setNewTicketId] = useState("");

  const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail =
    localStorage.getItem("userEmail") ||
    localStorage.getItem("email") ||
    savedUser.email ||
    savedUser.Email;

  useEffect(() => {
    const foundMovie = AVAILABLE_MOVIES.find((m) => m.id === movieParam);
    if (foundMovie) {
      setSelectedMovie(foundMovie);
    } else {
      setSelectedMovie(AVAILABLE_MOVIES[0]);
    }
  }, [movieParam]);

  useEffect(() => {
    if (timeParam) {
      setSelectedTime(timeParam);
    }
  }, [timeParam]);

  function getSeatPrice(row) {
    if (row === "G") return 125000; // Sweetbox (price per seat, normally sold in pairs)
    if (["D", "E", "F"].includes(row)) return 110000; // VIP
    return 85000; // Standard
  }

  function getSeatType(row) {
    if (row === "G") return "Sweetbox";
    if (["D", "E", "F"].includes(row)) return "VIP";
    return "Standard";
  }

  function handleSeatClick(seatId) {
    if (TAKEN_SEATS.includes(seatId)) return;

    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((s) => s !== seatId)
        : [...prev, seatId]
    );
  }

  const totalAmount = selectedSeats.reduce((sum, seat) => {
    const row = seat.charAt(0);
    return sum + getSeatPrice(row);
  }, 0);

  function handleCheckout() {
    if (!selectedTime) {
      alert("Vui lòng chọn khung giờ chiếu trước!");
      return;
    }
    if (selectedSeats.length === 0) {
      alert("Vui lòng chọn ít nhất một ghế!");
      return;
    }

    const ticketId = "TK" + String(Math.floor(100000 + Math.random() * 900000));
    setNewTicketId(ticketId);

    const newTicket = {
      id: ticketId,
      movie: selectedMovie.title,
      poster: selectedMovie.poster,
      date: selectedDate.split(" ")[0] + "/2026",
      time: selectedTime,
      cinema: selectedCinema,
      hall: "Phòng chiếu " + (Math.floor(Math.random() * 4) + 1),
      seats: selectedSeats,
      price: totalAmount.toLocaleString("vi-VN") + "đ",
      status: "upcoming",
    };

    // Save ticket to local storage
    const currentTickets = JSON.parse(localStorage.getItem("bookedTickets") || "[]");
    localStorage.setItem("bookedTickets", JSON.stringify([newTicket, ...currentTickets]));

    setShowPaymentSuccess(true);
  }

  function handleFinishBooking() {
    setShowPaymentSuccess(false);
    navigate("/customer/ve-cua-toi");
  }

  if (!selectedMovie) return <div className="booking-loading">Đang tải thông tin phim...</div>;

  return (
    <div className="booking-page-layout">
      {/* Top Login */}
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

      {/* Header */}
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
        {/* Step progress info */}
        <div className="booking-left-section">
          {/* Movie Details Info Bar */}
          <div className="booking-movie-summary-card">
            <img src={selectedMovie.poster} alt={selectedMovie.title} className="booking-summary-poster" />
            <div className="booking-summary-info">
              <span className="age-badge-style">{selectedMovie.age}</span>
              <h1>{selectedMovie.title}</h1>
              <p>{selectedMovie.genre}</p>
            </div>
          </div>

          {/* Step 1: Booking Params */}
          <div className="booking-section-card">
            <h2 className="step-title">
              <span className="step-num-icon">1</span>
              Chọn Suất Chiếu
            </h2>
            
            <div className="params-selectors-grid">
              {/* Select Cinema */}
              <div className="param-group">
                <label><MdLocationOn /> Chọn Rạp</label>
                <select value={selectedCinema} onChange={(e) => setSelectedCinema(e.target.value)}>
                  {CINEMAS.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Select Date */}
              <div className="param-group">
                <label><MdCalendarToday /> Chọn Ngày</label>
                <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
                  {DATES.map((d, i) => (
                    <option key={i} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Select Showtime */}
            <div className="showtimes-selector-block">
              <label className="sub-param-label"><MdAccessTime /> Khung Giờ Chiếu</label>
              <div className="booking-showtimes-grid">
                {SHOWTIMES.map((time, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`booking-time-btn ${selectedTime === time ? "active" : ""}`}
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2: Seat Selection Matrix */}
          <div className="booking-section-card">
            <h2 className="step-title">
              <span className="step-num-icon">2</span>
              Chọn Ghế Ngồi
            </h2>

            {/* Screen representation */}
            <div className="cinema-screen-container">
              <div className="cinema-screen-curved"></div>
              <p className="screen-label">MÀN HÌNH CHIẾU</p>
            </div>

            {/* Seats matrix */}
            <div className="seats-map-matrix">
              {rows.map((row) => (
                <div key={row} className="seats-row">
                  <span className="row-letter">{row}</span>
                  <div className="seats-row-cols">
                    {cols.map((col) => {
                      const seatId = `${row}${col}`;
                      const isTaken = TAKEN_SEATS.includes(seatId);
                      const isSelected = selectedSeats.includes(seatId);
                      const seatType = getSeatType(row);
                      
                      let seatClass = "seat-node";
                      if (isTaken) seatClass += " taken";
                      else if (isSelected) seatClass += " selected";
                      else seatClass += ` ${seatType.toLowerCase()}`;

                      return (
                        <div
                          key={col}
                          className={seatClass}
                          onClick={() => handleSeatClick(seatId)}
                          title={`${seatId} (${seatType} - ${getSeatPrice(row).toLocaleString("vi-VN")}đ)`}
                        >
                          {col}
                        </div>
                      );
                    })}
                  </div>
                  <span className="row-letter">{row}</span>
                </div>
              ))}
            </div>

            {/* Legend info */}
            <div className="seats-legend-bar">
              <div className="legend-item">
                <div className="seat-node legend-box standard"></div>
                <span>Thường (85k)</span>
              </div>
              <div className="legend-item">
                <div className="seat-node legend-box vip"></div>
                <span>VIP (110k)</span>
              </div>
              <div className="legend-item">
                <div className="seat-node legend-box sweetbox"></div>
                <span>Sweetbox (125k)</span>
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
          </div>
        </div>

        {/* Right Side: Booking summary checkout panel */}
        <div className="booking-right-sidebar">
          <div className="checkout-summary-card">
            <h2 className="summary-title">Tóm Tắt Đặt Vé</h2>
            <div className="summary-divider"></div>
            
            <div className="summary-detail-list">
              <div className="summary-row-item">
                <span className="label">Phim:</span>
                <span className="value font-bold text-red-500">{selectedMovie.title}</span>
              </div>
              <div className="summary-row-item">
                <span className="label">Rạp:</span>
                <span className="value">{selectedCinema}</span>
              </div>
              <div className="summary-row-item">
                <span className="label">Ngày chiếu:</span>
                <span className="value">{selectedDate}</span>
              </div>
              <div className="summary-row-item">
                <span className="label">Suất chiếu:</span>
                <span className="value font-bold">{selectedTime || "Chưa chọn"}</span>
              </div>
              <div className="summary-row-item">
                <span className="label">Ghế đã chọn:</span>
                <span className="value font-bold text-yellow-500">
                  {selectedSeats.length > 0 ? selectedSeats.join(", ") : "Chưa chọn"}
                </span>
              </div>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total-price-box">
              <span>TỔNG TIỀN</span>
              <h2>{totalAmount.toLocaleString("vi-VN")}đ</h2>
            </div>

            <button
              type="button"
              className="booking-checkout-submit-btn"
              onClick={handleCheckout}
              disabled={selectedSeats.length === 0 || !selectedTime}
            >
              <MdPayment /> THANH TOÁN
            </button>
          </div>
        </div>
      </div>

      {/* Payment Success Modal Dialog */}
      {showPaymentSuccess && (
        <div className="payment-success-modal-overlay">
          <div className="payment-success-modal-box">
            <div className="modal-success-icon-wrap">
              <MdCheckCircle className="success-icon" />
            </div>
            
            <h2 className="modal-title">THANH TOÁN THÀNH CÔNG</h2>
            <p className="modal-desc">Vé xem phim của bạn đã được xuất hệ thống thành công!</p>
            
            <div className="ticket-invoice-receipt">
              <div className="invoice-header">
                <h3>VÉ XEM PHIM ĐIỆN TỬ</h3>
                <span className="invoice-id">Mã vé: {newTicketId}</span>
              </div>
              
              <div className="invoice-body-details">
                <p>🎬 Phim: <strong>{selectedMovie.title}</strong></p>
                <p>📍 Rạp: <strong>{selectedCinema}</strong></p>
                <p>📅 Ngày chiếu: <strong>{selectedDate.split(" ")[0]}/2026</strong></p>
                <p>⏰ Suất chiếu: <strong>{selectedTime}</strong></p>
                <p>🎟 Ghế: <strong>{selectedSeats.join(", ")}</strong></p>
                <p>💰 Tổng cộng: <strong>{totalAmount.toLocaleString("vi-VN")}đ</strong></p>
              </div>

              <div className="invoice-qr-wrap">
                <MdQrCode2 className="invoice-qr-code" />
                <p>Vui lòng xuất trình mã này tại quầy vé để nhận vé giấy</p>
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
