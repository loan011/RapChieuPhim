import "./Customer.css";
import { createPortal } from "react-dom";
import { useState } from "react";
import {
  MdPeople,
  MdPersonOff,
  MdLaptop,
  MdDesktopWindows,
  MdAttachMoney,
  MdSearch,
  MdFilterAlt,
  MdRefresh,
  MdVisibility,
  MdEdit,
  MdDelete,
  MdStar,
  MdCancel,
  MdVideocam,
  MdClose,
} from "react-icons/md";
import {
  CUSTOMER_MEMBERSHIP_OPTIONS,
  useCustomer,
  getCustomerId,
  getCustomerName,
  getCustomerEmail,
  getCustomerPhone,
  getCustomerPoint,
  getCustomerCreatedAt,
  getCustomerType,
  getCustomerGroup,
  getCustomerSpend,
  getCustomerStatus,
  getTypeStyle,
  getGroupStyle,
  getStatusStyle,
  getCustomerWatchHistory,
} from "./useCustomer.js";

const PAGE_SIZE = 10;

function formatCurrency(value) {
  return `${Number(value).toLocaleString("vi-VN")}đ`;
}

function CircularChart({ usedSystem, counter, notUsed }) {
  const total = usedSystem + counter + notUsed || 1;
  const pUsed = (usedSystem / total) * 100;
  const pCounter = (counter / total) * 100;
  const pNotUsed = (notUsed / total) * 100;

  const r = 32;
  const c = 2 * Math.PI * r; // ~201.06

  const dashUsed = `${(pUsed * c) / 100} ${c}`;
  const dashCounter = `${(pCounter * c) / 100} ${c}`;
  const dashNotUsed = `${(pNotUsed * c) / 100} ${c}`;

  const offsetUsed = 0;
  const offsetCounter = -((pUsed * c) / 100);
  const offsetNotUsed = -(((pUsed + pCounter) * c) / 100);

  return (
    <svg width="120" height="120" viewBox="0 0 100 100" className="cu-chart-svg">
      <circle cx="50" cy="50" r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
      {pUsed > 0 && (
        <circle cx="50" cy="50" r={r} fill="transparent" stroke="#10b981" strokeWidth="10"
          strokeDasharray={dashUsed} strokeDashoffset={offsetUsed} strokeLinecap="round" />
      )}
      {pCounter > 0 && (
        <circle cx="50" cy="50" r={r} fill="transparent" stroke="#3b82f6" strokeWidth="10"
          strokeDasharray={dashCounter} strokeDashoffset={offsetCounter} strokeLinecap="round" />
      )}
      {pNotUsed > 0 && (
        <circle cx="50" cy="50" r={r} fill="transparent" stroke="#6b7280" strokeWidth="10"
          strokeDasharray={dashNotUsed} strokeDashoffset={offsetNotUsed} strokeLinecap="round" />
      )}
      <text x="50" y="54" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f172a" transform="rotate(90 50 50)">
        {usedSystem + counter + notUsed}
      </text>
    </svg>
  );
}

