import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import CustomerProfileDropdown from "../components/CustomerProfileDropdown";
import "../styles/Home.css";

import {
  createDateRange,
  toISODate,

  getHomeMovies,
  getHomeShowtimes,
  getHomeRooms,
  getHomeCinemas,

  getCinemaId,
  getCinemaName,

  getMovieId,
  getMovieTitle,
  getMovieDescription,
  getMovieDuration,
  getMovieDirector,
  getMovieActors,
  getMovieLanguage,
  getMovieSubtitles,
  getMovieReleaseDate,
  getMoviePoster,
  getMovieTrailer,

  getRoomName,
  getRoomTotalSeats,

  getShowtimeId,
  getStartHour,
  getEndHour,
  getBasePrice,
  getShowtimeStatus,
  isBookable,

  findRoomByShowtime,
  filterShowtimesByCinemaAndDate,
  groupShowtimesByMovie,
} from "./home";

function Home() {
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));

  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [cinemas, setCinemas] = useState([]);

  const [selectedCinemaId, setSelectedCinemaId] = useState("");
  const [showDetail, setShowDetail] = useState({});
  const [selectedTrailer, setSelectedTrailer] = useState(null);
  const [loading, setLoading] = useState(true);

  const dates = createDateRange(startDate);

  function getSavedUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }

  const savedUser = getSavedUser();

  const userEmail =
    localStorage.getItem("userEmail") ||
    localStorage.getItem("email") ||
    savedUser.email ||
    savedUser.Email;

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      const [movieData, showtimeData, roomData, cinemaData] =
        await Promise.all([
          getHomeMovies(),
          getHomeShowtimes(),
          getHomeRooms(),
          getHomeCinemas(),
        ]);

      console.log("HOME MOVIES:", movieData);
      console.log("HOME SHOWTIMES:", showtimeData);
      console.log("HOME ROOMS:", roomData);
      console.log("HOME CINEMAS:", cinemaData);

      setMovies(movieData);
      setShowtimes(showtimeData);
      setRooms(roomData);
      setCinemas(cinemaData);

      if (cinemaData.length > 0) {
        const firstCinemaId = getCinemaId(cinemaData[0]);
        setSelectedCinemaId(String(firstCinemaId));
      }
    } catch (error) {
      console.error("Lỗi tải lịch chiếu:", error);

      setMovies([]);
      setShowtimes([]);
      setRooms([]);
      setCinemas([]);
    } finally {
      setLoading(false);
    }
  }

  function resetSelection() {
    setShowDetail({});
    setSelectedTrailer(null);
  }

  function changeDateRange(days) {
    const nextStart = new Date(startDate);
    nextStart.setDate(nextStart.getDate() + days);

    setStartDate(nextStart);
    setSelectedDate(toISODate(nextStart));
    resetSelection();
  }

  function toggleDetail(movieId) {
    setShowDetail((prev) => ({
      ...prev,
      [movieId]: !prev[movieId],
    }));
  }

  function handleSelectTime(movie, showtime) {
    const movieId = getMovieId(movie);
    const showtimeId = getShowtimeId(showtime);
    const time = getStartHour(showtime);

    navigate(`/booking?movie=${movieId}&showtimeId=${showtimeId}&time=${time}`);
  }

  function formatMoney(value) {
    const number = Number(value);

    if (Number.isNaN(number)) return "0 đ";

    return `${number.toLocaleString("vi-VN")} đ`;
  }

  const filteredShowtimes = filterShowtimesByCinemaAndDate({
    showtimes,
    rooms,
    selectedDate,
    selectedCinemaId,
  });

  const groupedMovies = groupShowtimesByMovie({
    movies,
    showtimes: filteredShowtimes,
  });

  const hasMovies = groupedMovies.length > 0;

  const selectedCinema = cinemas.find(
    (cinema) => String(getCinemaId(cinema)) === String(selectedCinemaId)
  );

  const selectedMessage = selectedCinema
    ? `Lịch chiếu tại ${getCinemaName(selectedCinema)}`
    : "Lịch chiếu theo rạp";

  return (
    <div className="beta-page">
      {userEmail ? (
        <div className="top-login">
          <CustomerProfileDropdown />
        </div>
      ) : (
        <div className="top-login">
          <Link to="/login">Đăng nhập</Link>
          <span> | </span>
          <Link to="/register">Đăng ký</Link>
          <span> GB</span>
        </div>
      )}

      <header className="beta-header">
        <div className="logo">
          <span>Cinemas HCM</span>
        </div>

        <select
          className="cinema-select"
          value={selectedCinemaId}
          onChange={(e) => {
            setSelectedCinemaId(e.target.value);
            resetSelection();
          }}
        >
          <option value="">Tất cả rạp HCM</option>

          {cinemas.map((cinema) => {
            const id = getCinemaId(cinema);

            return (
              <option key={id} value={String(id)}>
                {getCinemaName(cinema)}
              </option>
            );
          })}
        </select>

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

      <main className="content">
        <section className="calendar-wrapper">
          <button
            type="button"
            className="calendar-arrow"
            onClick={() => changeDateRange(-8)}
          >
            ‹
          </button>

          <div className="date-list">
            {dates.map((date) => (
              <div
                className={selectedDate === date.iso ? "date active-date" : "date"}
                key={date.iso}
                onClick={() => {
                  setSelectedDate(date.iso);
                  resetSelection();
                }}
              >
                <strong>{date.day}</strong>
                <span>
                  /{date.month} - {date.weekDay}
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="calendar-arrow"
            onClick={() => changeDateRange(8)}
          >
            ›
          </button>
        </section>

        <hr />

        {loading && <p className="selected-text">Đang tải lịch chiếu...</p>}

        {!loading && hasMovies && (
          <>
            <div className="note">
              <span></span>
              {selectedMessage}
            </div>

            {groupedMovies.map(({ movie, showtimes: movieShowtimes }) => {
              const movieId = getMovieId(movie);
              const trailer = getMovieTrailer(movie);

              return (
                <section className="movie-section" key={movieId}>
                  <div className="poster-wrap">
                    <img
                      src={getMoviePoster(movie)}
                      alt={getMovieTitle(movie)}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/img/no-image.png";
                      }}
                    />
                  </div>

                  <div className="movie-info">
                    <h1 className="movie-title">{getMovieTitle(movie)}</h1>

                    <p className="meta">
                      🏷 {getMovieSubtitles(movie)} &nbsp; ⏱{" "}
                      {getMovieDuration(movie)}
                    </p>

                    <div className="movie-action-ribbon">
                      <button
                        type="button"
                        onClick={() => toggleDetail(movieId)}
                      >
                        🎟 {showDetail[movieId] ? "Ẩn chi tiết" : "Chi tiết"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedTrailer(movie)}
                      >
                        Trailer
                      </button>

                      <Link
                        to={`/booking?movie=${movieId}`}
                        className="movie-action-btn buy-ticket"
                      >
                        Mua vé
                      </Link>
                    </div>

                    {showDetail[movieId] && (
                      <div className="movie-detail-box">
                        <h2>{getMovieTitle(movie)}</h2>

                        <p>{getMovieDescription(movie)}</p>

                        <div className="detail-row">
                          <b>Đạo diễn:</b>
                          <span>{getMovieDirector(movie)}</span>
                        </div>

                        <div className="detail-row">
                          <b>Diễn viên:</b>
                          <span>{getMovieActors(movie)}</span>
                        </div>

                        <div className="detail-row">
                          <b>Thời lượng:</b>
                          <span>{getMovieDuration(movie)}</span>
                        </div>

                        <div className="detail-row">
                          <b>Ngôn ngữ:</b>
                          <span>{getMovieLanguage(movie)}</span>
                        </div>

                        <div className="detail-row">
                          <b>Phụ đề:</b>
                          <span>{getMovieSubtitles(movie)}</span>
                        </div>

                        <div className="detail-row">
                          <b>Ngày khởi chiếu:</b>
                          <span>{getMovieReleaseDate(movie)}</span>
                        </div>
                      </div>
                    )}

                    <h3>2D PHỤ ĐỀ / LỒNG TIẾNG</h3>

                    <div className="time-list">
                      {movieShowtimes.map((showtime) => {
                        const status = getShowtimeStatus(showtime);
                        const room = findRoomByShowtime(showtime, rooms);

                        const seats =
                          showtime.availableSeats ??
                          showtime.AvailableSeats ??
                          getRoomTotalSeats(room);

                        const startHour = getStartHour(showtime);
                        const endHour = getEndHour(showtime);
                        const basePrice = getBasePrice(showtime);
                        const showtimeId = getShowtimeId(showtime);
                        const disabled = !isBookable(status);

                        return (
                          <div
                            className={`showtime-card ${startHour >= "22:00" ? "late" : ""} ${disabled ? "disabled" : ""}`}
                            key={showtimeId}
                            onClick={() => !disabled && handleSelectTime(movie, showtime)}
                          >
                            <div className="showtime-left">
                              <div className="time-start">{startHour}</div>
                              <div className="time-range">
                                {endHour ? `${startHour} - ${endHour}` : startHour}
                              </div>
                              <div className="time-room">{getRoomName(room)}</div>
                            </div>
                            <div className="showtime-right">
                              <div className="time-price">{formatMoney(basePrice)}</div>
                              <div className={`time-seats ${seats <= 10 ? "low-seats" : ""}`}>
                                {seats ? `${seats} ghế trống` : "Hết ghế"}
                              </div>
                              <div className="time-status" data-status={status}>{status}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              );
            })}
          </>
        )}

        {!loading && !hasMovies && (
          <p className="selected-text">Ngày này chưa có lịch chiếu phim.</p>
        )}
      </main>

      {selectedTrailer && (
        <div className="trailer-overlay">
          <div className="trailer-modal">
            <button
              type="button"
              className="trailer-close"
              onClick={() => setSelectedTrailer(null)}
            >
              ×
            </button>

            <h2>TRAILER - {getMovieTitle(selectedTrailer)}</h2>

            <hr />

            {getMovieTrailer(selectedTrailer) ? (
              <iframe
                src={getMovieTrailer(selectedTrailer)}
                title={`Trailer ${getMovieTitle(selectedTrailer)}`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <p>Phim này chưa có trailer.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;