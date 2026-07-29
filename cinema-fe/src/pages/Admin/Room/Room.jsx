import "./Room.css";
import { createPortal } from "react-dom";
import {
  MdAdd,
  MdOndemandVideo,
  MdEdit,
  MdMoreVert,
  MdDelete,
  MdClose
} from "react-icons/md";
import { useRoomAdmin, getRoomCinemaName, getStatusInfo, groupRowSeats } from "./useRoom";
import {
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
  getRoomFullName
} from "../Seat/useSeat";

export default function RoomAdmin() {
  const {
    rooms,
    cinemas,
    loadingRooms,
    showRoomModal,
    isEditingRoom,
    roomForm,
    roomFormError,
    submittingRoom,
    roomTypeOptions,
    cinemaOptions,
    handleRoomChange,
    openAddRoomModal,
    openEditRoom,
    closeRoomModal,
    handleDeleteRoom,

    showSeatModal,
    editSeatId,
    seatForm,
    submittingSeat,
    seatFormError,
    openAddSeatModal,
    openEditSeatModal,
    closeSeatModal,
    handleSeatChange,
    handleSeatSubmit,
    handleDeleteSeat,

    selectedRoomId,
    setSelectedRoomId,
    selectedCinemaFilter,
    setSelectedCinemaFilter,
    searchQuery,
    setSearchQuery,
    activeMenuId,
    setActiveMenuId,
    selectedSeat,
    setSelectedSeat,

    showLayoutEditor,
    setShowLayoutEditor,
    layoutRowTypes,
    setLayoutRowTypes,
    setSeatOverrides,
    seatOverrides,
    editMode,
    setEditMode,
    expandedRow,
    setExpandedRow,
    layoutSaving,
    layoutError,
    setLayoutError,

    priceStdWeekday,
    setPriceStdWeekday,
    priceStdWeekend,
    setPriceStdWeekend,
    priceVipWeekday,
    setPriceVipWeekday,
    priceVipWeekend,
    setPriceVipWeekend,
    priceCoupleWeekday,
    setPriceCoupleWeekday,
    priceCoupleWeekend,
    setPriceCoupleWeekend,
    syncAllRooms,
    setSyncAllRooms,

    filteredRooms,
    handleCustomRoomSubmit,
    menuRef,
    handleSelectRoom,
    activeLayout,
    activeRoomType,
    getRoomPriceText,
    getSeatPrice,
    getLateSeatPrice,
    totalCount,
    activeCount,
    maintenanceCount,

    isSeatBooked,
    openLayoutEditor,
    getEffectiveSeatType,
    getEffectiveSeatStatus,
    getRowDisplayType,
    handleSeatTypeOverride,
    handleSeatStatusOverride,
    handleSaveLayoutRowTypes,
  } = useRoomAdmin();

  return (
    <div className="rm-wrapper">
      {/* ── Header ── */}
      <div className="rm-header-top">
        <div>
          <div className="rm-subtitle">Cơ sở vật chất</div>
          <div className="rm-logo-area">
            <h4 className="rm-title-main">Quản Lý Phòng Chiếu</h4>
          </div>
        </div>
        <button className="rm-btn-add-new" onClick={openAddRoomModal}>
          <MdAdd size={20} />
          Thêm Phòng
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="rm-stats-row-new">
        <div className="rm-stat-card-new red">
          <p className="rm-stat-label-new">Tổng Số Phòng</p>
          <p className="rm-stat-value-new">{totalCount}</p>
        </div>
        <div className="rm-stat-card-new yellow">
          <p className="rm-stat-label-new">Đang Sử Dụng</p>
          <p className="rm-stat-value-new">{activeCount}</p>
        </div>
        <div className="rm-stat-card-new purple">
          <p className="rm-stat-label-new">Bảo Trì</p>
          <p className="rm-stat-value-new">{maintenanceCount}</p>
        </div>
      </div>

      {/* ── Filter & Search Bar ── */}
      <div className="rm-filter-bar-new">
        <div className="rm-filters-left">
          <select
            className="rm-select-dark"
            value={selectedCinemaFilter}
            onChange={(e) => {
              setSelectedCinemaFilter(e.target.value);
              setSelectedRoomId("");
            }}
          >
            {cinemaOptions.map((opt) => (
              <option key={opt.value} value={String(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          className="rm-search-dark"
          placeholder="Tìm phòng..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* ── Rooms Table ── */}
      <div className="rm-table-card">
        <table className="rm-table">
          <thead>
            <tr>
              <th className="rm-th">Tên phòng</th>
              <th className="rm-th">Sức chứa</th>
              <th className="rm-th">Loại hình</th>
              <th className="rm-th">Giá Thường</th>
              <th className="rm-th">Giá VIP</th>
              <th className="rm-th">Giá Couple</th>
              <th className="rm-th">Trạng thái</th>
              <th className="rm-th" style={{ textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loadingRooms ? (
              <tr>
                <td colSpan={9} className="rm-td" style={{ textAlign: "center", padding: 30 }}>
                  Đang tải dữ liệu phòng...
                </td>
              </tr>
            ) : filteredRooms.length === 0 ? (
              <tr>
                <td colSpan={9} className="rm-td" style={{ textAlign: "center", padding: 30 }}>
                  Không tìm thấy phòng phù hợp.
                </td>
              </tr>
            ) : (
              filteredRooms.map((room, idx) => {
                const id = String(getRoomId(room) ?? idx);
                const isSelected = selectedRoomId === id;
                const status = getStatusInfo(room);
                const roomType = room?.roomType ?? room?.RoomType ?? "2D Standard";
                const totalSeats = room?.totalSeats ?? room?.TotalSeats ?? room?.capacity ?? 0;
                
                let badgeClass = "rm-badge-type standard";
                if (roomType.toUpperCase().includes("IMAX")) badgeClass = "rm-badge-type imax";
                else if (roomType.toUpperCase().includes("DOLBY")) badgeClass = "rm-badge-type dolby";
                else if (roomType.toUpperCase().includes("VIP")) badgeClass = "rm-badge-type vip";

                return (
                  <tr
                    key={id}
                    className={`rm-tr ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelectRoom(id)}
                  >
                    <td className="rm-td">
                      <div className="rm-room-name-cell">
                        <span className="rm-room-icon"><MdOndemandVideo /></span>
                        <span>{room?.roomName ?? room?.RoomName ?? "Phòng"}</span>
                      </div>
                    </td>
                    <td className="rm-td">{totalSeats} Ghế</td>
                    <td className="rm-td">
                      <span className={badgeClass}>{roomType}</span>
                    </td>
                    <td className="rm-td">{getRoomPriceText(room, "std")}</td>
                    <td className="rm-td">{getRoomPriceText(room, "vip")}</td>
                    <td className="rm-td">{getRoomPriceText(room, "couple")}</td>
                    <td className="rm-td">
                      <div className="rm-status-dot-wrap">
                        <span className={`rm-status-dot ${status.dotClass}`} />
                        <span>{status.label}</span>
                      </div>
                    </td>
                    <td className="rm-td" style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                      <div className="rm-action-menu-container">
                        <button
                          className="rm-action-btn"
                          onClick={() => setActiveMenuId(activeMenuId === id ? null : id)}
                        >
                          <MdMoreVert size={20} />
                        </button>
                        {activeMenuId === id && (
                          <div className="rm-action-dropdown" ref={menuRef}>
                            <button
                              className="rm-dropdown-item"
                              onClick={() => {
                                openEditRoom(room);
                                setActiveMenuId(null);
                              }}
                            >
                              <MdEdit /> Sửa phòng
                            </button>
                            <button
                              className="rm-dropdown-item delete"
                              onClick={() => {
                                if (window.confirm("Bạn có chắc chắn muốn xóa phòng này?")) {
                                  handleDeleteRoom(id);
                                }
                                setActiveMenuId(null);
                              }}
                            >
                              <MdDelete /> Xóa phòng
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Seat Map & Revenue Panel ── */}
      {selectedRoomId && (
        <div className="rm-split-layout">
          {/* Left Column: Seat Map */}
          <div className="rm-map-card">
            <div className="rm-map-title-row">
              <h5 className="rm-map-title">
                Sơ Đồ Ghế - {
                  rooms.find(r => String(getRoomId(r)) === selectedRoomId)?.roomName ?? "Phòng"
                }
              </h5>
              
              <div className="rm-map-legend">
                <div className="rm-legend-item">
                  <span className="rm-legend-box empty" />
                  <span className="rm-legend-txt">Thường</span>
                </div>
                <div className="rm-legend-item">
                  <span className="rm-legend-box vip" />
                  <span className="rm-legend-txt">VIP</span>
                </div>
                <div className="rm-legend-item">
                  <span className="rm-legend-box couple" />
                  <span className="rm-legend-txt">Couple</span>
                </div>
                <div className="rm-legend-item">
                  <span className="rm-legend-box maintenance" />
                  <span className="rm-legend-txt">Bảo trì</span>
                </div>
              </div>
            </div>

            {/* Screen */}
            <div className="rm-screen-container">
              <div className="rm-screen-bar" />
              <p className="rm-screen-txt">MÀN HÌNH</p>
            </div>

            {/* Seats Layout Matrix */}
            <div className="rm-grid-matrix">
              {activeLayout.length > 0 ? (
                activeLayout.map((row) => {
                  return (
                    <div className="rm-matrix-row" key={row.rowName}>
                    <span className="rm-row-label">{row.rowName}</span>
                    <div className="rm-row-seats-flex">
                      {groupRowSeats(row.seats, getSeatType).map((item, idx) => {
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
                          
                          let seatClass = "rm-seat-box couple";
                          if (isMaintenance) seatClass += " maintenance";
                          if (isSelected) seatClass += " selected";

                          return (
                            <div
                              key={getSeatId(seat1) || idx}
                              className={seatClass}
                              title={`Hàng ${rowName} - Ghế ${labelText} (Couple)`}
                              onClick={() => setSelectedSeat(seat1)}
                            >
                              <span className="rm-seat-lbl">{labelText}</span>
                            </div>
                          );
                        } else {
                          const seat = item.seat;
                          const type = getSeatType(seat).toLowerCase();
                          const seatCode = getSeatCode(seat);
                          const numOnly = getSeatNumber(seat);
                          
                          let labelText = numOnly ? String(numOnly).padStart(2, "0") : seatCode;
                          const isMaintenance = getSeatStatus(seat) === "Bảo trì";
                          
                          let seatClass = "rm-seat-box standard";
                          if (type === "vip") seatClass = "rm-seat-box vip";
                          else if (type === "couple") seatClass = "rm-seat-box couple";

                          if (isMaintenance) seatClass += " maintenance";

                          const isSelected = selectedSeat && getSeatCode(selectedSeat) === getSeatCode(seat);
                          if (isSelected) seatClass += " selected";

                          return (
                            <div
                              key={getSeatId(seat)}
                              className={seatClass}
                              title={`Ghế ${seatCode} (${type.toUpperCase()})`}
                              onClick={() => setSelectedSeat(seat)}
                            >
                              <span className="rm-seat-lbl">{labelText}</span>
                            </div>
                          );
                        }
                      })}
                    </div>
                    <span className="rm-row-label">{row.rowName}</span>
                  </div>
                  );
                })
              ) : (
                <div style={{ color: "#aeaeb2", padding: "40px 0", fontSize: "0.9rem", textAlign: "center" }}>
                  Chưa có dữ liệu ghế cho phòng này.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Panel details */}
          <div className="rm-side-panel">
            <button
              className="rm-btn-side rm-btn-side-primary"
              onClick={() => openAddSeatModal({ roomId: selectedRoomId })}
              style={{ padding: "12px", fontSize: "0.95rem" }}
            >
              <MdAdd size={20} /> Thêm ghế mới
            </button>

            <button
              onClick={openLayoutEditor}
              style={{
                padding: "12px", fontSize: "0.95rem",
                background: "rgba(99,102,241,0.15)",
                border: "1.5px solid rgba(99,102,241,0.5)",
                color: "#a5b4fc", borderRadius: "10px",
                display: "flex", alignItems: "center", gap: "8px",
                cursor: "pointer", width: "100%", justifyContent: "center",
                fontWeight: 600, transition: "all 0.2s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.15)"; }}
            >
              <MdEdit size={18} /> Chỉnh sửa sơ đồ ghế
            </button>

            {/* Seat detail if selected */}
            <div className="rm-side-card" style={{ flex: 1 }}>
              <h6 className="rm-side-title">
                {selectedSeat ? "Chi Tiết Ghế Ngồi" : "Chọn Ghế Để Xem"}
              </h6>

              {selectedSeat ? (
                <div className="rm-detail-info-list">
                  <div className="rm-detail-info-item">
                    <span className="rm-detail-info-label">Mã ghế:</span>
                    <span className="rm-detail-info-val text-red-500">{getSeatCode(selectedSeat)}</span>
                  </div>
                  <div className="rm-detail-info-item">
                    <span className="rm-detail-info-label">Hàng ghế:</span>
                    <span className="rm-detail-info-val">{getSeatRow(selectedSeat)}</span>
                  </div>
                  <div className="rm-detail-info-item">
                    <span className="rm-detail-info-label">Số thứ tự:</span>
                    <span className="rm-detail-info-val">{getSeatNumber(selectedSeat)}</span>
                  </div>
                  <div className="rm-detail-info-item">
                    <span className="rm-detail-info-label">Loại ghế:</span>
                    <span className="rm-detail-info-val">{getSeatType(selectedSeat)}</span>
                  </div>
                  <div className="rm-detail-info-item">
                    <span className="rm-detail-info-label">Giá vé:</span>
                    <span className="rm-detail-info-val text-green-500 font-bold">
                      {getSeatPrice(getSeatType(selectedSeat), activeRoomType)}
                    </span>
                  </div>
                  <div className="rm-detail-info-item">
                    <span className="rm-detail-info-label">Suất khuya (sau 21h):</span>
                    <span className="rm-detail-info-val text-yellow-500 font-bold">
                      {getLateSeatPrice(getSeatType(selectedSeat), activeRoomType)}
                    </span>
                  </div>
                  <div className="rm-detail-info-item">
                    <span className="rm-detail-info-label">Trạng thái:</span>
                    <span className="rm-detail-info-val">{getSeatStatus(selectedSeat)}</span>
                  </div>

                  <div className="rm-detail-actions">
                    {String(getSeatId(selectedSeat)).startsWith("mock-") ? (
                      <button
                        className="rm-btn-side rm-btn-side-primary"
                        onClick={() => openAddSeatModal({
                          roomId: selectedRoomId,
                          seatRow: getSeatRow(selectedSeat),
                          seatNumber: getSeatNumber(selectedSeat),
                          seatType: getSeatType(selectedSeat),
                          isActive: true
                        })}
                      >
                        Khởi tạo ghế
                      </button>
                    ) : (
                      <>
                        <button
                          className="rm-btn-side rm-btn-side-secondary"
                          onClick={() => openEditSeatModal(selectedSeat)}
                        >
                          Chỉnh sửa ghế
                        </button>
                        <button
                          className="rm-btn-side rm-btn-side-primary"
                          onClick={() => {
                            if (window.confirm("Bạn có chắc chắn muốn xóa ghế này?")) {
                              handleDeleteSeat(getSeatId(selectedSeat));
                            }
                          }}
                        >
                          Xóa ghế
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", color: "#8e8e93", padding: "20px 0", fontSize: "0.85rem" }}>
                  Hãy bấm vào một ô ghế trên sơ đồ để xem thông tin chi tiết hoặc cập nhật trạng thái của ghế đó.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Room Add/Edit Modal ── */}
      {showRoomModal &&
        createPortal(
          <div className="rm-modal-overlay">
            <div className="rm-modal">
              <h5 className="rm-modal-title">
                {isEditingRoom ? "Cập Nhật Phòng Chiếu" : "Thêm Phòng Chiếu"}
              </h5>

              {roomFormError && <p className="rm-form-error">{roomFormError}</p>}

              <form onSubmit={handleCustomRoomSubmit} className="rm-form">
                {!isEditingRoom && (
                  <div className="rm-field">
                    <label className="rm-label">Chi Nhánh <span className="rm-required">*</span></label>
                    <select
                      name="cinemaId"
                      value={roomForm.cinemaId}
                      onChange={handleRoomChange}
                      className="rm-input"
                      required
                    >
                      <option value="">-- Chọn chi nhánh --</option>
                      {cinemaOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="rm-field">
                  <label className="rm-label">Tên Phòng Chiếu <span className="rm-required">*</span></label>
                  <input
                    type="text"
                    name="roomName"
                    value={roomForm.roomName}
                    onChange={handleRoomChange}
                    className="rm-input"
                    placeholder="Nhập tên phòng chiếu"
                    required
                    disabled={isEditingRoom}
                  />
                </div>

                <div className="rm-field-row">
                  <div className="rm-field">
                    <label className="rm-label">Loại Phòng</label>
                    <select
                      name="roomType"
                      value={roomForm.roomType}
                      onChange={handleRoomChange}
                      className="rm-input"
                      disabled={isEditingRoom}
                    >
                      {roomTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rm-field">
                    <label className="rm-label">Sức Chứa <span className="rm-required">*</span></label>
                    <input
                      type="number"
                      name="totalSeats"
                      value={roomForm.totalSeats}
                      onChange={handleRoomChange}
                      className="rm-input"
                      min={1}
                      required
                      disabled={isEditingRoom}
                    />
                  </div>
                </div>

                <div className="rm-field">
                  <label className="rm-label">Trạng Thái</label>
                  <select
                    name="isActive"
                    value={String(roomForm.isActive)}
                    onChange={handleRoomChange}
                    className="rm-input"
                  >
                    <option value="true">Hoạt động</option>
                    {isEditingRoom && (
                      <option value="false">Ngừng hoạt động</option>
                    )}
                  </select>
                </div>

                <div className="rm-field" style={{ marginTop: "12px", borderTop: "1px solid #2c2c2e", paddingTop: "12px" }}>
                  <label className="rm-label" style={{ color: "#ffd60a", fontWeight: "bold" }}>Bảng Giá Vé Ghế:</label>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "8px", fontSize: "0.8rem", color: "#aeaeb2", marginTop: "8px", alignItems: "center" }}>
                    <div></div>
                    <div style={{ textAlign: "center", fontWeight: "600", color: "#8e8e93" }}>Ngày Thường</div>
                    <div style={{ textAlign: "center", fontWeight: "600", color: "#8e8e93" }}>Cuối Tuần</div>

                    <div>Ghế Thường:</div>
                    <div>
                      <input
                        type="text"
                        className="rm-input-price"
                        value={priceStdWeekday}
                        onChange={(e) => setPriceStdWeekday(e.target.value)}
                        placeholder="70.000"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        className="rm-input-price"
                        value={priceStdWeekend}
                        onChange={(e) => setPriceStdWeekend(e.target.value)}
                        placeholder="90.000"
                      />
                    </div>

                    <div>Ghế VIP:</div>
                    <div>
                      <input
                        type="text"
                        className="rm-input-price"
                        value={priceVipWeekday}
                        onChange={(e) => setPriceVipWeekday(e.target.value)}
                        placeholder="90.000"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        className="rm-input-price"
                        value={priceVipWeekend}
                        onChange={(e) => setPriceVipWeekend(e.target.value)}
                        placeholder="120.000"
                      />
                    </div>

                    <div>Ghế Couple:</div>
                    <div>
                      <input
                        type="text"
                        className="rm-input-price"
                        value={priceCoupleWeekday}
                        onChange={(e) => setPriceCoupleWeekday(e.target.value)}
                        placeholder="130.000"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        className="rm-input-price"
                        value={priceCoupleWeekend}
                        onChange={(e) => setPriceCoupleWeekend(e.target.value)}
                        placeholder="160.000"
                      />
                    </div>
                  </div>
                  
                  {/* Đồng bộ giá cho tất cả các phòng cùng loại */}
                  <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="checkbox"
                      id="syncAllRooms"
                      checked={syncAllRooms}
                      onChange={(e) => setSyncAllRooms(e.target.checked)}
                      style={{ cursor: "pointer", width: "16px", height: "16px" }}
                    />
                    <label htmlFor="syncAllRooms" style={{ fontSize: "0.83rem", color: "#e2e8f0", cursor: "pointer", userSelect: "none" }}>
                      Đồng bộ giá này cho tất cả phòng cùng loại ({roomForm.roomType || "2D"}) của chi nhánh
                    </label>
                  </div>
                </div>

                <div className="rm-modal-actions">
                  <button type="button" onClick={closeRoomModal} className="rm-btn-cancel" disabled={submittingRoom}>
                    Hủy
                  </button>
                  <button type="submit" className="rm-btn-submit" disabled={submittingRoom}>
                    {submittingRoom ? "Đang xử lý..." : isEditingRoom ? "Cập Nhật" : "Thêm Mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ── Seat Add/Edit Modal ── */}
      {showSeatModal &&
        createPortal(
          <div className="rm-modal-overlay">
            <div className="rm-modal">
              <h5 className="rm-modal-title">
                {editSeatId !== null ? "Cập Nhật Ghế" : "Thêm Ghế Ngồi"}
              </h5>

              {seatFormError && <p className="rm-form-error">{seatFormError}</p>}

              <form onSubmit={handleSeatSubmit} className="rm-form">
                {editSeatId === null && (
                  <div className="rm-field">
                    <label className="rm-label">Phòng Chiếu <span className="rm-required">*</span></label>
                    <select
                      name="roomId"
                      value={seatForm.roomId}
                      onChange={handleSeatChange}
                      className="rm-input"
                      required
                      disabled
                    >
                      {rooms.map((room) => (
                        <option key={getRoomId(room)} value={getRoomId(room)}>
                          {getRoomFullName(room, cinemas)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {editSeatId === null && (
                  <div className="rm-field-row">
                    <div className="rm-field">
                      <label className="rm-label">Hàng Ghế <span className="rm-required">*</span></label>
                      <select
                        name="seatRow"
                        value={seatForm.seatRow}
                        onChange={handleSeatChange}
                        className="rm-input"
                        required
                        disabled={editSeatId !== null}
                      >
                        <option value="">-- Hàng --</option>
                        {SEAT_ROW_OPTIONS.map((row) => (
                          <option key={row.value} value={row.value}>
                            {row.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="rm-field">
                      <label className="rm-label">Số Ghế <span className="rm-required">*</span></label>
                      <select
                        name="seatNumber"
                        value={String(seatForm.seatNumber)}
                        onChange={handleSeatChange}
                        className="rm-input"
                        required
                        disabled={editSeatId !== null}
                      >
                        <option value="">-- Số --</option>
                        {SEAT_NUMBER_OPTIONS.map((number) => (
                          <option key={number.value} value={number.value}>
                            {number.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {editSeatId === null && (
                  <div className="rm-field">
                    <label className="rm-label">Loại Ghế</label>
                    <select
                      name="seatType"
                      value={seatForm.seatType}
                      onChange={handleSeatChange}
                      className="rm-input"
                      disabled={editSeatId !== null}
                    >
                      {SEAT_TYPE_OPTIONS.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <div className="text-xs text-green-500 font-semibold mt-1.5">
                      Giá áp dụng: {getSeatPrice(seatForm.seatType, activeRoomType)}
                    </div>
                  </div>
                )}

                <div className="rm-field">
                  <label className="rm-label">Trạng Thái hoạt động</label>
                  <select
                    name="isActive"
                    value={String(seatForm.isActive)}
                    onChange={handleSeatChange}
                    className="rm-input"
                  >
                    {SEAT_STATUS_OPTIONS.filter(st => editSeatId !== null || st.value === "true").map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rm-modal-actions">
                  <button type="button" onClick={closeSeatModal} className="rm-btn-cancel" disabled={submittingSeat}>
                    Hủy
                  </button>
                  <button type="submit" className="rm-btn-submit" disabled={submittingSeat}>
                    {submittingSeat ? "Đang lưu..." : editSeatId !== null ? "Cập Nhật" : "Thêm Ghế"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ── Layout Editor Modal (Advanced) ── */}
      {showLayoutEditor && createPortal(
        <div className="rm-modal-overlay" onClick={() => setShowLayoutEditor(false)}>
          <div
            className="rm-modal-box"
            style={{ maxWidth: 680, width: "96%", maxHeight: "92vh", display: "flex", flexDirection: "column" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="rm-modal-header" style={{ flexShrink: 0 }}>
              <h5 className="rm-modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MdEdit size={20} style={{ color: "#818cf8" }} />
                Chỉnh sửa sơ đồ ghế
                <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#9ca3af", marginLeft: 4 }}>
                  — {rooms.find(r => String(getRoomId(r)) === selectedRoomId)?.roomName ?? ""}
                </span>
              </h5>
              <button className="rm-modal-close" onClick={() => setShowLayoutEditor(false)}>
                <MdClose size={22} />
              </button>
            </div>

            {/* Mode Tabs */}
            <div style={{ display: "flex", gap: 8, padding: "8px 20px 0", flexShrink: 0 }}>
              {[{ id: "row", label: "Chỉnh theo hàng" }, { id: "seat", label: "Chỉnh từng ghế" }].map(tab => (
                <button key={tab.id} onClick={() => setEditMode(tab.id)} style={{
                  padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: "0.85rem", fontWeight: 600,
                  background: editMode === tab.id ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.06)",
                  color: editMode === tab.id ? "#fff" : "#9ca3af", transition: "all 0.2s"
                }}>{tab.label}</button>
              ))}
              <div style={{ marginLeft: "auto", fontSize: "0.8rem", color: "#9ca3af", alignSelf: "center" }}>
                {activeLayout.length} hàng · {activeLayout.reduce((s, r) => s + (r.seats?.length || 0), 0)} ghế
              </div>
            </div>

            {/* Error Banner */}
            {layoutError && (
              <div style={{ margin: "10px 20px 0", padding: "8px 14px", borderRadius: 8,
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.4)",
                color: "#fca5a5", fontSize: "0.82rem", display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0 }}>⚠</span>
                <span>{layoutError}</span>
                <button onClick={() => setLayoutError("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "#fca5a5", cursor: "pointer", flexShrink: 0 }}>X</button>
              </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>

              {/* ROW MODE */}
              {editMode === "row" && (() => {
                const TC = { standard:"#6b7280", vip:"#eab308", couple:"#ec4899", mixed:"#a78bfa", maintenance:"#9ca3af" };
                const OPTS = [
                  { value:"standard", label:"Thuong (Standard)" },
                  { value:"vip", label:"VIP" },
                  { value:"couple", label:"Couple" },
                  { value:"maintenance", label:"Bao tri (tat ca)" }
                ];
                return (
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr style={{ background:"rgba(255,255,255,0.04)", position:"sticky", top:0 }}>
                        <th style={{ padding:"8px 10px", textAlign:"left", color:"#9ca3af", fontSize:"0.8rem" }}>Hàng</th>
                        <th style={{ padding:"8px 10px", textAlign:"left", color:"#9ca3af", fontSize:"0.8rem" }}>Ghế</th>
                        <th style={{ padding:"8px 10px", textAlign:"left", color:"#9ca3af", fontSize:"0.8rem" }}>Loại hiện tại</th>
                        <th style={{ padding:"8px 10px", textAlign:"left", color:"#9ca3af", fontSize:"0.8rem" }}>Đổi loại hàng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeLayout.map((row, i) => {
                        const dt = getRowDisplayType(row);
                        const rv = layoutRowTypes[row.rowName] || dt;
                        const col = TC[dt] || "#6b7280";
                        const dtLabel = dt==="mixed"?"Hon hop":dt==="standard"?"Thuong":dt==="vip"?"VIP":dt==="couple"?"Couple":"Bao tri";
                        return (
                          <tr key={row.rowName} style={{ borderBottom:"1px solid rgba(255,255,255,0.05)", background: i%2===0?"transparent":"rgba(255,255,255,0.02)" }}>
                            <td style={{ padding:"10px 10px" }}>
                              <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center",
                                width:30, height:30, borderRadius:7, background:`${col}20`, border:`1.5px solid ${col}50`,
                                color:col, fontWeight:700, fontSize:"0.9rem" }}>{row.rowName}</span>
                            </td>
                            <td style={{ padding:"10px 10px", color:"#9ca3af", fontSize:"0.85rem" }}>{row.seats?.length||0}</td>
                            <td style={{ padding:"10px 10px" }}>
                              <span style={{ fontSize:"0.82rem", color:col, fontWeight:600 }}>{dtLabel}</span>
                            </td>
                            <td style={{ padding:"10px 10px" }}>
                              <select
                                value={rv==="mixed"?"":rv}
                                onChange={e => {
                                  const val = e.target.value;
                                  setLayoutRowTypes(prev => ({ ...prev, [row.rowName]: val }));
                                  setSeatOverrides(prev => {
                                    const next = { ...prev };
                                    row.seats.forEach(s => { delete next[String(getSeatId(s)||"")]; });
                                    return next;
                                  });
                                  setLayoutError("");
                                }}
                                style={{ background:"#1f2937", border:"1.5px solid #374151", color:"#e2e8f0",
                                  borderRadius:7, padding:"5px 10px", fontSize:"0.83rem", cursor:"pointer", outline:"none" }}
                              >
                                {dt==="mixed" && <option value="">— giu nguyen —</option>}
                                {OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}

              {/* SEAT MODE */}
              {editMode === "seat" && (() => {
                const TC = { standard:"#6b7280", vip:"#eab308", couple:"#ec4899", maintenance:"#9ca3af" };
                return (
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {activeLayout.map(row => {
                      const isExp = expandedRow === row.rowName;
                      const dt = getRowDisplayType(row);
                      const rc = dt==="mixed" ? "#a78bfa" : (TC[dt]||"#6b7280");
                      const ovCount = row.seats.filter(s => seatOverrides[String(getSeatId(s)||"")]).length;
                      const dtLabel = dt==="mixed"?"Hon hop":dt==="standard"?"Thuong":dt==="vip"?"VIP":"Couple";
                      return (
                        <div key={row.rowName} style={{ borderRadius:10, border:"1px solid rgba(255,255,255,0.08)", overflow:"hidden" }}>
                          <div onClick={() => setExpandedRow(isExp?null:row.rowName)}
                            style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                              background: isExp?"rgba(99,102,241,0.1)":"rgba(255,255,255,0.03)",
                              cursor:"pointer", userSelect:"none",
                              borderBottom: isExp?"1px solid rgba(99,102,241,0.3)":"none" }}
                          >
                            <span style={{ width:28, height:28, borderRadius:6, display:"inline-flex", alignItems:"center", justifyContent:"center",
                              background:`${rc}20`, border:`1.5px solid ${rc}50`, color:rc, fontWeight:700, fontSize:"0.88rem" }}>{row.rowName}</span>
                            <span style={{ color:"#e2e8f0", fontWeight:600, fontSize:"0.88rem" }}>{row.seats?.length||0} ghế</span>
                            <span style={{ fontSize:"0.8rem", color:rc, fontWeight:600 }}>{dtLabel}</span>
                            {ovCount > 0 && (
                              <span style={{ fontSize:"0.75rem", background:"#6366f1", color:"#fff", borderRadius:12, padding:"2px 8px", fontWeight:600 }}>
                                {ovCount} da sua
                              </span>
                            )}
                            <span style={{ marginLeft:"auto", color:"#6b7280", fontSize:"0.85rem" }}>{isExp?"▲":"▼"}</span>
                          </div>
                          {isExp && (
                            <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column", gap:6 }}>
                              {row.seats.map(seat => {
                                const sId = String(getSeatId(seat)||"" );
                                const effType = getEffectiveSeatType(seat);
                                const effStatus = getEffectiveSeatStatus(seat);
                                const booked = isSeatBooked(seat);
                                const hasOv = !!seatOverrides[sId];
                                const tc = TC[effType]||"#6b7280";
                                return (
                                  <div key={sId} style={{ display:"grid", gridTemplateColumns:"52px 1fr 1fr auto",
                                    gap:8, alignItems:"center", padding:"8px 10px", borderRadius:8,
                                    background: hasOv?"rgba(99,102,241,0.08)":"rgba(255,255,255,0.02)",
                                    border:`1px solid ${hasOv?"rgba(99,102,241,0.3)":"rgba(255,255,255,0.06)"}` }}>
                                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                                      <span style={{ width:36, height:36, borderRadius:7, display:"inline-flex", alignItems:"center", justifyContent:"center",
                                        background:`${tc}25`, border:`1.5px solid ${tc}60`, color:tc, fontWeight:700, fontSize:"0.82rem" }}>{getSeatCode(seat)}</span>
                                      {booked && <span style={{ fontSize:"0.62rem", color:"#f97316", fontWeight:600 }}>Da dat</span>}
                                    </div>
                                    <div>
                                      <div style={{ fontSize:"0.7rem", color:"#6b7280", marginBottom:3 }}>Loai ghe</div>
                                      <select value={effType} onChange={e => handleSeatTypeOverride(row, seat, e.target.value)}
                                        style={{ background:"#1f2937", border:`1.5px solid ${tc}60`, color:tc,
                                          borderRadius:6, padding:"4px 8px", fontSize:"0.8rem", fontWeight:600,
                                          cursor:"pointer", outline:"none", width:"100%" }}>
                                        <option value="standard">Thuong</option>
                                        <option value="vip">VIP</option>
                                        <option value="couple">Couple</option>
                                      </select>
                                    </div>
                                    <div>
                                      <div style={{ fontSize:"0.7rem", color:"#6b7280", marginBottom:3 }}>Trang thai</div>
                                      <select value={effStatus} onChange={e => handleSeatStatusOverride(seat, e.target.value)}
                                        disabled={booked && effStatus !== "active"}
                                        style={{ background:"#1f2937",
                                          border:`1.5px solid ${effStatus==="active"?"#10b98160":"#ef444460"}`,
                                          color: effStatus==="active"?"#34d399":"#f87171",
                                          borderRadius:6, padding:"4px 8px", fontSize:"0.8rem", fontWeight:600,
                                          cursor: booked?"not-allowed":"pointer", outline:"none", width:"100%",
                                          opacity: booked && effStatus!=="active" ? 0.5 : 1 }}>
                                        <option value="active">Hoat dong</option>
                                        <option value="maintenance" disabled={booked}>Bao tri</option>
                                        <option value="inactive" disabled={booked}>Ngung dung</option>
                                      </select>
                                    </div>
                                    {hasOv && (
                                      <button onClick={() => setSeatOverrides(prev => { const n={...prev}; delete n[sId]; return n; })}
                                        title="Hoan tac thay doi ghe nay"
                                        style={{ background:"none", border:"none", color:"#6b7280", cursor:"pointer", fontSize:"1rem", padding:4 }}>↩</button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Actions */}
            <div className="rm-modal-actions" style={{ flexShrink:0, padding:"14px 20px 18px", margin:0, borderTop:"1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize:"0.8rem", color:"#6b7280", alignSelf:"center" }}>
                {Object.keys(seatOverrides).length > 0 && (
                  <span style={{ color:"#818cf8" }}>{Object.keys(seatOverrides).length} ghế được sửa riêng</span>
                )}
              </div>
              <button type="button" className="rm-btn-cancel" onClick={() => setShowLayoutEditor(false)} disabled={layoutSaving}>Hủy</button>
              <button type="button" className="rm-btn-submit"
                style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", gap:6 }}
                onClick={handleSaveLayoutRowTypes} disabled={layoutSaving}>
                {layoutSaving ? "Đang lưu..." : <><MdEdit size={16} /> Lưu</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}