export default function Customer() {
  const {
    loading,
    error,
    search,
    setSearch,
    filterType,
    setFilterType,
    filterGroup,
    setFilterGroup,
    filterStatus,
    setFilterStatus,
    filterDate,
    setFilterDate,
    resetFilters,

    filtered,
    stats,

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
  } = useCustomer();

  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);

  // Pagination bounds
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="cu-wrapper">
      {/* ── Header ── */}
      <div className="cu-header">
        <h4 className="cu-title">Quản Lý Khách Hàng</h4>
        <button className="cu-btn-add" onClick={openAddModal}>
          + Thêm khách hàng
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="cu-stats-row">
        <div className="cu-stat-card">
          <div className="cu-stat-icon-wrap" style={{ backgroundColor: "#eff6ff", color: "#3b82f6" }}>
            <MdPeople size={24} />
          </div>
          <div className="cu-stat-info">
            <span className="cu-stat-label">Tổng khách hàng</span>
            <span className="cu-stat-value">{stats.total.toLocaleString("vi-VN")}</span>
            <span className="cu-stat-desc">Tất cả khách hàng</span>
          </div>
        </div>

        <div className="cu-stat-card">
          <div className="cu-stat-icon-wrap" style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}>
            <MdPersonOff size={24} />
          </div>
          <div className="cu-stat-info">
            <span className="cu-stat-label">Khách không dùng hệ thống</span>
            <span className="cu-stat-value">{stats.notUsed.toLocaleString("vi-VN")}</span>
            <span className="cu-stat-desc">
              {stats.total > 0 ? ((stats.notUsed / stats.total) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        <div className="cu-stat-card">
          <div className="cu-stat-icon-wrap" style={{ backgroundColor: "#e6f9f0", color: "#10b981" }}>
            <MdLaptop size={24} />
          </div>
          <div className="cu-stat-info">
            <span className="cu-stat-label">Khách sử dụng hệ thống</span>
            <span className="cu-stat-value">{stats.usedSystem.toLocaleString("vi-VN")}</span>
            <span className="cu-stat-desc">
              {stats.total > 0 ? ((stats.usedSystem / stats.total) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        <div className="cu-stat-card">
          <div className="cu-stat-icon-wrap" style={{ backgroundColor: "#fff7ed", color: "#f97316" }}>
            <MdDesktopWindows size={24} />
          </div>
          <div className="cu-stat-info">
            <span className="cu-stat-label">Khách mua tại quầy</span>
            <span className="cu-stat-value">{stats.counter.toLocaleString("vi-VN")}</span>
            <span className="cu-stat-desc">
              {stats.total > 0 ? ((stats.counter / stats.total) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        <div className="cu-stat-card">
          <div className="cu-stat-icon-wrap" style={{ backgroundColor: "#fdf2f8", color: "#ec4899" }}>
            <MdAttachMoney size={24} />
          </div>
          <div className="cu-stat-info">
            <span className="cu-stat-label">Tổng chi tiêu</span>
            <span className="cu-stat-value" style={{ fontSize: "1.15rem" }}>
              {formatCurrency(stats.spend)}
            </span>
            <span className="cu-stat-desc">Tất cả khách hàng</span>
          </div>
        </div>
      </div>

      {/* ── Main content layout (2 cols) ── */}
      <div className="cu-main-grid">
        {/* Left Column: Customer list */}
        <div className="cu-list-card">
          {/* Filters */}
          <div className="cu-filter-bar">
            <div className="cu-search-wrap">
              <MdSearch size={18} className="cu-search-icon" />
              <input
                type="text"
                className="cu-search-input"
                placeholder="Tìm theo tên, SĐT, email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <select
              className="cu-filter-select"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Loại khách hàng: Tất cả</option>
              <option value="Sử dụng hệ thống">Sử dụng hệ thống</option>
              <option value="Mua tại quầy">Mua tại quầy</option>
              <option value="Không sử dụng">Không sử dụng</option>
            </select>

            <select
              className="cu-filter-select"
              value={filterGroup}
              onChange={(e) => {
                setFilterGroup(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Nhóm khách hàng: Tất cả</option>
              <option value="VIP">VIP</option>
              <option value="Thân thiết">Thân thiết</option>
              <option value="Thường">Thường</option>
              <option value="Mới">Mới</option>
            </select>

            <select
              className="cu-filter-select"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Trạng thái: Tất cả</option>
              <option value="Đã xem phim">Đã xem phim</option>
              <option value="Đã mua - Chưa xem">Đã mua - Chưa xem</option>
              <option value="Chưa sử dụng">Chưa sử dụng</option>
            </select>

            <button className="cu-btn-reset" onClick={resetFilters} title="Đặt lại bộ lọc">
              <MdRefresh size={16} style={{ marginRight: 6 }} />
              Đặt lại
            </button>
          </div>

          {/* Table */}
          {loading && <p className="text-gray-500 text-sm">Đang tải danh sách khách hàng...</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {!loading && !error && (
            <div className="cu-table-responsive">
              <table className="cu-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>STT</th>
                    <th>Khách hàng</th>
                    <th>SĐT</th>
                    <th>Email</th>
                    <th>Loại khách hàng</th>
                    <th>Nhóm khách hàng</th>
                    <th>Tổng chi tiêu</th>
                    <th>Trạng thái</th>
                    <th style={{ width: 100, textAlign: "center" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center", padding: "30px 10px", color: "#94a3b8", fontStyle: "italic" }}>
                        Không tìm thấy khách hàng nào phù hợp
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((c, index) => {
                      const id = getCustomerId(c);
                      const type = getCustomerType(c);
                      const group = getCustomerGroup(c);
                      const spend = getCustomerSpend(c);
                      const status = getCustomerStatus(c);

                      const typeStyle = getTypeStyle(type);
                      const groupStyle = getGroupStyle(group);
                      const statusStyle = getStatusStyle(status);

                      // Fake avatars for UI
                      const avatarSeed = String(id || index).slice(-2);
                      const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${avatarSeed}`;

                      return (
                        <tr key={id || index}>
                          <td>{(safePage - 1) * PAGE_SIZE + index + 1}</td>
                          <td>
                            <div className="cu-user-info">
                              <img src={avatarUrl} alt="Avatar" className="cu-user-avatar" />
                              <span className="cu-user-name">{getCustomerName(c)}</span>
                            </div>
                          </td>
                          <td>{getCustomerPhone(c)}</td>
                          <td>{getCustomerEmail(c)}</td>
                          <td>
                            <span className="cu-badge" style={{ backgroundColor: typeStyle.bg, color: typeStyle.color }}>
                              {type}
                            </span>
                          </td>
                          <td>
                            <span className="cu-badge" style={{ backgroundColor: groupStyle.bg, color: groupStyle.color }}>
                              {group}
                            </span>
                          </td>
                          <td className="cu-spend-txt">{formatCurrency(spend)}</td>
                          <td>
                            <span className="cu-badge" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                              {status}
                            </span>
                          </td>
                          <td>
                            <div className="cu-actions">
                              <button
                                className="cu-action-btn cu-action-btn--view"
                                title="Xem chi tiết"
                                onClick={() => setSelectedUser(c)}
                              >
                                <MdVisibility size={18} />
                              </button>
                              <button
                                className="cu-action-btn cu-action-btn--edit"
                                title="Chỉnh sửa"
                                onClick={() => openEditModal(c)}
                              >
                                <MdEdit size={18} />
                              </button>
                              <button
                                className="cu-action-btn cu-action-btn--delete"
                                title="Xóa"
                                onClick={() => handleDelete(id)}
                              >
                                <MdDelete size={18} />
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

          {/* Table pagination */}
          {!loading && !error && filtered.length > 0 && (
            <div className="cu-pagination-footer">
              <span className="cu-footer-info">
                Hiển thị {Math.min((safePage - 1) * PAGE_SIZE + 1, filtered.length)} - {Math.min(safePage * PAGE_SIZE, filtered.length)} của {filtered.length} khách hàng
              </span>
              <div className="cu-pagination">
                <button
                  className="cu-page-btn"
                  disabled={safePage === 1}
                  onClick={() => setPage(safePage - 1)}
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`cu-page-btn${p === safePage ? " cu-page-btn--active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="cu-page-btn"
                  disabled={safePage === totalPages}
                  onClick={() => setPage(safePage + 1)}
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Widgets */}
        <div className="cu-right-col">
          {/* Widget 1: Classification & Stats */}
          <div className="cu-widget-card">
            <h6 className="cu-widget-title">Phân loại & Thống kê khách hàng</h6>
            <div className="cu-chart-container">
              <CircularChart
                usedSystem={stats.usedSystem}
                counter={stats.counter}
                notUsed={stats.notUsed}
              />
              <div className="cu-chart-legends">
                <div className="cu-legend-item">
                  <span className="cu-legend-label">
                    <span className="cu-legend-dot" style={{ backgroundColor: "#10b981" }} />
                    Sử dụng hệ thống
                  </span>
                  <span className="cu-legend-val">
                    {stats.usedSystem} ({stats.total > 0 ? ((stats.usedSystem / stats.total) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="cu-legend-item">
                  <span className="cu-legend-label">
                    <span className="cu-legend-dot" style={{ backgroundColor: "#3b82f6" }} />
                    Mua tại quầy
                  </span>
                  <span className="cu-legend-val">
                    {stats.counter} ({stats.total > 0 ? ((stats.counter / stats.total) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="cu-legend-item">
                  <span className="cu-legend-label">
                    <span className="cu-legend-dot" style={{ backgroundColor: "#6b7280" }} />
                    Không sử dụng
                  </span>
                  <span className="cu-legend-val">
                    {stats.notUsed} ({stats.total > 0 ? ((stats.notUsed / stats.total) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 2: Activities & Policies */}
          <div className="cu-widget-card">
            <h6 className="cu-widget-title">Hoạt động của khách hàng</h6>
            <div className="cu-activities">
              <div className="cu-activity-item">
                <div className="cu-activity-icon" style={{ backgroundColor: "#fef3c7", color: "#d97706" }}>
                  <MdStar size={16} />
                </div>
                <div className="cu-activity-content">
                  <span className="cu-activity-title">Đã xem phim - Đánh giá</span>
                  <span className="cu-activity-desc">Chỉ khách hàng đã xem phim mới được đánh giá phim đã chiếu.</span>
                </div>
              </div>

              <div className="cu-activity-item">
                <div className="cu-activity-icon" style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}>
                  <MdCancel size={16} />
                </div>
                <div className="cu-activity-content">
                  <span className="cu-activity-title">Đã mua vé - Chưa xem</span>
                  <ul className="cu-activity-list">
                    <li><span className="cu-activity-dot" /> Hủy vé (hoàn tiền 50%)</li>
                    <li><span className="cu-activity-dot" /> Đổi khung giờ chiếu khác</li>
                    <li><span className="cu-activity-dot" /> Quên giờ chiếu - Hệ thống nhắc</li>
                  </ul>
                </div>
              </div>

              <div className="cu-activity-item">
                <div className="cu-activity-icon" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>
                  <MdVideocam size={16} />
                </div>
                <div className="cu-activity-content">
                  <span className="cu-activity-title">Quay lén phim</span>
                  <span className="cu-activity-desc">Cảnh báo nhắc nhở lần 1. Vi phạm lần 2 sẽ xử phạt hành chính theo quy định.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 3: Membership Groups */}
          <div className="cu-widget-card">
            <h6 className="cu-widget-title">Nhóm khách hàng</h6>
            <div className="cu-group-list">
              <div className="cu-group-item">
                <span className="cu-group-name">
                  <span className="cu-group-tag" style={{ backgroundColor: "#a855f7" }} />
                  VIP
                </span>
                <span className="cu-group-val">
                  {stats.groups.vip} ({stats.total > 0 ? ((stats.groups.vip / stats.total) * 100).toFixed(1) : 0}%)
                </span>
              </div>
              <div className="cu-group-item">
                <span className="cu-group-name">
                  <span className="cu-group-tag" style={{ backgroundColor: "#f97316" }} />
                  Thân thiết
                </span>
                <span className="cu-group-val">
                  {stats.groups.thânThiết} ({stats.total > 0 ? ((stats.groups.thânThiết / stats.total) * 100).toFixed(1) : 0}%)
                </span>
              </div>
              <div className="cu-group-item">
                <span className="cu-group-name">
                  <span className="cu-group-tag" style={{ backgroundColor: "#3b82f6" }} />
                  Thường
                </span>
                <span className="cu-group-val">
                  {stats.groups.thường} ({stats.total > 0 ? ((stats.groups.thường / stats.total) * 100).toFixed(1) : 0}%)
                </span>
              </div>
              <div className="cu-group-item">
                <span className="cu-group-name">
                  <span className="cu-group-tag" style={{ backgroundColor: "#22c55e" }} />
                  Mới
                </span>
                <span className="cu-group-val">
                  {stats.groups.mới} ({stats.total > 0 ? ((stats.groups.mới / stats.total) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal Add / Edit ── */}
      {showModal &&
        createPortal(
          <div className="cu-modal-overlay">
            <div className="cu-modal-card">
              <div className="cu-modal-header">
                <h5 className="cu-modal-title">
                  {editId !== null ? "Cập Nhật Khách Hàng" : "Thêm Khách Hàng"}
                </h5>
                <button className="cu-modal-close" onClick={closeModal}>
                  <MdClose />
                </button>
              </div>

              <div className="cu-modal-body">
                {formError && <div className="cu-form-error mb-3">{formError}</div>}

                <form onSubmit={handleSubmit} className="cu-form">
                  <div className="cu-form-field">
                    <label className="cu-label">Họ Tên <span>*</span></label>
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="Nhập họ tên khách hàng"
                      className="cu-input"
                      required
                    />
                  </div>

                  <div className="cu-form-field">
                    <label className="cu-label">Email <span>*</span></label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Nhập địa chỉ email"
                      className="cu-input"
                      required
                    />
                  </div>

                  <div className="cu-form-grid">
                    <div className="cu-form-field">
                      <label className="cu-label">Điện Thoại</label>
                      <input
                        type="text"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="Số điện thoại"
                        className="cu-input"
                      />
                    </div>

                    <div className="cu-form-field">
                      <label className="cu-label">Điểm Tích Lũy</label>
                      <input
                        type="number"
                        name="rewardPoint"
                        value={form.rewardPoint}
                        onChange={handleChange}
                        placeholder="Điểm"
                        className="cu-input"
                      />
                    </div>
                  </div>

                  <div className="cu-form-field">
                    <label className="cu-label">Hạng Thành Viên</label>
                    <select
                      name="membershipLevel"
                      value={form.membershipLevel}
                      onChange={handleChange}
                      className="cu-filter-select"
                    >
                      {CUSTOMER_MEMBERSHIP_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="cu-modal-footer" style={{ padding: "12px 0 0 0", borderTop: "none" }}>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="cu-btn-cancel"
                      disabled={submitting}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="cu-btn-submit"
                      disabled={submitting}
                    >
                      {submitting ? "Đang lưu..." : editId !== null ? "Cập Nhật" : "Thêm Mới"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── Modal View Detail ── */}
      {selectedUser &&
        createPortal(
          <div className="cu-modal-overlay">
            <div className="cu-modal-card">
              <div className="cu-modal-header">
                <h5 className="cu-modal-title">Thông Tin Chi Tiết Khách Hàng</h5>
                <button className="cu-modal-close" onClick={() => setSelectedUser(null)}>
                  <MdClose />
                </button>
              </div>
              <div className="cu-modal-body">
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid #f1f5f9", paddingBottom: 16 }}>
                    <img
                      src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${String(getCustomerId(selectedUser) || 1).slice(-2)}`}
                      alt="Avatar"
                      style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "#f1f5f9" }}
                    />
                    <div>
                      <h6 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>{getCustomerName(selectedUser)}</h6>
                      <span className="cu-badge" style={{ ...getGroupStyle(getCustomerGroup(selectedUser)), marginTop: 6 }}>
                        Hạng {getCustomerGroup(selectedUser)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: "0.82rem" }}>
                    <div>
                      <strong>Email:</strong> <p style={{ margin: "4px 0 0 0", color: "#475569" }}>{getCustomerEmail(selectedUser)}</p>
                    </div>
                    <div>
                      <strong>Điện thoại:</strong> <p style={{ margin: "4px 0 0 0", color: "#475569" }}>{getCustomerPhone(selectedUser)}</p>
                    </div>
                    <div>
                      <strong>Loại khách hàng:</strong> <p style={{ margin: "4px 0 0 0", color: "#475569" }}>{getCustomerType(selectedUser)}</p>
                    </div>
                    <div>
                      <strong>Trạng thái:</strong> <p style={{ margin: "4px 0 0 0", color: "#475569" }}>{getCustomerStatus(selectedUser)}</p>
                    </div>
                    <div>
                      <strong>Điểm tích lũy:</strong> <p style={{ margin: "4px 0 0 0", color: "#475569" }}>{getCustomerPoint(selectedUser)} điểm</p>
                    </div>
                    <div>
                      <strong>Tổng chi tiêu:</strong> <p style={{ margin: "4px 0 0 0", color: "#10b981", fontWeight: 700 }}>{formatCurrency(getCustomerSpend(selectedUser))}</p>
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <strong>Ngày đăng ký:</strong> <p style={{ margin: "4px 0 0 0", color: "#475569" }}>{getCustomerCreatedAt(selectedUser)}</p>
                    </div>
                  </div>

                  {/* Lịch sử xem phim & Đánh giá */}
                  <div>
                    <div className="cu-history-title">Lịch sử xem phim & Đánh giá</div>
                    {getCustomerWatchHistory(selectedUser).length === 0 ? (
                      <p style={{ fontSize: "0.78rem", color: "#64748b", fontStyle: "italic", margin: 0 }}>
                        Khách hàng này chưa có lịch sử xem phim và đánh giá.
                      </p>
                    ) : (
                      <div className="cu-history-list">
                        {getCustomerWatchHistory(selectedUser).map((h, i) => (
                          <div className="cu-history-item" key={i}>
                            <div className="cu-history-header">
                              <span className="cu-history-movie">{h.title}</span>
                              <span className="cu-history-date">{h.date}</span>
                            </div>
                            <div className="cu-history-stars">
                              {Array.from({ length: h.rating }).map((_, sIdx) => (
                                <span key={sIdx}>★</span>
                              ))}
                              {Array.from({ length: 5 - h.rating }).map((_, sIdx) => (
                                <span key={sIdx} style={{ color: "#cbd5e1" }}>★</span>
                              ))}
                            </div>
                            <p className="cu-history-comment">"{h.comment}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="cu-modal-footer">
                <button className="cu-btn-cancel" onClick={() => setSelectedUser(null)}>
                  Đóng
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}