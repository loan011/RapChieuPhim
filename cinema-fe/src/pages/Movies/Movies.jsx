import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import "../../styles/Movies.css";
import CustomerProfileDropdown from "../../components/CustomerProfileDropdown";

import { MOVIE_TABS, getMoviesByTab } from "./Movies.js";

import doraemonImg from "../../img/doraemon.jpg";
import kumanImg from "../../img/KUMANTHONG.jpg";
import templeImg from "../../img/ngoidenkiquai5.jpg";
import ocImg from "../../img/ocmuonhon.jpg";
import maxoiImg from "../../img/maxoi.jpg";
import cushinImg from "../../img/cushin.jpg";

const fallbackMovieData = {
  now: [
    {
      id: 1,
      title:
        "Phim Điện Ảnh Doraemon: Nobita Và Lâu Đài Dưới Đáy Biển - Phiên Bản Mới",
      img: doraemonImg,
      age: "P",
      tag: "HOT",
      genre: "Hoạt hình",
      duration: "101 phút",
      trailer: "https://www.youtube.com/embed/OFNUhDb-FDo?autoplay=1",
    },
    {
      id: 2,
      title: "Ngôi Đền Kỳ Quái 5",
      img: templeImg,
      age: "16+",
      tag: "HOT",
      genre: "Kinh dị, Hài hước",
      duration: "118 phút",
      trailer: "https://www.youtube.com/embed/lEJcARUiApo?autoplay=1",
    },
    {
      id: 3,
      title: "Kumanthong: Ác Quỷ Dẫn Đường",
      img: kumanImg,
      age: "18+",
      tag: "HOT",
      genre: "Kinh dị",
      duration: "110 phút",
      trailer: "https://www.youtube.com/embed/wQA8c-v5daM?autoplay=1",
    },
    {
      id: 4,
      title: "Ốc Mượn Hồn",
      img: ocImg,
      age: "16+",
      tag: "HOT",
      genre: "Bí ẩn, Tâm lý",
      duration: "109 phút",
      trailer: "https://www.youtube.com/embed/89AseidRuPc?autoplay=1",
    },
  ],

  coming: [
    {
      id: 5,
      title: "Ma Xó",
      img: maxoiImg,
      age: "18+",
      tag: "SOON",
      genre: "Kinh dị",
      duration: "102 phút",
      trailer: "https://www.youtube.com/embed/UE6Qo-uPCjQ?autoplay=1",
    },
    {
      id: 6,
      title:
        "Phim Shin - Cậu Bé Bút Chì: Quậy Tung! Vương Quốc Nghuệch Ngoạc Và 4 Dũng Sĩ Bất Ổn",
      img: cushinImg,
      age: "P",
      tag: "SOON",
      genre: "Hoạt hình, Gia đình",
      duration: "104 phút",
      trailer: "https://www.youtube.com/embed/KyyoTlt5VJo?autoplay=1",
    },
  ],

  special: [
    {
      id: 7,
      title: "Doraemon - Suất chiếu đặc biệt",
      img: doraemonImg,
      age: "P",
      tag: "SPECIAL",
      genre: "Hoạt hình",
      duration: "101 phút",
      trailer: "https://www.youtube.com/embed/OFNUhDb-FDo?autoplay=1",
    },
    {
      id: 8,
      title: "Ốc Mượn Hồn - Suất chiếu đặc biệt",
      img: ocImg,
      age: "16+",
      tag: "SPECIAL",
      genre: "Bí ẩn, Tâm lý",
      duration: "109 phút",
      trailer: "https://www.youtube.com/embed/89AseidRuPc?autoplay=1",
    },
  ],
};

function Movies() {
  const [activeTab, setActiveTab] = useState("now");
  const [movies, setMovies] = useState(fallbackMovieData.now);
  const [selectedTrailer, setSelectedTrailer] = useState(null);
  const [loading, setLoading] = useState(false);

  const savedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const userEmail =
    localStorage.getItem("userEmail") ||
    localStorage.getItem("email") ||
    savedUser.email ||
    savedUser.Email;

  useEffect(() => {
    fetchMoviesByTab(activeTab);
  }, [activeTab]);

  async function fetchMoviesByTab(tabKey) {
    try {
      setLoading(true);

      const apiMovies = await getMoviesByTab(tabKey);

      setMovies(apiMovies);
    } catch (error) {
      console.error("Lỗi tải phim:", error);
      setMovies(fallbackMovieData[tabKey] || []);
    } finally {
      setLoading(false);
    }
  }

  function changeTab(tabName) {
    setActiveTab(tabName);
    setSelectedTrailer(null);
  }

  function getMovieTitle(movie) {
    return movie.title || movie.name || movie.movieName || "Chưa có tên phim";
  }

  function getMovieImage(movie) {
    return (
      movie.img ||
      movie.image ||
      movie.imageUrl ||
      movie.poster ||
      movie.posterUrl ||
      "/images/no-image.png"
    );
  }

  function getMovieAge(movie) {
    return movie.age || movie.ageRating || movie.rated || "P";
  }

  function getMovieTag(movie) {
    const currentTab = MOVIE_TABS.find((tab) => tab.key === activeTab);
    return movie.tag || currentTab?.tag || "HOT";
  }

  function getMovieGenre(movie) {
    return (
      movie.genre ||
      movie.categoryName ||
      movie.category ||
      movie.movieCategory ||
      "Đang cập nhật"
    );
  }

  function getMovieDuration(movie) {
    if (movie.duration) return movie.duration;
    if (movie.durationMinutes) return `${movie.durationMinutes} phút`;
    if (movie.runningTime) return `${movie.runningTime} phút`;

    return "Đang cập nhật";
  }

  function getMovieTrailer(movie) {
    return movie.trailer || movie.trailerUrl || movie.videoUrl || "";
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
              <div className="movie-card-page" key={movie.id || index}>
                <div
                  className="movie-poster"
                  onClick={() => setSelectedTrailer(movie)}
                >
                  <img src={getMovieImage(movie)} alt={getMovieTitle(movie)} />

                  <span className="movie-age">{getMovieAge(movie)}</span>
                  <span className="hot-ribbon">{getMovieTag(movie)}</span>

                  <button
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