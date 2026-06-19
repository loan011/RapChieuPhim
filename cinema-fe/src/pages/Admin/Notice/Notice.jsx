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
    <div className="p-1">
      <h4 className="font-bold text-2xl text-gray-800 mb-6">Thông Báo Đến Người Dùng</h4>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form gửi thông báo */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
          <h5 className="font-bold text-lg text-gray-800 mb-5 pb-3 border-b border-gray-50 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-blue-600 rounded-full"></span>
            Gửi Thông Báo Mới
          </h5>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tiêu Đề</label>
              <input
                type="text"
                required
                placeholder="Nhập tiêu đề thông báo"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all duration-200"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Người Nhận</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all duration-200 bg-white cursor-pointer"
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                >
                  <option value="all">Tất cả người dùng</option>
                  <option value="customers">Chỉ khách hàng</option>
                  <option value="staff">Chỉ nhân viên</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Loại Thông Báo</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all duration-200 bg-white cursor-pointer"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="info">Thông tin ℹ️</option>
                  <option value="promotion">Khuyến mãi 🎁</option>
                  <option value="warning">Cảnh báo ⚠️</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nội Dung</label>
              <textarea
                required
                rows={4}
                placeholder="Nhập nội dung chi tiết của thông báo..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all duration-200"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold py-2.5 rounded-xl text-sm transition-all duration-150 shadow-md shadow-blue-100 hover:shadow-lg hover:shadow-blue-200"
            >
              Gửi Thông Báo
            </button>
          </form>
        </div>

        {/* Lịch sử thông báo */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
          <h5 className="font-bold text-lg text-gray-800 mb-5 pb-3 border-b border-gray-50 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-purple-500 rounded-full"></span>
            Lịch Sử Đã Gửi
          </h5>
          {loading && (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-400 text-sm animate-pulse">Đang tải lịch sử thông báo...</p>
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}
          {!loading && !error && history.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">Chưa có thông báo nào được gửi.</p>
            </div>
          )}
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {history.map((n) => {
              const bgClass = 
                n.type === "warning" ? "bg-amber-50/50 border-amber-100" :
                n.type === "promotion" ? "bg-emerald-50/50 border-emerald-100" :
                "bg-blue-50/50 border-blue-100";
              const dotColor = 
                n.type === "warning" ? "bg-amber-400" :
                n.type === "promotion" ? "bg-emerald-500" :
                "bg-blue-500";
              return (
                <div 
                  key={n.id} 
                  className={`border rounded-xl p-4 flex justify-between items-start gap-4 transition-all duration-200 hover:shadow-sm ${bgClass}`}
                >
                  <div className="flex gap-2.5">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotColor}`}></span>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm leading-tight mb-1">{n.title}</p>
                      <p className="text-gray-600 text-xs leading-normal">{n.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] bg-white border border-gray-100 text-gray-400 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                          {n.target === "customers" ? "Khách hàng" : n.target === "staff" ? "Nhân viên" : "Tất cả"}
                        </span>
                        <span className="text-gray-400 text-[10px]">{n.createdAt}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg text-xs shrink-0 font-medium transition-colors"
                    onClick={() => handleDelete(n.id)}
                  >
                    Xóa
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
