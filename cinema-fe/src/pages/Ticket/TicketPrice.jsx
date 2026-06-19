import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import "../../styles/TicketPrice.css";
import CustomerProfileDropdown from "../../components/CustomerProfileDropdown";
import { getCinemaList } from "../Cinema/cinemaPageService";

function TicketPrice() {
  const savedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const userEmail =
    localStorage.getItem("userEmail") ||
    localStorage.getItem("email") ||
    savedUser.email ||
    savedUser.Email;

  const [cinemas, setCinemas] = useState([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState("");

  useEffect(() => {
    getCinemaList()
      .then((raw) => {
        const arr = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.$values)
          ? raw.$values
          : [];
        setCinemas(arr);
        if (arr.length > 0) {
          const firstId = arr[0].id ?? arr[0].Id ?? arr[0].cinemaId ?? arr[0].CinemaId ?? "";
          setSelectedCinemaId(String(firstId));
        }
      })
      .catch(() => setCinemas([]));
  }, []);

  return (
    <div className="ticket-price-page">
      <div className="movie-top-login">
        {userEmail ? (
          <CustomerProfileDropdown />
        ) : (
          <>
            <Link to="/login">Đăng nhập</Link>
            <span style={{ margin: "0 6px" }}>|</span>
            <Link to="/register">Đăng ký GB</Link>
          </>
        )}
      </div>

      <header className="movie-header">
        <div className="movie-logo">
          <span>Cinemas</span>
          <b>HCM</b>
        </div>

        <select
          className="movie-select"
          value={selectedCinemaId}
          onChange={(e) => setSelectedCinemaId(e.target.value)}
        >
          <option value="">Chọn rạp HCM</option>
          {cinemas.map((c) => {
            const id   = c.id ?? c.Id ?? c.cinemaId ?? c.CinemaId ?? "";
            const name = c.name ?? c.Name ?? c.cinemaName ?? c.CinemaName ?? "Rạp không tên";
            return (
              <option key={id} value={String(id)}>
                {name}
              </option>
            );
          })}
        </select>

        <nav>
          <Link to="/movies">PHIM</Link>
          <Link to="/">LỊCH CHIẾU THEO RẠP</Link>
          <Link to="/cinema">RẠP</Link>

          <Link className="active" to="/ticket-price">
            GIÁ VÉ
          </Link>

          <a href="#news">TIN MỚI VÀ ƯU ĐÃI</a>
          <a href="#franchise">NHƯỢNG QUYỀN</a>
          <a href="#member">THÀNH VIÊN</a>
        </nav>
      </header>

      <div className="ticket-price-card">
        <section className="price-block">
          <div className="price-logo price-logo-2d">2D</div>

          <div className="price-content">
            <h1 className="price-title title-2d">BẢNG GIÁ VÉ 2D - HCM</h1>

            <div className="price-table-box">
              <div className="price-left-list">
                <div className="sale-title">MAD SALE DAY</div>
                <p>(Tặng 01 bắp cho thứ 2 đầu tiên mỗi tháng)</p>

                <div className="beta-title">
                  CinemasHCM <span>(cả tuần)</span>
                </div>
                <p>(Trước 10h & Sau 22h)</p>

                <div className="happy-title">HAPPY DAY - THỨ 3</div>

                <div className="row-name">Thứ 2, 4, 5, 6</div>
                <div className="row-name">Thứ 7, CN</div>
                <div className="row-name">🇻🇳 Ngày Lễ</div>
              </div>

              <div className="price-main-table">
                <div className="table-header adult-header">NGƯỜI LỚN</div>

                <div className="time-header">
                  <span>10h - 18h</span>
                  <span>18h - 22h</span>
                </div>

                <div className="big-price adult-price">40.000</div>

                <div className="normal-row">
                  <span></span>
                  <span>45.000</span>
                  <span></span>
                </div>

                <div className="normal-row">
                  <span></span>
                  <span>60.000</span>
                  <span>65.000</span>
                </div>

                <div className="holiday-row">80.000</div>
              </div>

              <div className="price-student-table">
                <div className="table-header student-header">
                  HS - SV, TRẺ EM,
                  <br />
                  NGƯỜI CAO TUỔI
                </div>

                <div className="big-price student-price">40.000</div>
              </div>
            </div>
          </div>
        </section>

        <section className="price-block">
          <div className="price-logo price-logo-3d">3D</div>

          <div className="price-content">
            <h1 className="price-title title-3d">BẢNG GIÁ VÉ 3D - HCM</h1>

            <div className="price-table-box">
              <div className="price-left-list">
                <div className="sale-title">MAD SALE DAY</div>
                <p>(Tặng 01 bắp cho thứ 2 đầu tiên mỗi tháng)</p>

                <div className="beta-title">
                  CinemasHCM <span>(cả tuần)</span>
                </div>
                <p>(Trước 10h & Sau 22h)</p>

                <div className="happy-title">HAPPY DAY - THỨ 3</div>

                <div className="row-name">Thứ 2, 4, 5, 6</div>
                <div className="row-name">Thứ 7, CN</div>
                <div className="row-name">🇻🇳 Ngày Lễ</div>
              </div>

              <div className="price-main-table">
                <div className="table-header adult-header">NGƯỜI LỚN</div>

                <div className="time-header">
                  <span>10h - 18h</span>
                  <span>18h - 22h</span>
                </div>

                <div className="big-price adult-price">60.000</div>

                <div className="normal-row">
                  <span></span>
                  <span>65.000</span>
                  <span></span>
                </div>

                <div className="normal-row">
                  <span></span>
                  <span>80.000</span>
                  <span>85.000</span>
                </div>

                <div className="holiday-row">100.000</div>
              </div>

              <div className="price-student-table">
                <div className="table-header student-header">
                  HS - SV, TRẺ EM,
                  <br />
                  NGƯỜI CAO TUỔI
                </div>

                <div className="big-price student-price">60.000</div>
              </div>
            </div>
          </div>
        </section>

        <div className="ticket-note">
          <div>
            <p>* Phụ thu 5.000 VNĐ với ghế VIP & ghế đôi.</p>
            <p>* Phụ thu 10.000 VNĐ với khách hàng không phải thành viên.</p>
            <p>* Vé HS-SV dành cho khách hàng dưới 22 tuổi hoặc đang là HSSV.</p>
          </div>

          <div>
            <p>* Vé trẻ em dành cho trẻ em dưới 1m3.</p>
            <p>* Vé người cao tuổi dành cho người trên 55 tuổi.</p>
            <p>* Các suất chiếu đặc biệt không áp dụng giá ưu đãi.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketPrice;