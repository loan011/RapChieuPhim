import "./Notice.css";
import { useEffect, useState } from "react";
import { getNotificationList, sendNotification, deleteNotification } from "./notificationService";

export default function ThongBao() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    title: "",
    target: "all",
    type: "info",
    content: "",
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      setLoading(true);
      const data = await getNotificationList();
      setHistory(data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    try {
      const sent = await sendNotification(form);
      setHistory((prev) => [sent, ...prev]);
      setForm({ title: "", target: "all", type: "info", content: "" });
      alert("Gửi thông báo thành công!");
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Bạn có chắc muốn xóa thông báo này?")) return;
    try {
      await deleteNotification(id);
      setHistory((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <h4 className="font-bold text-xl mb-6">Thông Báo Đến User</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form gửi thông báo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h5 className="font-semibold text-gray-700 mb-4">Gửi Thông Báo</h5>
          <form onSubmit={handleSend} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tiêu Đề</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Người Nhận</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
              >
                <option value="all">Tất cả người dùng</option>
                <option value="customers">Chỉ khách hàng</option>
                <option value="staff">Chỉ nhân viên</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Loại Thông Báo</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="info">Thông tin</option>
                <option value="promotion">Khuyến mãi</option>
                <option value="warning">Cảnh báo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nội Dung</label>
              <textarea
                required
                rows={4}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700">
              Gửi Thông Báo
            </button>
          </form>
        </div>

        {/* Lịch sử thông báo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h5 className="font-semibold text-gray-700 mb-4">Lịch Sử Thông Báo</h5>
          {loading && <p className="text-gray-500 text-sm">Đang tải...</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {!loading && !error && history.length === 0 && (
            <p className="text-gray-400 text-sm">Chưa có thông báo nào.</p>
          )}
          <div className="space-y-3">
            {history.map((n) => (
              <div key={n.id} className="border border-gray-100 rounded p-3 flex justify-between items-start gap-2">
                <div>
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{n.content}</p>
                  <p className="text-gray-400 text-xs mt-1">{n.createdAt}</p>
                </div>
                <button
                  className="text-red-400 hover:text-red-600 text-xs shrink-0"
                  onClick={() => handleDelete(n.id)}
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
