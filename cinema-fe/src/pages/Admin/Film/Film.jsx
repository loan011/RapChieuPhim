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
  MdVisibilityOff,
  MdAccessTime,
  MdPerson,
  MdShield,
  MdDelete,
} from "react-icons/md";
import {
  useFilm,
  STATUS_OPTIONS,
  getMovieId,
  getMovieTitle,
  getMovieDuration,
  getMovieDirector,
  getMovieReleaseDate,
  getMovieEndDate,
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
    filterGenre,
    setFilterGenre,
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
    showDetailModal,
    selectedDetailMovie,
    openDetailModal,
    closeDetailModal,
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
            placeholder="Tìm kiếm phim"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="fm-status-select"
          value={filterGenre}
          onChange={(e) => {
            setFilterGenre(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tất cả thể loại</option>
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>

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
                const endDate = getMovieEndDate(movie);
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
                        {endDate !== "Chưa có" && (
                          <DetailRow
                            icon={<MdCalendarMonth />}
                            value={`Kết thúc: ${endDate}`}
                          />
                        )}
                        <DetailRow icon={<MdShield />} value={rating} />
                      </div>

                      {/* Card Actions */}
                      <div className="fm-card-actions">
                        <button
                          className="fm-card-btn fm-card-btn--detail"
                          onClick={() => openDetailModal(movie)}
                        >
                          <MdVisibility size={15} /> Chi tiết
                        </button>
                        <button
                          className="fm-card-btn fm-card-btn--edit"
                          onClick={() => openEditModal(movie)}
                        >
                          <MdEdit size={15} /> Sửa
                        </button>
                        <button
                          className="fm-card-btn fm-card-btn--delete-action"
                          onClick={() => handleDelete(id)}
                          title="Xóa phim"
                        >
                          <MdDelete size={15} /> Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                    required
                  />
                </div>

                {/* Thể loại */}
                <div className="fm-field">
                  <label className="fm-label">Thể loại</label>
                  <div className="fm-genre-input-wrap">
                    <input
                      type="text"
                      name="genre"
                      value={form.genre}
                      onChange={handleChange}
                      className="fm-input"
                    />
                    <select
                      onChange={handleGenreSelect}
                      className="fm-input fm-genre-quick-select"
                      value=""
                    >
                      <option value="" disabled>-- Chọn thể loại  --</option>
                      {categoryOptions.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Đạo diễn */}
                <div className="fm-field">
                  <label className="fm-label">Đạo diễn</label>
                  <input
                    type="text"
                    name="director"
                    value={form.director}
                    onChange={handleChange}
                    className="fm-input"
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
                    />
                  </div>
                </div>

                {/* Thời lượng + Giới hạn tuổi */}
                <div className="fm-field-row">
                  <div className="fm-field">
                    <label className="fm-label">Thời lượng (phút)</label>
                    <input
                      type="number"
                      name="duration"
                      value={form.duration}
                      onChange={handleChange}
                      className="fm-input"
                      min={1}
                    />
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

                {/* Ngày khởi chiếu + Ngày kết thúc */}
                <div className="fm-field-row">
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
                  <div className="fm-field">
                    <label className="fm-label">Ngày kết thúc</label>
                    <input
                      type="date"
                      name="endDate"
                      value={form.endDate}
                      onChange={handleChange}
                      className="fm-input"
                    />
                  </div>
                </div>

                {/* Trạng thái */}
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
                      <label className="fm-label">Ảnh poster</label>
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
                        type="text"
                        name="posterUrl"
                        value={form.posterUrl}
                        onChange={handleChange}
                        className="fm-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Trailer Video URL */}
                <div className="fm-field">
                  <label className="fm-label">Link video trailer (Youtube)</label>
                  <input
                    type="text"
                    name="trailerUrl"
                    value={form.trailerUrl}
                    onChange={handleChange}
                    className="fm-input"
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
                    rows={3}
                  />
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

      {/* ── Movie Detail Modal (Read-only) ── */}
      {showDetailModal && selectedDetailMovie && (
        createPortal(
          <div className="fm-modal-overlay" onClick={closeDetailModal}>
            <div 
              className="fm-modal" 
              onClick={(e) => e.stopPropagation()} 
              style={{ maxWidth: "750px", width: "90%" }}
            >
              {/* Modal Header */}
              <div className="fm-modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #3a3a3c", paddingBottom: "12px", marginBottom: "16px" }}>
                <h3 className="fm-modal-title" style={{ fontSize: "1.25rem", fontWeight: "700", color: "#ffffff", margin: 0 }}>
                  Chi Tiết Phim: {getMovieTitle(selectedDetailMovie)}
                </h3>
                <button 
                  className="fm-modal-close" 
                  onClick={closeDetailModal}
                  style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#aeaeb2" }}
                >
                  &times;
                </button>
              </div>

              {/* Modal Body */}
              <div className="fm-modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  {/* Left Column: Poster & Trailer */}
                  <div>
                    <div style={{ borderRadius: "8px", overflow: "hidden", marginBottom: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                      <img 
                        src={getMoviePoster(selectedDetailMovie)} 
                        alt={getMovieTitle(selectedDetailMovie)} 
                        style={{ width: "100%", height: "260px", objectFit: "cover" }} 
                      />
                    </div>

                    {/* Trailer Video */}
                    <div style={{ marginTop: "16px" }}>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: "600", color: "#ffffff", marginBottom: "8px" }}>Trailer Phim:</h4>
                      {selectedDetailMovie.trailerUrl || selectedDetailMovie.TrailerUrl || selectedDetailMovie.trailerURL || selectedDetailMovie.TrailerURL ? (
                        <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: "8px", overflow: "hidden" }}>
                          <iframe
                            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                            src={getEmbedUrl(selectedDetailMovie.trailerUrl || selectedDetailMovie.TrailerUrl || selectedDetailMovie.trailerURL || selectedDetailMovie.TrailerURL)}
                            title="Trailer"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      ) : (
                        <div style={{ padding: "16px", background: "#2c2c2e", borderRadius: "8px", fontSize: "0.85rem", color: "#aeaeb2", textAlign: "center" }}>
                          Phim này chưa cấu hình link trailer.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Content & Metadata */}
                  <div>
                    <div style={{ marginBottom: "16px" }}>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: "600", color: "#ffffff", marginBottom: "6px" }}>Nội Dung Phim:</h4>
                      <p style={{ fontSize: "0.88rem", color: "#e5e7eb", lineHeight: "1.5", margin: 0, whiteSpace: "pre-wrap" }}>
                        {selectedDetailMovie.description || selectedDetailMovie.Description || "Chưa có nội dung miêu tả."}
                      </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "#2c2c2e", padding: "14px", borderRadius: "8px", border: "1px solid #3a3a3c" }}>
                      <div style={{ fontSize: "0.85rem", color: "#ffffff" }}><span style={{ fontWeight: "600", color: "#aeaeb2" }}>Thể loại:</span> {getMovieGenreText(selectedDetailMovie)}</div>
                      <div style={{ fontSize: "0.85rem", color: "#ffffff" }}><span style={{ fontWeight: "600", color: "#aeaeb2" }}>Đạo diễn:</span> {getMovieDirector(selectedDetailMovie)}</div>
                      <div style={{ fontSize: "0.85rem", color: "#ffffff" }}><span style={{ fontWeight: "600", color: "#aeaeb2" }}>Thời lượng:</span> {getMovieDuration(selectedDetailMovie)}</div>
                      <div style={{ fontSize: "0.85rem", color: "#ffffff" }}><span style={{ fontWeight: "600", color: "#aeaeb2" }}>Giới hạn tuổi:</span> {getMovieAgeRating(selectedDetailMovie)}</div>
                      <div style={{ fontSize: "0.85rem", color: "#ffffff" }}><span style={{ fontWeight: "600", color: "#aeaeb2" }}>Trạng thái:</span> {getMovieStatusDisplayName(selectedDetailMovie)}</div>
                      <div style={{ fontSize: "0.85rem", color: "#ffffff" }}><span style={{ fontWeight: "600", color: "#aeaeb2" }}>Khởi chiếu:</span> {getMovieReleaseDate(selectedDetailMovie)}</div>
                      <div style={{ fontSize: "0.85rem", color: "#ffffff" }}><span style={{ fontWeight: "600", color: "#aeaeb2" }}>Kết thúc:</span> {getMovieEndDate(selectedDetailMovie)}</div>
                      <div style={{ fontSize: "0.85rem", color: "#ffffff" }}><span style={{ fontWeight: "600", color: "#aeaeb2" }}>Ngôn ngữ:</span> {selectedDetailMovie.language || selectedDetailMovie.Language || "Chưa có"}</div>
                      <div style={{ fontSize: "0.85rem", color: "#ffffff" }}><span style={{ fontWeight: "600", color: "#aeaeb2" }}>Phụ đề:</span> {selectedDetailMovie.subtitles || selectedDetailMovie.Subtitles || "Chưa có"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="fm-modal-actions" style={{ marginTop: "18px", borderTop: "1px solid #3a3a3c", paddingTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                <button 
                  type="button" 
                  className="fm-btn-cancel" 
                  onClick={closeDetailModal}
                  style={{ padding: "8px 20px" }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      )}
    </div>
  );
}

function getEmbedUrl(url) {
  if (!url) return "";
  let videoId = "";
  if (url.includes("youtube.com/watch?v=")) {
    videoId = url.split("v=")[1]?.split("&")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0];
  } else if (url.includes("youtube.com/embed/")) {
    return url;
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
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