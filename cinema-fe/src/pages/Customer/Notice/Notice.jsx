import { useState } from "react";
import {
  MdLocalOffer,
  MdConfirmationNumber,
  MdSettings,
  MdInfo,
  MdNotifications,
} from "react-icons/md";
import "../../../styles/Customer/CustomerPages.css";

/* ── Mock notifications ── */
const INITIAL_NOTICES = [
  {
    id: 1,
    type: "promo",
    title: "🎉 Ưu đãi cuối tuần — Giảm 30%",
    body: "Đặt vé từ T6 đến CN tuần này, nhận ngay ưu đãi giảm 30% cho tất cả suất chiếu buổi tối.",
    time: "2 giờ trước",
    unread: true,
  },
  {
    id: 2,
    type: "ticket",
    title: "✅ Đặt vé thành công",
    body: "Vé xem phim \"Avengers: Doomsday\" lúc 19:30 ngày 20/06 tại Rạp T&M Quận 1 đã được xác nhận.",
    time: "5 giờ trước",
    unread: true,
  },
  {
    id: 3,
    type: "promo",
    title: "🍿 Combo bắp nước giảm 50%",
    body: "Thêm combo bắp nước vào đơn hàng tiếp theo, giảm ngay 50% — áp dụng đến 30/06/2026.",
    time: "Hôm qua",
    unread: true,
  },
  {
    id: 4,
    type: "system",
    title: "🔐 Đăng nhập từ thiết bị mới",
    body: "Tài khoản của bạn vừa đăng nhập từ Chrome · Windows lúc 09:41 ngày 17/06.",
    time: "1 ngày trước",
    unread: false,
  },
  {
    id: 5,
    type: "ticket",
    title: "🔄 Hoàn tiền thành công",
    body: "Đơn hoàn tiền 360.000đ cho vé \"Deadpool & Wolverine\" đã được xử lý thành công.",
    time: "2 ngày trước",
    unread: false,
  },
  {
    id: 6,
    type: "info",
    title: "📢 Phim mới ra mắt tháng 7",
    body: "\"Superman: Legacy\", \"Fantastic Four\" và nhiều bom tấn sắp ra mắt. Đặt vé sớm để chọn ghế đẹp!",
    time: "3 ngày trước",
    unread: false,
  },
  {
    id: 7,
    type: "system",
    title: "⚙️ Cập nhật ứng dụng",
    body: "Hệ thống vừa nâng cấp lên phiên bản mới. Trải nghiệm mượt mà hơn, tính năng đặt vé cải tiến.",
    time: "5 ngày trước",
    unread: false,
  },
];

const TYPE_ICON_CLASS = {
  promo: { cls: "promo", icon: <MdLocalOffer /> },
  ticket: { cls: "ticket", icon: <MdConfirmationNumber /> },
  system: { cls: "system", icon: <MdSettings /> },
  info: { cls: "info", icon: <MdInfo /> },
};

export default function CustomerThongBao() {
  const [notices, setNotices] = useState(INITIAL_NOTICES);
  const [activeTab, setActiveTab] = useState("all");

  const unreadCount = notices.filter((n) => n.unread).length;

  const filtered =
    activeTab === "all"
      ? notices
      : activeTab === "unread"
      ? notices.filter((n) => n.unread)
      : notices.filter((n) => n.type === activeTab);

  function markRead(id) {
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  }

  function markAllRead() {
    setNotices((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  return (
    <div className="cust-page">
      <div className="cust-wrapper">
        {/* Header */}
        <div className="cust-header">
          <h1>
            <span className="page-icon">🔔</span>
            Thông báo
          </h1>
          <p>Cập nhật ưu đãi, vé đặt và hoạt động tài khoản</p>
        </div>

        {/* Stats */}
        <div className="cust-stats">
          <div className="cust-stat-card red">
            <span className="stat-num">{unreadCount}</span>
            <span className="stat-label">Chưa đọc</span>
          </div>
          <div className="cust-stat-card yellow">
            <span className="stat-num">{notices.length}</span>
            <span className="stat-label">Tổng thông báo</span>
          </div>
          <div className="cust-stat-card green">
            <span className="stat-num">
              {notices.filter((n) => n.type === "promo").length}
            </span>
            <span className="stat-label">Ưu đãi</span>
          </div>
        </div>

        {/* Card */}
        <div className="cust-card">
          {/* Tabs */}
          <div className="cust-tabs">
            {[
              { key: "all", label: "Tất cả" },
              { key: "unread", label: "Chưa đọc" },
              { key: "promo", label: "Ưu đãi" },
              { key: "ticket", label: "Vé" },
              { key: "system", label: "Hệ thống" },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`cust-tab${activeTab === tab.key ? " active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {tab.key === "unread" && unreadCount > 0 && (
                  <span className="cust-tab-badge">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>

          <div className="cust-body">
            {/* Mark all read header */}
            <div className="notice-header-actions">
              <span className="notice-count-label">
                {filtered.length} thông báo
              </span>
              {unreadCount > 0 && (
                <button className="notice-mark-all" onClick={markAllRead}>
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="cust-empty">
                <div className="cust-empty-icon">
                  <MdNotifications />
                </div>
                <h3>Không có thông báo</h3>
                <p>Bạn đã đọc hết tất cả thông báo</p>
              </div>
            ) : (
              filtered.map((notice) => {
                const { cls, icon } = TYPE_ICON_CLASS[notice.type] || {
                  cls: "info",
                  icon: <MdInfo />,
                };
                return (
                  <div
                    key={notice.id}
                    className={`notice-item${notice.unread ? " unread" : ""}`}
                    onClick={() => markRead(notice.id)}
                  >
                    {notice.unread && <div className="notice-dot" />}
                    <div className={`notice-icon ${cls}`}>{icon}</div>
                    <div className="notice-text">
                      <h4>{notice.title}</h4>
                      <p>{notice.body}</p>
                      <span className="notice-time">{notice.time}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}