import { useEffect, useRef, useState } from "react";

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
  getDashboardFoodSources,
} from "./dashboardService";

function getOrderCinemaId(order) {
  if (!order) return "";
  let cid = order.cinemaId ?? order.CinemaId;
  if (cid) return String(cid);

  if (order.staff) {
    cid = order.staff.cinemaId ?? order.staff.CinemaId ?? order.staff.cinema?.cinemaId ?? order.staff.cinema?.CinemaId;
    if (cid) return String(cid);
  }
  if (order.Staff) {
    cid = order.Staff.cinemaId ?? order.Staff.CinemaId ?? order.Staff.cinema?.cinemaId ?? order.Staff.cinema?.CinemaId;
    if (cid) return String(cid);
  }

  const booking = order.booking ?? order.Booking;
  if (booking) {
    const showtime = booking.showtime ?? booking.Showtime;
    if (showtime) {
      cid = showtime.cinemaId ?? showtime.CinemaId;
      if (cid) return String(cid);
      const room = showtime.room ?? showtime.Room;
      if (room) {
        cid = room.cinemaId ?? room.CinemaId;
        if (cid) return String(cid);
      }
    }
  }

  // Fallback nếu order chưa được ghi đè cinemaId
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user && (user.cinemaId || user.CinemaId)) {
      return String(user.cinemaId || user.CinemaId);
    }
  } catch (e) {}

  return "1";
}

function buildFoodDistributions(source, timeFilter, cinemaId) {
  const orders = toList(source?.orders);
  const dataByName = new Map();

  orders.forEach((order) => {
    if (!order) return;
    
    // Lọc theo chi nhánh
    if (cinemaId) {
      const orderCinemaId = getOrderCinemaId(order);
      // Bắt buộc phải trùng cinemaId, nếu không có orderCinemaId thì bỏ qua luôn
      if (orderCinemaId !== String(cinemaId)) return;
    }

    // Lọc đơn hàng đã hủy hoặc chưa thanh toán
    const status = String(order.status ?? order.Status ?? "").toLowerCase();
    if (["cancelled", "canceled", "pending", "unpaid"].some(s => status.includes(s))) return;

    // Lọc theo thời gian nếu có filter
    if (timeFilter) {
      const rawDate = order.orderDate ?? order.OrderDate ?? order.createdAt ?? order.CreatedAt;
      if (rawDate) {
        const orderDay = String(rawDate).split("T")[0]; // YYYY-MM-DD
        const orderMonth = orderDay.substring(0, 7); // YYYY-MM

        if (timeFilter === 'month') {
          // Lấy tháng hiện tại
          const currentMonth = new Date().toISOString().substring(0, 7);
          if (orderMonth !== currentMonth) return;
        } else if (timeFilter === 'week') {
          // Lọc 7 ngày gần nhất
          const orderTime = new Date(orderDay).getTime();
          const now = new Date().getTime();
          if (now - orderTime > 7 * 24 * 60 * 60 * 1000) return;
        } else if (timeFilter === 'today') {
          const todayStr = new Date().toISOString().substring(0, 10);
          if (orderDay !== todayStr) return;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(timeFilter)) {
          // Lọc chính xác theo ngày
          if (orderDay !== timeFilter) return;
        } else if (/^\d{4}-\d{2}$/.test(timeFilter)) {
          // Lọc chính xác theo tháng
          if (orderMonth !== timeFilter) return;
        }
      }
    }

    const items = toList(order.orderitems ?? order.OrderItems ?? order.items ?? order.Items);
    items.forEach((item) => {
      // Lấy tên: ưu tiên từ food/combo object đính kèm
      const foodName  = item.food?.foodName  ?? item.Food?.foodName  ?? item.Food?.FoodName  ?? item.foodName  ?? item.FoodName;
      const comboName = item.combo?.comboName ?? item.Combo?.comboName ?? item.Combo?.ComboName ?? item.comboName ?? item.ComboName;
      const name = foodName || comboName;
      if (!name || String(name).toLowerCase() === "string") return;

      const subtotal = Number(item.subtotal ?? item.Subtotal ?? 0);
      const qty      = Number(item.quantity  ?? item.Quantity  ?? 1);
      const price    = Number(item.unitPrice ?? item.UnitPrice ?? item.price ?? item.Price ?? 0);
      const revenue  = subtotal > 0 ? subtotal : price * qty;

      const prev = dataByName.get(name) || { revenue: 0, quantity: 0 };
      dataByName.set(name, {
        revenue: prev.revenue + revenue,
        quantity: prev.quantity + qty
      });
    });
  });

  const total = Array.from(dataByName.values()).reduce((s, v) => s + v.revenue, 0);
  return Array.from(dataByName, ([name, data]) => ({
    name,
    value: data.revenue,
    quantity: data.quantity,
    percent: total > 0 ? Number(((data.revenue / total) * 100).toFixed(1)) : 0,
  })).sort((a, b) => b.value - a.value);
}


