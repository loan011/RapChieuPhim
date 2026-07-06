import "./Film.css";
import { createPortal } from "react-dom";
import {
  MdAdd,
  MdMovie,
  MdVideocam,
  MdCalendarMonth,
  MdSearch,
  MdEdit,
  MdVisibility,
  MdDelete,
  MdAccessTime,
  MdPerson,
  MdShield,
} from "react-icons/md";
import {
  useFilm,
  STATUS_OPTIONS,
  getMovieId,
  getMovieTitle,
  getMovieDuration,
  getMovieDirector,
  getMovieReleaseDate,
  getMoviePoster,
  getMovieAgeRating,
  getMovieStatusDisplayName,
} from "./useFilm.js";

// Helper for status styling
function getStatusStyle(status) {
  switch (status) {
    case "Đang chiếu":
      return { bg: "#e6f9f0", color: "#16a34a", label: "Đang chiếu" };
    case "Sắp chiếu":
      return { bg: "#fff3e0", color: "#e67e00", label: "Sắp chiếu" };
    case "Đã chiếu":
      return { bg: "#f3f4f6", color: "#6b7280", label: "Đã chiếu" };
    case "Chiếu sớm":
      return { bg: "#f0f4ff", color: "#6366f1", label: "Chiếu sớm" };
    default:
      return { bg: "#f3f4f6", color: "#6b7280", label: status || "—" };
  }
}

