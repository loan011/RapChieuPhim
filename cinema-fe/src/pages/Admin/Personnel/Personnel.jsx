import "./Personnel.css";
import { createPortal } from "react-dom";
import * as IconsMd from "react-icons/md";
import {
  usePersonnel,
  EMPLOYEE_POSITION_OPTIONS,
  EMPLOYEE_STATUS_OPTIONS,
  getEmployeeId,
  getEmployeeName,
  getEmployeeEmail,
  getEmployeePhone,
  getEmployeePosition,
  getEmployeeStatus,
  getStaffCinemaId,
  PAGE_SIZE,
} from "./usePersonnel";

const {
  MdPeople,
  MdPerson,
  MdAccessTime,
  MdPersonRemove,
  MdSearch,
  MdAdd,
  MdVisibility,
  MdEdit,
  MdDelete,
  MdStorefront,
  MdLocationOn,
  MdMeetingRoom,
  MdRefresh,
  MdFileDownload,
  MdPhone,
  MdEmail
} = IconsMd;

// Helper to style table badges based on employee status
function getStatusBadgeStyle(status) {
  switch (status) {
    case "Đang làm việc":
      return { bg: "#e6f9f0", color: "#16a34a", label: "Đang làm việc" };
    case "Tạm nghỉ":
      return { bg: "#fff3e0", color: "#e67e00", label: "Tạm nghỉ" };
    case "Nghỉ việc":
      return { bg: "#fef2f2", color: "#dc2626", label: "Nghỉ việc" };
    default:
      return { bg: "#f3f4f6", color: "#6b7280", label: status || "—" };
  }
}

