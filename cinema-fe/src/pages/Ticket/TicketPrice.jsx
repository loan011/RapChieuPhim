import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import "../../styles/TicketPrice.css";
import CustomerProfileDropdown from "../../components/CustomerProfileDropdown";
import { useTicketPrice } from "./useTicketPrice";
import { getAreaId, getAreaName } from "../usehome";

// Helper to format money (e.g. 75000 -> "75.000đ")
function formatMoney(amount) {
  if (isNaN(amount) || amount === null) return "";
  return amount.toLocaleString("vi-VN") + "đ";
}

function TicketPrice() {
  const {
    cinemas,
    allAreas,
    selectedAreaId,
    setSelectedAreaId,
    selectedCinemaId,
    setSelectedCinemaId,
    userEmail,
    loading,
    basePrices
  } = useTicketPrice();

  const [selectedFormat, setSelectedFormat] = useState("");

  // Define columns based on selected format dropdown
  const allFormats = ["2D", "IMAX 2D", "3D", "IMAX 3D", "4DX 2D", "4DX 3D"];
  
  const activeColumns = useMemo(() => {
    if (!selectedFormat) return allFormats;
    return allFormats.filter(f => f.toLowerCase().includes(selectedFormat.toLowerCase()));
  }, [selectedFormat]);

  // Pricing premium calculations
  const calculateVipPrice = (price) => {
    return price + 25000;
  };

  const calculateCouplePrice = (price) => {
    return price * 2 + 50000;
  };

  return (
    <div className="ticket-price-page">
      {/* Top Login Bar */}
      <div className="movie-top-login">
        <div className="top-login-content">
          {userEmail ? (
            <CustomerProfileDropdown />
          ) : (
            <div className="auth-links">
              <Link to="/login">Đăng nhập</Link>
              <span> | </span>
              <Link to="/register">Đăng ký</Link>
            </div>
          )}
        </div>
      </div>

      {/* Header Bar */}
      <header className="movie-header">
        <div className="movie-logo-container">
          <Link to="/" className="movie-logo">
            <span>Cinemas</span><b>HCM</b>
          </Link>
        </div>

        <nav className="movie-nav">
          <Link to="/showtimes">Lịch chiếu</Link>
          <Link to="/">Phim</Link>
          <Link className="active" to="/ticket-price">Giá vé</Link>
        </nav>


      </header>

      {/* Main content body */}
      <main className="ticket-main-content">
        {/* Filter selectors row */}
        <section className="ticket-filter-row">
          <div className="ticket-filter-item">
            <label>Chọn rạp</label>
            <select
              value={selectedCinemaId}
              onChange={(e) => setSelectedCinemaId(e.target.value)}
              disabled={loading}
            >
              <option value="">Chọn rạp HCM</option>
              {cinemas.map((c) => {
                const id = c.id ?? c.Id ?? c.cinemaId ?? c.CinemaId ?? "";
                const name = c.name ?? c.Name ?? c.cinemaName ?? c.CinemaName ?? "Rạp không tên";
                return (
                  <option key={id} value={String(id)}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="ticket-filter-item">
            <label>Định dạng</label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="2D">2D</option>
              <option value="3D">3D</option>
              <option value="IMAX">IMAX</option>
              <option value="4DX">4DX</option>
            </select>
          </div>
        </section>

        {loading ? (
          <div className="ticket-loading">Đang tải dữ liệu bảng giá...</div>
        ) : (
          <div className="ticket-grid-layout">
            {/* Left Box: Price Table */}
            <div className="ticket-table-container">
              <h2 className="ticket-section-title">BẢNG GIÁ VÉ</h2>
              
              <div className="ticket-table-responsive">
                <table className="price-table">
                  <thead>
                    <tr>
                      <th className="th-left">LOẠI HÌNH</th>
                      <th>GIÁ THƯỜNG</th>
                      <th>GIÁ VIP</th>
                      <th>GIÁ COUPLE</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="td-seat-type">
                        <span className="format-badge-pill" style={{ background: "#334155", color: "#fff", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>2D</span>
                      </td>
                      <td className="td-price-val"><strong>70k / 90k</strong></td>
                      <td className="td-price-val"><strong>90k / 120k</strong></td>
                      <td className="td-price-val"><strong>130k / 160k</strong></td>
                    </tr>
                    <tr>
                      <td className="td-seat-type">
                        <span className="format-badge-pill" style={{ background: "#334155", color: "#fff", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>3D</span>
                      </td>
                      <td className="td-price-val"><strong>70k / 90k</strong></td>
                      <td className="td-price-val"><strong>90k / 120k</strong></td>
                      <td className="td-price-val"><strong>130k / 160k</strong></td>
                    </tr>
                    <tr>
                      <td className="td-seat-type">
                        <span className="format-badge-pill" style={{ background: "#8b5cf6", color: "#fff", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>IMAX</span>
                      </td>
                      <td className="td-price-val"><strong>150k / 180k</strong></td>
                      <td className="td-price-val"><strong>180k / 220k</strong></td>
                      <td className="td-price-val"><strong>130k / 160k</strong></td>
                    </tr>
                    <tr>
                      <td className="td-seat-type">
                        <span className="format-badge-pill" style={{ background: "#334155", color: "#fff", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>4DX</span>
                      </td>
                      <td className="td-price-val"><strong>70k / 90k</strong></td>
                      <td className="td-price-val"><strong>90k / 120k</strong></td>
                      <td className="td-price-val"><strong>130k / 160k</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div style={{ marginTop: "16px", background: "rgba(30, 41, 59, 0.6)", padding: "12px 16px", borderRadius: "8px", borderLeft: "4px solid #f97316" }}>
                <p style={{ color: "#f97316", fontWeight: "bold", marginBottom: "4px", fontSize: "13px" }}>⏰ Khung giờ áp dụng giá vé:</p>
                <p style={{ color: "#cbd5e1", fontSize: "12px", margin: "2px 0" }}>• <strong>07:00 - 21:00</strong>: Áp dụng giá bên trái (Ví dụ: 70k, 90k, 150k)</p>
                <p style={{ color: "#cbd5e1", fontSize: "12px", margin: "2px 0" }}>• <strong>21:00 - 00:00</strong>: Áp dụng giá bên phải (Ví dụ: 90k, 120k, 180k)</p>
              </div>
            </div>

            {/* Right Box: Notes & Golden Hours */}
            <div className="ticket-sidebar">
              {/* Box 1: Lưu ý */}
              <section className="ticket-note-panel">
                <h3>LƯU Ý</h3>
                <ul className="ticket-note-list">
                  <li>
                    <span className="note-list-icon">ⓘ</span>
                    <p>Giá vé có thể thay đổi tùy theo thời điểm, phim và chương trình khuyến mãi.</p>
                  </li>
                  <li>
                    <span className="note-list-icon">🎟️</span>
                    <p>Vui lòng kiểm tra giá vé khi đặt vé.</p>
                  </li>
                  <li>
                    <span className="note-list-icon">👶</span>
                    <p>Trẻ em dưới 1m được miễn phí vé.</p>
                  </li>
                  <li>
                    <span className="note-list-icon">🚶</span>
                    <p>Trẻ em từ 1m trở lên tính giá vé như người lớn.</p>
                  </li>
                </ul>
              </section>


            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default TicketPrice;