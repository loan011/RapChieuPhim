import "./Dashboard.css";
import { useDashboard } from "./Dashboard.js";

function fmt(n) { return Number(n || 0).toLocaleString("vi-VN"); }

export default function Dashboard() {
  const { cards, recentTickets, loading, error, todayRevenue, revenueByDayArr, revenueByShowtimeArr } = useDashboard();

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

      {/* Doanh thu hôm nay */}
      {!loading && !error && (
        <section className="dashboard-table-section" style={{marginBottom: '1.5rem'}}>
          <div className="dashboard-table-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h5>📅 Doanh Thu Hôm Nay</h5>
            <strong style={{color:'#f59e0b', fontSize:'1.2rem'}}>{fmt(todayRevenue)} đ</strong>
          </div>
        </section>
      )}

      {/* Doanh thu 7 ngày */}
      {!loading && !error && revenueByDayArr.length > 0 && (
        <section className="dashboard-table-section" style={{marginBottom:'1.5rem'}}>
          <div className="dashboard-table-header"><h5>📊 Doanh Thu Theo Ngày</h5></div>
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead><tr><th>#</th><th>Ngày</th><th>Doanh Thu</th></tr></thead>
              <tbody>
                {revenueByDayArr.map((r, i) => (
                  <tr key={r.date}>
                    <td>{i + 1}</td>
                    <td>{r.date}</td>
                    <td className="price-cell">{fmt(r.revenue)} đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Doanh thu theo suất chiếu từng phim */}
      {!loading && !error && revenueByShowtimeArr.length > 0 && (
        <section className="dashboard-table-section" style={{marginBottom:'1.5rem'}}>
          <div className="dashboard-table-header"><h5>🎬 Doanh Thu Theo Suất Chiếu</h5></div>
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead><tr><th>#</th><th>Phim</th><th>Ngày</th><th>Giờ</th><th>Số Vé</th><th>Doanh Thu</th></tr></thead>
              <tbody>
                {revenueByShowtimeArr.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td><span className="movie-dot"></span>{r.movie}</td>
                    <td>{r.date || "—"}</td>
                    <td>{r.time || "—"}</td>
                    <td>{r.count}</td>
                    <td className="price-cell">{fmt(r.revenue)} đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

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
                      {ticket.movieTitle || ticket.movieName}
                    </td>
                    <td>{ticket.customerName}</td>
                    <td><span className="seat-badge">{ticket.seat || "—"}</span></td>
                    <td>{ticket.cinemaName}</td>
                    <td>{ticket.areaName || "—"}</td>
                    <td className="price-cell">{fmt(ticket.price)}</td>
                    <td>{ticket.issuedAt || ticket.createdAt}</td>
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