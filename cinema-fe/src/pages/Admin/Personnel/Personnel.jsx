import "./Personnel.css";
import { createPortal } from "react-dom";

import {
  EMPLOYEE_POSITION_OPTIONS,
  EMPLOYEE_STATUS_OPTIONS,
  usePersonnel,

  getEmployeeId,
  getEmployeeName,
  getEmployeeEmail,
  getEmployeePhone,
  getEmployeePosition,
  getEmployeeStatus,
  getStatusClass,
  getStatusText,
  getStaffCinemaId,
} from "./Personnel.js";

export default function Personnel() {
  const {
    list,
    cinemas,
    loading,
    error,

    search,
    setSearch,

    filterPos,
    setFilterPos,

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
  } = usePersonnel();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-xl">Quản Lý Nhân Viên</h4>

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
            placeholder="Tìm kiếm theo họ tên, email, số điện thoại..."
            className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-40"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            value={filterPos}
            onChange={(e) => setFilterPos(e.target.value)}
          >
            <option value="">Tất cả vị trí</option>

            {EMPLOYEE_POSITION_OPTIONS.map((position) => (
              <option key={position.value} value={position.value}>
                {position.label}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <p className="text-gray-500 text-sm">Đang tải...</p>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  {[
                    "#",
                    "Họ Tên",
                    "Email",
                    "Rạp Chi Nhánh",
                    "Mật Khẩu",
                    "Điện Thoại",
                    "Vị Trí",
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
                      colSpan={10}
                      className="text-center py-6 text-gray-400"
                    >
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  filtered.map((employee, index) => {
                    const employeeId = getEmployeeId(employee);
                    const status = getEmployeeStatus(employee);

                    return (
                      <tr
                        key={employeeId ?? index}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-3 py-2">{index + 1}</td>

                        <td className="px-3 py-2 font-medium">
                          {getEmployeeName(employee)}
                        </td>

                        <td className="px-3 py-2">
                          {getEmployeeEmail(employee)}
                        </td>

                        <td className="px-3 py-2 text-gray-600 font-medium">
                          {(() => {
                            const cId = getStaffCinemaId(employee);
                            const cinema = cinemas?.find(c => String(c.cinemaId || c.id) === String(cId));
                            return cinema ? (cinema.cinemaName || cinema.CinemaName) : "Tất cả các rạp";
                          })()}
                        </td>

                        <td className="px-3 py-2 font-mono text-gray-400">
                          ••••••
                        </td>

                        <td className="px-3 py-2">
                          {getEmployeePhone(employee)}
                        </td>

                        <td className="px-3 py-2">
                          {getEmployeePosition(employee)}
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
                            onClick={() => openEditModal(employee)}
                          >
                            Sửa
                          </button>

                          <button
                            type="button"
                            className="text-red-500 hover:underline text-xs"
                            onClick={() => handleDelete(employeeId)}
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
                {editId !== null ? "Cập Nhật Nhân Viên" : "Thêm Nhân Viên"}
              </h5>

              {formError && (
                <p className="text-red-500 text-sm mb-3">{formError}</p>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ Tên <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Nhập họ tên nhân viên"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Nhập email"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editId !== null ? "Mật Khẩu Mới (Để trống nếu giữ nguyên)" : "Mật Khẩu"} <span className="text-red-500">{editId === null && "*"}</span>
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={form.password || ""}
                    onChange={handleChange}
                    placeholder={editId !== null ? "Nhập mật khẩu mới để thay đổi" : "Nhập mật khẩu tài khoản"}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

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
                      placeholder="Nhập số điện thoại"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lương
                    </label>

                    <input
                      type="number"
                      name="salary"
                      value={form.salary}
                      onChange={handleChange}
                      placeholder="Nhập lương"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chi Nhánh Rạp
                    </label>

                    <select
                      name="cinemaId"
                      value={form.cinemaId || ""}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 animate-in fade-in"
                    >
                      <option value="">Tất cả các rạp (Hệ thống)</option>
                      {cinemas?.map((c) => (
                        <option key={c.cinemaId || c.id} value={c.cinemaId || c.id}>
                          {c.cinemaName || c.CinemaName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vị Trí
                    </label>

                    <select
                      name="position"
                      value={form.position}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {EMPLOYEE_POSITION_OPTIONS.map((position) => (
                        <option key={position.value} value={position.value}>
                          {position.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

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
                    {EMPLOYEE_STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

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