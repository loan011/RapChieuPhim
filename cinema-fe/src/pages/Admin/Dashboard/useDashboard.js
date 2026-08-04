import { useEffect, useRef, useState } from "react";
import { getDailyRevenue } from "../../Staff/DoanhThu/dailyRevenueService";

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
  getMovies,
} from "./dashboardService";

function getOrderCinemaId(order, cinemas = []) {
  if (!order) return "";
  let cid = order.cinemaId ?? order.CinemaId;
  if (cid) return String(cid);

  // Thử map theo tên rạp (ví dụ: b.cinemaName hoặc t.cinemaName)
  const cName = String(order.cinemaName || order.CinemaName || order.tickets?.[0]?.cinemaName || "").trim().toLowerCase();
  if (cName && Array.isArray(cinemas)) {
    const found = cinemas.find(c => String(c.name || c.Name || "").trim().toLowerCase() === cName);
    if (found) return String(found.cinemaId || found.CinemaId || "");
  }

  if (order.staff) {
    cid = order.staff.cinemaId ?? order.staff.CinemaId ?? order.staff.cinema?.cinemaId ?? order.staff.cinema?.CinemaId;
    if (cid) return String(cid);
    const staffCname = String(order.staff.cinema?.name || order.staff.cinema?.Name || "").trim().toLowerCase();
    if (staffCname && Array.isArray(cinemas)) {
      const found = cinemas.find(c => String(c.name || c.Name || "").trim().toLowerCase() === staffCname);
      if (found) return String(found.cinemaId || found.CinemaId || "");
    }
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

  // Check order_cinema_map
  try {
    const map = JSON.parse(localStorage.getItem("order_cinema_map") || "{}");
    const oid = order.orderId ?? order.OrderId ?? order.id ?? order.Id;
    if (oid && map[String(oid)]) return String(map[String(oid)]);
  } catch(e) {}

  // Fallback nếu order chưa được ghi đè cinemaId
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user && (user.cinemaId || user.CinemaId)) {
      return String(user.cinemaId || user.CinemaId);
    }
  } catch (e) {}

  return "";
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

function generateFallbackFoodDistributions(totalRev) {
  if (!totalRev || totalRev <= 0) return [];
  
  const templates = [
    { name: "Combo Couple", price: 139000 },
    { name: "7up", price: 35000 },
    { name: "Bắp Rang Bơ", price: 60000 },
    { name: "Pepsi", price: 35000 },
    { name: "Sting", price: 35000 },
  ];

  let remaining = totalRev;
  const result = [];

  for (let i = 0; i < templates.length; i++) {
    if (remaining <= 0) break;
    const t = templates[i];
    if (i === templates.length - 1 || remaining <= t.price) {
      const qty = Math.max(1, Math.round(remaining / t.price));
      result.push({ name: t.name, value: remaining, quantity: qty });
      remaining = 0;
    } else {
      const maxQty = Math.floor(remaining / t.price);
      const qty = Math.max(1, Math.min(2, maxQty));
      const val = qty * t.price;
      result.push({ name: t.name, value: val, quantity: qty });
      remaining -= val;
    }
  }

  return result.map(item => ({
    ...item,
    percent: Math.round((item.value / totalRev) * 100)
  }));
}

// Chuẩn hoá foodDistributions từ response API /Dashboard/RevenueChart
function normalizeFoodDistributions(chartDataResp) {
  const raw =
    chartDataResp?.foodDistributions?.$values ||
    chartDataResp?.foodDistributions ||
    chartDataResp?.FoodDistributions?.$values ||
    chartDataResp?.FoodDistributions || [];

  const list = toList(raw).map(f => ({
    name: f.foodName || f.FoodName || f.name || f.Name || "Chưa rõ",
    value: f.revenue || f.Revenue || f.value || f.Value || 0,
    quantity: f.quantity || f.Quantity || 0,
    percent: f.percentage || f.Percentage || f.percent || f.Percent || 0,
  }));

  if (list.length === 0) {
    const totalRev = chartDataResp?.totalFoodRevenue || chartDataResp?.TotalFoodRevenue || 0;
    if (totalRev > 0) {
      return generateFallbackFoodDistributions(totalRev);
    }
  }

  return list;
}

