import "./Cinema.css";
import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdStorefront,
  MdPeople,
  MdMeetingRoom,
  MdPersonOutline,
  MdGroup,
  MdOndemandVideo,
  MdLocationOn,
  MdAdd,
  MdVisibility,
  MdEdit,
} from "react-icons/md";
import {
  CINEMA_STATUS_OPTIONS,
  useCinema,
  getCinemaId,
  getCinemaName,
  getCinemaAddress,
  getCinemaAreaName,
  getCinemaPhone,
  getCinemaEmail,
  getCinemaStatus,
  getAreaId,
  getAreaName,
  getStatusClass,
  getStatusText,
} from "./useCinema.js";

const PAGE_SIZE = 15;

// ─── helpers ──────────────────────────────────────────────
function getStatusStyle(status) {
  if (status === "Active")
    return { bg: "#e6f9f0", color: "#16a34a", label: "Đang hoạt động" };
  if (status === "Inactive")
    return { bg: "#fff7e6", color: "#d97706", label: "Tạm dừng" };
  return { bg: "#fce7f3", color: "#db2777", label: "Bảo trì" };
}

// ─── Main Component ────────────────────────────────────────
export default function RapChieu() {
  const {
    areas,
    loading,
    error,
    search,
    setSearch,
    showModal,
    editId,
    form,
    submitting,
    formError,
    filtered,
    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmit,
    handleDelete,
    list,
  } = useCinema();

  const [page, setPage] = useState(1);
  const navigate = useNavigate();

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

    // Use capture phase to intercept scrolls inside layout container
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [filtered.length]);

  // Stats
  const totalCinemas = list.length;
  const totalStaff = list.reduce(
    (acc, c) => acc + (c?.staffCount ?? c?.StaffCount ?? c?.employeeCount ?? 0),
    0
  );
  const totalRooms = list.reduce(
    (acc, c) => acc + (c?.roomCount ?? c?.RoomCount ?? c?.screeningRoomCount ?? 0),
    0
  );

  return (
    <div className="cn-wrapper">
      {/* ── Header row ── */}
      <div className="cn-header">
        <h4 className="cn-title">Quản Lí Chi Nhánh</h4>
        <button className="cn-btn-add" onClick={openAddModal}>
          <MdAdd size={18} />
          Thêm chi nhánh
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="cn-stats-row">
        <StatCard
          icon={<MdStorefront size={32} />}
          iconBg="#f0f4ff"
          iconColor="#6366f1"
          label="Tổng chi nhánh rạp"
          value={`${totalCinemas} rạp`}
        />
        <StatCard
          icon={<MdPeople size={32} />}
          iconBg="#f0fdf4"
          iconColor="#16a34a"
          label="Tổng nhân viên"
          value={`${totalStaff} nhân viên`}
        />
        <StatCard
          icon={<MdOndemandVideo size={32} />}
          iconBg="#fff7ed"
          iconColor="#f97316"
          label="Tổng phòng chiếu"
          value={`${totalRooms} phòng`}
        />
      </div>

      {/* ── Search ── */}
      <div className="cn-search-row">
        <input
          type="text"
          className="cn-search"
          placeholder="Tìm kiếm theo tên, khu vực, địa chỉ..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* ── Loading / Error ── */}
      {loading && <p className="cn-msg">Đang tải dữ liệu...</p>}
      {error && <p className="cn-msg cn-msg--error">{error}</p>}

      {/* ── Cards grid ── */}
      {!loading && !error && (
        <>
          {pageItems.length === 0 ? (
            <p className="cn-msg">Không có dữ liệu phù hợp.</p>
          ) : (
            <div className="cn-grid">
              {pageItems.map((cinema, idx) => {
                const id = getCinemaId(cinema);
                const status = getCinemaStatus(cinema);
                const style = getStatusStyle(status);
                return (
                  <BranchCard
                    key={id ?? idx}
                    cinema={cinema}
                    statusStyle={style}
                    onEdit={() => openEditModal(cinema)}
                    onDelete={() => handleDelete(id)}
                    onDetail={() => navigate(`/admin/phong-chieu?cinemaId=${id}`)}
                  />
                );
              })}
            </div>
          )}

          {/* ── Scroll/Pagination Footer Info ── */}
          <div className="cn-footer" style={{ justifyContent: "center", margin: "24px 0" }}>
            <span className="cn-footer-info">
              {pageItems.length < filtered.length ? (
                `Đang hiển thị ${pageItems.length} trên ${filtered.length} chi nhánh (Cuộn xuống để xem thêm...)`
              ) : (
                `Đã hiển thị tất cả ${filtered.length} chi nhánh`
              )}
            </span>
          </div>
        </>
      )}

      {/* ── Modal ── */}
      {showModal &&
        createPortal(
          <div className="cn-modal-overlay">
            <div className="cn-modal">
              <h5 className="cn-modal-title">
                {editId !== null ? "Cập Nhật Chi Nhánh" : "Thêm Chi Nhánh"}
              </h5>

              {formError && <p className="cn-form-error">{formError}</p>}

              <form onSubmit={handleSubmit} className="cn-form">
                {/* Tên rạp */}
                <div className="cn-field">
                  <label className="cn-label">
                    Tên Chi Nhánh <span className="cn-required">*</span>
                  </label>
                  <input
                    type="text"
                    name="cinemaName"
                    value={form.cinemaName}
                    onChange={handleChange}
                    placeholder="Nhập tên chi nhánh"
                    className="cn-input"
                  />
                </div>

                {/* Địa chỉ */}
                <div className="cn-field">
                  <label className="cn-label">
                    Địa Chỉ <span className="cn-required">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ"
                    className="cn-input"
                  />
                </div>

                {/* Khu vực */}
                <div className="cn-field">
                  <label className="cn-label">
                    Khu Vực <span className="cn-required">*</span>
                  </label>
                  <select
                    name="areaId"
                    value={form.areaId}
                    onChange={handleChange}
                    className="cn-input"
                  >
                    <option value="">-- Chọn khu vực --</option>
                    {areas.map((area) => {
                      const aId = getAreaId(area);
                      return (
                        <option key={aId} value={aId}>
                          {getAreaName(area)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Phone + Email */}
                <div className="cn-field-row">
                  <div className="cn-field">
                    <label className="cn-label">Điện Thoại</label>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Số điện thoại"
                      className="cn-input"
                    />
                  </div>
                  <div className="cn-field">
                    <label className="cn-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Email liên hệ"
                      className="cn-input"
                    />
                  </div>
                </div>

                {/* Trạng thái */}
                <div className="cn-field">
                  <label className="cn-label">Trạng Thái</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="cn-input"
                  >
                    {CINEMA_STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="cn-modal-actions">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="cn-btn-cancel"
                    disabled={submitting}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="cn-btn-submit"
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

// ─── StatCard ─────────────────────────────────────────────
function StatCard({ icon, iconBg, iconColor, label, value }) {
  return (
    <div className="cn-stat-card">
      <div className="cn-stat-icon" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
      <div className="cn-stat-body">
        <p className="cn-stat-label">{label}</p>
        <p className="cn-stat-value">{value}</p>
      </div>
    </div>
  );
}

// ─── BranchCard ───────────────────────────────────────────
function BranchCard({ cinema, statusStyle, onEdit, onDelete, onDetail }) {
  const managerName =
    cinema?.managerName ?? cinema?.ManagerName ?? cinema?.manager ?? "—";
  const staffCount =
    cinema?.staffCount ?? cinema?.StaffCount ?? cinema?.employeeCount ?? 0;
  const roomCount =
    cinema?.roomCount ?? cinema?.RoomCount ?? cinema?.screeningRoomCount ?? 0;

  return (
    <div className="cn-card">
      {/* Name + Badge */}
      <div className="cn-card-head" onClick={onDetail} style={{ cursor: "pointer" }}>
        <h6 className="cn-card-name" style={{ transition: "color 0.2s" }} onMouseOver={(e) => e.target.style.color = "#3b82f6"} onMouseOut={(e) => e.target.style.color = ""}>{getCinemaName(cinema)}</h6>
        <span
          className="cn-card-badge"
          style={{ background: statusStyle.bg, color: statusStyle.color }}
          onClick={(e) => e.stopPropagation()}
        >
          {statusStyle.label}
        </span>
      </div>

      {/* Info rows */}
      <div className="cn-card-info">
        <InfoRow icon={<MdPersonOutline />} label="Quản lý:" value={managerName} />
        <InfoRow icon={<MdGroup />} label="Nhân viên:" value={`${staffCount} nhân viên`} />
        <InfoRow 
          icon={<MdMeetingRoom />} 
          label="Phòng chiếu:" 
          value={`${roomCount} phòng chiếu`} 
          className="cn-info-row-clickable"
          onClick={onDetail}
        />
        <InfoRow
          icon={<MdLocationOn />}
          label="Địa chỉ:"
          value={getCinemaAddress(cinema)}
          multiline
        />
      </div>

      {/* Actions */}
      <div className="cn-card-actions">
        <button className="cn-card-btn cn-card-btn--detail" onClick={onDetail}>
          <MdVisibility size={15} /> Chi tiết
        </button>
        <button className="cn-card-btn cn-card-btn--edit" onClick={onEdit}>
          <MdEdit size={15} /> Sửa
        </button>
      </div>
    </div>
  );
}

// ─── InfoRow ──────────────────────────────────────────────
function InfoRow({ icon, label, value, multiline, onClick, className }) {
  return (
    <div 
      className={`cn-info-row${multiline ? " cn-info-row--multiline" : ""}${className ? " " + className : ""}`}
      onClick={onClick}
    >
      <span className="cn-info-icon">{icon}</span>
      <span className="cn-info-label">{label}</span>
      <span className="cn-info-value">{value || "—"}</span>
    </div>
  );
}