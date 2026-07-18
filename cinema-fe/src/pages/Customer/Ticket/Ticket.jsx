import { useState } from "react";
import { Link } from "react-router-dom";
import "../../../styles/Customer/CustomerPages.css";
import {
  MdConfirmationNumber,
  MdLocationOn,
  MdCalendarToday,
  MdAccessTime,
  MdEventSeat,
  MdQrCode2,
  MdArrowBack,
} from "react-icons/md";

import {
  useTicket,
  getTicketStatusLabel,
  handlePosterError,
} from "./useTicket.js";

const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "upcoming", label: "Sắp chiếu" },
  { key: "watched", label: "Đã xem" },
  { key: "cancelled", label: "Đã hủy" },
];

const getQrDataText = (ticket) => {
  if (!ticket) return "";
  const seatInfo = Array.isArray(ticket.seats) ? ticket.seats.join(", ") : (ticket.seats || "N/A");
  const foodInfo = ticket.foods && ticket.foods.length > 0 
    ? ticket.foods.map(f => `${f.name}x${f.quantity}`).join(",")
    : "";
  const showtimeInfo = `${ticket.date || "N/A"} ${ticket.time || "N/A"}`;
  
  let text = `VE:${ticket.id}|PHIM:${ticket.movie}|SUAT:${showtimeInfo}|GHE:${seatInfo}|GIA:${ticket.price}|TRANG_THAI:Active`;
  if (foodInfo) {
    text += `|DO_AN:${foodInfo}`;
  }
  return text;
};

