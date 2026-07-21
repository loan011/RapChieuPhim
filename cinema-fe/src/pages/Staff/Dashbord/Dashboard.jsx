import "./Dashboard.css";
import { useDashboard } from "./useDashboard";
import { MdMovie, MdConfirmationNumber, MdTrendingUp, MdPeople } from "react-icons/md";

export default function StaffDashboard() {
  const { stats, recentTickets, loading, error, formatMoney } = useDashboard();

  const cards = [
    { key: "totalMovies", label: "Tổng Phim", value: stats.totalMovies, Icon: MdMovie, color: "bg-emerald-500" },
    { key: "totalUsers", label: "Người Dùng", value: stats.totalUsers, Icon: MdPeople, color: "bg-teal-500" },
    { key: "totalTickets", label: "Vé Đã Bán", value: stats.totalTickets, Icon: MdConfirmationNumber, color: "bg-amber-500" },
    { key: "revenue", label: "Doanh Thu (VND)", value: formatMoney(stats.revenue), Icon: MdTrendingUp, color: "bg-cyan-500" },
  ];

  return (
    <div className="staff-dashboard-container">
      <div className="mb-6 p-5 bg-white rounded-2xl shadow-sm border border-gray-150/80">
        <h4 className="font-bold text-xl text-gray-805 mb-1">👋 Xin chào Nhân viên!</h4>
        <p className="text-gray-500 text-sm">Chào mừng bạn quay trở lại. Hãy hỗ trợ khách hàng mua vé và dịch vụ một cách tốt nhất!</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((card) => {
          const Icon = card.Icon;
          return (
            <div key={card.key} className={`${card.color} text-white rounded-2xl p-5 flex items-center justify-between shadow-sm`}>
              <div>
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="text-sm opacity-90 font-medium">{card.label}</div>
              </div>
              <div className="text-4xl opacity-75">
                <Icon />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-150/80 p-5">
        <h5 className="font-semibold text-gray-700 mb-4 text-base">Giao Dịch Gần Đây</h5>
        {loading && <p className="text-gray-500 text-sm">Đang tải dữ liệu...</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {!loading && !error && recentTickets.length === 0 && <p className="text-gray-400 text-sm">Chưa có giao dịch nào.</p>}
        {!loading && !error && recentTickets.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50/75 border-b border-gray-100 text-gray-600 font-semibold">
                <tr>
                  {["#", "Tên Phim", "Khách Hàng", "Ghế", "Tên Rạp", "Giá Vé", "Ngày Đặt"].map((header) => (
                    <th key={header} className="px-4 py-3 text-left">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTickets.slice(0, 10).map((ticket, index) => (
                  <tr key={ticket.id || index} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{ticket.movieName}</td>
                    <td className="px-4 py-3 text-gray-600">{ticket.customerName}</td>
                    <td className="px-4 py-3"><span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-mono text-xs font-semibold">{ticket.seat}</span></td>
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
