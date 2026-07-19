import { useState, useEffect } from "react";
import { fetchTicketByCode, fetchOrdersByBooking, updateOrderStatus } from "./QuetQRDoAnService";
import { getTicketList } from "../../Admin/Ticket/ticketService";

export function useQuetQRDoAn() {
  const [ticketCode, setTicketCode] = useState("");
  const [ticketDetails, setTicketDetails] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]); // For simulation
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    loadAllTickets();
  }, []);

  async function loadAllTickets() {
    try {
      const data = await getTicketList();
      const list = Array.isArray(data) ? data : data?.$values || data?.data || [];
      setTickets(list);
    } catch (err) {
      console.error("Error loading tickets for simulation:", err);
    }
  }

  async function handleFindTicket(code) {
    if (!code.trim()) return;
    setLoading(true);
    setStatusMessage(null);
    setTicketDetails(null);
    setOrders([]);

    let cleanCode = code.trim();
    // Tự động bóc tách mã vé nếu quét ra link web dạng /ticket-info/TICxxxxx
    if (cleanCode.includes("/ticket-info/")) {
      const parts = cleanCode.split("/ticket-info/");
      cleanCode = parts[parts.length - 1];
    } else if (cleanCode.includes("data=VE:")) {
      const match = cleanCode.match(/data=VE:([^|&]+)/);
      if (match) cleanCode = match[1];
    } else if (cleanCode.startsWith("VE:")) {
      const match = cleanCode.match(/VE:([^|]+)/);
      if (match) cleanCode = match[1];
    }

    try {
      // 1. Tìm thông tin vé bằng code
      const ticket = await fetchTicketByCode(cleanCode);

      if (ticket) {
        setTicketDetails(ticket);
        const bookingId = ticket.bookingId ?? ticket.BookingId;

        if (bookingId) {
          // 2. Tìm tất cả đơn hàng (food/combo) của booking đó
          const bookingOrders = await fetchOrdersByBooking(bookingId);
          
          // Áp dụng trạng thái lấy đồ ăn từ LocalStorage (vì Backend chỉ cho phép: Pending | Confirmed | Cancelled)
          const mappedOrders = bookingOrders.map(o => {
            if (localStorage.getItem("food_pickup_status_" + o.orderId) === "Completed") {
              return { ...o, status: "Completed" };
            }
            return o;
          });
          
          setOrders(mappedOrders);

          if (mappedOrders.length === 0) {
            setStatusMessage({
              type: "warning",
              text: `Vé hợp lệ, nhưng không tìm thấy đơn hàng đồ ăn/combo nào cho vé này.`
            });
          } else {
            // Kiểm tra xem đã lấy hết đồ ăn chưa
            const allCompleted = mappedOrders.every(o => o.status === "Completed" || o.status === "Đã lấy" || o.status === "Đã nhận");
            if (allCompleted) {
              setStatusMessage({
                type: "warning",
                text: "Thông báo: Đơn hàng đồ ăn của vé này đã được nhận trước đó!"
              });
            } else {
              setStatusMessage({
                type: "success",
                text: "Tìm thấy đơn hàng! Vui lòng kiểm tra các món bên dưới và bấm xác nhận lấy đồ ăn."
              });
            }
          }
        } else {
          setStatusMessage({
            type: "error",
            text: "Không tìm thấy thông tin Booking liên kết với vé này."
          });
        }
      } else {
        setStatusMessage({
          type: "error",
          text: "Không tìm thấy vé trong hệ thống. Vui lòng kiểm tra lại mã vé!"
        });
      }
    } catch (err) {
      console.error("Error in handleFindTicket (Food):", err);
      setStatusMessage({
        type: "error",
        text: "Có lỗi xảy ra khi tìm kiếm vé và đơn hàng. Vui lòng thử lại!"
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmPickup(orderId) {
    if (!orderId) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      // Vì Backend chỉ chấp nhận Pending | Confirmed | Cancelled, 
      // ta lưu trạng thái đã giao đồ ăn vào LocalStorage để đồng bộ giao diện
      localStorage.setItem("food_pickup_status_" + orderId, "Completed");

      // Cập nhật state cục bộ để giao diện thay đổi ngay lập tức
      setOrders(prevOrders =>
        prevOrders.map(o => o.orderId === orderId ? { ...o, status: "Completed" } : o)
      );

      setStatusMessage({
        type: "success",
        text: `Đơn hàng #${orderId} đã được xác nhận khách lấy đồ ăn thành công!`
      });
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.message || "Xác nhận nhận đồ ăn thất bại."
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSimulateScan() {
    if (tickets.length === 0) {
      alert("Đang tải danh sách vé, vui lòng thử lại sau!");
      return;
    }
    
    // Tìm các vé có đơn hàng đồ ăn để test cho tiện
    // Nếu không có, chọn vé ngẫu nhiên
    const randomTicket = tickets[Math.floor(Math.random() * tickets.length)];
    if (!randomTicket) return;
    
    const code = randomTicket.code || randomTicket.ticketCode || `VE${randomTicket.id || randomTicket.ticketId}`;
    setTicketCode(code);
    handleFindTicket(code);
  }

  return {
    ticketCode,
    setTicketCode,
    ticketDetails,
    orders,
    loading,
    statusMessage,
    setStatusMessage,
    handleFindTicket,
    handleConfirmPickup,
    handleSimulateScan,
  };
}
