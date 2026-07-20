import React, { useState, useEffect, useMemo } from "react";
import { fetchAllOrders, fetchAllBookings, fetchAllTickets } from "../QuetQRDoAn/QuetQRDoAnService";
import { 
  MdFastfood, 
  MdSearch, 
  MdDateRange, 
  MdCheckCircle, 
  MdAccessTime,
  MdExpandMore,
  MdExpandLess
} from "react-icons/md";
import "./QuanLyDoAn.css";

export default function StaffQuanLyDoAn() {
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState(new Date().toLocaleDateString("en-CA")); // YYYY-MM-DD format
  const [activeTab, setActiveTab] = useState("all"); // "all" | "pending" | "completed"
  const [expandedGroups, setExpandedGroups] = useState({});

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
        const booking = order.bookingId ? bookingsList.find(b => String(b.bookingId || b.BookingId) === String(order.bookingId)) : null;
        
        // Counter purchase detection
        const isCounter = order.orderType === "Staff" || order.orderType === "Counter" || order.orderType === "Takeaway" || booking?.bookingType === "Staff" || order.userName === "Cơ Sở 2" || order.userName === "Hệ Thống Admin" || !order.bookingId;

        const isLocalCompleted = localStorage.getItem("food_pickup_status_" + order.orderId) === "Completed";
        
        // Both ticket orders & standalone counter food orders default to Pending until confirmed via QR/manual code
        let status = (isLocalCompleted || order.status === "Completed") ? "Completed" : "Pending";

        let ticketCode = null;
        if (order.bookingId) {
          const tObj = (ticketsList || []).find(t => String(t.bookingId || t.BookingId) === String(order.bookingId));
          ticketCode = tObj?.ticketCode || tObj?.TicketCode || tObj?.code || tObj?.Code;
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
    // 0. Filter by date
    if (filterDate) {
      const orderDateRaw = order.orderDate || order.createdAt || order.CreatedAt;
      if (orderDateRaw) {
         const orderDateStr = orderDateRaw.split("T")[0];
         if (orderDateStr !== filterDate) return false;
      } else {
         return false; // hide items without date if filter is applied
      }
    }

    // 1. Resolve customer and booking info for searching
    const booking = order.bookingId ? bookings.find(b => String(b.bookingId || b.BookingId) === String(order.bookingId)) : null;
    
    // Check if it's a counter purchase
    const isCounter = order.orderType === "Staff" || order.orderType === "Counter" || order.orderType === "Takeaway" || booking?.bookingType === "Staff" || order.userName === "Cơ Sở 2" || order.userName === "Hệ Thống Admin" || !order.bookingId;

    const customerName = isCounter ? "Khách mua tại quầy" : (booking?.customerName || order.userName || "Khách mua tại quầy");
    const customerEmail = isCounter ? "Tại quầy" : (booking?.email || order.customerEmail || "");
    const movieTitle = booking?.movieTitle || "";
    const seatNumber = booking?.seatNumber || "";
    const itemsText = (order.items?.$values ?? order.items ?? []).map(i => i.foodName || i.comboName || "").join(" ").toLowerCase();
    
    const query = searchQuery.toLowerCase().trim();
    const cleanQuery = query.replace(/\s+/g, "");

    if (query) {
      const orderIdStr = String(order.orderId || "");
      const cbCode = `cb${orderIdStr}`;
      const billCode = `bill${orderIdStr}`;
      const paddedBillCode = `bill${orderIdStr.padStart(6, '0')}`;
      const ticketCodeStr = String(order.ticketCode || "").toLowerCase();
      const cleanTicketCode = ticketCodeStr.replace(/\s+/g, "");
      const bookingIdStr = String(order.bookingId || "").toLowerCase();

      const matchesSearch =
        orderIdStr.includes(query) ||
        cbCode.includes(cleanQuery) ||
        billCode.includes(cleanQuery) ||
        paddedBillCode.includes(cleanQuery) ||
        (ticketCodeStr && (ticketCodeStr.includes(query) || cleanTicketCode.includes(cleanQuery))) ||
        (bookingIdStr && bookingIdStr.includes(query));

      if (!matchesSearch) return false;
    }

    // 2. Tab filter
    const isCompleted = order.status === "Completed" || order.status === "CompletedAtCounter" || order.status === "Đã lấy" || order.status === "Đã nhận";
    if (activeTab === "pending") return !isCompleted;
    if (activeTab === "completed") return isCompleted;
    return true;
  });

  // 3. Group by Food Item
  const groupedOrders = useMemo(() => {
    const groups = {};
    filteredOrders.forEach(order => {
      const items = order.items?.$values ?? order.items ?? [];
      if (items.length === 0) {
          if (!groups["Khác"]) groups["Khác"] = [];
          groups["Khác"].push({ ...order, _matchedItem: null });
      } else {
          items.forEach(item => {
              const itemName = item.foodName ?? item.comboName ?? item.food?.foodName ?? item.combo?.comboName ?? "Món ăn";
              if (!groups[itemName]) groups[itemName] = [];
              groups[itemName].push({ ...order, _matchedItem: item });
          });
      }
    });
    
    const sortedKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b));
    return sortedKeys.map(key => ({
      foodName: key,
      orders: groups[key]
    }));
  }, [filteredOrders]);

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

  function toggleGroup(groupName) {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  }

  return (
    <div className="qld-root">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
          <MdFastfood className="text-orange-500 text-3xl animate-pulse" /> Giám Sát Nhận Đồ Ăn
        </h4>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm text-sm">
            <MdDateRange className="text-gray-400 mr-2 text-lg" />
            <input
              type="date"
              className="bg-transparent border-none outline-none text-gray-700 font-medium cursor-pointer"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          <button 
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
          >
            {loading ? "Đang tải..." : "🔄 Tải lại danh sách"}
          </button>
        </div>
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
              placeholder="Tìm theo mã đơn, mã vé..."
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
          <div className="overflow-x-auto">
            {groupedOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-400 font-medium bg-gray-50 rounded-xl border border-gray-100">
                  Không tìm thấy đơn hàng nào phù hợp
                </div>
            ) : (
               <div className="flex flex-col gap-3">
                  {groupedOrders.map(group => {
                     const isExpanded = expandedGroups[group.foodName] || false;
                     const totalQty = group.orders.reduce((sum, o) => sum + (o._matchedItem?.quantity || 1), 0);
                     
                     return (
                        <div key={group.foodName} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                           <div 
                              className="bg-orange-50/50 px-5 py-3.5 flex justify-between items-center cursor-pointer hover:bg-orange-50 transition-colors"
                              onClick={() => toggleGroup(group.foodName)}
                           >
                              <div className="font-bold text-gray-800 text-base flex items-center gap-2">
                                 🍲 {group.foodName} 
                                 <span className="text-orange-600 bg-orange-100/70 px-2 py-0.5 rounded-full text-sm ml-2">
                                    Tổng: {totalQty} phần
                                 </span>
                              </div>
                              <div className="text-gray-400">
                                {isExpanded ? <MdExpandLess size={24} /> : <MdExpandMore size={24} />}
                              </div>
                           </div>
                           
                           {isExpanded && (
                             <div className="border-t border-gray-100 bg-white">
                               <table className="w-full text-sm border-collapse">
                                  <thead>
                                    <tr className="bg-gray-50/60 border-b border-gray-100 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                                      <th className="px-5 py-3 text-left">Mã Đơn / Mã Vé</th>
                                      <th className="px-5 py-3 text-left">Thời Gian Đặt</th>
                                      <th className="px-5 py-3 text-left">Khách Hàng</th>
                                      <th className="px-5 py-3 text-center">Số lượng</th>
                                      <th className="px-5 py-3 text-center">Trạng Thái</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                     {group.orders.map((order, idx) => {
                                        const booking = order.bookingId ? bookings.find(b => b.bookingId === order.bookingId) : null;
                                        const isCompleted = order.status === "Completed" || order.status === "Đã lấy" || order.status === "Đã nhận";
                                        
                                        const isCounter = order.orderType === "Staff" || order.orderType === "Counter" || order.orderType === "Takeaway" || booking?.bookingType === "Staff" || order.userName === "Cơ Sở 2" || order.userName === "Hệ Thống Admin" || !order.bookingId;
                                        const displayName = isCounter ? "Khách mua tại quầy" : (booking?.customerName || order.userName || "Khách mua tại quầy");
                                        const displayEmail = isCounter ? "" : (booking?.email || order.customerEmail || "");
                                        const showEmail = displayEmail && displayEmail !== "Tại quầy" && displayEmail !== "Không có email" && displayEmail !== "N/A";
                                        const itemQty = order._matchedItem?.quantity || 1;
  
                                        return (
                                          <tr key={`${order.orderId}-${idx}`} className="hover:bg-gray-50/40 transition-colors">
                                             <td className="px-5 py-4 font-bold text-gray-800">
                                               {order.ticketCode ? (
                                                 <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-mono font-bold text-[13px]">
                                                   {order.ticketCode}
                                                 </span>
                                               ) : (
                                                 <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-mono font-bold text-[13px]">
                                                   CB{order.orderId}
                                                 </span>
                                               )}
                                             </td>
                                             <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                                               <div className="flex items-center gap-1.5">
                                                 <MdDateRange className="text-gray-400" />
                                                 {formatDateTime(order.orderDate)}
                                               </div>
                                             </td>
                                             <td className="px-5 py-4">
                                                <div className="font-semibold text-gray-800">{displayName}</div>
                                                {showEmail && <div className="text-[11px] text-gray-400 mt-0.5">{displayEmail}</div>}
                                             </td>
                                             <td className="px-5 py-4 text-center font-bold text-orange-600 text-base">
                                                x{itemQty}
                                             </td>
                                             <td className="px-5 py-4 text-center">
                                                {isCompleted ? (
                                                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border bg-green-50 text-green-700 border-green-200">
                                                    <MdCheckCircle className="text-sm" /> ĐÃ NHẬN
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border bg-orange-50 text-orange-700 border-orange-200">
                                                    <MdAccessTime className="text-sm" /> CHƯA LẤY
                                                  </span>
                                                )}
                                             </td>
                                          </tr>
                                        )
                                     })}
                                  </tbody>
                               </table>
                             </div>
                           )}
                        </div>
                     )
                  })}
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
