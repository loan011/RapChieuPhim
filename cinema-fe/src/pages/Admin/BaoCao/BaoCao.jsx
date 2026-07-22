import React, { useState, useEffect } from "react";
import "./BaoCao.css";
import {
  MdAssignment,
  MdAttachMoney,
  MdPeople,
  MdSearch,
  MdRefresh,
  MdConfirmationNumber,
  MdFastfood,
  MdStore
} from "react-icons/md";
import { getApiUrl, getAuthHeaders, readResponse } from "../../../services/apiHelper";

export default function BaoCao() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    try {
      // 1. Fetch Staff Reports from API
      const res = await fetch(`${getApiUrl()}/StaffReports`, { headers: getAuthHeaders() });
      let apiReports = [];
      if (res.ok) {
        const data = await readResponse(res);
        apiReports = data?.$values || data || [];
        if (!Array.isArray(apiReports)) apiReports = [];
      }

      // 2. Fetch local storage history if available
      let localReports = [];
      try {
        localReports = JSON.parse(localStorage.getItem("staff_reports_history") || "[]");
      } catch (e) {}

      // Combine and deduplicate
      const allReportsMap = new Map();

      apiReports.forEach((r) => {
        const key = `${r.reportId || r.reportDate}_${r.staffId || r.staff?.email}`;
        allReportsMap.set(key, {
          id: r.reportId || Math.random(),
          staffName: r.staff?.fullName || r.staff?.FullName || "Nhân viên T&M",
          staffEmail: r.staff?.email || r.staff?.Email || "",
          cinemaId: r.cinemaId || r.staff?.cinemaId || 1,
          reportDate: r.reportDate || r.ReportDate,
          summary: r.summary || r.Summary || "",
          totalRevenue: Number(r.totalRevenue || r.TotalRevenue || 0),
          totalBookings: Number(r.totalBookings || r.TotalBookings || 0),
          totalOrders: Number(r.totalOrders || r.TotalOrders || 0),
          createdAt: r.createdAt || r.CreatedAt || r.reportDate
        });
      });

      localReports.forEach((r, idx) => {
        const key = `local_${r.date}_${r.sendTime || idx}`;
        if (!allReportsMap.has(key)) {
          allReportsMap.set(key, {
            id: `local_${idx}`,
            staffName: r.sender || "Nhân viên T&M",
            staffEmail: "",
            cinemaId: r.cinemaId || 1,
            reportDate: r.date,
            summary: r.summary || `Báo cáo doanh thu ngày ${r.date}: Tổng ${r.totalRevenue?.toLocaleString('vi-VN')}đ`,
            totalRevenue: Number(r.totalRevenue || 0),
            totalBookings: Number(r.totalBookings || 0),
            totalOrders: Number(r.totalOrders || 0),
            createdAt: r.date
          });
        }
      });

      const getReportTimestamp = (r) => {
        // 1. Ưu tiên ISO timestamp đầy đủ giờ trong createdAt/reportDate
        const candidates = [r.createdAt, r.reportDate];
        for (const c of candidates) {
          if (c && typeof c === "string" && c.includes("T") && !c.includes("T00:00:00")) {
            const t = new Date(c).getTime();
            if (!isNaN(t)) return t;
          }
        }

        // 2. Trích xuất giờ gửi từ summary ("- Giờ gửi báo cáo: HH:mm:ss")
        if (r.summary) {
          const match = r.summary.match(/Giờ gửi báo cáo:\s*([0-9:]+)/i);
          if (match && match[1]) {
            const dateStr = (r.reportDate || new Date().toISOString().split("T")[0]).split("T")[0];
            const t = new Date(`${dateStr}T${match[1]}`).getTime();
            if (!isNaN(t)) return t;
          }
        }

        // 3. Fallback id số lớn hơn (tạo sau) hoặc ngày cơ bản
        if (typeof r.id === "number") return r.id;
        const base = new Date(r.reportDate || r.createdAt || Date.now()).getTime();
        return isNaN(base) ? 0 : base;
      };

      const list = Array.from(allReportsMap.values()).sort(
        (a, b) => getReportTimestamp(b) - getReportTimestamp(a)
      );

      setReports(list);
    } catch (err) {
      console.error("Lỗi khi tải danh sách báo cáo:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCinemas = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/Cinemas`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await readResponse(res);
        const list = data?.$values || data || [];
        if (Array.isArray(list)) setCinemas(list);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchReports();
    fetchCinemas();

    // Auto refresh every 15 seconds to receive new staff reports live
    const interval = setInterval(() => {
      fetchReports();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Filter logic
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !selectedDate || r.reportDate?.startsWith(selectedDate);
    const matchesCinema = !selectedCinemaId || String(r.cinemaId) === String(selectedCinemaId);
    return matchesSearch && matchesDate && matchesCinema;
  });

  // Calculate Summary Metrics
  const totalRevenueSum = filteredReports.reduce((sum, r) => sum + r.totalRevenue, 0);
  const totalTicketsSum = filteredReports.reduce((sum, r) => sum + r.totalBookings, 0);
  const totalOrdersSum = filteredReports.reduce((sum, r) => sum + r.totalOrders, 0);

  const getCinemaName = (cinemaId) => {
    const found = cinemas.find(c => String(c.cinemaId || c.id) === String(cinemaId));
    return found ? (found.name || found.cinemaName) : `Chi nhánh #${cinemaId}`;
  };

  const formatReportTime = (item) => {
    // 1. Trích xuất từ summary ("- Giờ gửi báo cáo: HH:mm:ss")
    if (item.summary) {
      const match = item.summary.match(/Giờ gửi báo cáo:\s*([0-9:]+)/i);
      if (match && match[1]) return match[1];
    }

    // 2. Trích xuất từ createdAt / reportDate nếu có thông tin giờ
    const timeCandidate = item.createdAt || item.reportDate;
    if (timeCandidate && typeof timeCandidate === "string" && timeCandidate.includes("T")) {
      const timePart = timeCandidate.split("T")[1];
      if (timePart && !timePart.startsWith("00:00:00")) {
        return timePart.split(".")[0].split("Z")[0];
      }
    }

    return "";
  };

  return (
    <div className="bao-cao-container">
      {/* Page Header */}
      <div className="bc-header">
        <div className="bc-title-group">
          <h2>
            <MdAssignment style={{ color: "#ff3b30" }} /> Báo Cáo Doanh Thu Staff
          </h2>
        </div>
        <button
          onClick={fetchReports}
          className="bc-select"
          style={{ display: "flex", alignItems: "center", gap: 6, background: "#ff3b30", borderColor: "#ff3b30" }}
        >
          <MdRefresh className={loading ? "animate-spin" : ""} /> Tải Lại Dữ Liệu
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="bc-stats-grid">
        <div className="bc-stat-card">
          <div className="bc-stat-icon blue">
            <MdAssignment />
          </div>
          <div className="bc-stat-info">
            <h4>Tổng Số Báo Cáo</h4>
            <div className="bc-stat-value">{filteredReports.length} lượt</div>
          </div>
        </div>

        <div className="bc-stat-card">
          <div className="bc-stat-icon green">
            <MdAttachMoney />
          </div>
          <div className="bc-stat-info">
            <h4>Tổng Doanh Thu Báo Cáo</h4>
            <div className="bc-stat-value">{totalRevenueSum.toLocaleString("vi-VN")}đ</div>
          </div>
        </div>

        <div className="bc-stat-card">
          <div className="bc-stat-icon purple">
            <MdConfirmationNumber />
          </div>
          <div className="bc-stat-info">
            <h4>Tổng Vé Báo Cáo</h4>
            <div className="bc-stat-value">{totalTicketsSum.toLocaleString("vi-VN")} vé</div>
          </div>
        </div>

        <div className="bc-stat-card">
          <div className="bc-stat-icon orange">
            <MdFastfood />
          </div>
          <div className="bc-stat-info">
            <h4>Tổng Đơn Bắp Nước</h4>
            <div className="bc-stat-value">{totalOrdersSum.toLocaleString("vi-VN")} đơn</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bc-filter-bar">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <MdSearch style={{ color: "#9ca3af", fontSize: 18 }} />
          <input
            type="text"
            placeholder="Tìm nội dung báo cáo..."
            className="bc-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <input
          type="date"
          className="bc-select"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />

        <select
          className="bc-select"
          value={selectedCinemaId}
          onChange={(e) => setSelectedCinemaId(e.target.value)}
        >
          <option value="">Tất cả Chi Nhánh</option>
          {cinemas.map((c) => (
            <option key={c.cinemaId || c.id} value={c.cinemaId || c.id}>
              {c.name || c.cinemaName}
            </option>
          ))}
        </select>
      </div>

      {/* Reports List */}
      {loading && reports.length === 0 ? (
        <div className="bc-empty-state">
          <p>Đang tải danh sách báo cáo doanh thu...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bc-empty-state">
          <MdAssignment />
          <h3>Chưa có báo cáo nào</h3>
          <p>Khi nhân viên gửi báo cáo doanh thu cuối ca/cuối ngày, báo cáo sẽ xuất hiện ở đây.</p>
        </div>
      ) : (
        <div className="bc-reports-list">
          {filteredReports.map((item) => {
            const initials = item.staffName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            const displayTime = formatReportTime(item);

            return (
              <div key={item.id} className="bc-report-card">
                <div className="bc-report-header">
                  <div className="bc-staff-info">
                    <div className="bc-avatar">{initials}</div>
                    <div className="bc-staff-meta">
                      <h4>{item.staffName}</h4>
                      <p>
                        <MdStore style={{ verticalAlign: "middle", marginRight: 4 }} />
                        {getCinemaName(item.cinemaId)}
                      </p>
                    </div>
                  </div>

                  <div className="bc-report-time">
                    <span className="bc-date-badge">
                      {item.reportDate ? item.reportDate.split("T")[0] : "Báo cáo hôm nay"}
                    </span>
                    {displayTime && (
                      <span className="bc-time-text">
                        {displayTime}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bc-summary-text">{item.summary}</div>

                <div className="bc-metrics-row">
                  <div className="bc-metric">
                    <span className="bc-metric-label">Tổng Doanh Thu</span>
                    <span className="bc-metric-val">{item.totalRevenue.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="bc-metric">
                    <span className="bc-metric-label">Vé Bán Ra</span>
                    <span className="bc-metric-val" style={{ color: "#3b82f6" }}>
                      {item.totalBookings} vé
                    </span>
                  </div>
                  <div className="bc-metric">
                    <span className="bc-metric-label">Đơn Bắp Nước</span>
                    <span className="bc-metric-val" style={{ color: "#f59e0b" }}>
                      {item.totalOrders} đơn
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
