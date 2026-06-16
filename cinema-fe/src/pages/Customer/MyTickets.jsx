import { useEffect, useState } from "react";
import "../../styles/Customer/CustomerProfile.css";
import { getUserTickets } from "./customerService";

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    setTickets(getUserTickets());
  }, []);

  return (
    <div className="profile-page">
      <div className="profile-form-card">
        <h2>Vé của tôi</h2>

        {tickets.length === 0 ? (
          <div className="empty-state">
            Hiện chưa có vé nào. Bạn có thể đặt vé ngay tại trang phim.
          </div>
        ) : (
          <div className="customer-list-table">
            <div className="list-header">
              <span>Phim</span>
              <span>Ngày chiếu</span>
              <span>Ghế</span>
              <span>Rạp</span>
              <span>Trạng thái</span>
            </div>
            {tickets.map((ticket) => (
              <div key={ticket.id} className="list-row">
                <span>{ticket.movie || "Không rõ"}</span>
                <span>{ticket.showDate || "-"}</span>
                <span>{ticket.seat || "-"}</span>
                <span>{ticket.cinema || "-"}</span>
                <span>{ticket.status || "Chưa xác định"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
