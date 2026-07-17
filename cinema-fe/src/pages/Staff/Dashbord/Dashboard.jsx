import "./Dashboard.css";
import { useDashboard } from "./Dashboard.js";
import {
  MdMovie, MdConfirmationNumber, MdTrendingUp,
  MdTheaters, MdEventSeat, MdBarChart, MdDateRange,
} from "react-icons/md";

const MOVIE_COLORS = [
  "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-blue-500",
  "bg-indigo-500", "bg-violet-500", "bg-fuchsia-500", "bg-rose-500",
  "bg-orange-500", "bg-amber-500",
];

function ProgressBar({ percent, colorClass = "bg-emerald-500" }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className={`${colorClass} h-2 rounded-full transition-all duration-700`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}

const CHART_H = 120;

function DailyRevenueChart({ data, selectedDate, onSelectDate, formatMoney }) {
  const max = Math.max(...data.map(d => d.revenue), 1);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-1" style={{ minWidth: `${data.length * 32}px` }}>
        {data.map((d) => {
          const barH = d.revenue > 0 ? Math.max((d.revenue / max) * CHART_H, 4) : 2;
          const isSelected = d.date === selectedDate;
          return (
            <div
              key={d.date}
              className="flex-1 flex flex-col items-center min-w-[28px] cursor-pointer"
              onClick={() => onSelectDate(d.date)}
            >
              <div className="relative w-full flex justify-center" style={{ height: `${CHART_H}px` }}>
                <div className="w-full flex items-end h-full group">
                  <div
                    className={`relative w-full rounded-t-sm transition-all duration-300 ${
                      isSelected
                        ? "bg-amber-400 hover:bg-amber-300"
                        : d.revenue > 0
                        ? "bg-emerald-500 hover:bg-emerald-400"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                    style={{ height: `${barH}px`, outline: isSelected ? "2px solid #fbbf24" : "none", outlineOffset: "2px" }}
                  >
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1.5 whitespace-nowrap z-20 shadow-lg text-center">
                      <div className="font-semibold">{d.date}</div>
                      <div>{formatMoney(d.revenue)} đ</div>
                      <div>{d.tickets} vé</div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                    </div>
                  </div>
                </div>
              </div>
              <div
                style={{ fontSize: "9px", color: isSelected ? "#d97706" : "#9ca3af" }}
                className="mt-1 text-center font-medium"
              >
                {d.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StaffDashboard() {
  const {
    stats, recentTickets, movieStats, cinemaStats,
    totalRevenue, totalTickets,
    dailyRevenue, selectedDate, setSelectedDate, selectedDayData,
    loading, error, formatMoney,
  } = useDashboard();

  const cards = [
    { key: "totalMovies",  label: "Tổng Phim",       value: stats.totalMovies,           Icon: MdMovie,              color: "bg-emerald-500" },
    { key: "totalTickets", label: "Vé Đã Bán",        value: stats.totalTickets,          Icon: MdConfirmationNumber, color: "bg-amber-500"   },
    { key: "revenue",      label: "Doanh Thu (VND)",  value: formatMoney(stats.revenue),  Icon: MdTrendingUp,         color: "bg-cyan-500"    },
  ];

  return (
    <div className="staff-dashboard-container">
      {/* Welcome */}
      <div className="mb-6 p-5 bg-white rounded-2xl shadow-sm border border-gray-150/80">
        <h4 className="font-bold text-xl text-gray-805 mb-1">👋 Xin chào Nhân viên!</h4>
        <p className="text-gray-500 text-sm">Chào mừng bạn quay trở lại. Hãy hỗ trợ khách hàng mua vé và dịch vụ một cách tốt nhất!</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(({ key, label, value, Icon, color }) => (
          <div key={key} className={`${color} text-white rounded-2xl p-5 flex items-center justify-between shadow-sm`}>
            <div>
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-sm opacity-90 font-medium">{label}</div>
            </div>
            <div className="text-4xl opacity-75"><Icon /></div>
          </div>
        ))}
      </div>

      {loading && <p className="text-gray-500 text-sm mb-4">Đang tải dữ liệu...</p>}
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {/* Daily Revenue Report */}
      {!loading && (() => {
        const todayStr = new Date().toISOString().split("T")[0];
        const isToday = selectedDate === todayStr;

        const prevDay = () => {
          const d = new Date(selectedDate);
          d.setDate(d.getDate() - 1);
          setSelectedDate(d.toISOString().split("T")[0]);
        };
        const nextDay = () => {
          if (isToday) return;
          const d = new Date(selectedDate);
          d.setDate(d.getDate() + 1);
          const next = d.toISOString().split("T")[0];
          if (next <= todayStr) setSelectedDate(next);
        };

        const idx = dailyRevenue.findIndex(d => d.date === selectedDate);
        const chartData = idx >= 0
          ? dailyRevenue.slice(Math.max(0, idx - 13), idx + 1)
          : dailyRevenue.slice(-14);

        const dd = selectedDate.slice(8, 10);
        const mm = selectedDate.slice(5, 7);
        const yyyy = selectedDate.slice(0, 4);
        const dayMovies = selectedDayData.movies || [];

        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-150/80 p-5 mb-6">
            {/* Header + navigation */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h5 className="font-semibold text-gray-700 text-base flex items-center gap-2">
                <MdDateRange className="text-emerald-600 text-xl" /> Doanh Thu Theo Ngày
              </h5>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevDay}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-lg font-bold transition-colors"
                >‹</button>
                <input
                  type="date"
                  value={selectedDate}
                  max={todayStr}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 font-medium focus:outline-none focus:border-emerald-400"
                />
                <button
                  onClick={nextDay}
                  disabled={isToday}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg font-bold transition-colors ${
                    isToday ? "bg-gray-50 text-gray-300 cursor-not-allowed" : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                  }`}
                >›</button>
              </div>
            </div>

            {/* Day stats */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-emerald-50 rounded-xl p-4">
                <div className="text-xs text-emerald-600 font-medium mb-1">Doanh Thu Ngày {dd}/{mm}/{yyyy}</div>
                <div className="text-2xl font-bold text-emerald-700">
                  {selectedDayData.revenue > 0 ? `${formatMoney(selectedDayData.revenue)} đ` : "—"}
                </div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4">
                <div className="text-xs text-amber-600 font-medium mb-1">Vé Bán Ra</div>
                <div className="text-2xl font-bold text-amber-700">
                  {selectedDayData.tickets > 0 ? `${selectedDayData.tickets} vé` : "—"}
                </div>
              </div>
            </div>

            {/* Movie breakdown */}
            {dayMovies.length > 0 ? (
              <div className="mb-5">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Theo Phìm</p>
                <div className="space-y-2">
                  {dayMovies.map((m, i) => {
                    const pct = selectedDayData.revenue > 0 ? Math.round((m.revenue / selectedDayData.revenue) * 100) : 0;
                    const color = MOVIE_COLORS[i % MOVIE_COLORS.length];
                    return (
                      <div key={m.name}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700 truncate max-w-[200px]">{m.name}</span>
                          <div className="flex items-center gap-3 shrink-0 ml-3">
                            <span className="text-gray-500 text-xs">{m.tickets} vé</span>
                            <span className="font-bold text-gray-700">{formatMoney(m.revenue)} đ</span>
                            <span className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{pct}%</span>
                          </div>
                        </div>
                        <ProgressBar percent={pct} colorClass={color} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm mb-5">Không có vé bán trong ngày này.</p>
            )}

            {/* Mini chart - 14 days context */}
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">14 Ngày Gần Đây</p>
              {chartData.length > 0 && (
                <DailyRevenueChart
                  data={chartData}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  formatMoney={formatMoney}
                />
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" /> Có doanh thu
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm bg-amber-400" /> Đang chọn
                </span>
                <span className="text-gray-300 italic">Click cột để chọn ngày</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Movie revenue stats */}
      {!loading && movieStats.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-150/80 p-5 mb-6">
          <h5 className="font-semibold text-gray-700 mb-1 text-base flex items-center gap-2">
            <MdBarChart className="text-emerald-600 text-xl" /> Thống Kê Doanh Thu Theo Phim
          </h5>
          <p className="text-xs text-gray-400 mb-4">
            Tổng doanh thu: <span className="font-bold text-emerald-700">{formatMoney(totalRevenue)} đ</span>
            &nbsp;·&nbsp; Tổng vé: <span className="font-bold text-amber-600">{totalTickets}</span>
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                  <th className="pb-2 text-left font-semibold w-6">#</th>
                  <th className="pb-2 text-left font-semibold">Tên Phim</th>
                  <th className="pb-2 text-right font-semibold pr-3 whitespace-nowrap">Doanh Thu</th>
                  <th className="pb-2 text-center font-semibold w-16">% DT</th>
                  <th className="pb-2 text-center font-semibold w-40">Biểu Đồ DT</th>
                  <th className="pb-2 text-right font-semibold pr-3">Số Vé</th>
                  <th className="pb-2 text-center font-semibold w-16">% Vé</th>
                  <th className="pb-2 text-center font-semibold w-40">Biểu Đồ Vé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {movieStats.map((m, i) => {
                  const color = MOVIE_COLORS[i % MOVIE_COLORS.length];
                  return (
                    <tr key={m.name} className="hover:bg-gray-50/50">
                      <td className="py-3 text-gray-400 text-xs">{i + 1}</td>
                      <td className="py-3 font-medium text-gray-800 max-w-[180px] truncate">{m.name}</td>
                      <td className="py-3 text-right pr-3 font-semibold text-gray-700 whitespace-nowrap">
                        {formatMoney(m.revenue)} đ
                      </td>
                      <td className="py-3 text-center">
                        <span className="inline-block bg-emerald-50 text-emerald-700 font-bold text-xs px-2 py-0.5 rounded-full">
                          {m.revenuePercent}%
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <ProgressBar percent={m.revenuePercent} colorClass={color} />
                      </td>
                      <td className="py-3 text-right pr-3 text-gray-700 font-semibold">{m.tickets}</td>
                      <td className="py-3 text-center">
                        <span className="inline-block bg-amber-50 text-amber-700 font-bold text-xs px-2 py-0.5 rounded-full">
                          {m.ticketPercent}%
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <ProgressBar percent={m.ticketPercent} colorClass="bg-amber-400" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cinema ticket stats */}
      {!loading && cinemaStats.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-150/80 p-5 mb-6">
          <h5 className="font-semibold text-gray-700 mb-4 text-base flex items-center gap-2">
            <MdTheaters className="text-teal-600 text-xl" /> Thống Kê Vé Theo Rạp
          </h5>
          <div className="space-y-4">
            {cinemaStats.map((c, i) => {
              const color = MOVIE_COLORS[i % MOVIE_COLORS.length];
              return (
                <div key={c.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 truncate max-w-xs">{c.name}</span>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-xs text-gray-500">
                        <MdEventSeat className="inline mr-0.5 text-gray-400" />{c.tickets} vé
                      </span>
                      <span className="text-xs font-bold text-gray-700">{formatMoney(c.revenue)} đ</span>
                      <span className={`inline-block text-white font-bold text-xs px-2 py-0.5 rounded-full ${color}`}>
                        {c.ticketPercent}%
                      </span>
                    </div>
                  </div>
                  <ProgressBar percent={c.ticketPercent} colorClass={color} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-150/80 p-5">
        <h5 className="font-semibold text-gray-700 mb-4 text-base">Giao Dịch Gần Đây</h5>
        {!loading && !error && recentTickets.length === 0 && (
          <p className="text-gray-400 text-sm">Chưa có giao dịch nào.</p>
        )}
        {!loading && !error && recentTickets.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50/75 border-b border-gray-100 text-gray-600 font-semibold">
                <tr>
                  {["#", "Tên Phim", "Khách Hàng", "Ghế", "Tên Rạp", "Giá Vé", "Ngày Đặt"].map(h => (
                    <th key={h} className="px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTickets.slice(0, 10).map((ticket, index) => (
                  <tr key={ticket.id || index} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{ticket.movieName}</td>
                    <td className="px-4 py-3 text-gray-600">{ticket.customerName}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-mono text-xs font-semibold">
                        {ticket.seat}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{ticket.cinemaName}</td>
                    <td className="px-4 py-3 font-bold text-gray-850">{ticket.price}</td>
                    <td className="px-4 py-3 text-gray-500">{ticket.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

