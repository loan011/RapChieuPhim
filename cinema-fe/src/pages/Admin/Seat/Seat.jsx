import "./Seat.css";
import { createPortal } from "react-dom";
import * as IconsMd from "react-icons/md";
import {
  useSeat,
  SEAT_TYPE_OPTIONS,
  SEAT_STATUS_OPTIONS,
  getSeatId,
  getSeatCode,
  getSeatRow,
  getSeatNumber,
  getSeatType,
  getSeatStatus,
  getRoomId,
  getRoomFullName,
  getRoomNameBySeat,
  getCinemaId,
  getCinemaName,
  getRoomCinemaId,
  PAGE_SIZE,
} from "./useSeat.js";

const {
  MdEventSeat: IconSeat,
  MdFavorite: IconHeart,
  MdSearch: IconSearch,
  MdAdd: IconAdd,
  MdEdit: IconEdit,
  MdDelete: IconDelete,
} = IconsMd;

// Helper for row list status badges
function getStatusBadgeStyle(status) {
  if (status === "Hoạt động" || status === "Đang hoạt động" || status === "true" || status === true) {
    return { bg: "#e6f9f0", color: "#16a34a", label: "Đang hoạt động" };
  }
  if (status === "Bảo trì") {
    return { bg: "#fff3e0", color: "#e67e00", label: "Bảo trì" };
  }
  return { bg: "#fef2f2", color: "#dc2626", label: "Không hoạt động" };
}

// Helper for type dots and badges
function getTypeStyle(type) {
  const t = String(type).toLowerCase();
  if (t === "vip") {
    return { color: "#8b5cf6", dotColor: "#8b5cf6", label: "VIP" };
  }
  if (t === "couple") {
    return { color: "#ec4899", dotColor: "#ec4899", label: "Couple" };
  }
  return { color: "#10b981", dotColor: "#10b981", label: "Thường" };
}

// Format currency
function formatMoney(value) {
  const n = Number(value);
  return Number.isNaN(n) ? "0đ" : `${n.toLocaleString("vi-VN")}đ`;
}

// Seat ticket price mapper based on type
function getSeatPrice(type) {
  const t = String(type).toLowerCase();
  if (t === "vip") return 100000;
  if (t === "couple") return 150000;
  return 70000;
}

