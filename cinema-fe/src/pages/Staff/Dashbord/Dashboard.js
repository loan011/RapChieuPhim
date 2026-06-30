import { useEffect, useState } from "react";
import { getDashboardStats, getRecentTickets } from "./DashboardService";
import { normalizeDashboardStats, normalizeRecentTickets, formatMoney } from "../../Admin/Dashboard/Dashboard.js";

export function useDashboard() {
  const [stats, setStats] = useState({ totalMovies: 0, totalUsers: 0, totalTickets: 0, revenue: 0 });
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const [statsData, ticketsData] = await Promise.all([
          getDashboardStats(),
          getRecentTickets()
        ]);
        setStats(normalizeDashboardStats(statsData));
        setRecentTickets(normalizeRecentTickets(ticketsData));
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
    loading,
    error,
    formatMoney,
  };
}
