import { useState } from "react";

import {
  MdReceiptLong,
  MdCreditCard,
  MdRefresh,
  MdCancel,
} from "react-icons/md";

export const HISTORY_TEXT = {
  header: {
    icon: "🕘",
    title: "Lịch sử đặt vé",
    description: "Toàn bộ giao dịch đặt vé của bạn",
  },

  tabKeys: {
    all: "all",
    pay: "pay",
    refund: "refund",
    cancel: "cancel",
  },

  tabs: [
    {
      key: "all",
      label: "Tất cả",
    },
    {
      key: "pay",
      label: "Thanh toán",
    },
    {
      key: "refund",
      label: "Hoàn tiền",
    },
    {
      key: "cancel",
      label: "Hủy vé",
    },
  ],

  stats: {
    totalOrders: "Lần đặt vé",
    totalSpent: "Đã chi tiêu",
    totalRefund: "Đã hoàn tiền",
  },

  empty: {
    Icon: MdReceiptLong,
    title: "Không có giao dịch",
    description: "Không tìm thấy giao dịch nào trong mục này",
  },
};

export const HISTORY_TYPE_CONFIG = {
  pay: {
    label: "Thanh toán",
    Icon: MdCreditCard,
  },

  refund: {
    label: "Hoàn tiền",
    Icon: MdRefresh,
  },

  cancel: {
    label: "Hủy vé",
    Icon: MdCancel,
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
      Icon: MdReceiptLong,
    }
  );
}

export function formatMoney(amount) {
  if (amount === 0) return "—";

  const sign = amount > 0 ? "+" : "";
  return `${sign}${Math.abs(amount).toLocaleString("vi-VN")}đ`;
}

export function filterHistoryByType(history, filter) {
  if (filter === HISTORY_TEXT.tabKeys.all) {
    return history;
  }

  return history.filter((item) => item.type === filter);
}

export function calculateTotalSpent(history) {
  return history
    .filter((item) => item.type === HISTORY_TEXT.tabKeys.pay)
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
}

export function calculateTotalRefund(history) {
  return history
    .filter((item) => item.type === HISTORY_TEXT.tabKeys.refund)
    .reduce((sum, item) => sum + item.amount, 0);
}

export function calculateTotalOrders(history) {
  return history.filter((item) => item.type === HISTORY_TEXT.tabKeys.pay).length;
}

export function useBookingHistory() {
  const [filter, setFilter] = useState(HISTORY_TEXT.tabKeys.all);
  const [history] = useState(MOCK_HISTORY);

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
  };
}