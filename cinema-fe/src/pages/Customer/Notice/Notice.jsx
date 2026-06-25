import "../../../styles/Customer/CustomerPages.css";

import {
  NOTICE_TEXT as T,
  useNotice,
  getNoticeTypeConfig,
} from "./Notice";

export default function Notice() {
  const {
    notices,
    activeTab,
    unreadCount,
    promoCount,
    filteredNotices,

    setActiveTab,
    markRead,
    markAllRead,
  } = useNotice();

  const EmptyIcon = T.empty.Icon;

  return (
    <div className="cust-page">
      <div className="cust-wrapper">
        <div className="cust-header">
          <h1>
            <span className="page-icon">{T.header.icon}</span>
            {T.header.title}
          </h1>

          <p>{T.header.description}</p>
        </div>

        <div className="cust-stats">
          <div className="cust-stat-card red">
            <span className="stat-num">{unreadCount}</span>
            <span className="stat-label">{T.stats.unread}</span>
          </div>

          <div className="cust-stat-card yellow">
            <span className="stat-num">{notices.length}</span>
            <span className="stat-label">{T.stats.total}</span>
          </div>

          <div className="cust-stat-card green">
            <span className="stat-num">{promoCount}</span>
            <span className="stat-label">{T.stats.promo}</span>
          </div>
        </div>

        <div className="cust-card">
          <div className="cust-tabs">
            {T.tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`cust-tab${activeTab === tab.key ? " active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}

                {tab.key === T.tabKeys.unread && unreadCount > 0 && (
                  <span className="cust-tab-badge">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>

          <div className="cust-body">
            <div className="notice-header-actions">
              <span className="notice-count-label">
                {filteredNotices.length} {T.labels.notification}
              </span>

              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notice-mark-all"
                  onClick={markAllRead}
                >
                  {T.buttons.markAllRead}
                </button>
              )}
            </div>

            {filteredNotices.length === 0 ? (
              <div className="cust-empty">
                <div className="cust-empty-icon">
                  <EmptyIcon />
                </div>

                <h3>{T.empty.title}</h3>
                <p>{T.empty.description}</p>
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
      </div>
    </div>
  );
}