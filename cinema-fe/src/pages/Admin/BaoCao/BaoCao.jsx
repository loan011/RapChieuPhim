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
  const [selectedShift, setSelectedShift] = useState(""); // "" (Tất cả), "Ca 1", "Ca 2"

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

      // Combine and deduplicate strictly by content signature
      const allReportsList = [];
      const seenSignatures = new Set();

      const extractSendTime = (summaryStr) => {
        if (!summaryStr) return "";
        const match = summaryStr.match(/Giờ gửi báo cáo:\s*([0-9:]+)/i) || summaryStr.match(/Giờ gửi:\s*([0-9:]+)/i);
        return match ? match[1] : "";
      };

      const resolveShiftTag = (shiftName, summary) => {
        if (shiftName && shiftName.trim()) return shiftName.trim();
        const s = summary || "";
        if (s.includes("Cả ngày") || s.includes("[CẢ NGÀY]") || s.includes("Full Day")) return "Cả ngày (Full Day)";
        if (s.includes("Ca 1") || s.includes("[CA 1]")) return "Ca 1 (08:00 - 16:00)";
        if (s.includes("Ca 2") || s.includes("[CA 2]")) return "Ca 2 (16:00 - 24:00)";
        return "Báo cáo doanh thu";
      };

      const processReport = (r, isFromLocal = false, idx = 0) => {
        const reportDate = (r.reportDate || r.ReportDate || r.date || "").split('T')[0];
        const summary = r.summary || r.Summary || "";
        const shiftName = resolveShiftTag(r.shiftName || r.ShiftName, summary);
        const totalRevenue = Math.round(Number(r.totalRevenue || r.TotalRevenue || 0));
        const sendTime = r.sendTime || extractSendTime(summary);
        const staffName = (r.staff?.fullName || r.staff?.FullName || r.staffName || r.sender || "Nhân viên T&M").trim();

        // Unique signature for detecting duplicate submission entries
        const signature = `${reportDate}_${shiftName}_${totalRevenue}_${sendTime}`;

        if (seenSignatures.has(signature)) {
          return; // Skip duplicate!
        }
        seenSignatures.add(signature);

        allReportsList.push({
          id: r.reportId || r.ReportId || (isFromLocal ? `local_${idx}` : Math.random()),
          staffName: staffName,
          staffEmail: r.staff?.email || r.staff?.Email || "",
          cinemaId: r.cinemaId || r.staff?.cinemaId || 1,
          reportDate: reportDate,
          shiftName: shiftName,
          summary: summary,
          totalRevenue: totalRevenue,
          totalBookings: Number(r.totalBookings || r.TotalBookings || 0),
          totalOrders: Number(r.totalOrders || r.TotalOrders || 0),
          initialCash: Number(r.initialCash || r.InitialCash || 0),
          actualCash: Number(r.actualCash || r.ActualCash || 0),
          cashDifference: Number(r.cashDifference || r.CashDifference || 0),
          createdAt: r.createdAt || r.CreatedAt || reportDate
        });
      };

      apiReports.forEach(r => processReport(r, false));
      localReports.forEach((r, idx) => processReport(r, true, idx));

      const getReportTimestamp = (r) => {
        const candidates = [r.createdAt, r.reportDate];
        for (const c of candidates) {
          if (c && typeof c === "string" && c.includes("T") && !c.includes("T00:00:00")) {
            const t = new Date(c).getTime();
            if (!isNaN(t)) return t;
          }
        }
        if (r.summary) {
          const match = r.summary.match(/Giờ gửi báo cáo:\s*([0-9:]+)/i);
          if (match && match[1]) {
            const dateStr = (r.reportDate || new Date().toISOString().split("T")[0]).split("T")[0];
            const t = new Date(`${dateStr}T${match[1]}`).getTime();
            if (!isNaN(t)) return t;
          }
        }
        if (typeof r.id === "number") return r.id;
        const base = new Date(r.reportDate || r.createdAt || Date.now()).getTime();
        return isNaN(base) ? 0 : base;
      };

      const list = allReportsList.sort(
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

    const interval = setInterval(() => {
      fetchReports();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Detect shift from report record
  const getShiftLabel = (item) => {
    if (item.shiftName) return item.shiftName;
    if (item.summary.includes("Cả ngày") || item.summary.includes("[CẢ NGÀY]") || item.summary.includes("Full Day")) return "Cả ngày (Full Day)";
    if (item.summary.includes("Ca 1") || item.summary.includes("[CA 1]")) return "Ca 1 (08:00 - 16:00)";
    if (item.summary.includes("Ca 2") || item.summary.includes("[CA 2]")) return "Ca 2 (16:00 - 24:00)";
    return "Báo cáo doanh thu";
  };

  // Filter logic
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !selectedDate || r.reportDate?.startsWith(selectedDate);
    const matchesCinema = !selectedCinemaId || String(r.cinemaId) === String(selectedCinemaId);
    
    const shiftLabel = getShiftLabel(r);
    const matchesShift = !selectedShift || shiftLabel.toLowerCase().includes(selectedShift.toLowerCase());

    return matchesSearch && matchesDate && matchesCinema && matchesShift;
  });

  // Calculate Summary Metrics
  const totalRevenueSum = filteredReports.reduce((sum, r) => sum + r.totalRevenue, 0);
  const totalTicketsSum = filteredReports.reduce((sum, r) => sum + r.totalBookings, 0);
  const totalOrdersSum = filteredReports.reduce((sum, r) => sum + r.totalOrders, 0);

  const ca1Reports = filteredReports.filter(r => getShiftLabel(r).includes("Ca 1"));
  const ca2Reports = filteredReports.filter(r => getShiftLabel(r).includes("Ca 2"));
  const ca1Revenue = ca1Reports.reduce((sum, r) => sum + r.totalRevenue, 0);
  const ca2Revenue = ca2Reports.reduce((sum, r) => sum + r.totalRevenue, 0);

  const getCinemaName = (cinemaId) => {
    const found = cinemas.find(c => String(c.cinemaId || c.id) === String(cinemaId));
    return found ? (found.name || found.cinemaName) : `Chi nhánh #${cinemaId}`;
  };

  const formatReportTime = (item) => {
    if (item.summary) {
      const match = item.summary.match(/Giờ gửi báo cáo:\s*([0-9:]+)/i);
      if (match && match[1]) return match[1];
    }
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
            <MdAssignment style={{ color: "#10b981" }} /> Quản Lý Báo Cáo Kết Ca Staff
          </h2>
        </div>
        <button
          onClick={fetchReports}
          className="bc-select"
          style={{ display: "flex", alignItems: "center", gap: 6, background: "#10b981", borderColor: "#10b981", color: "#fff", fontWeight: "bold" }}
        >
          <MdRefresh className={loading ? "animate-spin" : ""} /> Tải Lại Dữ Liệu
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="bc-stats-grid">
        <div className="bc-stat-card" style={{ borderColor: "#10b981", background: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(22,22,26,1) 100%)" }}>
          <div className="bc-stat-icon green">
            <MdAttachMoney />
          </div>
          <div className="bc-stat-info">
            <h4 style={{ color: "#10b981", fontWeight: "700" }}>Tổng Doanh Thu Ngày (Staff Gửi)</h4>
            <div className="bc-stat-value" style={{ color: "#34d399" }}>{totalRevenueSum.toLocaleString("vi-VN")}đ</div>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>Tổng cộng từ tất cả ca báo cáo</span>
          </div>
        </div>

        <div className="bc-stat-card">
          <div className="bc-stat-icon green">
            <MdAttachMoney />
          </div>
          <div className="bc-stat-info">
            <h4>Doanh Thu Ca 1 (08h-16h)</h4>
            <div className="bc-stat-value">{ca1Revenue.toLocaleString("vi-VN")}đ</div>
            <span style={{ fontSize: 11, color: "#6b7280" }}>{ca1Reports.length} lượt kết ca</span>
          </div>
        </div>

        <div className="bc-stat-card">
          <div className="bc-stat-icon purple">
            <MdAttachMoney />
          </div>
          <div className="bc-stat-info">
            <h4>Doanh Thu Ca 2 (16h-24h)</h4>
            <div className="bc-stat-value">{ca2Revenue.toLocaleString("vi-VN")}đ</div>
            <span style={{ fontSize: 11, color: "#6b7280" }}>{ca2Reports.length} lượt kết ca</span>
          </div>
        </div>

        <div className="bc-stat-card">
          <div className="bc-stat-icon blue">
            <MdAssignment />
          </div>
          <div className="bc-stat-info">
            <h4>Tổng Số Ca Báo Cáo</h4>
            <div className="bc-stat-value">{filteredReports.length} ca</div>
          </div>
        </div>

        <div className="bc-stat-card">
          <div className="bc-stat-icon orange">
            <MdConfirmationNumber />
          </div>
          <div className="bc-stat-info">
            <h4>Tổng Vé Báo Cáo</h4>
            <div className="bc-stat-value">{totalTicketsSum.toLocaleString("vi-VN")} vé</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bc-filter-bar">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <MdSearch style={{ color: "#9ca3af", fontSize: 18 }} />
          <input
            type="text"
            placeholder="Tìm theo tên nhân viên, nội dung báo cáo..."
            className="bc-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Lọc Ca làm việc */}
        <select
          className="bc-select"
          value={selectedShift}
          onChange={(e) => setSelectedShift(e.target.value)}
          style={{ fontWeight: "600", borderColor: selectedShift ? "#10b981" : "#e5e7eb" }}
        >
          <option value="">Tất cả Báo cáo / Ca</option>
          <option value="Ca 1">Ca 1 (08:00 - 16:00)</option>
          <option value="Ca 2">Ca 2 (16:00 - 24:00)</option>
          <option value="Cả ngày">Cả ngày (08:00 - 24:00)</option>
        </select>

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
          <p>Đang tải danh sách báo cáo doanh thu kết ca...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bc-empty-state">
          <MdAssignment />
          <h3>Chưa có báo cáo kết ca nào</h3>
          <p>Khi nhân viên gửi báo cáo doanh thu kết ca (Ca 1 / Ca 2), báo cáo sẽ xuất hiện ở đây.</p>
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
            const shiftTag = getShiftLabel(item);
            const isFullDay = shiftTag.includes("Cả ngày") || shiftTag.includes("Full Day");
            const isCa1 = shiftTag.includes("Ca 1");

            // Extract cash diff if available in summary (only for shift reports, hide for Full Day)
            let diffTag = null;
            if (!isFullDay && item.summary && item.summary.includes("Chênh lệch:")) {
              const match = item.summary.match(/Chênh lệch:\s*([^\n]+)/);
              if (match) {
                const diffStr = match[1];
                const isKhop = diffStr.includes("Khớp") || diffStr.includes("0đ");
                const isDu = diffStr.includes("Dư") || diffStr.includes("+");
                diffTag = (
                  <span
                    style={{
                      background: isKhop ? "rgba(16, 185, 129, 0.25)" : isDu ? "rgba(245, 158, 11, 0.25)" : "rgba(239, 68, 68, 0.25)",
                      color: isKhop ? "#6ee7b7" : isDu ? "#fde047" : "#fca5a5",
                      border: isKhop ? "1px solid rgba(52, 211, 153, 0.5)" : isDu ? "1px solid rgba(251, 191, 36, 0.5)" : "1px solid rgba(248, 113, 113, 0.5)",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "700"
                    }}
                  >
                    {diffStr}
                  </span>
                );
              }
            }

            // Filter out cash audit line for Full Day reports & fix typo
            let displaySummary = item.summary;
            if (displaySummary) {
              displaySummary = displaySummary.replaceAll("Đần ca:", "Đầu ca:");
              if (isFullDay) {
                displaySummary = displaySummary
                  .split("\n")
                  .filter(line => !line.includes("Kiểm kê két tiền:"))
                  .join("\n");
              }
            }

            return (
              <div key={item.id} className="bc-report-card" style={{ borderLeft: isFullDay ? "4px solid #a855f7" : (isCa1 ? "4px solid #10b981" : "4px solid #3b82f6") }}>
                <div className="bc-report-header">
                  <div className="bc-staff-info">
                    <div className="bc-avatar" style={{ backgroundColor: isFullDay ? "#7e22ce" : (isCa1 ? "#059669" : "#2563eb") }}>{initials}</div>
                    <div className="bc-staff-meta">
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h4 style={{ margin: 0 }}>{item.staffName}</h4>
                        <span
                          style={{
                            background: isFullDay ? "rgba(147, 51, 234, 0.25)" : (isCa1 ? "rgba(16, 185, 129, 0.25)" : "rgba(59, 130, 246, 0.25)"),
                            color: isFullDay ? "#e9d5ff" : (isCa1 ? "#a7f3d0" : "#bfdbfe"),
                            border: isFullDay ? "1px solid rgba(168, 85, 247, 0.5)" : (isCa1 ? "1px solid rgba(52, 211, 153, 0.5)" : "1px solid rgba(96, 165, 250, 0.5)"),
                            padding: "3px 10px",
                            borderRadius: "9999px",
                            fontSize: "11px",
                            fontWeight: "700"
                          }}
                        >
                          {shiftTag}
                        </span>
                      </div>
                      <p>
                        <MdStore style={{ verticalAlign: "middle", marginRight: 4 }} />
                        {getCinemaName(item.cinemaId)}
                      </p>
                    </div>
                  </div>

                  <div className="bc-report-time" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span className="bc-date-badge">
                        {item.reportDate ? item.reportDate.split("T")[0] : "Báo cáo hôm nay"}
                      </span>
                      {displayTime && (
                        <span className="bc-time-text">
                          {displayTime}
                        </span>
                      )}
                    </div>
                    {diffTag}
                  </div>
                </div>

                <div className="bc-summary-text" style={{ whiteSpace: "pre-line", fontFamily: "inherit" }}>
                  {displaySummary}
                </div>

                <div className="bc-metrics-row">
                  <div className="bc-metric">
                    <span className="bc-metric-label">Tổng Doanh Thu Ca</span>
                    <span className="bc-metric-val" style={{ color: "#059669" }}>{item.totalRevenue.toLocaleString("vi-VN")}đ</span>
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
