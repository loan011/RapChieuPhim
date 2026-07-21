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
  WEEKDAY_OPTIONS,
  isMovieNowOrUpcoming,
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
  formatDate,
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

    /* modal/form đơn lẻ */
    showModal,
    editId,
    isEditMode,
    setIsEditMode,
    form,
    formError,
    submitting,
    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmit,

    /* modal hàng loạt (batch generator) */
    showBatchModal,
    batchForm,
    batchItems,
    conflictCount,
    batchError,
    batchSubmitting,
    newStartTimeInput,
    setNewStartTimeInput,
    openBatchModal,
    closeBatchModal,
    handleBatchFormChange,
    handleToggleWeekday,
    handleSelectWeekdayPreset,
    handleAddStartTime,
    handleRemoveStartTime,
    handleRemoveBatchItem,
    handleBatchSubmit,

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

  const isPastShowtime = form?.status === "Đã chiếu";
  const isFieldDisabled = !isEditMode || isPastShowtime;

  return (
    <div className="lc-wrapper">
      {/* ── Header ── */}
      <div className="lc-header">
        <h4 className="lc-title">Quản Lý Lịch Chiếu</h4>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button className="lc-btn-add" style={{ background: "#4f46e5" }} onClick={openBatchModal}>
            <MdCalendarMonth size={18} />
            Tạo Lịch
          </button>
        </div>
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
      <div className="lc-filter-container-dark">
        <h5 className="lc-filter-dark-title">Tìm kiếm & lọc lịch chiếu</h5>
        
        <div className="lc-filter-dark-grid">
          {/* Row 1 */}
          <div className="lc-filter-dark-group">
            <label>Chi nhánh</label>
            <div className="lc-filter-dark-input-wrap">
              <MdLocationOn className="lc-filter-dark-icon" size={18} />
              <select 
                value={selectedCinemaId || ""} 
                onChange={(e) => handleCinemaChange(e.target.value)}
                className="lc-filter-dark-input"
              >
                {cinemaOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="lc-filter-dark-group">
            <label>&nbsp;</label>
            <div className="lc-filter-dark-input-wrap">
              <input
                type="text"
                className="lc-filter-dark-input"
                placeholder="Tìm kiếm chi nhánh..."
                value={cinemaSearch}
                onChange={(e) => setCinemaSearch(e.target.value)}
              />
              <MdSearch className="lc-filter-dark-icon-right" size={18} />
            </div>
          </div>

          <div className="lc-filter-dark-group">
            <label>Tìm theo phim</label>
            <div className="lc-filter-dark-input-wrap">
              <input
                type="text"
                className="lc-filter-dark-input"
                placeholder="Nhập tên phim..."
                value={movieSearch}
                onChange={(e) => setMovieSearch(e.target.value)}
              />
              <MdSearch className="lc-filter-dark-icon-right" size={18} />
            </div>
          </div>

          <div className="lc-filter-dark-group">
            <label>Trạng thái phim</label>
            <div className="lc-filter-dark-input-wrap">
              <select
                className="lc-filter-dark-input"
                value={selectedMovieId || ""}
                onChange={(e) => handleSelectMovieChange(e.target.value)}
              >
                <option value="">Tất cả phim</option>
                {moviesFiltered
                  .filter((m) => isMovieNowOrUpcoming(m))
                  .map((m) => {
                    const mId = String(getMovieId(m));
                    const mTitle = getMovieTitle(m);
                    return (
                      <option key={mId} value={mId}>
                        {mTitle}
                      </option>
                    );
                  })}
              </select>
            </div>
          </div>

          <div className="lc-filter-dark-group">
            <label>Ngày chiếu</label>
            <div className="lc-filter-dark-input-wrap">
              <input
                type="date"
                className="lc-filter-dark-input"
                value={filterDate}
                onChange={(e) => handleFilterDateChange(e.target.value)}
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="lc-filter-dark-group">
            <label>Trạng thái suất</label>
            <div className="lc-filter-dark-input-wrap">
              <select
                className="lc-filter-dark-input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="lc-filter-dark-actions">
            <button type="button" className="lc-btn-dark-clear" onClick={clearFilters}>
              Xóa bộ lọc
            </button>
            <button type="button" className="lc-btn-dark-search">
              <MdSearch size={16} /> Tìm kiếm
            </button>
          </div>
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

      {/* ── Modal Add / Edit đơn lẻ ── */}
      {showModal &&
        createPortal(
          <div className="lc-modal-overlay">
            <div className="lc-modal">
              <h5 className="lc-modal-title">
                {editId === null
                  ? "Thêm Lịch Chiếu"
                  : isEditMode
                  ? "Cập Nhật Lịch Chiếu"
                  : "Chi Tiết Lịch Chiếu"}
              </h5>

              {formError && <p className="lc-form-error">{formError}</p>}

              <form onSubmit={handleSubmit} className="lc-form">
                <div className="lc-field lc-field--movie-search">
                  <label className="lc-label">
                    Phim <span className="lc-required">*</span>
                  </label>

                  <div className="lc-modal-search-wrap">
                    <span className="lc-modal-search-icon">&#128269;</span>
                    <input
                      ref={movieSearchRef}
                      type="text"
                      className="lc-input lc-input--search"
                      placeholder="Tìm tên phim..."
                      disabled={isFieldDisabled}
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
                    {formMovieSearch && !isFieldDisabled && (
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

                  {showMovieDropdown && !isFieldDisabled && (() => {
                    const kw = formMovieSearch.trim().toLowerCase();
                    const filtered = movies.filter((m) => {
                      return isMovieNowOrUpcoming(m) && (!kw || getMovieTitle(m).toLowerCase().includes(kw));
                    });
                    return (
                      <div className="lc-movie-dropdown">
                        {filtered.length === 0 ? (
                          <div className="lc-movie-dropdown-empty">
                            Không tìm thấy phim
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
                      disabled={isFieldDisabled}
                    >
                      <option value="">-- Chọn chi nhánh --</option>

                      {cinemas.map((c) => {
                        const cId = c?.cinemaId ?? c?.CinemaId ?? c?.id ?? c?.Id;
                        const cName = c?.cinemaName ?? c?.CinemaName ?? c?.name ?? "—";
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
                      disabled={!form.cinemaId || isFieldDisabled}
                    >
                      <option value="">-- Chọn phòng chiếu --</option>

                      {rooms
                        .filter(
                          (r) =>
                            String(getRoomCinemaId(r)) ===
                            String(form.cinemaId)
                        )
                        .map((r) => {
                          const rId = r?.roomId ?? r?.RoomId ?? r?.id ?? r?.Id;
                          const rName = r?.roomName ?? r?.RoomName ?? r?.name ?? "—";

                          return (
                            <option key={rId} value={rId}>
                              {rName}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                </div>

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
                      disabled={isFieldDisabled}
                    />
                  </div>

                  <div className="lc-field">
                    <label className="lc-label">Trạng Thái</label>

                    <select
                      name="status"
                      value={form.status || "Đang chiếu"}
                      onChange={handleChange}
                      className="lc-input"
                      disabled={isFieldDisabled}
                    >
                      <option value="Đang chiếu">Đang chiếu</option>
                      {form.status && form.status !== "Đang chiếu" && (
                        <option value={form.status}>{form.status}</option>
                      )}
                    </select>
                  </div>
                </div>

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
                      disabled={isFieldDisabled}
                    />
                  </div>

                  <div className="lc-field">
                    <label className="lc-label">
                      Giờ Kết Thúc <span className="lc-required">*</span>
                    </label>

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
                            disabled={isFieldDisabled}
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
                    {isEditMode || editId === null ? "Hủy" : "Đóng"}
                  </button>

                  {!isPastShowtime && (
                    editId !== null && !isEditMode ? (
                      <button
                        type="button"
                        className="lc-btn-submit"
                        style={{ background: "#f97316" }}
                        onClick={() => setIsEditMode(true)}
                      >
                        <MdEdit size={16} style={{ marginRight: 4 }} /> Chỉnh Sửa
                      </button>
                    ) : (
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
                    )
                  )}
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ── Modal Batch Generator (Tạo Lịch Chiếu) ── */}
      {showBatchModal &&
        createPortal(
          <div className="lc-modal-overlay">
            <div className="lc-modal lc-modal--batch">
              <div className="lc-batch-modal-header">
                <div>
                  <h5 className="lc-modal-title" style={{ marginBottom: 4 }}>
                    ⚡ Tạo Lịch Chiếu
                  </h5>
                </div>
                <button type="button" className="lc-batch-close-btn" onClick={closeBatchModal}>✕</button>
              </div>

              {batchError && <p className="lc-form-error">{batchError}</p>}

              <form onSubmit={handleBatchSubmit} className="lc-batch-form">
                <div className="lc-batch-grid">
                  {/* CỘT TRÁI: CẤU HÌNH ĐẦU VÀO */}
                  <div className="lc-batch-col-left">
                    <h6 className="lc-batch-section-title">1. Chọn Phim & Phòng Chiếu</h6>

                    {/* Phim */}
                    <div className="lc-field">
                      <label className="lc-label">
                        Phim <span className="lc-required">*</span>
                      </label>
                      <select
                        name="movieId"
                        value={batchForm.movieId}
                        onChange={handleBatchFormChange}
                        className="lc-input"
                      >
                        <option value="">-- Chọn phim chiếu --</option>
                        {movies
                          .filter((m) => isMovieNowOrUpcoming(m))
                          .map((m) => {
                            const mId = getMovieId(m);
                            const dur = getMovieDurationMinutes(m);
                            return (
                              <option key={mId} value={mId}>
                                {getMovieTitle(m)} {dur ? `(${dur} phút)` : ""}
                              </option>
                            );
                          })}
                      </select>
                    </div>

                    {/* Chi Nhánh & Phòng */}
                    <div className="lc-field-row">
                      <div className="lc-field">
                        <label className="lc-label">Chi Nhánh <span className="lc-required">*</span></label>
                        <select
                          name="cinemaId"
                          value={batchForm.cinemaId}
                          onChange={handleBatchFormChange}
                          className="lc-input"
                        >
                          <option value="">-- Chọn rạp --</option>
                          {cinemas.map((c) => {
                            const cId = c?.cinemaId ?? c?.CinemaId ?? c?.id ?? c?.Id;
                            const cName = c?.cinemaName ?? c?.CinemaName ?? c?.name ?? "—";
                            return <option key={cId} value={cId}>{cName}</option>;
                          })}
                        </select>
                      </div>

                      <div className="lc-field">
                        <label className="lc-label">Phòng Chiếu <span className="lc-required">*</span></label>
                        <select
                          name="roomId"
                          value={batchForm.roomId}
                          onChange={handleBatchFormChange}
                          className="lc-input"
                          disabled={!batchForm.cinemaId}
                        >
                          <option value="">-- Chọn phòng --</option>
                          {rooms
                            .filter((r) => String(getRoomCinemaId(r)) === String(batchForm.cinemaId))
                            .map((r) => {
                              const rId = r?.roomId ?? r?.RoomId ?? r?.id ?? r?.Id;
                              const rName = r?.roomName ?? r?.RoomName ?? r?.name ?? "—";
                              return <option key={rId} value={rId}>{rName}</option>;
                            })}
                        </select>
                      </div>
                    </div>

                    <h6 className="lc-batch-section-title" style={{ marginTop: 16 }}>2. Khoảng Ngày & Thứ Áp Dụng</h6>

                    {/* Từ Ngày - Đến Ngày */}
                    <div className="lc-field-row">
                      <div className="lc-field">
                        <label className="lc-label">Từ Ngày <span className="lc-required">*</span></label>
                        <input
                          type="date"
                          name="fromDate"
                          value={batchForm.fromDate}
                          onChange={handleBatchFormChange}
                          className="lc-input"
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      <div className="lc-field">
                        <label className="lc-label">Đến Ngày <span className="lc-required">*</span></label>
                        <input
                          type="date"
                          name="toDate"
                          value={batchForm.toDate}
                          onChange={handleBatchFormChange}
                          className="lc-input"
                          min={batchForm.fromDate || new Date().toISOString().split("T")[0]}
                        />
                      </div>
                    </div>

                    {/* Presets Thứ trong tuần */}
                    <div className="lc-field">
                      <div className="lc-batch-presets-row">
                        <span className="lc-label" style={{ margin: 0 }}>Thứ áp dụng:</span>
                        <button type="button" className="lc-btn-preset" onClick={() => handleSelectWeekdayPreset("all")}>Tất cả</button>
                        <button type="button" className="lc-btn-preset" onClick={() => handleSelectWeekdayPreset("weekdays")}>T2 - T6</button>
                        <button type="button" className="lc-btn-preset" onClick={() => handleSelectWeekdayPreset("weekend")}>T7 - CN</button>
                      </div>

                      <div className="lc-batch-weekdays-grid">
                        {WEEKDAY_OPTIONS.map((w) => {
                          const checked = batchForm.selectedWeekdays.includes(w.id);
                          return (
                            <button
                              key={w.id}
                              type="button"
                              className={`lc-weekday-chip${checked ? " lc-weekday-chip--active" : ""}`}
                              onClick={() => handleToggleWeekday(w.id)}
                            >
                              {w.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <h6 className="lc-batch-section-title" style={{ marginTop: 16 }}>3. Thời Gian & Giờ Bắt Đầu</h6>

                    {/* Quảng cáo & Dọn phòng */}
                    <div className="lc-field-row">
                      <div className="lc-field">
                        <label className="lc-label">Quảng Cáo (Phút)</label>
                        <input
                          type="number"
                          name="adTime"
                          value={batchForm.adTime}
                          onChange={handleBatchFormChange}
                          className="lc-input"
                          min={0}
                          max={60}
                        />
                      </div>
                      <div className="lc-field">
                        <label className="lc-label">Dọn Phòng (Phút)</label>
                        <input
                          type="number"
                          name="cleanTime"
                          value={batchForm.cleanTime}
                          onChange={handleBatchFormChange}
                          className="lc-input"
                          min={0}
                          max={60}
                        />
                      </div>
                    </div>

                    {/* Thêm Giờ Chiếu */}
                    <div className="lc-field">
                      <label className="lc-label">Danh Sách Giờ Chiếu Bắt Đầu</label>
                      <div className="lc-batch-time-chips">
                        {batchForm.startTimes.map((t) => (
                          <span key={t} className="lc-time-chip">
                            ⏱ {t}
                            <button type="button" onClick={() => handleRemoveStartTime(t)}>✕</button>
                          </span>
                        ))}
                      </div>

                      <div className="lc-batch-add-time-row">
                        <input
                          type="time"
                          value={newStartTimeInput}
                          onChange={(e) => setNewStartTimeInput(e.target.value)}
                          className="lc-input"
                          style={{ width: "130px" }}
                        />
                        <button
                          type="button"
                          className="lc-btn-dark-search"
                          onClick={() => handleAddStartTime(newStartTimeInput)}
                        >
                          + Thêm giờ
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CỘT PHẢI: XEM TRƯỚC (PREVIEW) & KIỂM TRA TRÙNG LỊCH */}
                  <div className="lc-batch-col-right">
                    <div className="lc-batch-preview-head">
                      <h6 className="lc-batch-section-title" style={{ margin: 0 }}>
                        4. Xem Trước Khung Giờ Chiếu ({batchItems.length} suất)
                      </h6>
                      {conflictCount > 0 && (
                        <span className="lc-batch-conflict-badge">
                          ⚠️ {conflictCount} suất bị trùng lịch!
                        </span>
                      )}
                    </div>

                    {batchItems.length === 0 ? (
                      <div className="lc-batch-preview-empty">
                        <MdCalendarMonth size={36} color="#9ca3af" />
                        <p>Vui lòng chọn Phim, Phòng chiếu, Khoảng ngày và Giờ chiếu ở cột bên trái để sinh lịch xem trước.</p>
                      </div>
                    ) : (
                      <div className="lc-batch-table-wrap">
                        <table className="lc-batch-table">
                          <thead>
                            <tr>
                              <th>Ngày Chiếu</th>
                              <th>Khung Giờ (Bắt đầu - Kết thúc)</th>
                              <th>Trạng Thái</th>
                              <th style={{ width: 45 }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {batchItems.map((item) => (
                              <tr key={item.tempId} className={item.isConflict ? "lc-row-conflict" : ""}>
                                <td>
                                  <strong>{item.dayName}</strong>, {formatDate(item.showDate)}
                                </td>
                                <td>
                                  <span className="lc-batch-time-range">
                                    ⏱ <strong>{item.startHour}</strong> → <strong>{item.endHour}</strong>
                                    {item.crossMid && <span className="lc-midnight-badge">+1 ngày</span>}
                                  </span>
                                  <div className="lc-batch-time-detail">
                                    {item.duration}p phim + {item.adTime}p QC + {item.cleanTime}p dọn
                                  </div>
                                </td>
                                <td>
                                  {item.isConflict ? (
                                    <span className="lc-status-conflict" title={item.conflictReason}>
                                      ⛔ {item.conflictReason}
                                    </span>
                                  ) : (
                                    <span className="lc-status-ok">
                                      ✓ Hợp lệ
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="lc-btn-row-del"
                                    onClick={() => handleRemoveBatchItem(item.tempId)}
                                    title="Xóa suất này khỏi danh sách tạo"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lc-modal-actions" style={{ marginTop: 20 }}>
                  <button
                    type="button"
                    onClick={closeBatchModal}
                    className="lc-btn-cancel"
                    disabled={batchSubmitting}
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    className="lc-btn-submit"
                    style={{ background: conflictCount > 0 ? "#ef4444" : "#10b981" }}
                    disabled={batchSubmitting || batchItems.length === 0 || conflictCount > 0}
                  >
                    {batchSubmitting
                      ? "Đang tự động sinh & lưu suất chiếu..."
                      : `⚡ Lưu Toàn Bộ (${batchItems.length} Suất)`}
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