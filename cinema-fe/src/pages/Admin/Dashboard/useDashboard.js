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
  getCinemas,
  getMovies,
  getDashboardFoodSources
} from "./dashboardService";
import { getDailyRevenue } from "../../Staff/DoanhThu/dailyRevenueService";

function buildFoodDistributionsFromBills(revenueData) {
  const revenueByName = new Map();

  (revenueData?.bills || []).forEach((bill) => {
    (bill.concessions || []).forEach((item) => {
      const name = String(item.name || "").trim();
      if (!name || name === "N/A") return;
      const revenue = Number(item.subtotal || (item.unitPrice * item.quantity) || 0);
      revenueByName.set(name, (revenueByName.get(name) || 0) + revenue);
    });
  });

  const total = Array.from(revenueByName.values()).reduce((sum, value) => sum + value, 0);
  return Array.from(revenueByName, ([name, value]) => ({
    name,
    value,
    percent: total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0,
  })).sort((a, b) => b.value - a.value);
}

function toList(value) {
  if (Array.isArray(value)) return value;
  return value?.$values || value?.data || value?.items || [];
}

function buildFoodDistributionsFromBookings(source, selectedDate) {
  const foods = toList(source?.foods);
  const combos = toList(source?.combos);
  const revenueByName = new Map();

  toList(source?.bookings).forEach((booking) => {
    const status = String(booking.status ?? booking.Status ?? booking.paymentStatus ?? booking.PaymentStatus ?? "").toLowerCase();
    if (["pending", "unpaid", "cancelled", "canceled"].some(value => status.includes(value))) return;

    const rawDate = booking.bookingDate ?? booking.BookingDate ?? booking.createdAt ?? booking.CreatedAt;
    if (selectedDate && rawDate && String(rawDate).split("T")[0] !== selectedDate) return;

    const rawItems = booking.bookingFoods ?? booking.BookingFoods ?? booking.foods ?? booking.Foods ?? booking.bookingCombos ?? booking.BookingCombos ?? booking.combos ?? booking.Combos ?? [];
    toList(rawItems).forEach((item) => {
      const foodId = item.foodId ?? item.FoodId ?? item.food?.foodId ?? item.Food?.FoodId;
      const comboId = item.comboId ?? item.ComboId ?? item.combo?.comboId ?? item.Combo?.ComboId;
      const catalogItem = foodId != null
        ? foods.find(food => String(food.foodId ?? food.FoodId ?? food.id ?? food.Id) === String(foodId))
        : combos.find(combo => String(combo.comboId ?? combo.ComboId ?? combo.id ?? combo.Id) === String(comboId));
      const directName = item.foodName ?? item.FoodName ?? item.comboName ?? item.ComboName;
      const catalogName = catalogItem?.foodName ?? catalogItem?.FoodName ?? catalogItem?.comboName ?? catalogItem?.ComboName;
      const name = directName && String(directName).toLowerCase() !== "string" ? directName : catalogName;
      if (!name) return;
      const quantity = Number(item.quantity ?? item.Quantity ?? 1);
      const price = Number(item.price ?? item.Price ?? item.unitPrice ?? item.UnitPrice ?? catalogItem?.price ?? catalogItem?.Price ?? 0);
      revenueByName.set(name, (revenueByName.get(name) || 0) + (price * quantity));
    });
  });

  const total = Array.from(revenueByName.values()).reduce((sum, value) => sum + value, 0);
  return Array.from(revenueByName, ([name, value]) => ({
    name,
    value,
    percent: total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0,
  })).sort((a, b) => b.value - a.value);
}

