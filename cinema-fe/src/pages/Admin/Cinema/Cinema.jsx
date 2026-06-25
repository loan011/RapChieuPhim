import "./Cinema.css";
import { createPortal } from "react-dom";
import {
  CINEMA_STATUS_OPTIONS,
  useCinema,
  getCinemaId,
  getCinemaName,
  getCinemaAddress,
  getCinemaAreaName,
  getCinemaPhone,
  getCinemaEmail,
  getCinemaStatus,
  getAreaId,
  getAreaName,
  getStatusClass,
  getStatusText,
} from "./Cinema.js";

const TABLE_HEADERS = [
  "#",
  "Tên Rạp",
  "Địa Chỉ",
  "Khu Vực",
  "Điện Thoại",
  "Email",
  "Trạng Thái",
  "Thao Tác",
];

export default function RapChieu() {
  const {
    areas,
    loading,
    error,
    search,
    setSearch,

    showModal,
    editId,
    form,
    submitting,
    formError,
    filtered,

    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmit,
    handleDelete,
  } = useCinema();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-xl">Quản Lý Rạp Chiếu</h4>

        <button
          type="button"
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          onClick={openAddModal}
        >
          + Thêm
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, khu vực, địa chỉ, số điện thoại..."
            className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full max-w-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <p className="text-gray-500 text-sm">Đang tải...</p>}

        {error && <p className="text-red-500 text-sm">{error}</p>}

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
                  filtered.map((cinema, index) => {
                    const cinemaId = getCinemaId(cinema);
                    const status = getCinemaStatus(cinema);

                    return (
                      <tr
                        key={cinemaId ?? index}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-3 py-2">{index + 1}</td>

                        <td className="px-3 py-2 font-medium">
                          {getCinemaName(cinema)}
                        </td>

                        <td className="px-3 py-2">
                          {getCinemaAddress(cinema)}
                        </td>

                        <td className="px-3 py-2">
                          {getCinemaAreaName(cinema)}
                        </td>

                        <td className="px-3 py-2">
                          {getCinemaPhone(cinema)}
                        </td>

                        <td className="px-3 py-2">
                          {getCinemaEmail(cinema)}
                        </td>

                        <td className="px-3 py-2">
                          <span className={getStatusClass(status)}>
                            {getStatusText(status)}
                          </span>
                        </td>

                        <td className="px-3 py-2 flex gap-2">
                          <button
                            type="button"
                            className="text-blue-600 hover:underline text-xs"
                            onClick={() => openEditModal(cinema)}
                          >
                            Sửa
                          </button>

                          <button
                            type="button"
                            className="text-red-500 hover:underline text-xs"
                            onClick={() => handleDelete(cinemaId)}
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
                {editId !== null ? "Cập Nhật Rạp Chiếu" : "Thêm Rạp Chiếu"}
              </h5>

              {formError && (
                <p className="text-red-500 text-sm mb-3">{formError}</p>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Tên rạp */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên Rạp <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="cinemaName"
                    value={form.cinemaName}
                    onChange={handleChange}
                    placeholder="Nhập tên rạp chiếu"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Địa chỉ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa Chỉ <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ rạp"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Khu vực */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Khu Vực <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="areaId"
                    value={form.areaId}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">-- Chọn khu vực --</option>

                    {areas.map((area) => {
                      const areaId = getAreaId(area);

                      return (
                        <option key={areaId} value={areaId}>
                          {getAreaName(area)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Điện thoại + Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Điện Thoại
                    </label>

                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Số điện thoại"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Email liên hệ"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                {/* Trạng thái */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng Thái
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {CINEMA_STATUS_OPTIONS.map((status) => (
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