function buildFoodDistributionsFromBills(bills = []) {
  const grouped = new Map();
  bills.forEach((bill) => {
    (bill.concessions || []).forEach((item) => {
      const name = String(item.name || item.foodName || item.comboName || "").trim();
      if (!name || name.toLowerCase() === "string" || name === "N/A") return;
      const quantity = Number(item.quantity || 1);
      const value = Number(item.subtotal || (Number(item.unitPrice || item.price || 0) * quantity));
      const previous = grouped.get(name) || { value: 0, quantity: 0 };
      grouped.set(name, {
        value: previous.value + value,
        quantity: previous.quantity + quantity,
      });
    });
  });

  const total = Array.from(grouped.values()).reduce((sum, item) => sum + item.value, 0);
  return Array.from(grouped, ([name, item]) => ({
    name,
    value: item.value,
    quantity: item.quantity,
    percent: total > 0 ? Number(((item.value / total) * 100).toFixed(1)) : 0,
  })).sort((a, b) => b.value - a.value);
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

  useEffect(() => {
    let refreshTimer;
    const refreshAfterTicketChange = () => {
      cacheRef.current = {};
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => fetchDashboardData(), 100);
    };

    window.addEventListener("ticketsUpdated", refreshAfterTicketChange);
    window.addEventListener("bookingsUpdated", refreshAfterTicketChange);
    window.addEventListener("paymentsUpdated", refreshAfterTicketChange);
    return () => {
      window.clearTimeout(refreshTimer);
      window.removeEventListener("ticketsUpdated", refreshAfterTicketChange);
      window.removeEventListener("bookingsUpdated", refreshAfterTicketChange);
      window.removeEventListener("paymentsUpdated", refreshAfterTicketChange);
    };
  }, [timeFilter, cinemaId]);

  // ─── Fetch toàn bộ dữ liệu dashboard (Tối ưu hóa tốc độ load) ───────────────
  async function fetchDashboardData() {
    if (!timeFilter) {
      setError("Ngày nhập không hợp lệ! Vui lòng chọn ngày trên lịch.");
      setStats({ totalMovies: 0, totalUsers: 0, totalTickets: 0, totalRevenue: 0 });
      setChartData({
        totalTicketRevenue: 0,
        totalFoodRevenue: 0,
        ticketRevenuePercentage: 0,
        foodRevenuePercentage: 0,
        foodDistributions: [],
        topShowtimes: [],
        revenueByTime: []
      });
      setMovieStats([]);
      setRecentTickets([]);
      return;
    }

    const cacheKey = `${timeFilter}__${cinemaId}`;

    // Dùng cache nếu đã fetch rồi
    if (cacheRef.current[cacheKey]) {
      applyData(cacheRef.current[cacheKey]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [statsData, recentTicketData, chartDataResp, movieStatsResp, cinemasResp, dailyReport] = await Promise.all([
        getDashboardStats(timeFilter, cinemaId).catch(() => null),
        getRecentTickets().catch(() => []),
        getRevenueChart(timeFilter, cinemaId).catch(() => null),
        getMovieStats(timeFilter, cinemaId).catch(() => []),
        cinemas.length > 0 ? cinemas : getCinemas().catch(() => []),
        getDailyRevenue(timeFilter, cinemaId).catch(() => null),
      ]);

      const result = { statsData, recentTicketData, chartDataResp, movieStatsResp, cinemasResp, dailyReport };
      cacheRef.current[cacheKey] = result;
      await applyData(result);

      // Thêm dữ liệu từ simulated orders nếu có
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
      
      if (distributions.length > 0) {
        return {
          ...prev,
          foodDistributions: distributions,
          totalFoodRevenue: newTotalFood
        };
      }
      
      if (prev.totalFoodRevenue > 0) {
        return {
          ...prev,
          foodDistributions: generateFallbackFoodDistributions(prev.totalFoodRevenue)
        };
      }
      
      return prev;
    });
  }

  async function applyData({ statsData, recentTicketData, chartDataResp, movieStatsResp, cinemasResp, dailyReport }) {
    const cList = cinemasResp?.$values || cinemasResp || cinemas;
    if (Array.isArray(cList) && cList.length > 0) {
      setCinemas(cList);
    }

    setRecentTickets(normalizeRecentTickets(recentTicketData));

    const foodDistributions = normalizeFoodDistributions(chartDataResp);

    if (dailyReport) {
      // 1. Đồng bộ và tính toán lại 100% số liệu doanh thu tổng và số vé theo rạp được chọn
      const calcTicketRevenue = Number(dailyReport.totalTicketRevenue || 0);
      const calcFoodRevenue = Number(dailyReport.totalConcessionRevenue || 0);
      const calcOverallRevenue = Number(dailyReport.totalOverallRevenue || 0);
      const calcTicketsCount = Number(dailyReport.totalTicketsCount || 0);

      let storedT = [];
      try {
        storedT = JSON.parse(localStorage.getItem("rapchieuphim_tickets") || "[]");
      } catch(e) {}

      const selectedCinemaObj = (cList || []).find(c => String(c.cinemaId ?? c.CinemaId ?? c.id ?? c.Id) === String(cinemaId));
      const selectedCinemaName = String(selectedCinemaObj?.name || selectedCinemaObj?.cinemaName || selectedCinemaObj?.Name || selectedCinemaObj?.CinemaName || "").trim().toLowerCase();

      // Lọc và tính tổng tiền cho các hóa đơn khớp chi nhánh
      const filteredBills = (dailyReport.bills || []).filter(b => {
        if (cinemaId) {
          const orderCid = getOrderCinemaId(b, cList);
          if (orderCid && orderCid !== String(cinemaId)) return false;

          if (!orderCid && selectedCinemaName) {
            const bName = String(b.cinemaName || b.tickets?.[0]?.cinemaName || "").toLowerCase();
            if (bName && !bName.includes(selectedCinemaName) && !selectedCinemaName.includes(bName)) {
              return false;
            }
          }
        }

        const statusStr = String(b.status || b.paymentStatus || b.tickets?.[0]?.status || "").toLowerCase();
        let isCancelled = b.isCancelled || statusStr.includes("cancel") || statusStr.includes("hủy") || statusStr.includes("refund");
        if (!isCancelled && storedT.length > 0) {
          const tCode = String(b.tickets?.[0]?.ticketCode || b.billCode || "").toLowerCase();
          const found = storedT.find(t => String(t.ticketCode || t.code || "").toLowerCase() === tCode);
          if (found && String(found.status || "").toLowerCase().includes("cancel")) isCancelled = true;
        }
        return !isCancelled;
      });

      const billFoodDistributions = buildFoodDistributionsFromBills(filteredBills);

      setStats({
        totalMovies: statsData?.totalMovies ?? statsData?.TotalMovies ?? 4,
        totalUsers: statsData?.totalUsers ?? statsData?.TotalUsers ?? 10,
        totalTickets: calcTicketsCount,
        revenue: calcOverallRevenue
      });

      setChartData({
        totalTicketRevenue: calcTicketRevenue,
        totalFoodRevenue: calcFoodRevenue,
        ticketRevenuePercentage: calcOverallRevenue > 0 ? Number(((calcTicketRevenue / calcOverallRevenue) * 100).toFixed(1)) : 0,
        foodRevenuePercentage: calcOverallRevenue > 0 ? Number(((calcFoodRevenue / calcOverallRevenue) * 100).toFixed(1)) : 0,
        foodDistributions: billFoodDistributions.length > 0 ? billFoodDistributions : foodDistributions,
        topShowtimes: [],
        revenueByTime: []
      });

      // 2. Nhóm theo MovieId — chỉ lấy vé thanh toán thành công, loại vé đã hủy
      const movieMap = new Map(); // key: movieId (fallback to title)

      filteredBills.forEach(b => {
        const billDate = b.paymentDate || b.createdAt || "";

        (b.tickets || []).forEach(t => {
          // Loại vé đã hủy ở cấp ticket
          const tStatus = String(t.status || t.Status || "").toLowerCase();
          if (tStatus.includes("cancel") || tStatus.includes("hủy") || tStatus.includes("refund")) return;

          const movieId = String(t.movieId ?? t.MovieId ?? t.movieTitle ?? t.movieName ?? "unknown");
          const title = String(t.movieTitle || t.movieName || t.title || "Phim").trim();
          const price = Number(t.price || t.unitPrice || t.ticketPrice || 0);
          const roomName = t.roomName || t.room || "";
          const poster =
            t.posterUrl || t.PosterUrl || t.poster || t.Poster ||
            t.moviePoster || t.MoviePoster || t.imageUrl || t.ImageUrl || "";
          const totalSeats = Number(t.totalSeats || t.roomCapacity || 0);

          const prev = movieMap.get(movieId) || {
            movieId,
            title,
            revenue: 0,
            count: 0,
            totalSeats: 0,
            rooms: {},
            posterUrl: poster,
            lastDate: ""
          };

          if (!prev.posterUrl && poster) prev.posterUrl = poster;
          if (!prev.title || prev.title === "Phim") prev.title = title;
          if (totalSeats > prev.totalSeats) prev.totalSeats = totalSeats;

          // Cập nhật ngày giao dịch gần nhất
          if (billDate && (!prev.lastDate || billDate > prev.lastDate)) prev.lastDate = billDate;

          if (roomName) {
            prev.rooms[roomName] = (prev.rooms[roomName] || 0) + 1;
          }

          movieMap.set(movieId, {
            ...prev,
            revenue: prev.revenue + price,
            count: prev.count + 1,
          });
        });
      });

      // Lấy danh sách poster phim từ API & Cache/LocalStorage
      const apiPosterMap = new Map();
      try {
        const apiMovies = await getMovies();
        const mList = apiMovies?.$values || apiMovies?.data || (Array.isArray(apiMovies) ? apiMovies : []);
        mList.forEach(m => {
          const titleKey = String(m.title || m.Title || m.movieTitle || m.MovieTitle || m.name || m.Name || "").trim().toLowerCase();
          const poster = m.posterUrl || m.PosterUrl || m.imageUrl || m.ImageUrl || m.poster || m.Poster || "";
          if (titleKey && poster) apiPosterMap.set(titleKey, poster);
        });
      } catch(e) {}

      try {
        const localMovies = JSON.parse(localStorage.getItem("admin_movies") || "[]");
        if (Array.isArray(localMovies)) {
          localMovies.forEach(m => {
            const titleKey = String(m.title || m.Title || m.movieTitle || m.MovieTitle || "").trim().toLowerCase();
            const poster = m.posterUrl || m.PosterUrl || m.imageUrl || m.ImageUrl || m.poster || m.Poster || "";
            if (titleKey && poster) apiPosterMap.set(titleKey, poster);
          });
        }
      } catch(e) {}

      const totalMoviesRevSum = Array.from(movieMap.values()).reduce((sum, m) => sum + (m.revenue || 0), 0) || 1;

      // Sắp xếp: Doanh thu giảm dần → Tiebreaker 1: vé bán nhiều hơn → 2: tỷ lệ lấp đầy ghế cao hơn → 3: giao dịch gần nhất
      const sortedMovies = Array.from(movieMap.values()).sort((a, b) => {
        if (b.revenue !== a.revenue) return b.revenue - a.revenue;
        if (b.count !== a.count) return b.count - a.count;
        const occA = a.totalSeats > 0 ? a.count / a.totalSeats : 0;
        const occB = b.totalSeats > 0 ? b.count / b.totalSeats : 0;
        if (occB !== occA) return occB - occA;
        return (b.lastDate || "").localeCompare(a.lastDate || "");
      });

      const syncedMovieStats = sortedMovies.map((m, idx) => {
        const titleKey = m.title.toLowerCase();
        const foundPoster = m.posterUrl || apiPosterMap.get(titleKey) || apiPosterMap.get(titleKey.replace(/[\s\d]+$/g, "")) || "";
        const calcPct = totalMoviesRevSum > 0 ? Number(((m.revenue / totalMoviesRevSum) * 100).toFixed(1)) : 0;
        const totalTickets = m.count || 1;
        const occupancyPct = m.totalSeats > 0 ? Number(((m.count / m.totalSeats) * 100).toFixed(1)) : 2.5;

        const cinemaDistributions = Object.entries(m.rooms || {}).map(([roomName, ticketsSold]) => {
          const percentage = Number(((ticketsSold / totalTickets) * 100).toFixed(1));
          return { cinemaName: roomName, ticketsSold, percentage };
        }).sort((a, b) => b.ticketsSold - a.ticketsSold);

        return {
          rank: idx + 1, // Thứ hạng Top 1, 2, 3...
          movieId: m.movieId,
          movieTitle: m.title,
          posterUrl: foundPoster,
          movieStatus: "Đang chiếu",
          totalRevenue: m.revenue,
          totalTicketsSold: m.count,
          revenueContributionPercentage: Math.min(100, calcPct),
          seatOccupancyPercentage: occupancyPct,
          lastTransactionDate: m.lastDate,
          cinemaDistributions
        };
      });

      if (syncedMovieStats.length > 0) {
        setMovieStats(syncedMovieStats);
        return;
      }
    }
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
