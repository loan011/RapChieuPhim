import "./Customer.css";
import { useEffect, useState } from "react";
import { getCustomerList, deleteCustomer } from "./customerService";

export default function KhachHang() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const data = await getCustomerList();
      setList(data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Bạn có chắc muốn xóa khách hàng này?")) return;
    try {
      await deleteCustomer(id);
      setList((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  const filtered = list.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-xl">Quản Lý Khách Hàng</h4>
        <button
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          onClick={() => alert("TODO: Mở form thêm khách hàng")}
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
                  <th className="px-3 py-2 text-left">Điểm Tích Lũy</th>
                  <th className="px-3 py-2 text-left">Ngày Đăng Ký</th>
                  <th className="px-3 py-2 text-left">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-6 text-gray-400">Không có dữ liệu</td></tr>
                ) : (
                  filtered.map((c, i) => (
                    <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2">{c.name}</td>
                      <td className="px-3 py-2">{c.email}</td>
                      <td className="px-3 py-2">{c.phone}</td>
                      <td className="px-3 py-2">{c.points}</td>
                      <td className="px-3 py-2">{c.registeredAt}</td>
                      <td className="px-3 py-2 flex gap-2">
                        <button className="text-blue-600 hover:underline text-xs" onClick={() => alert(`TODO: Sửa khách hàng id=${c.id}`)}>Sửa</button>
                        <button className="text-red-500 hover:underline text-xs" onClick={() => handleDelete(c.id)}>Xóa</button>
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
