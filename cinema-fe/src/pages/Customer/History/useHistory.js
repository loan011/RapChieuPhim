import { useEffect, useState } from "react";
import { getBookingHistory } from "./historyService.js";

export const HISTORY_TYPE_CONFIG = {
  pay: {
    label: "Thanh toán",
  },
  refund: {
    label: "Hoàn tiền",
  },
  cancel: {
    label: "Hủy vé",
  },
};

export const MOCK_HISTORY = [
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
    amount: 360000,
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
    amount: 50000,
    date: "31/05/2026",
    time: "00:01",
  },
];

export function getHistoryTypeConfig(type) {
  return (
    HISTORY_TYPE_CONFIG[type] || {
      label: "Giao dịch",
    }
  );
}

export function formatMoney(amount) {
  if (amount === 0) return "—";
  const sign = amount > 0 ? "+" : "";
  return `${sign}${Math.abs(amount).toLocaleString("vi-VN")}đ`;
}

export function filterHistoryByType(history, filter) {
  if (filter === "all") {
    return history;
  }
  return history.filter((item) => item.type === filter);
}

export function calculateTotalSpent(history) {
  return history
    .filter((item) => item.type === "pay")
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
}

export function calculateTotalRefund(history) {
  return history
    .filter((item) => item.type === "refund")
    .reduce((sum, item) => sum + item.amount, 0);
}

export function calculateTotalOrders(history) {
  return history.filter((item) => item.type === "pay").length;
}

export function useBookingHistory() {
  const [filter, setFilter] = useState("all");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const data = await getBookingHistory();
        let list = Array.isArray(data) ? data : (data?.$values || data?.data || []);
        if (list.length === 0) {
          setHistory(MOCK_HISTORY);
        } else {
          setHistory(list.map((h) => {
            const isRefund = h.status === "Đã hủy";
            return {
              id: h.invoiceCode || h.code || `HD${h.id}`,
              type: isRefund ? "refund" : "pay",
              title: isRefund ? "Hoàn vé/Hủy giao dịch" : "Đặt vé xem phim",
              detail: `Mã hóa đơn: ${h.code || `HD${h.id}`}`,
              amount: isRefund ? (h.totalAmount || 0) : -(h.totalAmount || 0),
              date: h.createdAt ? String(h.createdAt).split("T")[0] : "Chưa rõ",
              time: "",
            };
          }));
        }
      } catch (err) {
        console.error("Lỗi lấy lịch sử giao dịch, sử dụng mock:", err);
        setHistory(MOCK_HISTORY);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const filteredHistory = filterHistoryByType(history, filter);
  const totalSpent = calculateTotalSpent(history);
  const totalRefund = calculateTotalRefund(history);
  const totalOrders = calculateTotalOrders(history);

  return {
    filter,
    setFilter,
    history,
    filteredHistory,
    totalSpent,
    totalRefund,
    totalOrders,
    loading,
  };
}