export default function Film() {
  const {
    loading,
    error,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    pageItems,
    totalPages,
    safePage,
    setPage,
    filtered,

    /* Stats */
    totalCount,
    nowShowingCount,
    comingSoonCount,

    /* Modal / Form */
    showModal,
    editId,
    form,
    formError,
    submitting,
    categoryOptions,
    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleGenreSelect,
    handleFileChange,
    handleSubmit,
    handleDelete,
    getMovieGenreText,
  } = useFilm();

  return (
    <div className="fm-wrapper">
      {/* ── Header ── */}
      <div className="fm-header">
        <h4 className="fm-title">Quản Lý Phim</h4>
        <button className="fm-btn-add" onClick={openAddModal}>
          <MdAdd size={18} />
          Thêm phim
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="fm-stats-row">
        <StatCard
          icon={<MdMovie size={32} />}
          iconBg="#fff7ed"
          iconColor="#f97316"
          label="Tổng số phim"
          value={`${totalCount} phim`}
        />
        <StatCard
          icon={<MdVideocam size={32} />}
          iconBg="#f0dfdf"
          iconColor="#16a34a"
          label="Đang chiếu"
          value={`${nowShowingCount} phim`}
        />
        <StatCard
          icon={<MdCalendarMonth size={32} />}
          iconBg="#f0f4ff"
          iconColor="#6366f1"
          label="Sắp chiếu"
          value={`${comingSoonCount} phim`}
        />
      </div>

      {/* ── Filter Bar ── */}
      <div className="fm-filter-bar">
        <div className="fm-search-wrap">
          <MdSearch size={18} className="fm-search-icon" />
          <input
            type="text"
            className="fm-search-input"
            placeholder="Tìm kiếm phim theo tên, thể loại..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="fm-status-select"
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* ── Loading / Error ── */}
      {loading && <p className="fm-msg">Đang tải dữ liệu phim...</p>}
      {error && <p className="fm-msg fm-msg--error">{error}</p>}

      {/* ── Cards Grid ── */}
      {!loading && !error && (
        <>
          {pageItems.length === 0 ? (
            <p className="fm-msg">Không có phim nào phù hợp.</p>
          ) : (
            <div className="fm-grid">
              {pageItems.map((movie) => {
                const id = getMovieId(movie);
                const title = getMovieTitle(movie);
                const duration = getMovieDuration(movie);
                const director = getMovieDirector(movie);
                const releaseDate = getMovieReleaseDate(movie);
                const poster = getMoviePoster(movie);
                const rating = getMovieAgeRating(movie);
                const status = getMovieStatusDisplayName(movie);
                const statusStyle = getStatusStyle(status);
                const genre = getMovieGenreText(movie);

                return (
                  <div key={id} className="fm-card">
                    {/* Poster + Delete badge */}
                    <div className="fm-card-poster-wrap">
                      <img src={poster} alt={title} className="fm-card-poster" />
                      <button
                        className="fm-card-btn-delete"
                        onClick={() => handleDelete(id)}
                        title="Xóa phim"
                      >
                        <MdDelete size={16} />
                      </button>
                    </div>

                    {/* Movie Information */}
                    <div className="fm-card-body">
                      <div className="fm-card-header-info">
                        <h6 className="fm-card-title" title={title}>
                          {title}
                        </h6>
                        <span
                          className="fm-card-badge"
                          style={{
                            background: statusStyle.bg,
                            color: statusStyle.color,
                          }}
                        >
                          {statusStyle.label}
                        </span>
                      </div>

                      <div className="fm-card-details">
                        <DetailRow icon={<MdMovie />} value={genre} />
                        <DetailRow icon={<MdAccessTime />} value={duration} />
                        <DetailRow icon={<MdPerson />} value={director} />
                        <DetailRow
                          icon={<MdCalendarMonth />}
                          value={`Khởi chiếu: ${releaseDate}`}
                        />
                        <DetailRow icon={<MdShield />} value={rating} />
                      </div>

                      {/* Card Actions */}
                      <div className="fm-card-actions">
                        <button
                          className="fm-card-btn fm-card-btn--detail"
                          onClick={() => openEditModal(movie)} // Use edit modal for now or detail view
                        >
                          <MdVisibility size={15} /> Chi tiết
                        </button>
                        <button
                          className="fm-card-btn fm-card-btn--edit"
                          onClick={() => openEditModal(movie)}
                        >
                          <MdEdit size={15} /> Sửa
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Pagination Footer ── */}
          {filtered.length > 0 && (
            <div className="fm-footer">
              <span className="fm-footer-info">
                Hiển thị {Math.min((safePage - 1) * 5 + 1, filtered.length)}–
                {Math.min(safePage * 5, filtered.length)} của {filtered.length} phim
              </span>
              <div className="fm-pagination">
                <button
                  className="fm-page-btn"
                  disabled={safePage === 1}
                  onClick={() => setPage(safePage - 1)}
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`fm-page-btn${
                      p === safePage ? " fm-page-btn--active" : ""
                    }`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="fm-page-btn"
                  disabled={safePage === totalPages}
                  onClick={() => setPage(safePage + 1)}
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modal Add / Edit ── */}
      {showModal &&
        createPortal(
          <div className="fm-modal-overlay">
            <div className="fm-modal">
              <h5 className="fm-modal-title">
                {editId !== null ? "Cập Nhật Phim" : "Thêm Phim Mới"}
              </h5>

              {formError && <p className="fm-form-error">{formError}</p>}

              <form onSubmit={handleSubmit} className="fm-form">
                {/* Tên phim */}
                <div className="fm-field">
                  <label className="fm-label">
                    Tên phim <span className="fm-required">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    className="fm-input"
                    placeholder="Nhập tên phim"
                    required
                  />
                </div>

                {/* Thể loại + Đạo diễn */}
                <div className="fm-field-row">
                  <div className="fm-field">
                    <label className="fm-label">Thể loại</label>
                    <div className="fm-genre-input-wrap">
                      <input
                        type="text"
                        name="genre"
                        value={form.genre}
                        onChange={handleChange}
                        className="fm-input"
                        placeholder="VD: Hành động, Viễn tưởng"
                      />
                      <select
                        onChange={handleGenreSelect}
                        className="fm-input fm-genre-quick-select"
                        value=""
                      >
                        <option value="" disabled>-- Chọn thêm thể loại nhanh --</option>
                        {categoryOptions.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="fm-field">
                    <label className="fm-label">Đạo diễn</label>
                    <input
                      type="text"
                      name="director"
                      value={form.director}
                      onChange={handleChange}
                      className="fm-input"
                      placeholder="Nhập tên đạo diễn"
                    />
                  </div>
                </div>

                {/* Thời lượng + Ngày khởi chiếu */}
                <div className="fm-field-row">
                  <div className="fm-field">
                    <label className="fm-label">Thời lượng (phút)</label>
                    <input
                      type="number"
                      name="duration"
                      value={form.duration}
                      onChange={handleChange}
                      className="fm-input"
                      placeholder="VD: 120"
                      min={1}
                    />
                  </div>
                  <div className="fm-field">
                    <label className="fm-label">Ngày khởi chiếu</label>
                    <input
                      type="date"
                      name="releaseDate"
                      value={form.releaseDate}
                      onChange={handleChange}
                      className="fm-input"
                    />
                  </div>
                </div>

                {/* Trạng thái + Giới hạn tuổi */}
                <div className="fm-field-row">
                  <div className="fm-field">
                    <label className="fm-label">Trạng thái</label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="fm-input"
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="fm-field">
                    <label className="fm-label">Giới hạn tuổi</label>
                    <select
                      name="ageRating"
                      value={form.ageRating}
                      onChange={handleChange}
                      className="fm-input"
                    >
                      <option value="P">P (Mọi lứa tuổi)</option>
                      <option value="K">K (Dưới 13 kèm người giám hộ)</option>
                      <option value="T13">T13 (Trên 13 tuổi)</option>
                      <option value="T16">T16 (Trên 16 tuổi)</option>
                      <option value="T18">T18 (Trên 18 tuổi)</option>
                    </select>
                  </div>
                </div>

                {/* Poster Preview and Selection */}
                <div className="fm-form-poster-section">
                  <div className="fm-form-poster-preview">
                    {form.posterUrl ? (
                      <img src={form.posterUrl} alt="Poster preview" className="fm-form-preview-img" />
                    ) : (
                      <div className="fm-form-preview-placeholder">Chưa có ảnh</div>
                    )}
                  </div>
                  <div className="fm-form-poster-inputs">
                    <div className="fm-field">
                      <label className="fm-label">Ảnh poster từ thiết bị</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="fm-input fm-input-file"
                      />
                    </div>
                    <div className="fm-field">
                      <label className="fm-label">Hoặc nhập link ảnh poster (URL)</label>
                      <input
                        type="url"
                        name="posterUrl"
                        value={form.posterUrl}
                        onChange={handleChange}
                        className="fm-input"
                        placeholder="https://example.com/poster.jpg"
                      />
                    </div>
                  </div>
                </div>

                {/* Trailer Video URL */}
                <div className="fm-field">
                  <label className="fm-label">Link video trailer (Youtube)</label>
                  <input
                    type="url"
                    name="trailerUrl"
                    value={form.trailerUrl}
                    onChange={handleChange}
                    className="fm-input"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>

                {/* Mô tả phim */}
                <div className="fm-field">
                  <label className="fm-label">Mô tả phim</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="fm-input fm-input--textarea"
                    placeholder="Mô tả tóm tắt nội dung phim..."
                    rows={3}
                  />
                </div>

                {/* Ngôn ngữ + Phụ đề */}
                <div className="fm-field-row">
                  <div className="fm-field">
                    <label className="fm-label">Ngôn ngữ</label>
                    <input
                      type="text"
                      name="language"
                      value={form.language}
                      onChange={handleChange}
                      className="fm-input"
                      placeholder="VD: Tiếng Anh, Tiếng Việt"
                    />
                  </div>
                  <div className="fm-field">
                    <label className="fm-label">Phụ đề</label>
                    <input
                      type="text"
                      name="subtitles"
                      value={form.subtitles}
                      onChange={handleChange}
                      className="fm-input"
                      placeholder="VD: Phụ đề Tiếng Việt"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="fm-modal-actions">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="fm-btn-cancel"
                    disabled={submitting}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="fm-btn-submit"
                    disabled={submitting}
                  >
                    {submitting ? "Đang xử lý..." : editId !== null ? "Cập Nhật" : "Thêm Phim"}
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
   SUB-COMPONENTS (Pure UI)
═══════════════════════════════════════════════════════════ */

function StatCard({ icon, iconBg, iconColor, label, value }) {
  return (
    <div className="fm-stat-card">
      <div
        className="fm-stat-icon"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div className="fm-stat-body">
        <p className="fm-stat-label">{label}</p>
        <p className="fm-stat-value">{value}</p>
      </div>
    </div>
  );
}

function DetailRow({ icon, value }) {
  return (
    <div className="fm-detail-row">
      <span className="fm-detail-icon">{icon}</span>
      <span className="fm-detail-value">{value || "—"}</span>
    </div>
  );
}