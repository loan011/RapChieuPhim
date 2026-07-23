import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "../../styles/Movies.css";
import CustomerProfileDropdown from "../../components/CustomerProfileDropdown";

import {
  useMovies,
  getAreaId,
  getAreaName,
  getMovieId,
  getMovieTitle,
  getMovieImage,
  getMovieAge,
  getMovieTag,
  getMovieGenre,
  getMovieDuration,
  getMovieReleaseDate,
  getMovieTrailer,
  isMovieUpcoming,
} from "./useMovies";

import {
  getShowtimeMovieId,
  getShowtimeId,
  getStartHour,
  getShowtimeStatus,
  findRoomByShowtime,
  findCinemaByRoom,
  getRoomName,
  getCinemaName,
  getShowDate,
  createDateRange,
} from "../usehome";

import RatingModal from "../../components/RatingModal";
import { computeAccurateRating } from "../../services/reviewService";

function Movies() {
  const {
    allMovies,
    moviesNow,
    moviesComing,
    areas,
    selectedAreaId,
    selectedTrailer,
    loading,
    userEmail,
    handleAreaChange,
    openTrailer,
    closeTrailer,
    hasValidShowtimes,
    cinemas,
    rooms,
    showtimes,
  } = useMovies();

  const [selectedMovieForShowtimes, setSelectedMovieForShowtimes] = useState(null);
  const [selectedMovieForRating, setSelectedMovieForRating] = useState(null);
  const [ratingVersion, setRatingVersion] = useState(0);
  const [modalAreaId, setModalAreaId] = useState("");
  const [modalDate, setModalDate] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  const nowShowingRef = useRef(null);
  const upcomingRef = useRef(null);

  const modalDates = useMemo(() => {
    return createDateRange(new Date(), 7);
  }, []);

  const handleBuyTicketFromDetail = () => {
    if (!selectedTrailer) return;
    const targetMovie = selectedTrailer;
    closeTrailer();
    setSelectedMovieForShowtimes(targetMovie);
    setModalAreaId(selectedAreaId || (areas[0] ? getAreaId(areas[0]) : ""));
    setModalDate(modalDates[0].iso);
  };

  // Filter moviesNow by header area selection if selectedAreaId is present
  const filteredMoviesNow = useMemo(() => {
    if (!selectedAreaId) return moviesNow;
    
    // Filter movies that have showtimes in cinemas of the selected area
    return moviesNow.filter((movie) => {
      const movieId = getMovieId(movie);
      return showtimes.some((st) => {
        const stMovieId = st?.movieId ?? st?.MovieId ?? st?.movie?.movieId ?? st?.movie?.MovieId;
        if (String(stMovieId) !== String(movieId)) return false;
        
        const room = findRoomByShowtime(st, rooms);
        if (!room) return false;
        
        const cinema = findCinemaByRoom(room, cinemas);
        if (!cinema) return false;
        
        const cinemaAreaId = cinema?.areaId ?? cinema?.AreaId;
        return String(cinemaAreaId) === String(selectedAreaId);
      });
    });
  }, [moviesNow, selectedAreaId, showtimes, rooms, cinemas]);

  // Filter moviesComing by area (usually show all upcoming movies since they don't have showtimes yet)
  const filteredMoviesComing = useMemo(() => {
    return moviesComing;
  }, [moviesComing]);

  const sliderMovies = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(today.getDate() - 4);
    fourDaysAgo.setHours(0, 0, 0, 0);

    const newReleases = filteredMoviesNow.filter((movie) => {
      const rawRelease = movie.releaseDate || movie.ReleaseDate || movie.release_date || movie.startDate || movie.StartDate || movie.openingDate || movie.OpeningDate || movie.premiereDate || movie.PremiereDate;
      if (!rawRelease) return false;
      const releaseDt = new Date(rawRelease);
      return !isNaN(releaseDt.getTime()) && releaseDt >= fourDaysAgo && releaseDt <= today;
    });

    if (newReleases.length > 0) {
      return newReleases;
    }

    return filteredMoviesNow.slice(0, 5);
  }, [filteredMoviesNow]);

  // Auto-advance slide every 5s
  useEffect(() => {
    if (sliderMovies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderMovies.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sliderMovies]);

  const scrollContainer = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = 300 * 2;
      ref.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const groupedModalShowtimes = useMemo(() => {
    if (!selectedMovieForShowtimes) return [];
    const movieId = getMovieId(selectedMovieForShowtimes);
    const now = new Date();

    const filtered = showtimes.filter((showtime) => {
      const showtimeMovieId = getShowtimeMovieId(showtime);
      if (String(showtimeMovieId) !== String(movieId)) return false;

      const showDateStr = getShowDate(showtime);
      if (showDateStr !== modalDate) return false;

      const status = getShowtimeStatus(showtime);
      if (status === "Hủy") return false;

      const startTimeStr = showtime?.startTime ?? showtime?.StartTime ?? "";
      if (startTimeStr && (new Date(startTimeStr).getTime() + 5 * 60 * 1000 < now.getTime())) return false;

      return true;
    });

    const grouped = {};
    filtered.forEach((showtime) => {
      const room = findRoomByShowtime(showtime, rooms);
      if (!room) return;

      const cinema = findCinemaByRoom(room, cinemas);
      if (!cinema) return;

      const cinemaAreaId = cinema?.areaId ?? cinema?.AreaId;
      if (modalAreaId && String(cinemaAreaId) !== String(modalAreaId)) return;

      const cinemaId = cinema?.cinemaId ?? cinema?.CinemaId ?? cinema?.id ?? cinema?.Id;
      const cinemaName = getCinemaName(cinema);

      if (!grouped[cinemaId]) {
        grouped[cinemaId] = {
          cinemaName,
          showtimes: []
        };
      }

      const startHour = getStartHour(showtime);

      grouped[cinemaId].showtimes.push({
        ...showtime,
        startHour,
        roomName: getRoomName(room)
      });
    });

    Object.values(grouped).forEach(c => {
      c.showtimes.sort((a, b) => a.startHour.localeCompare(b.startHour));
    });

    return Object.values(grouped);
  }, [selectedMovieForShowtimes, showtimes, rooms, cinemas, modalDate, modalAreaId]);

  return (
    <div className="movies-page">
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
          <Link to="/showtimes">Lịch chiếu</Link>
          <Link to="/" className="active">Phim</Link>
          <Link to="/ticket-price">Giá vé</Link>
        </nav>


      </header>

      {/* Main Content */}
      <main className="movies-content">
        {/* Banner Hero Slider */}
        {sliderMovies.length > 0 && (
          <section className="hero-slider">
            {sliderMovies.map((movie, idx) => {
              const isActive = idx === currentSlide;
              const movieId = getMovieId(movie);
              return (
                <div
                  key={movieId || idx}
                  className={`slide-item ${isActive ? "active" : ""}`}
                  style={{
                    backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.4) 100%), url(${getMovieImage(movie)})`
                  }}
                >
                  <div className="slide-content">
                    <span className="slide-tag">NỔI BẬT</span>
                    <h1 className="slide-title">{getMovieTitle(movie)}</h1>
                    <p className="slide-meta">
                      Thể loại: <strong>{getMovieGenre(movie)}</strong> | Thời lượng: <strong>{getMovieDuration(movie)}</strong>
                    </p>
                    <p className="slide-desc">
                      {movie.description || movie.Description || "Chào mừng bạn đến với hệ thống rạp chiếu phim Cinemas HCM. Trải nghiệm âm thanh Dolby Atmos sống động và hình ảnh IMAX sắc nét đỉnh cao cùng bom tấn hành động hấp dẫn này."}
                    </p>
                    <div className="slide-actions">
                      {hasValidShowtimes(movie) ? (
                        <button
                          type="button"
                          className="slide-btn-primary"
                          onClick={() => {
                            setSelectedMovieForShowtimes(movie);
                            setModalAreaId(selectedAreaId || (areas[0] ? getAreaId(areas[0]) : ""));
                            setModalDate(modalDates[0].iso);
                          }}
                        >
                          🎟️ MUA VÉ NGAY
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="slide-btn-primary disabled-btn"
                          disabled
                        >
                          🗓️ KHỞI CHIẾU: {getMovieReleaseDate(movie)}
                        </button>
                      )}
                      <button
                        type="button"
                        className="slide-btn-secondary"
                        onClick={() => openTrailer(movie)}
                      >
                        ▶ CHI TIẾT
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Slider arrows */}
            {sliderMovies.length > 1 && (
              <>
                <button
                  type="button"
                  className="slider-arrow slider-arrow-left"
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + sliderMovies.length) % sliderMovies.length)}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="slider-arrow slider-arrow-right"
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % sliderMovies.length)}
                >
                  ›
                </button>
              </>
            )}

            {/* Slider dots */}
            <div className="slider-dots">
              {sliderMovies.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`dot-btn ${idx === currentSlide ? "active" : ""}`}
                  onClick={() => setCurrentSlide(idx)}
                />
              ))}
            </div>
          </section>
        )}

        {loading && <p className="movie-loading">Đang tải danh sách phim...</p>}

        {/* PHIM ĐANG CHIẾU */}
        {!loading && filteredMoviesNow.length > 0 && (
          <section className="movie-section-slider">
            <div className="section-header-row">
              <h2 className="section-title">PHIM ĐANG CHIẾU</h2>
              <a href="#all" className="section-link">Xem tất cả ›</a>
            </div>

            <div className="slider-container-relative">
              <button
                type="button"
                className="scroll-btn scroll-btn-left"
                onClick={() => scrollContainer(nowShowingRef, "left")}
              >
                ‹
              </button>
              
              <div className="movie-scroll-list" ref={nowShowingRef}>
                {filteredMoviesNow.map((movie, index) => {
                  const movieId = getMovieId(movie);
                  const defaultBase = (8 + (movieId % 17) / 10).toFixed(1);
                  const accurateStats = computeAccurateRating(movieId, defaultBase);

                  return (
                    <div className="movie-card-style" key={movieId || index}>
                      <div className="movie-poster-style" onClick={() => openTrailer(movie)}>
                        <img
                          src={getMovieImage(movie)}
                          alt={getMovieTitle(movie)}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop";
                          }}
                        />
                        <span className="movie-age-style">{getMovieAge(movie)}</span>
                        <span 
                          className="movie-rating-badge"
                          title="Bấm để xem & đánh giá phim"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMovieForRating(movie);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          ★ {accurateStats.avgRating}
                        </span>
                        <button
                          type="button"
                          className="play-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openTrailer(movie);
                          }}
                        >
                          ▶
                        </button>
                      </div>

                      <h3 className="movie-card-title">{getMovieTitle(movie)}</h3>
                      <p className="movie-card-genre">{getMovieGenre(movie)}</p>
                      
                      <div className="movie-card-buttons">
                        {!hasValidShowtimes(movie) ? (
                          <button
                            type="button"
                            className="buy-ticket-btn disabled-btn"
                            disabled
                          >
                            Hết vé
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="buy-ticket-btn"
                            onClick={() => {
                              setSelectedMovieForShowtimes(movie);
                              setModalAreaId(selectedAreaId || (areas[0] ? getAreaId(areas[0]) : ""));
                              setModalDate(modalDates[0].iso);
                            }}
                          >
                            Mua vé
                          </button>
                        )}
                        <button
                          type="button"
                          className="trailer-btn"
                          onClick={() => openTrailer(movie)}
                        >
                          Chi tiết
                        </button>
                        <button
                          type="button"
                          className="rate-card-btn"
                          onClick={() => setSelectedMovieForRating(movie)}
                        >
                          ⭐ Đánh giá
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="scroll-btn scroll-btn-right"
                onClick={() => scrollContainer(nowShowingRef, "right")}
              >
                ›
              </button>
            </div>
          </section>
        )}

        {/* PHIM SẮP CHIẾU */}
        {!loading && filteredMoviesComing.length > 0 && (
          <section className="movie-section-slider upcoming-section">
            <div className="section-header-row">
              <h2 className="section-title">PHIM SẮP CHIẾU</h2>
            </div>

            <div className="slider-container-relative">
              <button
                type="button"
                className="scroll-btn scroll-btn-left"
                onClick={() => scrollContainer(upcomingRef, "left")}
              >
                ‹
              </button>
              
              <div className="movie-scroll-list" ref={upcomingRef}>
                {filteredMoviesComing.map((movie, index) => {
                  const movieId = getMovieId(movie);

                  return (
                    <div className="movie-card-style" key={movieId || index}>
                      <div className="movie-poster-style" onClick={() => openTrailer(movie)}>
                        <img
                          src={getMovieImage(movie)}
                          alt={getMovieTitle(movie)}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop";
                          }}
                        />
                        <span className="movie-age-style">{getMovieAge(movie)}</span>
                        <div className="upcoming-tag-ribbon">SẮP CHIẾU</div>
                        <button
                          type="button"
                          className="play-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openTrailer(movie);
                          }}
                        >
                          ▶
                        </button>
                      </div>

                      <h3 className="movie-card-title">{getMovieTitle(movie)}</h3>
                      <p className="movie-card-genre">{getMovieGenre(movie)}</p>
                      
                      <div className="upcoming-release-date">
                        🗓️ {getMovieReleaseDate(movie)}
                      </div>
                      <button
                        type="button"
                        className="trailer-btn-solo"
                        onClick={() => openTrailer(movie)}
                      >
                        Chi tiết
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="scroll-btn scroll-btn-right"
                onClick={() => scrollContainer(upcomingRef, "right")}
              >
                ›
              </button>
            </div>
          </section>
        )}

      </main>

      {/* Trailer Modal (Detail Modal) */}
      {selectedTrailer && (
        <div className="trailer-overlay" onClick={closeTrailer}>
          <div className="trailer-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "850px", width: "90%", padding: "24px" }}>
            <button
              type="button"
              className="trailer-close"
              onClick={closeTrailer}
            >
              ×
            </button>
            <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#fff", marginBottom: "16px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "12px" }}>
              CHI TIẾT PHIM: {getMovieTitle(selectedTrailer)}
            </h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Top Side: Video Trailer (Large screen format) */}
              <div style={{ position: "relative", width: "100%", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255, 255, 255, 0.1)", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)" }}>
                {getMovieTrailer(selectedTrailer) ? (
                  <iframe
                    src={getMovieTrailer(selectedTrailer)}
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
                  
                  {hasValidShowtimes(selectedTrailer) && (
                    <button
                      type="button"
                      onClick={handleBuyTicketFromDetail}
                      style={{ 
                        marginTop: "12px", 
                        padding: "10px 0", 
                        fontSize: "13.5px", 
                        fontWeight: "800", 
                        background: "#e50914", 
                        borderRadius: "6px",
                        border: "none",
                        color: "#fff",
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "center",
                        boxShadow: "0 4px 12px rgba(229, 9, 20, 0.3)",
                        transition: "all 0.2s"
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = "#b20710";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = "#e50914";
                      }}
                    >
                      🎟️ ĐẶT VÉ NGAY
                    </button>
                  )}
                  
                  {!isMovieUpcoming(selectedTrailer) ? (
                    <button
                      type="button"
                      onClick={() => {
                        const targetMovie = selectedTrailer;
                        closeTrailer();
                        setSelectedMovieForRating(targetMovie);
                      }}
                      style={{ 
                        marginTop: "8px", 
                        padding: "10px 0", 
                        fontSize: "13.5px", 
                        fontWeight: "800", 
                        background: "rgba(245, 158, 11, 0.15)", 
                        borderRadius: "6px",
                        border: "1px solid rgba(245, 158, 11, 0.5)",
                        color: "#f59e0b",
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "center",
                        transition: "all 0.2s"
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = "#f59e0b";
                        e.target.style.color = "#000";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = "rgba(245, 158, 11, 0.15)";
                        e.target.style.color = "#f59e0b";
                      }}
                    >
                      ⭐ ĐÁNH GIÁ PHIM
                    </button>
                  ) : (
                    <div style={{
                      marginTop: "8px", 
                      padding: "9px 0", 
                      fontSize: "12.5px", 
                      fontWeight: "600", 
                      background: "rgba(255, 255, 255, 0.04)", 
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "rgba(255, 255, 255, 0.4)",
                      textAlign: "center"
                    }}>
                      🔒 Phim chưa khởi chiếu (Chưa mở đánh giá)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Showtimes Modal */}
      {selectedMovieForShowtimes && (
        <div className="showtime-modal-overlay" onClick={() => setSelectedMovieForShowtimes(null)}>
          <div className="showtime-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="showtime-modal-close"
              onClick={() => setSelectedMovieForShowtimes(null)}
            >
              ×
            </button>
            
            <h2>LỊCH CHIẾU - {getMovieTitle(selectedMovieForShowtimes)}</h2>
            
            <div className="modal-filter-row">
              <div className="modal-filter-group">
                <label>Khu vực:</label>
                <select
                  value={modalAreaId}
                  onChange={(e) => setModalAreaId(e.target.value)}
                >
                  <option value="">Tất cả khu vực</option>
                  {areas.map((area) => (
                    <option key={getAreaId(area)} value={getAreaId(area)}>
                      {getAreaName(area)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-date-tabs">
              {modalDates.map((date) => (
                <button
                  key={date.iso}
                  type="button"
                  className={`modal-date-tab-btn ${modalDate === date.iso ? "active" : ""}`}
                  onClick={() => setModalDate(date.iso)}
                >
                  <strong>{date.day}</strong>
                  <span>/{date.month} - {date.weekDay}</span>
                </button>
              ))}
            </div>

            <div className="modal-showtimes-content">
              {groupedModalShowtimes.length > 0 ? (
                groupedModalShowtimes.map((group) => (
                  <div key={group.cinemaName} className="modal-cinema-section">
                    <h4 className="modal-cinema-title">📍 {group.cinemaName}</h4>
                    <div className="modal-time-slots">
                      {group.showtimes.map((showtime) => {
                        const showtimeId = showtime?.showTimeId ?? showtime?.ShowTimeId ?? showtime?.showtimeId ?? showtime?.ShowtimeId ?? showtime?.id ?? showtime?.Id;
                        const movieTempId = getMovieId(selectedMovieForShowtimes);
                        return (
                          <Link
                            key={showtimeId}
                            to={`/booking?movie=${movieTempId}&showtimeId=${showtimeId}`}
                            className="modal-time-btn"
                          >
                            <strong>{showtime.startHour}</strong>
                            <span>{showtime.roomName}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="modal-no-showtimes">Không có suất chiếu nào phù hợp trong ngày này.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Movie Rating Modal */}
      {selectedMovieForRating && (
        <RatingModal
          movie={selectedMovieForRating}
          onClose={() => setSelectedMovieForRating(null)}
          onRatingUpdated={() => setRatingVersion((v) => v + 1)}
        />
      )}
    </div>
  );
}

export default Movies;