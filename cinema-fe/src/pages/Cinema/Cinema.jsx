import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import CustomerProfileDropdown from "../../components/CustomerProfileDropdown";
import "../../styles/Cinema.css";
import { getCinemaList, getAreaList, getRoomsByCinema } from "./cinemaPageService";

// Ảnh fallback nếu API không trả về ảnh
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1595769816263-9b910be24d5f?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1585647347483-22b66260dfff?q=80&w=600&auto=format&fit=crop",
];

function getCinemaImage(cinema, index) {
  return (
    cinema.image ||
    cinema.Image ||
    cinema.imageUrl ||
    cinema.ImageUrl ||
    FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
  );
}

// Chuẩn hoá 1 object cinema về dạng camelCase thống nhất
function normalizeCinema(c) {
  return {
    id:       c.id       ?? c.Id       ?? c.cinemaId  ?? c.CinemaId  ?? "",
    name:     c.name     ?? c.Name     ?? c.cinemaName ?? c.CinemaName ?? "Rạp không tên",
    address:  c.address  ?? c.Address  ?? "",
    city:     c.city     ?? c.City     ?? "",
    phone:    c.phone    ?? c.Phone    ?? "",
    email:    c.email    ?? c.Email    ?? "",
    status:   c.status   ?? c.Status   ?? "",
    image:    c.image    ?? c.Image    ?? c.imageUrl ?? c.ImageUrl ?? "",
    areaName: c.areaName ?? c.AreaName ?? c.area ?? c.Area ?? c.city ?? c.City ?? "",
    rooms:    c.rooms    ?? c.Rooms    ?? [],
    showtimes:c.showtimes?? c.Showtimes?? [],
    _raw: c,
  };
}

