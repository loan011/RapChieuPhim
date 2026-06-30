import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import "../../styles/Movies.css";
import CustomerProfileDropdown from "../../components/CustomerProfileDropdown";

import {
  MOVIE_TABS,
  useMovies,
  getAreaId,
  getAreaName,
  getMovieId,
  getMovieTitle,
  getMovieImage,
  getMovieAge,
  getMovieTag,
  getMovieStatus,
  getMovieGenre,
  getMovieDuration,
  getMovieReleaseDate,
  getMovieTrailer,
} from "./Movies.js";

import {
  getShowtimeMovieId,
  getShowtimeId,
  getStartHour,
  getShowtimeStatus,
  isBookable,
  findRoomByShowtime,
  findCinemaByRoom,
  getRoomName,
  getCinemaName,
  getShowDate,
  createDateRange,
} from "../home.js";

function Movies() {
  const {
    activeTab,
    movies,
    areas,
    selectedAreaId,
    selectedTrailer,
    loading,
    userEmail,
    changeTab,
    handleAreaChange,
    openTrailer,
    closeTrailer,
    getBookingLink,
    hasValidShowtimes,
    cinemas,
    rooms,
    showtimes,
  } = useMovies();

  const [selectedMovieForShowtimes, setSelectedMovieForShowtimes] = useState(null);
  const [modalAreaId, setModalAreaId] = useState("");
  const [modalDate, setModalDate] = useState("");

  const modalDates = useMemo(() => {
    return createDateRange(new Date(), 7);
  }, []);

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
      if (startTimeStr && new Date(startTimeStr) < now) return false;

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
      {userEmail ? (
        <div className="movie-top-login">
          <CustomerProfileDropdown />
        </div>
      ) : (
        <div className="movie-top-login">
          <Link to="/login">Đăng nhập</Link>
          <span> | </span>
          <Link to="/register">Đăng ký</Link>
          <span> GB</span>
        </div>
      )}

      <header className="movie-header">
        <div className="movie-logo">
          <span>Cinemas</span>
          <b>HCM</b>
        </div>

        <select
          className="movie-select"
          value={selectedAreaId}
          onChange={(e) => handleAreaChange(e.target.value)}
        >
          <option value="">Chọn rạp HCM</option>

          {areas.map((area, index) => {
            const areaId = getAreaId(area);

            return (
              <option key={areaId || index} value={areaId}>
                {getAreaName(area)}
              </option>
            );
          })}
        </select>

        <nav>
          <Link className="active" to="/movies">
            PHIM
          </Link>
          <Link to="/">LỊCH CHIẾU THEO RẠP</Link>
          <Link to="/cinema">RẠP</Link>
          <Link to="/ticket-price">GIÁ VÉ</Link>
          <a href="#news">TIN MỚI VÀ ƯU ĐÃI</a>
          <a href="#franchise">NHƯỢNG QUYỀN</a>
          <a href="#member">THÀNH VIÊN</a>
        </nav>
      </header>

      <main className="movies-content">
        <div className="movie-tabs">
          {MOVIE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? "active" : ""}
              onClick={() => changeTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && <p className="movie-loading">Đang tải phim...</p>}

        {!loading && movies.length === 0 && (
          <p className="movie-loading">Không có phim trong mục này.</p>
        )}

        <section className="movie-grid">
          {!loading &&
            movies.map((movie, index) => {
              const movieId = getMovieId(movie);

              return (
                <div className="movie-card-style" key={movieId || index}>
                  <div
                    className="movie-poster-style"
                    onClick={() => openTrailer(movie)}
                  >
                    <img
                      src={getMovieImage(movie)}
                      alt={getMovieTitle(movie)}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop";
                      }}
                    />

                    <span className="movie-age-style">
                      {getMovieAge(movie)}
                    </span>

                    <span className="movie-tag-style">
                      {getMovieTag(movie, activeTab)}
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

                  <h2>{getMovieTitle(movie)}</h2>

                  <p>
                    <b>Thể loại:</b> {getMovieGenre(movie)}
                  </p>

                  <p>
                    <b>Thời lượng:</b> {getMovieDuration(movie)}
                  </p>

                  <p>
                    <b>Khởi chiếu:</b>{" "}
                    {getMovieReleaseDate(movie)}
                  </p>

                  <p>
                    <b>Trạng thái:</b>{" "}
                    {getMovieStatus(movie, activeTab)}
                  </p>

                  {activeTab !== "coming" && !hasValidShowtimes(movie) ? (
                    <button
                      type="button"
                      className="buy-ticket-btn disabled-btn"
                      disabled
                    >
                      🎟️ HẾT SUẤT CHIẾU
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
                      🎟️ MUA VÉ
                    </button>
                  )}
                </div>
              );
            })}
        </section>
      </main>

      {selectedTrailer && (
        <div className="trailer-overlay">
          <div className="trailer-modal">
            <button
              type="button"
              className="trailer-close"
              onClick={closeTrailer}
            >
              ×
            </button>

            <h2>
              TRAILER - {getMovieTitle(selectedTrailer)}
            </h2>

            <hr />

            {getMovieTrailer(selectedTrailer) ? (
              <iframe
                src={getMovieTrailer(selectedTrailer)}
                title={`Trailer ${getMovieTitle(
                  selectedTrailer
                )}`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <p>Phim này chưa có trailer.</p>
            )}
          </div>
        </div>
      )}

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
    </div>
  );
}

export default Movies;