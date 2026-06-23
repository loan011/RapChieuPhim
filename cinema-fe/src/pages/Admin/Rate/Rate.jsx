import "./Rate.css";
import { useEffect, useState } from "react";
import { getShowtimeList, deleteShowtime } from "./showtimeService";

const STATUS_OPTIONS = ["Đang bán", "Sắp chiếu", "Đã chiếu", "Hủy"];

const MOCK_SHOWTIMES = [
  { id: 1, movieTitle: "Avengers: Endgame", roomName: "Phòng 1", cinemaName: "CGV Quận 9", date: "2024-06-15", startTime: "18:00", endTime: "21:01", price: 75000, status: "Đang bán" },
  { id: 2, movieTitle: "Inside Out 2", roomName: "Phòng 2", cinemaName: "CGV Quận 9", date: "2024-06-15", startTime: "20:30", endTime: "22:10", price: 85000, status: "Đang bán" },
  { id: 3, movieTitle: "Dune: Part Two", roomName: "Phòng IMAX", cinemaName: "Lotte Gò Vấp", date: "2024-06-16", startTime: "15:00", endTime: "17:46", price: 120000, status: "Sắp chiếu" },
];

export default function SuatChieu() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const data = await getShowtimeList();
      setList(data ?? []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Bạn có chắc muốn xóa suất chiếu này?")) return;
    try {
      await deleteShowtime(id);
      setList((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  const filtered = list.filter((s) => {
    const matchSearch =
      s.movieTitle?.toLowerCase().includes(search.toLowerCase()) ||
      s.roomName?.toLowerCase().includes(search.toLowerCase());
    const matchDate = filterDate ? s.date === filterDate : true;
    const matchStatus = filterStatus ? s.status === filterStatus : true;
    return matchSearch && matchDate && matchStatus;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-xl">Quản Lý Suất Chiếu</h4>
        <button
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          onClick={() => alert("TODO: Mở form thêm suất chiếu")}
        >
          + Thêm
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            placeholder="Tìm phim, phòng..."
            className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-40"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            type="date"
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          <select
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
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
                  <th className="px-3 py-2 text-left">Phim</th>
                  <th className="px-3 py-2 text-left">Phòng Chiếu</th>
                  <th className="px-3 py-2 text-left">Ngày Chiếu</th>
                  <th className="px-3 py-2 text-left">Giờ Chiếu</th>
                  <th className="px-3 py-2 text-left">Giá Vé</th>
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
                      <td className="px-3 py-2">{s.movieTitle}</td>
                      <td className="px-3 py-2">{s.roomName}</td>
                      <td className="px-3 py-2">{s.date}</td>
                      <td className="px-3 py-2">{s.time}</td>
                      <td className="px-3 py-2">{s.price?.toLocaleString("vi-VN")} đ</td>
                      <td className="px-3 py-2">{s.status}</td>
                      <td className="px-3 py-2 flex gap-2">
                        <button className="text-blue-600 hover:underline text-xs" onClick={() => alert(`TODO: Sửa suất chiếu id=${s.id}`)}>Sửa</button>
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
