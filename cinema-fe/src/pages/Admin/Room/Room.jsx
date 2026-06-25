import "./Room.css";
import { createPortal } from "react-dom";
import {
  ROOM_TYPE_OPTIONS,
  ROOM_STATUS_OPTIONS,
  useRoom,
  getRoomId,
  getRoomName,
  getRoomCinemaName,
  getRoomTotalSeats,
  getRoomType,
  getRoomStatusText,
  getCinemaId,
  getCinemaName,
} from "./Room.js";

const TABLE_HEADERS = [
  "#",
  "Tên Phòng",
  "Rạp Chiếu",
  "Sức Chứa",
  "Loại Phòng",
  "Trạng Thái",
  "Thao Tác",
];

export default function Room() {
  const {
    list,
    cinemas,
    loading,
    error,

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
  } = useRoom();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-xl">Quản Lý Phòng Chiếu</h4>

        <button
          type="button"
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          onClick={openAddModal}
        >
          + Thêm
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
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
                {list.length === 0 ? (
                  <tr>
                    <td
                      colSpan={TABLE_HEADERS.length}
                      className="text-center py-6 text-gray-400"
                    >
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  list.map((room, index) => {
                    const roomId = getRoomId(room);

                    return (
                      <tr
                        key={roomId ?? index}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-3 py-2">{index + 1}</td>

                        <td className="px-3 py-2 font-medium">
                          {getRoomName(room)}
                        </td>

                        <td className="px-3 py-2">
                          {getRoomCinemaName(room, cinemas)}
                        </td>

                        <td className="px-3 py-2">
                          {getRoomTotalSeats(room)}
                        </td>

                        <td className="px-3 py-2">
                          {getRoomType(room)}
                        </td>

                        <td className="px-3 py-2">
                          {getRoomStatusText(room)}
                        </td>

                        <td className="px-3 py-2 flex gap-2">
                          <button
                            type="button"
                            className="text-blue-600 hover:underline text-xs"
                            onClick={() => openEditModal(room)}
                          >
                            Sửa
                          </button>

                          <button
                            type="button"
                            className="text-red-500 hover:underline text-xs"
                            onClick={() => handleDelete(roomId)}
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
                {editId !== null ? "Cập Nhật Phòng Chiếu" : "Thêm Phòng Chiếu"}
              </h5>

              {formError && (
                <p className="text-red-500 text-sm mb-3">{formError}</p>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Rạp chiếu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rạp Chiếu <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="cinemaId"
                    value={form.cinemaId}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">-- Chọn rạp --</option>

                    {cinemas.map((cinema) => {
                      const cinemaId = getCinemaId(cinema);

                      return (
                        <option key={cinemaId} value={cinemaId}>
                          {getCinemaName(cinema)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Tên phòng */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên Phòng <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="roomName"
                    value={form.roomName}
                    onChange={handleChange}
                    placeholder="Nhập tên phòng chiếu"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Sức chứa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sức Chứa <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="number"
                    name="totalSeats"
                    value={form.totalSeats}
                    onChange={handleChange}
                    placeholder="Nhập sức chứa (số ghế)"
                    min={1}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Loại phòng */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại Phòng
                  </label>

                  <select
                    name="roomType"
                    value={form.roomType}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {ROOM_TYPE_OPTIONS.map((type) => (
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
                    {ROOM_STATUS_OPTIONS.map((status) => (
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