export default function Seat() {
  const {
    rooms,
    cinemas,
    loading,
    error,

    /* Filters */
    search,
    setSearch,
    filterCinemaId,
    setFilterCinemaId,
    filterRoom,
    setFilterRoom,
    filterType,
    setFilterType,
    filtered,

    /* Pagination */
    page,
    setPage,
    pageItems,
    totalPages,
    safePage,

    /* Stats */
    dynamicStats,

    /* Seat map layout elements */
    selectedRoomName,
    selectedRoomSeats,
    seatMapLayout,
    mockSeatLayout,

    /* Form actions */
    showModal,
    editId,
    form,
    submitting,
    formError,
    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmit,
    handleDelete,
  } = useSeat();

  // Determine active layout
  const activeLayout = seatMapLayout.length > 0 ? seatMapLayout : mockSeatLayout;

  return (
    <div className="se-wrapper">
      {/* ── Header ── */}
      <div className="se-header">
        <h4 className="se-title">Quản Lý Ghế Ngồi</h4>
        <button className="se-btn-add" onClick={openAddModal}>
          <IconAdd size={18} /> Thêm ghế
        </button>
      </div>

      {/* ── Stats row (4 cards) ── */}
      <div className="se-stats-row">
        <StatCard
          icon={<IconSeat size={28} />}
          iconBg="#f0f4ff"
          iconColor="#3b82f6"
          label="Tổng số ghế"
          value={dynamicStats.total}
        />
        <StatCard
          icon={<IconSeat size={28} />}
          iconBg="#e6f9f0"
          iconColor="#10b981"
          label="Ghế thường"
          value={dynamicStats.standard}
        />
        <StatCard
          icon={<IconSeat size={28} />}
          iconBg="#f5f3ff"
          iconColor="#8b5cf6"
          label="Ghế VIP"
          value={dynamicStats.vip}
        />
        <StatCard
          icon={<IconHeart size={26} />}
          iconBg="#fdf2f8"
          iconColor="#ec4899"
          label="Ghế Couple"
          value={dynamicStats.couple}
        />
      </div>

      {/* ── Main content grid (2 columns) ── */}
      <div className="se-main-grid">
        
        {/* ── Left Column: Seat List Table ── */}
        <div className="se-list-col">
          {/* Filters */}
          <div className="se-filter-bar">
            <select
              className="se-filter-select"
              value={filterCinemaId}
              onChange={(e) => {
                const cinemaId = e.target.value;
                setFilterCinemaId(cinemaId);
                const cinemaRooms = rooms.filter(r => String(getRoomCinemaId(r)) === cinemaId);
                if (cinemaRooms.length > 0) {
                  setFilterRoom(String(getRoomId(cinemaRooms[0])));
                } else {
                  setFilterRoom("");
                }
                setPage(1);
              }}
            >
              {cinemas.map((c) => (
                <option key={getCinemaId(c)} value={getCinemaId(c)}>
                  {getCinemaName(c)}
                </option>
              ))}
            </select>

            <select
              className="se-filter-select"
              value={filterRoom}
              onChange={(e) => {
                setFilterRoom(e.target.value);
                setPage(1);
              }}
            >
              {rooms
                .filter(
                  (r) =>
                    !filterCinemaId ||
                    String(getRoomCinemaId(r)) === String(filterCinemaId)
                )
                .map((room) => (
                  <option key={getRoomId(room)} value={getRoomId(room)}>
                    {getRoomFullName(room, cinemas)}
                  </option>
                ))}
            </select>

            <select
              className="se-filter-select"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả loại ghế</option>
              {SEAT_TYPE_OPTIONS.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <div className="se-search-wrap">
              <IconSearch size={18} className="se-search-icon" />
              <input
                type="text"
                className="se-search-input"
                placeholder="Tìm kiếm ghế..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Table Card */}
          {loading && <p className="se-msg">Đang tải danh sách ghế...</p>}
          {error && <p className="se-msg se-msg--error">{error}</p>}

          {!loading && !error && (
            <>
              <div className="se-table-card">
                <div className="se-table-responsive">
                  <table className="se-table">
                    <thead>
                      <tr>
                        <th style={{ width: "50px" }}>STT</th>
                        <th>Hàng</th>
                        <th>Số ghế</th>
                        <th>Loại ghế</th>
                        <th>Giá vé (đ)</th>
                        <th>Trạng thái</th>
                        <th style={{ width: "90px", textAlign: "center" }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="se-table-empty">
                            Không tìm thấy ghế nào phù hợp.
                          </td>
                        </tr>
                      ) : (
                        pageItems.map((seat, index) => {
                          const id = getSeatId(seat);
                          const row = getSeatRow(seat);
                          const number = getSeatNumber(seat);
                          const type = getSeatType(seat);
                          const typeStyle = getTypeStyle(type);
                          const status = getSeatStatus(seat);
                          const statusBadge = getStatusBadgeStyle(status);
                          const globalIdx = index + 1 + (safePage - 1) * PAGE_SIZE;

                          return (
                            <tr key={id || index}>
                              <td className="se-col-idx">{globalIdx}</td>
                              <td className="se-col-row">{row || "—"}</td>
                              <td className="se-col-num">{number || "—"}</td>
                              <td>
                                <div className="se-type-cell">
                                  <span
                                    className="se-type-dot"
                                    style={{ background: typeStyle.dotColor }}
                                  />
                                  <span className="se-type-label">{typeStyle.label}</span>
                                </div>
                              </td>
                              <td className="se-col-price">
                                {formatMoney(getSeatPrice(type))}
                              </td>
                              <td>
                                <span
                                  className="se-status-badge"
                                  style={{
                                    background: statusBadge.bg,
                                    color: statusBadge.color,
                                  }}
                                >
                                  {statusBadge.label}
                                </span>
                              </td>
                              <td>
                                <div className="se-row-actions">
                                  <button
                                    className="se-row-btn se-row-btn--edit"
                                    onClick={() => openEditModal(seat)}
                                    title="Sửa ghế"
                                  >
                                    <IconEdit size={14} />
                                  </button>
                                  <button
                                    className="se-row-btn se-row-btn--delete"
                                    onClick={() => handleDelete(id)}
                                    title="Xóa ghế"
                                  >
                                    <IconDelete size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination info and bar */}
              {filtered.length > 0 && (
                <div className="se-pagination-footer">
                  <span className="se-footer-info">
                    Hiển thị {Math.min((safePage - 1) * PAGE_SIZE + 1, filtered.length)}–
                    {Math.min(safePage * PAGE_SIZE, filtered.length)} của {filtered.length} ghế
                  </span>
                  <div className="se-pagination">
                    <button
                      className="se-page-btn"
                      disabled={safePage === 1}
                      onClick={() => setPage(safePage - 1)}
                    >
                      Trước
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        className={`se-page-btn${
                          p === safePage ? " se-page-btn--active" : ""
                        }`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      className="se-page-btn"
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
        </div>

        {/* ── Right Column: Seat Map Grid ── */}
        <div className="se-map-col">
          <div className="se-map-card">
            <h6 className="se-map-title">Sơ đồ ghế – {selectedRoomName}</h6>

            {/* Legend indicators */}
            <div className="se-map-legend">
              <div className="se-legend-item">
                <span className="se-legend-box se-legend-box--standard" />
                <span className="se-legend-txt">Ghế thường</span>
              </div>
              <div className="se-legend-item">
                <span className="se-legend-box se-legend-box--vip" />
                <span className="se-legend-txt">Ghế VIP</span>
              </div>
              <div className="se-legend-item">
                <span className="se-legend-box se-legend-box--couple" />
                <span className="se-legend-txt">Ghế Couple</span>
              </div>
            </div>

            {/* Curved Screen element */}
            <div className="se-screen-container">
              <div className="se-screen-bar" />
              <p className="se-screen-txt">MÀN HÌNH</p>
            </div>

            {/* Seats Layout Matrix */}
            <div className="se-grid-matrix">
              {activeLayout.map((row) => {
                const isCoupleRow = row.rowName === "I";

                return (
                  <div className="se-matrix-row" key={row.rowName}>
                    {/* Left row label */}
                    <span className="se-row-label">{row.rowName}</span>

                    {/* Seat list */}
                    <div className="se-row-seats-flex">
                      {row.seats.map((seat) => {
                        const type = getSeatType(seat).toLowerCase();
                        const seatCode = getSeatCode(seat);
                        const numOnly = getSeatNumber(seat);
                        
                        // Determine label inside seat first
                        let labelText = numOnly ? String(numOnly).padStart(2, "0") : seatCode;
                        if (type === "couple") {
                          labelText = seatCode.includes("-") ? seatCode : `${labelText} ❤`;
                        }

                        let seatClass = "se-seat-box se-seat-box--standard";
                        if (type === "vip") {
                          seatClass = "se-seat-box se-seat-box--vip";
                        } else if (type === "couple") {
                          const isDouble = labelText.includes("-");
                          seatClass = `se-seat-box se-seat-box--couple${isDouble ? " se-seat-box--couple-double" : ""}`;
                        }


                        return (
                          <div
                            key={getSeatId(seat)}
                            className={seatClass}
                            title={`Hàng ${row.rowName} - Ghế ${labelText} (${type.toUpperCase()})`}
                          >
                            <span className="se-seat-lbl">{labelText}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right row label */}
                    <span className="se-row-label">{row.rowName}</span>
                  </div>
                );
              })}
            </div>

            {/* Mini summary footer inside map card */}
            <div className="se-map-footer">
              <div className="se-mini-stat se-mini-stat--standard">
                <IconSeat size={18} />
                <div className="se-mini-stat-info">
                  <span className="se-mini-stat-label">Ghế thường</span>
                  <span className="se-mini-stat-val">{dynamicStats.standard}</span>
                </div>
              </div>
              <div className="se-mini-stat se-mini-stat--vip">
                <IconSeat size={18} />
                <div className="se-mini-stat-info">
                  <span className="se-mini-stat-label">Ghế VIP</span>
                  <span className="se-mini-stat-val">{dynamicStats.vip}</span>
                </div>
              </div>
              <div className="se-mini-stat se-mini-stat--couple">
                <IconHeart size={16} />
                <div className="se-mini-stat-info">
                  <span className="se-mini-stat-label">Ghế Couple</span>
                  <span className="se-mini-stat-val">{dynamicStats.couple}</span>
                </div>
              </div>
            </div>
            <div className="se-map-total-row">
              Tổng số ghế: <strong>{dynamicStats.total}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* ── Modal Add / Edit ── */}
      {showModal &&
        createPortal(
          <div className="se-modal-overlay">
            <div className="se-modal">
              <h5 className="se-modal-title">
                {editId !== null ? "Cập Nhật Ghế" : "Thêm Ghế Ngồi Mới"}
              </h5>
              {formError && <p className="se-form-error">{formError}</p>}

              <form onSubmit={handleSubmit} className="se-form">
                {/* Phòng chiếu */}
                <div className="se-field">
                  <label className="se-label">
                    Phòng Chiếu <span className="se-required">*</span>
                  </label>
                  <select
                    name="roomId"
                    value={form.roomId}
                    onChange={handleChange}
                    className="se-input"
                    required
                  >
                    <option value="">-- Chọn phòng chiếu --</option>
                    {rooms.map((room) => (
                      <option key={getRoomId(room)} value={getRoomId(room)}>
                        {getRoomFullName(room, cinemas)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hàng & Số ghế */}
                <div className="se-field-row">
                  <div className="se-field">
                    <label className="se-label">
                      Hàng Ghế <span className="se-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="seatRow"
                      value={form.seatRow}
                      onChange={handleChange}
                      placeholder="VD: A, B"
                      className="se-input"
                      maxLength={2}
                      required
                    />
                  </div>
                  <div className="se-field">
                    <label className="se-label">
                      Số Thứ Tự Ghế <span className="se-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="seatNumber"
                      value={form.seatNumber}
                      onChange={handleChange}
                      placeholder="VD: 01 hoặc 01-02"
                      className="se-input"
                      required
                    />
                  </div>
                </div>

                {/* Loại ghế */}
                <div className="se-field">
                  <label className="se-label">Loại Ghế</label>
                  <select
                    name="seatType"
                    value={form.seatType}
                    onChange={handleChange}
                    className="se-input"
                  >
                    {SEAT_TYPE_OPTIONS.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Trạng thái */}
                <div className="se-field">
                  <label className="se-label">Trạng Thái hoạt động</label>
                  <select
                    name="isActive"
                    value={String(form.isActive)}
                    onChange={handleChange}
                    className="se-input"
                  >
                    {SEAT_STATUS_OPTIONS.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="se-modal-actions">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="se-btn-cancel"
                    disabled={submitting}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="se-btn-submit"
                    disabled={submitting}
                  >
                    {submitting ? "Đang lưu..." : editId !== null ? "Cập Nhật" : "Thêm Ghế"}
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
   STAT CARD SUB-COMPONENT (Pure UI)
═══════════════════════════════════════════════════════════ */

function StatCard({ icon, iconBg, iconColor, label, value }) {
  return (
    <div className="se-stat-card">
      <div
        className="se-stat-icon"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div className="se-stat-body">
        <p className="se-stat-label">{label}</p>
        <p className="se-stat-value">{value}</p>
      </div>
    </div>
  );
}