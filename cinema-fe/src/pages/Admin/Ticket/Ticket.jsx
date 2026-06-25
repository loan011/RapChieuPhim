import "./Ticket.css";
import { createPortal } from "react-dom";
import { STATUS_OPTIONS, useTicket } from "./Ticket.js";

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
    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmitForm,
  } = useTicket();

  return (
    <div className="p-1">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-2xl text-gray-800">Quản Lý Vé</h4>
        <button
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-100 active:scale-98 transition-all duration-150"
          onClick={openAddModal}
        >
          + Thêm Vé
        </button>
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
                  <th className="px-4 py-3 text-left">Ghế</th>
                  <th className="px-4 py-3 text-left">Giá Vé</th>
                  <th className="px-4 py-3 text-left">Trạng Thái</th>
                  <th className="px-4 py-3 text-left">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-gray-400">
                      Không tìm thấy vé nào
                    </td>
                  </tr>
                ) : (
                  filtered.map((t, i) => (
                    <tr key={t.id || t.ticketId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5 text-gray-500 font-medium">{i + 1}</td>
                      <td className="px-4 py-3.5 font-semibold text-gray-800">{t.code || t.ticketCode || `VE${t.id}`}</td>
                      <td className="px-4 py-3.5 text-gray-600">{t.customerName}</td>
                      <td className="px-4 py-3.5 text-gray-700 font-medium">{t.movieTitle}</td>
                      <td className="px-4 py-3.5"><span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-mono text-xs font-semibold">{t.seatCode}</span></td>
                      <td className="px-4 py-3.5 font-bold text-gray-800">{(t.price || t.amount || 0).toLocaleString("vi-VN")} đ</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            t.status === "Đã thanh toán"
                              ? "bg-green-50 text-green-700 border border-green-150"
                              : t.status === "Đã đặt"
                              ? "bg-yellow-50 text-yellow-700 border border-yellow-150"
                              : "bg-red-50 text-red-700 border border-red-150"
                          }`}
                        >
                          {t.status}
                        </span>
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
                            onClick={() => handleDelete(t.id || t.ticketId)}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden border border-gray-100">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                <h5 className="font-bold text-lg text-gray-800">
                  {editId !== null ? "Cập Nhật Thông Tin Vé" : "Thêm Vé Mới"}
                </h5>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-650 text-2xl leading-none transition-colors"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Mã Vé <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all duration-200"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="Nhập mã vé (Ví dụ: VE001)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Khách Hàng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all duration-200"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="Nhập tên khách hàng"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Phim <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="movieTitle"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all duration-200"
                    value={formData.movieTitle}
                    onChange={handleChange}
                    placeholder="Nhập tên phim"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Ghế <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="seatCode"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all duration-200 font-mono"
                      value={formData.seatCode}
                      onChange={handleChange}
                      placeholder="Ví dụ: A1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Giá Vé <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      min="0"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all duration-200"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="Ví dụ: 75000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Trạng Thái
                  </label>
                  <select
                    name="status"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all duration-200"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {formError && (
                  <p className="text-red-500 text-xs font-semibold">{formError}</p>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-250 text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-100 disabled:opacity-60 transition-all"
                  >
                    {formLoading ? "Đang lưu..." : "Lưu Lại"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

