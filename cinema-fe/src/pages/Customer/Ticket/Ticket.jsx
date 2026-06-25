import "../../../styles/Customer/CustomerPages.css";
import {
  MdConfirmationNumber,
  MdLocationOn,
  MdCalendarToday,
  MdAccessTime,
  MdEventSeat,
  MdQrCode2,
} from "react-icons/md";

import {
  useTicket,
  getTicketStatusLabel,
  handlePosterError,
} from "./Ticket.js";

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
    counts,
    loading,
  } = useTicket();

  return (
    <div className="cust-page">
      <div className="cust-wrapper">
        <div className="cust-header">
          <h1>
            <span className="page-icon">🎫</span>
            Vé của tôi
          </h1>
          <p>Danh sách tất cả vé bạn đã đặt</p>
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
                <div className="ticket-card" key={ticket.id}>
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
    </div>
  );
}