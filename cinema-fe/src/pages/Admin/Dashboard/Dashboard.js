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
  getDashboardData,
} from "./dashboardService";


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
    cinemaName: item?.cinemaName ?? item?.CinemaName ?? "—",
    areaName: item?.areaName ?? item?.AreaName ?? "—",
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
      label: "Tổng Phim",
      value: stats.totalMovies,
      Icon: MdMovie,
      color: "bg-blue-500",
    },
    {
      key: "totalUsers",
      label: "Người Dùng",
      value: stats.totalUsers,
      Icon: MdPeople,
      color: "bg-green-500",
    },
    {
      key: "totalTickets",
      label: "Vé Đã Bán",
      value: stats.totalTickets,
      Icon: MdConfirmationNumber,
      color: "bg-orange-500",
    },
    {
      key: "revenue",
      label: "Doanh Thu (VND)",
      value: formatMoney(stats.revenue),
      Icon: MdTrendingUp,
      color: "bg-purple-500",
    },
  ];
}

export function useDashboard() {
  const [stats, setStats] = useState(DEFAULT_DASHBOARD_STATS);
  const [recentTickets, setRecentTickets] = useState([]);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [revenueByDayArr, setRevenueByDayArr] = useState([]);
  const [revenueByShowtimeArr, setRevenueByShowtimeArr] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError("");
      const data = await getDashboardData();
      setStats(normalizeDashboardStats({
        totalMovies: data.totalMovies,
        totalUsers: data.totalUsers,
        totalTickets: data.totalTickets,
        revenue: data.totalRevenue,
      }));
      setTodayRevenue(data.todayRevenue);
      setRevenueByDayArr(data.revenueByDayArr);
      setRevenueByShowtimeArr(data.revenueByShowtimeArr);
      setRecentTickets(Array.isArray(data.recentTickets) ? data.recentTickets : []);
    } catch (err) {
      console.error("Dashboard error:", err);
      setStats(DEFAULT_DASHBOARD_STATS);
      setRecentTickets([]);
      setError(err.message || "Lấy dữ liệu dashboard thất bại!");
    } finally {
      setLoading(false);
    }
  }

  const cards = buildDashboardCards(stats);

  return {
    stats, cards, recentTickets,
    todayRevenue, revenueByDayArr, revenueByShowtimeArr,
    loading, error,
    fetchDashboardData,
  };
}