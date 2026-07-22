import "./QuanLyVe.css";
import { useQuanLyVe } from "./useQuanLyVe";
import { 
  MdConfirmationNumber, 
  MdSearch, 
  MdFilterList, 
  MdExpandMore, 
  MdExpandLess, 
  MdLocalMovies,
  MdDateRange
} from "react-icons/md";
import { useState } from "react";

function formatDateTime(rawDate) {
  if (!rawDate) return "Chưa rõ";
  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return "Chưa rõ";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${min}:${ss} ${dd}/${mm}/${yyyy}`;
}

function getCustomerDisplayName(t) {
  const name = t.customerName || "";
  const isCounter =
    t.bookingType === "Staff" ||
    name === "Cơ Sở 2" ||
    name === "Hệ Thống Admin" ||
    name === "Khách vãng lai" ||
    name === "Đồng Khởi" ||
    name.toLowerCase().includes("đồng khởi") ||
    name.toLowerCase().includes("cinemahcm") ||
    !name;

  return isCounter ? "Khách mua tại quầy" : name;
}

export default function StaffQuanLyVe() {
  const {
    loading,
    error,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterDate,
    setFilterDate,
    filtered,
    STATUS_OPTIONS,
    fetchData,
  } = useQuanLyVe();

  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Group tickets by movie
  const groupedTickets = filtered.reduce((acc, t) => {
    const movie = t.movieTitle || "Phim Khác";
    if (!acc[movie]) {
      acc[movie] = [];
    }
    acc[movie].push(t);
    return acc;
  }, {});

  const groupedEntries = Object.entries(groupedTickets);

  return (
    <div className="staff-quanlyve-container">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
          <MdConfirmationNumber className="text-green-600" /> Quản Lý Vé
        </h4>
        <button 
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
        >
          {loading ? "Đang tải..." : "🔄 Tải lại danh sách"}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
              <MdDateRange className="text-lg" />
            </span>
            <input
              type="date"
              className="border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50/50 transition-all duration-200 min-w-[160px]"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[280px] relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <MdSearch className="text-lg" />
            </span>
            <input
              type="text"
              placeholder="Tìm theo mã vé..."
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50/50 transition-all duration-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
              <MdFilterList className="text-lg" />
            </span>
            <select
              className="border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50/50 transition-all duration-200 min-w-[180px]"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent text-green-600 rounded-full mr-2"></span>
            Đang tải dữ liệu...
          </div>
        )}

        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {groupedEntries.length === 0 ? (
              <div className="text-center py-10 text-gray-400 bg-gray-50/50 rounded-xl border border-gray-100">
                Không tìm thấy vé nào trong ngày này
              </div>
            ) : (
              groupedEntries.map(([movie, tickets]) => (
                <div key={movie} className="rounded-xl border border-gray-100 overflow-hidden bg-white shadow-sm">
                  <button 
                    onClick={() => toggleGroup(movie)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-green-50/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <MdLocalMovies className="text-xl" />
                      </div>
                      <div>
                        <h5 className="font-bold text-gray-800 text-lg">{movie}</h5>
                        <p className="text-sm text-gray-500 font-medium">Đang bán: <strong className="text-green-600">{tickets.length} vé</strong></p>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      {expandedGroups[movie] ? <MdExpandLess className="text-2xl" /> : <MdExpandMore className="text-2xl" />}
                    </div>
                  </button>
                  
                  {expandedGroups[movie] && (
                    <div className="overflow-x-auto border-t border-gray-100">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-white border-b border-gray-100 text-gray-600 font-semibold">
                            <th className="px-4 py-3 text-left">#</th>
                            <th className="px-4 py-3 text-left">Mã Vé</th>
                            <th className="px-4 py-3 text-left">Khách Hàng</th>
                            <th className="px-4 py-3 text-left">Ghế</th>
                            <th className="px-4 py-3 text-left">Giá Vé</th>
                            <th className="px-4 py-3 text-left">Trạng Thái</th>
                            <th className="px-4 py-3 text-left">Thời Gian Mua</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {tickets.map((t, i) => (
                            <tr key={t.id || t.ticketId} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-3.5 text-gray-500 font-medium">{i + 1}</td>
                              <td className="px-4 py-3.5 font-semibold text-gray-800">
                                {t.code || t.ticketCode || `VE${t.id}`}
                              </td>
                              <td className="px-4 py-3.5 text-gray-600">{getCustomerDisplayName(t)}</td>
                              <td className="px-4 py-3.5">
                                <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-mono text-xs font-semibold">
                                  {t.seatCode}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 font-bold text-gray-800">
                                {(t.price || t.amount || 0).toLocaleString("vi-VN")} đ
                              </td>
                              <td className="px-4 py-3.5">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    t.status === "Đã thanh toán" || t.status === "Used"
                                      ? "bg-green-50 text-green-700 border border-green-150"
                                      : t.status === "Đã đặt" || t.status === "Active"
                                      ? "bg-yellow-50 text-yellow-750 border border-yellow-150"
                                      : "bg-red-50 text-red-700 border border-red-150"
                                  }`}
                                >
                                  {t.status === "Used" ? "Đã sử dụng" : t.status === "Active" ? "Đang hoạt động" : t.status}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-gray-600">
                                {formatDateTime(t.issuedAt || t.IssuedAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
