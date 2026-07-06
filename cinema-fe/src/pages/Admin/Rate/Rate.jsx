import "./Rate.css";
import { createPortal } from "react-dom";
import {
  MdAdd, MdCalendarMonth, MdConfirmationNumber, MdMovie,
  MdLocationOn, MdMeetingRoom, MdAccessTime, MdLocalActivity,
  MdVisibility, MdEdit, MdTheaters, MdArrowBack, MdSearch,
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
  getShowDate,
  getStartHour,
  getBasePrice,
  getStatus,
  formatMoney,
} from "./useRate.js";

/* ═══════════════════════════════════════════════════════════
   PURE UI HELPERS
═══════════════════════════════════════════════════════════ */

function getStatusStyle(status) {
  switch (status) {
    case "Đang chiếu": return { bg: "#e6f9f0", color: "#16a34a", label: "Đang chiếu" };
    case "Sắp chiếu":  return { bg: "#fff3e0", color: "#e67e00", label: "Sắp chiếu"  };
    case "Đã chiếu":   return { bg: "#f3f4f6", color: "#6b7280", label: "Đã chiếu"   };
    case "Chiếu sớm":  return { bg: "#f0f4ff", color: "#6366f1", label: "Chiếu sớm"  };
    default:           return { bg: "#f3f4f6", color: "#6b7280", label: status || "—" };
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT  — UI only, no logic
═══════════════════════════════════════════════════════════ */

export default function Rate() {
  const {
    /* data */
    movies, rooms, cinemas,
    loading, error,
    /* modal/form */
    showModal, editId, form, formError, submitting,
    openAddModal, openEditModal, closeModal, handleChange, handleSubmit,
    /* cinema/movie selection */
    selectedCinemaId, selectedCinema,
    cinemaSearch, setCinemaSearch,
    selectedMovieId,
    movieSearch, setMovieSearch,
    cinemaOptions,
    moviesInCinema, moviesFiltered,
    getMovieShowtimeCount,
    handleCinemaChange, handleMovieClick,
    /* filters */
    filterStatus, setFilterStatus,
    filterDate,   setFilterDate,
    clearFilters,
    /* pagination */
    page, setPage,
    filtered, pageItems, totalPages, safePage,
    /* stats */
    todayCount, sellingCount, movieCount,
  } = useRate();

  return (
    <div className="lc-wrapper">

      {/* ── Header ── */}
      <div className="lc-header">
        <h4 className="lc-title">Quản Lý Lịch Chiếu</h4>
        <button className="lc-btn-add" onClick={openAddModal}>
          <MdAdd size={18} /> Thêm lịch chiếu
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="lc-stats-row">
        <StatCard icon={<MdCalendarMonth size={32} />} iconBg="#f0f4ff" iconColor="#6366f1"
          label={selectedCinemaId ? "Lịch chiếu hôm nay tại chi nhánh" : "Tổng lịch chiếu hôm nay"}
          value={`${todayCount} suất`} />
        <StatCard icon={<MdConfirmationNumber size={32} />} iconBg="#f0fdf4" iconColor="#16a34a"
          label="Đang mở bán" value={`${sellingCount} suất`} />
        <StatCard icon={<MdMovie size={32} />} iconBg="#fff7ed" iconColor="#f97316"
          label="Phim đang chiếu" value={`${movieCount} phim`} />
      </div>

      {/* ── Bước 1: Chọn chi nhánh ── */}
      <div className="lc-section-block">
        <p className="lc-section-label"><MdTheaters size={16} /> Chọn chi nhánh</p>
        
        {/* Search chi nhánh */}
        <div className="lc-cinema-search-wrap">
          <MdSearch size={18} className="lc-cinema-search-icon" />
          <input
            type="text"
            className="lc-cinema-search-input"
            placeholder="Tìm tên chi nhánh..."
            value={cinemaSearch}
            onChange={(e) => setCinemaSearch(e.target.value)}
          />
          {cinemaSearch && (
            <button className="lc-cinema-search-clear" onClick={() => setCinemaSearch("")} title="Xóa">×</button>
          )}
        </div>

        <div className="lc-cinema-tabs">
          {cinemaOptions.map((c) => (
            <button key={c.id}
              className={`lc-cinema-tab${selectedCinemaId === c.id ? " lc-cinema-tab--active" : ""}`}
              onClick={() => handleCinemaChange(c.id)}
            >{c.name}</button>
          ))}
          {cinemaOptions.length === 0 && (
            <p className="lc-cinema-no-result">Không tìm thấy chi nhánh phù hợp.</p>
          )}
        </div>
      </div>

      {/* ── Bước 2: Chọn phim ── */}
      {moviesInCinema.length > 0 && (
        <div className="lc-section-block">
          <p className="lc-section-label">
            <MdMovie size={16} />
            {selectedCinemaId
              ? `Phim đang chiếu tại ${selectedCinema?.name ?? "chi nhánh này"} — bấm để lọc suất:`
              : "Chọn phim để xem suất chiếu:"}
          </p>

          {/* Search phim */}
          <div className="lc-movie-search-wrap">
            <MdSearch size={18} className="lc-movie-search-icon" />
            <input
              type="text"
              className="lc-movie-search-input"
              placeholder="Tìm tên phim..."
              value={movieSearch}
              onChange={(e) => setMovieSearch(e.target.value)}
            />
            {movieSearch && (
              <button className="lc-movie-search-clear" onClick={() => setMovieSearch("")} title="Xóa">×</button>
            )}
          </div>

          {/* Chips */}
          <div className="lc-movie-chips">
            {moviesFiltered.map((m) => {
              const mId     = String(getMovieId(m));
              const mTitle  = getMovieTitle(m);
              const count   = getMovieShowtimeCount(mId);
              const isActive = selectedMovieId === mId;
              return (
                <button key={mId}
                  className={`lc-movie-chip${isActive ? " lc-movie-chip--active" : ""}`}
                  onClick={() => handleMovieClick(mId)} title={mTitle}
                >
                  <span className="lc-chip-title">{mTitle}</span>
                  <span className="lc-chip-count">{count} suất</span>
                </button>
              );
            })}
            {moviesFiltered.length === 0 && (
              <p className="lc-movie-no-result">Không tìm thấy phim phù hợp.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Breadcrumb ── */}
      {selectedMovieId && (
        <div className="lc-breadcrumb">
          <button className="lc-back-btn" onClick={() => handleMovieClick(selectedMovieId)}>
            <MdArrowBack size={16} /> Tất cả phim
          </button>
          <span className="lc-breadcrumb-sep">›</span>
          <span className="lc-breadcrumb-current">
            {getMovieTitle(movies.find((m) => String(getMovieId(m)) === selectedMovieId) ?? {})}
          </span>
          {selectedCinema && (
            <><span className="lc-breadcrumb-sep">›</span>
            <span className="lc-breadcrumb-cinema">{selectedCinema.name}</span></>
          )}
        </div>
      )}

      {/* ── Filter phụ ── */}
      <div className="lc-filter-bar">
        <input type="date" className="lc-date-input" value={filterDate}
          onChange={(e) => { setFilterDate(e.target.value); setPage(1); }} title="Lọc theo ngày chiếu" />
        <select className="lc-status-select" value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {(filterDate || filterStatus) && (
          <button className="lc-clear-btn" onClick={clearFilters}>Xóa bộ lọc</button>
        )}
      </div>

      {/* ── Loading / Error ── */}
      {loading && <p className="lc-msg">Đang tải dữ liệu...</p>}
      {error   && <p className="lc-msg lc-msg--error">{error}</p>}

      {/* ── Card grid ── */}
      {!loading && !error && (
        <>
          {pageItems.length === 0 ? (
            <div className="lc-empty">
              <MdCalendarMonth size={48} className="lc-empty-icon" />
              <p>{selectedMovieId ? "Không có suất chiếu nào cho phim này."
                : selectedCinemaId ? "Chi nhánh này chưa có lịch chiếu."
                : "Chưa có dữ liệu lịch chiếu."}</p>
            </div>
          ) : (
            <div className="lc-grid">
              {pageItems.map((item, idx) => {
                const id         = getShowtimeId(item);
                const status     = getStatus(item);
                const statusStyle = getStatusStyle(status);
                const movieTitle = getShowtimeMovieTitle(item, movies);
                const roomName   = getShowtimeRoomName(item, rooms);
                const cinemaName =
                  item?.cinemaName ?? item?.CinemaName ??
                  item?.room?.cinemaName ?? item?.room?.CinemaName ??
                  item?.Room?.cinemaName ?? item?.Room?.CinemaName ??
                  selectedCinema?.name ?? "—";
                const showDate  = formatDate(getShowDate(item));
                const startHour = getStartHour(item);
                const price     = formatMoney(getBasePrice(item));
                const seatName  =
                  item?.showTimeName ?? item?.ShowTimeName ??
                  item?.name ?? item?.Name ??
                  `Suất ${String(idx + 1 + (safePage - 1) * 5).padStart(2, "0")}`;

                return (
                  <ShowtimeCard key={id ?? idx}
                    name={seatName}
                    statusStyle={statusStyle}
                    movieTitle={movieTitle}
                    cinemaName={cinemaName}
                    roomName={roomName}
                    showDate={showDate}
                    startHour={startHour}
                    price={price}
                    onEdit={() => openEditModal(item)}
                  />
                );
              })}
            </div>
          )}

          {/* ── Pagination ── */}
          {filtered.length > 0 && (
            <div className="lc-footer">
              <span className="lc-footer-info">
                Hiển thị {Math.min((safePage - 1) * 5 + 1, filtered.length)}–
                {Math.min(safePage * 5, filtered.length)} của {filtered.length} lịch chiếu
              </span>
              <div className="lc-pagination">
                <button className="lc-page-btn" disabled={safePage === 1}
                  onClick={() => setPage(safePage - 1)}>Trước</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p}
                    className={`lc-page-btn${p === safePage ? " lc-page-btn--active" : ""}`}
                    onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="lc-page-btn" disabled={safePage === totalPages}
                  onClick={() => setPage(safePage + 1)}>Sau</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modal ── */}
      {showModal && createPortal(
        <div className="lc-modal-overlay">
          <div className="lc-modal">
            <h5 className="lc-modal-title">
              {editId !== null ? "Cập Nhật Lịch Chiếu" : "Thêm Lịch Chiếu"}
            </h5>
            {formError && <p className="lc-form-error">{formError}</p>}
            <form onSubmit={handleSubmit} className="lc-form">

              <div className="lc-field">
                <label className="lc-label">Phim <span className="lc-required">*</span></label>
                <select name="movieId" value={form.movieId} onChange={handleChange} className="lc-input">
                  <option value="">-- Chọn phim --</option>
                  {movies.map((m) => {
                    const mId    = m?.movieId ?? m?.MovieId ?? m?.id ?? m?.Id;
                    const mTitle = m?.title ?? m?.Title ?? m?.movieTitle ?? m?.MovieTitle ?? m?.name ?? "—";
                    return <option key={mId} value={mId}>{mTitle}</option>;
                  })}
                </select>
              </div>

              <div className="lc-field">
                <label className="lc-label">Chi Nhánh / Khu Vực <span className="lc-required">*</span></label>
                <select name="cinemaId" value={form.cinemaId} onChange={handleChange} className="lc-input">
                  <option value="">-- Chọn chi nhánh/khu vực --</option>
                  {cinemas.map((c) => {
                    const cId   = c?.cinemaId ?? c?.CinemaId ?? c?.id ?? c?.Id;
                    const cName = c?.cinemaName ?? c?.CinemaName ?? c?.name ?? c?.Name ?? "—";
                    return <option key={cId} value={cId}>{cName}</option>;
                  })}
                </select>
              </div>

              <div className="lc-field">
                <label className="lc-label">Phòng Chiếu <span className="lc-required">*</span></label>
                <select name="roomId" value={form.roomId} onChange={handleChange} className="lc-input" disabled={!form.cinemaId}>
                  <option value="">-- Chọn phòng chiếu --</option>
                  {rooms
                    .filter((r) => String(getRoomCinemaId(r)) === String(form.cinemaId))
                    .map((r) => {
                      const rId   = r?.roomId ?? r?.RoomId ?? r?.id ?? r?.Id;
                      const rName = r?.roomName ?? r?.RoomName ?? r?.name ?? "—";
                      return <option key={rId} value={rId}>{rName}</option>;
                    })}
                </select>
              </div>

              <div className="lc-field">
                <label className="lc-label">Ngày Chiếu <span className="lc-required">*</span></label>
                <input type="date" name="showDate" value={form.showDate} onChange={handleChange} className="lc-input" />
              </div>

              <div className="lc-field-row">
                <div className="lc-field">
                  <label className="lc-label">Giờ Bắt Đầu <span className="lc-required">*</span></label>
                  <input type="time" name="startHour" value={form.startHour} onChange={handleChange} className="lc-input" />
                </div>
                <div className="lc-field">
                  <label className="lc-label">Giờ Kết Thúc <span className="lc-required">*</span></label>
                  <input type="time" name="endHour" value={form.endHour} onChange={handleChange} className="lc-input" />
                </div>
              </div>

              <div className="lc-field-row">
                <div className="lc-field">
                  <label className="lc-label">Giá Vé (đ) <span className="lc-required">*</span></label>
                  <input type="number" name="basePrice" value={form.basePrice} onChange={handleChange}
                    placeholder="VD: 95000" min={0} className="lc-input" />
                </div>
                <div className="lc-field">
                  <label className="lc-label">Trạng Thái</label>
                  <select name="status" value={form.status} onChange={handleChange} className="lc-input">
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="lc-modal-actions">
                <button type="button" onClick={closeModal} className="lc-btn-cancel" disabled={submitting}>Hủy</button>
                <button type="submit" className="lc-btn-submit" disabled={submitting}>
                  {submitting ? "Đang xử lý..." : editId !== null ? "Cập Nhật" : "Thêm Mới"}
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
   SUB-COMPONENTS (pure UI, no logic)
═══════════════════════════════════════════════════════════ */

function StatCard({ icon, iconBg, iconColor, label, value }) {
  return (
    <div className="lc-stat-card">
      <div className="lc-stat-icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
      <div className="lc-stat-body">
        <p className="lc-stat-label">{label}</p>
        <p className="lc-stat-value">{value}</p>
      </div>
    </div>
  );
}

function ShowtimeCard({ name, statusStyle, movieTitle, cinemaName, roomName, showDate, startHour, price, onEdit }) {
  return (
    <div className="lc-card">
      <div className="lc-card-head">
        <h6 className="lc-card-name">{name}</h6>
        <span className="lc-card-badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
          {statusStyle.label}
        </span>
      </div>
      <div className="lc-card-info">
        <InfoRow icon={<MdMovie />}         label="Phim:"      value={movieTitle} />
        <InfoRow icon={<MdLocationOn />}    label="Chi nhánh:" value={cinemaName} />
        <InfoRow icon={<MdMeetingRoom />}   label="Phòng:"     value={roomName} />
        <InfoRow icon={<MdAccessTime />}    label="Thời gian:" value={startHour ? `${startHour} | ${showDate}` : showDate} />
        <InfoRow icon={<MdLocalActivity />} label="Giá vé:"    value={price} />
      </div>
      <div className="lc-card-actions">
        <button className="lc-card-btn lc-card-btn--detail"><MdVisibility size={15} /> Chi tiết</button>
        <button className="lc-card-btn lc-card-btn--edit" onClick={onEdit}><MdEdit size={15} /> Sửa</button>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="lc-info-row">
      <span className="lc-info-icon">{icon}</span>
      <span className="lc-info-label">{label}</span>
      <span className="lc-info-value">{value || "—"}</span>
    </div>
  );
}