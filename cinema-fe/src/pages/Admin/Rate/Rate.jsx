import { useState, useRef } from "react";
import "./Rate.css";
import { createPortal } from "react-dom";
import {
  MdAdd,
  MdCalendarMonth,
  MdConfirmationNumber,
  MdMovie,
  MdLocationOn,
  MdMeetingRoom,
  MdAccessTime,
  MdLocalActivity,
  MdEdit,
  MdTheaters,
  MdArrowBack,
  MdSearch,
} from "react-icons/md";

import {
  useRate,
  STATUS_OPTIONS,
  getShowtimeId,
  getShowtimeMovieTitle,
  getShowtimeRoomName,
  getRoomCinemaId,
  getMovieId,
  getMovieTitle,
  getMovieDurationMinutes,
  isCrossMidnight,
  getStartHour,
  getEndHour,
  getBasePrice,
  getStatus,
  formatMoney,
  formatCalendarHour,
} from "./useRate.js";

/* ═══════════════════════════════════════════════════════════
   PURE UI HELPERS
═══════════════════════════════════════════════════════════ */

function getStatusStyle(status) {
  switch (status) {
    case "Đang chiếu":
      return {
        bg: "#e6f9f0",
        color: "#16a34a",
        label: "Đang chiếu",
      };
    case "Sắp chiếu":
      return {
        bg: "#fff3e0",
        color: "#e67e00",
        label: "Sắp chiếu",
      };
    case "Đã chiếu":
      return {
        bg: "#f3f4f6",
        color: "#6b7280",
        label: "Đã chiếu",
      };
    case "Chiếu sớm":
      return {
        bg: "#f0f4ff",
        color: "#6366f1",
        label: "Chiếu sớm",
      };
    default:
      return {
        bg: "#f3f4f6",
        color: "#6b7280",
        label: status || "—",
      };
  }
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */

export default function Rate() {
  /* ── Local state: search phim trong modal ── */
  const [formMovieSearch, setFormMovieSearch] = useState("");
  const [showMovieDropdown, setShowMovieDropdown] = useState(false);
  const [isMovieLimitExpanded, setIsMovieLimitExpanded] = useState(false);
  const movieSearchRef = useRef(null);

  const {
    /* data */
    movies,
    rooms,
    cinemas,
    loading,
    error,

    /* modal/form */
    showModal,
    editId,
    form,
    formError,
    submitting,
    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmit,

    /* cinema/movie selection */
    selectedCinemaId,
    selectedCinema,
    cinemaSearch,
    setCinemaSearch,
    selectedMovieId,
    movieSearch,
    setMovieSearch,
    cinemaOptions,
    moviesInCinema,
    moviesFiltered,
    getMovieShowtimeCount,
    handleCinemaChange,
    handleMovieClick,

    /* filters */
    filterStatus,
    setFilterStatus,
    filterDate,
    handleFilterDateChange,
    clearFilters,

    /* calendar */
    weekDays,
    weekTitle,
    calendarHours,
    calendarItems,
    getShowtimesByDayHour,
    goPrevWeek,
    goNextWeek,
    goToday,

    /* stats */
    todayCount,
    sellingCount,
    movieCount,
  } = useRate();

  const handleSelectMovieChange = (newMovieId) => {
    if (newMovieId === "") {
      if (selectedMovieId) {
        handleMovieClick(selectedMovieId);
      }
    } else {
      if (selectedMovieId !== newMovieId) {
        handleMovieClick(newMovieId);
      }
    }
  };

  return (
    <div className="lc-wrapper">
      {/* ── Header ── */}
      <div className="lc-header">
        <h4 className="lc-title">Quản Lý Lịch Chiếu</h4>

        <button className="lc-btn-add" onClick={openAddModal}>
          <MdAdd size={18} />
          Thêm lịch chiếu
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="lc-stats-row">
        <StatCard
          icon={<MdCalendarMonth size={32} />}
          iconBg="#f0f4ff"
          iconColor="#6366f1"
          label={
            selectedCinemaId
              ? "Lịch chiếu hôm nay tại chi nhánh"
              : "Tổng lịch chiếu hôm nay"
          }
          value={`${todayCount} suất`}
        />

        <StatCard
          icon={<MdConfirmationNumber size={32} />}
          iconBg="#f0fdf4"
          iconColor="#16a34a"
          label="Đang mở bán"
          value={`${sellingCount} suất`}
        />

        <StatCard
          icon={<MdMovie size={32} />}
          iconBg="#fff7ed"
          iconColor="#f97316"
          label="Phim đang chiếu"
          value={`${movieCount} phim`}
        />
      </div>

      {/* ── Bộ lọc tổng hợp ── */}
      <div className="lc-section-block lc-filter-block">

        {/* Hàng 1: Tabs chi nhánh + Tìm phim + Dropdown phim */}
        <div className="lc-filter-row-top">
          {/* Search chi nhánh + tabs */}
          <div className="lc-cinema-filter-group">
            <div className="lc-cinema-search-wrap lc-cinema-search-wrap--inline">
              <MdSearch size={16} className="lc-cinema-search-icon" />
              <input
                type="text"
                className="lc-cinema-search-input"
                placeholder="Tìm chi nhánh..."
                value={cinemaSearch}
                onChange={(e) => setCinemaSearch(e.target.value)}
              />
              {cinemaSearch && (
                <button
                  type="button"
                  className="lc-cinema-search-clear"
                  onClick={() => setCinemaSearch("")}
                  title="Xóa"
                >
                  ×
                </button>
              )}
            </div>

            <div className="lc-cinema-tabs">
              {cinemaOptions.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`lc-cinema-tab${
                    selectedCinemaId === c.id ? " lc-cinema-tab--active" : ""
                  }`}
                  onClick={() => handleCinemaChange(c.id)}
                >
                  {c.name}
                </button>
              ))}
              {cinemaOptions.length === 0 && (
                <p className="lc-cinema-no-result">
                  Không tìm thấy chi nhánh phù hợp.
                </p>
              )}
            </div>
          </div>

          {/* Tìm phim + dropdown phim (chỉ hiện khi có phim) */}
          {moviesInCinema.length > 0 && (
            <div className="lc-movie-control-group lc-movie-control-group--inline">
              <div className="lc-movie-search-wrap lc-movie-search-wrap--compact">
                <MdSearch size={18} className="lc-movie-search-icon" />
                <input
                  type="text"
                  className="lc-movie-search-input"
                  placeholder="Tìm phim..."
                  value={movieSearch}
                  onChange={(e) => setMovieSearch(e.target.value)}
                />
                {movieSearch && (
                  <button
                    type="button"
                    className="lc-movie-search-clear"
                    onClick={() => setMovieSearch("")}
                    title="Xóa"
                  >
                    ×
                  </button>
                )}
              </div>

              <select
                className="lc-select-dark"
                value={selectedMovieId || ""}
                onChange={(e) => handleSelectMovieChange(e.target.value)}
              >
                <option value="">-- Tất cả phim --</option>
                {moviesFiltered
                  .filter((m) => {
                    const status = (m?.status ?? m?.Status ?? "").toLowerCase();
                    return status.includes("đang chiếu") || status.includes("sắp chiếu");
                  })
                  .map((m) => {
                    const mId = String(getMovieId(m));
                    const mTitle = getMovieTitle(m);
                    const count = getMovieShowtimeCount(mId);
                    return (
                      <option key={mId} value={mId}>
                        {mTitle} ({count} suất)
                      </option>
                    );
                  })}
              </select>
            </div>
          )}
        </div>

        {/* Hàng 2: Lọc ngày + trạng thái + nút xóa */}
        <div className="lc-filter-bar lc-filter-bar--inline">
          <input
            type="date"
            className="lc-date-input"
            value={filterDate}
            onChange={(e) => handleFilterDateChange(e.target.value)}
            title="Chọn ngày để nhảy đến tuần tương ứng"
          />

          <select
            className="lc-status-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {(filterDate || filterStatus) && (
            <button
              type="button"
              className="lc-clear-btn"
              onClick={clearFilters}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* ── Loading / Error ── */}
      {loading && <p className="lc-msg">Đang tải dữ liệu...</p>}

      {error && <p className="lc-msg lc-msg--error">{error}</p>}

      {/* ── Calendar Week View ── */}
      {!loading && !error && (
        <>
          <div className="lc-calendar-toolbar">
            <div className="lc-calendar-nav">
              <button
                type="button"
                className="lc-calendar-nav-btn"
                onClick={goPrevWeek}
              >
                ‹ Tuần trước
              </button>

              <button
                type="button"
                className="lc-calendar-today-btn"
                onClick={goToday}
              >
                Hôm nay
              </button>

              <button
                type="button"
                className="lc-calendar-nav-btn"
                onClick={goNextWeek}
              >
                Tuần sau ›
              </button>
            </div>

            <h5 className="lc-calendar-title">{weekTitle}</h5>

            <div className="lc-calendar-count">
              {calendarItems.length} suất trong tuần
            </div>
          </div>

          {calendarItems.length === 0 && (
            <div className="lc-calendar-empty">
              <MdCalendarMonth size={42} />

              <p>
                {selectedMovieId
                  ? "Không có suất chiếu nào cho phim này trong tuần đang chọn."
                  : selectedCinemaId
                  ? "Chi nhánh này chưa có lịch chiếu trong tuần đang chọn."
                  : "Chưa có dữ liệu lịch chiếu trong tuần này."}
              </p>
            </div>
          )}

          <div className="lc-calendar-board">
            <div className="lc-calendar-header-row">
              <div className="lc-calendar-time-head">GMT+07</div>

              {weekDays.map((day) => (
                <div
                  key={day.date}
                  className={`lc-calendar-day-head${
                    day.isToday ? " lc-calendar-day-head--today" : ""
                  }`}
                >
                  <span className="lc-calendar-day-name">{day.dayName}</span>
                  <span className="lc-calendar-day-number">
                    {day.dayNumber}
                  </span>
                </div>
              ))}
            </div>

            <div className="lc-calendar-body">
              {calendarHours.map((hour) => (
                <div className="lc-calendar-row" key={hour}>
                  <div className="lc-calendar-time-cell">
                    {formatCalendarHour(hour)}
                  </div>

                  {weekDays.map((day) => {
                    const cellItems = getShowtimesByDayHour(day.date, hour);

                    return (
                      <div
                        key={`${day.date}-${hour}`}
                        className="lc-calendar-cell"
                      >
                        {cellItems.map((item, idx) => {
                          const id =
                            getShowtimeId(item) ??
                            `${day.date}-${hour}-${idx}`;

                          return (
                            <CalendarShowtimeItem
                              key={id}
                              item={item}
                              movies={movies}
                              rooms={rooms}
                              selectedCinema={selectedCinema}
                              onEdit={() => openEditModal(item)}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Modal Add / Edit ── */}
      {showModal &&
        createPortal(
          <div className="lc-modal-overlay">
            <div className="lc-modal">
              <h5 className="lc-modal-title">
                {editId !== null ? "Cập Nhật Lịch Chiếu" : "Thêm Lịch Chiếu"}
              </h5>

              {formError && <p className="lc-form-error">{formError}</p>}

              <form onSubmit={handleSubmit} className="lc-form">
                <div className="lc-field lc-field--movie-search">
                  <label className="lc-label">
                    Phim <span className="lc-required">*</span>
                  </label>

                  {/* Search input */}
                  <div className="lc-modal-search-wrap">
                    <span className="lc-modal-search-icon">&#128269;</span>
                    <input
                      ref={movieSearchRef}
                      type="text"
                      className="lc-input lc-input--search"
                      placeholder="Tìm tên phim..."
                      value={formMovieSearch || (() => {
                        if (!form.movieId) return "";
                        const sel = movies.find(
                          (m) => String(getMovieId(m)) === String(form.movieId)
                        );
                        return sel ? getMovieTitle(sel) : "";
                      })()}
                      onChange={(e) => {
                        setFormMovieSearch(e.target.value);
                        setShowMovieDropdown(true);
                        if (!e.target.value) {
                          handleChange({ target: { name: "movieId", value: "" } });
                        }
                      }}
                      onFocus={() => {
                        setFormMovieSearch("");
                        setShowMovieDropdown(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowMovieDropdown(false), 180);
                      }}
                      autoComplete="off"
                    />
                    {formMovieSearch && (
                      <button
                        type="button"
                        className="lc-modal-search-clear"
                        onClick={() => {
                          setFormMovieSearch("");
                          setShowMovieDropdown(false);
                          handleChange({ target: { name: "movieId", value: "" } });
                        }}
                        title="Xóa"
                      >×</button>
                    )}
                  </div>

                  {/* Dropdown kết quả */}
                  {showMovieDropdown && (() => {
                    const kw = formMovieSearch.trim().toLowerCase();
                    const filtered = movies.filter((m) => {
                      const status = (m?.status ?? m?.Status ?? "").toLowerCase();
                      const isAllowed =
                        status.includes("đang chiếu") || status.includes("sắp chiếu");
                      return isAllowed && (!kw || getMovieTitle(m).toLowerCase().includes(kw));
                    });
                    return (
                      <div className="lc-movie-dropdown">
                        {filtered.length === 0 ? (
                          <div className="lc-movie-dropdown-empty">
                            Không tìm thấy phìm
                          </div>
                        ) : filtered.map((m) => {
                          const mId = getMovieId(m);
                          const mTitle = getMovieTitle(m);
                          const dur = getMovieDurationMinutes(m);
                          const isSelected = String(form.movieId) === String(mId);
                          return (
                            <div
                              key={mId}
                              className={`lc-movie-dropdown-item${
                                isSelected ? " lc-movie-dropdown-item--selected" : ""
                              }`}
                              onMouseDown={() => {
                                handleChange({ target: { name: "movieId", value: String(mId) } });
                                setFormMovieSearch("");
                                setShowMovieDropdown(false);
                              }}
                            >
                              <span className="lc-movie-dropdown-title">
                                {mTitle}
                              </span>
                              {dur && (
                                <span className="lc-movie-duration-badge">
                                  ⏱ {dur} phút
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Badge thời lượng phim đã chọn */}
                  {form.movieId && (() => {
                    const sel = movies.find(
                      (m) => String(getMovieId(m)) === String(form.movieId)
                    );
                    const dur = getMovieDurationMinutes(sel);
                    if (!dur) return null;
                    return (
                      <span className="lc-selected-duration-badge">
                        ⏱ {dur} phút
                      </span>
                    );
                  })()}
                </div>

                {/* Hàng: Chi Nhánh + Phòng Chiếu */}
                <div className="lc-field-row">
                  <div className="lc-field">
                    <label className="lc-label">
                      Chi Nhánh / Khu Vực{" "}
                      <span className="lc-required">*</span>
                    </label>

                    <select
                      name="cinemaId"
                      value={form.cinemaId}
                      onChange={handleChange}
                      className="lc-input"
                    >
                      <option value="">-- Chọn chi nhánh --</option>

                      {cinemas.map((c) => {
                        const cId =
                          c?.cinemaId ?? c?.CinemaId ?? c?.id ?? c?.Id;
                        const cName =
                          c?.cinemaName ??
                          c?.CinemaName ??
                          c?.name ??
                          c?.Name ??
                          "—";

                        return (
                          <option key={cId} value={cId}>
                            {cName}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="lc-field">
                    <label className="lc-label">
                      Phòng Chiếu <span className="lc-required">*</span>
                    </label>

                    <select
                      name="roomId"
                      value={form.roomId}
                      onChange={handleChange}
                      className="lc-input"
                      disabled={!form.cinemaId}
                    >
                      <option value="">-- Chọn phòng chiếu --</option>

                      {rooms
                        .filter(
                          (r) =>
                            String(getRoomCinemaId(r)) ===
                            String(form.cinemaId)
                        )
                        .map((r) => {
                          const rId =
                            r?.roomId ?? r?.RoomId ?? r?.id ?? r?.Id;
                          const rName =
                            r?.roomName ?? r?.RoomName ?? r?.name ?? "—";

                          return (
                            <option key={rId} value={rId}>
                              {rName}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                </div>

                {/* Hàng: Ngày Chiếu + Trạng Thái */}
                <div className="lc-field-row">
                  <div className="lc-field">
                    <label className="lc-label">
                      Ngày Chiếu <span className="lc-required">*</span>
                    </label>

                    <input
                      type="date"
                      name="showDate"
                      value={form.showDate}
                      onChange={handleChange}
                      className="lc-input"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>

                  <div className="lc-field">
                    <label className="lc-label">Trạng Thái</label>

                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="lc-input"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Hàng: Giờ Bắt Đầu + Giờ Kết Thúc */}
                <div className="lc-field-row">
                  <div className="lc-field">
                    <label className="lc-label">
                      Giờ Bắt Đầu <span className="lc-required">*</span>
                    </label>

                    <input
                      type="time"
                      name="startHour"
                      value={form.startHour}
                      onChange={handleChange}
                      className="lc-input"
                    />
                  </div>

                  <div className="lc-field">
                    <label className="lc-label">
                      Giờ Kết Thúc <span className="lc-required">*</span>
                    </label>

                    {/* Kiểm tra xem phim đã chọn có thời lượng không */}
                    {(() => {
                      const selMovie = movies.find(
                        (m) => String(getMovieId(m)) === String(form.movieId)
                      );
                      const dur = getMovieDurationMinutes(selMovie);
                      const crossMid = isCrossMidnight(form.startHour, form.endHour);
                      if (dur) {
                        return (
                          <>
                            <div className="lc-end-hour-wrap">
                              <input
                                type="time"
                                name="endHour"
                                value={form.endHour}
                                readOnly
                                className="lc-input lc-input--readonly"
                                title="Tự động tính từ thời lượng phim"
                              />
                              {crossMid && (
                                <span className="lc-midnight-badge">
                                  +1 ngày
                                </span>
                              )}
                            </div>
                            <span className={`lc-duration-tip${crossMid ? " lc-duration-tip--cross" : ""}`}>
                              {crossMid
                                ? `⏱ Kết thúc sang ngày hôm sau (±${dur} phút)`
                                : `⏱ Tự động tính: ${dur} phút`}
                            </span>
                          </>
                        );
                      }
                      return (
                        <div className="lc-end-hour-wrap">
                          <input
                            type="time"
                            name="endHour"
                            value={form.endHour}
                            onChange={handleChange}
                            className="lc-input"
                          />
                          {crossMid && (
                            <span className="lc-midnight-badge">
                              +1 ngày
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="lc-modal-actions">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="lc-btn-cancel"
                    disabled={submitting}
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    className="lc-btn-submit"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Đang xử lý..."
                      : editId !== null
                      ? "Cập Nhật"
                      : "Thêm Mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════════ */

function StatCard({ icon, iconBg, iconColor, label, value }) {
  return (
    <div className="lc-stat-card">
      <div
        className="lc-stat-icon"
        style={{
          background: iconBg,
          color: iconColor,
        }}
      >
        {icon}
      </div>

      <div className="lc-stat-body">
        <p className="lc-stat-label">{label}</p>
        <p className="lc-stat-value">{value}</p>
      </div>
    </div>
  );
}

function CalendarShowtimeItem({
  item,
  movies,
  rooms,
  selectedCinema,
  onEdit,
}) {
  const status = getStatus(item);
  const statusStyle = getStatusStyle(status);

  const movieTitle = getShowtimeMovieTitle(item, movies);
  const roomName = getShowtimeRoomName(item, rooms);

  const cinemaName =
    item?.cinemaName ??
    item?.CinemaName ??
    item?.room?.cinemaName ??
    item?.room?.CinemaName ??
    item?.Room?.cinemaName ??
    item?.Room?.CinemaName ??
    selectedCinema?.name ??
    "—";

  const startHour = getStartHour(item);
  const endHour = getEndHour(item);
  const price = formatMoney(getBasePrice(item));

  return (
    <button
      type="button"
      className="lc-calendar-event"
      style={{
        borderLeftColor: statusStyle.color,
      }}
      onClick={onEdit}
      title="Bấm để sửa lịch chiếu"
    >
      <span className="lc-event-time">
        {startHour}
        {endHour ? ` - ${endHour}` : ""}
      </span>

      <strong className="lc-event-title">{movieTitle}</strong>

      <span className="lc-event-meta">{cinemaName}</span>

      <span className="lc-event-meta">{roomName}</span>

      <span className="lc-event-price">{price}</span>
    </button>
  );
}