import "./Room.css";
import { createPortal } from "react-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  MdAdd,
  MdOndemandVideo,
  MdCheckCircleOutline,
  MdChair,
  MdLocationOn,
  MdScreenshotMonitor,
  MdSpeaker,
  MdVisibility,
  MdEdit,
  MdMoreVert,
  MdDelete,
  MdClose,
  MdEventSeat,
  MdFavorite
} from "react-icons/md";
import { useRoom, getRoomCinemaName, getStatusInfo, groupRowSeats } from "./useRoom";
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
  getRoomCinemaId
} from "../Seat/useSeat";

export default function RoomAdmin() {
  // ── 1. Room Hook ──
  const {
    rooms,
    cinemas,
    loading: loadingRooms,
    error: errorRooms,
    showModal: showRoomModal,
    isEditing: isEditingRoom,
    form: roomForm,
    formError: roomFormError,
    submitting: submittingRoom,
    roomTypeOptions,
    roomStatusOptions,
    cinemaOptions,
    handleChange: handleRoomChange,
    handleSubmit: handleRoomSubmit,
    openAddModal: openAddRoomModal,
    openEditRoom,
    closeModal: closeRoomModal,
    handleDeleteRoom,
  } = useRoom();

  // ── 2. Seat Hook ──
  const {
    filterRoom,
    setFilterRoom,
    selectedRoomSeats,
    seatMapLayout,
    mockSeatLayout,
    dynamicStats,
    showModal: showSeatModal,
    editId: editSeatId,
    form: seatForm,
    submitting: submittingSeat,
    formError: seatFormError,
    openAddModal: openAddSeatModal,
    openEditModal: openEditSeatModal,
    closeModal: closeSeatModal,
    handleChange: handleSeatChange,
    handleSubmit: handleSeatSubmit,
    handleDelete: handleDeleteSeat,
  } = useSeat();

  // ── 3. Local UI States ──
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedCinemaFilter, setSelectedCinemaFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);

  const [priceStdWeekday, setPriceStdWeekday] = useState("");
  const [priceStdWeekend, setPriceStdWeekend] = useState("");
  const [priceVipWeekday, setPriceVipWeekday] = useState("");
  const [priceVipWeekend, setPriceVipWeekend] = useState("");
  const [priceCoupleWeekday, setPriceCoupleWeekday] = useState("");
  const [priceCoupleWeekend, setPriceCoupleWeekend] = useState("");

  // Sync price forms with current modal mode
  useEffect(() => {
    if (showRoomModal && roomForm) {
      if (isEditingRoom) {
        const cId = roomForm.cinemaId;
        const rName = roomForm.roomName;
        
        const stdWd = localStorage.getItem(`room_price_std_wd_c${cId}_r${rName}`);
        const stdWe = localStorage.getItem(`room_price_std_we_c${cId}_r${rName}`);
        const vipWd = localStorage.getItem(`room_price_vip_wd_c${cId}_r${rName}`);
        const vipWe = localStorage.getItem(`room_price_vip_we_c${cId}_r${rName}`);
        const cpWd = localStorage.getItem(`room_price_cp_wd_c${cId}_r${rName}`);
        const cpWe = localStorage.getItem(`room_price_cp_we_c${cId}_r${rName}`);

        const isImax = String(roomForm.roomType).toUpperCase().includes("IMAX");

        setPriceStdWeekday(stdWd || (isImax ? "150.000" : "70.000"));
        setPriceStdWeekend(stdWe || (isImax ? "180.000" : "90.000"));
        setPriceVipWeekday(vipWd || (isImax ? "180.000" : "90.000"));
        setPriceVipWeekend(vipWe || (isImax ? "220.000" : "120.000"));
        setPriceCoupleWeekday(cpWd || "130.000");
        setPriceCoupleWeekend(cpWe || "160.000");
      } else {
        const isImax = String(roomForm.roomType).toUpperCase().includes("IMAX");
        setPriceStdWeekday(isImax ? "150.000" : "70.000");
        setPriceStdWeekend(isImax ? "180.000" : "90.000");
        setPriceVipWeekday(isImax ? "180.000" : "90.000");
        setPriceVipWeekend(isImax ? "220.000" : "120.000");
        setPriceCoupleWeekday("130.000");
        setPriceCoupleWeekend("160.000");
      }
    }
  }, [showRoomModal, isEditingRoom, roomForm?.cinemaId, roomForm?.roomName]);

  // Sync price defaults when roomType option changes in form
  useEffect(() => {
    if (showRoomModal && roomForm && !isEditingRoom) {
      const isImax = String(roomForm.roomType).toUpperCase().includes("IMAX");
      if (isImax) {
        setPriceStdWeekday("150.000");
        setPriceStdWeekend("180.000");
        setPriceVipWeekday("180.000");
        setPriceVipWeekend("220.000");
        setPriceCoupleWeekday("130.000");
        setPriceCoupleWeekend("160.000");
      } else {
        setPriceStdWeekday("70.000");
        setPriceStdWeekend("90.000");
        setPriceVipWeekday("90.000");
        setPriceVipWeekend("120.000");
        setPriceCoupleWeekday("130.000");
        setPriceCoupleWeekend("160.000");
      }
    }
  }, [roomForm?.roomType, showRoomModal, isEditingRoom]);

  const handleCustomRoomSubmit = async (e) => {
    e.preventDefault();
    const cId = roomForm.cinemaId;
    const rName = roomForm.roomName;
    
    localStorage.setItem(`room_price_std_wd_c${cId}_r${rName}`, priceStdWeekday);
    localStorage.setItem(`room_price_std_we_c${cId}_r${rName}`, priceStdWeekend);
    localStorage.setItem(`room_price_vip_wd_c${cId}_r${rName}`, priceVipWeekday);
    localStorage.setItem(`room_price_vip_we_c${cId}_r${rName}`, priceVipWeekend);
    localStorage.setItem(`room_price_cp_wd_c${cId}_r${rName}`, priceCoupleWeekday);
    localStorage.setItem(`room_price_cp_we_c${cId}_r${rName}`, priceCoupleWeekend);

    await handleRoomSubmit(e);
  };
  
  const getRoomPriceText = (room, type) => {
    const cId = room?.cinemaId ?? room?.CinemaId ?? room?.cinema?.cinemaId ?? "";
    const rName = room?.roomName ?? room?.RoomName ?? "";
    
    const stdWd = localStorage.getItem(`room_price_std_wd_c${cId}_r${rName}`);
    const stdWe = localStorage.getItem(`room_price_std_we_c${cId}_r${rName}`);
    const vipWd = localStorage.getItem(`room_price_vip_wd_c${cId}_r${rName}`);
    const vipWe = localStorage.getItem(`room_price_vip_we_c${cId}_r${rName}`);
    const cpWd = localStorage.getItem(`room_price_cp_wd_c${cId}_r${rName}`);
    const cpWe = localStorage.getItem(`room_price_cp_we_c${cId}_r${rName}`);

    const roomType = room?.roomType ?? room?.RoomType ?? "2D";
    const isImax = String(roomType).toUpperCase().includes("IMAX");

    const formatShorthand = (val, def) => {
      if (!val) return def;
      // Strip ".000" or similar for shorthand view in table
      return String(val).replace(/\.000/g, "k").replace(/\.500/g, "k5").replace(/ đ/g, "");
    };

    if (type === "std") {
      if (stdWd || stdWe) {
        return `${formatShorthand(stdWd, "0")} / ${formatShorthand(stdWe, "0")}`;
      }
      return isImax ? "150k / 180k" : "70k / 90k";
    }
    if (type === "vip") {
      if (vipWd || vipWe) {
        return `${formatShorthand(vipWd, "0")} / ${formatShorthand(vipWe, "0")}`;
      }
      return isImax ? "180k / 220k" : "90k / 120k";
    }
    if (type === "couple") {
      if (cpWd || cpWe) {
        return `${formatShorthand(cpWd, "0")} / ${formatShorthand(cpWe, "0")}`;
      }
      return "130k / 160k";
    }
    return "—";
  };
  
  const menuRef = useRef(null);

  // Close actions menu dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync selected cinema filter with first cinema
  useEffect(() => {
    if (cinemas.length > 0 && !selectedCinemaFilter) {
      const firstId = String(
        cinemas[0]?.cinemaId ??
        cinemas[0]?.CinemaId ??
        cinemas[0]?.id ??
        cinemas[0]?.Id ??
        ""
      );
      setSelectedCinemaFilter(firstId);
    }
  }, [cinemas, selectedCinemaFilter]);

  // Sync selected room with filterRoom & first room loaded
  const filteredRooms = useMemo(() => {
    let list = selectedCinemaFilter
      ? rooms.filter((r) => String(r?.cinemaId ?? r?.CinemaId ?? r?.cinema?.cinemaId ?? "") === selectedCinemaFilter)
      : rooms;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => 
        (r?.roomName ?? r?.RoomName ?? "").toLowerCase().includes(q) ||
        (r?.roomType ?? r?.RoomType ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [rooms, selectedCinemaFilter, searchQuery]);

  // Initialize selectedRoomId and filterRoom
  useEffect(() => {
    if (filteredRooms.length > 0) {
      const firstRoomId = String(getRoomId(filteredRooms[0]));
      if (!selectedRoomId || !filteredRooms.some(r => String(getRoomId(r)) === selectedRoomId)) {
        setSelectedRoomId(firstRoomId);
        setFilterRoom(firstRoomId);
      }
    } else {
      setSelectedRoomId("");
      setFilterRoom("");
    }
  }, [filteredRooms, selectedRoomId]);

  // Sync selected seat on room changes
  useEffect(() => {
    setSelectedSeat(null);
  }, [selectedRoomId]);

  // Handle room row selection
  function handleSelectRoom(roomId) {
    const idStr = String(roomId);
    setSelectedRoomId(idStr);
    setFilterRoom(idStr);
  }

  // Calculate layout
  const activeLayout = seatMapLayout;

  const activeRoom = rooms.find(r => String(getRoomId(r)) === selectedRoomId);
  const activeRoomType = activeRoom?.roomType ?? activeRoom?.RoomType ?? "2D";

  const getSeatPrice = (seatType, roomType = "2D") => {
    const type = String(seatType).toLowerCase();
    const cId = activeRoom?.cinemaId ?? activeRoom?.CinemaId ?? "";
    const rName = activeRoom?.roomName ?? activeRoom?.RoomName ?? "";
    
    const stdWd = localStorage.getItem(`room_price_std_wd_c${cId}_r${rName}`);
    const stdWe = localStorage.getItem(`room_price_std_we_c${cId}_r${rName}`);
    const vipWd = localStorage.getItem(`room_price_vip_wd_c${cId}_r${rName}`);
    const vipWe = localStorage.getItem(`room_price_vip_we_c${cId}_r${rName}`);
    const cpWd = localStorage.getItem(`room_price_cp_wd_c${cId}_r${rName}`);
    const cpWe = localStorage.getItem(`room_price_cp_we_c${cId}_r${rName}`);

    const isImax = String(roomType).toUpperCase().includes("IMAX");

    if (type === "vip") {
      if (vipWd || vipWe) return `${vipWd || "0"} đ / ${vipWe || "0"} đ`;
      return isImax ? "180.000 đ / 220.000 đ" : "90.000 đ / 120.000 đ";
    }
    if (type === "couple" || type === "sweetbox") {
      if (cpWd || cpWe) return `${cpWd || "0"} đ / ${cpWe || "0"} đ`;
      return "130.000 đ / 160.000 đ";
    }
    // Standard
    if (stdWd || stdWe) return `${stdWd || "0"} đ / ${stdWe || "0"} đ`;
    return isImax ? "150.000 đ / 180.000 đ" : "70.000 đ / 90.000 đ";
  };

  const getLateSeatPrice = (seatType, roomType = "2D") => {
    const type = String(seatType).toLowerCase();
    const cId = activeRoom?.cinemaId ?? activeRoom?.CinemaId ?? "";
    const rName = activeRoom?.roomName ?? activeRoom?.RoomName ?? "";
    
    const stdWe = localStorage.getItem(`room_price_std_we_c${cId}_r${rName}`);
    const vipWe = localStorage.getItem(`room_price_vip_we_c${cId}_r${rName}`);
    const cpWe = localStorage.getItem(`room_price_cp_we_c${cId}_r${rName}`);

    const isImax = String(roomType).toUpperCase().includes("IMAX");

    if (type === "vip") {
      if (vipWe) return `${vipWe} đ`;
      return isImax ? "220.000 đ" : "120.000 đ";
    }
    if (type === "couple" || type === "sweetbox") {
      if (cpWe) return `${cpWe} đ`;
      return "160.000 đ";
    }
    // Standard
    if (stdWe) return `${stdWe} đ`;
    return isImax ? "180.000 đ" : "90.000 đ";
  };

  // Stats calculation
  const totalCount = filteredRooms.length;
  const activeCount = filteredRooms.filter(r => getStatusInfo(r).dotClass === "active").length;
  const cleaningCount = filteredRooms.filter(r => getStatusInfo(r).dotClass === "cleaning").length;
  const maintenanceCount = filteredRooms.filter(r => getStatusInfo(r).dotClass === "maintenance").length;

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

                const cinemaName = getRoomCinemaName(room, cinemas);

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
    </div>
  );
}