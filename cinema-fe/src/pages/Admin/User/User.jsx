import "./User.css";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getUserList, createUser, updateUser, deleteUser } from "./userService";

const MOCK_USERS = [
  { id: 1, username: "admin", email: "admin@cinema.vn", role: "Admin", status: "active", createdAt: "2024-01-01" },
  { id: 2, username: "nhanvien01", email: "nv01@cinema.vn", role: "Staff", status: "active", createdAt: "2024-03-15" },
  { id: 3, username: "khachhang01", email: "kh01@gmail.com", role: "User", status: "active", createdAt: "2024-06-01" },
];

const EMPTY_FORM = { userName: "", email: "", password: "", confirmPassword: "", roleName: "User", status: "active" };

export default function NguoiDung() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const data = await getUserList();
      setList(data ?? []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setFormError("");
  }

  async function handleSubmitForm(e) {
    e.preventDefault();
    if (!formData.userName.trim()) { setFormError("Vui lòng nhập tên đăng nhập."); return; }
    if (!formData.email.trim()) { setFormError("Vui lòng nhập email."); return; }
    if (!formData.password.trim()) { setFormError("Vui lòng nhập mật khẩu."); return; }
    if (formData.password !== formData.confirmPassword) { setFormError("Mật khẩu xác nhận không khớp."); return; }
    try {
      setFormLoading(true);
      setFormError("");
      const payload = {
        fullName: formData.userName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        roleName: formData.roleName,
        dateOfBirth: "2000-01-01",
        gender: "Other",
        phone: "0000000000",
      };
      const newUser = await createUser(payload);
      setList((prev) => [...prev, newUser]);
      closeModal();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Bạn có chắc muốn xóa người dùng này?")) return;
    try {
      await deleteUser(id);
      setList((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  const filtered = list.filter((u) => {
    const matchSearch =
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole ? u.role?.toLowerCase() === filterRole.toLowerCase() : true;
    return matchSearch && matchRole;
  });

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
            placeholder="Tìm kiếm..."
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
            <option value="admin">Admin</option>
            <option value="user">User</option>
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
                  <th className="px-3 py-2 text-left">Tên Đăng Nhập</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Vai Trò</th>
                  <th className="px-3 py-2 text-left">Trạng Thái</th>
                  <th className="px-3 py-2 text-left">Ngày Tạo</th>
                  <th className="px-3 py-2 text-left">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-6 text-gray-400">Không có dữ liệu</td></tr>
                ) : (
                  filtered.map((u, i) => (
                    <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2">{u.username}</td>
                      <td className="px-3 py-2">{u.email}</td>
                      <td className="px-3 py-2">{u.role}</td>
                      <td className="px-3 py-2">{u.status}</td>
                      <td className="px-3 py-2">{u.createdAt}</td>
                      <td className="px-3 py-2 flex gap-2">
                        <button
                          className="text-blue-600 hover:underline text-xs"
                          onClick={() => alert(`TODO: Sửa người dùng id=${u.id}`)}
                        >
                          Sửa
                        </button>
                        <button
                          className="text-red-500 hover:underline text-xs"
                          onClick={() => handleDelete(u.id)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal thêm người dùng */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center px-5 py-4 border-b">
              <h5 className="font-semibold text-base">Thêm Người Dùng</h5>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmitForm} className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Đăng Nhập <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  placeholder="Nhập tên đăng nhập"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Nhập email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật Khẩu <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Nhập mật khẩu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Xác Nhận Mật Khẩu <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Nhập lại mật khẩu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vai Trò</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.roleName}
                  onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng Thái</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Vô hiệu</option>
                </select>
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
                  {formLoading ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
