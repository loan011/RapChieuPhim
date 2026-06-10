import "./Personnel.css";
import { useEffect, useState } from "react";
import { getEmployeeList, deleteEmployee } from "./employeeService";

export default function NhanVien() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterPos, setFilterPos] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const data = await getEmployeeList();
      setList(data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Bạn có chắc muốn xóa nhân viên này?")) return;
    try {
      await deleteEmployee(id);
      setList((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  const positions = ["Thu ngân", "Bảo vệ", "Nhân viên chiếu phim", "Quản lý"];

  const filtered = list.filter((e) => {
    const matchSearch =
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase());
    const matchPos = filterPos ? e.position === filterPos : true;
    return matchSearch && matchPos;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-xl">Quản Lý Nhân Viên</h4>
        <button
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          onClick={() => alert("TODO: Mở form thêm nhân viên")}
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
            value={filterPos}
            onChange={(e) => setFilterPos(e.target.value)}
          >
            <option value="">Tất cả vị trí</option>
            {positions.map((p) => <option key={p}>{p}</option>)}
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
                  <th className="px-3 py-2 text-left">Điện Thoại</th>
                  <th className="px-3 py-2 text-left">Vị Trí</th>
                  <th className="px-3 py-2 text-left">Trạng Thái</th>
                  <th className="px-3 py-2 text-left">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-6 text-gray-400">Không có dữ liệu</td></tr>
                ) : (
                  filtered.map((e, i) => (
                    <tr key={e.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2">{e.name}</td>
                      <td className="px-3 py-2">{e.email}</td>
                      <td className="px-3 py-2">{e.phone}</td>
                      <td className="px-3 py-2">{e.position}</td>
                      <td className="px-3 py-2">{e.status}</td>
                      <td className="px-3 py-2 flex gap-2">
                        <button className="text-blue-600 hover:underline text-xs" onClick={() => alert(`TODO: Sửa nhân viên id=${e.id}`)}>Sửa</button>
                        <button className="text-red-500 hover:underline text-xs" onClick={() => handleDelete(e.id)}>Xóa</button>
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