export default function Personnel() {
  const {
    cinemas,
    loading,
    error,

    /* filters */
    search,
    setSearch,
    filterPos,
    setFilterPos,
    filterCinemaId,
    setFilterCinemaId,
    filterStatus,
    setFilterStatus,
    cinemaOptions,
    filtered,

    /* pagination */
    page,
    setPage,
    pageItems,
    totalPages,
    safePage,

    /* Stats */
    totalCount,
    activeCount,
    temporaryCount,
    resignedCount,

    /* Modal / Form */
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
  } = usePersonnel();

  return (
    <div className="pe-wrapper">
      {/* ── Header ── */}
      <div className="pe-header-container">
        <div className="pe-header-left">
          <h4 className="pe-title">Quản lý chi nhánh</h4>
          <p className="pe-subtitle">Quản lý thông tin các chi nhánh rạp</p>
        </div>
        <button className="pe-btn-add" onClick={openAddModal}>
          <MdAdd size={18} /> Thêm chi nhánh
        </button>
      </div>

      {/* ── Stats row (4 cards) ── */}
      <div className="pe-stats-row">
        <StatCard
          icon={<MdStorefront size={24} />}
          iconBg="#2c2222"
          iconColor="#ef4444"
          label="Tổng chi nhánh"
          value={totalCount}
          subLabel="chi nhánh"
        />
        <StatCard
          icon={<MdLocationOn size={24} />}
          iconBg="#1c2c22"
          iconColor="#22c55e"
          label="Đang hoạt động"
          value={activeCount}
          subLabel="chi nhánh"
        />
        <StatCard
          icon={<MdAccessTime size={24} />}
          iconBg="#2c2818"
          iconColor="#eab308"
          label="Tạm ngừng"
          value={temporaryCount}
          subLabel="chi nhánh"
        />
        <StatCard
          icon={<MdMeetingRoom size={24} />}
          iconBg="#262626"
          iconColor="#a3a3a3"
          label="Tổng phòng chiếu"
          value={24}
          subLabel="phòng chiếu"
        />
      </div>

      {/* ── Filters bar ── */}
      <div className="pe-filter-bar">
        <div className="pe-search-input-wrapper">
          <MdSearch size={18} className="pe-search-icon" />
          <input
            type="text"
            className="pe-search-input"
            placeholder="Tìm kiếm chi nhánh..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="pe-filter-select"
          value={filterCinemaId}
          onChange={(e) => {
            setFilterCinemaId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tất cả chi nhánh</option>
          {cinemaOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select className="pe-filter-select">
          <option>Tất cả trạng thái</option>
        </select>
        <select className="pe-filter-select">
          <option>Sắp xếp: Mới nhất</option>
        </select>
        <div className="pe-filter-actions">
          <button className="pe-btn-refresh"><MdRefresh size={16} /> Làm mới</button>
        </div>
      </div>

      {/* ── Loading / Error ── */}
      {loading && <p className="pe-msg">Đang tải danh sách...</p>}
      {error && <p className="pe-msg pe-msg--error">{error}</p>}

      {/* ── Table view matching the mockup ── */}
      {!loading && !error && (
        <div className="pe-table-container">
          <table className="pe-table">
            <thead>
              <tr>
                <th style={{ width: "50px" }}>#</th>
                <th>CHI NHÁNH</th>
                <th>ĐỊA CHỈ</th>
                <th>SĐT</th>
                <th>EMAIL</th>
                <th style={{ textAlign: "center" }}>SỐ PHÒNG CHIẾU</th>
                <th style={{ textAlign: "center" }}>TRẠNG THÁI</th>
                <th style={{ width: "120px", textAlign: "center" }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="pe-table-empty">Không có dữ liệu phù hợp.</td>
                </tr>
              ) : (
                filtered.map((employee, idx) => {
                  const id = getEmployeeId(employee);
                  const name = getEmployeeName(employee);
                  const email = getEmployeeEmail(employee);
                  const phone = getEmployeePhone(employee);
                  const status = getEmployeeStatus(employee);
                  const cinemaId = getStaffCinemaId(employee);
                  const cinema = cinemaOptions.find(
                    (c) => String(c.id) === String(cinemaId)
                  );
                  const cinemaName = cinema ? cinema.name : name || "Tất cả chi nhánh";
                  
                  const ADDRESS_MAP = {
                    "CinemaHCM Đồng Khởi": "72 Lê Thánh Tôn, P. Bến Nghé, Quận 1, TP. HCM",
                    "CinemaHCM Bến Thành": "135 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP. HCM",
                    "CinemaHCM Tân Bình": "20 Cộng Hòa, Phường 4, Q. Tân Bình, TP. HCM",
                    "CinemaHCM Vincom Thủ Đức": "216 Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức",
                    "CinemaHCM Aeon Tân Phú": "30 Bờ Bao Tân Thắng, P. Sơn Kỳ, Q. Tân Phú"
                  };
                  const address = cinema ? (ADDRESS_MAP[cinema.name] || "72 Lê Thánh Tôn, Quận 1, TP. HCM") : "—";
                  const roomCount = 4 + (idx % 4);

                  const globalIndex = idx + 1;
                  const avatarUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=100&q=80";

                  return (
                    <tr key={id || idx}>
                      <td>{globalIndex}</td>
                      <td>
                        <div className="pe-cell-branch">
                          <img src={avatarUrl} alt={cinemaName} className="pe-branch-avatar" />
                          <div className="pe-branch-name" style={{display: 'flex', flexDirection: 'column', lineHeight: '1.4'}}>
                            <span>{cinemaName.split(" ").slice(0, 1).join(" ")}</span>
                            <span style={{color: '#9ca3af', fontSize: '0.75rem', fontWeight: 500}}>{cinemaName.split(" ").slice(1).join(" ")}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="pe-cell-icon-text">
                          <MdLocationOn className="pe-text-icon" /> {address}
                        </div>
                      </td>
                      <td>
                        <div className="pe-cell-icon-text">
                          <MdPhone className="pe-text-icon" /> {phone || "—"}
                        </div>
                      </td>
                      <td>
                        <div className="pe-cell-icon-text">
                          <MdEmail className="pe-text-icon" /> {email}
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>{roomCount}</td>
                      <td style={{ textAlign: "center" }}>
                        <span className="pe-status-badge" style={{ borderColor: "#22c55e", color: "#22c55e" }}>
                          Hoạt động
                        </span>
                      </td>
                      <td>
                        <div className="pe-row-actions">
                          <button className="pe-btn-action pe-btn-edit" onClick={() => openEditModal(employee)}>
                            <MdEdit size={14} />
                          </button>
                          <button className="pe-btn-action pe-btn-delete" onClick={() => handleDelete(id)}>
                            <MdDelete size={14} />
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
      )}

      {/* ── Modal Add / Edit ── */}
      {showModal &&
        createPortal(
          <div className="pe-modal-overlay">
            <div className="pe-modal">
              <h5 className="pe-modal-title">
                {editId !== null ? "Cập Nhật Chi Nhánh" : "Thêm Chi Nhánh Mới"}
              </h5>
              {formError && <p className="pe-form-error">{formError}</p>}

              <form onSubmit={handleSubmit} className="pe-form">
                {/* Tên Chi Nhánh */}
                <div className="pe-field">
                  <label className="pe-label">
                    Tên Chi Nhánh / Quản Lý <span className="pe-required">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    className="pe-input"
                    placeholder="Nhập tên chi nhánh / tên quản lý"
                    required
                  />
                </div>

                {/* Email */}
                <div className="pe-field">
                  <label className="pe-label">
                    Email <span className="pe-required">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="pe-input"
                    placeholder="name@gmail.com"
                    required
                    disabled={editId !== null} // Email cannot be changed usually
                  />
                </div>

                {/* Mật khẩu */}
                <div className="pe-field">
                  <label className="pe-label">
                    {editId !== null
                      ? "Mật Khẩu Mới (Để trống nếu giữ nguyên)"
                      : "Mật Khẩu"}{" "}
                    {editId === null && <span className="pe-required">*</span>}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="pe-input"
                    placeholder={
                      editId !== null
                        ? "Nhập mật khẩu mới để thay đổi"
                        : "Nhập mật khẩu tài khoản"
                    }
                    required={editId === null}
                  />
                </div>

                {/* Điện thoại & Chi nhánh */}
                <div className="pe-field-row">
                  <div className="pe-field">
                    <label className="pe-label">Điện Thoại</label>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="pe-input"
                      placeholder="VD: 0987654321"
                    />
                  </div>
                  <div className="pe-field">
                    <label className="pe-label">Chi Nhánh Rạp</label>
                    <select
                      name="cinemaId"
                      value={form.cinemaId}
                      onChange={handleChange}
                      className="pe-input"
                    >
                      <option value="">Tất cả các rạp (Hệ thống)</option>
                      {cinemaOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="pe-modal-actions">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="pe-btn-cancel"
                    disabled={submitting}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="pe-btn-submit"
                    disabled={submitting}
                  >
                    {submitting ? "Đang lưu..." : editId !== null ? "Cập Nhật" : "Thêm Chi Nhánh"}
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

function StatCard({ icon, iconBg, iconColor, label, value, subLabel }) {
  return (
    <div className="pe-stat-card">
      <div
        className="pe-stat-icon"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div className="pe-stat-body">
        <p className="pe-stat-label">{label}</p>
        <p className="pe-stat-value">
          {value} {subLabel && <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 500, marginLeft: 4 }}>{subLabel}</span>}
        </p>
      </div>
    </div>
  );
}