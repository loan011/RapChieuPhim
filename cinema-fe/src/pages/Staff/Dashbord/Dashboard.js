import { useEffect, useState } from "react";
import { getDashboardStats, getRecentTickets, getMovieRevenueStats } from "./DashboardService";
import { formatMoney } from "../../Admin/Dashboard/Dashboard.js";

export function useDashboard() {
  const [stats, setStats] = useState({ totalMovies: 0, totalUsers: 0, totalTickets: 0, revenue: 0 });
  const [recentTickets, setRecentTickets] = useState([]);
  const [movieStats, setMovieStats] = useState([]);
  const [cinemaStats, setCinemaStats] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const [statsData, ticketsData, revenueData] = await Promise.all([
          getDashboardStats().catch(() => ({ totalMovies: 0, totalUsers: 0, totalTickets: 0, revenue: 0 })),
          getRecentTickets().catch(() => []),
          getMovieRevenueStats().catch(() => ({ movieStats: [], cinemaStats: [], totalRevenue: 0, totalTickets: 0 })),
        ]);
        setStats({
          totalMovies:  statsData.totalMovies  || 0,
          totalUsers:   statsData.totalUsers   || 0,
          totalTickets: statsData.totalTickets || 0,
          revenue:      statsData.revenue      || 0,
        });
        setRecentTickets(Array.isArray(ticketsData) ? ticketsData : []);
        setMovieStats(revenueData.movieStats);
        setCinemaStats(revenueData.cinemaStats);
        setTotalRevenue(revenueData.totalRevenue);
        setTotalTickets(revenueData.totalTickets);
      } catch (err) {
        setError(err.message || "Không thể tải số liệu thống kê.");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return {
    stats,
    recentTickets,
    movieStats,
    cinemaStats,
    totalRevenue,
    totalTickets,
    loading,
    error,
    formatMoney,
  };
}
