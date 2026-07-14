import "./Dashboard.css";
import { useDashboard } from "./Dashboard.js";
import {
  MdMovie, MdConfirmationNumber, MdTrendingUp,
  MdTheaters, MdEventSeat, MdBarChart,
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

export default function StaffDashboard() {
  const {
    stats, recentTickets, movieStats, cinemaStats,
    totalRevenue, totalTickets, loading, error, formatMoney,
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

