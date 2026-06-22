import "./Room.css";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getRoomList, createRoom, updateRoom, deleteRoom } from "./roomService";
import { getCinemaList } from "../Cinema/cinemaService";


const EMPTY_FORM = {
  roomName: "",
  cinemaId: "",
  totalSeats: "",
  roomType: "",
  isActive: true,
};

export default function PhongChieu() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cinemas, setCinemas] = useState([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null); // null = thêm mới, có giá trị = sửa
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
      const [roomData, cinemaData] = await Promise.all([getRoomList(), getCinemaList()]);
      setList(roomData ?? []);
      setCinemas(cinemaData ?? []);
    } catch (err) {
      setError(err.message ?? "Lỗi tải dữ liệu.");
      setList([]);
      setCinemas([]);
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

  function openEditModal(room) {
    setEditId(room.roomId ?? room.id);
    setForm({
      roomName: room.roomName ?? "",
      cinemaId: room.cinemaId ?? "",
      totalSeats: room.totalSeats ?? room.capacity ?? "",
      roomType: room.roomType ?? room.type ?? "",
      isActive: room.isActive ?? true,
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

    // Validate
    if (!form.cinemaId) { setFormError("Vui lòng chọn rạp chiếu."); return; }
    if (!form.roomName.trim()) { setFormError("Vui lòng nhập tên phòng chiếu."); return; }
    if (!form.totalSeats || isNaN(Number(form.totalSeats)) || Number(form.totalSeats) <= 0) {
      setFormError("Vui lòng nhập sức chứa hợp lệ.");
      return;
    }

    const payload = {
      roomId: 0,
      cinemaId: Number(form.cinemaId),
      roomName: form.roomName,
      roomType: form.roomType,
      totalSeats: Number(form.totalSeats),
      isActive: form.isActive === true || form.isActive === "true",
    };

    try {
      setSubmitting(true);
      if (editId !== null) {
        // Cập nhật
        await updateRoom(editId, { ...payload, roomId: editId });
      } else {
        // Thêm mới
        await createRoom(payload);
      }
      closeModal();
      fetchData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Bạn có chắc muốn xóa phòng chiếu này?")) return;
    try {
      await deleteRoom(id);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-xl">Quản Lý Phòng Chiếu</h4>
        <button
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          onClick={openAddModal}
        >
          + Thêm
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        {loading && <p className="text-gray-500 text-sm">Đang tải...</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Tên Phòng</th>
                  <th className="px-3 py-2 text-left">Rạp Chiếu</th>
                  <th className="px-3 py-2 text-left">Sức Chứa</th>
                  <th className="px-3 py-2 text-left">Loại Phòng</th>
                  <th className="px-3 py-2 text-left">Trạng Thái</th>
                  <th className="px-3 py-2 text-left">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-400">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  list.map((r, i) => (
                    <tr key={r.roomId ?? r.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2">{r.roomName}</td>
                      <td className="px-3 py-2">{r.cinemaName ?? cinemas.find(c => (c.cinemaId ?? c.id) === r.cinemaId)?.cinemaName ?? cinemas.find(c => (c.cinemaId ?? c.id) === r.cinemaId)?.name ?? ""}</td>
                      <td className="px-3 py-2">{r.totalSeats ?? r.capacity}</td>
                      <td className="px-3 py-2">{r.roomType ?? r.type}</td>
                      <td className="px-3 py-2">{r.isActive === true ? "Hoạt động" : r.isActive === false ? "Ngừng" : r.status}</td>
                      <td className="px-3 py-2 flex gap-2">
                        <button
                          className="text-blue-600 hover:underline text-xs"
                          onClick={() => openEditModal(r)}
                        >
                          Sửa
                        </button>
                        <button
                          className="text-red-500 hover:underline text-xs"
                          onClick={() => handleDelete(r.roomId ?? r.id)}
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
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
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">-- Chọn rạp --</option>
                  {cinemas.map((c) => (
                    <option key={c.cinemaId ?? c.id} value={c.cinemaId ?? c.id}>{c.cinemaName ?? c.name}</option>
                  ))}
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
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">-- Chọn loại phòng --</option>
                  <option value="2D">2D</option>
                  <option value="3D">3D</option>
                  <option value="IMAX">IMAX</option>
                  <option value="4DX">4DX</option>
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
                  onChange={(e) => setForm(p => ({...p, isActive: e.target.value === "true"}))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="true">Hoạt động</option>
                  <option value="false">Ngừng hoạt động</option>
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