function toList(value) {
  if (Array.isArray(value)) return value;
  return value?.$values || value?.data || value?.items || [];
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

// Chuẩn hoá foodDistributions từ response API /Dashboard/RevenueChart
function normalizeFoodDistributions(chartDataResp) {
  const raw =
    chartDataResp?.foodDistributions?.$values ||
    chartDataResp?.foodDistributions ||
    chartDataResp?.FoodDistributions?.$values ||
    chartDataResp?.FoodDistributions || [];

  return toList(raw).map(f => ({
    name: f.foodName || f.FoodName || f.name || f.Name || "Chưa rõ",
    value: f.revenue || f.Revenue || f.value || f.Value || 0,
    quantity: f.quantity || f.Quantity || 0,
    percent: f.percentage || f.Percentage || f.percent || f.Percent || 0,
  }));
}

export function useDashboard() {
  const [stats, setStats] = useState(DEFAULT_DASHBOARD_STATS);
  const [recentTickets, setRecentTickets] = useState([]);
  
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

  // Cache để tránh fetch lại khi filter không đổi
  const cacheRef = useRef({});

  useEffect(() => {
    fetchDashboardData();
  }, [timeFilter, cinemaId]);

  // ─── Fetch toàn bộ dữ liệu dashboard (5 API song song) ───────────────
  async function fetchDashboardData() {
    const cacheKey = `${timeFilter}__${cinemaId}`;

    // Dùng cache nếu đã fetch rồi
    if (cacheRef.current[cacheKey]) {
      applyData(cacheRef.current[cacheKey]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      // 5 API song song — không gọi /Bookings, /Foods, /Combos nặng nữa
      const [statsData, recentTicketData, chartDataResp, movieStatsResp, cinemasResp] = await Promise.all([
        getDashboardStats(timeFilter, cinemaId),
        getRecentTickets(),
        getRevenueChart(timeFilter, cinemaId),
        getMovieStats(timeFilter, cinemaId),
        getCinemas(),
      ]);

      const result = { statsData, recentTicketData, chartDataResp, movieStatsResp, cinemasResp };
      cacheRef.current[cacheKey] = result;
      applyData(result);

      // Fetch food distribution nền — không block UI chính
      fetchFoodDistributionBg(timeFilter, cinemaId, cacheKey);

    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message || "Lấy dữ liệu dashboard thất bại!");
    } finally {
      setLoading(false);
    }
  }

  // ─── Background fetch food distribution ────────────────────────
  async function fetchFoodDistributionBg(filter, cinemaId, cacheKey) {
    const foodCacheKey = `food__${cacheKey}__${cinemaId}`;
    if (cacheRef.current[foodCacheKey]) {
      applyFoodDistribution(cacheRef.current[foodCacheKey], filter, cinemaId);
      return;
    }
    try {
      const foodSources = await getDashboardFoodSources();
      cacheRef.current[foodCacheKey] = foodSources;
      applyFoodDistribution(foodSources, filter, cinemaId);
    } catch (e) {
      // Silent fail — chart stays empty if backend returns error
    }
  }

  function applyFoodDistribution(foodSources, filter, cinemaId) {
    const distributions = buildFoodDistributions(foodSources, filter, cinemaId);
    const newTotalFood = distributions.reduce((acc, curr) => acc + (curr.value || 0), 0);
    
    setChartData(prev => {
      if (!prev) return prev;
      
      // Chỉ ghi đè biểu đồ nếu thuật toán frontend (tính thêm offline) ra doanh thu cao hơn backend
      if (newTotalFood > prev.totalFoodRevenue) {
        return {
          ...prev,
          foodDistributions: distributions,
          totalFoodRevenue: newTotalFood
        };
      }
      
      // Ngược lại, giữ nguyên dữ liệu gốc từ API RevenueChart
      return prev;
    });
  }

  function applyData({ statsData, recentTicketData, chartDataResp, movieStatsResp, cinemasResp }) {
    setStats(normalizeDashboardStats(statsData));
    setRecentTickets(normalizeRecentTickets(recentTicketData));

    const cList = cinemasResp?.$values || cinemasResp || [];
    setCinemas(cList);

    // Dùng foodDistributions đã có trong RevenueChart response — không cần fetch thêm
    console.log('[DEBUG] chartDataResp keys:', Object.keys(chartDataResp || {}));
    console.log('[DEBUG] chartDataResp full:', chartDataResp);
    const foodDistributions = normalizeFoodDistributions(chartDataResp);
    console.log('[DEBUG] foodDistributions resolved:', foodDistributions);

    setChartData({
      totalTicketRevenue: chartDataResp?.totalTicketRevenue || chartDataResp?.TotalTicketRevenue || 0,
      totalFoodRevenue: chartDataResp?.totalFoodRevenue || chartDataResp?.TotalFoodRevenue || 0,
      ticketRevenuePercentage: chartDataResp?.ticketRevenuePercentage || chartDataResp?.TicketRevenuePercentage || 0,
      foodRevenuePercentage: chartDataResp?.foodRevenuePercentage || chartDataResp?.FoodRevenuePercentage || 0,
      foodDistributions,
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

    // Dùng thông tin phim từ movieStatsResp (không cần gọi /Movies riêng)
    setMovieStats((movieStatsResp?.$values || movieStatsResp || []).map(m => {
      const movieStatus = getMovieStatus(m);
      return {
        movieId: m.movieId ?? m.MovieId,
        movieTitle: m.movieTitle ?? m.MovieTitle ?? m.title ?? m.Title,
        posterUrl: m.posterUrl ?? m.PosterUrl ?? m.imageUrl ?? m.ImageUrl,
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
      };
    }).filter(m => m.movieTitle && m.movieStatus !== "Đã chiếu"));
  }

  // Xoá cache khi filter thay đổi
  function clearCache() {
    cacheRef.current = {};
  }

  function handleSetTimeFilter(val) {
    clearCache();
    setTimeFilter(val);
  }

  function handleSetCinemaId(val) {
    clearCache();
    setCinemaId(val);
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
    cards, loading, error, setError,
    fetchDashboardData,
    
    // New
    timeFilter,
    setTimeFilter: handleSetTimeFilter,
    cinemaId,
    setCinemaId: handleSetCinemaId,
    cinemas,
    chartData,
    movieStats,
    selectedMovie, movieDetailStats, isDetailModalOpen,
    openMovieDetail, closeMovieDetail
  };
}
