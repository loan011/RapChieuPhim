import "./User.css";
import { createPortal } from "react-dom";

import {
  ROLE_OPTIONS,
  useUser,
  getUserId,
  getFullName,
  getEmail,
  getPhone,
  getDateOfBirth,
  getGender,
  getAddress,
  getRewardPoint,
  getMembershipLevel,
  getRole,
  getStatus,
  getCreatedAt,
} from "./useUser";

export default function NguoiDung() {
  const {
    loading,
    error,
    search,
    setSearch,
    filterRole,
    setFilterRole,
    showModal,
    editId,
    formData,
    setFormData,
    formError,
    formLoading,
    filtered,

    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmitForm,
    handleDelete,
  } = useUser();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-xl">Quản Lý Người Dùng</h4>

        <button
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

          <select
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">Tất cả vai trò</option>

            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {loading && <p className="text-gray-500 text-sm">Đang tải...</p>}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Họ Tên</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Số Điện Thoại</th>
                  <th className="px-3 py-2 text-left">Ngày Sinh</th>
                  <th className="px-3 py-2 text-left">Giới Tính</th>
                  <th className="px-3 py-2 text-left">Địa Chỉ</th>
                  <th className="px-3 py-2 text-left">Điểm</th>
                  <th className="px-3 py-2 text-left">Hạng Thành Viên</th>
                  <th className="px-3 py-2 text-left">Vai Trò</th>
                  <th className="px-3 py-2 text-left">Trạng Thái</th>
                  <th className="px-3 py-2 text-left">Ngày Tạo</th>
                  <th className="px-3 py-2 text-left">Thao Tác</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={13}
                      className="text-center py-6 text-gray-400"
                    >
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  filtered.map((user, index) => {
                    const id = getUserId(user);

                    return (
                      <tr
                        key={id ?? index}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-3 py-2">{index + 1}</td>

                        <td className="px-3 py-2 font-medium">
                          {getFullName(user)}
                        </td>

                        <td className="px-3 py-2">{getEmail(user)}</td>

                        <td className="px-3 py-2">{getPhone(user)}</td>

                        <td className="px-3 py-2">{getDateOfBirth(user)}</td>

                        <td className="px-3 py-2">{getGender(user)}</td>

                        <td className="px-3 py-2">{getAddress(user)}</td>

                        <td className="px-3 py-2">{getRewardPoint(user)}</td>

                        <td className="px-3 py-2">
                          {getMembershipLevel(user)}
                        </td>

                        <td className="px-3 py-2">{getRole(user)}</td>

                        <td className="px-3 py-2">{getStatus(user)}</td>

                        <td className="px-3 py-2">{getCreatedAt(user)}</td>

                        <td className="px-3 py-2 flex gap-2">
                          <button
                            className="text-blue-600 hover:underline text-xs"
                            onClick={() => openEditModal(user)}
                          >
                            Sửa
                          </button>

                          <button
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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
              <div className="flex justify-between items-center px-5 py-4 border-b">
                <h5 className="font-semibold text-base">
                  {editId !== null ? "Cập Nhật Người Dùng" : "Thêm Người Dùng"}
                </h5>

                <button
                  type="button"
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="px-5 py-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ Tên <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      name="fullName"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Nhập họ tên"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="email"
                      name="email"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Nhập email"
                    />
                  </div>
                </div>

                {formData.roleName === "Staff" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mật Khẩu {editId === null && <span className="text-red-500">*</span>}
                      </label>

                      <input
                        type="password"
                        name="password"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={
                          editId !== null
                            ? "Bỏ trống nếu không đổi mật khẩu"
                            : "Nhập mật khẩu"
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Xác Nhận Mật Khẩu {editId === null && <span className="text-red-500">*</span>}
                      </label>

                      <input
                        type="password"
                        name="confirmPassword"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Nhập lại mật khẩu"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số Điện Thoại <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      name="phone"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày Sinh <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="date"
                      name="dateOfBirth"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giới Tính
                    </label>

                    <select
                      name="gender"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vai Trò
                    </label>

                    <select
                      name="roleName"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={formData.roleName}
                      onChange={handleChange}
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa Chỉ
                  </label>

                  <input
                    type="text"
                    name="address"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Điểm Thưởng
                    </label>

                    <input
                      type="number"
                      name="rewardPoint"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={formData.rewardPoint}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hạng Thành Viên
                    </label>

                    <input
                      type="text"
                      name="membershipLevel"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={formData.membershipLevel}
                      onChange={handleChange}
                      placeholder="VD: Silver, Gold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng Thái
                    </label>

                    <select
                      name="isActive"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={String(formData.isActive)}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isActive: e.target.value === "true",
                        }))
                      }
                    >
                      <option value="true">Hoạt động</option>
                      <option value="false">Ngừng hoạt động</option>
                    </select>
                  </div>
                </div>

                {formError && <p className="text-red-500 text-sm">{formError}</p>}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {formLoading
                      ? "Đang lưu..."
                      : editId !== null
                      ? "Cập Nhật"
                      : "Lưu"}
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