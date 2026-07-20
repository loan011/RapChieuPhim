import React, { useState, useEffect } from "react";
import { fetchAllOrders, fetchAllBookings, fetchAllTickets } from "../QuetQRDoAn/QuetQRDoAnService";
import { 
  MdFastfood, 
  MdSearch, 
  MdDateRange, 
  MdCheckCircle, 
  MdAccessTime
} from "react-icons/md";
import "./QuanLyDoAn.css";

export default function StaffQuanLyDoAn() {
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "pending" | "completed"

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      
      const [ordersList, bookingsList, ticketsList] = await Promise.all([
        fetchAllOrders(),
        fetchAllBookings(),
        fetchAllTickets()
      ]);

      // Map orders with local storage pickup status & ticket codes
      const mappedOrders = ordersList.map(order => {
        const booking = order.bookingId ? bookingsList.find(b => b.bookingId === order.bookingId) : null;
        
        // Counter purchase detection
        const isCounter = order.orderType === "Staff" || order.orderType === "Counter" || order.orderType === "Takeaway" || booking?.bookingType === "Staff" || order.userName === "Cơ Sở 2" || order.userName === "Hệ Thống Admin" || !order.bookingId;

        const isLocalCompleted = localStorage.getItem("food_pickup_status_" + order.orderId) === "Completed";
        
        // Resolve status: Counter purchases are automatically CompletedAtCounter
        let status = order.status || "Confirmed";
        if (isCounter) {
          status = "CompletedAtCounter";
        } else if (isLocalCompleted) {
          status = "Completed";
        }

        let ticketCode = null;
        if (order.bookingId) {
          const tObj = (ticketsList || []).find(t => t.bookingId === order.bookingId);
          ticketCode = tObj?.ticketCode || tObj?.code;
        }

        return {
          ...order,
          status,
          ticketCode,
          isCounter
        };
      });

      setOrders(mappedOrders);
      setBookings(bookingsList);
    } catch (err) {
      console.error("Error loading pickup data:", err);
      setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  }

  // Filter and search logic
  const filteredOrders = orders.filter(order => {
    // 1. Resolve customer and booking info for searching
    const booking = order.bookingId ? bookings.find(b => b.bookingId === order.bookingId) : null;
    
    // Check if it's a counter purchase
    const isCounter = order.orderType === "Staff" || order.orderType === "Counter" || order.orderType === "Takeaway" || booking?.bookingType === "Staff" || order.userName === "Cơ Sở 2" || order.userName === "Hệ Thống Admin" || !order.bookingId;

    const customerName = isCounter ? "Khách mua tại quầy" : (booking?.customerName || order.userName || "Khách mua tại quầy");
    const customerEmail = isCounter ? "Tại quầy" : (booking?.email || order.customerEmail || "");
    const movieTitle = booking?.movieTitle || "";
    const seatNumber = booking?.seatNumber || "";
    const itemsText = (order.items || []).map(i => i.foodName || i.comboName || "").join(" ").toLowerCase();
    
    // Resolve order/ticket display code
    const orderDisplayCode = order.ticketCode ? order.ticketCode : `CB${order.orderId}`;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      String(order.orderId).includes(query) ||
      orderDisplayCode.toLowerCase().includes(query) ||
      customerName.toLowerCase().includes(query) ||
      customerEmail.toLowerCase().includes(query) ||
      movieTitle.toLowerCase().includes(query) ||
      seatNumber.toLowerCase().includes(query) ||
      itemsText.includes(query);

    if (!matchesSearch) return false;

    // 2. Tab filter
    const isCompleted = order.status === "Completed" || order.status === "CompletedAtCounter" || order.status === "Đã lấy" || order.status === "Đã nhận";
    if (activeTab === "pending") return !isCompleted;
    if (activeTab === "completed") return isCompleted;
    return true;
  });

  function formatDateTime(rawDate) {
    if (!rawDate) return "—";
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return "—";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${min} ${dd}/${mm}/${yyyy}`;
  }

  return (
    <div className="qld-root">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
          <MdFastfood className="text-orange-500 text-3xl animate-pulse" /> Giám Sát Nhận Đồ Ăn
        </h4>
        <button 
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
        >
          {loading ? "Đang tải..." : "🔄 Tải lại danh sách"}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {/* Search & Tabs Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Tabs Filter */}
          <div className="flex bg-gray-100/80 p-1 rounded-xl w-fit">
            {[
              { id: "all", label: "Tất cả đơn", count: orders.length },
              { id: "pending", label: "Chưa lấy đồ", count: orders.filter(o => o.status !== "Completed" && o.status !== "CompletedAtCounter" && o.status !== "Đã lấy" && o.status !== "Đã nhận").length },
              { id: "completed", label: "Đã lấy đồ", count: orders.filter(o => o.status === "Completed" || o.status === "CompletedAtCounter" || o.status === "Đã lấy" || o.status === "Đã nhận").length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab.id 
                    ? "bg-white text-orange-600 shadow-sm" 
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 text-lg pointer-events-none">
              <MdSearch />
            </span>
            <input
              type="text"
              placeholder="Tìm tên khách, số ghế, món ăn, mã đơn..."
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50/30 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 text-sm">
            <span className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-orange-500 rounded-full mb-3"></span>
            Đang tải dữ liệu đơn hàng đồ ăn...
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100 text-gray-655 font-semibold">
                  <th className="px-4 py-3 text-left">Mã Đơn / Mã Vé</th>
                  <th className="px-4 py-3 text-left">Thời Gian Đặt</th>
                  <th className="px-4 py-3 text-left">Khách Hàng</th>
                  <th className="px-4 py-3 text-left">Chi Tiết Đồ Ăn / Combo</th>
                  <th className="px-4 py-3 text-right">Giá Tiền</th>
                  <th className="px-4 py-3 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400 font-medium">
                      Không tìm thấy đơn hàng nào phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const booking = order.bookingId ? bookings.find(b => b.bookingId === order.bookingId) : null;
                    const items = order.items?.$values ?? order.items ?? [];
                    const isCompleted = order.status === "Completed" || order.status === "Đã lấy" || order.status === "Đã nhận";

                    return (
                      <tr key={order.orderId} className="hover:bg-gray-50/40 transition-colors">
                        {/* Order ID / Ticket Code */}
                        <td className="px-4 py-4 font-bold text-gray-800">
                          {order.ticketCode ? (
                            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-100 font-mono font-bold">
                              {order.ticketCode}
                            </span>
                          ) : (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs border border-amber-100 font-mono font-bold">
                              CB{order.orderId}
                            </span>
                          )}
                        </td>

                        {/* Order Date */}
                        <td className="px-4 py-4 text-gray-500">
                          <div className="flex items-center gap-1">
                            <MdDateRange className="text-gray-400" />
                            {formatDateTime(order.orderDate)}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          {(() => {
                            const isCounter = order.orderType === "Staff" || order.orderType === "Counter" || order.orderType === "Takeaway" || booking?.bookingType === "Staff" || order.userName === "Cơ Sở 2" || order.userName === "Hệ Thống Admin" || !order.bookingId;
                            const displayName = isCounter ? "Khách mua tại quầy" : (booking?.customerName || order.userName || "Khách mua tại quầy");
                            const displayEmail = isCounter ? "Tại quầy" : (booking?.email || order.customerEmail || "Không có email");
                            return (
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0">
                                  {displayName.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-800">
                                    {displayName}
                                  </div>
                                  <div className="text-[11px] text-gray-405">
                                    {displayEmail}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </td>


                        {/* Food Items */}
                        <td className="px-4 py-4 text-gray-600">
                          <div className="space-y-1">
                            {items.length === 0 ? (
                              <span className="italic text-gray-400">Không có chi tiết</span>
                            ) : (
                              items.map((item, idx) => {
                                const itemName = item.foodName ?? item.comboName ?? item.food?.foodName ?? item.combo?.comboName ?? "Món ăn";
                                return (
                                  <div key={idx} className="flex items-center gap-1 text-xs">
                                    <span className="text-gray-400">•</span>
                                    <span>{itemName}</span>
                                    <span className="font-bold text-gray-800">x{item.quantity}</span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-4 text-right font-bold text-gray-800">
                          {(order.totalAmount || 0).toLocaleString("vi-VN")} đ
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-4 text-center">
                          {order.status === "CompletedAtCounter" ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border bg-green-50 text-green-700 border-green-150">
                              <MdCheckCircle className="text-sm" /> ĐÃ NHẬN TẠI QUẦY
                            </span>
                          ) : isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border bg-green-50 text-green-700 border-green-150">
                              <MdCheckCircle className="text-sm" /> ĐÃ LẤY ĐỒ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border bg-orange-50 text-orange-855 border-orange-100">
                              <MdAccessTime className="text-sm" /> CHƯA LẤY ĐỒ
                            </span>
                          )}
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
    </div>
  );
}
