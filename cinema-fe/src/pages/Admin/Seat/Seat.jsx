import "./Seat.css";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import * as IconsMd from "react-icons/md";
import {
  useSeat,
  SEAT_TYPE_OPTIONS,
  SEAT_STATUS_OPTIONS,
  SEAT_ROW_OPTIONS,
  SEAT_NUMBER_OPTIONS,
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
  MdClose: IconClose,
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

// Group adjacent Couple seats in a row into a single double seat representation
function groupRowSeats(seats) {
  const grouped = [];
  let i = 0;
  while (i < seats.length) {
    const seat = seats[i];
    const type = getSeatType(seat).toLowerCase();

    // Group if current and next seat are both Couple seats of the same row
    if (
      type === "couple" &&
      i + 1 < seats.length &&
      getSeatType(seats[i + 1]).toLowerCase() === "couple"
    ) {
      grouped.push({
        isGroup: true,
        seats: [seat, seats[i + 1]],
        type: "couple",
      });
      i += 2;
    } else {
      grouped.push({
        isGroup: false,
        seat: seat,
        type: type,
      });
      i += 1;
    }
  }
  return grouped;
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

  const [selectedSeat, setSelectedSeat] = useState(null);

  // Reset selected seat when room changes
  useEffect(() => {
    setSelectedSeat(null);
  }, [filterRoom, filterCinemaId]);

  // Keep selectedSeat in sync with list updates (e.g. edit/delete/create)
  useEffect(() => {
    if (selectedSeat) {
      const idStr = String(getSeatId(selectedSeat));
      if (idStr.startsWith("mock-")) {
        // If it's a mock seat, see if a real seat has been created with the same row and number
        const realSeat = selectedRoomSeats.find(
          (s) =>
            getSeatRow(s) === getSeatRow(selectedSeat) &&
            getSeatNumber(s) === getSeatNumber(selectedSeat)
        );
        if (realSeat) {
          setSelectedSeat(realSeat);
        }
      } else {
        // Real seat: sync with updated data, or clear if deleted
        const updatedSeat = selectedRoomSeats.find(
          (s) => String(getSeatId(s)) === String(getSeatId(selectedSeat))
        );
        if (updatedSeat) {
          setSelectedSeat(updatedSeat);
        } else {
          setSelectedSeat(null);
        }
      }
    }
  }, [selectedRoomSeats]);

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

      {/* ── Filter Bar ── */}
      <div className="se-filter-bar se-top-filter-bar">
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
      </div>

      {/* ── Main content grid (1 or 2 columns) ── */}
      <div className={`se-main-grid ${selectedSeat ? "se-main-grid--split" : "se-main-grid--full"}`}>
        
        {/* ── Left Column: Seat Details Panel ── */}
        {selectedSeat && (
          <div className="se-list-col">
            {loading && <p className="se-msg">Đang tải thông tin...</p>}
            {error && <p className="se-msg se-msg--error">{error}</p>}

            {!loading && !error && (
              <div className="se-detail-card">
                <div className="se-detail-card-header">
                  <h5 className="se-detail-title">Thông Tin Chi Tiết Ghế</h5>
                  <button
                    type="button"
                    className="se-detail-close-btn"
                    onClick={() => setSelectedSeat(null)}
                    title="Đóng chi tiết"
                  >
                    <IconClose size={20} />
                  </button>
                </div>
                
                {(() => {
                  const isMock = String(getSeatId(selectedSeat)).startsWith("mock-");
                  const type = getSeatType(selectedSeat);
                  const typeStyle = getTypeStyle(type);
                  const status = getSeatStatus(selectedSeat);
                  const statusBadge = getStatusBadgeStyle(status);

                  return (
                    <div className="se-detail-content">
                      <div className="se-detail-header-row">
                        <div className={`se-detail-seat-badge se-detail-seat-badge--${type.toLowerCase()}`}>
                          {getSeatCode(selectedSeat)}
                        </div>
                        <div className="se-detail-summary">
                          <span className="se-detail-room-name">
                            {isMock ? selectedRoomName : getRoomNameBySeat(selectedSeat, rooms, cinemas)}
                          </span>
                          <span className="se-detail-seat-type">{typeStyle.label}</span>
                        </div>
                      </div>

                      <div className="se-detail-info-list">
                        <div className="se-detail-info-item">
                          <span className="se-detail-info-label">Hàng ghế:</span>
                          <span className="se-detail-info-val se-font-bold">{getSeatRow(selectedSeat)}</span>
                        </div>
                        <div className="se-detail-info-item">
                          <span className="se-detail-info-label">Số ghế:</span>
                          <span className="se-detail-info-val se-font-bold">{getSeatNumber(selectedSeat)}</span>
                        </div>
                        <div className="se-detail-info-item">
                          <span className="se-detail-info-label">Loại ghế:</span>
                          <span className="se-detail-info-val">
                            <span
                              className="se-status-badge"
                              style={{
                                background: typeStyle.dotColor + "15",
                                color: typeStyle.dotColor,
                              }}
                            >
                              {typeStyle.label}
                            </span>
                          </span>
                        </div>
                        <div className="se-detail-info-item">
                          <span className="se-detail-info-label">Giá vé:</span>
                          <span className="se-detail-info-val se-col-price">
                            {formatMoney(getSeatPrice(type))}
                          </span>
                        </div>
                        <div className="se-detail-info-item">
                          <span className="se-detail-info-label">Trạng thái:</span>
                          <span className="se-detail-info-val">
                            {isMock ? (
                              <span className="se-status-badge" style={{ background: "#fff3e0", color: "#e67e00" }}>
                                Chưa khởi tạo
                              </span>
                            ) : (
                              <span
                                className="se-status-badge"
                                style={{
                                  background: statusBadge.bg,
                                  color: statusBadge.color,
                                }}
                              >
                                {statusBadge.label}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {isMock ? (
                        <div className="se-detail-actions">
                          <button
                            type="button"
                            className="se-detail-btn se-detail-btn--edit"
                            style={{ background: "#f97316", color: "#fff", borderColor: "#f97316" }}
                            onClick={() =>
                              openAddModal({
                                roomId: filterRoom || (rooms[0] ? getRoomId(rooms[0]) : ""),
                                seatRow: getSeatRow(selectedSeat),
                                seatNumber: getSeatNumber(selectedSeat),
                                seatType: getSeatType(selectedSeat),
                                isActive: true,
                              })
                            }
                          >
                            <IconAdd size={16} /> Khởi tạo ghế này
                          </button>
                        </div>
                      ) : (
                        <div className="se-detail-actions">
                          <button
                            type="button"
                            className="se-detail-btn se-detail-btn--edit"
                            onClick={() => openEditModal(selectedSeat)}
                          >
                            <IconEdit size={16} /> Chỉnh sửa ghế
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── Right Column: Seat Map Grid ── */}
        <div className="se-map-col">
          <div className="se-map-card">
            <h6 className="se-map-title">Sơ đồ ghế – {selectedRoomName}</h6>

            {/* Legend indicators */}
            <div className="se-map-legend">
              <div className="se-legend-item">
                <span className="se-legend-box se-legend-box--standard" />
                <div className="se-legend-info-col">
                  <span className="se-legend-txt">Ghế thường</span>
                  <span className="se-legend-price">70.000đ</span>
                </div>
              </div>
              <div className="se-legend-item">
                <span className="se-legend-box se-legend-box--vip" />
                <div className="se-legend-info-col">
                  <span className="se-legend-txt">Ghế VIP</span>
                  <span className="se-legend-price">100.000đ</span>
                </div>
              </div>
              <div className="se-legend-item">
                <span className="se-legend-box se-legend-box--couple" />
                <div className="se-legend-info-col">
                  <span className="se-legend-txt">Ghế Couple</span>
                  <span className="se-legend-price">150.000đ</span>
                </div>
              </div>
              <div className="se-legend-item">
                <span className="se-legend-box se-legend-box--maintenance" />
                <div className="se-legend-info-col">
                  <span className="se-legend-txt">Ghế Bảo trì</span>
                  <span className="se-legend-price">Không bán</span>
                </div>
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
                      {groupRowSeats(row.seats).map((item, idx) => {
                        if (item.isGroup) {
                          const [seat1, seat2] = item.seats;
                          const rowName = row.rowName;
                          const num1 = getSeatNumber(seat1);
                          const num2 = getSeatNumber(seat2);
                          const labelText = `${rowName}${num1} ${rowName}${num2}`;
                          
                          const isMaintenance = getSeatStatus(seat1) === "Bảo trì" || getSeatStatus(seat2) === "Bảo trì";
                          const isSelected = selectedSeat && (
                            String(getSeatId(selectedSeat)) === String(getSeatId(seat1)) ||
                            String(getSeatId(selectedSeat)) === String(getSeatId(seat2))
                          );
                          
                          let seatClass = "se-seat-box se-seat-box--couple se-seat-box--couple-double";
                          if (isMaintenance) {
                            seatClass += " se-seat-box--maintenance";
                          }
                          
                          return (
                            <div
                              key={getSeatId(seat1) || idx}
                              className={`${seatClass}${isSelected ? " se-seat-box--selected" : ""}`}
                              title={`Hàng ${rowName} - Ghế ${labelText} (COUPLE)`}
                              onClick={() => setSelectedSeat(seat1)}
                              style={{ cursor: "pointer" }}
                            >
                              <span className="se-seat-lbl">{labelText}</span>
                            </div>
                          );
                        } else {
                          const seat = item.seat;
                          const type = getSeatType(seat).toLowerCase();
                          const seatCode = getSeatCode(seat);
                          const numOnly = getSeatNumber(seat);
                          
                          // Determine label inside seat first
                          let labelText = numOnly ? String(numOnly).padStart(2, "0") : seatCode;
                          if (type === "couple") {
                            const rowName = row.rowName;
                            if (seatCode.includes("-")) {
                              const parts = seatCode.replace(/[A-Za-z]/g, "").split("-");
                              if (parts.length === 2) {
                                const num1 = parts[0].padStart(2, "0");
                                const num2 = parts[1].padStart(2, "0");
                                labelText = `${rowName}${num1} ${rowName}${num2}`;
                              } else {
                                labelText = seatCode;
                              }
                            } else {
                              labelText = seatCode.startsWith(rowName) ? seatCode : `${rowName}${labelText}`;
                            }
                          }

                          const isMaintenance = getSeatStatus(seat) === "Bảo trì";

                          let seatClass = "se-seat-box se-seat-box--standard";
                          if (type === "vip") {
                            seatClass = "se-seat-box se-seat-box--vip";
                          } else if (type === "couple") {
                            const isDouble = labelText.includes("-") || labelText.includes(" ");
                            seatClass = `se-seat-box se-seat-box--couple${isDouble ? " se-seat-box--couple-double" : ""}`;
                          }

                          if (isMaintenance) {
                            seatClass += " se-seat-box--maintenance";
                          }

                          const isSelected = selectedSeat && getSeatCode(selectedSeat) === getSeatCode(seat);

                          return (
                            <div
                              key={getSeatId(seat)}
                              className={`${seatClass}${isSelected ? " se-seat-box--selected" : ""}`}
                              title={`Hàng ${row.rowName} - Ghế ${labelText} (${type.toUpperCase()})`}
                              onClick={() => setSelectedSeat(seat)}
                              style={{ cursor: "pointer" }}
                            >
                              <span className="se-seat-lbl">{labelText}</span>
                            </div>
                          );
                        }
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
                    <select
                      name="seatRow"
                      value={form.seatRow}
                      onChange={handleChange}
                      className="se-input"
                      required
                    >
                      <option value="">-- Chọn hàng ghế --</option>
                      {SEAT_ROW_OPTIONS.map((row) => (
                        <option key={row.value} value={row.value}>
                          {row.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="se-field">
                    <label className="se-label">
                      Số Thứ Tự Ghế <span className="se-required">*</span>
                    </label>
                    <select
                      name="seatNumber"
                      value={String(form.seatNumber)}
                      onChange={handleChange}
                      className="se-input"
                      required
                    >
                      <option value="">-- Chọn số ghế --</option>
                      {SEAT_NUMBER_OPTIONS.map((number) => (
                        <option key={number.value} value={number.value}>
                          {number.label}
                        </option>
                      ))}
                    </select>
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