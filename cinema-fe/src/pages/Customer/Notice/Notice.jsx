import { Link } from "react-router-dom";
import "../../../styles/Customer/CustomerPages.css";
import { MdNotifications, MdArrowBack } from "react-icons/md";
import { useNotice, getNoticeTypeConfig } from "./useNotice.js";

const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "unread", label: "Chưa đọc" },
  { key: "promo", label: "Ưu đãi" },
  { key: "ticket", label: "Vé" },
  { key: "system", label: "Hệ thống" },
];

export default function Notice() {
  const {
    notices,
    activeTab,
    unreadCount,
    promoCount,
    filteredNotices,
    loading,
    setActiveTab,
    markRead,
    markAllRead,
  } = useNotice();

  return (
    <>
      <div className="profile-header-wrap">
        <div className="profile-header">
          <h1>
            <span className="page-icon">🔔</span>
            Thông báo
          </h1>
          <p>Cập nhật ưu đãi, vé đặt và hoạt động tài khoản</p>
        </div>
      </div>

      {loading ? (
        <div className="cust-card p-6 flex justify-center items-center text-gray-500 text-sm">
          Đang tải thông báo...
        </div>
      ) : (
        <>
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
              <span className="stat-num">{promoCount}</span>
              <span className="stat-label">Ưu đãi</span>
            </div>
          </div>

          <div className="cust-card">
            <div className="cust-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
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
              <div className="notice-header-actions">
                <span className="notice-count-label">
                  {filteredNotices.length} thông báo
                </span>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="notice-mark-all"
                    onClick={markAllRead}
                  >
                    Đánh dấu tất cả đã đọc
                  </button>
                )}
              </div>

              {filteredNotices.length === 0 ? (
                <div className="cust-empty">
                  <div className="cust-empty-icon">
                    <MdNotifications />
                  </div>
                  <h3>Không có thông báo</h3>
                  <p>Bạn đã đọc hết tất cả thông báo</p>
                </div>
              ) : (
                filteredNotices.map((notice) => {
                  const { cls, Icon } = getNoticeTypeConfig(notice.type);

                  return (
                    <div
                      key={notice.id}
                      className={`notice-item${notice.unread ? " unread" : ""}`}
                      onClick={() => markRead(notice.id)}
                    >
                      {notice.unread && <div className="notice-dot" />}

                      <div className={`notice-icon ${cls}`}>
                        <Icon />
                      </div>

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
        </>
      )}
    </>
  );
}