export default function Cinema() {
  const [cinemas, setCinemas]               = useState([]);
  const [areas, setAreas]                   = useState([]);
  const [selectedCinema, setSelectedCinema] = useState(null);
  const [selectedArea, setSelectedArea]     = useState("");
  const [loading, setLoading]               = useState(true);
  const [apiError, setApiError]             = useState(null);
  const [rooms, setRooms]                   = useState([]);
  const [loadingRooms, setLoadingRooms]     = useState(false);
  const [areaDropdownOpen, setAreaDropdownOpen] = useState(false);
  const areaDropdownRef = useRef(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e) {
      if (areaDropdownRef.current && !areaDropdownRef.current.contains(e.target)) {
        setAreaDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const savedUser  = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail  =
    localStorage.getItem("userEmail") ||
    localStorage.getItem("email")     ||
    savedUser.email ||
    savedUser.Email;

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setApiError(null);

      // ── Cinemas ──────────────────────────────────────────
      try {
        const raw = await getCinemaList();
        const arr = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.$values)
          ? raw.$values
          : [];

        const list = arr.map(normalizeCinema);
        setCinemas(list);
        if (list.length > 0) setSelectedCinema(list[0]);
      } catch (err) {
        console.error("[Cinema] fetch cinemas error:", err);
        setApiError(err.message);
        setCinemas([]);
      }

      // ── Areas (tùy chọn) ─────────────────────────────────
      try {
        const raw = await getAreaList();
        const arr = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.$values)
          ? raw.$values
          : [];
        setAreas(arr);
      } catch {
        setAreas([]);
      }

      setLoading(false);
    }
    fetchAll();
  }, []);

  // Fetch rooms mỗi khi chọn rạp khác
  useEffect(() => {
    if (!selectedCinema?.id) {
      setRooms([]);
      return;
    }
    async function fetchRooms() {
      setLoadingRooms(true);
      try {
        const data = await getRoomsByCinema(selectedCinema.id);
        setRooms(data ?? []);
      } catch {
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    }
    fetchRooms();
  }, [selectedCinema?.id]);

  // Lọc rạp theo khu vực
  const filteredCinemas = selectedArea
    ? cinemas.filter((c) => {
        const raw = c._raw;
        const cinemaAreaId = String(raw?.areaId ?? raw?.AreaId ?? "");
        if (cinemaAreaId && cinemaAreaId === selectedArea) return true;
        const cinemaAreaName = (raw?.areaName ?? raw?.AreaName ?? "").toLowerCase();
        if (cinemaAreaName && cinemaAreaName.includes(selectedArea.toLowerCase())) return true;
        const cinemaName = (c.name ?? "").toLowerCase();
        return cinemaName.includes(selectedArea.toLowerCase());
      })
    : cinemas;

  function handleAreaChange(val) {
    setSelectedArea(val);
    setSelectedCinema(null);
  }

  function getAreaName(a) {
    return a.areaName ?? a.AreaName ?? a.name ?? a.Name ?? "";
  }

  function getAreaValue(a) {
    const id = String(a.areaId ?? a.AreaId ?? "");
    return (id && id !== "0") ? id : getAreaName(a);
  }

  function getAreaKey(a, idx) {
    return getAreaValue(a) || idx;
  }

  const currentImage = selectedCinema
    ? getCinemaImage(selectedCinema, cinemas.indexOf(selectedCinema))
    : FALLBACK_IMAGES[0];

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

        <select
          className="movie-select"
          value={String(selectedCinema?.id ?? "")}
          onChange={(e) => {
            const found = cinemas.find((c) => String(c.id) === e.target.value);
            if (found) setSelectedCinema(found);
          }}
        >
          {filteredCinemas.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
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

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.6)", fontSize: 16 }}>
          Đang tải dữ liệu rạp chiếu...
        </div>
      )}

      {/* Content */}
      {!loading && (
        <div className="cinema-container">
          {/* Left: Danh sách rạp */}
          <div className="cinema-sidebar">
            <h2 className="section-title">Danh Sách Hệ Thống Rạp</h2>

            {/* Custom Dropdown khu vực */}
            {areas.length > 0 && (
              <div ref={areaDropdownRef} style={{ marginBottom: 16, position: "relative" }}>
                {/* Trigger button */}
                <button
                  onClick={() => setAreaDropdownOpen((v) => !v)}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 10,
                    color: "white",
                    padding: "9px 14px",
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    textAlign: "left",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    🌏 {selectedArea === "" ? "Tất cả khu vực" : (areas.find(a => getAreaValue(a) === selectedArea) ? getAreaName(areas.find(a => getAreaValue(a) === selectedArea)) : selectedArea)}
                  </span>
                  <span>{areaDropdownOpen ? "▲" : "▼"}</span>
                </button>

                {/* Dropdown list */}
                {areaDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "105%",
                      left: 0,
                      width: "100%",
                      background: "#1a1a2e",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 10,
                      zIndex: 100,
                      maxHeight: 250,
                      overflowY: "auto",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                    }}
                  >
                    {/* Tất cả khu vực option */}
                    <div
                      onClick={() => { handleAreaChange(""); setAreaDropdownOpen(false); }}
                      style={{
                        padding: "10px 14px",
                        fontSize: 13,
                        color: selectedArea === "" ? "#e50914" : "rgba(255,255,255,0.85)",
                        background: selectedArea === "" ? "rgba(229,9,20,0.1)" : "transparent",
                        cursor: "pointer",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        fontWeight: selectedArea === "" ? 700 : 400,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(229,9,20,0.15)"}
                      onMouseLeave={e => e.currentTarget.style.background = selectedArea === "" ? "rgba(229,9,20,0.1)" : "transparent"}
                    >
                      🌏 Tất cả khu vực
                    </div>

                    {/* Danh sách khu vực */}
                    {areas.map((a, idx) => {
                      const aname = getAreaName(a);
                      const aval  = getAreaValue(a);
                      const isSelected = selectedArea === aval;
                      return (
                        <div
                          key={getAreaKey(a, idx)}
                          onClick={() => { handleAreaChange(aval); setAreaDropdownOpen(false); }}
                          style={{
                            padding: "10px 14px",
                            fontSize: 13,
                            color: isSelected ? "#e50914" : "rgba(255,255,255,0.85)",
                            background: isSelected ? "rgba(229,9,20,0.1)" : "transparent",
                            cursor: "pointer",
                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                            transition: "background 0.15s",
                            fontWeight: isSelected ? 700 : 400,
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(229,9,20,0.15)"}
                          onMouseLeave={e => e.currentTarget.style.background = isSelected ? "rgba(229,9,20,0.1)" : "transparent"}
                        >
                          {aname}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {apiError && cinemas.length === 0 && (
              <p style={{ color: "#ff9999", fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
                ⚠️ Không tải được dữ liệu từ server.<br />
                <span style={{ color: "rgba(255,255,255,0.4)" }}>{apiError}</span>
              </p>
            )}

            <div className="cinema-list-cards">
              {cinemas.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                  Không có dữ liệu rạp chiếu
                </p>
              ) : filteredCinemas.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                  Không có rạp trong khu vực này
                </p>
              ) : (
                filteredCinemas.map((c, idx) => {
                  const img = getCinemaImage(c, idx);
                  const isActive = selectedCinema?.id === c.id;
                  return (
                    <div
                      key={c.id ?? idx}
                      className={`cinema-item-card ${isActive ? "active" : ""}`}
                      onClick={() => setSelectedCinema(c)}
                    >
                      <img src={img} alt={c.name} className="cinema-item-img" />
                      <div className="cinema-item-info">
                        <h3>{c.name}</h3>
                        <p className="cinema-item-addr">{c.address}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Chi tiết rạp */}
          {selectedCinema ? (
            <div className="cinema-main-detail">
              <div
                className="cinema-banner"
                style={{
                  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(13,13,13,1)), url(${currentImage})`,
                }}
              >
                <h1 className="cinema-detail-name">{selectedCinema.name}</h1>
              </div>

              <div className="cinema-detail-body">
                {/* Thông tin liên hệ */}
                <div className="detail-section">
                  <h2 className="detail-sub-title">Thông Tin Liên Hệ</h2>
                  <div className="detail-text-box">
                    <p>📍 <strong>Địa chỉ: </strong>{selectedCinema.address || "—"}</p>
                    {selectedCinema.city  && <p>🏙️ <strong>Thành phố: </strong>{selectedCinema.city}</p>}
                    {selectedCinema.phone && <p>📞 <strong>Hotline: </strong>{selectedCinema.phone}</p>}
                    {selectedCinema.email && <p>✉️ <strong>Email: </strong>{selectedCinema.email}</p>}
                    {selectedCinema.status && (
                      <p>🟢 <strong>Trạng thái: </strong>
                        {selectedCinema.status === "Active" ? "Đang hoạt động" : selectedCinema.status}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phòng chiếu từ API /Rooms */}
                <div className="detail-section">
                  <h2 className="detail-sub-title">Danh Sách Phòng Chiếu</h2>
                  {loadingRooms ? (
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Đang tải phòng chiếu...</p>
                  ) : rooms.length === 0 ? (
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Chưa có thông tin phòng chiếu</p>
                  ) : (
                    <div className="rooms-grid">
                      {rooms.map((room, idx) => (
                        <div key={room.roomId ?? room.RoomId ?? idx} className="room-card">
                          <h4 className="room-name">
                            {room.roomName ?? room.RoomName ?? `Phòng ${idx + 1}`}
                          </h4>
                          {(room.totalSeats ?? room.TotalSeats) && (
                            <p className="room-spec">👥 Sức chứa: <strong>{room.totalSeats ?? room.TotalSeats} ghế</strong></p>
                          )}
                          {(room.roomType ?? room.RoomType) && (
                            <p className="room-spec">🎬 Loại phòng: <strong>{room.roomType ?? room.RoomType}</strong></p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Suất chiếu */}
                {selectedCinema.showtimes?.length > 0 && (
                  <div className="detail-section">
                    <h2 className="detail-sub-title">Lịch Chiếu Hôm Nay</h2>
                    <div className="cinema-showtimes-list">
                      {selectedCinema.showtimes.map((st, idx) => (
                        <div key={idx} className="cinema-movie-showtime-row">
                          <div className="showtime-movie-name">
                            🎥 {st.movie ?? st.Movie ?? st.movieTitle ?? st.MovieTitle}
                          </div>
                          <div className="showtime-times-grid">
                            {(st.times ?? st.Times ?? []).map((time, tIdx) => (
                              <button key={tIdx} className="showtime-time-btn">{time}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              className="cinema-main-detail"
              style={{ display:"flex", alignItems:"center", justifyContent:"center",
                color:"rgba(255,255,255,0.4)", fontSize:15, minHeight:300 }}
            >
              Chọn một rạp để xem chi tiết
            </div>
          )}
        </div>
      )}
    </div>
  );
}
