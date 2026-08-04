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
} from "./usehome";

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedTrailer(null)}>
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
                onClick={() => setSelectedTrailer(null)}
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
                      onClick={() => {
                        const mId = selectedTrailer.id || selectedTrailer.movieId || selectedTrailer.MovieId;
                        setSelectedTrailer(null);
                        window.location.href = `/movies?movieId=${mId}`;
                      }}
                      className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-xs tracking-wider uppercase rounded-lg shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2"
                    >
                      🎟️ ĐẶT VÉ NGAY
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const mId = selectedTrailer.id || selectedTrailer.movieId || selectedTrailer.MovieId;
                        setSelectedTrailer(null);
                        window.location.href = `/movies?movieId=${mId}&rate=true`;
                      }}
                      className="w-full py-2.5 px-4 bg-amber-500/10 hover:bg-amber-500/20 active:scale-[0.99] border border-amber-500/50 text-amber-400 font-bold text-xs tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      ⭐ ĐÁNH GIÁ PHIM
                    </button>
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