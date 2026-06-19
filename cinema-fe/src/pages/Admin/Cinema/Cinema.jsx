import "./Cinema.css";
import { useEffect, useState } from "react";
import { getCinemaList, createCinema, updateCinema, deleteCinema } from "./cinemaService";

const EMPTY_FORM = {
  name: "",
  address: "",
  city: "",
  phone: "",
  email: "",
  status: "",
};

export default function RapChieu() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const data = await getCinemaList();
      setList(data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  }

  function openEditModal(cinema) {
    setEditId(cinema.id);
    setForm({
      name: cinema.name ?? "",
      address: cinema.address ?? "",
      city: cinema.city ?? "",
      phone: cinema.phone ?? "",
      email: cinema.email ?? "",
      status: cinema.status ?? "",
    });
    setFormError(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Vui lòng nhập tên rạp chiếu.");
      return;
    }
    if (!form.address.trim()) {
      setFormError("Vui lòng nhập địa chỉ rạp.");
      return;
    }

    try {
      setSubmitting(true);
      if (editId !== null) {
        await updateCinema(editId, form);
        setList((prev) =>
          prev.map((c) => (c.id === editId ? { ...c, ...form } : c))
        );
      } else {
        const created = await createCinema(form);
        setList((prev) => [...prev, created]);
      }
      closeModal();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Bạn có chắc muốn xóa rạp chiếu này?")) return;
    try {
      await deleteCinema(id);
      setList((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  const filtered = list.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase()) ||
    c.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-xl">Quản Lý Rạp Chiếu</h4>
        <button
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          onClick={openAddModal}
        >
          + Thêm
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, thành phố, địa chỉ..."
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
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Tên Rạp</th>
                  <th className="px-3 py-2 text-left">Địa Chỉ</th>
                  <th className="px-3 py-2 text-left">Thành Phố</th>
                  <th className="px-3 py-2 text-left">Điện Thoại</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Trạng Thái</th>
                  <th className="px-3 py-2 text-left">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-gray-400">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  filtered.map((c, i) => (
                    <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2 font-medium">{c.name}</td>
                      <td className="px-3 py-2">{c.address}</td>
                      <td className="px-3 py-2">{c.city}</td>
                      <td className="px-3 py-2">{c.phone}</td>
                      <td className="px-3 py-2">{c.email}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            c.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : c.status === "Inactive"
                              ? "bg-red-100 text-red-600"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {c.status === "Active"
                            ? "Hoạt động"
                            : c.status === "Inactive"
                            ? "Ngừng HĐ"
                            : c.status || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 flex gap-2">
                        <button
                          className="text-blue-600 hover:underline text-xs"
                          onClick={() => openEditModal(c)}
                        >
                          Sửa
                        </button>
                        <button
                          className="text-red-500 hover:underline text-xs"
                          onClick={() => handleDelete(c.id)}
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

      {/* Modal Thêm / Sửa */}
      {showModal && (
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
                  name="name"
                  value={form.name}
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

              {/* Thành phố */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thành Phố
                </label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Nhập tên thành phố"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Phone + Email - 2 cột */}
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
                  <option value="">-- Chọn trạng thái --</option>
                  <option value="Active">Hoạt động</option>
                  <option value="Inactive">Ngừng hoạt động</option>
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
        </div>
      )}
    </div>
  );
}
