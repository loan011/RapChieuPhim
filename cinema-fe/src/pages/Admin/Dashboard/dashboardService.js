import {
  getApiUrl,
  readResponse,
  getErrorMessage,
  getAuthHeaders,
} from "../../../services/apiHelper";

const API_URL = getApiUrl();

function norm(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

async function apiGet(path) {
  const r = await fetch(`${API_URL}${path}`, { headers: getAuthHeaders() });
  const d = await readResponse(r);
  if (!r.ok) throw new Error(getErrorMessage(d, `GET ${path} thất bại`));
  return d;
}

export async function getDashboardData() {
  const [movies, users, tickets] = await Promise.all([
    apiGet("/Movies"),
    apiGet("/Users"),
    apiGet("/Tickets"),
  ]);

  const ticketArr = norm(tickets);
  const totalMovies = norm(movies).length;
  const totalUsers = norm(users).length;
  const totalTickets = ticketArr.length;

  const activeTickets = ticketArr.filter((t) => {
    const s = (t.status || "").toLowerCase();
    return s !== "cancelled" && s !== "đã hủy";
  });

  // Tổng doanh thu
  const totalRevenue = activeTickets.reduce((s, t) => s + (t.price || t.Price || 0), 0);

  // Doanh thu hôm nay
  const today = new Date().toISOString().split("T")[0];
  const todayRevenue = activeTickets
    .filter((t) => {
      const d = (t.issuedAt || t.IssuedAt || t.booking?.bookingDate || "").split("T")[0];
      return d === today;
    })
    .reduce((s, t) => s + (t.price || t.Price || 0), 0);

  // Doanh thu theo ngày (7 ngày gần nhất)
  const dayMap = {};
  activeTickets.forEach((t) => {
    const d = (t.issuedAt || t.IssuedAt || t.booking?.bookingDate || "Không rõ").split("T")[0];
    dayMap[d] = (dayMap[d] || 0) + (t.price || t.Price || 0);
  });
  const revenueByDayArr = Object.entries(dayMap)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  // Doanh thu theo suất chiếu từng phim
  const showtimeMap = {};
  activeTickets.forEach((t) => {
    const movie =
      t.booking?.showTime?.movie?.title ||
      t.booking?.ShowTime?.Movie?.Title ||
      t.movieTitle || "Phim chưa xác định";
    const startTime = t.booking?.showTime?.startTime || t.booking?.ShowTime?.StartTime || "";
    const timeStr = startTime && startTime.includes("T") ? startTime.split("T")[1]?.slice(0, 5) : startTime.slice(0, 5) || "";
    const date = (t.booking?.showTime?.startTime || t.issuedAt || "").split("T")[0] || "";
    const key = `${movie}__${date}__${timeStr}`;
    if (!showtimeMap[key]) showtimeMap[key] = { movie, date, time: timeStr, count: 0, revenue: 0 };
    showtimeMap[key].count += 1;
    showtimeMap[key].revenue += (t.price || t.Price || 0);
  });
  const revenueByShowtimeArr = Object.values(showtimeMap).sort((a, b) => b.revenue - a.revenue);

  // Vé gần đây
  const recentTickets = ticketArr.slice(-10).reverse().map((t) => ({
    id: t.ticketId || t.id,
    code: t.ticketCode || t.code || `VE${t.ticketId}`,
    customerName: t.booking?.user?.fullName || t.customerName || "—",
    movieTitle: t.booking?.showTime?.movie?.title || t.booking?.ShowTime?.Movie?.Title || t.movieTitle || "—",
    cinemaName: t.booking?.showTime?.room?.cinema?.cinemaName || t.cinemaName || "—",
    price: t.price || t.Price || 0,
    status: t.status || "Active",
    issuedAt: (t.issuedAt || t.booking?.bookingDate || "").split("T")[0] || "",
  }));

  return { totalMovies, totalUsers, totalTickets, totalRevenue, todayRevenue, revenueByDayArr, revenueByShowtimeArr, recentTickets };
}

export async function getDashboardStats() {
  const [movies, users, tickets, payments] = await Promise.all([
    apiGet("/Movies"),
    apiGet("/Users"),
    apiGet("/Tickets"),
    apiGet("/Payments"),
  ]);
  const payArr = norm(payments);
  const revenue = payArr
    .filter((p) => {
      const s = (p.paymentStatus || p.PaymentStatus || p.status || "").toLowerCase();
      return s === "completed" || s === "paid";
    })
    .reduce((sum, p) => sum + (p.totalAmount || p.TotalAmount || p.amount || 0), 0);

  return {
    totalMovies: norm(movies).length,
    totalUsers: norm(users).length,
    totalTickets: norm(tickets).length,
    revenue,
  };
}

export async function getRecentTickets() {
  const data = await apiGet("/Tickets");
  const arr = norm(data);
  // Lấy 10 vé mới nhất
  return arr.slice(-10).reverse().map((t) => ({
    id: t.ticketId || t.id,
    code: t.ticketCode || t.code || `VE${t.ticketId}`,
    customerName: t.booking?.user?.fullName || t.customerName || "Khách hàng",
    movieTitle: t.booking?.showTime?.movie?.title || t.movieTitle || "—",
    price: t.price || t.Price || 0,
    status: t.status || "Active",
    issuedAt: t.issuedAt || t.booking?.bookingDate || "",
  }));
}