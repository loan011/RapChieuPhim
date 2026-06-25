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
  getMovieSubtitles,
  getMovieReleaseDate,
  getMoviePoster,
  getMovieTrailer,

  getShowtimeId,
  getStartHour,
  getShowtimeStatus,
  isBookable,
} from "./home.js";

function Home() {
  const {
    dates,
    startDate,
    selectedDate,
    selectedCinemaId,
    selectedAreaId,

    areas,
    filteredCinemas,
    groupedMovies,
    hasMovies,
    showDetail,
    selectedTrailer,
    loading,
    userEmail,
    selectedMessage,

    changeDateRange,
    handleDateClick,
    handleAreaChange,
    handleCinemaChange,
    toggleDetail,
    handleOpenTrailer,
    handleCloseTrailer,
    handleSelectTime,
    handleBuyTicket,
    isPreviousDateDisabled,
  } = useHome();

  return (
    <div className="beta-page">
      {userEmail ? (
        <div className="top-login">
          <CustomerProfileDropdown />
        </div>
      ) : (
        <div className="top-login">
          <Link to={T.routes.login}>{T.auth.login}</Link>
          <span> | </span>
          <Link to={T.routes.register}>{T.auth.register}</Link>
          <span> {T.auth.language}</span>
        </div>
      )}

      <header className="beta-header">
        <div className="logo">
          <span>{T.logo}</span>
        </div>

        <select
          className="cinema-select"
          style={{ marginRight: "10px" }}
          value={selectedAreaId}
          onChange={(e) => handleAreaChange(e.target.value)}
        >
          <option value="">{T.select.allAreas}</option>

          {areas.map((area) => {
            const id = getAreaId(area);
            const name = getAreaName(area);

            return (
              <option key={id} value={String(id)}>
                {name}
              </option>
            );
          })}
        </select>

        <select
          className="cinema-select"
          value={selectedCinemaId}
          onChange={(e) => handleCinemaChange(e.target.value)}
        >
          <option value="">{T.select.allCinemas}</option>

          {filteredCinemas.map((cinema) => {
            const id = getCinemaId(cinema);

            return (
              <option key={id} value={String(id)}>
                {getCinemaName(cinema)}
              </option>
            );
          })}
        </select>

        <nav>
          <Link to={T.routes.movies}>{T.nav.movies}</Link>
          <Link to={T.routes.home}>{T.nav.showtimesByCinema}</Link>
          <Link to={T.routes.cinema}>{T.nav.cinema}</Link>
          <Link to={T.routes.ticketPrice}>{T.nav.ticketPrice}</Link>
          <a href={T.anchors.news}>{T.nav.news}</a>
          <a href={T.anchors.franchise}>{T.nav.franchise}</a>
          <a href={T.anchors.member}>{T.nav.member}</a>
        </nav>
      </header>

      <main className="content">
        <section className="calendar-wrapper">
          <button
            type="button"
            className="calendar-arrow"
            onClick={() => changeDateRange(-8)}
            disabled={isPreviousDateDisabled(startDate)}
          >
            {T.calendar.previous}
          </button>

          <div className="date-list">
            {dates.map((date) => (
              <div
                key={date.iso}
                className={
                  selectedDate === date.iso
                    ? "date active-date"
                    : "date"
                }
                onClick={() => handleDateClick(date.iso)}
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
            {T.calendar.next}
          </button>
        </section>

        <hr />

        {loading && (
          <p className="selected-text">{T.loading.showtimes}</p>
        )}

        {!loading && hasMovies && (
          <>
            <div className="note">
              <span></span>
              {selectedMessage}
            </div>

            {groupedMovies.map(({ movie, showtimes: movieShowtimes }) => {
              const movieId = getMovieId(movie);
              const trailer = getMovieTrailer(movie);
              const subtitles = getMovieSubtitles(movie);

              return (
                <section className="movie-section" key={movieId}>
                  <div
                    className={`poster-wrap ${
                      trailer ? "video-wrap" : ""
                    }`}
                  >
                    {trailer ? (
                      <iframe
                        src={trailer}
                        title={`${T.trailer.titlePrefix} ${getMovieTitle(movie)}`}
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <img
                        src={getMoviePoster(movie)}
                        alt={getMovieTitle(movie)}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = T.fallback.poster;
                        }}
                      />
                    )}
                  </div>

                  <div className="movie-info">
                    <h1 className="movie-title">
                      {getMovieTitle(movie)}
                    </h1>

                    <p className="meta">
                      🏷️ {subtitles} &nbsp; ⏱️ {getMovieDuration(movie)}
                    </p>

                    <div className="movie-action-ribbon">
                      <div className="action-buttons-left">
                        <button
                          type="button"
                          onClick={() => toggleDetail(movieId)}
                        >
                          🎟️{" "}
                          {showDetail[movieId]
                            ? T.buttons.hideDetail
                            : T.buttons.detail}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenTrailer(movie)}
                        >
                          {T.buttons.trailer}
                        </button>
                      </div>

                      <button
                        type="button"
                        className="buy-ticket-btn"
                        onClick={() => handleBuyTicket(movie, movieShowtimes)}
                      >
                        {T.buttons.buyTicket}
                      </button>
                    </div>

                    {showDetail[movieId] && (
                      <div className="movie-detail-box">
                        <h2>{getMovieTitle(movie)}</h2>

                        <p>{getMovieDescription(movie)}</p>

                        <div className="detail-row">
                          <b>{T.detail.director}</b>
                          <span>{getMovieDirector(movie)}</span>
                        </div>

                        <div className="detail-row">
                          <b>{T.detail.actors}</b>
                          <span>{getMovieActors(movie)}</span>
                        </div>

                        <div className="detail-row">
                          <b>{T.detail.duration}</b>
                          <span>{getMovieDuration(movie)}</span>
                        </div>

                        <div className="detail-row">
                          <b>{T.detail.language}</b>
                          <span>{getMovieLanguage(movie)}</span>
                        </div>

                        <div className="detail-row">
                          <b>{T.detail.subtitles}</b>
                          <span>{subtitles}</span>
                        </div>

                        <div className="detail-row">
                          <b>{T.detail.releaseDate}</b>
                          <span>{getMovieReleaseDate(movie)}</span>
                        </div>
                      </div>
                    )}

                    <h3>
                      {String(subtitles).toUpperCase().includes("LỒNG TIẾNG")
                        ? T.movieFormat.dubbed
                        : T.movieFormat.subtitled}
                    </h3>

                    <div className="time-list">
                      {movieShowtimes.map((showtime) => {
                        const status = getShowtimeStatus(showtime);
                        const startHour = getStartHour(showtime);
                        const showtimeId = getShowtimeId(showtime);
                        const disabled = !isBookable(status);

                        return (
                          <button
                            key={showtimeId}
                            type="button"
                            className={`time-btn ${
                              startHour >= "22:00" ? "late" : ""
                            }`}
                            disabled={disabled}
                            onClick={() => handleSelectTime(movie, showtime)}
                          >
                            {startHour}
                          </button>
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
          <p className="selected-text">
            {T.empty.noShowtimes}
          </p>
        )}
      </main>

      {selectedTrailer && (
        <div className="trailer-overlay">
          <div className="trailer-modal">
            <button
              type="button"
              className="trailer-close"
              onClick={handleCloseTrailer}
            >
              {T.trailer.close}
            </button>

            <h2>
              {T.trailer.heading} - {getMovieTitle(selectedTrailer)}
            </h2>

            <hr />

            {getMovieTrailer(selectedTrailer) ? (
              <iframe
                src={getMovieTrailer(selectedTrailer)}
                title={`${T.trailer.titlePrefix} ${getMovieTitle(selectedTrailer)}`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <p>{T.trailer.noTrailer}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;