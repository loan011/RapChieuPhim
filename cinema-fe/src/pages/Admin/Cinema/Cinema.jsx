import "./Cinema.css";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getCinemaList, createCinema, updateCinema, deleteCinema, getAreaList } from "./cinemaService";

const MOCK_AREAS = [
  { id: 1, areaName: "An Giang" },
  { id: 2, areaName: "Bà Rịa - Vũng Tàu" },
  { id: 3, areaName: "Bắc Giang" },
  { id: 4, areaName: "Bắc Kạn" },
  { id: 5, areaName: "Bạc Liêu" },
  { id: 6, areaName: "Bắc Ninh" },
  { id: 7, areaName: "Bến Tre" },
  { id: 8, areaName: "Bình Định" },
  { id: 9, areaName: "Bình Dương" },
  { id: 10, areaName: "Bình Phước" },
  { id: 11, areaName: "Bình Thuận" },
  { id: 12, areaName: "Cà Mau" },
  { id: 13, areaName: "Cần Thơ" },
  { id: 14, areaName: "Cao Bằng" },
  { id: 15, areaName: "Đà Nẵng" },
  { id: 16, areaName: "Đắk Lắk" },
  { id: 17, areaName: "Đắk Nông" },
  { id: 18, areaName: "Điện Biên" },
  { id: 19, areaName: "Đồng Nai" },
  { id: 20, areaName: "Đồng Tháp" },
  { id: 21, areaName: "Gia Lai" },
  { id: 22, areaName: "Hà Giang" },
  { id: 23, areaName: "Hà Nam" },
  { id: 24, areaName: "Hà Nội" },
  { id: 25, areaName: "Hà Tĩnh" },
  { id: 26, areaName: "Hải Dương" },
  { id: 27, areaName: "Hải Phòng" },
  { id: 28, areaName: "Hậu Giang" },
  { id: 29, areaName: "Hòa Bình" },
  { id: 30, areaName: "Hưng Yên" },
  { id: 31, areaName: "Khánh Hòa" },
  { id: 32, areaName: "Kiên Giang" },
  { id: 33, areaName: "Kon Tum" },
  { id: 34, areaName: "Lai Châu" },
  { id: 35, areaName: "Lâm Đồng" },
  { id: 36, areaName: "Lạng Sơn" },
  { id: 37, areaName: "Lào Cai" },
  { id: 38, areaName: "Long An" },
  { id: 39, areaName: "Nam Định" },
  { id: 40, areaName: "Nghệ An" },
  { id: 41, areaName: "Ninh Bình" },
  { id: 42, areaName: "Ninh Thuận" },
  { id: 43, areaName: "Phú Thọ" },
  { id: 44, areaName: "Phú Yên" },
  { id: 45, areaName: "Quảng Bình" },
  { id: 46, areaName: "Quảng Nam" },
  { id: 47, areaName: "Quảng Ngãi" },
  { id: 48, areaName: "Quảng Ninh" },
  { id: 49, areaName: "Quảng Trị" },
  { id: 50, areaName: "Sóc Trăng" },
  { id: 51, areaName: "Sơn La" },
  { id: 52, areaName: "Tây Ninh" },
  { id: 53, areaName: "Thái Bình" },
  { id: 54, areaName: "Thái Nguyên" },
  { id: 55, areaName: "Thanh Hóa" },
  { id: 56, areaName: "Thừa Thiên Huế" },
  { id: 57, areaName: "Tiền Giang" },
  { id: 58, areaName: "TP. Hồ Chí Minh" },
  { id: 59, areaName: "Trà Vinh" },
  { id: 60, areaName: "Tuyên Quang" },
  { id: 61, areaName: "Vĩnh Long" },
  { id: 62, areaName: "Vĩnh Phúc" },
  { id: 63, areaName: "Yên Bái" },
];

const MOCK_CINEMAS = [
  { id: 1, cinemaName: "CGV Vincom Quận 9", address: "Vincom Mega Mall Q9", area: "58", areaName: "TP. Hồ Chí Minh", phone: "02812345678", email: "cgv.q9@cgv.vn", status: "Active" },
  { id: 2, cinemaName: "Lotte Cinema Gò Vấp", address: "Lotte Mart Gò Vấp", area: "58", areaName: "TP. Hồ Chí Minh", phone: "02887654321", email: "lotte.gv@lotte.vn", status: "Active" },
  { id: 3, cinemaName: "Galaxy Nguyễn Du", address: "116 Nguyễn Du, Q1", area: "58", areaName: "TP. Hồ Chí Minh", phone: "02811112222", email: "galaxy.nd@galaxy.vn", status: "Inactive" },
];

const EMPTY_FORM = {
  cinemaName: "",
  address: "",
  area: "",
  phone: "",
  email: "",
  status: "",
};

function getCinemaIdField(c) {
  return c?.cinemaId ?? c?.CinemaId ?? c?.id ?? c?.Id;
}

export default function RapChieu() {
  const [list, setList] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    getCinemaList()
      .then((data) => {
        const arr = Array.isArray(data) ? data : Array.isArray(data?.$values) ? data.$values : [];
        setList(arr);
      })
      .catch(() => setList([]));
    getAreaList()
      .then((data) => {
        const arr = Array.isArray(data) ? data : Array.isArray(data?.$values) ? data.$values : [];
        setAreas(arr);
      })
      .catch(() => setAreas([]));
  }, []);

  function openAddModal() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  }

  function openEditModal(cinema) {
    setEditId(getCinemaIdField(cinema));
    setForm({
      cinemaName: cinema.cinemaName ?? cinema.name ?? "",
      address: cinema.address ?? "",
      area: cinema.area ?? cinema.city ?? "",
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

    if (!form.cinemaName.trim()) { setFormError("Vui lòng nhập tên rạp chiếu."); return; }
    if (!form.address.trim()) { setFormError("Vui lòng nhập địa chỉ rạp."); return; }

    const areaName = areas.find((a) => String(a.id ?? a.areaId) === String(form.area))?.areaName ?? "";
    const payload = { ...form, areaName };

    try {
      setSubmitting(true);
      if (editId !== null) {
        await updateCinema(editId, payload);
        setList((prev) => prev.map((c) => (getCinemaIdField(c) === editId ? { ...c, ...payload } : c)));
      } else {
        const created = await createCinema(payload);
        setList((prev) => [...prev, { ...created, areaName }]);
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
      setList((prev) => prev.filter((c) => getCinemaIdField(c) !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  const filtered = list.filter((c) =>
    c.cinemaName?.toLowerCase().includes(search.toLowerCase()) ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.area?.toLowerCase().includes(search.toLowerCase()) ||
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
                    <tr key={getCinemaIdField(c) ?? i} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2 font-medium">{c.cinemaName ?? c.name}</td>
                      <td className="px-3 py-2">{c.address}</td>
                      <td className="px-3 py-2">{c.area ?? c.city}</td>
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
                          onClick={() => handleDelete(getCinemaIdField(c))}
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
      {showModal && createPortal(
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
                  Khu Vực / Thành Phố
                </label>
                <select
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">-- Chọn khu vực --</option>
                  {areas.map((a) => (
                    <option key={a.id ?? a.areaId} value={a.id ?? a.areaId}>
                      {a.areaName ?? a.name ?? a.Name}
                    </option>
                  ))}
                </select>
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
      , document.body)}
    </div>
  );
}
