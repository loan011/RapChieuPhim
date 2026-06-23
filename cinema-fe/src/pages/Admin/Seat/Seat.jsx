import "./Seat.css";
import { useEffect, useState } from "react";
import { getSeatList, createSeat, updateSeat, deleteSeat } from "./seatService";
import { getRoomList } from "../Room/roomService";

const TYPE_OPTIONS = [
  { value: "Standard", label: "Thường" },
  { value: "VIP", label: "VIP" },
  { value: "Couple", label: "Couple" },
];

const EMPTY_FORM = {
  roomId: "",
  seatRow: "",
  seatCol: "",
  seatType: "Standard",
  isActive: true,
};

export default function Ghe() {
  const [list, setList] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filterRoom, setFilterRoom] = useState("");
  const [filterType, setFilterType] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null); // null = thêm mới, id = sửa
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      
      const [seatData, roomData] = await Promise.all([
        getSeatList(),
        getRoomList(),
      ]);

      setList(seatData ?? []);
      setRooms(roomData ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditId(null);
    setForm({
      ...EMPTY_FORM,
      roomId: rooms.length > 0 ? String(rooms[0].id ?? rooms[0].Id ?? rooms[0].roomId ?? rooms[0].RoomId ?? "") : "",
    });
    setFormError(null);
    setShowModal(true);
  }

  function openEditModal(seat) {
    const sId = seat.seatId ?? seat.SeatId ?? seat.id ?? seat.Id;
    const rId = seat.roomId ?? seat.RoomId ?? "";
    const sRow = seat.seatRow ?? seat.SeatRow ?? "";
    const sNum = seat.seatNumber ?? seat.SeatNumber ?? "";
    // Trích xuất số cột từ số ghế (ví dụ "A12" -> "12")
    const sCol = sNum.replace(sRow, "");

    setEditId(sId);
    setForm({
      roomId: String(rId),
      seatRow: sRow,
      seatCol: sCol || sNum,
      seatType: seat.seatType ?? seat.SeatType ?? "Standard",
      isActive: seat.isActive ?? seat.IsActive ?? true,
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
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    // Validate
    if (!form.roomId) {
      setFormError("Vui lòng chọn phòng chiếu.");
      return;
    }
    if (!form.seatRow.trim()) {
      setFormError("Vui lòng nhập hàng ghế.");
      return;
    }
    if (!form.seatCol.trim() || isNaN(Number(form.seatCol))) {
      setFormError("Vui lòng nhập số ghế hợp lệ.");
      return;
    }

    const rowUpper = form.seatRow.trim().toUpperCase();
    const colTrim = form.seatCol.trim();
    const seatNum = rowUpper + colTrim;

    const payload = {
      roomId: Number(form.roomId),
      seatRow: rowUpper,
      seatNumber: seatNum,
      seatType: form.seatType,
      isActive: form.isActive,
    };

    if (editId !== null) {
      payload.seatId = Number(editId);
    }

    try {
      setSubmitting(true);
      if (editId !== null) {
        // Cập nhật
        await updateSeat(editId, payload);
        setList((prev) =>
          prev.map((s) => {
            const currentId = s.seatId ?? s.SeatId ?? s.id ?? s.Id;
            return currentId === editId ? { ...s, ...payload } : s;
          })
        );
      } else {
        // Thêm mới
        const created = await createSeat(payload);
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
    if (!confirm("Bạn có chắc muốn xóa ghế này?")) return;
    try {
      await deleteSeat(id);
      setList((prev) =>
        prev.filter((s) => {
          const currentId = s.seatId ?? s.SeatId ?? s.id ?? s.Id;
          return currentId !== id;
        })
      );
    } catch (err) {
      alert(err.message);
    }
  }

  const filtered = list.filter((s) => {
    const matchRoom = filterRoom ? String(s.roomId ?? s.RoomId ?? "") === filterRoom : true;
    const matchType = filterType ? (s.seatType ?? s.SeatType ?? "") === filterType : true;
    return matchRoom && matchType;
  });

  return (
    <div>
      {/* Header */}
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
        {/* Bộ lọc */}
        <div className="flex flex-wrap gap-2 mb-4">
          <select
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
          >
            <option value="">Tất cả phòng</option>
            {rooms.map((r) => {
              const id = r.id ?? r.Id ?? r.roomId ?? r.RoomId ?? "";
              const name = r.name ?? r.Name ?? r.roomName ?? r.RoomName ?? "Phòng không tên";
              return (
                <option key={id} value={String(id)}>
                  {name}
                </option>
              );
            })}
          </select>
          <select
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Tất cả loại</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
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
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-gray-400">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  filtered.map((s, i) => {
                    const currentId = s.seatId ?? s.SeatId ?? s.id ?? s.Id;
                    const rId = s.roomId ?? s.RoomId;
                    const sRow = s.seatRow ?? s.SeatRow ?? "";
                    const sNum = s.seatNumber ?? s.SeatNumber ?? "";
                    const sCol = sNum.replace(sRow, "") || sNum;
                    const sType = s.seatType ?? s.SeatType ?? "";
                    const sActive = s.isActive ?? s.IsActive ?? true;

                    // Lấy tên phòng
                    const roomObj = rooms.find((r) => String(r.id ?? r.Id ?? r.roomId ?? r.RoomId) === String(rId));
                    const roomName = roomObj ? (roomObj.name ?? roomObj.Name ?? roomObj.roomName ?? roomObj.RoomName) : `Phòng ID: ${rId}`;

                    // Lọc nhãn loại ghế
                    const typeObj = TYPE_OPTIONS.find((t) => t.value === sType);
                    const typeLabel = typeObj ? typeObj.label : sType;

                    return (
                      <tr key={currentId} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2">{i + 1}</td>
                        <td className="px-3 py-2 font-bold text-gray-800">{sNum}</td>
                        <td className="px-3 py-2">{roomName}</td>
                        <td className="px-3 py-2 font-semibold">{sRow}</td>
                        <td className="px-3 py-2">{sCol}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            sType === "VIP" 
                              ? "bg-purple-100 text-purple-700" 
                              : sType === "Couple" 
                              ? "bg-pink-100 text-pink-700" 
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {typeLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            sActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {sActive ? "Hoạt động" : "Khóa"}
                          </span>
                        </td>
                        <td className="px-3 py-2 flex gap-2">
                          <button
                            className="text-blue-600 hover:underline text-xs"
                            onClick={() => openEditModal(s)}
                          >
                            Sửa
                          </button>
                          <button
                            className="text-red-500 hover:underline text-xs"
                            onClick={() => handleDelete(currentId)}
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

      {/* Modal Thêm / Sửa */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h5 className="font-bold text-lg mb-4">
              {editId !== null ? "Cập Nhật Ghế" : "Thêm Ghế"}
            </h5>

            {formError && (
              <p className="text-red-500 text-sm mb-3">{formError}</p>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Phòng chiếu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phòng Chiếu <span className="text-red-500">*</span>
                </label>
                <select
                  name="roomId"
                  value={form.roomId}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">-- Chọn phòng chiếu --</option>
                  {rooms.map((r) => {
                    const id = r.id ?? r.Id ?? r.roomId ?? r.RoomId ?? "";
                    const name = r.name ?? r.Name ?? r.roomName ?? r.RoomName ?? "";
                    return (
                      <option key={id} value={String(id)}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Hàng ghế */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hàng Ghế <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="seatRow"
                  value={form.seatRow}
                  onChange={handleChange}
                  placeholder="Nhập chữ cái (ví dụ: A, B, C...)"
                  maxLength={2}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Số thứ tự */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số Ghế <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="seatCol"
                  value={form.seatCol}
                  onChange={handleChange}
                  placeholder="Nhập số thứ tự (ví dụ: 1, 2, 3...)"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Loại ghế */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại Ghế
                </label>
                <select
                  name="seatType"
                  value={form.seatType}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trạng thái hoạt động */}
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 select-none">
                  Kích hoạt ghế hoạt động
                </label>
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
                  className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                  disabled={submitting}
                >
                  {submitting ? "Đang xử lý..." : editId !== null ? "Lưu thay đổi" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
