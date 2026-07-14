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
        const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = savedUser.userId ?? savedUser.id ?? savedUser.UserId ?? savedUser.Id;

        if (!userId) {
          setHistory([]);
          setLoading(false);
          return;
        }

        const data = await getBookingHistory(userId);
        let list = Array.isArray(data) ? data : (data?.$values || data?.data || []);

        if (list.length === 0) {
          setHistory([]);
        } else {
          // Gom nhóm các ghế đặt cùng lúc dựa trên bookingDate
          const groups = {};
          list.forEach((b) => {
            const key = b.bookingDate || b.BookingDate || "";
            if (!groups[key]) {
              groups[key] = [];
            }
            groups[key].push(b);
          });

          const historyItems = Object.values(groups).map((group, idx) => {
            const first = group[0];
            const statusStr = first.status || first.Status || "";
            const isCancelled = statusStr === "Cancelled" || statusStr === "Đã hủy";

            let dateStr = "Chưa rõ";
            let timeStr = "";
            const rawDate = first.bookingDate || first.BookingDate;
            if (rawDate) {
              const d = new Date(rawDate);
              if (!isNaN(d.getTime())) {
                const dd = String(d.getDate()).padStart(2, "0");
                const mm = String(d.getMonth() + 1).padStart(2, "0");
                const yyyy = d.getFullYear();
                dateStr = `${dd}/${mm}/${yyyy}`;
                timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
              }
            }

            const seatsStr = group
              .map((g) => g.seatNumber || g.SeatNumber)
              .filter(Boolean)
              .join(", ");
            const totalAmt = group.reduce((sum, g) => sum + (g.totalAmount || g.TotalAmount || 0), 0);

            const movieTitle = first.movieTitle || first.MovieTitle || "Đặt vé xem phim";
            const roomName = first.roomName || first.RoomName || "Phòng chiếu";
            const cinemaName = first.cinemaName || first.CinemaName || "Rạp";

            return {
              id: first.bookingId || first.BookingId || `BK${idx}`,
              type: isCancelled ? "cancel" : "pay",
              title: isCancelled ? `Hủy vé - ${movieTitle}` : `Đặt vé - ${movieTitle}`,
              detail: isCancelled
                ? `Vé bị hủy · ${group.length} ghế (${seatsStr})`
                : `${group.length} ghế (${seatsStr}) · ${roomName} · ${cinemaName}`,
              amount: isCancelled ? 0 : -totalAmt,
              date: dateStr,
              time: timeStr,
            };
          });

          // Sắp xếp mới nhất lên đầu
          historyItems.sort((a, b) => {
            const dateA = a.date.split("/").reverse().join("-") + "T" + a.time;
            const dateB = b.date.split("/").reverse().join("-") + "T" + b.time;
            return dateB.localeCompare(dateA);
          });

          setHistory(historyItems);
        }
      } catch (err) {
        console.error("Lỗi lấy lịch sử giao dịch:", err);
        setHistory([]);
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