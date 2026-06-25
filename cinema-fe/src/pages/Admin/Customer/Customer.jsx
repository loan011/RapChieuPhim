import "./Customer.css";
import { createPortal } from "react-dom";
import {
  CUSTOMER_MEMBERSHIP_OPTIONS,
  useCustomer,
  getCustomerId,
  getCustomerName,
  getCustomerEmail,
  getCustomerPhone,
  getCustomerPoint,
  getCustomerCreatedAt,
  getCustomerMembershipLevel,
  getMembershipClass,
} from "./Customer.js";

const TABLE_HEADERS = [
  "#",
  "Họ Tên",
  "Email",
  "Điện Thoại",
  "Điểm Tích Lũy",
  "Hạng Thành Viên",
  "Ngày Đăng Ký",
  "Thao Tác",
];

export default function Customer() {
  const {
    loading,
    error,
    search,
    setSearch,
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
  } = useCustomer();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-xl">Quản Lý Khách Hàng</h4>

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
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-40"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                  filtered.map((customer, index) => {
                    const customerId = getCustomerId(customer);

                    return (
                      <tr
                        key={customerId ?? index}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-3 py-2">{index + 1}</td>

                        <td className="px-3 py-2 font-medium">
                          {getCustomerName(customer)}
                        </td>

                        <td className="px-3 py-2">
                          {getCustomerEmail(customer)}
                        </td>

                        <td className="px-3 py-2">
                          {getCustomerPhone(customer)}
                        </td>

                        <td className="px-3 py-2">
                          {getCustomerPoint(customer)}
                        </td>

                        <td className="px-3 py-2">
                          <span
                            className={getMembershipClass(
                              getCustomerMembershipLevel(customer)
                            )}
                          >
                            {getCustomerMembershipLevel(customer)}
                          </span>
                        </td>

                        <td className="px-3 py-2">
                          {getCustomerCreatedAt(customer)}
                        </td>

                        <td className="px-3 py-2 flex gap-2">
                          <button
                            type="button"
                            className="text-blue-600 hover:underline text-xs"
                            onClick={() => openEditModal(customer)}
                          >
                            Sửa
                          </button>

                          <button
                            type="button"
                            className="text-red-500 hover:underline text-xs"
                            onClick={() => handleDelete(customerId)}
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
                {editId !== null ? "Cập Nhật Khách Hàng" : "Thêm Khách Hàng"}
              </h5>

              {formError && (
                <p className="text-red-500 text-sm mb-3">{formError}</p>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Họ tên */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ Tên <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Nhập họ tên khách hàng"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Email */}
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

                {/* Điện thoại + Điểm tích lũy */}
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
                      Điểm Tích Lũy
                    </label>

                    <input
                      type="number"
                      name="rewardPoint"
                      value={form.rewardPoint}
                      onChange={handleChange}
                      placeholder="Nhập điểm tích lũy"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                {/* Hạng thành viên */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hạng Thành Viên
                  </label>

                  <select
                    name="membershipLevel"
                    value={form.membershipLevel}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {CUSTOMER_MEMBERSHIP_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
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