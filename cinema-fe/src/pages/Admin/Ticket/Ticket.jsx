import "./Ticket.css";
import { createPortal } from "react-dom";
import {
  STATUS_OPTIONS, useTicket,
  getTicketCode, getTicketCustomer, getTicketMovie,
  getTicketCinema, getTicketRoom, getTicketArea,
  getTicketSeat, getTicketPrice, getTicketStatus, getTicketDate,
} from "./Ticket.js";

export default function Ve() {
  const {
    loading,
    error,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filtered,
    showModal,
    editId,
    formData,
    formLoading,
    formError,
    handleDelete,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmitForm,
  } = useTicket();

  return (
    <div className="p-1">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-2xl text-gray-800">Quản Lý Vé</h4>
        <p className="text-xs text-gray-400">Vé được tạo tự động khi khách đặt chỗ</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex-1 min-w-[280px] relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Tìm mã vé, tên khách hàng, tên phim..."
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
                  <th className="px-4 py-3 text-left">Mã Vé</th>
                  <th className="px-4 py-3 text-left">Khách Hàng</th>
                  <th className="px-4 py-3 text-left">Phim</th>
                  <th className="px-4 py-3 text-left">Khu Vực</th>
                  <th className="px-4 py-3 text-left">Rạp</th>
                  <th className="px-4 py-3 text-left">Phòng</th>
                  <th className="px-4 py-3 text-left">Ghế</th>
                  <th className="px-4 py-3 text-left">Giá Vé</th>
                  <th className="px-4 py-3 text-left">Ngày</th>
                  <th className="px-4 py-3 text-left">Trạng Thái</th>
                  <th className="px-4 py-3 text-left">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="text-center py-10 text-gray-400">
                      Không tìm thấy vé nào
                    </td>
                  </tr>
                ) : (
                  filtered.map((t, i) => (
                    <tr key={t.ticketId || t.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5 text-gray-500 font-medium">{i + 1}</td>
                      <td className="px-4 py-3.5 font-semibold text-gray-800">{getTicketCode(t)}</td>
                      <td className="px-4 py-3.5 text-gray-600">{getTicketCustomer(t)}</td>
                      <td className="px-4 py-3.5 text-gray-700 font-medium">{getTicketMovie(t)}</td>
                      <td className="px-4 py-3.5 text-gray-600">{getTicketArea(t)}</td>
                      <td className="px-4 py-3.5 text-gray-600">{getTicketCinema(t)}</td>
                      <td className="px-4 py-3.5 text-gray-600">{getTicketRoom(t)}</td>
                      <td className="px-4 py-3.5">
                        <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-mono text-xs font-semibold">{getTicketSeat(t)}</span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-gray-800">{getTicketPrice(t).toLocaleString("vi-VN")} đ</td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs">{getTicketDate(t)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          getTicketStatus(t) === "Đã sử dụng" || getTicketStatus(t) === "Đã thanh toán"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : getTicketStatus(t) === "Đã hủy"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                        }`}>{getTicketStatus(t)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-xs transition-colors"
                            onClick={() => openEditModal(t)}
                          >
                            Sửa
                          </button>
                          <button
                            className="text-red-500 hover:text-red-700 hover:underline font-semibold text-xs transition-colors"
                            onClick={() => handleDelete(t.ticketId || t.id)}
                          >
                            Xóa
                          </button>
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

      {showModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                <h5 className="font-bold text-lg text-gray-800">Cập Nhật Trạng Thái Vé</h5>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
                  <p><span className="font-semibold">Mã vé:</span> {formData.code}</p>
                  <p><span className="font-semibold">Phim:</span> {formData.movieTitle}</p>
                  <p><span className="font-semibold">Giá:</span> {Number(formData.price).toLocaleString("vi-VN")} đ</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Trạng Thái</label>
                  <select
                    name="status"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="Active">Đã đặt</option>
                    <option value="Used">Đã sử dụng</option>
                    <option value="Cancelled">Đã hủy</option>
                  </select>
                </div>
                {formError && <p className="text-red-500 text-xs">{formError}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={closeModal} className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">Hủy</button>
                  <button onClick={handleSubmitForm} disabled={formLoading} className="px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
                    {formLoading ? "Đang lưu..." : "Cập nhật"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
