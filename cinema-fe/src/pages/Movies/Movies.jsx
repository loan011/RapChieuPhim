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

                  <Link
                    to={getBookingLink(movie)}
                    className="buy-ticket-btn"
                  >
                    🎟️ MUA VÉ
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
    </div>
  );
}

export default Movies;