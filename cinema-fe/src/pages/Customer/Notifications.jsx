import { useEffect, useState } from "react";
import "../../styles/Customer/CustomerProfile.css";
import { getNotifications } from "./customerService";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    setNotifications(getNotifications());
  }, []);

  return (
    <div className="profile-page">
      <div className="profile-form-card">
        <h2>Thông báo</h2>

        {notifications.length === 0 ? (
          <div className="empty-state">
            Hiện chưa có thông báo mới. Tất cả thông báo sẽ xuất hiện tại đây.
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map((note) => (
              <div key={note.id} className="notification-item">
                <div className="notification-title">{note.title || "Thông báo"}</div>
                <div className="notification-body">{note.message || note.body || "Không có nội dung"}</div>
                <div className="notification-time">{note.date || note.createdAt || ""}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
