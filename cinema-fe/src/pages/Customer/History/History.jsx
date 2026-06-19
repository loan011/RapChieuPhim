import { useState } from "react";
import {
  MdReceiptLong,
  MdCreditCard,
  MdRefresh,
  MdCancel,
  MdFilterList,
} from "react-icons/md";
import "../../../styles/Customer/CustomerPages.css";

/* ── Sample history data ── */
const MOCK_HISTORY = [
  {
    id: "HD001",
    type: "pay",
    title: "Đặt vé - Avengers: Doomsday",
    detail: "2 ghế · Phòng 3 · Rạp T&M Quận 1",
    amount: -240000,
    date: "18/06/2026",
    time: "10:22",
  },
  {
    id: "HD002",
    type: "refund",
    title: "Hoàn vé - Deadpool & Wolverine",
    detail: "3 ghế · Hủy trước 2 giờ chiếu",
    amount: +360000,
    date: "10/06/2026",
    time: "18:05",
  },
  {
    id: "HD003",
    type: "pay",
    title: "Đặt vé - Moana 2",
    detail: "1 ghế · Phòng 1 · Rạp T&M Quận 7",
    amount: -90000,
    date: "14/06/2026",
    time: "09:47",
  },
  {
    id: "HD004",
    type: "pay",
    title: "Đặt vé - Inside Out 2",
    detail: "2 ghế · Phòng 2 · Rạp T&M Bình Thạnh",
    amount: -180000,
    date: "01/06/2026",
    time: "15:30",
  },
  {
    id: "HD005",
    type: "cancel",
    title: "Hủy vé - Inside Out 2",
    detail: "Vé bị hủy do quá giờ thanh toán",
    amount: 0,
    date: "01/06/2026",
    time: "15:45",
  },
  {
    id: "HD006",
    type: "refund",
    title: "Hoàn tiền - Ưu đãi thành viên",
    detail: "Thưởng điểm tích lũy tháng 5",
    amount: +50000,
    date: "31/05/2026",
    time: "00:01",
  },
];

const TYPE_ICON = {
  pay: <MdCreditCard />,
  refund: <MdRefresh />,
  cancel: <MdCancel />,
};

const TYPE_LABEL = {
  pay: "Thanh toán",
  refund: "Hoàn tiền",
  cancel: "Hủy vé",
};

function formatMoney(n) {
  if (n === 0) return "—";
  const sign = n > 0 ? "+" : "";
  return sign + Math.abs(n).toLocaleString("vi-VN") + "đ";
}

export default function LichSuDatVe() {
  const [filter, setFilter] = useState("all");

  const filtered =
    filter === "all" ? MOCK_HISTORY : MOCK_HISTORY.filter((h) => h.type === filter);

  const totalSpent = MOCK_HISTORY.filter((h) => h.type === "pay").reduce(
    (s, h) => s + Math.abs(h.amount),
    0
  );
  const totalRefund = MOCK_HISTORY.filter((h) => h.type === "refund").reduce(
    (s, h) => s + h.amount,
    0
  );
  const totalOrders = MOCK_HISTORY.filter((h) => h.type === "pay").length;

  return (
    <div className="cust-page">
      <div className="cust-wrapper">
        {/* Header */}
        <div className="cust-header">
          <h1>
            <span className="page-icon">🕘</span>
            Lịch sử đặt vé
          </h1>
          <p>Toàn bộ giao dịch đặt vé của bạn</p>
        </div>

        {/* Stats */}
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

        {/* Card */}
        <div className="cust-card">
          {/* Tabs */}
          <div className="cust-tabs">
            {[
              { key: "all", label: "Tất cả" },
              { key: "pay", label: "Thanh toán" },
              { key: "refund", label: "Hoàn tiền" },
              { key: "cancel", label: "Hủy vé" },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`cust-tab${filter === tab.key ? " active" : ""}`}
                onClick={() => setFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="cust-body">
            {filtered.length === 0 ? (
              <div className="cust-empty">
                <div className="cust-empty-icon">📋</div>
                <h3>Không có giao dịch</h3>
                <p>Không tìm thấy giao dịch nào trong mục này</p>
              </div>
            ) : (
              filtered.map((item) => (
                <div className="history-item" key={item.id}>
                  <div className={`history-icon ${item.type}`}>
                    {TYPE_ICON[item.type]}
                  </div>

                  <div className="history-text">
                    <h4>{item.title}</h4>
                    <p>{item.detail}</p>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "rgba(255,255,255,0.25)",
                        display: "inline-block",
                        marginTop: 2,
                        background: "rgba(255,255,255,0.05)",
                        padding: "2px 8px",
                        borderRadius: 20,
                      }}
                    >
                      {TYPE_LABEL[item.type]}
                    </span>
                  </div>

                  <div style={{ textAlign: "right" }}>
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}