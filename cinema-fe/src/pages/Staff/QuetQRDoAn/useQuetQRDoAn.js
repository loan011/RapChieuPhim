import { useState, useEffect } from "react";
import { fetchTicketByCode, fetchOrdersByBooking, fetchAllOrders, fetchBookingById, updateOrderStatus } from "./QuetQRDoAnService";
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
    try {
      if (cleanCode.includes("%")) {
        cleanCode = decodeURIComponent(cleanCode);
      }
    } catch (e) {}

    // Tự động bóc tách mã vé nếu quét ra link web dạng /ticket-info/TICxxxxx
    if (cleanCode.includes("/ticket-info/")) {
      const parts = cleanCode.split("/ticket-info/");
      cleanCode = parts[parts.length - 1];
    } else if (cleanCode.includes("data=VE:")) {
      const match = cleanCode.match(/data=VE:([^|&]+)/);
      if (match) cleanCode = match[1];
    } else if (cleanCode.includes("VE:")) {
      const match = cleanCode.match(/VE:([^|&]+)/);
      if (match) cleanCode = match[1];
    }

    const codeCandidates = cleanCode
      .split(/[,;\s]+/)
      .map((c) => c.trim())
      .filter(Boolean);

    try {
      // 1. Thử tìm thông tin vé bằng code
      let ticket = null;
      for (const cand of codeCandidates) {
        if (!cand) continue;
        if (!cand.toUpperCase().startsWith("CB") && !cand.toUpperCase().startsWith("BILL")) {
          let res = await fetchTicketByCode(cand);
          if (!res) {
            const numericId = cand.replace(/\D/g, "");
            if (numericId) {
              const booking = await fetchBookingById(numericId);
              if (booking) {
                const bTickets = booking.tickets || booking.Tickets || [];
                const firstT = Array.isArray(bTickets) ? (bTickets[0] || {}) : {};
                res = {
                  ...firstT,
                  ticketId: firstT.ticketId || firstT.TicketId || booking.bookingId || booking.BookingId,
                  ticketCode: firstT.ticketCode || firstT.TicketCode || `BK${booking.bookingId || booking.BookingId}`,
                  bookingId: booking.bookingId || booking.BookingId,
                  movieTitle: booking.movieTitle || booking.showTime?.movie?.title || booking.showtime?.movie?.title || "—",
                  roomName: booking.roomName || booking.showTime?.room?.roomName || booking.showtime?.room?.roomName || "—",
                  seatCode: booking.seatCode || booking.seatNumber || (booking.seat ? `${booking.seat.seatRow || ""}${booking.seat.seatNumber || ""}` : "—"),
                  customerName: booking.customerName || booking.userName || booking.user?.fullName || "—",
                  price: booking.totalAmount || booking.price || 0,
                  status: firstT.status || firstT.Status || booking.status || booking.Status || "Active",
                  startTime: booking.startTime || booking.showtime?.startTime,
                  endTime: booking.endTime || booking.showtime?.endTime
                };
              }
            }
          }
          if (res) {
            ticket = res;
            break;
          }
        }
      }

      if (ticket) {
        const bookingId = ticket.bookingId ?? ticket.BookingId;
        let booking = null;
        if (bookingId) {
          booking = await fetchBookingById(bookingId);
        }

        setTicketDetails({
          ...ticket,
          movieTitle: ticket.movieTitle || booking?.movieTitle || "—",
          roomName: ticket.roomName || booking?.roomName || "—",
          seatCode: ticket.seatCode || booking?.seatNumber || "—",
          customerName: ticket.customerName || booking?.customerName || "—"
        });

        // Check showtime expiration for ticket food (only valid BEFORE and DURING showtime)
        const rawStartTime = ticket.startTime || ticket.showtime || ticket.showTime || ticket.startTimeDate || booking?.startTime || booking?.showtime || booking?.bookingDate;
        const rawEndTime = ticket.endTime || ticket.showtimeEnd || ticket.endTimeDate || booking?.endTime;

        let isShowtimeExpired = false;
        let startDate = rawStartTime ? new Date(rawStartTime) : null;
        let endDate = rawEndTime ? new Date(rawEndTime) : null;

        if (startDate && !isNaN(startDate.getTime())) {
          if (!endDate || isNaN(endDate.getTime())) {
            endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
          }
          if (new Date() > endDate) {
            isShowtimeExpired = true;
          }
        }

        if (bookingId) {
          // 2. Tìm tất cả đơn hàng (food/combo) của booking đó
          const bookingOrders = await fetchOrdersByBooking(bookingId);
          
          // Ưu tiên báo không có đồ ăn TRƯỚC khi báo hết hạn
          if (bookingOrders.length === 0) {
            setOrders([]);
            if (isShowtimeExpired) {
              // Hết hạn VÀ không có đồ ăn → báo cả hai
              setStatusMessage({
                type: "error",
                text: `❌ Vé ${ticket.ticketCode || ticket.code || cleanCode} ĐÃ HẾT HẠN SUẤT CHIẾU (kết thúc lúc ${endDate ? endDate.toLocaleString("vi-VN") : ""}) và không có đồ ăn/combo nào được đặt kèm theo vé này.`
              });
            } else {
              // Còn trong giờ nhưng không có đồ ăn
              setStatusMessage({
                type: "warning",
                text: `Vé hợp lệ, nhưng không tìm thấy đơn hàng đồ ăn/combo nào cho vé này.`
              });
            }
          } else {
            const mappedOrders = bookingOrders.map(o => {
              const isCompleted = localStorage.getItem("food_pickup_status_" + o.orderId) === "Completed";
              return {
                ...o,
                status: isCompleted ? "Completed" : "Pending",
                isExpired: isShowtimeExpired
              };
            });
            
            setOrders(mappedOrders);

            if (isShowtimeExpired) {
              setStatusMessage({
                type: "error",
                text: `❌ CẢNH BÁO: Đơn đồ ăn theo vé ${ticket.ticketCode || ticket.code || cleanCode} ĐÃ HẾT HẠN QUÉT! Suất chiếu này (kết thúc lúc ${endDate ? endDate.toLocaleString("vi-VN") : ""}) đã qua. Đồ ăn mua kèm vé chỉ được quét nhận trước và trong suất chiếu.`
              });
            } else {
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
          }
        } else {
          setStatusMessage({
            type: "error",
            text: "Không tìm thấy thông tin Booking liên kết với vé này."
          });
        }
      } else {
        // 2. Nếu không tìm thấy vé (hoặc nhập mã đơn dạng CB73 / 73 / BILL73), tìm trực tiếp trong danh sách Orders
        const allOrders = await fetchAllOrders();
        const rawCode = cleanCode.toLowerCase();
        const numericIdStr = cleanCode.replace(/\D/g, "");

        const foundOrder = allOrders.find(o => {
          const oIdStr = String(o.orderId || "");
          return (
            (numericIdStr && oIdStr === numericIdStr) ||
            oIdStr === cleanCode ||
            `cb${oIdStr}` === rawCode ||
            `bill${oIdStr}` === rawCode ||
            `bill${oIdStr.padStart(6, '0')}` === rawCode ||
            (o.orderCode && String(o.orderCode).toLowerCase() === rawCode)
          );
        });

        if (foundOrder) {
          const isCompleted = localStorage.getItem("food_pickup_status_" + foundOrder.orderId) === "Completed" || foundOrder.status === "Completed";
          
          // Check 24h validity for standalone food orders
          const rawOrderDate = foundOrder.orderDate || foundOrder.createdAt || foundOrder.date;
          let isOrder24hExpired = false;

          if (rawOrderDate) {
            const orderTime = new Date(rawOrderDate);
            if (!isNaN(orderTime.getTime())) {
              const hoursDiff = (new Date().getTime() - orderTime.getTime()) / (1000 * 60 * 60);
              if (hoursDiff > 24) {
                isOrder24hExpired = true;
              }
            }
          }

          const mappedOrder = {
            ...foundOrder,
            status: isCompleted ? "Completed" : "Pending",
            isExpired: isOrder24hExpired
          };

          setTicketDetails({
            ticketCode: `CB${foundOrder.orderId}`,
            customerName: foundOrder.userName || "Khách mua tại quầy",
            movieTitle: "Đơn hàng đồ ăn bán tại quầy",
            roomName: "Tại Quầy",
            seatCode: "N/A"
          });

          setOrders([mappedOrder]);

          if (isOrder24hExpired) {
            setStatusMessage({
              type: "error",
              text: `❌ CẢNH BÁO: Đơn hàng đồ ăn CB${foundOrder.orderId} ĐÃ HẾT HẠN 24H! (Thời gian đặt: ${rawOrderDate ? new Date(rawOrderDate).toLocaleString("vi-VN") : ""}). Đồ ăn mua riêng tại quầy chỉ có hiệu lực trong vòng 24 giờ kể từ lúc mua.`
            });
          } else if (isCompleted) {
            setStatusMessage({
              type: "warning",
              text: `Thông báo: Đơn hàng đồ ăn CB${foundOrder.orderId} đã được nhận trước đó!`
            });
          } else {
            setStatusMessage({
              type: "success",
              text: `Tìm thấy đơn hàng CB${foundOrder.orderId}! Vui lòng kiểm tra các món bên dưới và bấm xác nhận lấy đồ ăn.`
            });
          }
        } else {
          setStatusMessage({
            type: "error",
            text: "Không tìm thấy vé hoặc mã đơn hàng đồ ăn (mã CB...) trong hệ thống. Vui lòng kiểm tra lại mã!"
          });
        }
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

    const targetOrder = orders.find(o => o.orderId === orderId);
    if (targetOrder && targetOrder.isExpired) {
      setStatusMessage({
        type: "error",
        text: "❌ Không thể xác nhận lấy đồ ăn cho đơn hàng đã hết hạn!"
      });
      return;
    }
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
