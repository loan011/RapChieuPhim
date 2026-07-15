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
  getRevenueChart,
  getMovieStats,
  getMovieDetailStats,
  getCinemas
} from "./dashboardService";

export const DEFAULT_DASHBOARD_STATS = {
  totalMovies: 0,
  totalUsers: 0,
  totalTickets: 0,
  revenue: 0,
};

export function normalizeDashboardStats(data) {
  return {
    totalMovies: data?.totalMovies ?? data?.TotalMovies ?? 0,
    totalUsers: data?.totalUsers ?? data?.TotalUsers ?? 0,
    totalTickets: data?.totalTickets ?? data?.TotalTickets ?? 0,
    revenue: data?.revenue ?? data?.TotalRevenue ?? 0,
  };
}

export function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

export function normalizeRecentTickets(data) {
  const list = Array.isArray(data) ? data : data?.$values || data?.data || data?.items || [];
  return list.map((item) => ({
    id: item?.ticketId ?? item?.TicketId ?? item?.id,
    movieName: item?.movieName ?? item?.MovieName ?? "—",
    customerName: item?.customerName ?? item?.CustomerName ?? "—",
    seat: item?.seatCode ?? item?.SeatCode ?? item?.seat ?? "—",
    price: `${Number(item?.price ?? item?.Price ?? 0).toLocaleString("vi-VN")}đ`,
    createdAt: formatDate(item?.createdAt ?? item?.CreatedAt),
    cinemaName: item?.cinemaName ?? item?.CinemaName ?? "—",
    areaName: item?.areaName ?? item?.AreaName ?? "—",
  }));
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function buildDashboardCards(stats) {
  return [
    { key: "totalMovies", label: "Tổng Phim", value: stats.totalMovies, Icon: MdMovie, color: "bg-blue-500" },
    { key: "totalUsers", label: "Người Dùng", value: stats.totalUsers, Icon: MdPeople, color: "bg-green-500" },
    { key: "totalTickets", label: "Vé Đã Bán", value: stats.totalTickets, Icon: MdConfirmationNumber, color: "bg-orange-500" },
    { key: "revenue", label: "Doanh Thu (VND)", value: formatMoney(stats.revenue), Icon: MdTrendingUp, color: "bg-purple-500" },
  ];
}

export function useDashboard() {
  const [stats, setStats] = useState(DEFAULT_DASHBOARD_STATS);
  const [recentTickets, setRecentTickets] = useState([]);
  
  // New Stats
  // Mặc định lấy ngày hôm nay định dạng YYYY-MM-DD
  const [timeFilter, setTimeFilter] = useState(new Date().toISOString().split('T')[0]);
  const [cinemaId, setCinemaId] = useState("");
  const [cinemas, setCinemas] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [movieStats, setMovieStats] = useState([]);
  
  // Modal detail
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieDetailStats, setMovieDetailStats] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, [timeFilter, cinemaId]);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError("");

      const [statsData, recentTicketData, chartDataResp, movieStatsResp, cinemasResp] = await Promise.all([
        getDashboardStats(timeFilter, cinemaId),
        getRecentTickets(),
        getRevenueChart(timeFilter, cinemaId),
        getMovieStats(timeFilter, cinemaId),
        getCinemas()
      ]);

      setStats(normalizeDashboardStats(statsData));
      setRecentTickets(normalizeRecentTickets(recentTicketData));
      
      const cList = cinemasResp?.$values || cinemasResp || [];
      setCinemas(cList);
      
      // Handle Chart Data lowercasing
      setChartData({
        totalTicketRevenue: chartDataResp?.totalTicketRevenue || chartDataResp?.TotalTicketRevenue || 0,
        totalFoodRevenue: chartDataResp?.totalFoodRevenue || chartDataResp?.TotalFoodRevenue || 0,
        ticketRevenuePercentage: chartDataResp?.ticketRevenuePercentage || chartDataResp?.TicketRevenuePercentage || 0,
        foodRevenuePercentage: chartDataResp?.foodRevenuePercentage || chartDataResp?.FoodRevenuePercentage || 0,
        foodDistributions: (chartDataResp?.foodDistributions?.$values || chartDataResp?.foodDistributions || chartDataResp?.FoodDistributions?.$values || chartDataResp?.FoodDistributions || []).map(f => ({
          name: f.foodName || f.FoodName || "Chưa rõ",
          value: f.revenue || f.Revenue || 0,
          percent: f.percentage || f.Percentage || 0
        })),
        topShowtimes: (chartDataResp?.topShowtimes?.$values || chartDataResp?.topShowtimes || chartDataResp?.TopShowtimes?.$values || chartDataResp?.TopShowtimes || []).map(s => ({
          movieTitle: s.movieTitle || s.MovieTitle,
          showtimeLabel: s.showtimeLabel || s.ShowtimeLabel,
          revenue: s.revenue || s.Revenue,
          occupancy: s.occupancy || s.Occupancy
        })),
        revenueByTime: (chartDataResp?.revenueByTime?.$values || chartDataResp?.revenueByTime || chartDataResp?.RevenueByTime?.$values || chartDataResp?.RevenueByTime || []).map(r => ({
          timeLabel: r.timeLabel || r.TimeLabel,
          totalRevenue: r.totalRevenue || r.TotalRevenue,
          ticketRevenue: r.ticketRevenue || r.TicketRevenue || 0,
          foodRevenue: r.foodRevenue || r.FoodRevenue || 0
        }))
      });

      setMovieStats((movieStatsResp?.$values || movieStatsResp || []).map(m => ({
        movieId: m.movieId || m.MovieId,
        movieTitle: m.movieTitle || m.MovieTitle,
        posterUrl: m.posterUrl || m.PosterUrl,
        totalRevenue: m.totalRevenue || m.TotalRevenue || 0,
        totalTicketsSold: m.totalTicketsSold || m.TotalTicketsSold || 0,
        revenueContributionPercentage: m.revenueContributionPercentage || m.RevenueContributionPercentage || 0,
        seatOccupancyPercentage: m.seatOccupancyPercentage || m.SeatOccupancyPercentage || 0,
        cinemaDistributions: (m.cinemaDistributions?.$values || m.cinemaDistributions || m.CinemaDistributions?.$values || m.CinemaDistributions || []).map(c => ({
          cinemaName: c.cinemaName || c.CinemaName,
          percentage: c.percentage || c.Percentage,
          ticketsSold: c.ticketsSold || c.TicketsSold
        }))
      })).filter(m => m.movieTitle));

    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message || "Lấy dữ liệu dashboard thất bại!");
    } finally {
      setLoading(false);
    }
  }

  async function openMovieDetail(movie) {
    try {
      setLoading(true);
      setSelectedMovie(movie);
      setIsDetailModalOpen(true);
      const detail = await getMovieDetailStats(movie.movieId);
      
      setMovieDetailStats({
        cinemaDistributions: (detail?.cinemaDistributions?.$values || detail?.cinemaDistributions || detail?.CinemaDistributions?.$values || []).map(d => ({
          cinemaName: d.cinemaName || d.CinemaName,
          ticketsSold: d.ticketsSold || d.TicketsSold,
          percentage: d.percentage || d.Percentage
        })),
        showtimeRevenues: (detail?.showtimeRevenues?.$values || detail?.showtimeRevenues || detail?.ShowtimeRevenues?.$values || []).map(s => ({
          showTimeId: s.showTimeId || s.ShowTimeId,
          showtimeLabel: s.showtimeLabel || s.ShowtimeLabel,
          revenue: s.revenue || s.Revenue
        })),
        dailyRevenues: (detail?.dailyRevenues?.$values || detail?.dailyRevenues || detail?.DailyRevenues?.$values || []).map(r => ({
          timeLabel: r.timeLabel || r.TimeLabel,
          totalRevenue: r.totalRevenue || r.TotalRevenue
        }))
      });
    } catch (err) {
      alert("Lỗi tải chi tiết: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function closeMovieDetail() {
    setIsDetailModalOpen(false);
    setSelectedMovie(null);
    setMovieDetailStats(null);
  }

  const cards = buildDashboardCards(stats);

  return {
    stats, setStats,
    recentTickets, setRecentTickets,
    cards, loading, setLoading, error, setError,
    fetchDashboardData,
    
    // New
    timeFilter,
    setTimeFilter,
    cinemaId,
    setCinemaId,
    cinemas,
    chartData,
    movieStats,
    selectedMovie, movieDetailStats, isDetailModalOpen,
    openMovieDetail, closeMovieDetail
  };
}