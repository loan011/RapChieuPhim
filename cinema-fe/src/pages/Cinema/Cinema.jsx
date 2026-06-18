import { useState } from "react";
import { Link } from "react-router-dom";
import CustomerProfileDropdown from "../../components/CustomerProfileDropdown";
import "../../styles/Cinema.css";

const initialCinemas = [
  {
    id: "cgv-dong-khoi",
    name: "CGV Vincom Đồng Khởi",
    address: "Tầng 3, TTTM Vincom Center Đồng Khởi, 72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM",
    phone: "1900 6017",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop",
    rooms: [
      { name: "Phòng chiếu 1 (IMAX)", seats: 240, type: "IMAX, Dolby Atmos" },
      { name: "Phòng chiếu 2 (Standard)", seats: 160, type: "2D/3D Standard" },
      { name: "Phòng chiếu 3 (Gold Class)", seats: 48, type: "Premium VIP recliner" },
    ],
    showtimes: [
      { movie: "Doraemon: Bản giao hưởng của Nobita", times: ["10:30", "13:45", "16:00", "19:15", "21:30"] },
      { movie: "Lật Mặt 7: Một Điều Ước", times: ["09:00", "11:30", "14:15", "17:00", "19:45", "22:30"] },
      { movie: "Haikyu!!: Trận Chiến Bãi Phế Thải", times: ["12:00", "15:00", "18:00", "20:30"] },
    ]
  },
  {
    id: "galaxy-nguyen-du",
    name: "Galaxy Nguyễn Du",
    address: "116 Nguyễn Du, Bến Thành, Quận 1, TP.HCM",
    phone: "1900 2224",
    image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600&auto=format&fit=crop",
    rooms: [
      { name: "Phòng chiếu 1", seats: 180, type: "2D/3D Standard" },
      { name: "Phòng chiếu 2", seats: 180, type: "2D/3D Standard" },
      { name: "Phòng chiếu 3 (Sweetbox)", seats: 120, type: "Standard & Double Sweetbox" },
    ],
    showtimes: [
      { movie: "Lật Mặt 7: Một Điều Ước", times: ["10:00", "13:00", "16:00", "19:00", "22:00"] },
      { movie: "Doraemon: Bản giao hưởng của Nobita", times: ["09:30", "12:15", "15:00", "17:45"] },
    ]
  },
  {
    id: "lotte-nam-sai-gon",
    name: "Lotte Cinema Nam Sài Gòn",
    address: "Tầng 3, Lotte Mart Quận 7, 469 Nguyễn Hữu Thọ, Tân Hưng, Quận 7, TP.HCM",
    phone: "028 3775 2524",
    image: "https://images.unsplash.com/photo-1595769816263-9b910be24d5f?q=80&w=600&auto=format&fit=crop",
    rooms: [
      { name: "Phòng chiếu 1 (Super Plex)", seats: 320, type: "Super Large Screen, Atmos" },
      { name: "Phòng chiếu 2", seats: 150, type: "2D/3D Standard" },
      { name: "Phòng chiếu 3", seats: 150, type: "2D/3D Standard" },
    ],
    showtimes: [
      { movie: "Haikyu!!: Trận Chiến Bãi Phế Thải", times: ["10:15", "13:30", "16:45", "20:00"] },
      { movie: "Lật Mặt 7: Một Điều Ước", times: ["11:00", "14:00", "17:00", "20:00", "23:00"] },
    ]
  },
  {
    id: "beta-quoc-thanh",
    name: "Beta Cinemas Quốc Thanh",
    address: "271 Nguyễn Trãi, Nguyễn Cư Trinh, Quận 1, TP.HCM",
    phone: "059 873 9999",
    image: "https://images.unsplash.com/photo-1585647347483-22b66260dfff?q=80&w=600&auto=format&fit=crop",
    rooms: [
      { name: "Phòng chiếu 1", seats: 200, type: "2D Standard" },
      { name: "Phòng chiếu 2", seats: 160, type: "2D Standard" },
    ],
    showtimes: [
      { movie: "Doraemon: Bản giao hưởng của Nobita", times: ["11:00", "13:30", "16:00", "18:30"] },
      { movie: "Lật Mặt 7: Một Điều Ước", times: ["09:30", "12:30", "15:30", "18:30", "21:30"] },
    ]
  }
];

