import "./Seat.css";
import { useEffect, useState } from "react";
import { getSeatList, deleteSeat } from "./seatService";

const TYPE_OPTIONS = ["Thường", "VIP", "Couple"];

export default function Ghe() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterRoom, setFilterRoom] = useState("");
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const data = await getSeatList();
      setList(data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Bạn có chắc muốn xóa ghế này?")) return;
    try {
      await deleteSeat(id);
      setList((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  const rooms = [...new Set(list.map((s) => s.roomName).filter(Boolean))];

  const filtered = list.filter((s) => {
    const matchRoom = filterRoom ? s.roomName === filterRoom : true;
    const matchType = filterType ? s.type === filterType : true;
    return matchRoom && matchType;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-xl">Quản Lý Ghế</h4>
        <button
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          onClick={() => alert("TODO: Mở form thêm ghế")}
        >
          + Thêm
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <select
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
          >
            <option value="">Tất cả phòng</option>
            {rooms.map((r) => <option key={r}>{r}</option>)}
          </select>
          <select
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
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
                    <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2">{s.code}</td>
                      <td className="px-3 py-2">{s.roomName}</td>
                      <td className="px-3 py-2">{s.row}</td>
                      <td className="px-3 py-2">{s.col}</td>
                      <td className="px-3 py-2">{s.type}</td>
                      <td className="px-3 py-2">{s.status}</td>
                      <td className="px-3 py-2 flex gap-2">
                        <button className="text-blue-600 hover:underline text-xs" onClick={() => alert(`TODO: Sửa ghế id=${s.id}`)}>Sửa</button>
                        <button className="text-red-500 hover:underline text-xs" onClick={() => handleDelete(s.id)}>Xóa</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
