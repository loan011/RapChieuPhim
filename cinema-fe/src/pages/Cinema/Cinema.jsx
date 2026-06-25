import { Link } from "react-router-dom";
import CustomerProfileDropdown from "../../components/CustomerProfileDropdown";
import "../../styles/Cinema.css";
import { useCustomerCinema, getCinemaImage } from "./Cinema.js";

export default function Cinema() {
  const {
    cinemas,
    areas,
    selectedCinema,
    setSelectedCinema,
    selectedArea,
    loading,
    apiError,
    rooms,
    loadingRooms,
    areaDropdownOpen,
    setAreaDropdownOpen,
    areaDropdownRef,
    userEmail,
    filteredCinemas,
    handleAreaChange,
    getAreaName,
    getAreaValue,
    getAreaKey,
    currentImage,
  } = useCustomerCinema();

  return (
    <div className="cinema-view-page">
      <div className="movie-top-login">
        {userEmail ? (
          <CustomerProfileDropdown />
        ) : (
          <>
            <Link to="/login">Đăng nhập</Link>
            <span style={{ margin: "0 6px" }}>|</span>
            <Link to="/register">Đăng ký</Link>
          </>
        )}
      </div>

      <header className="movie-header">
        <div className="movie-logo">
          <span>Cinemas</span>
          <b>HCM</b>
        </div>

        <select
          className="movie-select"
          value={String(selectedCinema?.id ?? "")}
          onChange={(e) => {
            const found = cinemas.find(
              (c) => String(c.id) === e.target.value
            );

            if (found) {
              setSelectedCinema(found);
            }
          }}
        >
          {filteredCinemas.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>

        <nav>
          <Link to="/movies">PHIM</Link>
          <Link to="/">LỊCH CHIẾU THEO RẠP</Link>
          <Link className="active" to="/cinema">
            RẠP
          </Link>
          <Link to="/ticket-price">GIÁ VÉ</Link>
          <a href="#news">TIN MỚI VÀ ƯU ĐÃI</a>
          <a href="#franchise">NHƯỢNG QUYỀN</a>
          <a href="#member">THÀNH VIÊN</a>
        </nav>
      </header>

      {loading && (
        <div className="cinema-loading">
          Đang tải dữ liệu rạp chiếu...
        </div>
      )}

      {!loading && (
        <div className="cinema-container">
          <div className="cinema-sidebar">
            <h2 className="section-title">Danh Sách Hệ Thống Rạp</h2>

            {areas.length > 0 && (
              <div ref={areaDropdownRef} className="cinema-area-dropdown">
                <button
                  className="cinema-area-trigger"
                  onClick={() => setAreaDropdownOpen((v) => !v)}
                >
                  <span>
                    🌏{" "}
                    {selectedArea === ""
                      ? "Tất cả khu vực"
                      : areas.find((a) => getAreaValue(a) === selectedArea)
                      ? getAreaName(
                          areas.find((a) => getAreaValue(a) === selectedArea)
                        )
                      : selectedArea}
                  </span>

                  <span>{areaDropdownOpen ? "▲" : "▼"}</span>
                </button>

                {areaDropdownOpen && (
                  <div className="cinema-area-menu">
                    <div
                      onClick={() => {
                        handleAreaChange("");
                        setAreaDropdownOpen(false);
                      }}
                      className={`cinema-area-option ${
                        selectedArea === "" ? "active" : ""
                      }`}
                    >
                      🌏 Tất cả khu vực
                    </div>

                    {areas.map((a, idx) => {
                      const aname = getAreaName(a);
                      const aval = getAreaValue(a);
                      const isSelected = selectedArea === aval;

                      return (
                        <div
                          key={getAreaKey(a, idx)}
                          onClick={() => {
                            handleAreaChange(aval);
                            setAreaDropdownOpen(false);
                          }}
                          className={`cinema-area-option ${
                            isSelected ? "active" : ""
                          }`}
                        >
                          {aname}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {apiError && cinemas.length === 0 && (
              <p className="cinema-api-error">
                ⚠️ Không tải được dữ liệu từ server.
                <br />
                <span>{apiError}</span>
              </p>
            )}

            <div className="cinema-list-cards">
              {cinemas.length === 0 ? (
                <p className="cinema-empty-text">
                  Không có dữ liệu rạp chiếu
                </p>
              ) : filteredCinemas.length === 0 ? (
                <p className="cinema-empty-text">
                  Không có rạp trong khu vực này
                </p>
              ) : (
                filteredCinemas.map((c, idx) => {
                  const img = getCinemaImage(c, idx);
                  const isActive = selectedCinema?.id === c.id;

                  return (
                    <div
                      key={c.id ?? idx}
                      className={`cinema-item-card ${
                        isActive ? "active" : ""
                      }`}
                      onClick={() => setSelectedCinema(c)}
                    >
                      <img
                        src={img}
                        alt={c.name}
                        className="cinema-item-img"
                      />

                      <div className="cinema-item-info">
                        <h3>{c.name}</h3>
                        <p className="cinema-item-addr">{c.address}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {selectedCinema ? (
            <div className="cinema-main-detail">
              <div
                className="cinema-banner"
                style={{
                  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(13,13,13,1)), url(${currentImage})`,
                }}
              >
                <h1 className="cinema-detail-name">
                  {selectedCinema.name}
                </h1>
              </div>

              <div className="cinema-detail-body">
                <div className="detail-section">
                  <h2 className="detail-sub-title">Thông Tin Liên Hệ</h2>

                  <div className="detail-text-box">
                    <p>
                      📍 <strong>Địa chỉ: </strong>
                      {selectedCinema.address || "—"}
                    </p>

                    {selectedCinema.city && (
                      <p>
                        🏙️ <strong>Thành phố: </strong>
                        {selectedCinema.city}
                      </p>
                    )}

                    {selectedCinema.phone && (
                      <p>
                        📞 <strong>Hotline: </strong>
                        {selectedCinema.phone}
                      </p>
                    )}

                    {selectedCinema.email && (
                      <p>
                        ✉️ <strong>Email: </strong>
                        {selectedCinema.email}
                      </p>
                    )}

                    {selectedCinema.status && (
                      <p>
                        🟢 <strong>Trạng thái: </strong>
                        {selectedCinema.status === "Active"
                          ? "Đang hoạt động"
                          : selectedCinema.status}
                      </p>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <h2 className="detail-sub-title">Danh Sách Phòng Chiếu</h2>

                  {loadingRooms ? (
                    <p className="cinema-empty-text">
                      Đang tải phòng chiếu...
                    </p>
                  ) : rooms.length === 0 ? (
                    <p className="cinema-empty-text">
                      Chưa có thông tin phòng chiếu
                    </p>
                  ) : (
                    <div className="rooms-grid">
                      {rooms.map((room, idx) => (
                        <div
                          key={room.roomId ?? room.RoomId ?? idx}
                          className="room-card"
                        >
                          <h4 className="room-name">
                            {room.roomName ??
                              room.RoomName ??
                              `Phòng ${idx + 1}`}
                          </h4>

                          {(room.totalSeats ?? room.TotalSeats) && (
                            <p className="room-spec">
                              👥 Sức chứa:{" "}
                              <strong>
                                {room.totalSeats ?? room.TotalSeats} ghế
                              </strong>
                            </p>
                          )}

                          {(room.roomType ?? room.RoomType) && (
                            <p className="room-spec">
                              🎬 Loại phòng:{" "}
                              <strong>
                                {room.roomType ?? room.RoomType}
                              </strong>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedCinema.showtimes?.length > 0 && (
                  <div className="detail-section">
                    <h2 className="detail-sub-title">Lịch Chiếu Hôm Nay</h2>

                    <div className="cinema-showtimes-list">
                      {selectedCinema.showtimes.map((st, idx) => (
                        <div
                          key={idx}
                          className="cinema-movie-showtime-row"
                        >
                          <div className="showtime-movie-name">
                            🎥{" "}
                            {st.movie ??
                              st.Movie ??
                              st.movieTitle ??
                              st.MovieTitle}
                          </div>

                          <div className="showtime-times-grid">
                            {(st.times ?? st.Times ?? []).map(
                              (time, tIdx) => (
                                <button
                                  key={tIdx}
                                  className="showtime-time-btn"
                                >
                                  {time}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="cinema-main-detail cinema-no-selected">
              Chọn một rạp để xem chi tiết
            </div>
          )}
        </div>
      )}
    </div>
  );
}