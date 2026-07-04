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