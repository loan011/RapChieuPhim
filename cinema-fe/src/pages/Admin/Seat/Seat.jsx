import "./Seat.css";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getSeatList, createSeat, updateSeat, deleteSeat } from "./seatService";
import { getRoomList } from "../Room/roomService";

const TYPE_OPTIONS = ["Thường", "VIP", "Couple"];
const EMPTY_FORM = { roomId: "", seatRow: "", seatNumber: "", seatType: "Thường", isActive: true };


export default function Ghe() {
  const [list, setList] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterRoom, setFilterRoom] = useState("");
  const [filterType, setFilterType] = useState("");

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
      const [seatData, roomData] = await Promise.all([getSeatList(), getRoomList()]);
      setList(seatData ?? []);
      setRooms(roomData ?? []);
    } catch (err) {
      setError(err.message ?? "Lỗi tải dữ liệu.");
      setList([]);
      setRooms([]);
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

  function openEditModal(seat) {
    setEditId(seat.seatId ?? seat.id);
    setForm({
      roomId: seat.roomId ?? "",
      seatRow: seat.seatRow ?? seat.row ?? "",
      seatNumber: seat.seatNumber ?? String(seat.col) ?? "",
      seatType: seat.seatType ?? seat.type ?? "Thường",
      isActive: seat.isActive ?? true,
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
    if (!form.roomId) { setFormError("Vui lòng chọn phòng chiếu."); return; }
    if (!form.seatRow.trim()) { setFormError("Vui lòng nhập hàng ghế."); return; }
    if (!form.seatNumber) { setFormError("Vui lòng nhập số ghế."); return; }
    const selectedRoom = rooms.find((r) => (r.roomId ?? r.id) === Number(form.roomId));
    const roomObj = selectedRoom ? {
      roomId: selectedRoom.roomId ?? selectedRoom.id,
      cinemaId: selectedRoom.cinemaId ?? 0,
      roomName: selectedRoom.roomName ?? "",
      roomType: selectedRoom.roomType ?? "",
      totalSeats: selectedRoom.totalSeats ?? 0,
      isActive: selectedRoom.isActive ?? true,
      cinema: selectedRoom.cinema ?? null,
      seats: [],
    } : null;
    const payload = {
      seatId: 0,
      roomId: Number(form.roomId),
      seatRow: form.seatRow,
      seatNumber: String(form.seatNumber),
      seatType: form.seatType,
      isActive: form.isActive === true || form.isActive === "true",
    };
    try {
      setSubmitting(true);
      if (editId !== null) {
        await updateSeat(editId, { ...payload, seatId: editId });
      } else {
        await createSeat(payload);
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
    if (!confirm("Bạn có chắc muốn xóa ghế này?")) return;
    try {
      await deleteSeat(id);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  }

  const roomNames = [...new Set(list.map((s) => s.roomName ?? s.room?.roomName).filter(Boolean))];

  const filtered = list.filter((s) => {
    const matchRoom = filterRoom ? (s.roomName ?? s.room?.roomName) === filterRoom : true;
    const matchType = filterType ? (s.seatType ?? s.type) === filterType : true;
    return matchRoom && matchType;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-xl">Quản Lý Ghế</h4>
        <button
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          onClick={openAddModal}
        >
          + Thêm
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <select
            className="border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-900 bg-white"
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
          >
            <option value="">Tất cả phòng</option>
            {roomNames.map((r) => <option key={r}>{r}</option>)}
          </select>
          <select
            className="border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-900 bg-white"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Tất cả loại</option>
            {TYPE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
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
                  <th className="px-3 py-2 text-left">Mã Ghế</th>
                  <th className="px-3 py-2 text-left">Phòng Chiếu</th>
                  <th className="px-3 py-2 text-left">Hàng</th>
                  <th className="px-3 py-2 text-left">Số</th>
                  <th className="px-3 py-2 text-left">Loại Ghế</th>
                  <th className="px-3 py-2 text-left">Trạng Thái</th>
                  <th className="px-3 py-2 text-left">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-6 text-gray-400">Không có dữ liệu</td></tr>
                ) : (
                  filtered.map((s, i) => (
                    <tr key={s.seatId ?? s.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2">{s.seatId ?? s.id}</td>
                      <td className="px-3 py-2">{s.roomName ?? s.room?.roomName}</td>
                      <td className="px-3 py-2">{s.seatRow ?? s.row}</td>
                      <td className="px-3 py-2">{s.seatNumber ?? s.col}</td>
                      <td className="px-3 py-2">{s.seatType ?? s.type}</td>
                      <td className="px-3 py-2">{s.isActive === true ? "Hoạt động" : s.isActive === false ? "Ngừng" : s.status}</td>
                      <td className="px-3 py-2 flex gap-2">
                        <button className="text-blue-600 hover:underline text-xs" onClick={() => openEditModal(s)}>Sửa</button>
                        <button className="text-red-500 hover:underline text-xs" onClick={() => handleDelete(s.seatId ?? s.id)}>Xóa</button>
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
            <h5 className="font-bold text-lg mb-4 text-gray-800">
              {editId !== null ? "Cập Nhật Ghế" : "Thêm Ghế Mới"}
            </h5>

            {formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phòng Chiếu <span className="text-red-500">*</span></label>
                <select
                  name="roomId"
                  value={form.roomId}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">-- Chọn phòng --</option>
                  {rooms.map((r) => (
                    <option key={r.roomId ?? r.id} value={r.roomId ?? r.id}>{r.roomName ?? r.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hàng <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="seatRow"
                    value={form.seatRow}
                    onChange={handleChange}
                    placeholder="VD: A, B, C..."
                    maxLength={2}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số Ghế <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="seatNumber"
                    value={form.seatNumber}
                    onChange={handleChange}
                    placeholder="VD: 1, 2, 3..."
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại Ghế</label>
                <select
                  name="seatType"
                  value={form.seatType}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng Thái</label>
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

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
                  disabled={submitting}
                >
                  {submitting ? "Đang xử lý..." : editId !== null ? "Cập Nhật" : "Thêm Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
