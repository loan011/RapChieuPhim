import React from "react";
import "./Discount.css";
import {
  MdAdd,
  MdLocalOffer,
  MdSearch,
  MdEdit,
  MdDelete,
  MdVisibility,
  MdCheckCircle,
  MdConfirmationNumber,
} from "react-icons/md";
import {
  useDiscount,
  getDiscountStatus,
  formatCurrency,
} from "./useDiscount";

export default function Discount() {
  const {
    discounts,
    totalCount,
    activeCount,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    showModal,
    setShowModal,
    editId,
    form,
    formError,
    submitting,
    deleteConfirmId,
    setDeleteConfirmId,
    detailDiscount,
    setDetailDiscount,
    handleOpenAdd,
    handleOpenEdit,
    handleFormChange,
    handleSubmit,
    handleDeleteConfirm,
    handleToggleStatus,
  } = useDiscount();

  const totalUsed = discounts.reduce((acc, curr) => acc + (curr.usedCount || 0), 0);

  return (
    <div className="dc-wrapper">
      {/* Header */}
      <div className="dc-header">
        <div className="dc-title-group">
          <h4>Quản Lý Mã Giảm Giá & Khuyến Mãi</h4>
          <p className="dc-subtitle">Quản lý các chương trình ưu đãi, mã voucher giảm giá cho khách hàng</p>
        </div>
        <button className="dc-btn-add" onClick={handleOpenAdd}>
          <MdAdd size={20} />
          Thêm mã giảm giá
        </button>
      </div>

      {/* Stats Row */}
      <div className="dc-stats-row">
        <div className="dc-stat-card">
          <div className="dc-stat-icon" style={{ background: "rgba(229, 9, 20, 0.15)", color: "#e50914" }}>
            <MdLocalOffer />
          </div>
          <div>
            <div className="dc-stat-label">Tổng số mã khuyến mãi</div>
            <div className="dc-stat-value">{totalCount} mã</div>
          </div>
        </div>

        <div className="dc-stat-card">
          <div className="dc-stat-icon" style={{ background: "rgba(34, 197, 94, 0.15)", color: "#22c55e" }}>
            <MdCheckCircle />
          </div>
          <div>
            <div className="dc-stat-label">Đang áp dụng</div>
            <div className="dc-stat-value">{activeCount} mã</div>
          </div>
        </div>

        <div className="dc-stat-card">
          <div className="dc-stat-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
            <MdConfirmationNumber />
          </div>
          <div>
            <div className="dc-stat-label">Lượt khách hàng đã dùng</div>
            <div className="dc-stat-value">{totalUsed} lượt</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="dc-filter-bar">
        <div className="dc-search-wrap">
          <MdSearch className="dc-search-icon" size={18} />
          <input
            type="text"
            className="dc-search-input"
            placeholder="Tìm kiếm theo Mã giảm giá (SUMMER20) hoặc Tên chương trình..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="dc-select-filter"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">Tất cả loại giảm</option>
          <option value="Percent">Phần trăm (%)</option>
          <option value="Fixed">Số tiền cố định (VNĐ)</option>
        </select>

        <select
          className="dc-select-filter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang diễn ra</option>
          <option value="upcoming">Sắp diễn ra</option>
          <option value="expired">Đã kết thúc / Hết lượt</option>
          <option value="inactive">Tạm dừng</option>
        </select>
      </div>

      {/* Table */}
      <div className="dc-table-card">
        <div className="dc-table-wrapper">
          <table className="dc-table">
            <thead>
              <tr>
                <th>Mã giảm giá</th>
                <th>Tên chương trình</th>
                <th>Mức giảm</th>
                <th>Giảm tối đa</th>
                <th>Đơn tối thiểu</th>
                <th>Thời gian</th>
                <th>Lượt dùng / Khách</th>
                <th>Đối tượng & Phạm vi</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {discounts.length > 0 ? (
                discounts.map((item) => {
                  const statusInfo = getDiscountStatus(item);
                  return (
                    <tr key={item.discountId}>
                      <td>
                        <div className="dc-code-badge">
                          <MdLocalOffer size={14} />
                          {item.discountCode}
                        </div>
                        <div className="dc-subtext" style={{ marginTop: "4px" }}>
                          {item.couponType === "Private" ? "🔒 Phiếu cá nhân" : "🌐 Mã công khai"}
                        </div>
                      </td>
                      <td>
                        <div className="dc-program-name">{item.programName || item.description || "—"}</div>
                        {item.description && item.description !== item.programName && (
                          <div className="dc-subtext" style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="dc-discount-block">
                          <span className={`dc-type-badge ${item.discountType === "Percent" ? "type-percent" : "type-fixed"}`}>
                            {item.discountType === "Percent" ? "Phần trăm" : "Số tiền"}
                          </span>
                          <div className="dc-value-text">
                            {item.discountType === "Percent"
                              ? `-${item.discountValue}%`
                              : `-${formatCurrency(Math.abs(item.discountValue))}`}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: "700", color: "#ddd", whiteSpace: "nowrap" }}>
                          {item.maxDiscountAmount ? formatCurrency(item.maxDiscountAmount) : "Không giới hạn"}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: "600", color: "#aaa", whiteSpace: "nowrap" }}>
                          {formatCurrency(item.minOrderAmount)}
                        </div>
                        {item.isStackable && (
                          <div style={{ fontSize: "0.72rem", color: "#22c55e", fontWeight: "700" }}>
                            ➕ Cộng dồn
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="dc-date-block">
                          <div>📅 {item.startDate ? String(item.startDate).split("T")[0] : "—"}</div>
                          <div className="dc-subtext">➔ {item.endDate ? String(item.endDate).split("T")[0] : "Vô thời hạn"}</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ whiteSpace: "nowrap" }}>
                          <strong>{item.usedCount || 0}</strong> / {item.maxUsageTotal ? item.maxUsageTotal : "∞"} lượt
                        </div>
                        <div className="dc-subtext">Tối đa {item.maxUsagePerUser || 1} lần / khách</div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                          <span className="dc-scope-badge">
                            {item.scope || "Tất cả"}
                          </span>
                          <span style={{ fontSize: "0.74rem", color: "#9ca3af" }}>
                            🎯 {item.targetCustomer === "Newbie" ? "Thành viên mới" : item.targetCustomer === "VIP" ? "Khách VIP" : "Tất cả khách"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
                          <span className={`dc-status-badge ${statusInfo.class}`}>
                            {statusInfo.label}
                          </span>
                          <label className="dc-toggle-switch" title="Bật / Tắt kích hoạt mã">
                            <input
                              type="checkbox"
                              checked={item.isActive}
                              onChange={() => handleToggleStatus(item)}
                            />
                            <span className="dc-toggle-slider"></span>
                          </label>
                        </div>
                      </td>
                      <td>
                        <div className="dc-actions-cell">
                          <button
                            className="dc-icon-btn"
                            title="Xem chi tiết"
                            onClick={() => setDetailDiscount(item)}
                          >
                            <MdVisibility size={16} />
                          </button>
                          <button
                            className="dc-icon-btn"
                            title="Chỉnh sửa"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <MdEdit size={16} />
                          </button>
                          <button
                            className="dc-icon-btn delete"
                            title="Xóa mã"
                            onClick={() => setDeleteConfirmId(item.discountId)}
                          >
                            <MdDelete size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="dc-empty">
                    Không tìm thấy mã giảm giá nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit Form */}
      {showModal && (
        <div className="dc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="dc-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="dc-modal-header">
              <h3 className="dc-modal-title">
                {editId !== null ? "Cập Nhật Mã Giảm Giá" : "Tạo Mã Giảm Giá Mới"}
              </h3>
              <button className="dc-modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            {formError && <div className="dc-error-msg">{formError}</div>}

            <form onSubmit={handleSubmit}>
              {/* PHẦN 1: THÔNG TIN KHUYẾN MÃI */}
              <div className="dc-form-section-card">
                <div className="dc-section-title">📌 1. THÔNG TIN KHUYẾN MÃI</div>
                <div className="dc-form-grid">
                  <div className="dc-form-group">
                    <label>Mã giảm giá (Coupon Code) *</label>
                    <input
                      type="text"
                      name="discountCode"
                      className="dc-input"
                      placeholder="VD: SUMMER20"
                      value={form.discountCode}
                      onChange={handleFormChange}
                      style={{ textTransform: "uppercase", fontWeight: "800", letterSpacing: "1px", color: "#ff4d4d" }}
                      required
                    />
                    <span className="dc-field-hint">Mã in hoa viết liền không dấu</span>
                  </div>

                  <div className="dc-form-group">
                    <label>Tên chương trình *</label>
                    <input
                      type="text"
                      name="programName"
                      className="dc-input"
                      placeholder="VD: Giảm giá mùa hè 2026"
                      value={form.programName}
                      onChange={handleFormChange}
                      required
                    />
                    <span className="dc-field-hint">Tên hiển thị công khai cho khách hàng</span>
                  </div>

                  <div className="dc-form-group full-width">
                    <label>Mô tả chi tiết</label>
                    <textarea
                      name="description"
                      className="dc-input"
                      placeholder="Nhập mô tả nội dung chương trình khuyến mãi..."
                      value={form.description}
                      onChange={handleFormChange}
                      rows={2}
                      style={{ resize: "vertical" }}
                    />
                  </div>

                  <div className="dc-form-group">
                    <label>Loại giảm *</label>
                    <select
                      name="discountType"
                      className="dc-input"
                      value={form.discountType}
                      onChange={handleFormChange}
                    >
                      <option value="Percent">Phần trăm (%)</option>
                      <option value="Fixed">Số tiền cố định (VNĐ)</option>
                    </select>
                  </div>

                  <div className="dc-form-group">
                    <label>
                      Giá trị giảm * {form.discountType === "Percent" ? "(%)" : "(VNĐ)"}
                    </label>
                    <input
                      type="number"
                      name="discountValue"
                      className="dc-input"
                      placeholder={form.discountType === "Percent" ? "20" : "50000"}
                      value={form.discountValue}
                      onChange={handleFormChange}
                      min={1}
                      required
                    />
                  </div>

                  <div className="dc-form-group full-width">
                    <label>Mức giảm tối đa (VNĐ)</label>
                    <input
                      type="number"
                      name="maxDiscountAmount"
                      className="dc-input"
                      placeholder="VD: 100000 (Để 0 = Không giới hạn mức giảm)"
                      value={form.maxDiscountAmount}
                      onChange={handleFormChange}
                    />
                    <span className="dc-field-hint">Áp dụng số tiền giảm tối đa khi chọn giảm theo phần trăm</span>
                  </div>
                </div>
              </div>

              {/* PHẦN 2: ĐIỀU KIỆN SỬ DỤNG */}
              <div className="dc-form-section-card">
                <div className="dc-section-title">💰 2. ĐIỀU KIỆN SỬ DỤNG</div>
                <div className="dc-form-grid">
                  <div className="dc-form-group">
                    <label>Đơn hàng tối thiểu (VNĐ)</label>
                    <input
                      type="number"
                      name="minOrderAmount"
                      className="dc-input"
                      placeholder="VD: 300000"
                      value={form.minOrderAmount}
                      onChange={handleFormChange}
                    />
                    <span className="dc-field-hint">Điều kiện giá trị tổng đơn hàng</span>
                  </div>

                  <div className="dc-form-group">
                    <label>Tổng lượt sử dụng tối đa</label>
                    <input
                      type="number"
                      name="maxUsageTotal"
                      className="dc-input"
                      placeholder="VD: 500 (Để trống = Vô hạn)"
                      value={form.maxUsageTotal}
                      onChange={handleFormChange}
                    />
                    <span className="dc-field-hint">Hạn ngạch phát hành toàn hệ thống</span>
                  </div>

                  <div className="dc-form-group">
                    <label>Số lượt tối đa mỗi khách hàng *</label>
                    <input
                      type="number"
                      name="maxUsagePerUser"
                      className="dc-input"
                      placeholder="VD: 1"
                      value={form.maxUsagePerUser}
                      onChange={handleFormChange}
                      min={1}
                      required
                    />
                  </div>

                  <div className="dc-form-group" style={{ justifyContent: "center", marginTop: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <input
                        type="checkbox"
                        id="isStackableCheck"
                        name="isStackable"
                        checked={form.isStackable}
                        onChange={handleFormChange}
                        style={{ width: "18px", height: "18px", accentColor: "#e50914", cursor: "pointer" }}
                      />
                      <label htmlFor="isStackableCheck" style={{ cursor: "pointer", fontSize: "0.86rem", color: "#fff" }}>
                        Cho phép cộng dồn với khuyến mãi khác
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* PHẦN 3: ĐỐI TƯỢNG VÀ PHẠM VI */}
              <div className="dc-form-section-card">
                <div className="dc-section-title">🎯 3. ĐỐI TƯỢNG VÀ PHẠM VI</div>
                <div className="dc-form-grid">
                  <div className="dc-form-group">
                    <label>Loại mã / Loại phiếu</label>
                    <select
                      name="couponType"
                      className="dc-input"
                      value={form.couponType}
                      onChange={handleFormChange}
                    >
                      <option value="Public">Mã công khai (Dùng chung)</option>
                      <option value="Private">Phiếu cá nhân (Mã riêng cho từng người)</option>
                    </select>
                  </div>

                  <div className="dc-form-group">
                    <label>Đối tượng khách hàng</label>
                    <select
                      name="targetCustomer"
                      className="dc-input"
                      value={form.targetCustomer}
                      onChange={handleFormChange}
                    >
                      <option value="All">Tất cả khách hàng</option>
                      <option value="Newbie">Thành viên mới (Newbie)</option>
                      <option value="VIP">Thành viên VIP / Khách hàng thân thiết</option>
                    </select>
                  </div>

                  <div className="dc-form-group">
                    <label>Phạm vi áp dụng</label>
                    <select
                      name="scope"
                      className="dc-input"
                      value={form.scope}
                      onChange={handleFormChange}
                    >
                      <option value="Tất cả dịch vụ">Tất cả dịch vụ</option>
                      <option value="Vé xem phim">Chỉ áp dụng cho Vé xem phim</option>
                      <option value="Đồ ăn & Combo">Chỉ áp dụng cho Đồ ăn & Combo</option>
                      <option value="Chi nhánh Bến Thành">Chi nhánh Bến Thành</option>
                      <option value="Chi nhánh Đồng Khởi">Chi nhánh Đồng Khởi</option>
                    </select>
                  </div>

                  <div className="dc-form-group">
                    <label>Danh sách phim / rạp / combo tương ứng</label>
                    <input
                      type="text"
                      name="appliedItems"
                      className="dc-input"
                      placeholder="VD: Tất cả các rạp & phim, hoặc Phim Hè 2026"
                      value={form.appliedItems}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>
              </div>

              {/* PHẦN 4: THỜI GIAN VÀ TRẠNG THÁI */}
              <div className="dc-form-section-card">
                <div className="dc-section-title">🕒 4. THỜI GIAN VÀ TRẠNG THÁI</div>
                <div className="dc-form-grid">
                  <div className="dc-form-group">
                    <label>Thời gian bắt đầu *</label>
                    <input
                      type="datetime-local"
                      name="startDate"
                      className="dc-input"
                      value={form.startDate}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="dc-form-group">
                    <label>Thời gian kết thúc</label>
                    <input
                      type="datetime-local"
                      name="endDate"
                      className="dc-input"
                      value={form.endDate}
                      onChange={handleFormChange}
                    />
                    <span className="dc-field-hint">Để trống = Vô thời hạn</span>
                  </div>

                  <div className="dc-form-group full-width" style={{ flexDirection: "row", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                    <input
                      type="checkbox"
                      id="isActiveCheck"
                      name="isActive"
                      checked={form.isActive}
                      onChange={handleFormChange}
                      style={{ width: "18px", height: "18px", accentColor: "#e50914", cursor: "pointer" }}
                    />
                    <label htmlFor="isActiveCheck" style={{ cursor: "pointer", fontSize: "0.9rem", color: "#fff", fontWeight: "700" }}>
                      Kích hoạt mã ngay lập tức
                    </label>
                  </div>
                </div>
              </div>

              <div className="dc-form-actions">
                <button
                  type="button"
                  className="dc-btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="dc-btn-save" disabled={submitting}>
                  {submitting ? "Đang lưu..." : editId !== null ? "Cập Nhật" : "Tạo Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail View */}
      {detailDiscount && (
        <div className="dc-modal-overlay" onClick={() => setDetailDiscount(null)}>
          <div className="dc-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "580px" }}>
            <div className="dc-modal-header">
              <h3 className="dc-modal-title">Chi Tiết Chương Trình Khuyến Mãi</h3>
              <button className="dc-modal-close" onClick={() => setDetailDiscount(null)}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "14px 18px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div>
                  <div style={{ fontSize: "0.78rem", color: "#aaa" }}>MÃ VOUCHER</div>
                  <div className="dc-code-badge" style={{ fontSize: "1.15rem", marginTop: "4px" }}>
                    {detailDiscount.discountCode}
                  </div>
                </div>
                <span className={`dc-status-badge ${getDiscountStatus(detailDiscount).class}`}>
                  {getDiscountStatus(detailDiscount).label}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "0.875rem" }}>
                <div style={{ gridColumn: "span 2" }}>
                  <span style={{ color: "#888" }}>Tên chương trình:</span>
                  <div style={{ fontWeight: "800", color: "#fff", fontSize: "1rem", marginTop: "2px" }}>{detailDiscount.programName || detailDiscount.description}</div>
                  {detailDiscount.description && <div style={{ fontSize: "0.82rem", color: "#aaa", marginTop: "4px" }}>{detailDiscount.description}</div>}
                </div>

                <div>
                  <span style={{ color: "#888" }}>Loại & Mức giảm:</span>
                  <div style={{ fontWeight: "800", color: "#22c55e", marginTop: "2px" }}>
                    {detailDiscount.discountType === "Percent"
                      ? `-${detailDiscount.discountValue}%`
                      : `-${formatCurrency(detailDiscount.discountValue)}`}
                  </div>
                </div>

                <div>
                  <span style={{ color: "#888" }}>Giảm tối đa:</span>
                  <div style={{ fontWeight: "700", color: "#fff", marginTop: "2px" }}>
                    {detailDiscount.maxDiscountAmount ? formatCurrency(detailDiscount.maxDiscountAmount) : "Không giới hạn"}
                  </div>
                </div>

                <div>
                  <span style={{ color: "#888" }}>Đơn hàng tối thiểu:</span>
                  <div style={{ fontWeight: "700", color: "#fff", marginTop: "2px" }}>{formatCurrency(detailDiscount.minOrderAmount)}</div>
                </div>

                <div>
                  <span style={{ color: "#888" }}>Cộng dồn:</span>
                  <div style={{ fontWeight: "700", color: detailDiscount.isStackable ? "#22c55e" : "#888", marginTop: "2px" }}>
                    {detailDiscount.isStackable ? "Có cho phép" : "Không cho phép"}
                  </div>
                </div>

                <div>
                  <span style={{ color: "#888" }}>Tổng lượt đã dùng:</span>
                  <div style={{ fontWeight: "700", color: "#f59e0b", marginTop: "2px" }}>
                    {detailDiscount.usedCount || 0} / {detailDiscount.maxUsageTotal || "∞"} lượt
                  </div>
                </div>

                <div>
                  <span style={{ color: "#888" }}>Số lượt / Khách hàng:</span>
                  <div style={{ fontWeight: "700", color: "#fff", marginTop: "2px" }}>{detailDiscount.maxUsagePerUser || 1} lần</div>
                </div>

                <div>
                  <span style={{ color: "#888" }}>Loại phiếu:</span>
                  <div style={{ fontWeight: "700", color: "#fff", marginTop: "2px" }}>
                    {detailDiscount.couponType === "Private" ? "Phiếu cá nhân" : "Mã công khai"}
                  </div>
                </div>

                <div>
                  <span style={{ color: "#888" }}>Đối tượng:</span>
                  <div style={{ fontWeight: "700", color: "#fff", marginTop: "2px" }}>
                    {detailDiscount.targetCustomer === "Newbie" ? "Thành viên mới" : detailDiscount.targetCustomer === "VIP" ? "Khách VIP" : "Tất cả khách"}
                  </div>
                </div>

                <div>
                  <span style={{ color: "#888" }}>Thời gian bắt đầu:</span>
                  <div style={{ fontWeight: "600", color: "#ddd", marginTop: "2px" }}>{detailDiscount.startDate ? String(detailDiscount.startDate).replace("T", " ").slice(0, 16) : "—"}</div>
                </div>

                <div>
                  <span style={{ color: "#888" }}>Thời gian kết thúc:</span>
                  <div style={{ fontWeight: "600", color: "#ddd", marginTop: "2px" }}>{detailDiscount.endDate ? String(detailDiscount.endDate).replace("T", " ").slice(0, 16) : "Vô thời hạn"}</div>
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px 14px", borderRadius: "8px", fontSize: "0.82rem", color: "#aaa" }}>
                🎯 <strong>Phạm vi & Áp dụng:</strong> {detailDiscount.scope || "Tất cả dịch vụ"} — {detailDiscount.appliedItems || "Toàn hệ thống"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete Confirmation */}
      {deleteConfirmId && (
        <div className="dc-modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="dc-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px", textAlign: "center" }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#fff" }}>Xác Nhận Xóa</h3>
            <p style={{ color: "#aaa", fontSize: "0.9rem", margin: "0 0 20px 0" }}>
              Bạn có chắc chắn muốn xóa mã giảm giá này không? Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                className="dc-btn-cancel"
                onClick={() => setDeleteConfirmId(null)}
              >
                Hủy
              </button>
              <button
                className="dc-btn-save"
                style={{ background: "#e50914" }}
                onClick={handleDeleteConfirm}
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
