import "./Ticket.css";
import { createPortal } from "react-dom";
import {
  MdAdd,
  MdConfirmationNumber,
  MdTrendingUp,
  MdAccountBalanceWallet,
  MdSearch,
  MdMovie,
  MdLocationOn,
  MdCalendarMonth,
  MdChair,
  MdPerson,
  MdLocalActivity,
  MdVisibility,
  MdEdit,
  MdDelete,
} from "react-icons/md";
import {
  useTicket,
  STATUS_OPTIONS,
  getTicketId,
  getTicketCode,
  getTicketCustomerName,
  getTicketMovieTitle,
  getTicketSeatCode,
  getTicketPrice,
  getTicketCinema,
  getTicketArea,
  getTicketRoom,
  getTicketStatusDisplayName,
  getTicketShowtime,
  formatMoney,
} from "./useTicket";

// Helper for status styling matching the mockup
function getStatusStyle(status) {
  const displayStatus = getTicketStatusDisplayName(status);
  switch (displayStatus) {
    case "Đã thanh toán":
      return { bg: "#e6f9f0", color: "#16a34a", label: "Đã thanh toán" };
    case "Giữ chỗ":
      return { bg: "#fff3e0", color: "#e67e00", label: "Giữ chỗ" };
    case "Đã hủy":
      return { bg: "#fce7f3", color: "#db2777", label: "Đã hủy" };
    default:
      return { bg: "#f3f4f6", color: "#6b7280", label: displayStatus || "—" };
  }
}

