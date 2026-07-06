import "./Bill.css";
import { STATUS_OPTIONS, useBill } from "./useBill.js";

export default function HoaDon() {
  const {
    loading,
    error,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filtered,
    handleStatusChange,
  } = useBill();

  return (
    <div className="p-1">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-2xl text-gray-800">Quản Lý Hóa Đơn</h4>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex-1 min-w-[280px] relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm theo mã hóa đơn, tên khách hàng..."
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all duration-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all duration-200 min-w-[180px]"
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

        {loading && (
          <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent text-blue-600 rounded-full mr-2"></span>
            Đang tải dữ liệu...
          </div>
        )}
        
        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-600 font-semibold">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Mã HĐ</th>
                  <th className="px-4 py-3 text-left">Khách Hàng</th>
                  <th className="px-4 py-3 text-left">Tổng Tiền</th>
                  <th className="px-4 py-3 text-left">Ngày Tạo</th>
                  <th className="px-4 py-3 text-left">Trạng Trạng Thái</th>
                  <th className="px-4 py-3 text-left">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400">
                      Không tìm thấy hóa đơn nào
                    </td>
                  </tr>
                ) : (
                  filtered.map((h, i) => (
                    <tr key={h.id || h.invoiceId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5 text-gray-500 font-medium">{i + 1}</td>
                      <td className="px-4 py-3.5 font-semibold text-gray-800">{h.code || h.invoiceCode || `HD${h.id}`}</td>
                      <td className="px-4 py-3.5 text-gray-600">{h.customerName || h.fullName || h.userEmail || "Khách vãng lai"}</td>
                      <td className="px-4 py-3.5 font-bold text-gray-800">
                        {(h.totalAmount || h.totalPrice || 0).toLocaleString("vi-VN")} đ
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">{h.createdAt ? String(h.createdAt).split("T")[0] : "Chưa rõ"}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            h.status === "Đã thanh toán"
                              ? "bg-green-50 text-green-700 border border-green-150"
                              : h.status === "Chờ thanh toán"
                              ? "bg-yellow-50 text-yellow-700 border border-yellow-150"
                              : "bg-red-50 text-red-700 border border-red-150"
                          }`}
                        >
                          {h.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-xs transition-colors"
                            onClick={() => alert(`Chi tiết hóa đơn:\nMã: ${h.code || `HD${h.id}`}\nKhách hàng: ${h.customerName || "Khách vãng lai"}\nTổng tiền: ${(h.totalAmount || 0).toLocaleString("vi-VN")} đ\nTrạng thái: ${h.status}`)}
                          >
                            Chi tiết
                          </button>
                          {h.status === "Chờ thanh toán" && (
                            <button
                              className="text-green-600 hover:text-green-800 hover:underline font-semibold text-xs transition-colors"
                              onClick={() => handleStatusChange(h.id || h.invoiceId, "Đã thanh toán")}
                            >
                              Thanh toán
                            </button>
                          )}
                          {h.status !== "Đã hủy" && h.status !== "Đã thanh toán" && (
                            <button
                              className="text-red-500 hover:text-red-700 hover:underline font-semibold text-xs transition-colors"
                              onClick={() => handleStatusChange(h.id || h.invoiceId, "Đã hủy")}
                            >
                              Hủy
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
