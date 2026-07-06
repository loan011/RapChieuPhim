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
} from "./usePersonnel.js";

const {
  MdPeople: IconPeople,
  MdPerson: IconPerson,
  MdAccessTime: IconClock,
  MdPersonRemove: IconRemove,
  MdSearch: IconSearch,
  MdAdd: IconAdd,
  MdVisibility: IconView,
  MdEdit: IconEdit,
  MdDelete: IconDelete,
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
      <div className="pe-header">
        <h4 className="pe-title">Quản Lý Nhân Viên</h4>
        <button className="pe-btn-add" onClick={openAddModal}>
          <IconAdd size={18} /> Thêm nhân viên
        </button>
      </div>

      {/* ── Stats row (4 cards) ── */}
      <div className="pe-stats-row">
        <StatCard
          icon={<IconPeople size={26} />}
          iconBg="#f0f4ff"
          iconColor="#6366f1"
          label="Tổng nhân viên"
          value={`${totalCount} nhân viên`}
        />
        <StatCard
          icon={<IconPerson size={26} />}
          iconBg="#e6f9f0"
          iconColor="#16a34a"
          label="Đang làm việc"
          value={`${activeCount} nhân viên`}
        />
        <StatCard
          icon={<IconClock size={26} />}
          iconBg="#fff3e0"
          iconColor="#e67e00"
          label="Tạm nghỉ"
          value={`${temporaryCount} nhân viên`}
        />
        <StatCard
          icon={<IconRemove size={26} />}
          iconBg="#fef2f2"
          iconColor="#dc2626"
          label="Nghỉ việc"
          value={`${resignedCount} nhân viên`}
        />
      </div>

      {/* ── Filters bar ── */}
      <div className="pe-filter-bar">
        <div className="pe-search-wrap">
          <IconSearch size={18} className="pe-search-icon" />
          <input
            type="text"
            className="pe-search-input"
            placeholder="Tìm kiếm nhân viên..."
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

        <select
          className="pe-filter-select"
          value={filterPos}
          onChange={(e) => {
            setFilterPos(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tất cả vị trí</option>
          {EMPLOYEE_POSITION_OPTIONS.map((pos) => (
            <option key={pos.value} value={pos.value}>
              {pos.label}
            </option>
          ))}
        </select>

        <select
          className="pe-filter-select"
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tất cả trạng thái</option>
          {EMPLOYEE_STATUS_OPTIONS.map((st) => (
            <option key={st.value} value={st.value}>
              {st.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Loading / Error ── */}
      {loading && <p className="pe-msg">Đang tải danh sách nhân viên...</p>}
      {error && <p className="pe-msg pe-msg--error">{error}</p>}

      {/* ── Table view matching the mockup ── */}
      {!loading && !error && (
        <>
          <div className="pe-table-card">
            <div className="pe-table-responsive">
              <table className="pe-table">
                <thead>
                  <tr>
                    <th style={{ width: "50px" }}>#</th>
                    <th>Nhân viên</th>
                    <th>Vị trí</th>
                    <th>Chi nhánh</th>
                    <th>SĐT</th>
                    <th>Email</th>
                    <th>Trạng thái</th>
                    <th style={{ width: "200px", textAlign: "center" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="pe-table-empty">
                        Không có nhân viên nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((employee, idx) => {
                      const id = getEmployeeId(employee);
                      const name = getEmployeeName(employee);
                      const email = getEmployeeEmail(employee);
                      const phone = getEmployeePhone(employee);
                      const position = getEmployeePosition(employee);
                      const status = getEmployeeStatus(employee);
                      const badgeStyle = getStatusBadgeStyle(status);
                      const cinemaId = getStaffCinemaId(employee);
                      const cinema = cinemas?.find(
                        (c) => String(c.cinemaId || c.id) === String(cinemaId)
                      );
                      const cinemaName = cinema
                        ? cinema.cinemaName || cinema.CinemaName
                        : "Tất cả chi nhánh";

                      const globalIndex = idx + 1 + (safePage - 1) * PAGE_SIZE;
                      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        name
                      )}&background=f0f4ff&color=6366f1&size=34&font-size=0.45&bold=true`;

                      return (
                        <tr key={id || idx}>
                          <td className="pe-col-idx">{globalIndex}</td>
                          <td>
                            <div className="pe-user-cell">
                              <img
                                src={avatarUrl}
                                alt={name}
                                className="pe-user-avatar"
                              />
                              <span className="pe-user-name">{name}</span>
                            </div>
                          </td>
                          <td className="pe-user-pos">{position}</td>
                          <td className="pe-user-cinema">{cinemaName}</td>
                          <td className="pe-user-phone">{phone || "—"}</td>
                          <td className="pe-user-email">{email}</td>
                          <td>
                            <span
                              className="pe-status-badge"
                              style={{
                                background: badgeStyle.bg,
                                color: badgeStyle.color,
                              }}
                            >
                              {badgeStyle.label}
                            </span>
                          </td>
                          <td>
                            <div className="pe-row-actions">
                              <button
                                className="pe-row-btn pe-row-btn--detail"
                                onClick={() => openEditModal(employee)}
                              >
                                <IconView size={14} /> Chi tiết
                              </button>
                              <button
                                className="pe-row-btn pe-row-btn--edit"
                                onClick={() => openEditModal(employee)}
                              >
                                <IconEdit size={14} /> Sửa
                              </button>
                              <button
                                className="pe-row-btn pe-row-btn--delete"
                                onClick={() => handleDelete(id)}
                                title="Xóa nhân viên"
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

          {/* ── Pagination ── */}
          {filtered.length > 0 && (
            <div className="pe-footer">
              <span className="pe-footer-info">
                Hiển thị {Math.min((safePage - 1) * PAGE_SIZE + 1, filtered.length)}–
                {Math.min(safePage * PAGE_SIZE, filtered.length)} của {filtered.length} nhân viên
              </span>
              <div className="pe-pagination">
                <button
                  className="pe-page-btn"
                  disabled={safePage === 1}
                  onClick={() => setPage(safePage - 1)}
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`pe-page-btn${
                      p === safePage ? " pe-page-btn--active" : ""
                    }`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="pe-page-btn"
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
          <div className="pe-modal-overlay">
            <div className="pe-modal">
              <h5 className="pe-modal-title">
                {editId !== null ? "Cập Nhật Nhân Viên" : "Thêm Nhân Viên Mới"}
              </h5>
              {formError && <p className="pe-form-error">{formError}</p>}

              <form onSubmit={handleSubmit} className="pe-form">
                {/* Họ tên */}
                <div className="pe-field">
                  <label className="pe-label">
                    Họ Tên <span className="pe-required">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    className="pe-input"
                    placeholder="Nhập họ tên nhân viên"
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

                {/* Điện thoại & Lương */}
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
                    <label className="pe-label">Mức Lương (VND)</label>
                    <input
                      type="number"
                      name="salary"
                      value={form.salary}
                      onChange={handleChange}
                      className="pe-input"
                      placeholder="VD: 5000000"
                    />
                  </div>
                </div>

                {/* Chi nhánh & Vị trí */}
                <div className="pe-field-row">
                  <div className="pe-field">
                    <label className="pe-label">Chi Nhánh Rạp</label>
                    <select
                      name="cinemaId"
                      value={form.cinemaId}
                      onChange={handleChange}
                      className="pe-input"
                    >
                      <option value="">Tất cả các rạp (Hệ thống)</option>
                      {cinemas.map((c) => (
                        <option key={c.cinemaId || c.id} value={c.cinemaId || c.id}>
                          {c.cinemaName || c.CinemaName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pe-field">
                    <label className="pe-label">Vị Trí công việc</label>
                    <select
                      name="position"
                      value={form.position}
                      onChange={handleChange}
                      className="pe-input"
                    >
                      {EMPLOYEE_POSITION_OPTIONS.map((pos) => (
                        <option key={pos.value} value={pos.value}>
                          {pos.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Trạng thái */}
                <div className="pe-field">
                  <label className="pe-label">Trạng Thái làm việc</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="pe-input"
                  >
                    {EMPLOYEE_STATUS_OPTIONS.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
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
                    {submitting ? "Đang lưu..." : editId !== null ? "Cập Nhật" : "Thêm Nhân Viên"}
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
    <div className="pe-stat-card">
      <div
        className="pe-stat-icon"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div className="pe-stat-body">
        <p className="pe-stat-label">{label}</p>
        <p className="pe-stat-value">{value}</p>
      </div>
    </div>
  );
}