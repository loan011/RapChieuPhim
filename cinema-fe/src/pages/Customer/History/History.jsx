import { Link } from "react-router-dom";
import "../../../styles/Customer/CustomerPages.css";
import {
  MdReceiptLong,
  MdCreditCard,
  MdRefresh,
  MdCancel,
  MdArrowBack,
} from "react-icons/md";

import {
  useBookingHistory,
  getHistoryTypeConfig,
  formatMoney,
} from "./useHistory";

const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "pay", label: "Thanh toán" },
  { key: "refund", label: "Hoàn tiền" },
  { key: "cancel", label: "Hủy vé" },
];

export default function History() {
  const {
    filter,
    setFilter,
    filteredHistory,
    totalSpent,
    totalRefund,
    totalOrders,
    loading,
  } = useBookingHistory();

  return (
    <>
      <div className="profile-header-wrap">
        <div className="profile-header">
          <h1>
            <span className="page-icon">🕘</span>
            Lịch sử đặt vé
          </h1>
          <p>Toàn bộ giao dịch đặt vé của bạn</p>
        </div>
      </div>

      {loading ? (
        <div className="cust-card p-6 flex justify-center items-center text-gray-500 text-sm">
          Đang tải lịch sử giao dịch...
        </div>
      ) : (
        <>
          <div className="cust-stats">
            <div className="cust-stat-card yellow">
              <span className="stat-num">{totalOrders}</span>
              <span className="stat-label">Lần đặt vé</span>
            </div>

            <div className="cust-stat-card red">
              <span className="stat-num">
                {totalSpent.toLocaleString("vi-VN")}đ
              </span>
              <span className="stat-label">Đã chi tiêu</span>
            </div>

            <div className="cust-stat-card green">
              <span className="stat-num">
                {totalRefund.toLocaleString("vi-VN")}đ
              </span>
              <span className="stat-label">Đã hoàn tiền</span>
            </div>
          </div>

          <div className="cust-card">
            <div className="cust-tabs">
              {TABS.map((tab) => (
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
                    <MdReceiptLong />
                  </div>

                  <h3>Không có giao dịch</h3>
                  <p>Không tìm thấy giao dịch nào trong mục này</p>
                </div>
              ) : (
                filteredHistory.map((item) => {
                  const config = getHistoryTypeConfig(item.type);
                  const isPay = item.type === "pay";
                  const isRefund = item.type === "refund";

                  return (
                    <div className="history-item" key={item.id}>
                      <div className={`history-icon ${item.type}`}>
                        {isPay ? <MdCreditCard /> : isRefund ? <MdRefresh /> : <MdCancel />}
                      </div>

                      <div className="history-text">
                        <h4>{item.title}</h4>
                        <p>{item.detail}</p>

                        <span className="history-type-badge">
                          {config.label}
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
        </>
      )}
    </>
  );
}