export default function Cinema() {
  const [selectedCinema, setSelectedCinema] = useState(initialCinemas[0]);

  const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail =
    localStorage.getItem("userEmail") ||
    localStorage.getItem("email") ||
    savedUser.email ||
    savedUser.Email;

  return (
    <div className="cinema-view-page">
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

        <select className="movie-select" value={selectedCinema.id} onChange={(e) => {
          const found = initialCinemas.find(c => c.id === e.target.value);
          if (found) setSelectedCinema(found);
        }}>
          {initialCinemas.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <nav>
          <Link to="/movies">PHIM</Link>
          <Link to="/">LỊCH CHIẾU THEO RẠP</Link>
          <Link className="active" to="/cinema">RẠP</Link>
          <Link to="/ticket-price">GIÁ VÉ</Link>
          <a href="#news">TIN MỚI VÀ ƯU ĐÃI</a>
          <a href="#franchise">NHƯỢNG QUYỀN</a>
          <a href="#member">THÀNH VIÊN</a>
        </nav>
      </header>

      {/* Content Container */}
      <div className="cinema-container">
        {/* Left Side: Cinema List */}
        <div className="cinema-sidebar">
          <h2 className="section-title">Danh Sách Hệ Thống Rạp</h2>
          <div className="cinema-list-cards">
            {initialCinemas.map((c) => (
              <div 
                key={c.id} 
                className={`cinema-item-card ${selectedCinema.id === c.id ? "active" : ""}`}
                onClick={() => setSelectedCinema(c)}
              >
                <img src={c.image} alt={c.name} className="cinema-item-img" />
                <div className="cinema-item-info">
                  <h3>{c.name}</h3>
                  <p className="cinema-item-addr">{c.address}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Cinema Detail */}
        <div className="cinema-main-detail">
          <div className="cinema-banner" style={{ backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(13, 13, 13, 1)), url(${selectedCinema.image})` }}>
            <h1 className="cinema-detail-name">{selectedCinema.name}</h1>
          </div>

          <div className="cinema-detail-body">
            {/* Contact Details */}
            <div className="detail-section">
              <h2 className="detail-sub-title">Thông Tin Liên Hệ</h2>
              <div className="detail-text-box">
                <p>📍 <strong>Địa chỉ: </strong> {selectedCinema.address}</p>
                <p>📞 <strong>Hotline: </strong> {selectedCinema.phone}</p>
              </div>
            </div>

            {/* Room List */}
            <div className="detail-section">
              <h2 className="detail-sub-title">Danh Sách Phòng Chiếu</h2>
              <div className="rooms-grid">
                {selectedCinema.rooms.map((room, idx) => (
                  <div key={idx} className="room-card">
                    <h4 className="room-name">{room.name}</h4>
                    <p className="room-spec">👥 Sức chứa: <strong>{room.seats} ghế</strong></p>
                    <p className="room-spec">🎬 Công nghệ: <strong>{room.type}</strong></p>
                  </div>
                ))}
              </div>
            </div>

            {/* Suat Chieu Hom Nay */}
            <div className="detail-section">
              <h2 className="detail-sub-title">Lịch Chiếu Hôm Nay</h2>
              <div className="cinema-showtimes-list">
                {selectedCinema.showtimes.map((st, idx) => (
                  <div key={idx} className="cinema-movie-showtime-row">
                    <div className="showtime-movie-name">
                      🎥 {st.movie}
                    </div>
                    <div className="showtime-times-grid">
                      {st.times.map((time, tIdx) => (
                        <button key={tIdx} className="showtime-time-btn">
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
