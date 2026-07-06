import "./Dashboard.css";
import { useDashboard } from "./useDashboard.js";

export default function Dashboard() {
  const { cards, recentTickets, loading, error } = useDashboard();

  const accentClasses = [
    "dashboard-stat-card--gold",
    "dashboard-stat-card--red",
    "dashboard-stat-card--green",
    "dashboard-stat-card--outline",
  ];

  return (
    <div className="dashboard-page">
      <section className="dashboard-welcome">
        <h4>👋 Xin chào Admin!</h4>
        <p>Chào mừng bạn đến với hệ thống quản lý rạp chiếu phim T&amp;M.</p>
      </section>

      <section className="dashboard-stats-grid">
        {cards.map((card, index) => {
          const Icon = card.Icon;

          return (
            <div
              key={card.key}
              className={`dashboard-stat-card ${accentClasses[index % accentClasses.length]}`}
            >
              <div className="dashboard-stat-content">
                <span className="dashboard-stat-label">{card.label}</span>
                <strong className="dashboard-stat-value">{card.value}</strong>
              </div>

              <div className="dashboard-stat-icon">
                <Icon />
              </div>
            </div>
          );
        })}
      </section>

      <section className="dashboard-table-section">
        <div className="dashboard-table-header">
          <h5>Vé Đặt Gần Đây</h5>
        </div>

        {loading && (
          <p className="dashboard-message">Đang tải dữ liệu...</p>
        )}

        {error && (
          <p className="dashboard-message dashboard-message--error">
            {error}
          </p>
        )}

        {!loading && !error && recentTickets.length === 0 && (
          <p className="dashboard-message dashboard-message--empty">
            Chưa có dữ liệu.
          </p>
        )}

        {!loading && !error && recentTickets.length > 0 && (
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  {[
                    "#",
                    "Tên Phim",
                    "Khách Hàng",
                    "Ghế",
                    "Tên Rạp",
                    "Khu Vực",
                    "Giá Vé",
                    "Ngày Đặt",
                  ].map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {recentTickets.map((ticket, index) => (
                  <tr key={ticket.id || index}>
                    <td>{index + 1}</td>
                    <td>
                      <span className="movie-dot"></span>
                      {ticket.movieName}
                    </td>
                    <td>{ticket.customerName}</td>
                    <td>
                      <span className="seat-badge">{ticket.seat}</span>
                    </td>
                    <td>{ticket.cinemaName}</td>
                    <td>{ticket.areaName}</td>
                    <td className="price-cell">{ticket.price}</td>
                    <td>{ticket.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}