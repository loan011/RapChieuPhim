import { useEffect, useState } from "react";

import {
  MdMovie,
  MdPeople,
  MdConfirmationNumber,
  MdTrendingUp,
} from "react-icons/md";

import {
  getDashboardStats,
  getRecentTickets,
} from "./dashboardService";

export const DASHBOARD_TEXT = {
  welcome: {
    title: "👋 Xin chào Admin!",
    description:
      "Chào mừng bạn đến với hệ thống quản lý rạp chiếu phim T&M.",
  },

  cards: {
    totalMovies: "Tổng Phim",
    totalUsers: "Người Dùng",
    totalTickets: "Vé Đã Bán",
    revenue: "Doanh Thu (VND)",
  },

  recentTickets: {
    title: "Vé Đặt Gần Đây",
    headers: [
      "#",
      "Tên Phim",
      "Khách Hàng",
      "Ghế",
      "Giá Vé",
      "Ngày Đặt",
    ],
  },

  messages: {
    loading: "Đang tải dữ liệu...",
    loadFailed: "Lấy dữ liệu dashboard thất bại!",
    emptyRecentTickets: "Chưa có dữ liệu.",
  },

  classNames: {
    welcomeBox:
      "mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100",

    welcomeTitle: "font-bold text-lg mb-1",

    welcomeDesc: "text-gray-500 text-sm",

    statsGrid: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-6",

    statCard:
      "text-white rounded-lg p-4 flex items-center justify-between shadow",

    statValue: "text-2xl font-bold",

    statLabel: "text-sm opacity-90",

    statIcon: "text-4xl opacity-70",

    recentBox:
      "bg-white rounded-lg shadow-sm border border-gray-100 p-4",

    recentTitle: "font-semibold text-gray-700 mb-3",

    loadingText: "text-gray-500 text-sm",

    errorText: "text-red-500 text-sm",

    emptyText: "text-gray-400 text-sm",

    tableHead: "px-3 py-2 text-left",

    tableCell: "px-3 py-2",

    tableRow: "border-t border-gray-100 hover:bg-gray-50",
  },
};

export const DEFAULT_DASHBOARD_STATS = {
  totalMovies: 0,
  totalUsers: 0,
  totalTickets: 0,
  revenue: 0,
};

export function normalizeDashboardStats(data) {
  return {
    totalMovies:
      data?.totalMovies ??
      data?.TotalMovies ??
      data?.movieCount ??
      data?.MovieCount ??
      0,

    totalUsers:
      data?.totalUsers ??
      data?.TotalUsers ??
      data?.userCount ??
      data?.UserCount ??
      0,

    totalTickets:
      data?.totalTickets ??
      data?.TotalTickets ??
      data?.ticketCount ??
      data?.TicketCount ??
      0,

    revenue:
      data?.revenue ??
      data?.Revenue ??
      data?.totalRevenue ??
      data?.TotalRevenue ??
      0,
  };
}

export function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

export function normalizeRecentTickets(data) {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.$values)
    ? data.$values
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.items)
    ? data.items
    : [];

  return list.map((item) => ({
    id:
      item?.ticketId ??
      item?.TicketId ??
      item?.bookingId ??
      item?.BookingId ??
      item?.id ??
      item?.Id,

    movieName:
      item?.movieName ??
      item?.MovieName ??
      item?.movieTitle ??
      item?.MovieTitle ??
      item?.movie?.title ??
      item?.Movie?.Title ??
      "—",

    customerName:
      item?.customerName ??
      item?.CustomerName ??
      item?.fullName ??
      item?.FullName ??
      item?.user?.fullName ??
      item?.User?.FullName ??
      "—",

    seat:
      item?.seat ??
      item?.Seat ??
      item?.seatName ??
      item?.SeatName ??
      item?.seatCode ??
      item?.SeatCode ??
      "—",

    price:
      `${Number(
        item?.price ??
          item?.Price ??
          item?.totalPrice ??
          item?.TotalPrice ??
          item?.amount ??
          item?.Amount ??
          0
      ).toLocaleString("vi-VN")}đ`,

    createdAt: formatDate(
      item?.createdAt ??
        item?.CreatedAt ??
        item?.bookingDate ??
        item?.BookingDate ??
        item?.date ??
        item?.Date
    ),
  }));
}

export function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function buildDashboardCards(stats) {
  return [
    {
      key: "totalMovies",
      label: DASHBOARD_TEXT.cards.totalMovies,
      value: stats.totalMovies,
      Icon: MdMovie,
      color: "bg-blue-500",
    },
    {
      key: "totalUsers",
      label: DASHBOARD_TEXT.cards.totalUsers,
      value: stats.totalUsers,
      Icon: MdPeople,
      color: "bg-green-500",
    },
    {
      key: "totalTickets",
      label: DASHBOARD_TEXT.cards.totalTickets,
      value: stats.totalTickets,
      Icon: MdConfirmationNumber,
      color: "bg-orange-500",
    },
    {
      key: "revenue",
      label: DASHBOARD_TEXT.cards.revenue,
      value: formatMoney(stats.revenue),
      Icon: MdTrendingUp,
      color: "bg-purple-500",
    },
  ];
}

export function useDashboard() {
  const T = DASHBOARD_TEXT;

  const [stats, setStats] = useState(DEFAULT_DASHBOARD_STATS);
  const [recentTickets, setRecentTickets] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError("");

      const [statsData, recentTicketData] = await Promise.all([
        getDashboardStats(),
        getRecentTickets(),
      ]);

      setStats(normalizeDashboardStats(statsData));
      setRecentTickets(normalizeRecentTickets(recentTicketData));
    } catch (err) {
      console.error("Dashboard error:", err);

      setStats(DEFAULT_DASHBOARD_STATS);
      setRecentTickets([]);
      setError(err.message || T.messages.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  const cards = buildDashboardCards(stats);

  return {
    stats,
    setStats,

    recentTickets,
    setRecentTickets,

    cards,

    loading,
    setLoading,

    error,
    setError,

    fetchDashboardData,
  };
}