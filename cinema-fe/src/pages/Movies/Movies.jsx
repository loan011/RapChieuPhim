import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import "../../styles/Movies.css";
import CustomerProfileDropdown from "../../components/CustomerProfileDropdown";

import {
  MOVIE_TABS,
  getMoviesByTab,
  getMovieCategories,
} from "./Movies.js";

function Movies() {
  const [activeTab, setActiveTab] = useState("now");
  const [movies, setMovies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTrailer, setSelectedTrailer] = useState(null);
  const [loading, setLoading] = useState(false);

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
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchMoviesByTab(activeTab);
  }, [activeTab]);

  async function fetchCategories() {
    try {
      const apiCategories = await getMovieCategories();

      console.log("Danh sách thể loại từ API:", apiCategories);

      setCategories(Array.isArray(apiCategories) ? apiCategories : []);
    } catch (error) {
      console.error("Lỗi tải thể loại:", error);
      setCategories([]);
    }
  }

  async function fetchMoviesByTab(tabKey) {
    try {
      setLoading(true);

      const apiMovies = await getMoviesByTab(tabKey);

      console.log("Danh sách phim từ API:", apiMovies);
      console.log("Phim đầu tiên:", apiMovies?.[0]);

      setMovies(Array.isArray(apiMovies) ? apiMovies : []);
    } catch (error) {
      console.error("Lỗi tải phim:", error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }

  function changeTab(tabName) {
    setActiveTab(tabName);
    setSelectedTrailer(null);
  }

  function getMovieTitle(movie) {
    return (
      movie.title ||
      movie.Title ||
      movie.name ||
      movie.Name ||
      movie.movieName ||
      movie.MovieName ||
      movie.movieTitle ||
      movie.MovieTitle ||
      "Chưa có tên phim"
    );
  }

  function getMovieImage(movie) {
    const image =
      movie.posterUrl ||
      movie.PosterUrl ||
      movie.posterURL ||
      movie.PosterURL ||
      movie.img ||
      movie.Img ||
      movie.image ||
      movie.Image ||
      movie.imageUrl ||
      movie.ImageUrl ||
      movie.poster ||
      movie.Poster ||
      "";

    if (!image) return "/img/no-image.png";

    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    if (image.startsWith("/")) {
      return image;
    }

    return `/img/${image}`;
  }

  function getMovieAge(movie) {
    return (
      movie.ageRating ||
      movie.AgeRating ||
      movie.age ||
      movie.Age ||
      movie.rated ||
      movie.Rated ||
      movie.rating ||
      movie.Rating ||
      "P"
    );
  }

  function getMovieTag(movie) {
    const currentTab = MOVIE_TABS.find((tab) => tab.key === activeTab);

    return movie.tag || movie.Tag || currentTab?.tag || "HOT";
  }

  function getMovieStatus(movie) {
    const currentTab = MOVIE_TABS.find((tab) => tab.key === activeTab);

    return (
      movie.status ||
      movie.Status ||
      movie.movieStatus ||
      movie.MovieStatus ||
      movie.showingStatus ||
      movie.ShowingStatus ||
      movie.statusName ||
      movie.StatusName ||
      currentTab?.status ||
      "Đang cập nhật"
    );
  }

  function getCategoryName(category) {
    return (
      category?.categoryName ||
      category?.CategoryName ||
      category?.name ||
      category?.Name ||
      category?.title ||
      category?.Title ||
      category?.description ||
      category?.Description ||
      ""
    );
  }

  function getCategoryId(category) {
    return (
      category?.categoryId ||
      category?.CategoryId ||
      category?.id ||
      category?.Id ||
      category?.movieCategoryId ||
      category?.MovieCategoryId
    );
  }

  function getMovieGenre(movie) {
    const categoryArray =
      Array.isArray(movie.categories) && movie.categories.length > 0
        ? movie.categories
        : Array.isArray(movie.Categories) && movie.Categories.length > 0
        ? movie.Categories
        : Array.isArray(movie.movieCategories) &&
          movie.movieCategories.length > 0
        ? movie.movieCategories
        : Array.isArray(movie.MovieCategories) &&
          movie.MovieCategories.length > 0
        ? movie.MovieCategories
        : Array.isArray(movie.categoryList) && movie.categoryList.length > 0
        ? movie.categoryList
        : [];

    if (categoryArray.length > 0) {
      const categoryText = categoryArray
        .map((item) => {
          return (
            getCategoryName(item) ||
            getCategoryName(item.category) ||
            getCategoryName(item.Category) ||
            getCategoryName(item.movieCategory) ||
            getCategoryName(item.MovieCategory)
          );
        })
        .filter(Boolean)
        .join(", ");

      if (categoryText) return categoryText;
    }

    if (movie.movieCategory && typeof movie.movieCategory === "object") {
      const categoryName = getCategoryName(movie.movieCategory);
      if (categoryName) return categoryName;
    }

    if (movie.MovieCategory && typeof movie.MovieCategory === "object") {
      const categoryName = getCategoryName(movie.MovieCategory);
      if (categoryName) return categoryName;
    }

    if (movie.category && typeof movie.category === "object") {
      const categoryName = getCategoryName(movie.category);
      if (categoryName) return categoryName;
    }

    if (movie.Category && typeof movie.Category === "object") {
      const categoryName = getCategoryName(movie.Category);
      if (categoryName) return categoryName;
    }

    const categoryId =
      movie.categoryId ||
      movie.CategoryId ||
      movie.movieCategoryId ||
      movie.MovieCategoryId;

    if (categoryId) {
      const foundCategory = categories.find((category) => {
        return String(getCategoryId(category)) === String(categoryId);
      });

      const categoryName = getCategoryName(foundCategory);

      if (categoryName) return categoryName;
    }

    const directCategory =
      movie.categoryName ||
      movie.CategoryName ||
      movie.genre ||
      movie.Genre;

    if (directCategory) {
      return directCategory;
    }

    const description = movie.description || movie.Description || "";

    if (description && Array.isArray(categories)) {
      const lowerDescription = description.toLowerCase();

      const foundByDescription = categories.find((category) => {
        const categoryName = getCategoryName(category).toLowerCase();

        return categoryName && lowerDescription.includes(categoryName);
      });

      const categoryName = getCategoryName(foundByDescription);

      if (categoryName) return categoryName;
    }

    return "Đang cập nhật";
  }

  function getMovieDuration(movie) {
    const duration =
      movie.duration ||
      movie.Duration ||
      movie.durationMinutes ||
      movie.DurationMinutes ||
      movie.runningTime ||
      movie.RunningTime;

    if (duration && typeof duration === "string") {
      if (duration.toLowerCase().includes("phút")) {
        return duration;
      }

      return `${duration} phút`;
    }

    if (duration && typeof duration === "number") {
      return `${duration} phút`;
    }

    return "Đang cập nhật";
  }

  function formatDate(dateValue) {
    if (!dateValue) return "Đang cập nhật";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Đang cập nhật";
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  function getMovieReleaseDate(movie) {
    return formatDate(
      movie.releaseDate ||
        movie.ReleaseDate ||
        movie.release_date ||
        movie.startDate ||
        movie.StartDate ||
        movie.openingDate ||
        movie.OpeningDate ||
        movie.premiereDate ||
        movie.PremiereDate
    );
  }

  function convertYoutubeToEmbed(url) {
    if (!url) return "";

    if (url.includes("youtube.com/embed/")) {
      return url;
    }

    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("watch?v=")[1]?.split("&")[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }

    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }

    return url;
  }

  function getMovieTrailer(movie) {
    const trailer =
      movie.trailerUrl ||
      movie.TrailerUrl ||
      movie.trailerURL ||
      movie.TrailerURL ||
      movie.trailer ||
      movie.Trailer ||
      movie.videoUrl ||
      movie.VideoUrl ||
      "";

    return convertYoutubeToEmbed(trailer);
  }

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

        <select className="movie-select">
          <option>Chọn rạp HCM</option>
          <option>CGV Vincom Đồng Khởi</option>
          <option>Galaxy Nguyễn Du</option>
          <option>Beta Cinemas TP.HCM</option>
        </select>

        <nav>
          <Link className="active" to="/movies">
            PHIM
          </Link>
          <Link to="/">LỊCH CHIẾU THEO RẠP</Link>
          <a href="#rap">RẠP</a>
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
            movies.map((movie, index) => (
              <div
                className="movie-card-style"
                key={movie.movieId || movie.MovieId || movie.id || index}
              >
                <div
                  className="movie-poster-style"
                  onClick={() => setSelectedTrailer(movie)}
                >
                  <img
                    src={getMovieImage(movie)}
                    alt={getMovieTitle(movie)}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/img/no-image.png";
                    }}
                  />

                  <span className="movie-age-style">{getMovieAge(movie)}</span>

                  <span className="movie-tag-style">{getMovieTag(movie)}</span>

                  <button
                    type="button"
                    className="play-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTrailer(movie);
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
                  <b>Khởi chiếu:</b> {getMovieReleaseDate(movie)}
                </p>

                <p>
                  <b>Trạng thái:</b> {getMovieStatus(movie)}
                </p>

                <Link to="/" className="buy-ticket-btn">
                  🎟️ MUA VÉ
                </Link>
              </div>
            ))}
        </section>
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

export default Movies;