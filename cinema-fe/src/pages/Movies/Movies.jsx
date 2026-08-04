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
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
}

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

  const sortedAreas = useMemo(() => {
    if (!areas || areas.length === 0) return [];
    return [...areas].sort((a, b) => {
      const nameA = String(getAreaName(a) || "").toLowerCase();
      const nameB = String(getAreaName(b) || "").toLowerCase();
      if (nameA.includes("đồng khởi") || nameA.includes("dong khoi")) return -1;
      if (nameB.includes("đồng khởi") || nameB.includes("dong khoi")) return 1;
      return nameA.localeCompare(nameB, "vi");
    });
  }, [areas]);

  const handleBuyTicketFromDetail = () => {
    if (!selectedTrailer) return;
    const targetMovie = selectedTrailer;
    closeTrailer();
    setSelectedMovieForShowtimes(targetMovie);
    setModalAreaId(selectedAreaId || (sortedAreas[0] ? getAreaId(sortedAreas[0]) : ""));
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
                          loading="lazy"
                          decoding="async"
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
                              setModalAreaId(selectedAreaId || (sortedAreas[0] ? getAreaId(sortedAreas[0]) : ""));
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
                          loading="lazy"
                          decoding="async"
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

      {/* Movie Detail Modal */}
      {selectedTrailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={closeTrailer}>
          <div 
            className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111214] shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-white/10 bg-[#111214] px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">🎬</span>
                <h2 className="text-lg font-bold tracking-wide uppercase">CHI TIẾT PHIM</h2>
              </div>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lg text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                onClick={closeTrailer}
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 space-y-8">

              {/* Section 1: Top Grid (Trailer + Info Box) */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)] items-start">
                {/* Left: Trailer */}
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black shadow-lg">
                  {getMovieTrailer(selectedTrailer) ? (
                    <iframe
                      src={getEmbedUrl(getMovieTrailer(selectedTrailer))}
                      title={`Trailer ${getMovieTitle(selectedTrailer)}`}
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-none"
                    ></iframe>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/40 bg-zinc-900/50">
                      <span className="text-3xl">🎬</span>
                      <span>Chưa có trailer chính thức.</span>
                    </div>
                  )}
                </div>

                {/* Right: Movie Info Box */}
                <div className="flex flex-col justify-between gap-4 rounded-xl border border-white/5 bg-zinc-900/60 p-5 h-full">
                  <div className="flex flex-col gap-3 text-xs text-zinc-300">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-white/5">
                      <span className="text-zinc-500 w-24 shrink-0 font-medium">🏷️ THỂ LOẠI</span>
                      <span className="font-semibold text-white">{getMovieGenre(selectedTrailer)}</span>
                    </div>

                    <div className="flex items-center gap-2 pb-1.5 border-b border-white/5">
                      <span className="text-zinc-500 w-24 shrink-0 font-medium">🎬 ĐẠO DIỄN</span>
                      <span className="font-semibold text-white">{selectedTrailer.director || selectedTrailer.Director || "Đang cập nhật"}</span>
                    </div>

                    <div className="flex items-center gap-2 pb-1.5 border-b border-white/5">
                      <span className="text-zinc-500 w-24 shrink-0 font-medium">⏱️ THỜI LƯỢNG</span>
                      <span className="font-semibold text-white">{getMovieDuration(selectedTrailer)}</span>
                    </div>

                    <div className="flex items-center gap-2 pb-1.5 border-b border-white/5">
                      <span className="text-zinc-500 w-24 shrink-0 font-medium">🔞 ĐỘ TUỔI</span>
                      <span className="bg-red-600 text-white px-2 py-0.5 rounded font-extrabold text-[10px] tracking-wider uppercase">
                        {getMovieAge(selectedTrailer)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pb-1.5 border-b border-white/5">
                      <span className="text-zinc-500 w-24 shrink-0 font-medium">📅 KHỞI CHIẾU</span>
                      <span className="font-semibold text-white">{getMovieReleaseDate(selectedTrailer)}</span>
                    </div>

                    <div className="flex items-center gap-2 pb-1.5 border-b border-white/5">
                      <span className="text-zinc-500 w-24 shrink-0 font-medium">🗣️ NGÔN NGỮ</span>
                      <span className="font-semibold text-white">{selectedTrailer.language || selectedTrailer.Language || "Đang cập nhật"}</span>
                    </div>

                    <div className="flex items-center gap-2 border-b border-white/5 pb-1.5">
                      <span className="text-zinc-500 w-24 shrink-0 font-medium">📝 PHỤ ĐỀ</span>
                      <span className="font-semibold text-white">{selectedTrailer.subtitles || selectedTrailer.Subtitles || "Đang cập nhật"}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleBuyTicketFromDetail}
                      className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-xs tracking-wider uppercase rounded-lg shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2"
                    >
                      🎟️ ĐẶT VÉ NGAY
                    </button>

                    {!isMovieUpcoming(selectedTrailer) ? (
                      <button
                        type="button"
                        onClick={() => {
                          const targetMovie = selectedTrailer;
                          closeTrailer();
                          setSelectedMovieForRating(targetMovie);
                        }}
                        className="w-full py-2.5 px-4 bg-amber-500/10 hover:bg-amber-500/20 active:scale-[0.99] border border-amber-500/50 text-amber-400 font-bold text-xs tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        ⭐ ĐÁNH GIÁ PHIM
                      </button>
                    ) : (
                      <div className="w-full py-2 px-3 text-center text-xs text-zinc-500 bg-white/5 border border-white/10 rounded-lg">
                        🔒 Phim chưa khởi chiếu (Chưa mở đánh giá)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Movie Description & Actors */}
              <section className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 border-t border-white/10 pt-8">
                {/* Left: Description */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-sm font-extrabold text-red-500 uppercase tracking-wider flex items-center gap-2">
                    <span>🍿</span> NỘI DUNG PHIM
                  </h4>
                  <p className="whitespace-pre-line text-sm leading-7 text-gray-300">
                    {selectedTrailer?.description || selectedTrailer?.Description || selectedTrailer?.content || selectedTrailer?.Content || selectedTrailer?.movieDescription || "Nội dung phim đang được cập nhật."}
                  </p>
                </div>

                {/* Right: Actors / Cast */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-sm font-extrabold text-red-500 uppercase tracking-wider flex items-center gap-2">
                    <span>👤</span> DIỄN VIÊN
                  </h4>
                  {(() => {
                    const raw = selectedTrailer.actors || selectedTrailer.Actors || selectedTrailer.cast;
                    const list = !raw ? [] : Array.isArray(raw) ? raw.map(a => typeof a === "string" ? { name: a, avatar: "" } : { name: a.name || a.Name || "Diễn viên", avatar: a.avatar || a.imageUrl || "" }) : typeof raw === "string" ? raw.split(/[,;]/).map(n => ({ name: n.trim(), avatar: "" })).filter(a => a.name) : [];
                    if (list.length === 0) return <p className="text-xs text-zinc-500">Chưa có thông tin diễn viên.</p>;
                    return (
                      <div className="flex items-center gap-3 overflow-x-auto pb-2">
                        {list.map((actor, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-1.5 w-24 shrink-0 bg-zinc-900/60 p-2 rounded-xl border border-white/5 text-center">
                            <div className="w-16 h-20 rounded-lg overflow-hidden bg-zinc-800 flex items-center justify-center">
                              {actor.avatar ? (
                                <img src={actor.avatar} alt={actor.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-2xl text-zinc-500">👤</span>
                              )}
                            </div>
                            <span className="text-[11px] font-medium text-zinc-200 line-clamp-2 leading-snug">{actor.name}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </section>

              {/* Section 3: Movie Gallery */}
              {(() => {
                const gallery = selectedTrailer.images || selectedTrailer.gallery || selectedTrailer.imagesList || selectedTrailer.Images || selectedTrailer.Gallery;
                const list = Array.isArray(gallery) ? gallery.filter(Boolean) : typeof gallery === "string" ? gallery.split(/[,;]/).map(s => s.trim()).filter(Boolean) : [];
                if (list.length === 0) return null;
                return (
                  <section className="mt-8 border-t border-white/10 pt-8">
                    <h4 className="text-sm font-extrabold text-red-500 uppercase tracking-wider flex items-center gap-2 mb-4">
                      <span>🖼️</span> HÌNH ÁNH PHIM
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {list.map((imgUrl, idx) => (
                        <div key={idx} className="aspect-video rounded-xl overflow-hidden border border-white/10 bg-zinc-900 shadow">
                          <img src={imgUrl} alt={`Phim ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })()}

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
                <label>Cinema:</label>
                <select
                  value={modalAreaId || (sortedAreas[0] ? getAreaId(sortedAreas[0]) : "")}
                  onChange={(e) => setModalAreaId(e.target.value)}
                >
                  {sortedAreas.map((area) => (
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
                            to={`/booking?movie=${movieTempId}&showtimeId=${showtimeId}&date=${modalDate}&cinemaId=${modalAreaId}`}
                            state={{
                              movieId: movieTempId,
                              showtimeId: showtimeId,
                              selectedDateIso: modalDate,
                              selectedCinemaId: modalAreaId,
                              selectedShowtime: showtime,
                            }}
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