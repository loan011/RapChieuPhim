import "../../../styles/Customer/CustomerPages.css";

import {
  HISTORY_TEXT as T,
  useBookingHistory,
  getHistoryTypeConfig,
  formatMoney,
} from "./History.js";

export default function History() {
  const {
    filter,
    setFilter,
    filteredHistory,
    totalSpent,
    totalRefund,
    totalOrders,
  } = useBookingHistory();

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
          <div className="cust-stat-card yellow">
            <span className="stat-num">{totalOrders}</span>
            <span className="stat-label">{T.stats.totalOrders}</span>
          </div>

          <div className="cust-stat-card red">
            <span className="stat-num">
              {totalSpent.toLocaleString("vi-VN")}đ
            </span>
            <span className="stat-label">{T.stats.totalSpent}</span>
          </div>

          <div className="cust-stat-card green">
            <span className="stat-num">
              {totalRefund.toLocaleString("vi-VN")}đ
            </span>
            <span className="stat-label">{T.stats.totalRefund}</span>
          </div>
        </div>

        <div className="cust-card">
          <div className="cust-tabs">
            {T.tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`cust-tab${filter === tab.key ? " active" : ""}`}
                onClick={() => setFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="cust-body">
            {filteredHistory.length === 0 ? (
              <div className="cust-empty">
                <div className="cust-empty-icon">
                  <EmptyIcon />
                </div>

                <h3>{T.empty.title}</h3>
                <p>{T.empty.description}</p>
              </div>
            ) : (
              filteredHistory.map((item) => {
                const { Icon, label } = getHistoryTypeConfig(item.type);

                return (
                  <div className="history-item" key={item.id}>
                    <div className={`history-icon ${item.type}`}>
                      <Icon />
                    </div>

                    <div className="history-text">
                      <h4>{item.title}</h4>
                      <p>{item.detail}</p>

                      <span className="history-type-badge">
                        {label}
                      </span>
                    </div>

                    <div className="history-right">
                      <div
                        className={`history-amount ${
                          item.amount > 0
                            ? "positive"
                            : item.amount < 0
                            ? "negative"
                            : ""
                        }`}
                      >
                        {formatMoney(item.amount)}
                      </div>

                      <div className="history-date">
                        {item.date} · {item.time}
                      </div>
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