import "./Room.css";
import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
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
} from "react-icons/md";
import { useRoom } from "./useRoom.js";

const PAGE_SIZE = 15;

// ── Status helpers ──────────────────────────────────────────
function getStatusStyle(isActive) {
  if (isActive === true || isActive === "true" || isActive === "Active")
    return { bg: "#e6f9f0", color: "#16a34a", label: "Đang hoạt động" };
  if (
    isActive === "maintenance" ||
    isActive === "Maintenance" ||
    isActive === "Bảo trì"
  )
    return { bg: "#fff7e6", color: "#d97706", label: "Bảo trì" };
  return { bg: "#fce7f3", color: "#db2777", label: "Tạm dừng" };
}

// ── Main Component ──────────────────────────────────────────
export default function RoomAdmin() {
  const {
    loading,
    error,
    rooms,
    cinemas,
    search,
    setSearch,
    showModal,
    isEditing,
    form,
    formError,
    submitting,
    roomTypeOptions,
    roomStatusOptions,
    cinemaOptions,
    handleChange,
    handleSubmit,
    openAddModal,
    openEditRoom,
    closeModal,
    handleDeleteRoom,
  } = useRoom();

  const [page, setPage] = useState(1);
  const [selectedCinemaFilter, setSelectedCinemaFilter] = useState("");

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

  // ── Helper lấy cinemaId từ room ──
  function getRoomCinemaId(r) {
    return String(
      r?.cinemaId ?? r?.CinemaId ??
      r?.cinema?.cinemaId ?? r?.cinema?.CinemaId ??
      r?.Cinema?.cinemaId ?? r?.Cinema?.CinemaId ?? ""
    );
  }

  // ── Lọc theo chi nhánh trước ──
  const roomsByCinema = selectedCinemaFilter
    ? rooms.filter((r) => getRoomCinemaId(r) === selectedCinemaFilter)
    : rooms;

  // ── Stats dựa trên toàn bộ phòng (không phụ thuộc filter) ──
  const totalRooms = roomsByCinema.length;
  const activeRooms = roomsByCinema.filter((r) => {
    const v = r?.isActive ?? r?.IsActive ?? r?.status ?? r?.Status;
    return v === true || v === "true" || v === "Active";
  }).length;
  const totalSeats = roomsByCinema.reduce(
    (acc, r) =>
      acc + Number(r?.totalSeats ?? r?.TotalSeats ?? r?.capacity ?? 0),
    0
  );

  // ── Lọc thêm theo keyword ──
  const keyword = (search || "").trim().toLowerCase();
  const filtered = keyword
    ? roomsByCinema.filter((r) => {
        const name = (r?.roomName ?? r?.RoomName ?? "").toLowerCase();
        const cinema = (
          r?.cinemaName ??
          r?.CinemaName ??
          r?.cinema?.cinemaName ??
          ""
        ).toLowerCase();
        const type = (r?.roomType ?? r?.RoomType ?? "").toLowerCase();
        return name.includes(keyword) || cinema.includes(keyword) || type.includes(keyword);
      })
    : roomsByCinema;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(0, page * PAGE_SIZE);

  useEffect(() => {
    const handleScroll = (e) => {
      let target = e.target;
      if (target === document) {
        target = document.documentElement || document.body;
      }
      if (!target) return;

      const { scrollTop, scrollHeight, clientHeight } = target;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        setPage((prev) => {
          if (prev * PAGE_SIZE < filtered.length) {
            return prev + 1;
          }
          return prev;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [filtered.length]);

  function handleCinemaFilterChange(e) {
    setSelectedCinemaFilter(e.target.value);
    setPage(1);
  }

  return (
    <div className="rm-wrapper">
      {/* ── Header ── */}
      <div className="rm-header">
        <h4 className="rm-title">Quản Lý Phòng Chiếu</h4>
        <button className="rm-btn-add" onClick={openAddModal}>
          <MdAdd size={18} />
          Thêm phòng chiếu
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="rm-stats-row">
        <StatCard
          icon={<MdOndemandVideo size={32} />}
          iconBg="#fff7ed"
          iconColor="#f97316"
          label="Tổng phòng chiếu"
          value={`${totalRooms} phòng`}
        />
        <StatCard
          icon={<MdCheckCircleOutline size={32} />}
          iconBg="#f0fdf4"
          iconColor="#16a34a"
          label="Phòng đang hoạt động"
          value={`${activeRooms} phòng`}
        />
        <StatCard
          icon={<MdChair size={32} />}
          iconBg="#f0f4ff"
          iconColor="#6366f1"
          label="Tổng ghế"
          value={totalSeats.toLocaleString("vi-VN") + " ghế"}
        />
      </div>

      {/* ── Filter bar ── */}
      <div className="rm-filter-bar">
        {/* Dropdown chi nhánh */}
        <div className="rm-filter-cinema">
          <select
            className="rm-cinema-select"
            value={selectedCinemaFilter}
            onChange={handleCinemaFilterChange}
          >
            {cinemaOptions.map((opt) => (
              <option key={opt.value} value={String(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <input
          type="text"
          className="rm-search"
          placeholder="Tìm kiếm theo tên phòng, loại phòng..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* ── Loading / Error ── */}
      {loading && <p className="rm-msg">Đang tải dữ liệu...</p>}
      {error && <p className="rm-msg rm-msg--error">{error}</p>}

      {/* ── Cards ── */}
      {!loading && !error && (
        <>
          {pageItems.length === 0 ? (
            <p className="rm-msg">Không có dữ liệu phù hợp.</p>
          ) : (
            <div className="rm-grid">
              {pageItems.map((room, idx) => {
                const id =
                  room?.roomId ?? room?.RoomId ?? room?.id ?? room?.Id ?? idx;
                const isActive =
                  room?.isActive ?? room?.IsActive ?? room?.status ?? true;
                const style = getStatusStyle(isActive);
                return (
                  <RoomCard
                    key={id}
                    room={room}
                    statusStyle={style}
                    onEdit={() => openEditRoom(room)}
                    onDelete={() => handleDeleteRoom(id)}
                  />
                );
              })}
            </div>
          )}

          {/* ── Scroll/Pagination Footer Info ── */}
          <div className="rm-footer" style={{ justifyContent: "center", margin: "24px 0" }}>
            <span className="rm-footer-info">
              {pageItems.length < filtered.length ? (
                `Đang hiển thị ${pageItems.length} trên ${filtered.length} phòng chiếu (Cuộn xuống để xem thêm...)`
              ) : (
                `Đã hiển thị tất cả ${filtered.length} phòng chiếu`
              )}
            </span>
          </div>
        </>
      )}

      {/* ── Modal ── */}
      {showModal &&
        createPortal(
          <div className="rm-modal-overlay">
            <div className="rm-modal">
              <h5 className="rm-modal-title">
                {isEditing ? "Cập Nhật Phòng Chiếu" : "Thêm Phòng Chiếu"}
              </h5>

              {formError && <p className="rm-form-error">{formError}</p>}

              <form onSubmit={handleSubmit} className="rm-form">
                {/* Chi nhánh */}
                <div className="rm-field">
                  <label className="rm-label">
                    Chi Nhánh <span className="rm-required">*</span>
                  </label>
                  <select
                    name="cinemaId"
                    value={form.cinemaId}
                    onChange={handleChange}
                    className="rm-input"
                  >
                    <option value="">-- Chọn chi nhánh --</option>
                    {cinemaOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tên phòng */}
                <div className="rm-field">
                  <label className="rm-label">
                    Tên Phòng Chiếu <span className="rm-required">*</span>
                  </label>
                  <input
                    type="text"
                    name="roomName"
                    value={form.roomName}
                    onChange={handleChange}
                    placeholder="Nhập tên phòng chiếu"
                    className="rm-input"
                  />
                </div>

                {/* Loại phòng + Sức chứa */}
                <div className="rm-field-row">
                  <div className="rm-field">
                    <label className="rm-label">Loại Phòng</label>
                    <select
                      name="roomType"
                      value={form.roomType}
                      onChange={handleChange}
                      className="rm-input"
                    >
                      {roomTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rm-field">
                    <label className="rm-label">
                      Sức Chứa <span className="rm-required">*</span>
                    </label>
                    <input
                      type="number"
                      name="totalSeats"
                      value={form.totalSeats}
                      onChange={handleChange}
                      placeholder="Số ghế"
                      min={1}
                      className="rm-input"
                    />
                  </div>
                </div>

                {/* Trạng thái */}
                <div className="rm-field">
                  <label className="rm-label">Trạng Thái</label>
                  <select
                    name="isActive"
                    value={String(form.isActive)}
                    onChange={handleChange}
                    className="rm-input"
                  >
                    {roomStatusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="rm-modal-actions">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rm-btn-cancel"
                    disabled={submitting}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="rm-btn-submit"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Đang xử lý..."
                      : isEditing
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

// ── StatCard ───────────────────────────────────────────────
function StatCard({ icon, iconBg, iconColor, label, value }) {
  return (
    <div className="rm-stat-card">
      <div className="rm-stat-icon" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
      <div className="rm-stat-body">
        <p className="rm-stat-label">{label}</p>
        <p className="rm-stat-value">{value}</p>
      </div>
    </div>
  );
}

// ── RoomCard ───────────────────────────────────────────────
function RoomCard({ room, statusStyle, onEdit, onDelete }) {
  const name =
    room?.roomName ?? room?.RoomName ?? room?.name ?? "—";
  const cinemaName =
    room?.cinemaName ??
    room?.CinemaName ??
    room?.cinema?.cinemaName ??
    room?.cinema?.CinemaName ??
    "—";
  const roomType = room?.roomType ?? room?.RoomType ?? "—";
  const totalSeats =
    room?.totalSeats ?? room?.TotalSeats ?? room?.capacity ?? 0;
  const equipment =
    room?.equipment ?? room?.Equipment ?? room?.devices ?? room?.Devices ?? "";

  return (
    <div className="rm-card">
      {/* Name + Badge */}
      <div className="rm-card-head">
        <h6 className="rm-card-name">{name}</h6>
        <span
          className="rm-card-badge"
          style={{ background: statusStyle.bg, color: statusStyle.color }}
        >
          {statusStyle.label}
        </span>
      </div>

      {/* Info */}
      <div className="rm-card-info">
        <InfoRow icon={<MdLocationOn />} label="Chi nhánh:" value={cinemaName} />
        <InfoRow icon={<MdScreenshotMonitor />} label="Loại phòng:" value={roomType} />
        <InfoRow icon={<MdChair />} label="Sức chứa:" value={`${totalSeats} ghế`} />
        {equipment && (
          <InfoRow icon={<MdSpeaker />} label="Thiết bị:" value={equipment} multiline />
        )}
      </div>

      {/* Actions */}
      <div className="rm-card-actions">
        <button className="rm-card-btn rm-card-btn--detail" onClick={() => {}}>
          <MdVisibility size={15} /> Chi tiết
        </button>
        <button className="rm-card-btn rm-card-btn--edit" onClick={onEdit}>
          <MdEdit size={15} /> Sửa
        </button>
      </div>
    </div>
  );
}

// ── InfoRow ────────────────────────────────────────────────
function InfoRow({ icon, label, value, multiline }) {
  return (
    <div className={`rm-info-row${multiline ? " rm-info-row--multiline" : ""}`}>
      <span className="rm-info-icon">{icon}</span>
      <span className="rm-info-label">{label}</span>
      <span className="rm-info-value">{value || "—"}</span>
    </div>
  );
}