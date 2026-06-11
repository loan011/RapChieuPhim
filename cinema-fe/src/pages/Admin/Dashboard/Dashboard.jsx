import "./Dashboard.css";
import { useEffect, useState } from "react";
import { MdMovie, MdPeople, MdConfirmationNumber, MdTrendingUp } from "react-icons/md";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalMovies: 0,
    totalUsers: 0,
    totalTickets: 0,
    revenue: 0,
  });

  useEffect(() => {
    // TODO: Gắn API thống kê dashboard
    // Ví dụ: const data = await getDashboardStats();
    // setStats(data);
  }, []);

  const cards = [
    { label: "Tổng Phim",    value: stats.totalMovies,  icon: <MdMovie />,              color: "bg-blue-500" },
    { label: "Người Dùng",   value: stats.totalUsers,   icon: <MdPeople />,             color: "bg-green-500" },
    { label: "Vé Đã Bán",    value: stats.totalTickets, icon: <MdConfirmationNumber />, color: "bg-orange-500" },
    { label: "Doanh Thu (VND)", value: stats.revenue.toLocaleString("vi-VN"), icon: <MdTrendingUp />, color: "bg-purple-500" },
  ];

  return (
    <div>
      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
        <h4 className="font-bold text-lg mb-1">👋 Xin chào Admin!</h4>
        <p className="text-gray-500 text-sm">
          Chào mừng bạn đến với hệ thống quản lý rạp chiếu phim T&M.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className={`${c.color} text-white rounded-lg p-4 flex items-center justify-between shadow`}>
            <div>
              <div className="text-2xl font-bold">{c.value}</div>
              <div className="text-sm opacity-90">{c.label}</div>
            </div>
            <div className="text-4xl opacity-70">{c.icon}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <h5 className="font-semibold text-gray-700 mb-3">Vé Đặt Gần Đây</h5>
        {/* TODO: Gắn API lấy vé gần đây */}
        <p className="text-gray-400 text-sm">Chưa có dữ liệu.</p>
      </div>
    </div>
  );
}
