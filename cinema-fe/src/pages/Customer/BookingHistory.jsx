import { useEffect, useState } from "react";
import "../../styles/Customer/CustomerProfile.css";
import { getBookingHistory } from "./customerService";

export default function BookingHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(getBookingHistory());
  }, []);

  return (
    <div className="profile-page">
      <div className="profile-form-card">
        <h2>Lịch sử đặt vé</h2>

        {history.length === 0 ? (
          <div className="empty-state">
            Chưa có lịch sử đặt vé nào. Mọi lượt đặt vé sẽ được lưu lại ở đây.
          </div>
        ) : (
          <div className="customer-list-table">
            <div className="list-header">
              <span>Mã đặt</span>
              <span>Phim</span>
              <span>Ngày đặt</span>
              <span>Số vé</span>
              <span>Tổng tiền</span>
            </div>
            {history.map((item) => (
              <div key={item.id} className="list-row">
                <span>{item.code || item.id}</span>
                <span>{item.movie || "-"}</span>
                <span>{item.bookedAt || "-"}</span>
                <span>{item.quantity || 0}</span>
                <span>{item.totalPrice ? `${item.totalPrice}đ` : "-"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
