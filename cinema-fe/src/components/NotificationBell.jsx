import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MdNotifications, MdCheck, MdArrowForward } from "react-icons/md";
import { getNotificationsForCustomer } from "../pages/Customer/Notice/noticeService";
import "../styles/Customer/NotificationBell.css";

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notices, setNotices] = useState([]);
  const dropdownRef = useRef(null);

  async function fetchNotices() {
    try {
      const data = await getNotificationsForCustomer();
      let list = Array.isArray(data) ? data : (data?.$values || data?.data || []);
      if (list.length > 0) {
        setNotices(
          list.map((n) => ({
            id: n.notificationId || n.NotificationId || n.id || Math.random(),
            type: n.type || n.Type || "info",
            title: n.title || n.Title || "Thông báo hệ thống",
            body: n.content || n.Content || n.message || n.Message || n.body || "",
            time: n.createdAt || n.CreatedAt ? String(n.createdAt || n.CreatedAt).replace("T", " ").slice(0, 16) : "Mới xong",
            unread: n.unread ?? true,
          }))
        );
      }
    } catch (err) {
      console.error("Lỗi lấy thông báo header:", err);
    }
  }

  useEffect(() => {
    fetchNotices();
    const timer = setInterval(fetchNotices, 20000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notices.filter((n) => n.unread).length;

  function markAllRead() {
    setNotices((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  function markRead(id) {
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  }

  return (
    <div className="notif-bell-container" ref={dropdownRef}>
      <button
        type="button"
        className="notif-bell-btn"
        onClick={() => setOpen(!open)}
        title="Thông báo"
      >
        <MdNotifications size={22} />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <h3>Thông báo</h3>
            {unreadCount > 0 && (
              <button type="button" className="notif-mark-read-btn" onClick={markAllRead}>
                <MdCheck /> Đã đọc
              </button>
            )}
          </div>

          <div className="notif-list">
            {notices.length === 0 ? (
              <div className="notif-empty">Chưa có thông báo mới</div>
            ) : (
              notices.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className={`notif-item ${item.unread ? "unread" : ""}`}
                  onClick={() => markRead(item.id)}
                >
                  {item.unread && <span className="notif-dot" />}
                  <div className="notif-content">
                    <h4 className="notif-title">{item.title}</h4>
                    <p className="notif-body">{item.body}</p>
                    <span className="notif-time">{item.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="notif-footer">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/customer/thong-bao");
              }}
            >
              Xem tất cả thông báo <MdArrowForward />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
