import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import "../../styles/TicketPrice.css";
import CustomerProfileDropdown from "../../components/CustomerProfileDropdown";
import { useTicketPrice } from "./useTicketPrice.js";
import { getAreaId, getAreaName } from "../usehome.js";

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
                      <th className="th-left">LOẠI GHẾ</th>
                      {activeColumns.map(col => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Row 1: Ghế Thường */}
                    <tr>
                      <td className="td-seat-type">
                        <div className="seat-cell">
                          <span className="seat-cell-icon red-seat-icon">🛋️</span>
                          <div className="seat-cell-text">
                            <strong>GHẾ THƯỜNG</strong>
                            <span>(Standard)</span>
                          </div>
                        </div>
                      </td>
                      {activeColumns.map(col => (
                        <td key={col} className="td-price-val">
                          {formatMoney(basePrices[col]?.std)}
                        </td>
                      ))}
                    </tr>

                    {/* Row 2: Ghế VIP */}
                    <tr>
                      <td className="td-seat-type">
                        <div className="seat-cell">
                          <span className="seat-cell-icon yellow-seat-icon">🛋️</span>
                          <div className="seat-cell-text">
                            <strong>GHẾ VIP</strong>
                            <span>(VIP)</span>
                          </div>
                        </div>
                      </td>
                      {activeColumns.map(col => (
                        <td key={col} className="td-price-val">
                          {formatMoney(basePrices[col]?.vip)}
                        </td>
                      ))}
                    </tr>

                    {/* Row 3: Ghế Couple */}
                    <tr>
                      <td className="td-seat-type">
                        <div className="seat-cell">
                          <span className="seat-cell-icon pink-seat-icon">🛋️</span>
                          <div className="seat-cell-text">
                            <strong>GHẾ COUPLE</strong>
                            <span>(Couple)</span>
                          </div>
                        </div>
                      </td>
                      {activeColumns.map(col => (
                        <td key={col} className="td-price-val">
                          {formatMoney(basePrices[col]?.cp)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <p className="ticket-vat-note">* Giá vé đã bao gồm VAT.</p>
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

              {/* Box 2: Giờ vàng */}
              <section className="ticket-gold-panel">
                <div className="gold-title-row">
                  <span className="gold-icon">⏰</span>
                  <h3>GIỜ VÀNG</h3>
                </div>
                <p className="gold-desc">Ưu đãi giá vé đặc biệt trong khung giờ vàng.</p>
                
                <div className="gold-promo-box">
                  <div className="gold-promo-text">
                    <strong>Thứ 2 - Thứ 6</strong>
                    <span>Trước 17:00</span>
                  </div>
                  <div className="gold-promo-badge">
                    -20%
                  </div>
                </div>
                
                <p className="gold-footer-note">Không áp dụng cho ngày lễ và suất chiếu đặc biệt.</p>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default TicketPrice;