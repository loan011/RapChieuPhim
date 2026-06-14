import { useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/Movies.css";
import CustomerProfileDropdown from "../../components/CustomerProfileDropdown";

import doraemonImg from "../../img/doraemon.jpg";
import kumanImg from "../../img/KUMANTHONG.jpg";
import templeImg from "../../img/ngoidenkiquai5.jpg";
import ocImg from "../../img/ocmuonhon.jpg";
import maxoiImg from "../../img/maxoi.jpg";
import cushinImg from "../../img/cushin.jpg";

const movieData = {
  now: [
    {
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
      title: "Ngôi Đền Kỳ Quái 5",
      img: templeImg,
      age: "16+",
      tag: "HOT",
      genre: "Kinh dị, Hài hước",
      duration: "118 phút",
      trailer: "https://www.youtube.com/embed/lEJcARUiApo?autoplay=1",
    },
    {
      title: "Kumanthong: Ác Quỷ Dẫn Đường",
      img: kumanImg,
      age: "18+",
      tag: "HOT",
      genre: "Kinh dị",
      duration: "110 phút",
      trailer: "https://www.youtube.com/embed/wQA8c-v5daM?autoplay=1",
    },
    {
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
      title: "Ma Xó",
      img: maxoiImg,
      age: "18+",
      tag: "SOON",
      genre: "Kinh dị",
      duration: "102 phút",
      trailer: "https://www.youtube.com/embed/UE6Qo-uPCjQ?autoplay=1",
    },
    {
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
      title: "Doraemon - Suất chiếu đặc biệt",
      img: doraemonImg,
      age: "P",
      tag: "SPECIAL",
      genre: "Hoạt hình",
      duration: "101 phút",
      trailer: "https://www.youtube.com/embed/OFNUhDb-FDo?autoplay=1",
    },
    {
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
  const [selectedTrailer, setSelectedTrailer] = useState(null);
  const savedUser = JSON.parse(localStorage.getItem("user") || "{}");

const userEmail =
  localStorage.getItem("userEmail") ||
  localStorage.getItem("email") ||
  savedUser.email ||
  savedUser.Email;
  const movies = movieData[activeTab];

  function changeTab(tabName) {
    setActiveTab(tabName);
    setSelectedTrailer(null);
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
          <Link to="/">LỊCH CHIẾU THEO RẠP</Link>

          <Link className="active" to="/movies">
            PHIM
          </Link>

          <a>RẠP</a>
          <Link to="/ticket-price">GIÁ VÉ</Link>
          <a>TIN MỚI VÀ ƯU ĐÃI</a>
          <a>NHƯỢNG QUYỀN</a>
          <a>THÀNH VIÊN</a>
        </nav>
      </header>

      <main className="movies-content">
        <div className="movie-tabs">
          <button
            className={activeTab === "coming" ? "active" : ""}
            onClick={() => changeTab("coming")}
          >
            PHIM SẮP CHIẾU
          </button>

          <button
            className={activeTab === "now" ? "active" : ""}
            onClick={() => changeTab("now")}
          >
            PHIM ĐANG CHIẾU
          </button>

          <button
            className={activeTab === "special" ? "active" : ""}
            onClick={() => changeTab("special")}
          >
            SUẤT CHIẾU ĐẶC BIỆT
          </button>
        </div>

        <section className="movie-grid">
          {movies.map((movie, index) => (
            <div className="movie-card-page" key={index}>
              <div
                className="movie-poster"
                onClick={() => setSelectedTrailer(movie)}
              >
                <img src={movie.img} alt={movie.title} />

                <span className="movie-age">{movie.age}</span>
                <span className="hot-ribbon">{movie.tag}</span>

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

              <h2>{movie.title}</h2>

              <p>
                <b>Thể loại:</b> {movie.genre}
              </p>

              <p>
                <b>Thời lượng:</b> {movie.duration}
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

            <h2>TRAILER - {selectedTrailer.title}</h2>

            <hr />

            <iframe
              src={selectedTrailer.trailer}
              title={`Trailer ${selectedTrailer.title}`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
}

export default Movies;