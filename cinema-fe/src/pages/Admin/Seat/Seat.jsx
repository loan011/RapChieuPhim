import "./Seat.css";
import { createPortal } from "react-dom";
import {
  SEAT_TYPE_OPTIONS,
  SEAT_STATUS_OPTIONS,
  useSeat,
  getSeatId,
  getSeatCode,
  getSeatType,
  getSeatStatus,
  getRoomId,
  getRoomFullName,
  getRoomNameBySeat,
} from "./Seat.js";

const TABLE_HEADERS = [
  "#",
  "Mã Ghế",
  "Phòng Chiếu",
  "Loại Ghế",
  "Trạng Thái",
  "Thao Tác",
];

export default function Seat() {
  const {
    list,
    rooms,
    cinemas,

    loading,
    error,

    filterRoom,
    setFilterRoom,

    filterType,
    setFilterType,

    filtered,

    showModal,
    editId,
    form,
    submitting,
    formError,

    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmit,
    handleDelete,
  } = useSeat();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-xl">Quản Lý Ghế Ngồi</h4>

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
          <select
            className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-40"
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
          >
            <option value="">Tất cả phòng chiếu</option>

            {rooms.map((room) => {
              const roomId = getRoomId(room);

              return (
                <option key={roomId} value={roomId}>
                  {getRoomFullName(room, cinemas)}
                </option>
              );
            })}
          </select>

          <select
            className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-40"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Tất cả loại ghế</option>

            {SEAT_TYPE_OPTIONS.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
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
                  {TABLE_HEADERS.map((header) => (
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
                      colSpan={TABLE_HEADERS.length}
                      className="text-center py-6 text-gray-400"
                    >
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  filtered.map((seat, index) => {
                    const seatId = getSeatId(seat);

                    return (
                      <tr
                        key={seatId ?? index}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-3 py-2">
                          {index + 1}
                        </td>

                        <td className="px-3 py-2 font-medium">
                          {getSeatCode(seat)}
                        </td>

                        <td className="px-3 py-2">
                          {getRoomNameBySeat(seat, rooms, cinemas)}
                        </td>

                        <td className="px-3 py-2">
                          {getSeatType(seat)}
                        </td>

                        <td className="px-3 py-2">
                          {getSeatStatus(seat)}
                        </td>

                        <td className="px-3 py-2 flex gap-2">
                          <button
                            type="button"
                            className="text-blue-600 hover:underline text-xs"
                            onClick={() => openEditModal(seat)}
                          >
                            Sửa
                          </button>

                          <button
                            type="button"
                            className="text-red-500 hover:underline text-xs"
                            onClick={() => handleDelete(seatId)}
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
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
              <h5 className="font-bold text-lg mb-4">
                {editId !== null ? "Cập Nhật Ghế" : "Thêm Ghế Ngồi"}
              </h5>

              {formError && (
                <p className="text-red-500 text-sm mb-3">{formError}</p>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Phòng */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phòng Chiếu <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="roomId"
                    value={form.roomId}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">-- Chọn phòng --</option>

                    {rooms.map((room) => {
                      const roomId = getRoomId(room);

                      return (
                        <option key={roomId} value={roomId}>
                          {getRoomFullName(room, cinemas)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Hàng + Số ghế */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hàng <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      name="seatRow"
                      value={form.seatRow}
                      onChange={handleChange}
                      placeholder="VD: A"
                      maxLength={2}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số Ghế <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      name="seatNumber"
                      value={form.seatNumber}
                      onChange={handleChange}
                      placeholder="VD: 1 hoặc A1"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                {/* Loại ghế */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại Ghế
                  </label>

                  <select
                    name="seatType"
                    value={form.seatType}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {SEAT_TYPE_OPTIONS.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Trạng thái */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng Thái
                  </label>

                  <select
                    name="isActive"
                    value={String(form.isActive)}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {SEAT_STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nút hành động */}
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
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