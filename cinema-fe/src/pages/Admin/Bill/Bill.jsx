import "./Bill.css";
import { useEffect, useState } from "react";
import { getInvoiceList } from "./invoiceService";

const STATUS_OPTIONS = ["Đã thanh toán", "Chờ thanh toán", "Đã hủy"];

const MOCK_BILLS = [
  { id: 1, code: "HD001", customerName: "Nguyễn Văn A", totalAmount: 150000, status: "Đã thanh toán", createdAt: "2024-06-01" },
  { id: 2, code: "HD002", customerName: "Trần Thị B", totalAmount: 220000, status: "Đã thanh toán", createdAt: "2024-06-05" },
  { id: 3, code: "HD003", customerName: "Lê Văn C", totalAmount: 80000, status: "Chờ thanh toán", createdAt: "2024-06-10" },
];

export default function HoaDon() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const data = await getInvoiceList();
      setList(data ?? []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = list.filter((h) => {
    const matchSearch =
      h.code?.toLowerCase().includes(search.toLowerCase()) ||
      h.customerName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? h.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-xl">Quản Lý Hóa Đơn</h4>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            placeholder="Tìm mã hóa đơn, khách hàng..."
            className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-40"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
                  <th className="px-3 py-2 text-left">Mã HĐ</th>
                  <th className="px-3 py-2 text-left">Khách Hàng</th>
                  <th className="px-3 py-2 text-left">Tổng Tiền</th>
                  <th className="px-3 py-2 text-left">Phương Thức TT</th>
                  <th className="px-3 py-2 text-left">Ngày Tạo</th>
                  <th className="px-3 py-2 text-left">Trạng Thái</th>
                  <th className="px-3 py-2 text-left">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-6 text-gray-400">Không có dữ liệu</td></tr>
                ) : (
                  filtered.map((h, i) => (
                    <tr key={h.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2">{h.code}</td>
                      <td className="px-3 py-2">{h.customerName}</td>
                      <td className="px-3 py-2">{h.totalAmount?.toLocaleString("vi-VN")} đ</td>
                      <td className="px-3 py-2">{h.paymentMethod}</td>
                      <td className="px-3 py-2">{h.createdAt}</td>
                      <td className="px-3 py-2">{h.status}</td>
                      <td className="px-3 py-2">
                        <button className="text-blue-600 hover:underline text-xs" onClick={() => alert(`TODO: Xem chi tiết hóa đơn id=${h.id}`)}>Chi tiết</button>
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
