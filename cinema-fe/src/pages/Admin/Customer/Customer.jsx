import "./Customer.css";
import { createPortal } from "react-dom";
import { useState } from "react";
import {
  MdPeople,
  MdStar,
  MdPerson,
  MdAttachMoney,
  MdSearch,
  MdRefresh,
  MdVisibility,
  MdEdit,
  MdDelete,
  MdClose,
} from "react-icons/md";
import {
  useCustomer,
  getCustomerId,
  getCustomerName,
  getCustomerEmail,
  getCustomerPhone,
  getCustomerPoint,
  getCustomerCreatedAt,
  getCustomerGroup,
  getCustomerSpend,
  getGroupStyle,
  VIP_THRESHOLD,
} from "./useCustomer.js";



function formatCurrency(value) {
  return `${Number(value).toLocaleString("vi-VN")}đ`;
}

/* ── Donut Chart: VIP vs Thường vs Mới ── */
function GroupDonut({ vip, usual }) {
  const total = vip + usual || 1;
  const r = 32;
  const c = 2 * Math.PI * r;
  const pVip    = (vip    / total) * 100;
  const pUsual  = (usual  / total) * 100;

  const dashVip    = `${(pVip    * c) / 100} ${c}`;
  const dashUsual  = `${(pUsual  * c) / 100} ${c}`;

  const offVip    = 0;
  const offUsual  = -((pVip    * c) / 100);

  return (
    <svg width="120" height="120" viewBox="0 0 100 100" className="cu-chart-svg">
      <circle cx="50" cy="50" r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
      {pVip > 0 && (
        <circle cx="50" cy="50" r={r} fill="transparent" stroke="#a855f7" strokeWidth="10"
          strokeDasharray={dashVip} strokeDashoffset={offVip} strokeLinecap="round" />
      )}
      {pUsual > 0 && (
        <circle cx="50" cy="50" r={r} fill="transparent" stroke="#3b82f6" strokeWidth="10"
          strokeDasharray={dashUsual} strokeDashoffset={offUsual} strokeLinecap="round" />
      )}
      <text x="50" y="54" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f172a" transform="rotate(90 50 50)">
        {vip + usual}
      </text>
    </svg>
  );
}

