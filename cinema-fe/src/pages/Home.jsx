import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import CustomerProfileDropdown from "../components/CustomerProfileDropdown";
import "../styles/Home.css";

import {
  HOME_TEXT as T,
  useHome,
  getAreaId,
  getAreaName,
  getCinemaId,
  getCinemaName,
  getMovieId,
  getMovieTitle,
  getMovieDescription,
  getMovieDuration,
  getMovieDirector,
  getMovieActors,
  getMovieLanguage,
  getMovieReleaseDate,
  getMoviePoster,
  getMovieTrailer,
  getShowtimeId,
  getStartHour,
  getShowtimeStatus,
  isBookable,
  findRoomByShowtime,
  findCinemaByRoom,
  getRoomName,
  getShowDate,
  getRoomCinemaId,
} from "./usehome.js";

// Helper to convert minutes (e.g., "113 phút" or 113) to "1h 53m"
function formatDuration(durationStr) {
  if (!durationStr) return "";
  const mins = parseInt(durationStr);
  if (isNaN(mins)) return String(durationStr);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// Helper to get movie genre/categories
function getMovieGenre(movie) {
  const directCategory = movie?.categoryName || movie?.CategoryName || movie?.genre || movie?.Genre;
  if (directCategory) return directCategory;

  const rawCategoryArray = movie?.categories || movie?.Categories || movie?.movieCategories || movie?.MovieCategories || movie?.categoryList || movie?.CategoryList;
  if (Array.isArray(rawCategoryArray)) {
    return rawCategoryArray.map(item => item?.categoryName || item?.CategoryName || item?.name || item?.Name).filter(Boolean).join(", ");
  }
  if (rawCategoryArray?.$values && Array.isArray(rawCategoryArray.$values)) {
    return rawCategoryArray.$values.map(item => item?.categoryName || item?.CategoryName || item?.name || item?.Name).filter(Boolean).join(", ");
  }

  return "Đang cập nhật";
}

// Helper to get movie age rating
function getMovieAge(movie) {
  return (
    movie?.ageRating ||
    movie?.AgeRating ||
    movie?.age ||
    movie?.Age ||
    movie?.rated ||
    movie?.Rated ||
    movie?.rating ||
    movie?.Rating ||
    "P"
  );
}

function Home() {
  const {
    dates,
    selectedDate,
    selectedCinemaId,
    selectedAreaId,
    areas,
    cinemas,
    movies,
    showtimes,
    rooms,
    loading,
    userEmail,
    handleDateClick,
    handleAreaChange,
    handleCinemaChange,
    handleSelectTime,
    isPreviousDateDisabled,
  } = useHome();

  // Additional filter states
  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("");
  const [selectedShowtimeType, setSelectedShowtimeType] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrailer, setSelectedTrailer] = useState(null);

  // Collect all unique genres from available movies
  const availableGenres = useMemo(() => {
    const genresSet = new Set();
    movies.forEach((m) => {
      const gStr = getMovieGenre(m);
      if (gStr && gStr !== "Đang cập nhật") {
        gStr.split(",").forEach((g) => {
          genresSet.add(g.trim());
        });
      }
    });
    return Array.from(genresSet).sort();
  }, [movies]);

  // List of movies currently showing on selected date
  const availableMoviesForSelect = useMemo(() => {
    // Find all movies that have showtimes on this date
    const movieIdsWithShowtimes = new Set();
    showtimes.forEach((st) => {
      if (getShowDate(st) === selectedDate) {
        const movieId = st?.movieId ?? st?.MovieId ?? st?.movie?.movieId ?? st?.movie?.MovieId;
        if (movieId) movieIdsWithShowtimes.add(String(movieId));
      }
    });
    return movies.filter(m => movieIdsWithShowtimes.has(String(getMovieId(m))));
  }, [movies, showtimes, selectedDate]);

  // Filtered showtimes based on date and selected cinema/area
  const filteredShowtimes = useMemo(() => {
    const now = new Date();
    return showtimes.filter((st) => {
      const showDate = getShowDate(st);
      const status = getShowtimeStatus(st);

      const matchDate = selectedDate ? showDate === selectedDate : true;
      if (!matchDate) return false;

      const room = findRoomByShowtime(st, rooms);
      if (!room) return false;

      const cinema = findCinemaByRoom(room, cinemas);
      if (!cinema) return false;

      const roomCinemaId = room?.cinemaId ?? room?.CinemaId;
      const cinemaAreaId = cinema?.areaId ?? cinema?.AreaId;

      const matchCinema = selectedCinemaId ? String(roomCinemaId) === String(selectedCinemaId) : true;
      if (!matchCinema) return false;

      const matchArea = selectedAreaId ? String(cinemaAreaId) === String(selectedAreaId) : true;
      if (!matchArea) return false;

      const notCanceled = status !== "Hủy";
      if (!notCanceled) return false;

      // Filter by format (2D, 3D, IMAX)
      const roomName = getRoomName(room).toLowerCase();
      if (selectedFormat) {
        if (selectedFormat === "IMAX" && !roomName.includes("imax")) return false;
        if (selectedFormat === "3D" && !roomName.includes("3d")) return false;
        if (selectedFormat === "2D" && (roomName.includes("imax") || roomName.includes("3d"))) return false;
      }

      // Filter by showtime slot (Suất chiếu)
      if (selectedShowtimeType) {
        const hour = getStartHour(st); // e.g., "14:30"
        if (selectedShowtimeType === "morning" && (hour < "08:00" || hour >= "12:00")) return false;
        if (selectedShowtimeType === "afternoon" && (hour < "12:00" || hour >= "18:00")) return false;
        if (selectedShowtimeType === "evening" && (hour < "18:00" || hour >= "24:00")) return false;
      }

      const startTimeStr = st?.startTime ?? st?.StartTime ?? "";
      // Allow customer to book tickets up to 5 minutes past start time
      const notPast = startTimeStr ? (new Date(startTimeStr).getTime() + 5 * 60 * 1000 >= now.getTime()) : true;

      return notPast;
    });
  }, [showtimes, rooms, cinemas, selectedDate, selectedCinemaId, selectedAreaId, selectedFormat, selectedShowtimeType]);

  // Group showtimes by movie and apply movie filters (search, genre, movieSelect)
  const filteredGroupedMovies = useMemo(() => {
    return movies
      .map((movie) => {
        const movieId = getMovieId(movie);
        const title = getMovieTitle(movie).toLowerCase();
        const genre = getMovieGenre(movie).toLowerCase();

        // Filter by specific movie dropdown selection
        if (selectedMovieId && String(movieId) !== String(selectedMovieId)) {
          return null;
        }

        // Filter by movie genre dropdown selection
        if (selectedGenre && !genre.includes(selectedGenre.toLowerCase())) {
          return null;
        }

        // Filter by search query
        if (searchQuery && !title.includes(searchQuery.toLowerCase().trim())) {
          return null;
        }

        // Filter showtimes of this movie
        const movieShowtimes = filteredShowtimes
          .filter((showtime) => {
            const stMovieId = showtime?.movieId ?? showtime?.MovieId ?? showtime?.movie?.movieId ?? showtime?.movie?.MovieId;
            return String(stMovieId) === String(movieId);
          })
          .sort((a, b) => getStartHour(a).localeCompare(getStartHour(b)));

        if (movieShowtimes.length === 0) return null;

        return {
          movie,
          showtimes: movieShowtimes,
        };
      })
      .filter(Boolean);
  }, [movies, filteredShowtimes, selectedMovieId, selectedGenre, searchQuery]);

  // Helper to group movie showtimes by Cinema
  const groupMovieShowtimesByCinema = (movieShowtimes) => {
    const grouped = {};
    movieShowtimes.forEach((st) => {
      const room = findRoomByShowtime(st, rooms);
      if (!room) return;
      const cinema = findCinemaByRoom(room, cinemas);
      if (!cinema) return;

      const cinemaId = getRoomCinemaId(room) || getCinemaId(cinema);
      const cinemaName = getCinemaName(cinema);

      if (!grouped[cinemaId]) {
        grouped[cinemaId] = {
          cinemaName,
          slots: []
        };
      }
      grouped[cinemaId].slots.push(st);
    });
    return Object.values(grouped);
  };

  return (
    <div className="beta-page showtimes-page">
      {/* Header Bar */}
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

      <header className="movie-header">
        <div className="movie-logo-container">
          <Link to="/" className="movie-logo">
            <span>Cinemas</span><b>HCM</b>
          </Link>
        </div>

        <nav className="movie-nav">
          <Link to="/showtimes" className="active">Lịch chiếu</Link>
          <Link to="/">Phim</Link>
          <Link to="/ticket-price">Giá vé</Link>
        </nav>


      </header>

      <main className="content sch-content">
        <div className="sch-container">

          {/* 1. Date range horizontal selector */}
          <section className="calendar-wrapper sch-calendar-wrapper">
            <div className="date-list-container">
              <div className="date-list sch-date-list">
                {dates.map((date, idx) => {
                  const isToday = idx === 0;
                  const dateLabel = isToday ? "Hôm nay" : date.weekDay;
                  const isActive = selectedDate === date.iso;
                  return (
                    <button
                      key={date.iso}
                      type="button"
                      className={`date sch-date-tab-btn ${isActive ? "active-date" : ""}`}
                      onClick={() => handleDateClick(date.iso)}
                    >
                      <strong className="sch-tab-day">{dateLabel}</strong>
                      <span className="sch-tab-date">{date.day}/{date.month}</span>
                    </button>
                  );
                })}
                
                <div className="date-select-other sch-other-date-wrap">
                  <input
                    type="date"
                    id="sch-date-picker-input"
                    value={selectedDate}
                    onChange={(e) => handleDateClick(e.target.value)}
                    style={{
                      opacity: 0,
                      position: "absolute",
                      width: 0,
                      height: 0,
                      pointerEvents: "none"
                    }}
                  />
                  <button
                    type="button"
                    className="other-date-btn sch-other-date-btn"
                    onClick={() => {
                      const el = document.getElementById("sch-date-picker-input");
                      if (el && typeof el.showPicker === "function") el.showPicker();
                    }}
                  >
                    📅 Chọn ngày khác
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Six multi-filter dropdown grid */}
          <section className="sch-filter-grid">
            {/* Filter 1: Chọn Rạp */}
            <div className="sch-filter-item">
              <label className="sch-filter-label">Chọn rạp</label>
              <select
                className="sch-filter-select"
                value={selectedCinemaId}
                onChange={(e) => handleCinemaChange(e.target.value)}
              >
                <option value="">Tất cả rạp</option>
                {cinemas.map((cinema) => (
                  <option key={getCinemaId(cinema)} value={getCinemaId(cinema)}>
                    {getCinemaName(cinema)}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 2: Chọn Phim */}
            <div className="sch-filter-item">
              <label className="sch-filter-label">Chọn phim</label>
              <select
                className="sch-filter-select"
                value={selectedMovieId}
                onChange={(e) => setSelectedMovieId(e.target.value)}
              >
                <option value="">Tất cả phim</option>
                {availableMoviesForSelect.map((m) => (
                  <option key={getMovieId(m)} value={getMovieId(m)}>
                    {getMovieTitle(m)}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 3: Định dạng */}
            <div className="sch-filter-item">
              <label className="sch-filter-label">Định dạng</label>
              <select
                className="sch-filter-select"
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="2D">2D</option>
                <option value="3D">3D</option>
                <option value="IMAX">IMAX</option>
              </select>
            </div>

            {/* Filter 4: Suất chiếu */}
            <div className="sch-filter-item">
              <label className="sch-filter-label">Suất chiếu</label>
              <select
                className="sch-filter-select"
                value={selectedShowtimeType}
                onChange={(e) => setSelectedShowtimeType(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="morning">Sáng (08:00 - 12:00)</option>
                <option value="afternoon">Chiều (12:00 - 18:00)</option>
                <option value="evening">Tối (18:00 - 24:00)</option>
              </select>
            </div>

            {/* Filter 5: Chọn thể loại phim (MỚI) */}
            <div className="sch-filter-item">
              <label className="sch-filter-label">Chọn thể loại phim</label>
              <select
                className="sch-filter-select"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
              >
                <option value="">Tất cả thể loại</option>
                {availableGenres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 6: Tìm kiếm theo tên phim (MỚI) */}
            <div className="sch-filter-item sch-search-item">
              <label className="sch-filter-label">Tìm kiếm tên phim</label>
              <div className="sch-search-input-wrapper">
                <input
                  type="text"
                  className="sch-search-input"
                  placeholder="Nhập tên phim cần tìm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="sch-search-clear-btn"
                    onClick={() => setSearchQuery("")}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* 3. Movie showtimes list */}
          {loading && (
            <div className="sch-loading">Đang tải lịch chiếu phim...</div>
          )}

          {!loading && filteredGroupedMovies.length > 0 && (
            <div className="sch-movie-list">
              {filteredGroupedMovies.map(({ movie, showtimes: movieShowtimes }) => {
                const movieId = getMovieId(movie);
                const subtitles = movie?.subtitles ?? movie?.Subtitles ?? "Phụ đề";
                const ageLimit = getMovieAge(movie) || "P";
                
                // Get grouped showtimes by Cinema for this movie
                const cinemaGroups = groupMovieShowtimesByCinema(movieShowtimes);

                return (
                  <article className="sch-movie-card" key={movieId}>
                    {/* Column 1: Poster with duration overlay */}
                    <div className="sch-card-poster-col">
                      <img
                        src={getMoviePoster(movie)}
                        alt={getMovieTitle(movie)}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/img/no-image.png";
                        }}
                      />
                      <span className="sch-duration-tag">
                        {formatDuration(getMovieDuration(movie))}
                      </span>
                    </div>

                    {/* Column 2: Movie Info */}
                    <div className="sch-card-info-col">
                      <h2 className="sch-movie-title">{getMovieTitle(movie)}</h2>
                      
                      <div className="sch-badges-row">
                        <span className={`sch-badge sch-badge-age-${String(ageLimit).toLowerCase().replace("+", "")}`}>
                          {ageLimit}
                        </span>
                        <span className="sch-badge sch-badge-format">
                          2D
                        </span>
                        <span className="sch-badge sch-badge-lang">
                          {subtitles}
                        </span>
                      </div>

                      <p className="sch-movie-genre">
                        {getMovieGenre(movie)}
                      </p>

                      <button
                        type="button"
                        className="sch-detail-btn"
                        onClick={() => setSelectedTrailer(movie)}
                        style={{
                          marginTop: "8px",
                          background: "rgba(255, 255, 255, 0.08)",
                          color: "#fff",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          borderRadius: "4px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          alignSelf: "flex-start",
                          display: "inline-block",
                          width: "fit-content"
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = "rgba(255, 255, 255, 0.18)";
                          e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = "rgba(255, 255, 255, 0.08)";
                          e.target.style.borderColor = "rgba(255, 255, 255, 0.15)";
                        }}
                      >
                        Chi tiết
                      </button>
                    </div>

                    {/* Column 3: Showtimes grouped by Cinema */}
                    <div className="sch-card-times-col">
                      {cinemaGroups.map((group) => (
                        <div className="sch-cinema-group" key={group.cinemaName}>
                          <h4 className="sch-cinema-name">{group.cinemaName}</h4>
                          <div className="sch-slots-grid">
                            {group.slots.map((st) => {
                              const startHour = getStartHour(st);
                              const disabled = !isBookable(getShowtimeStatus(st));
                              return (
                                <button
                                  key={getShowtimeId(st)}
                                  type="button"
                                  className="sch-slot-btn"
                                  disabled={disabled}
                                  onClick={() => handleSelectTime(movie, st)}
                                >
                                  {startHour}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Styled arrow chevron indicating booking */}
                    <div className="sch-card-chevron">
                      ›
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && filteredGroupedMovies.length === 0 && (
            <div className="sch-no-results">
              Không tìm thấy phim hoặc suất chiếu nào phù hợp với bộ lọc của bạn.
            </div>
          )}
        </div>
      </main>
      {/* Detail Modal (Trailer & Info) */}
      {selectedTrailer && (
        <div 
          className="trailer-overlay" 
          onClick={() => setSelectedTrailer(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200
          }}
        >
          <div 
            className="trailer-modal" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              background: "#111",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              width: "850px",
              maxWidth: "90%",
              padding: "24px",
              position: "relative",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8)",
              color: "#fff"
            }}
          >
            <button
              type="button"
              className="trailer-close"
              onClick={() => setSelectedTrailer(null)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "transparent",
                border: "none",
                color: "#999",
                fontSize: "32px",
                cursor: "pointer",
                transition: "color 0.2s"
              }}
              onMouseOver={(e) => e.target.style.color = "#fff"}
              onMouseOut={(e) => e.target.style.color = "#999"}
            >
              &times;
            </button>
            
            <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#fff", marginBottom: "16px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "12px" }}>
              CHI TIẾT PHIM: {getMovieTitle(selectedTrailer)}
            </h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Top Side: Video Trailer (Large screen format) */}
              <div style={{ position: "relative", width: "100%", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255, 255, 255, 0.1)", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)" }}>
                {getMovieTrailer(selectedTrailer) ? (
                  <iframe
                    src={getEmbedUrl(getMovieTrailer(selectedTrailer))}
                    title={`Trailer ${getMovieTitle(selectedTrailer)}`}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    style={{ width: "100%", aspectRatio: "16/9", border: "none", display: "block", background: "#000" }}
                  ></iframe>
                ) : (
                  <div style={{ width: "100%", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.03)" }}>
                    🎬 Phim này chưa có trailer chính thức.
                  </div>
                )}
              </div>

              {/* Bottom Side: Split Grid for Info & Metadata */}
              <div className="detail-modal-split" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px", color: "#fff" }}>
                {/* Left Side: Description */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <h4 style={{ fontSize: "1rem", fontWeight: "800", color: "#e50914", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    NỘI DUNG PHIM
                  </h4>
                  <div 
                    className="detail-modal-desc" 
                    style={{ 
                      fontSize: "0.9rem", 
                      color: "rgba(255,255,255,0.75)", 
                      lineHeight: "1.6", 
                      margin: 0, 
                      maxHeight: "190px", 
                      overflowY: "auto",
                      paddingRight: "8px",
                      textAlign: "justify",
                      whiteSpace: "pre-wrap"
                    }}
                  >
                    {selectedTrailer.description || selectedTrailer.Description || "Chưa có thông tin nội dung mô tả của bộ phim này."}
                  </div>
                </div>

                {/* Right Side: Metadata list */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "rgba(255, 255, 255, 0.03)", padding: "16px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.06)", justifyContent: "center" }}>
                  <div style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", width: "95px", flexShrink: 0 }}>🏷️ Thể loại:</span> 
                    <span style={{ fontWeight: "600", color: "#fff" }}>{getMovieGenre(selectedTrailer)}</span>
                  </div>
                  <div style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", width: "95px", flexShrink: 0 }}>🎬 Đạo diễn:</span> 
                    <span style={{ fontWeight: "600", color: "#fff" }}>{selectedTrailer.director || selectedTrailer.Director || "Đang cập nhật"}</span>
                  </div>
                  <div style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", width: "95px", flexShrink: 0 }}>⏱️ Thời lượng:</span> 
                    <span style={{ fontWeight: "600", color: "#fff" }}>{getMovieDuration(selectedTrailer)}</span>
                  </div>
                  <div style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", width: "95px", flexShrink: 0 }}>🔞 Độ tuổi:</span> 
                    <span style={{ background: "#e50914", color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "800", display: "inline-block" }}>
                      {getMovieAge(selectedTrailer)}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", width: "95px", flexShrink: 0 }}>📅 Khởi chiếu:</span> 
                    <span style={{ fontWeight: "600", color: "#fff" }}>{getMovieReleaseDate(selectedTrailer)}</span>
                  </div>
                  {selectedTrailer.language && (
                    <div style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "rgba(255,255,255,0.4)", width: "95px", flexShrink: 0 }}>🗣️ Ngôn ngữ:</span> 
                      <span style={{ fontWeight: "600", color: "#fff" }}>{selectedTrailer.language}</span>
                    </div>
                  )}
                  {selectedTrailer.subtitles && (
                    <div style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "rgba(255,255,255,0.4)", width: "95px", flexShrink: 0 }}>📝 Phụ đề:</span> 
                      <span style={{ fontWeight: "600", color: "#fff" }}>{selectedTrailer.subtitles}</span>
                    </div>
                  )}
                  {(selectedTrailer.actors || selectedTrailer.Actors) && (
                    <div style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "rgba(255,255,255,0.4)", width: "95px", flexShrink: 0 }}>👥 Diễn viên:</span> 
                      <span style={{ fontWeight: "600", color: "#fff" }}>{selectedTrailer.actors || selectedTrailer.Actors}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getEmbedUrl(url) {
  if (!url) return "";
  let videoId = "";
  if (url.includes("youtube.com/watch?v=")) {
    videoId = url.split("v=")[1]?.split("&")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0];
  } else if (url.includes("youtube.com/embed/")) {
    return url;
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
}

export default Home;