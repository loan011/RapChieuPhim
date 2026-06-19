import { useState, useEffect } from "react";
import {
  MdConfirmationNumber,
  MdLocationOn,
  MdCalendarToday,
  MdAccessTime,
  MdEventSeat,
  MdQrCode2,
} from "react-icons/md";
import "../../../styles/Customer/CustomerPages.css";

/* ── Sample data (replace with API call later) ── */
const MOCK_TICKETS = [
  {
    id: "TK001",
    movie: "Avengers: Doomsday",
    poster: "https://image.tmdb.org/t/p/w200/tCDFohxiCXBcCEMInFTlZiPASv.jpg",
    date: "20/06/2026",
    time: "19:30",
    cinema: "Rạp T&M - Quận 1",
    hall: "Phòng 3",
    seats: ["C5", "C6"],
    price: "240.000đ",
    status: "upcoming",
  },
  {
    id: "TK002",
    movie: "Moana 2",
    poster: "https://image.tmdb.org/t/p/w200/yh64qw9mgXBvlaWDi7Q9tpUBAvH.jpg",
    date: "15/06/2026",
    time: "14:00",
    cinema: "Rạp T&M - Quận 7",
    hall: "Phòng 1",
    seats: ["A3"],
    price: "90.000đ",
    status: "watched",
  },
  {
    id: "TK003",
    movie: "Deadpool & Wolverine",
    poster: "https://image.tmdb.org/t/p/w200/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    date: "10/06/2026",
    time: "21:00",
    cinema: "Rạp T&M - Bình Thạnh",
    hall: "Phòng 2",
    seats: ["D7", "D8", "D9"],
    price: "360.000đ",
    status: "cancelled",
  },
];

const STATUS_LABEL = {
  upcoming: "Sắp chiếu",
  watched: "Đã xem",
  cancelled: "Đã hủy",
};

export default function VeCuaToi() {
  const [activeTab, setActiveTab] = useState("all");
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const localTickets = JSON.parse(localStorage.getItem("bookedTickets") || "[]");
    setTickets([...localTickets, ...MOCK_TICKETS]);
  }, []);

  const filtered =
    activeTab === "all"
      ? tickets
      : tickets.filter((t) => t.status === activeTab);

  const counts = {
    all: tickets.length,
    upcoming: tickets.filter((t) => t.status === "upcoming").length,
    watched: tickets.filter((t) => t.status === "watched").length,
    cancelled: tickets.filter((t) => t.status === "cancelled").length,
  };

  return (
    <div className="cust-page">
      <div className="cust-wrapper">
        {/* Header */}
        <div className="cust-header">
          <h1>
            <span className="page-icon">🎫</span>
            Vé của tôi
          </h1>
          <p>Danh sách tất cả vé bạn đã đặt</p>
        </div>

        {/* Stats */}
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

        {/* Card */}
        <div className="cust-card">
          {/* Tabs */}
          <div className="cust-tabs">
            {[
              { key: "all", label: "Tất cả" },
              { key: "upcoming", label: "Sắp chiếu" },
              { key: "watched", label: "Đã xem" },
              { key: "cancelled", label: "Đã hủy" },
            ].map((tab) => (
              <button
                key={tab.key}
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
            {filtered.length === 0 ? (
              <div className="cust-empty">
                <div className="cust-empty-icon">🎟️</div>
                <h3>Không có vé nào</h3>
                <p>Bạn chưa có vé trong mục này</p>
              </div>
            ) : (
              filtered.map((ticket) => (
                <div className="ticket-card" key={ticket.id}>
                  <div className="ticket-stripe" />

                  <img
                    src={ticket.poster}
                    alt={ticket.movie}
                    className="ticket-poster"
                    onError={(e) =>
                      (e.target.style.background = "rgba(255,255,255,0.05)")
                    }
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
                      {ticket.seats.map((s) => (
                        <span className="seat-chip" key={s}>
                          <MdEventSeat style={{ marginRight: 3 }} />
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="ticket-right">
                    <span className="ticket-price">{ticket.price}</span>
                    <span className={`ticket-status ${ticket.status}`}>
                      {STATUS_LABEL[ticket.status]}
                    </span>
                    {ticket.status === "upcoming" && (
                      <div className="ticket-qr" title="Mã QR vé">
                        <MdQrCode2 size={36} color="#111" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}