export default function Customer() {
  const {
    loading, error,
    search,       setSearch,
    filterGroup,  setFilterGroup,
    resetFilters,
    filtered,
    stats,
    spendMap,
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

  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="cu-wrapper">
      {/* ── Header ── */}
      <div className="cu-header">
        <h4 className="cu-title">Khách Hàng Hệ Thống</h4>
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
            <span className="cu-stat-desc">Người dùng đã đăng ký</span>
          </div>
        </div>

        <div className="cu-stat-card">
          <div className="cu-stat-icon-wrap" style={{ backgroundColor: "#f3e8ff", color: "#a855f7" }}>
            <MdStar size={24} />
          </div>
          <div className="cu-stat-info">
            <span className="cu-stat-label">Khách VIP</span>
            <span className="cu-stat-value">{stats.vip.toLocaleString("vi-VN")}</span>
            <span className="cu-stat-desc">Chi tiêu ≥ {formatCurrency(VIP_THRESHOLD)}</span>
          </div>
        </div>

        <div className="cu-stat-card">
          <div className="cu-stat-icon-wrap" style={{ backgroundColor: "#eff6ff", color: "#3b82f6" }}>
            <MdPerson size={24} />
          </div>
          <div className="cu-stat-info">
            <span className="cu-stat-label">Khách thường</span>
            <span className="cu-stat-value">{stats.usual.toLocaleString("vi-VN")}</span>
            <span className="cu-stat-desc">Đã mua, chưa đạt VIP</span>
          </div>
        </div>



        <div className="cu-stat-card">
          <div className="cu-stat-icon-wrap" style={{ backgroundColor: "#fdf2f8", color: "#ec4899" }}>
            <MdAttachMoney size={24} />
          </div>
          <div className="cu-stat-info">
            <span className="cu-stat-label">Tổng doanh thu từ KH</span>
            <span className="cu-stat-value" style={{ fontSize: "1.05rem" }}>
              {formatCurrency(stats.totalSpend)}
            </span>
            <span className="cu-stat-desc">Tất cả khách hàng</span>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="cu-main-grid">
        {/* Left: Table */}
        <div className="cu-list-card">
          <div className="cu-filter-bar">
            <div className="cu-search-wrap">
              <MdSearch size={18} className="cu-search-icon" />
              <input
                type="text"
                className="cu-search-input"
                placeholder="Tìm theo tên, SĐT, email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); }}
              />
            </div>

            <select
              className="cu-filter-select"
              value={filterGroup}
              onChange={(e) => { setFilterGroup(e.target.value); }}
            >
              <option value="">Nhóm: Tất cả</option>
              <option value="VIP">VIP</option>
              <option value="Thường">Thường</option>
            </select>

            <button className="cu-btn-reset" onClick={resetFilters} title="Đặt lại bộ lọc">
              <MdRefresh size={16} style={{ marginRight: 6 }} />
              Đặt lại
            </button>
          </div>

          {loading && <p className="text-gray-500 text-sm">Đang tải danh sách khách hàng...</p>}
          {error   && <p className="text-red-500 text-sm">{error}</p>}

          {!loading && !error && (
            <div className="cu-table-responsive">
              <table className="cu-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>STT</th>
                    <th>Khách hàng</th>
                    <th>SĐT</th>
                    <th>Email</th>
                    <th>Nhóm</th>
                    <th>Điểm tích lũy</th>
                    <th>Tổng chi tiêu</th>
                    <th>Ngày đăng ký</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center", padding: "30px 10px", color: "#94a3b8", fontStyle: "italic" }}>
                        Không tìm thấy khách hàng nào phù hợp
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c, index) => {
                      const id    = getCustomerId(c);
                      const group = getCustomerGroup(c, spendMap);
                      const spend = getCustomerSpend(c, spendMap);
                      const groupStyle = getGroupStyle(group);
                      const avatarSeed = String(id || index).slice(-3);
                      const avatarUrl  = `https://api.dicebear.com/7.x/adventurer/svg?seed=${avatarSeed}`;

                      return (
                        <tr key={id || index}>
                          <td>{index + 1}</td>
                          <td>
                            <div className="cu-user-info">
                              <img src={avatarUrl} alt="Avatar" className="cu-user-avatar" />
                              <span className="cu-user-name">{getCustomerName(c)}</span>
                            </div>
                          </td>
                          <td>{getCustomerPhone(c)}</td>
                          <td>{getCustomerEmail(c)}</td>
                          <td>
                            <span className="cu-badge" style={{ backgroundColor: groupStyle.bg, color: groupStyle.color }}>
                              {group === "VIP" && "⭐ "}
                              {group}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>{getCustomerPoint(c).toLocaleString("vi-VN")}</td>
                          <td className="cu-spend-txt" style={{ color: spend >= VIP_THRESHOLD ? "#a855f7" : undefined }}>
                            {formatCurrency(spend)}
                          </td>
                          <td>{getCustomerCreatedAt(c)}</td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* Right: Widgets */}
        <div className="cu-right-col">
          {/* Donut chart widget */}
          <div className="cu-widget-card">
            <h6 className="cu-widget-title">Phân nhóm khách hàng</h6>
            <div className="cu-chart-container">
              <GroupDonut vip={stats.vip} usual={stats.usual} />
              <div className="cu-chart-legends">
                <div className="cu-legend-item">
                  <span className="cu-legend-label">
                    <span className="cu-legend-dot" style={{ backgroundColor: "#a855f7" }} />
                    VIP (≥ {formatCurrency(VIP_THRESHOLD)})
                  </span>
                  <span className="cu-legend-val">
                    {stats.vip} ({stats.total > 0 ? ((stats.vip / stats.total) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="cu-legend-item">
                  <span className="cu-legend-label">
                    <span className="cu-legend-dot" style={{ backgroundColor: "#3b82f6" }} />
                    Thường
                  </span>
                  <span className="cu-legend-val">
                    {stats.usual} ({stats.total > 0 ? ((stats.usual / stats.total) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* VIP policy card */}
          <div className="cu-widget-card">
            <h6 className="cu-widget-title">⭐ Chính sách VIP</h6>
            <div className="cu-activities">
              <div className="cu-activity-item">
                <div className="cu-activity-icon" style={{ backgroundColor: "#f3e8ff", color: "#a855f7" }}>
                  <MdStar size={16} />
                </div>
                <div className="cu-activity-content">
                  <span className="cu-activity-title">Điều kiện đạt VIP</span>
                  <span className="cu-activity-desc">
                    Tổng thanh toán tích lũy đạt <strong>{formatCurrency(VIP_THRESHOLD)}</strong> trở lên sẽ tự động được xếp hạng <strong>VIP</strong>.
                  </span>
                </div>
              </div>
              <div className="cu-activity-item">
                <div className="cu-activity-icon" style={{ backgroundColor: "#eff6ff", color: "#3b82f6" }}>
                  <MdPerson size={16} />
                </div>
                <div className="cu-activity-content">
                  <span className="cu-activity-title">Khách hàng thường</span>
                  <span className="cu-activity-desc">
                    Đã có ít nhất 1 giao dịch thanh toán thành công nhưng chưa đạt ngưỡng VIP.
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Modal Thêm / Sửa ── */}
      {showModal &&
        createPortal(
          <div className="cu-modal-overlay">
            <div className="cu-modal-card">
              <div className="cu-modal-header">
                <h5 className="cu-modal-title">
                  {editId !== null ? "Cập Nhật Khách Hàng" : "Thêm Khách Hàng"}
                </h5>
                <button className="cu-modal-close" onClick={closeModal}><MdClose /></button>
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
                      disabled={editId !== null}
                    />
                  </div>
                  <div className="cu-form-field">
                    <label className="cu-label">Điện Thoại</label>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Số điện thoại (10 chữ số)"
                      className="cu-input"
                    />
                  </div>
                  <div className="cu-modal-footer" style={{ padding: "12px 0 0 0", borderTop: "none" }}>
                    <button type="button" onClick={closeModal} className="cu-btn-cancel" disabled={submitting}>Hủy</button>
                    <button type="submit" className="cu-btn-submit" disabled={submitting}>
                      {submitting ? "Đang lưu..." : editId !== null ? "Cập Nhật" : "Thêm Mới"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── Modal Xem chi tiết ── */}
      {selectedUser &&
        createPortal(
          <div className="cu-modal-overlay">
            <div className="cu-modal-card">
              <div className="cu-modal-header">
                <h5 className="cu-modal-title">Thông Tin Chi Tiết Khách Hàng</h5>
                <button className="cu-modal-close" onClick={() => setSelectedUser(null)}><MdClose /></button>
              </div>
              <div className="cu-modal-body">
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Avatar + Name + Group badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid #f1f5f9", paddingBottom: 16 }}>
                    <img
                      src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${String(getCustomerId(selectedUser) || 1).slice(-3)}`}
                      alt="Avatar"
                      style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "#f1f5f9" }}
                    />
                    <div>
                      <h6 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>{getCustomerName(selectedUser)}</h6>
                      <span
                        className="cu-badge"
                        style={{ ...getGroupStyle(getCustomerGroup(selectedUser, spendMap)), marginTop: 6, display: "inline-block" }}
                      >
                        {getCustomerGroup(selectedUser, spendMap) === "VIP" && "⭐ "}
                        Hạng {getCustomerGroup(selectedUser, spendMap)}
                      </span>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: "0.82rem" }}>
                    <div>
                      <strong>Email:</strong>
                      <p style={{ margin: "4px 0 0 0", color: "#475569" }}>{getCustomerEmail(selectedUser)}</p>
                    </div>
                    <div>
                      <strong>Điện thoại:</strong>
                      <p style={{ margin: "4px 0 0 0", color: "#475569" }}>{getCustomerPhone(selectedUser)}</p>
                    </div>
                    <div>
                      <strong>Điểm tích lũy:</strong>
                      <p style={{ margin: "4px 0 0 0", color: "#475569" }}>{getCustomerPoint(selectedUser).toLocaleString("vi-VN")} điểm</p>
                    </div>
                    <div>
                      <strong>Tổng chi tiêu:</strong>
                      <p style={{ margin: "4px 0 0 0", color: "#10b981", fontWeight: 700 }}>
                        {formatCurrency(getCustomerSpend(selectedUser, spendMap))}
                      </p>
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <strong>Ngày đăng ký:</strong>
                      <p style={{ margin: "4px 0 0 0", color: "#475569" }}>{getCustomerCreatedAt(selectedUser)}</p>
                    </div>
                    {getCustomerGroup(selectedUser, spendMap) !== "VIP" && getCustomerGroup(selectedUser, spendMap) !== "Mới" && (
                      <div style={{ gridColumn: "span 2" }}>
                        <strong>Cần thêm để đạt VIP:</strong>
                        <p style={{ margin: "4px 0 0 0", color: "#a855f7", fontWeight: 600 }}>
                          {formatCurrency(VIP_THRESHOLD - getCustomerSpend(selectedUser, spendMap))}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="cu-modal-footer">
                <button className="cu-btn-cancel" onClick={() => setSelectedUser(null)}>Đóng</button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}