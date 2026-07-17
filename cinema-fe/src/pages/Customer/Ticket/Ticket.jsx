import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
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
} from "./Ticket.js";
import { fetchOrdersByTicket } from "./customerTicketService.js";

const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "upcoming", label: "Sắp chiếu" },
  { key: "watched", label: "Đã xem" },
  { key: "cancelled", label: "Đã hủy" },
];

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
  const [ticketOrders, setTicketOrders] = useState([]);

  useEffect(() => {
    if (!selectedTicket) { setTicketOrders([]); return; }
    const ticketId = selectedTicket.ticketCodes?.[0]
      ? parseInt((selectedTicket.ticketCodes[0]).replace(/^ve/i, ""))
      : null;
    if (!ticketId) return;
    fetchOrdersByTicket(ticketId).then(setTicketOrders).catch(() => setTicketOrders([]));
  }, [selectedTicket]);

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
                          <div className="ticket-qr" title="Mã QR vé">
                            <MdQrCode2 className="ticket-qr-icon" />
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
              <div className="ticket-detail-modal-qr-section">
                <span className="room-entry-label">Mã vào khán phòng:</span>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
                  {(selectedTicket.ticketCodes?.length > 0
                    ? selectedTicket.ticketCodes
                    : [selectedTicket.qrCode || selectedTicket.id]
                  ).map((code, idx) => (
                    <div key={code || idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      {selectedTicket.seats?.[idx] && (
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#374151" }}>
                          Ghế {selectedTicket.seats[idx]}
                        </span>
                      )}
                      <div style={{ background: "#fff", padding: 8, borderRadius: 8, display: "inline-flex", boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }}>
                        <QRCodeSVG value={code || "INVALID"} size={120} level="M" />
                      </div>
                      <span className="detail-ticket-code" style={{ fontSize: "11px" }}>{code}</span>
                    </div>
                  ))}
                </div>
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
                  <span className="info-value">
                    {ticketOrders.length === 0
                      ? "Không có"
                      : ticketOrders.map((item, idx) => (
                          <span key={idx} style={{ display: "block" }}>
                            {item.name} x{item.quantity} — {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                          </span>
                        ))
                    }
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