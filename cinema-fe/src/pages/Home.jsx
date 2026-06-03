import { useState } from "react";
import { Link } from "react-router-dom";
import Logout from "./Auth/Logout";
import "../styles/Home.css";

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

/* Doraemon: chỉ có ngày 02, 03, 04 */
const showtimesByDate = {
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
};

/* Ốc Mượn Hồn: chỉ có ngày 03, 04 */
const ocShowtimesByDate = {
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
};

/* Ngôi Đền Kỳ Quái 5: từ ngày 07 trở về sau không còn */
const templeShowtimesByDate = {
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
};

/* Kumanthong */
const kumanShowtimesByDate = {
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
};

/* Ma Xó: từ ngày 06 đến ngày 09 */
const maXoShowtimesByDate = {
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
};

function Home() {
  const [startDate, setStartDate] = useState(new Date(2026, 5, 2));
  const [selectedDate, setSelectedDate] = useState("02/06 - T3");

  const [selectedTime, setSelectedTime] = useState("");
  const [selectedTempleTime, setSelectedTempleTime] = useState("");
  const [selectedKumanTime, setSelectedKumanTime] = useState("");
  const [selectedMaXoTime, setSelectedMaXoTime] = useState("");
  const [selectedOcTime, setSelectedOcTime] = useState("");

  const [showDetail, setShowDetail] = useState(false);
  const [showTempleDetail, setShowTempleDetail] = useState(false);
  const [showKumanDetail, setShowKumanDetail] = useState(false);
  const [showMaXoDetail, setShowMaXoDetail] = useState(false);
  const [showOcDetail, setShowOcDetail] = useState(false);

  const dates = createDateRange(startDate);

  const currentTimes = showtimesByDate[selectedDate] || [];
  const currentTempleTimes = templeShowtimesByDate[selectedDate] || [];
  const currentKumanTimes = kumanShowtimesByDate[selectedDate] || [];
  const currentMaXoTimes = maXoShowtimesByDate[selectedDate] || [];
  const currentOcTimes = ocShowtimesByDate[selectedDate] || [];

  const isShowDoraemon = currentTimes.length > 0;
  const isShowTemple = currentTempleTimes.length > 0;
  const isShowKuman = currentKumanTimes.length > 0;
  const isShowMaXo = currentMaXoTimes.length > 0;
  const isShowOc = currentOcTimes.length > 0;

  const hasMovies =
    isShowDoraemon || isShowTemple || isShowKuman || isShowMaXo || isShowOc;

  const userEmail = localStorage.getItem("userEmail");

  const selectedMessage = selectedTime
    ? `Suất chiếu Doraemon: ${selectedDate} lúc ${selectedTime}`
    : selectedTempleTime
    ? `Suất chiếu Ngôi Đền Kỳ Quái 5: ${selectedDate} lúc ${selectedTempleTime}`
    : selectedKumanTime
    ? `Suất chiếu Kumanthong: ${selectedDate} lúc ${selectedKumanTime}`
    : selectedMaXoTime
    ? `Suất chiếu Ma Xó: ${selectedDate} lúc ${selectedMaXoTime}`
    : selectedOcTime
    ? `Suất chiếu Ốc Mượn Hồn: ${selectedDate} lúc ${selectedOcTime}`
    : "Suất chiếu muộn từ 22h00";

  function resetSelection() {
    setSelectedTime("");
    setSelectedTempleTime("");
    setSelectedKumanTime("");
    setSelectedMaXoTime("");
    setSelectedOcTime("");

    setShowDetail(false);
    setShowTempleDetail(false);
    setShowKumanDetail(false);
    setShowMaXoDetail(false);
    setShowOcDetail(false);
  }

  function changeDateRange(days) {
    const nextStart = new Date(startDate);
    nextStart.setDate(nextStart.getDate() + days);

    const firstDateText = formatDateVN(nextStart);

    setStartDate(nextStart);
    setSelectedDate(firstDateText);
    resetSelection();
  }

  return (
    <div className="beta-page">
      {userEmail ? (
        <Logout />
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

        <select className="cinema-select">
          <option>Chọn rạp HCM</option>
          <option>CGV Vincom Đồng Khởi</option>
          <option>CGV Crescent Mall</option>
          <option>CGV Sư Vạn Hạnh</option>
          <option>Lotte Cinema Nam Sài Gòn</option>
          <option>Galaxy Nguyễn Du</option>
          <option>Galaxy Tân Bình</option>
          <option>Cinestar Quốc Thanh</option>
          <option>Beta Cinemas TP.HCM</option>
          <option>Mega GS Cao Thắng</option>
        </select>

        <nav>
          <a>LỊCH CHIẾU THEO RẠP</a>
          <a>PHIM</a>
          <a>RẠP</a>
          <a>GIÁ VÉ</a>
          <a>TIN MỚI VÀ ƯU ĐÃI</a>
          <a>NHƯỢNG QUYỀN</a>
          <a>THÀNH VIÊN</a>
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

            {isShowDoraemon && (
              <section className="movie-section">
                <div className="poster-wrap video-wrap">
                  <iframe
                    src="https://www.youtube.com/embed/OFNUhDb-FDo?start=2"
                    title="Doraemon Trailer"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>

                <div className="movie-info">
                  <h1
                    className="movie-title"
                    onClick={() => setShowDetail(!showDetail)}
                  >
                    Phim Điện Ảnh Doraemon: Nobita Và Lâu Đài Dưới Đáy Biển -
                    Phiên Bản Mới
                  </h1>

                  <p className="meta">🏷 Hoạt hình &nbsp;&nbsp; ⏱ 101 phút</p>

                  {showDetail && (
                    <div className="movie-detail-box">
                      <h2>
                        Phim Điện Ảnh Doraemon: Nobita Và Lâu Đài Dưới Đáy Biển
                        - Phiên Bản Mới
                      </h2>

                      <p>
                        Trong kỳ nghỉ hè, Nobita và các bạn tranh cãi về việc đi
                        cắm trại ở đâu. Theo ý kiến của Doraemon, họ quyết định
                        cắm trại giữa đại dương. Sử dụng những món đồ bí mật,
                        nhóm bạn tận hưởng chuyến cắm trại dưới đáy biển và gặp
                        gỡ nhiều sinh vật khác nhau.
                      </p>

                      <div className="detail-row">
                        <b>Đạo diễn:</b>
                        <span>Tetsuo Yajima</span>
                      </div>

                      <div className="detail-row">
                        <b>Diễn viên:</b>
                        <span>
                          Wasabi Mizuta, Megumi Oohara, Yumi Kakazu, Subaru
                          Kimura, Tomokazu Seki
                        </span>
                      </div>

                      <div className="detail-row">
                        <b>Thể loại:</b>
                        <span>Hoạt hình</span>
                      </div>

                      <div className="detail-row">
                        <b>Thời lượng:</b>
                        <span>101 phút</span>
                      </div>

                      <div className="detail-row">
                        <b>Ngôn ngữ:</b>
                        <span>Tiếng Việt</span>
                      </div>

                      <div className="detail-row">
                        <b>Ngày khởi chiếu:</b>
                        <span>22/05/2026</span>
                      </div>
                    </div>
                  )}

                  <h3>2D LỒNG TIẾNG</h3>

                  <div className="time-list">
                    {currentTimes.map((item, index) => (
                      <div
                        className={item.late ? "time late" : "time"}
                        key={index}
                      >
                        <button
                          className={
                            selectedTime === item.time ? "selected-time" : ""
                          }
                          onClick={() => {
                            setSelectedTime(item.time);
                            setSelectedTempleTime("");
                            setSelectedKumanTime("");
                            setSelectedMaXoTime("");
                            setSelectedOcTime("");
                          }}
                        >
                          {item.time}
                        </button>

                        <p>{item.seats} ghế trống</p>
                      </div>
                    ))}
                  </div>

                  {selectedTime && (
                    <p className="selected-text">
                      Bạn đã chọn Doraemon: {selectedDate} lúc {selectedTime}
                    </p>
                  )}
                </div>
              </section>
            )}

            {isShowOc && (
              <section className="movie-section oc-section">
                <div className="poster-wrap video-wrap">
                  <iframe
                    src="https://www.youtube.com/embed/89AseidRuPc"
                    title="Ốc Mượn Hồn Trailer"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>

                <div className="movie-info">
                  <h1
                    className="movie-title"
                    onClick={() => setShowOcDetail(!showOcDetail)}
                  >
                    Ốc Mượn Hồn
                  </h1>

                  <p className="meta">🏷 Bí ẩn, Tâm lý &nbsp;&nbsp; ⏱ 109 phút</p>

                  {showOcDetail && (
                    <div className="movie-detail-box">
                      <h2>Ốc Mượn Hồn</h2>

                      <p>
                        Câu chuyện kể về Quân – một người chồng đau khổ khi vợ
                        qua đời trong một tai nạn bất ngờ. Hạnh phúc tưởng
                        chừng được hồi sinh khi linh hồn vợ anh “trở về” trong
                        thân xác của cô đồng nghiệp, nhưng bí mật kinh hoàng dần
                        xuất hiện.
                      </p>

                      <div className="detail-row">
                        <b>Đạo diễn:</b>
                        <span>Đinh Tuấn Vũ</span>
                      </div>

                      <div className="detail-row">
                        <b>Diễn viên:</b>
                        <span>
                          Quốc Trường, Tiểu Vy, Anh Phạm, Yên Đan, Anh Đức,
                          Lương Gia Huy, Nguyễn Văn Chung
                        </span>
                      </div>

                      <div className="detail-row">
                        <b>Thể loại:</b>
                        <span>Bí ẩn, Tâm lý</span>
                      </div>

                      <div className="detail-row">
                        <b>Thời lượng:</b>
                        <span>109 phút</span>
                      </div>

                      <div className="detail-row">
                        <b>Ngôn ngữ:</b>
                        <span>Tiếng Việt</span>
                      </div>

                      <div className="detail-row">
                        <b>Ngày khởi chiếu:</b>
                        <span>01/06/2026</span>
                      </div>
                    </div>
                  )}

                  <h3>2D PHỤ ĐỀ</h3>

                  <div className="time-list">
                    {currentOcTimes.map((item, index) => (
                      <div
                        className={item.late ? "time late" : "time"}
                        key={index}
                      >
                        <button
                          className={
                            selectedOcTime === item.time ? "selected-time" : ""
                          }
                          onClick={() => {
                            setSelectedOcTime(item.time);
                            setSelectedTime("");
                            setSelectedTempleTime("");
                            setSelectedKumanTime("");
                            setSelectedMaXoTime("");
                          }}
                        >
                          {item.time}
                        </button>

                        <p>{item.seats} ghế trống</p>
                      </div>
                    ))}
                  </div>

                  {selectedOcTime && (
                    <p className="selected-text">
                      Bạn đã chọn Ốc Mượn Hồn: {selectedDate} lúc{" "}
                      {selectedOcTime}
                    </p>
                  )}
                </div>
              </section>
            )}

            {isShowTemple && (
              <section className="movie-section temple-section">
                <div className="poster-wrap video-wrap">
                  <iframe
                    src="https://www.youtube.com/embed/lEJcARUiApo?start=2"
                    title="Ngôi Đền Kỳ Quái 5 Trailer"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>

                <div className="movie-info">
                  <h1
                    className="movie-title"
                    onClick={() => setShowTempleDetail(!showTempleDetail)}
                  >
                    Ngôi Đền Kỳ Quái 5
                  </h1>

                  <p className="meta">
                    🏷 Kinh dị, Hài hước &nbsp;&nbsp; ⏱ 118 phút
                  </p>

                  {showTempleDetail && (
                    <div className="movie-detail-box">
                      <h2>Ngôi Đền Kỳ Quái 5</h2>

                      <p>
                        Thương hiệu Kinh dị - Hài Thái Lan ăn khách nhất đã trở
                        lại. Một năm sau khi đánh bại hồn ma Nak Tinn, nhóm bạn
                        của Balloon và First chưa kịp tận hưởng cuộc sống bình
                        yên thì một linh hồn báo thù bất ngờ quay trở lại và săn
                        đuổi họ.
                      </p>

                      <div className="detail-row">
                        <b>Đạo diễn:</b>
                        <span>Phontharis Chotkijsadarsopon</span>
                      </div>

                      <div className="detail-row">
                        <b>Diễn viên:</b>
                        <span>
                          Aim Witthawat Rattanaboonbaramee, James Bhuripat
                          Vejvongsatechawat, Meen Phiravich Attachitsataporn,
                          Tar Atiwat Saengtien, Kuan Denkhun Ngam-net
                        </span>
                      </div>

                      <div className="detail-row">
                        <b>Thể loại:</b>
                        <span>Kinh dị, Hài hước</span>
                      </div>

                      <div className="detail-row">
                        <b>Thời lượng:</b>
                        <span>118 phút</span>
                      </div>

                      <div className="detail-row">
                        <b>Ngôn ngữ:</b>
                        <span>Tiếng Thái</span>
                      </div>

                      <div className="detail-row">
                        <b>Ngày khởi chiếu:</b>
                        <span>29/05/2026</span>
                      </div>
                    </div>
                  )}

                  <h3>2D PHỤ ĐỀ</h3>

                  <div className="time-list">
                    {currentTempleTimes.map((item, index) => (
                      <div
                        className={item.late ? "time late" : "time"}
                        key={index}
                      >
                        <button
                          className={
                            selectedTempleTime === item.time
                              ? "selected-time"
                              : ""
                          }
                          onClick={() => {
                            setSelectedTempleTime(item.time);
                            setSelectedTime("");
                            setSelectedKumanTime("");
                            setSelectedMaXoTime("");
                            setSelectedOcTime("");
                          }}
                        >
                          {item.time}
                        </button>

                        <p>{item.seats} ghế trống</p>
                      </div>
                    ))}
                  </div>

                  {selectedTempleTime && (
                    <p className="selected-text">
                      Bạn đã chọn Ngôi Đền Kỳ Quái 5: {selectedDate} lúc{" "}
                      {selectedTempleTime}
                    </p>
                  )}
                </div>
              </section>
            )}

            {isShowKuman && (
              <section className="movie-section kuman-section">
                <div className="poster-wrap video-wrap">
                  <iframe
                    src="https://www.youtube.com/embed/wQA8c-v5daM"
                    title="Kumanthong Ác Quỷ Dẫn Đường Trailer"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>

                <div className="movie-info">
                  <h1
                    className="movie-title"
                    onClick={() => setShowKumanDetail(!showKumanDetail)}
                  >
                    Kumanthong: Ác Quỷ Dẫn Đường
                  </h1>

                  <p className="meta">🏷 Kinh dị &nbsp;&nbsp; ⏱ 110 phút</p>

                  {showKumanDetail && (
                    <div className="movie-detail-box">
                      <h2>Kumanthong: Ác Quỷ Dẫn Đường</h2>

                      <p>
                        Một người mẹ đơn thân, vì tương lai của đứa con trai gần
                        như mù lòa, quyết liều mình băng qua khu rừng ma ám
                        trong đêm tối. Nhưng khi một tà linh từ Alas Roban bắt
                        đầu chiếm hữu đứa trẻ, cô buộc phải đối mặt với những
                        thế lực siêu nhiên kinh hoàng và bước vào hành trình tìm
                        kiếm sự cứu rỗi tâm linh trước khi mất đi tất cả.
                      </p>

                      <div className="detail-row">
                        <b>Đạo diễn:</b>
                        <span>Đang cập nhật</span>
                      </div>

                      <div className="detail-row">
                        <b>Diễn viên:</b>
                        <span>
                          Padung Songsang, Kapol Thongplub, Nicky Na Chat
                          Juntapun
                        </span>
                      </div>

                      <div className="detail-row">
                        <b>Thể loại:</b>
                        <span>Kinh dị</span>
                      </div>

                      <div className="detail-row">
                        <b>Thời lượng:</b>
                        <span>110 phút</span>
                      </div>

                      <div className="detail-row">
                        <b>Ngôn ngữ:</b>
                        <span>Tiếng Indonesia - Phụ đề</span>
                      </div>

                      <div className="detail-row">
                        <b>Ngày khởi chiếu:</b>
                        <span>29/05/2026</span>
                      </div>
                    </div>
                  )}

                  <h3>2D PHỤ ĐỀ</h3>

                  <div className="time-list">
                    {currentKumanTimes.map((item, index) => (
                      <div
                        className={item.late ? "time late" : "time"}
                        key={index}
                      >
                        <button
                          className={
                            selectedKumanTime === item.time
                              ? "selected-time"
                              : ""
                          }
                          onClick={() => {
                            setSelectedKumanTime(item.time);
                            setSelectedTime("");
                            setSelectedTempleTime("");
                            setSelectedMaXoTime("");
                            setSelectedOcTime("");
                          }}
                        >
                          {item.time}
                        </button>

                        <p>{item.seats} ghế trống</p>
                      </div>
                    ))}
                  </div>

                  {selectedKumanTime && (
                    <p className="selected-text">
                      Bạn đã chọn Kumanthong: Ác Quỷ Dẫn Đường: {selectedDate}{" "}
                      lúc {selectedKumanTime}
                    </p>
                  )}
                </div>
              </section>
            )}

            {isShowMaXo && (
              <section className="movie-section ma-xo-section">
                <div className="poster-wrap video-wrap">
                  <iframe
                    src="https://www.youtube.com/embed/UE6Qo-uPCjQ"
                    title="Ma Xó Trailer"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>

                <div className="movie-info">
                  <h1
                    className="movie-title"
                    onClick={() => setShowMaXoDetail(!showMaXoDetail)}
                  >
                    Ma Xó
                  </h1>

                  <p className="meta">🏷 Kinh dị &nbsp;&nbsp; ⏱ 102 phút</p>

                  {showMaXoDetail && (
                    <div className="movie-detail-box">
                      <h2>Ma Xó</h2>

                      <p>
                        Trong cái nghèo cùng cực và nỗi sợ mất con sau một lần
                        sảy thai, cuộc sống của vợ chồng Phú và Thảo trở nên
                        tăm tối hơn bao giờ hết khi bà Thuận qua đời vì không có
                        tiền chữa bệnh. Giữa lúc tuyệt vọng, Thảo nghe lời bà
                        Tánh thực hiện nghi thức thỉnh “vong cô hồn” về làm ma
                        xó để trấn giữ ngôi nhà và bảo vệ thai nhi. Khi thực thể
                        trong xó nhà bắt đầu “đòi nợ”, Thảo mới bàng hoàng nhận
                        ra thứ cô rước về là một cơn ác mộng không có đường lui.
                      </p>

                      <div className="detail-row">
                        <b>Đạo diễn:</b>
                        <span>Phan Bá Hỷ</span>
                      </div>

                      <div className="detail-row">
                        <b>Diễn viên:</b>
                        <span>
                          Lê Khánh, Tín Nguyễn, Avin Lu, NSƯT Hạnh Thúy,
                          Nguyễn Sỹ Hậu, Gi A Nguyễn, Leona Khánh Tiên
                        </span>
                      </div>

                      <div className="detail-row">
                        <b>Thể loại:</b>
                        <span>Kinh dị</span>
                      </div>

                      <div className="detail-row">
                        <b>Thời lượng:</b>
                        <span>102 phút</span>
                      </div>

                      <div className="detail-row">
                        <b>Ngôn ngữ:</b>
                        <span>Tiếng Việt</span>
                      </div>

                      <div className="detail-row">
                        <b>Ngày khởi chiếu:</b>
                        <span>05/06/2026</span>
                      </div>
                    </div>
                  )}

                  <h3>2D PHỤ ĐỀ</h3>

                  <div className="time-list">
                    {currentMaXoTimes.map((item, index) => (
                      <div
                        className={item.late ? "time late" : "time"}
                        key={index}
                      >
                        <button
                          className={
                            selectedMaXoTime === item.time
                              ? "selected-time"
                              : ""
                          }
                          onClick={() => {
                            setSelectedMaXoTime(item.time);
                            setSelectedTime("");
                            setSelectedTempleTime("");
                            setSelectedKumanTime("");
                            setSelectedOcTime("");
                          }}
                        >
                          {item.time}
                        </button>

                        <p>{item.seats} ghế trống</p>
                      </div>
                    ))}
                  </div>

                  {selectedMaXoTime && (
                    <p className="selected-text">
                      Bạn đã chọn Ma Xó: {selectedDate} lúc {selectedMaXoTime}
                    </p>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        {!hasMovies && (
          <p className="selected-text">Ngày này chưa có lịch chiếu phim.</p>
        )}
      </main>
    </div>
  );
}

export default Home;