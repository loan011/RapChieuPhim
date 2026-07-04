import { useEffect, useState, useMemo } from "react";
import { getAllPayments, getRevenueByMovie, getAllTickets, getAllMovies, getAllShowtimes } from "./reportService";

function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function toDateStr(val) {
  if (!val) return null;
  return String(val).split("T")[0];
}

export function useReport() {
  const [payments, setPayments] = useState([]);
  const [movieRevenue, setMovieRevenue] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [allShowtimes, setAllShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const today = new Date();
  const defaultFrom = new Date(today);
  defaultFrom.setDate(today.getDate() - 29);

  const [fromDate, setFromDate] = useState(defaultFrom.toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(today.toISOString().split("T")[0]);
  const [activeTab, setActiveTab] = useState("day");

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      setLoading(true);
      setError(null);
      const [payData, movieData, tickData, moviesData, showtimesData] = await Promise.all([
        getAllPayments(),
        getRevenueByMovie(),
        getAllTickets(),
        getAllMovies(),
        getAllShowtimes(),
      ]);
      setPayments(normalizeArray(payData));
      setMovieRevenue(normalizeArray(movieData));
      setTickets(normalizeArray(tickData));
      setAllMovies(normalizeArray(moviesData));
      setAllShowtimes(normalizeArray(showtimesData));
    } catch (err) {
      setError(err?.message || "Không tải được dữ liệu báo cáo.");
    } finally {
      setLoading(false);
    }
  }

  // Payments đã hoàn thành trong khoảng ngày
  const paidPayments = useMemo(() => {
    return payments.filter((p) => {
      // Kiểm tra paymentStatus hoặc status
      const status = (p.paymentStatus || p.PaymentStatus || p.status || p.Status || "").toLowerCase();
      const isPaid = status === "completed" || status === "paid" || status === "success"
        || status === "đã thanh toán";
      // Ưu tiên paidAt, fallback createdAt
      const dateStr = toDateStr(p.paidAt || p.PaidAt || p.paymentDate || p.createdAt || p.CreatedAt);
      if (!dateStr) return isPaid;
      return isPaid && dateStr >= fromDate && dateStr <= toDate;
    });
  }, [payments, fromDate, toDate]);

  // Summary
  const totalRevenue = useMemo(
    () => paidPayments.reduce((s, p) => s + (p.totalAmount || p.TotalAmount || p.amount || p.Amount || 0), 0),
    [paidPayments]
  );
  const totalInvoices = paidPayments.length;
  const totalTickets = useMemo(() => tickets.length, [tickets]);
  const dayCount = useMemo(() => {
    const diff = Math.max(1, Math.round((new Date(toDate) - new Date(fromDate)) / 86400000) + 1);
    return diff;
  }, [fromDate, toDate]);
  const avgPerDay = totalInvoices > 0 ? totalRevenue / dayCount : 0;

  // Revenue by day
  const revenueByDay = useMemo(() => {
    const map = {};
    paidPayments.forEach((p) => {
      const d = toDateStr(p.paidAt || p.PaidAt || p.paymentDate || p.createdAt || p.CreatedAt) || "Không rõ";
      map[d] = (map[d] || 0) + (p.totalAmount || p.TotalAmount || p.amount || p.Amount || 0);
    });
    return Object.entries(map)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [paidPayments]);

  // Revenue by movie – từ Payments (booking→showTime→movie)
  const revenueByMovie = useMemo(() => {
    const map = {};
    // Khởi tạo tất cả phim với doanh thu = 0
    allMovies.forEach((m) => {
      const title = m.title || m.Title || m.movieTitle || m.MovieTitle || "Không rõ";
      if (title !== "Không rõ") map[title] = 0;
    });
    // Ưu tiên backend endpoint RevenueByMovie
    movieRevenue.forEach((r) => {
      const movie = r.movieTitle || r.MovieTitle || r.title || r.Title || "Không rõ";
      const rev = r.totalRevenue || r.TotalRevenue || r.revenue || r.Revenue || 0;
      map[movie] = (map[movie] || 0) + rev;
    });
    // Fallback: tổng hợp từ paidPayments nếu có nested booking
    if (movieRevenue.length === 0) {
      paidPayments.forEach((p) => {
        const movie =
          p.booking?.showTime?.movie?.title ||
          p.booking?.ShowTime?.Movie?.Title ||
          "Không rõ";
        if (movie !== "Không rõ")
          map[movie] = (map[movie] || 0) + (p.totalAmount || p.TotalAmount || 0);
      });
    }
    return Object.entries(map)
      .map(([movie, revenue]) => ({ movie, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [paidPayments, movieRevenue, allMovies]);

  // Revenue by cinema – từ Payments (booking→showTime→room→cinema)
  const revenueByCinema = useMemo(() => {
    const map = {};
    paidPayments.forEach((p) => {
      const cinema =
        p.booking?.showTime?.room?.cinema?.cinemaName ||
        p.booking?.ShowTime?.Room?.Cinema?.CinemaName ||
        "Không rõ";
      map[cinema] = (map[cinema] || 0) + (p.totalAmount || p.TotalAmount || 0);
    });
    // Fallback từ tickets nếu payments không có nested data
    if (Object.keys(map).length === 0 || (Object.keys(map).length === 1 && map["Không rõ"])) {
      tickets
        .filter((t) => {
          const s = (t.status || "").toLowerCase();
          return s === "used" || s === "paid";
        })
        .forEach((t) => {
          const cinema =
            t.booking?.showTime?.room?.cinema?.cinemaName ||
            t.cinemaName || t.cinema || "Không rõ";
          map[cinema] = (map[cinema] || 0) + (t.price || t.Price || 0);
        });
    }
    return Object.entries(map)
      .map(([cinema, revenue]) => ({ cinema, revenue }))
      .filter((r) => r.cinema !== "Không rõ" || r.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue);
  }, [paidPayments, tickets]);

  // Revenue by showtime – từ Payments
  const revenueByShowtime = useMemo(() => {
    const map = {};
    // Khởi tạo tất cả suất chiếu với doanh thu = 0
    allShowtimes.forEach((s) => {
      const movie =
        s.movie?.title || s.Movie?.Title ||
        s.movieTitle || s.MovieTitle || "Phim";
      const cinema =
        s.room?.cinema?.cinemaName || s.Room?.Cinema?.CinemaName ||
        s.cinemaName || s.CinemaName || "Rạp";
      const startTime = s.startTime || s.StartTime || s.showDate || s.ShowDate || "";
      const date = startTime ? String(startTime).split("T")[0] : "";
      const label = date ? `${movie} - ${cinema} (${date})` : `${movie} - ${cinema}`;
      if (!map[label]) map[label] = 0;
    });
    paidPayments.forEach((p) => {
      const movie =
        p.booking?.showTime?.movie?.title ||
        p.booking?.ShowTime?.Movie?.Title || "Phim";
      const startTime =
        p.booking?.showTime?.startTime ||
        p.booking?.ShowTime?.StartTime || "";
      const cinema =
        p.booking?.showTime?.room?.cinema?.cinemaName ||
        p.booking?.ShowTime?.Room?.Cinema?.CinemaName || "Rạp";
      const date = startTime ? String(startTime).split("T")[0] : toDateStr(p.paidAt || p.createdAt) || "";
      const label = date ? `${movie} - ${cinema} (${date})` : `${movie} - ${cinema}`;
      map[label] = (map[label] || 0) + (p.totalAmount || p.TotalAmount || 0);
    });
    // Fallback từ tickets
    if (paidPayments.length === 0) {
      tickets
        .filter((t) => { const s = (t.status || "").toLowerCase(); return s === "used" || s === "paid"; })
        .forEach((t) => {
          const movie = t.booking?.showTime?.movie?.title || t.movieTitle || "Phim";
          const cinema = t.booking?.showTime?.room?.cinema?.cinemaName || t.cinemaName || "Rạp";
          const startTime = t.booking?.showTime?.startTime || "";
          const date = startTime ? String(startTime).split("T")[0] : "";
          const label = date ? `${movie} - ${cinema} (${date})` : `${movie} - ${cinema}`;
          map[label] = (map[label] || 0) + (t.price || t.Price || 0);
        });
    }
    return Object.entries(map)
      .map(([showtime, revenue]) => ({ showtime, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [paidPayments, tickets, allShowtimes]);

  return {
    loading,
    error,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    activeTab,
    setActiveTab,
    totalRevenue,
    totalInvoices,
    totalTickets,
    avgPerDay,
    revenueByDay,
    revenueByMovie,
    revenueByCinema,
    revenueByShowtime,
    fetchAll,
  };
}
