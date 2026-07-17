import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();

function norm(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

async function apiGet(path, fallbackMessage) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(data, fallbackMessage));
  }
  return data;
}

export async function getDashboardStats() {
  const [movies, tickets] = await Promise.all([
    apiGet("/Movies",  "Lấy phim thất bại!").catch(() => []),
    apiGet("/Tickets", "Lấy vé thất bại!").catch(() => []),
  ]);
  const ticketArr = norm(tickets);
  const activeTickets = ticketArr.filter(t => {
    const s = (t.status || "").toLowerCase();
    return s !== "cancelled" && s !== "đã hủy" && s !== "canceled";
  });
  return {
    totalMovies:  norm(movies).length,
    totalUsers:   0,
    totalTickets: ticketArr.length,
    revenue: activeTickets.reduce((s, t) => s + (t.price || t.Price || 0), 0),
  };
}

export async function getRecentTickets() {
  const data = await apiGet("/Tickets", "Lấy danh sách vé gần đây thất bại!");
  const arr = norm(data);
  return arr.slice(-10).reverse().map(t => ({
    id: t.ticketId || t.id,
    movieName: t.booking?.showTime?.movie?.title || t.booking?.ShowTime?.Movie?.Title || t.movieTitle || "—",
    customerName: t.booking?.user?.fullName || t.customerName || "—",
    seat: t.seat?.seatNumber || t.seatNumber || t.seat || "—",
    cinemaName: t.booking?.showTime?.room?.cinema?.cinemaName || t.cinemaName || "—",
    price: (t.price || t.Price || 0).toLocaleString("vi-VN") + " đ",
    createdAt: (t.issuedAt || t.booking?.bookingDate || "").split("T")[0] || "—",
  }));
}

export async function getMovieRevenueStats() {
  const data = await apiGet("/Tickets", "Lấy dữ liệu vé thất bại!");
  const tickets = norm(data);

  const activeTickets = tickets.filter(t => {
    const s = (t.status || "").toLowerCase();
    return s !== "cancelled" && s !== "đã hủy" && s !== "canceled";
  });

  const movieMap = {};
  const cinemaMap = {};

  activeTickets.forEach(t => {
    const movie =
      t.booking?.showTime?.movie?.title ||
      t.booking?.ShowTime?.Movie?.Title ||
      t.movieTitle || t.MovieTitle || "Chưa xác định";

    const cinema =
      t.booking?.showTime?.room?.cinema?.cinemaName ||
      t.booking?.ShowTime?.Room?.Cinema?.CinemaName ||
      t.cinemaName || t.CinemaName || "Chưa xác định";

    const price = t.price || t.Price || 0;

    // per-movie
    if (!movieMap[movie]) movieMap[movie] = { name: movie, revenue: 0, tickets: 0 };
    movieMap[movie].revenue += price;
    movieMap[movie].tickets += 1;

    // per-cinema
    if (!cinemaMap[cinema]) cinemaMap[cinema] = { name: cinema, tickets: 0, revenue: 0 };
    cinemaMap[cinema].tickets += 1;
    cinemaMap[cinema].revenue += price;
  });

  const totalRevenue = activeTickets.reduce((s, t) => s + (t.price || t.Price || 0), 0);
  const totalTickets = activeTickets.length;

  const movieStats = Object.values(movieMap)
    .sort((a, b) => b.revenue - a.revenue)
    .map(m => ({
      ...m,
      revenuePercent: totalRevenue > 0 ? Math.round((m.revenue / totalRevenue) * 100) : 0,
      ticketPercent: totalTickets > 0 ? Math.round((m.tickets / totalTickets) * 100) : 0,
    }));

  const cinemaStats = Object.values(cinemaMap)
    .sort((a, b) => b.tickets - a.tickets)
    .map(c => ({
      ...c,
      ticketPercent: totalTickets > 0 ? Math.round((c.tickets / totalTickets) * 100) : 0,
      revenuePercent: totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 100) : 0,
    }));

  return { movieStats, cinemaStats, totalRevenue, totalTickets };
}

export async function getDailyRevenueStats() {
  const data = await apiGet("/Tickets", "Lấy dữ liệu vé thất bại!");
  const tickets = norm(data);

  const activeTickets = tickets.filter(t => {
    const s = (t.status || "").toLowerCase();
    return s !== "cancelled" && s !== "đã hủy" && s !== "canceled";
  });

  const map = {};
  const dayMovieMap = {};

  activeTickets.forEach(t => {
    const raw = t.issuedAt || t.booking?.bookingDate || t.booking?.BookingDate || "";
    const date = raw.split("T")[0];
    if (!date || date === "undefined" || date === "") return;

    const price = t.price || t.Price || 0;
    const movie =
      t.booking?.showTime?.movie?.title ||
      t.booking?.ShowTime?.Movie?.Title ||
      t.movieTitle || t.MovieTitle || "Chưa xác định";

    if (!map[date]) map[date] = { revenue: 0, tickets: 0 };
    map[date].revenue += price;
    map[date].tickets += 1;

    if (!dayMovieMap[date]) dayMovieMap[date] = {};
    if (!dayMovieMap[date][movie]) dayMovieMap[date][movie] = { name: movie, revenue: 0, tickets: 0 };
    dayMovieMap[date][movie].revenue += price;
    dayMovieMap[date][movie].tickets += 1;
  });

  const today = new Date();
  const result = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    result.push({
      date: dateStr,
      label: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
      revenue: map[dateStr]?.revenue || 0,
      tickets: map[dateStr]?.tickets || 0,
      movies: Object.values(dayMovieMap[dateStr] || {}).sort((a, b) => b.revenue - a.revenue),
    });
  }
  return result;
}