export default function Ticket() {
  const {
    loading,
    error,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterCinemaId,
    setFilterCinemaId,
    cinemaOptions,
    filtered,
    pageItems,
    totalPages,
    safePage,
    setPage,

    /* Stats */
    totalCount,
    soldCount,
    totalRevenue,

    /* Modal add/edit */
    showModal,
    editId,
    formData,
    formLoading,
    formError,
    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmitForm,
    handleDelete,
  } = useTicket();

  return (
    <div className="tk-wrapper">
      {/* ── Header ── */}
      <div className="tk-header">
        <h4 className="tk-title">Quản Lý Vé</h4>
        <button className="tk-btn-add" onClick={openAddModal}>
          <MdAdd size={18} />
          Thêm vé
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="tk-stats-row">
        <StatCard
          icon={<MdConfirmationNumber size={32} />}
          iconBg="#fff7ed"
          iconColor="#f97316"
          label="Tổng vé hôm nay"
          value={`${totalCount} vé`}
        />
        <StatCard
          icon={<MdTrendingUp size={32} />}
          iconBg="#f0fdf4"
          iconColor="#16a34a"
          label="Đã bán"
          value={`${soldCount} vé`}
        />
        <StatCard
          icon={<MdAccountBalanceWallet size={32} />}
          iconBg="#fff7ed"
          iconColor="#f97316"
          label="Doanh thu vé"
          value={formatMoney(totalRevenue)}
        />
      </div>

      {/* ── Filter Bar ── */}
      <div className="tk-filter-bar">
        <div className="tk-search-wrap">
          <MdSearch size={18} className="tk-search-icon" />
          <input
            type="text"
            className="tk-search-input"
            placeholder="Tìm theo mã vé, tên khách hàng, phim..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="tk-status-select"
          value={filterCinemaId}
          onChange={(e) => {
            setFilterCinemaId(e.target.value);
            setPage(1);
          }}
        >
          {cinemaOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="tk-status-select"
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* ── Loading / Error ── */}
      {loading && <p className="tk-msg">Đang tải dữ liệu vé...</p>}
      {error && <p className="tk-msg tk-msg--error">{error}</p>}

      {/* ── Cards Grid ── */}
      {!loading && !error && (
        <>
          {pageItems.length === 0 ? (
            <p className="tk-msg">Không có vé nào phù hợp.</p>
          ) : (
            <div className="tk-grid">
              {pageItems.map((ticket, index) => {
                const id = getTicketId(ticket);
                const code = getTicketCode(ticket);
                const customer = getTicketCustomerName(ticket);
                const movie = getTicketMovieTitle(ticket);
                const seat = getTicketSeatCode(ticket);
                const price = getTicketPrice(ticket);
                const cinema = getTicketCinema(ticket);
                const area = getTicketArea(ticket);
                const room = getTicketRoom(ticket);
                const showtime = getTicketShowtime(ticket);
                const statusStyle = getStatusStyle(ticket.status);

                const ticketIndex = String(
                  index + 1 + (safePage - 1) * 5
                ).padStart(2, "0");

                return (
                  <div key={id || index} className="tk-card">
                    {/* Card Header */}
                    <div className="tk-card-head">
                      <h6 className="tk-card-name" title={code}>
                        Vé {ticketIndex} – {area}
                      </h6>
                      <span
                        className="tk-card-badge"
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                        }}
                      >
                        {statusStyle.label}
                      </span>
                    </div>

                    {/* Card details list */}
                    <div className="tk-card-info">
                      <InfoRow icon={<MdMovie />} label="Phim:" value={movie} />
                      <InfoRow
                        icon={<MdLocationOn />}
                        label="Chi nhánh:"
                        value={cinema}
                      />
                      <InfoRow
                        icon={<MdCalendarMonth />}
                        label="Suất chiếu:"
                        value={showtime}
                      />
                      <InfoRow icon={<MdChair />} label="Ghế:" value={seat} />
                      <InfoRow
                        icon={<MdPerson />}
                        label="Khách hàng:"
                        value={customer}
                      />
                      <InfoRow
                        icon={<MdLocalActivity />}
                        label="Tổng tiền:"
                        value={formatMoney(price)}
                      />
                    </div>

                    {/* Actions */}
                    <div className="tk-card-actions">
                      <button
                        className="tk-card-btn tk-card-btn--detail"
                        onClick={() => openEditModal(ticket)}
                      >
                        <MdVisibility size={15} /> Chi tiết
                      </button>
                      <button
                        className="tk-card-btn tk-card-btn--edit"
                        onClick={() => openEditModal(ticket)}
                      >
                        <MdEdit size={15} /> Sửa
                      </button>
                      <button
                        className="tk-card-btn tk-card-btn--delete"
                        onClick={() => handleDelete(id)}
                        title="Xóa vé"
                      >
                        <MdDelete size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Pagination Footer ── */}
          {filtered.length > 0 && (
            <div className="tk-footer">
              <span className="tk-footer-info">
                Hiển thị {Math.min((safePage - 1) * 5 + 1, filtered.length)}–
                {Math.min(safePage * 5, filtered.length)} của {filtered.length} vé
              </span>
              <div className="tk-pagination">
                <button
                  className="tk-page-btn"
                  disabled={safePage === 1}
                  onClick={() => setPage(safePage - 1)}
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`tk-page-btn${
                      p === safePage ? " tk-page-btn--active" : ""
                    }`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="tk-page-btn"
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
          <div className="tk-modal-overlay">
            <div className="tk-modal">
              <h5 className="tk-modal-title">
                {editId !== null ? "Cập Nhật Thông Tin Vé" : "Thêm Vé Mới"}
              </h5>
              {formError && <p className="tk-form-error">{formError}</p>}
              <form onSubmit={handleSubmitForm} className="tk-form">
                {/* Mã vé */}
                <div className="tk-field">
                  <label className="tk-label">
                    Mã vé <span className="tk-required">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className="tk-input font-mono"
                    placeholder="VD: VE01, TICKET99"
                    required
                  />
                </div>

                {/* Khách hàng */}
                <div className="tk-field">
                  <label className="tk-label">
                    Tên khách hàng <span className="tk-required">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    className="tk-input"
                    placeholder="Nhập tên khách hàng"
                    required
                  />
                </div>

                {/* Tên phim */}
                <div className="tk-field">
                  <label className="tk-label">
                    Tên phim <span className="tk-required">*</span>
                  </label>
                  <input
                    type="text"
                    name="movieTitle"
                    value={formData.movieTitle}
                    onChange={handleChange}
                    className="tk-input"
                    placeholder="Nhập tên phim"
                    required
                  />
                </div>

                {/* Ghế + Giá vé */}
                <div className="tk-field-row">
                  <div className="tk-field">
                    <label className="tk-label">
                      Ghế <span className="tk-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="seatCode"
                      value={formData.seatCode}
                      onChange={handleChange}
                      className="tk-input font-mono"
                      placeholder="VD: A5, A6"
                      required
                    />
                  </div>
                  <div className="tk-field">
                    <label className="tk-label">Giá Vé (đ)</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className="tk-input"
                      placeholder="VD: 95000"
                      min={0}
                    />
                  </div>
                </div>

                {/* Chi nhánh */}
                <div className="tk-field">
                  <label className="tk-label">Chi nhánh</label>
                  <select
                    name="cinemaId"
                    value={formData.cinemaId}
                    onChange={handleChange}
                    className="tk-input"
                  >
                    <option value="">-- Chọn chi nhánh --</option>
                    {cinemaOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Trạng thái */}
                <div className="tk-field">
                  <label className="tk-label">Trạng Thái</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="tk-input"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="tk-modal-actions">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="tk-btn-cancel"
                    disabled={formLoading}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="tk-btn-submit"
                    disabled={formLoading}
                  >
                    {formLoading ? "Đang lưu..." : editId !== null ? "Cập Nhật" : "Thêm Vé"}
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
   SUB-COMPONENTS (Pure UI)
═══════════════════════════════════════════════════════════ */

function StatCard({ icon, iconBg, iconColor, label, value }) {
  return (
    <div className="tk-stat-card">
      <div
        className="tk-stat-icon"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div className="tk-stat-body">
        <p className="tk-stat-label">{label}</p>
        <p className="tk-stat-value">{value}</p>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="tk-info-row">
      <span className="tk-info-icon">{icon}</span>
      <span className="tk-info-label">{label}</span>
      <span className="tk-info-value">{value || "—"}</span>
    </div>
  );
}
