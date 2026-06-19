import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import CustomerProfileDropdown from "../components/CustomerProfileDropdown";
import "../styles/Home.css";
import { getCinemaList } from "./Cinema/cinemaPageService";

const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function formatDateVN(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm} - ${dayNames[date.getDay()]}`;
}

function createDateRange(startDate, total = 8) {
  return Array.from({ length: total }, (_, index) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + index);
    return formatDateVN(d);
  });
}

/* =========================
   SHOWTIMES THEO PHIM
========================= */

const showtimesByMovie = {
  doraemon: {
    "02/06 - T3": [
      { time: "14:00", seats: 159 },
      { time: "16:00", seats: 168 },
      { time: "18:00", seats: 167 },
      { time: "19:00", seats: 127 },
      { time: "20:00", seats: 137 },
      { time: "22:00", seats: 170, late: true },
    ],
    "03/06 - T4": [
      { time: "09:00", seats: 131 },
      { time: "11:00", seats: 136 },
      { time: "13:00", seats: 136 },
      { time: "14:00", seats: 170 },
      { time: "16:00", seats: 170 },
      { time: "17:10", seats: 136 },
      { time: "18:00", seats: 170 },
      { time: "19:00", seats: 136 },
      { time: "20:00", seats: 167 },
      { time: "22:00", seats: 170, late: true },
    ],
    "04/06 - T5": [
      { time: "10:00", seats: 150 },
      { time: "13:30", seats: 160 },
      { time: "16:00", seats: 170 },
      { time: "19:00", seats: 140 },
      { time: "22:00", seats: 170, late: true },
    ],
  },

  oc: {
    "03/06 - T4": [
      { time: "08:45", seats: 120 },
      { time: "10:00", seats: 150 },
      { time: "11:00", seats: 130 },
      { time: "15:30", seats: 100 },
      { time: "20:30", seats: 90 },
    ],
    "04/06 - T5": [
      { time: "09:30", seats: 140 },
      { time: "13:00", seats: 120 },
      { time: "16:30", seats: 110 },
      { time: "21:00", seats: 95 },
    ],
  },

  temple: {
    "02/06 - T3": [
      { time: "18:15", seats: 70 },
      { time: "21:00", seats: 134 },
      { time: "23:15", seats: 76, late: true },
    ],
    "03/06 - T4": [
      { time: "09:30", seats: 170 },
      { time: "13:20", seats: 78 },
      { time: "15:00", seats: 136 },
      { time: "18:15", seats: 80 },
      { time: "21:00", seats: 136 },
      { time: "23:10", seats: 136, late: true },
    ],
    "04/06 - T5": [
      { time: "16:45", seats: 80 },
      { time: "22:45", seats: 177, late: true },
    ],
    "05/06 - T6": [
      { time: "18:30", seats: 120 },
      { time: "21:30", seats: 110 },
    ],
    "06/06 - T7": [
      { time: "19:00", seats: 100 },
      { time: "22:00", seats: 90, late: true },
    ],
  },

  kuman: {
    "02/06 - T3": [
      { time: "17:05", seats: 136 },
      { time: "23:00", seats: 130, late: true },
    ],
    "03/06 - T4": [
      { time: "17:05", seats: 136 },
      { time: "23:00", seats: 130, late: true },
    ],
    "04/06 - T5": [
      { time: "17:05", seats: 136 },
      { time: "23:00", seats: 130, late: true },
    ],
    "05/06 - T6": [
      { time: "17:05", seats: 136 },
      { time: "23:00", seats: 130, late: true },
    ],
    "06/06 - T7": [
      { time: "17:05", seats: 136 },
      { time: "23:00", seats: 130, late: true },
    ],
    "07/06 - CN": [
      { time: "17:05", seats: 136 },
      { time: "23:00", seats: 130, late: true },
    ],
    "08/06 - T2": [
      { time: "17:05", seats: 136 },
      { time: "23:00", seats: 130, late: true },
    ],
    "09/06 - T3": [
      { time: "17:05", seats: 136 },
      { time: "23:00", seats: 130, late: true },
    ],
  },

  maxo: {
    "06/06 - T7": [
      { time: "09:30", seats: 170 },
      { time: "10:30", seats: 80 },
      { time: "12:30", seats: 80 },
      { time: "14:00", seats: 170 },
      { time: "16:00", seats: 170 },
      { time: "18:00", seats: 170 },
      { time: "18:45", seats: 136 },
      { time: "20:00", seats: 170 },
      { time: "20:45", seats: 136 },
      { time: "22:00", seats: 170, late: true },
      { time: "22:45", seats: 136, late: true },
    ],
    "07/06 - CN": [
      { time: "09:30", seats: 170 },
      { time: "12:30", seats: 80 },
      { time: "14:00", seats: 170 },
      { time: "16:00", seats: 170 },
      { time: "18:00", seats: 170 },
      { time: "20:00", seats: 170 },
      { time: "22:00", seats: 170, late: true },
    ],
    "08/06 - T2": [
      { time: "10:30", seats: 80 },
      { time: "14:00", seats: 170 },
      { time: "16:00", seats: 170 },
      { time: "18:45", seats: 136 },
      { time: "20:45", seats: 136 },
      { time: "22:45", seats: 136, late: true },
    ],
    "09/06 - T3": [
      { time: "09:30", seats: 170 },
      { time: "12:30", seats: 80 },
      { time: "16:00", seats: 170 },
      { time: "18:00", seats: 170 },
      { time: "20:00", seats: 170 },
      { time: "22:00", seats: 170, late: true },
    ],
  },
};

/* =========================
   DATA PHIM
========================= */

const movies = [
  {
    id: "doraemon",
    sectionClass: "",
    title:
      "Phim Điện Ảnh Doraemon: Nobita Và Lâu Đài Dưới Đáy Biển - Phiên Bản Mới",
    shortName: "Doraemon",
    meta: "🏷 Hoạt hình   ⏱ 101 phút",
    format: "2D LỒNG TIẾNG",
    trailer: "https://www.youtube.com/embed/OFNUhDb-FDo?start=2",
    detailTitle:
      "Phim Điện Ảnh Doraemon: Nobita Và Lâu Đài Dưới Đáy Biển - Phiên Bản Mới",
    description:
      "Trong kỳ nghỉ hè, Nobita và các bạn tranh cãi về việc đi cắm trại ở đâu. Theo ý kiến của Doraemon, họ quyết định cắm trại giữa đại dương. Sử dụng những món đồ bí mật, nhóm bạn tận hưởng chuyến cắm trại dưới đáy biển và gặp gỡ nhiều sinh vật khác nhau.",
    details: [
      ["Đạo diễn:", "Tetsuo Yajima"],
      [
        "Diễn viên:",
        "Wasabi Mizuta, Megumi Oohara, Yumi Kakazu, Subaru Kimura, Tomokazu Seki",
      ],
      ["Thể loại:", "Hoạt hình"],
      ["Thời lượng:", "101 phút"],
      ["Ngôn ngữ:", "Tiếng Việt"],
      ["Ngày khởi chiếu:", "22/05/2026"],
    ],
  },

  {
    id: "oc",
    sectionClass: "oc-section",
    title: "Ốc Mượn Hồn",
    shortName: "Ốc Mượn Hồn",
    meta: "🏷 Bí ẩn, Tâm lý   ⏱ 109 phút",
    format: "2D PHỤ ĐỀ",
    trailer: "https://www.youtube.com/embed/89AseidRuPc",
    detailTitle: "Ốc Mượn Hồn",
    description:
      "Câu chuyện kể về Quân – một người chồng đau khổ khi vợ qua đời trong một tai nạn bất ngờ. Hạnh phúc tưởng chừng được hồi sinh khi linh hồn vợ anh “trở về” trong thân xác của cô đồng nghiệp, nhưng bí mật kinh hoàng dần xuất hiện.",
    details: [
      ["Đạo diễn:", "Đinh Tuấn Vũ"],
      [
        "Diễn viên:",
        "Quốc Trường, Tiểu Vy, Anh Phạm, Yên Đan, Anh Đức, Lương Gia Huy, Nguyễn Văn Chung",
      ],
      ["Thể loại:", "Bí ẩn, Tâm lý"],
      ["Thời lượng:", "109 phút"],
      ["Ngôn ngữ:", "Tiếng Việt"],
      ["Ngày khởi chiếu:", "01/06/2026"],
    ],
  },

  {
    id: "temple",
    sectionClass: "temple-section",
    title: "Ngôi Đền Kỳ Quái 5",
    shortName: "Ngôi Đền Kỳ Quái 5",
    meta: "🏷 Kinh dị, Hài hước   ⏱ 118 phút",
    format: "2D PHỤ ĐỀ",
    trailer: "https://www.youtube.com/embed/lEJcARUiApo?start=2",
    detailTitle: "Ngôi Đền Kỳ Quái 5",
    description:
      "Thương hiệu Kinh dị - Hài Thái Lan ăn khách nhất đã trở lại. Một năm sau khi đánh bại hồn ma Nak Tinn, nhóm bạn của Balloon và First chưa kịp tận hưởng cuộc sống bình yên thì một linh hồn báo thù bất ngờ quay trở lại và săn đuổi họ.",
    details: [
      ["Đạo diễn:", "Phontharis Chotkijsadarsopon"],
      [
        "Diễn viên:",
        "Aim Witthawat Rattanaboonbaramee, James Bhuripat Vejvongsatechawat, Meen Phiravich Attachitsataporn, Tar Atiwat Saengtien, Kuan Denkhun Ngam-net",
      ],
      ["Thể loại:", "Kinh dị, Hài hước"],
      ["Thời lượng:", "118 phút"],
      ["Ngôn ngữ:", "Tiếng Thái"],
      ["Ngày khởi chiếu:", "29/05/2026"],
    ],
  },

  {
    id: "kuman",
    sectionClass: "kuman-section",
    title: "Kumanthong: Ác Quỷ Dẫn Đường",
    shortName: "Kumanthong",
    meta: "🏷 Kinh dị   ⏱ 110 phút",
    format: "2D PHỤ ĐỀ",
    trailer: "https://www.youtube.com/embed/wQA8c-v5daM",
    detailTitle: "Kumanthong: Ác Quỷ Dẫn Đường",
    description:
      "Một người mẹ đơn thân, vì tương lai của đứa con trai gần như mù lòa, quyết liều mình băng qua khu rừng ma ám trong đêm tối. Nhưng khi một tà linh từ Alas Roban bắt đầu chiếm hữu đứa trẻ, cô buộc phải đối mặt với những thế lực siêu nhiên kinh hoàng và bước vào hành trình tìm kiếm sự cứu rỗi tâm linh trước khi mất đi tất cả.",
    details: [
      ["Đạo diễn:", "Đang cập nhật"],
      ["Diễn viên:", "Padung Songsang, Kapol Thongplub, Nicky Na Chat Juntapun"],
      ["Thể loại:", "Kinh dị"],
      ["Thời lượng:", "110 phút"],
      ["Ngôn ngữ:", "Tiếng Indonesia - Phụ đề"],
      ["Ngày khởi chiếu:", "29/05/2026"],
    ],
  },

  {
    id: "maxo",
    sectionClass: "ma-xo-section",
    title: "Ma Xó",
    shortName: "Ma Xó",
    meta: "🏷 Kinh dị   ⏱ 102 phút",
    format: "2D PHỤ ĐỀ",
    trailer: "https://www.youtube.com/embed/UE6Qo-uPCjQ",
    detailTitle: "Ma Xó",
    description:
      "Trong cái nghèo cùng cực và nỗi sợ mất con sau một lần sảy thai, cuộc sống của vợ chồng Phú và Thảo trở nên tăm tối hơn bao giờ hết khi bà Thuận qua đời vì không có tiền chữa bệnh. Giữa lúc tuyệt vọng, Thảo nghe lời bà Tánh thực hiện nghi thức thỉnh “vong cô hồn” về làm ma xó để trấn giữ ngôi nhà và bảo vệ thai nhi. Khi thực thể trong xó nhà bắt đầu “đòi nợ”, Thảo mới bàng hoàng nhận ra thứ cô rước về là một cơn ác mộng không có đường lui.",
    details: [
      ["Đạo diễn:", "Phan Bá Hỷ"],
      [
        "Diễn viên:",
        "Lê Khánh, Tín Nguyễn, Avin Lu, NSƯT Hạnh Thúy, Nguyễn Sỹ Hậu, Gi A Nguyễn, Leona Khánh Tiên",
      ],
      ["Thể loại:", "Kinh dị"],
      ["Thời lượng:", "102 phút"],
      ["Ngôn ngữ:", "Tiếng Việt"],
      ["Ngày khởi chiếu:", "05/06/2026"],
    ],
  },
];

function Home() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(new Date(2026, 5, 2));
  const [selectedDate, setSelectedDate] = useState("02/06 - T3");
  const [selectedTime, setSelectedTime] = useState({});
  const [showDetail, setShowDetail] = useState({});
  const [selectedTrailer, setSelectedTrailer] = useState(null);

  const dates = createDateRange(startDate);
  const savedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [cinemas, setCinemas] = useState([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState("");

  useEffect(() => {
    getCinemaList()
      .then((raw) => {
        const arr = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.$values)
          ? raw.$values
          : [];
        setCinemas(arr);
        if (arr.length > 0) {
          const firstId = arr[0].id ?? arr[0].Id ?? arr[0].cinemaId ?? arr[0].CinemaId ?? "";
          setSelectedCinemaId(String(firstId));
        }
      })
      .catch(() => setCinemas([]));
  }, []);

const userEmail =
  localStorage.getItem("userEmail") ||
  localStorage.getItem("email") ||
  savedUser.email ||
  savedUser.Email;

  const showingMovies = movies.filter((movie) => {
    return (showtimesByMovie[movie.id]?.[selectedDate] || []).length > 0;
  });

  const hasMovies = showingMovies.length > 0;

  const selectedMovie = movies.find((movie) => selectedTime[movie.id]);

  const selectedMessage = selectedMovie
    ? `Suất chiếu ${selectedMovie.shortName}: ${selectedDate} lúc ${
        selectedTime[selectedMovie.id]
      }`
    : "Suất chiếu muộn từ 22h00";

  function resetSelection() {
    setSelectedTime({});
    setShowDetail({});
    setSelectedTrailer(null);
  }

  function changeDateRange(days) {
    const nextStart = new Date(startDate);
    nextStart.setDate(nextStart.getDate() + days);

    const firstDateText = formatDateVN(nextStart);

    setStartDate(nextStart);
    setSelectedDate(firstDateText);
    resetSelection();
  }

  function handleSelectTime(movieId, time) {
    navigate(`/booking?movie=${movieId}&time=${time}`);
  }

  function toggleDetail(movieId) {
    setShowDetail((prev) => ({
      ...prev,
      [movieId]: !prev[movieId],
    }));
  }

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
          onChange={(e) => setSelectedCinemaId(e.target.value)}
        >
          <option value="">Chọn rạp HCM</option>
          {cinemas.map((c) => {
            const id   = c.id ?? c.Id ?? c.cinemaId ?? c.CinemaId ?? "";
            const name = c.name ?? c.Name ?? c.cinemaName ?? c.CinemaName ?? "Rạp không tên";
            return (
              <option key={id} value={String(id)}>
                {name}
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
          <button className="calendar-arrow" onClick={() => changeDateRange(-8)}>
            ‹
          </button>

          <div className="date-list">
            {dates.map((date, index) => (
              <div
                className={selectedDate === date ? "date active-date" : "date"}
                key={index}
                onClick={() => {
                  setSelectedDate(date);
                  resetSelection();
                }}
              >
                <strong>{date.split("/")[0]}</strong>
                <span>/{date.split("/")[1]}</span>
              </div>
            ))}
          </div>

          <button className="calendar-arrow" onClick={() => changeDateRange(8)}>
            ›
          </button>
        </section>

        <hr />

        {hasMovies && (
          <>
            <div className="note">
              <span></span>
              {selectedMessage}
            </div>

            {showingMovies.map((movie) => {
              const times = showtimesByMovie[movie.id][selectedDate];

              return (
                <section
                  className={`movie-section ${movie.sectionClass}`}
                  key={movie.id}
                >
                  <div className="poster-wrap video-wrap">
                    <iframe
                      src={movie.trailer}
                      title={`${movie.shortName} Trailer`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  </div>

                  <div className="movie-info">
                    <h1 className="movie-title">{movie.title}</h1>

                    <p className="meta">{movie.meta}</p>

                    <div className="movie-action-ribbon">
                      <button onClick={() => toggleDetail(movie.id)}>
                        🎟 {showDetail[movie.id] ? "Ẩn chi tiết" : "Chi tiết"}
                      </button>

                      <span></span>

                      <button onClick={() => setSelectedTrailer(movie)}>
                        Trailer
                      </button>

                      <span></span>

                      <Link to={`/booking?movie=${movie.id}`} style={{
                        flex: 1,
                        height: "100%",
                        background: "none",
                        border: "none",
                        color: "white",
                        fontSize: "16px",
                        font: "inherit",
                        fontWeight: "800",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textDecoration: "none"
                      }}>
                        Mua vé
                      </Link>
                    </div>

                    {showDetail[movie.id] && (
                      <div className="movie-detail-box">
                        <h2>{movie.detailTitle}</h2>

                        <p>{movie.description}</p>

                        {movie.details.map((row, index) => (
                          <div className="detail-row" key={index}>
                            <b>{row[0]}</b>
                            <span>{row[1]}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <h3>{movie.format}</h3>

                    <div className="time-list">
                      {times.map((item, index) => (
                        <div
                          className={item.late ? "time late" : "time"}
                          key={index}
                        >
                          <button
                            className={
                              selectedTime[movie.id] === item.time
                                ? "selected-time"
                                : ""
                            }
                            onClick={() => handleSelectTime(movie.id, item.time)}
                          >
                            {item.time}
                          </button>

                          <p>{item.seats} ghế trống</p>
                        </div>
                      ))}
                    </div>

                    {selectedTime[movie.id] && (
                      <p className="selected-text">
                        Bạn đã chọn {movie.shortName}: {selectedDate} lúc{" "}
                        {selectedTime[movie.id]}
                      </p>
                    )}
                  </div>
                </section>
              );
            })}
          </>
        )}

        {!hasMovies && (
          <p className="selected-text">Ngày này chưa có lịch chiếu phim.</p>
        )}
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

export default Home;