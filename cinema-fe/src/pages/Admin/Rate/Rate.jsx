import "./Rate.css";
import { createPortal } from "react-dom";

import {
  STATUS_OPTIONS,
  useRate,

  getShowtimeId,
  getShowtimeMovieTitle,
  getShowtimeRoomName,
  getShowDate,
  getStartHour,
  getEndHour,
  getBasePrice,
  getStatus,
  formatMoney,

  getMovieId,
  getMovieTitle,
  getRoomId,
  getRoomFullName,
} from "./Rate.js";

export default function Rate() {
  const {
    list,
    movies,
    rooms,

    loading,
    error,

    search,
    setSearch,

    filterDate,
    setFilterDate,

    filterStatus,
    setFilterStatus,

    showModal,
    editId,
    form,
    formError,
    submitting,

    filtered,

    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmit,
    handleDelete,
  } = useRate();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-xl">Quản Lý Suất Chiếu</h4>

        <button
          type="button"
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          onClick={openAddModal}
        >
          + Thêm
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            placeholder="Tìm phim, phòng..."
            className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-40"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <input
            type="date"
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />

          <select
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>

            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <p className="text-gray-500 text-sm">Đang tải...</p>
        )}

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  {[
                    "#",
                    "Phim",
                    "Phòng Chiếu",
                    "Ngày Chiếu",
                    "Giờ Chiếu",
                    "Giá Vé",
                    "Trạng Thái",
                    "Thao Tác",
                  ].map((header) => (
                    <th key={header} className="px-3 py-2 text-left">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-6 text-gray-400"
                    >
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, index) => {
                    const id = getShowtimeId(item);

                    return (
                      <tr key={id ?? index} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2">{index + 1}</td>

                        <td className="px-3 py-2 font-medium">
                          {getShowtimeMovieTitle(item, movies)}
                        </td>

                        <td className="px-3 py-2">
                          {getShowtimeRoomName(item, rooms)}
                        </td>

                        <td className="px-3 py-2">
                          {getShowDate(item)}
                        </td>

                        <td className="px-3 py-2">
                          {getStartHour(item)}
                          {getEndHour(item)
                            ? ` - ${getEndHour(item)}`
                            : ""}
                        </td>

                        <td className="px-3 py-2">
                          {formatMoney(getBasePrice(item))}
                        </td>

                        <td className="px-3 py-2">
                          {getStatus(item)}
                        </td>

                        <td className="px-3 py-2 flex gap-2">
                          <button
                            type="button"
                            className="text-blue-600 hover:underline text-xs"
                            onClick={() => openEditModal(item)}
                          >
                            Sửa
                          </button>

                          <button
                            type="button"
                            className="text-red-500 hover:underline text-xs"
                            onClick={() => handleDelete(id)}
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
              <h5 className="font-bold text-lg mb-4 text-gray-800">
                {editId !== null ? "Cập Nhật Suất Chiếu" : "Thêm Suất Chiếu Mới"}
              </h5>

              {formError && (
                <p className="text-red-500 text-sm mb-3">{formError}</p>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phim <span className="text-red-500">*</span>
                    </label>

                    <select
                      name="movieId"
                      value={form.movieId}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">-- Chọn phim --</option>

                      {movies.map((movie) => {
                        const movieId = getMovieId(movie);

                        return (
                          <option key={movieId} value={movieId}>
                            {getMovieTitle(movie)}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phòng Chiếu <span className="text-red-500">*</span>
                    </label>

                    <select
                      name="roomId"
                      value={form.roomId}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">-- Chọn phòng --</option>

                      {rooms.map((room) => {
                        const roomId = getRoomId(room);

                        return (
                          <option key={roomId} value={roomId}>
                            {getRoomFullName(room)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày Chiếu <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="date"
                      name="showDate"
                      value={form.showDate}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giờ Bắt Đầu <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="time"
                      name="startHour"
                      value={form.startHour}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giờ Kết Thúc <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="time"
                      name="endHour"
                      value={form.endHour}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá Vé <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="number"
                      name="basePrice"
                      value={form.basePrice}
                      onChange={handleChange}
                      placeholder="VD: 75000"
                      min="0"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng Thái
                    </label>

                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                    disabled={submitting}
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Đang xử lý..."
                      : editId !== null
                      ? "Cập Nhật"
                      : "Thêm Mới"}
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