export default function Ticket() {
  const {
    activeTab,
    setActiveTab,
    filteredTickets,
    rawList,
    counts,
    loading,
  } = useTicket();

  const [selectedTicket, setSelectedTicket] = useState(null);

  return (
    <div className="cust-page">
      <div className="cust-wrapper">
        <div className="cust-header-wrap">
          <Link to="/" className="back-arrow-btn" title="Quay lại trang chủ">
            <MdArrowBack />
          </Link>
          <div className="cust-header">
            <h1>
              <span className="page-icon">🎫</span>
              Vé của tôi
            </h1>
            <p>Danh sách tất cả vé bạn đã đặt</p>
          </div>
        </div>

        {loading ? (
          <div className="cust-card p-6 flex justify-center items-center text-gray-500 text-sm">
            Đang tải danh sách vé...
          </div>
        ) : (
          <>
            <div className="cust-stats">
              <div className="cust-stat-card yellow">
                <span className="stat-num">{counts.all}</span>
                <span className="stat-label">Tổng vé</span>
              </div>

              <div className="cust-stat-card green">
                <span className="stat-num">{counts.upcoming}</span>
                <span className="stat-label">Sắp chiếu</span>
              </div>

              <div className="cust-stat-card red">
                <span className="stat-num">{counts.cancelled}</span>
                <span className="stat-label">Đã hủy</span>
              </div>
            </div>

            <div className="cust-card">
              <div className="cust-tabs">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`cust-tab${activeTab === tab.key ? " active" : ""}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}

                    {counts[tab.key] > 0 && (
                      <span className="cust-tab-badge">{counts[tab.key]}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="cust-body">
                {filteredTickets.length === 0 ? (
                  <div className="cust-empty">
                    <div className="cust-empty-icon">🎟️</div>
                    <h3>Không có vé nào</h3>
                    <p>Bạn chưa có vé trong mục này</p>
                  </div>
                ) : (
                  filteredTickets.map((ticket) => (
                    <div
                      className="ticket-card"
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="ticket-stripe" />

                      <img
                        src={ticket.poster}
                        alt={ticket.movie}
                        className="ticket-poster"
                        onError={handlePosterError}
                      />

                      <div className="ticket-info">
                        <p className="ticket-title">{ticket.movie}</p>

                        <div className="ticket-meta">
                          <span>
                            <MdCalendarToday />
                            {ticket.date}
                          </span>

                          <span>
                            <MdAccessTime />
                            {ticket.time}
                          </span>

                          <span>
                            <MdLocationOn />
                            {ticket.cinema}
                          </span>

                          <span>
                            <MdConfirmationNumber />
                            {ticket.hall}
                          </span>
                        </div>

                        <div className="ticket-seats">
                          {ticket.seats.map((seat) => (
                            <span className="seat-chip" key={seat}>
                              <MdEventSeat className="ticket-seat-icon" />
                              {seat}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="ticket-right">
                        <span className="ticket-price">{ticket.price}</span>

                        <span className={`ticket-status ${ticket.status}`}>
                          {getTicketStatusLabel(ticket.status)}
                        </span>

                        {ticket.status === "upcoming" && (
                          <div className="ticket-qr" title="Mã QR vé" data-darkreader-ignore="true" style={{ display: "flex", justifyContent: "center", alignItems: "center", background: "#ffffff", padding: "4px", borderRadius: "6px", filter: "none", colorScheme: "light" }}>
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(getQrDataText(ticket))}`}
                              alt="Ticket QR Code"
                              data-darkreader-ignore="true"
                              style={{ width: "40px", height: "40px", objectFit: "contain", filter: "none" }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Ticket Detail Modal ── */}
      {selectedTicket && (
        <div
          className="ticket-detail-modal-overlay"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="ticket-detail-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ticket-detail-modal-header">
              <h2>CHÚC MỪNG BẠN!</h2>
              <p>
                Việc mua vé online của bạn đã thành công. Galaxy Cinema xin chân
                thành cám ơn bạn đã chọn chúng tôi để phục vụ nhu cầu giải trí
                của bạn. Bạn vui lòng xem thông tin đặt vé dưới đây.
              </p>
            </div>

            <div className="ticket-detail-modal-body">
              <div className="ticket-detail-modal-qr-section" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <span className="room-entry-label">Mã vào khán phòng:</span>
                <div className="detail-qr-code-wrapper" data-darkreader-ignore="true" style={{ background: "#ffffff", padding: "12px", borderRadius: "12px", display: "inline-block", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", filter: "none", colorScheme: "light" }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(getQrDataText(selectedTicket))}`}
                    alt="Ticket QR Code"
                    data-darkreader-ignore="true"
                    style={{ width: "150px", height: "150px", objectFit: "contain", display: "block", filter: "none" }}
                  />
                </div>
                <span className="detail-ticket-code">{selectedTicket.id}</span>
              </div>

              <div className="ticket-detail-modal-info-list">
                <div className="detail-info-row">
                  <span className="info-label">Mã đặt vé:</span>
                  <span className="info-value font-bold">{selectedTicket.id}</span>
                </div>
                <div className="detail-info-row">
                  <span className="info-label">Rạp:</span>
                  <span className="info-value font-bold">{selectedTicket.cinema}</span>
                </div>
                <div className="detail-info-row">
                  <span className="info-label">Thông tin phim:</span>
                  <span className="info-value font-bold text-red-600">
                    {selectedTicket.movie}
                  </span>
                </div>
                <div className="detail-info-row">
                  <span className="info-label">Suất chiếu:</span>
                  <span className="info-value font-bold">
                    {selectedTicket.date}, {selectedTicket.time}
                  </span>
                </div>
                <div className="detail-info-row">
                  <span className="info-label">Thông tin vé:</span>
                  <span className="info-value">
                    {selectedTicket.seats.length} x Vé ({selectedTicket.price} -{" "}
                    {selectedTicket.seats.join(", ")})
                  </span>
                </div>
                <div className="detail-info-row">
                  <span className="info-label">Đồ ăn và Thức uống:</span>
                  <span className="info-value" style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-end" }}>
                    {selectedTicket.foods && selectedTicket.foods.length > 0 ? (
                      selectedTicket.foods.map((food, idx) => (
                        <div key={idx} style={{ fontSize: "0.85rem", color: "#374151" }}>
                          {food.name} <span style={{ color: "#9ca3af" }}>(x{food.quantity})</span>
                        </div>
                      ))
                    ) : (
                      "Không có"
                    )}
                  </span>
                </div>
                <div className="detail-info-row total">
                  <span className="info-label">Tổng cộng:</span>
                  <span className="info-value total-price">{selectedTicket.price}</span>
                </div>
              </div>
            </div>

            <button
              className="ticket-detail-modal-close-btn"
              onClick={() => setSelectedTicket(null)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}