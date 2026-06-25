import { Link } from "react-router-dom";

import "../../styles/Movies.css";
import CustomerProfileDropdown from "../../components/CustomerProfileDropdown";

import {
  MOVIES_TEXT as T,
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
  } = useMovies();

  return (
    <div className="movies-page">
      {userEmail ? (
        <div className="movie-top-login">
          <CustomerProfileDropdown />
        </div>
      ) : (
        <div className="movie-top-login">
          <Link to={T.routes.login}>{T.auth.login}</Link>
          <span> | </span>
          <Link to={T.routes.register}>{T.auth.register}</Link>
          <span> {T.auth.language}</span>
        </div>
      )}

      <header className="movie-header">
        <div className="movie-logo">
          <span>{T.logo.main}</span>
          <b>{T.logo.sub}</b>
        </div>

        <select
          className="movie-select"
          value={selectedAreaId}
          onChange={(e) => handleAreaChange(e.target.value)}
        >
          <option value="">{T.select.areaPlaceholder}</option>

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
          <Link className="active" to={T.routes.movies}>
            {T.nav.movies}
          </Link>
          <Link to={T.routes.home}>{T.nav.showtimesByCinema}</Link>
          <Link to={T.routes.cinema}>{T.nav.cinema}</Link>
          <Link to={T.routes.ticketPrice}>{T.nav.ticketPrice}</Link>
          <a href={T.anchors.news}>{T.nav.news}</a>
          <a href={T.anchors.franchise}>{T.nav.franchise}</a>
          <a href={T.anchors.member}>{T.nav.member}</a>
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

        {loading && <p className="movie-loading">{T.loading.movies}</p>}

        {!loading && movies.length === 0 && (
          <p className="movie-loading">{T.empty.noMovies}</p>
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
                        e.currentTarget.src = T.fallback.poster;
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
                      {T.buttons.play}
                    </button>
                  </div>

                  <h2>{getMovieTitle(movie)}</h2>

                  <p>
                    <b>{T.movieInfo.genre}</b> {getMovieGenre(movie)}
                  </p>

                  <p>
                    <b>{T.movieInfo.duration}</b> {getMovieDuration(movie)}
                  </p>

                  <p>
                    <b>{T.movieInfo.releaseDate}</b>{" "}
                    {getMovieReleaseDate(movie)}
                  </p>

                  <p>
                    <b>{T.movieInfo.status}</b>{" "}
                    {getMovieStatus(movie, activeTab)}
                  </p>

                  <Link
                    to={getBookingLink(movie)}
                    className="buy-ticket-btn"
                  >
                    {T.buttons.buyTicket}
                  </Link>
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
              {T.trailer.close}
            </button>

            <h2>
              {T.trailer.heading} - {getMovieTitle(selectedTrailer)}
            </h2>

            <hr />

            {getMovieTrailer(selectedTrailer) ? (
              <iframe
                src={getMovieTrailer(selectedTrailer)}
                title={`${T.trailer.titlePrefix} ${getMovieTitle(
                  selectedTrailer
                )}`}
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

export default Movies;