function getMovieStatus(movie) {
  const endDateValue = movie?.endDate ?? movie?.EndDate ?? movie?.endTime ?? movie?.EndTime;
  if (endDateValue) {
    const endDate = new Date(endDateValue);
    endDate.setHours(23, 59, 59, 999);
    if (!Number.isNaN(endDate.getTime()) && endDate < new Date()) return "Đã chiếu";
  }

  const releaseDateValue = movie?.releaseDate ?? movie?.ReleaseDate ?? movie?.startDate ?? movie?.StartDate;
  if (releaseDateValue) {
    const releaseDate = new Date(releaseDateValue);
    releaseDate.setHours(0, 0, 0, 0);
    if (!Number.isNaN(releaseDate.getTime()) && releaseDate > new Date()) return "Sắp chiếu";
  }

  const rawStatus = String(movie?.status ?? movie?.Status ?? movie?.movieStatus ?? movie?.MovieStatus ?? "").toLowerCase();
  if (rawStatus.includes("completed") || rawStatus.includes("đã chiếu") || rawStatus.includes("hết chiếu")) return "Đã chiếu";
  if (rawStatus.includes("coming") || rawStatus.includes("sắp chiếu")) return "Sắp chiếu";
  return "Đang chiếu";
}

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

      const [statsData, recentTicketData, chartDataResp, movieStatsResp, cinemasResp, moviesResp, dailyRevenueResp, foodSources] = await Promise.all([
        getDashboardStats(timeFilter, cinemaId),
        getRecentTickets(),
        getRevenueChart(timeFilter, cinemaId),
        getMovieStats(timeFilter, cinemaId),
        getCinemas(),
        getMovies(),
        /^\d{4}-\d{2}-\d{2}$/.test(timeFilter)
          ? getDailyRevenue(timeFilter).catch(() => null)
          : Promise.resolve(null),
        getDashboardFoodSources()
      ]);

      setStats(normalizeDashboardStats(statsData));
      setRecentTickets(normalizeRecentTickets(recentTicketData));
      
      const cList = cinemasResp?.$values || cinemasResp || [];
      setCinemas(cList);
      
      const apiFoodDistributions = chartDataResp?.foodDistributions?.$values || chartDataResp?.foodDistributions || chartDataResp?.FoodDistributions?.$values || chartDataResp?.FoodDistributions || [];
      const bookingFoodDistributions = buildFoodDistributionsFromBookings(
        foodSources,
        /^\d{4}-\d{2}-\d{2}$/.test(timeFilter) ? timeFilter : ""
      );
      const fallbackFoodDistributions = buildFoodDistributionsFromBills(dailyRevenueResp);
      const reliableFoodDistributions = bookingFoodDistributions.length > 0
        ? bookingFoodDistributions
        : (fallbackFoodDistributions.length > 0 ? fallbackFoodDistributions : apiFoodDistributions);

      // Handle Chart Data lowercasing
      setChartData({
        totalTicketRevenue: chartDataResp?.totalTicketRevenue || chartDataResp?.TotalTicketRevenue || 0,
        totalFoodRevenue: chartDataResp?.totalFoodRevenue || chartDataResp?.TotalFoodRevenue || 0,
        ticketRevenuePercentage: chartDataResp?.ticketRevenuePercentage || chartDataResp?.TicketRevenuePercentage || 0,
        foodRevenuePercentage: chartDataResp?.foodRevenuePercentage || chartDataResp?.FoodRevenuePercentage || 0,
        foodDistributions: reliableFoodDistributions.map(f => ({
          name: f.foodName || f.FoodName || f.name || "Chưa rõ",
          value: f.revenue || f.Revenue || f.value || 0,
          percent: f.percentage || f.Percentage || f.percent || 0
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

      const movies = moviesResp?.$values || moviesResp?.data || moviesResp || [];
      const moviesById = new Map(
        movies.map(movie => [String(movie.movieId ?? movie.MovieId ?? movie.id ?? movie.Id), movie])
      );

      setMovieStats((movieStatsResp?.$values || movieStatsResp || []).map(m => {
        const movieId = m.movieId ?? m.MovieId;
        const movie = moviesById.get(String(movieId));
        const movieStatus = movie ? getMovieStatus(movie) : "Đang chiếu";

        return {
        movieId,
        movieTitle: movie?.title ?? movie?.Title ?? movie?.movieTitle ?? movie?.MovieTitle ?? m.movieTitle ?? m.MovieTitle,
        posterUrl: movie?.posterUrl ?? movie?.PosterUrl ?? movie?.imageUrl ?? movie?.ImageUrl ?? m.posterUrl ?? m.PosterUrl,
        movieStatus,
        totalRevenue: m.totalRevenue || m.TotalRevenue || 0,
        totalTicketsSold: m.totalTicketsSold || m.TotalTicketsSold || 0,
        revenueContributionPercentage: m.revenueContributionPercentage || m.RevenueContributionPercentage || 0,
        seatOccupancyPercentage: m.seatOccupancyPercentage || m.SeatOccupancyPercentage || 0,
        cinemaDistributions: (m.cinemaDistributions?.$values || m.cinemaDistributions || m.CinemaDistributions?.$values || m.CinemaDistributions || []).map(c => ({
          cinemaName: c.cinemaName || c.CinemaName,
          percentage: c.percentage || c.Percentage,
          ticketsSold: c.ticketsSold || c.TicketsSold
        }))
      }}).filter(m => m.movieTitle && m.movieStatus !== "Đã chiếu"));

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
