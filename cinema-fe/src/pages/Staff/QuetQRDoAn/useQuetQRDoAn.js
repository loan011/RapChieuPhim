import { useState, useEffect } from "react";
import { fetchTicketByCode, fetchOrdersByBooking, fetchAllOrders, fetchBookingById, updateOrderStatus } from "./QuetQRDoAnService";
import { getTicketList } from "../../Admin/Ticket/ticketService";
import { cachedFetch, getApiUrl } from "../../../services/apiHelper";

const API_URL = getApiUrl();

function normalizeArray(arr) {
  if (!arr) return [];
  if (Array.isArray(arr)) return arr;
  if (arr.$values && Array.isArray(arr.$values)) return arr.$values;
  return [];
}

export function useQuetQRDoAn() {
  const [ticketCode, setTicketCode] = useState("");
  const [ticketDetails, setTicketDetails] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]); // For simulation
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

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
      // Fetch foods and combos catalogs to resolve names
      let allFoods = [];
      let allCombos = [];
      try {
        const [fData, cData] = await Promise.all([
          cachedFetch(`${API_URL}/Foods/Available`),
          cachedFetch(`${API_URL}/Combos/Available`)
        ]);
        const fUnwrapped = fData?.data ?? fData?.Data ?? fData?.result ?? fData?.Result ?? fData;
        const cUnwrapped = cData?.data ?? cData?.Data ?? cData?.result ?? cData?.Result ?? cData;
        allFoods = normalizeArray(fUnwrapped);
        allCombos = normalizeArray(cUnwrapped);
      } catch (e) {
        console.warn("Failed to load catalogs in QR scanner:", e);
      }

      // 1. Thử tìm thông tin vé bằng code từ API
      let ticket = null;
      if (!cleanCode.toUpperCase().startsWith("CB") && !cleanCode.toUpperCase().startsWith("BILL")) {
        ticket = await fetchTicketByCode(cleanCode);
      }

      // Tra cứu dự phòng trong localStorage (customer_ticket_discounts & rapchieuphim_tickets)
      let savedInfo = {};
      try {
        const savedDiscounts = JSON.parse(localStorage.getItem("customer_ticket_discounts") || "{}");
        const codeKey = cleanCode;
        const matchKey = Object.keys(savedDiscounts).find(k => k.toLowerCase() === codeKey.toLowerCase());
        if (matchKey) savedInfo = savedDiscounts[matchKey];
        else if (ticket?.bookingId && savedDiscounts[ticket.bookingId]) savedInfo = savedDiscounts[ticket.bookingId];
      } catch (e) {}

      let savedTicketLocal = null;
      try {
        const storedT = JSON.parse(localStorage.getItem("rapchieuphim_tickets") || "[]");
        savedTicketLocal = storedT.find(t => {
          const c = String(t.ticketCode || t.code || t.bookingId || t.id || "").toLowerCase();
          return c === cleanCode.toLowerCase();
        });
      } catch (e) {}

      if (!ticket && (savedInfo.customerName || savedTicketLocal || savedInfo.seatPrice)) {
        ticket = {
          ticketCode: cleanCode,
          ...savedTicketLocal,
          ...savedInfo
        };
      }

      let rawOrders = [];
      let customerName = "";
      let dateBooked = "";
      let isExpired = false;
      let expiredMessage = "";
      let orderIdForPickup = cleanCode;

      if (ticket) {
        const bookingId = ticket.bookingId ?? ticket.BookingId;
        let booking = null;
        if (bookingId) {
          booking = await fetchBookingById(bookingId);
        }

        customerName =
          ticket.customerName ||
          savedInfo.customerName ||
          savedTicketLocal?.customerName ||
          booking?.customerName ||
          ticket.email ||
          savedInfo.email ||
          "Khách hàng";

        const rawDate =
          ticket.dateBooked ||
          savedInfo.createdAt ||
          savedTicketLocal?.paymentDate ||
          savedTicketLocal?.createdAt ||
          booking?.bookingDate ||
          ticket.startTimeDate ||
          ticket.createdAt;

        dateBooked = rawDate ? new Date(rawDate).toLocaleString("vi-VN") : "—";

        // Check showtime expiration for ticket food (only valid BEFORE and DURING showtime)
        const rawStartTime =
          ticket.startTime ||
          savedInfo.startTime ||
          ticket.showtime ||
          ticket.showTime ||
          ticket.startTimeDate ||
          booking?.startTime ||
          booking?.showtime ||
          booking?.bookingDate;

        const rawEndTime = ticket.endTime || ticket.showtimeEnd || ticket.endTimeDate || booking?.endTime;

        let startDate = rawStartTime ? new Date(rawStartTime) : null;
        let endDate = rawEndTime ? new Date(rawEndTime) : null;

        if (startDate && !isNaN(startDate.getTime())) {
          if (!endDate || isNaN(endDate.getTime())) {
            endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
          }
          if (new Date() > endDate) {
            isExpired = true;
            expiredMessage = `❌ Vé ${ticket.ticketCode || ticket.code || cleanCode} ĐÃ HẾT HẠN SUẤT CHIẾU (kết thúc lúc ${endDate.toLocaleString("vi-VN")}) và không thể nhận đồ ăn.`;
          }
        }

        if (bookingId) {
          rawOrders = await fetchOrdersByBooking(bookingId);
          if (rawOrders.length > 0) {
            orderIdForPickup = rawOrders[0].orderId;
          }
        }

        // Nếu rawOrders từ API chưa có, lấy từ foodsList lưu cục bộ trên vé
        const localFoodsList =
          (savedInfo.foodsList && savedInfo.foodsList.length > 0) ? savedInfo.foodsList :
          (savedTicketLocal?.foodsList && savedTicketLocal.foodsList.length > 0) ? savedTicketLocal.foodsList :
          (ticket.foodsList && ticket.foodsList.length > 0) ? ticket.foodsList :
          (ticket.foods && ticket.foods.length > 0) ? ticket.foods :
          (ticket.bookingFoods && ticket.bookingFoods.length > 0) ? ticket.bookingFoods : [];

        if (rawOrders.length === 0 && localFoodsList.length > 0) {
          rawOrders = [{
            orderId: ticket.ticketCode || cleanCode,
            items: localFoodsList,
            status: ticket.status === "Completed" ? "Completed" : "Pending"
          }];
          orderIdForPickup = ticket.ticketCode || cleanCode;
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
          rawOrders = [foundOrder];
          orderIdForPickup = foundOrder.orderId;
          
          customerName = (foundOrder.userName === "Đồng Khởi" || foundOrder.userName?.startsWith("Cinema") || !foundOrder.userName) ? "Khách mua tại quầy" : foundOrder.userName;
          
          const rawOrderDate = foundOrder.orderDate || foundOrder.createdAt || foundOrder.date;
          dateBooked = rawOrderDate ? new Date(rawOrderDate).toLocaleString("vi-VN") : "—";

          // Check 24h validity for standalone food orders
          if (rawOrderDate) {
            const orderTime = new Date(rawOrderDate);
            if (!isNaN(orderTime.getTime())) {
              const hoursDiff = (new Date().getTime() - orderTime.getTime()) / (1000 * 60 * 60);
              if (hoursDiff > 24) {
                isExpired = true;
                expiredMessage = `❌ CẢNH BÁO: Đơn hàng đồ ăn CB${foundOrder.orderId} ĐÃ HẾT HẠN 24H! (Thời gian đặt: ${orderTime.toLocaleString("vi-VN")}). Đồ ăn mua riêng tại quầy chỉ có hiệu lực trong vòng 24 giờ kể từ lúc mua.`;
              }
            }
          }
        }
      }

      if (rawOrders.length === 0) {
        setOrders([]);
        if (ticket && isExpired) {
          setStatusMessage({ type: "error", text: expiredMessage });
        } else {
          setStatusMessage({
            type: "warning",
            text: `Không tìm thấy đơn hàng đồ ăn/combo nào cho mã "${cleanCode}".`
          });
        }
      } else {
        // Resolve flat items with catalog names and prices
        const resolvedItems = [];
        let totalAmount = 0;

        for (const order of rawOrders) {
          const isCompleted = localStorage.getItem("food_pickup_status_" + order.orderId) === "Completed" || order.status === "Completed";
          const itemsArray = normalizeArray(order.items || order.orderDetails || order.concessionDetails || order.foodsList);
          
          for (const item of itemsArray) {
            const foodId = item.foodId || item.FoodId;
            const comboId = item.comboId || item.ComboId;
            const qty = Number(item.quantity ?? item.Quantity ?? item.qty ?? item.count ?? 1);

            let name =
              item.name ||
              item.foodName ||
              item.comboName ||
              item.FoodName ||
              item.ComboName ||
              item.itemName ||
              item.ItemName ||
              item.combo?.comboName ||
              item.food?.foodName ||
              "";

            let price = Number(item.price ?? item.Price ?? item.unitPrice ?? item.UnitPrice ?? 0);

            if (!name) {
              if (foodId) {
                const f = allFoods.find(food => String(food.foodId || food.FoodId || food.id || food.Id) === String(foodId));
                if (f) {
                  name = f.foodName || f.FoodName || "Đồ ăn lẻ";
                  if (!price) price = Number(f.price || f.Price || 0);
                }
              } else if (comboId) {
                const c = allCombos.find(combo => String(combo.comboId || combo.ComboId || combo.id || combo.Id) === String(comboId));
                if (c) {
                  name = c.comboName || c.ComboName || "Combo";
                  if (!price) price = Number(c.price || c.Price || 0);
                }
              }
            }

            if (!name) name = "Combo / Đồ ăn";

            resolvedItems.push({
              orderId: order.orderId,
              name,
              quantity: qty,
              price,
              subtotal: price * qty,
              status: isCompleted ? "Completed" : "Pending",
              isExpired
            });

            totalAmount += price * qty;
          }
        }

        setTicketDetails({
          ticketCode: ticket ? (ticket.ticketCode || ticket.code || cleanCode) : `CB${orderIdForPickup}`,
          orderId: orderIdForPickup,
          customerName,
          dateBooked,
          movieTitle: ticket ? (ticket.movieTitle || "Vé xem phim") : "Đơn hàng đồ ăn bán tại quầy",
          roomName: ticket ? (ticket.roomName || "Rạp") : "Tại Quầy",
          seatCode: ticket ? (ticket.seatCode || "N/A") : "N/A",
          totalAmount
        });

        setOrders(resolvedItems);

        if (isExpired) {
          setStatusMessage({ type: "error", text: expiredMessage });
        } else {
          const allCompleted = resolvedItems.every(item => item.status === "Completed");
          if (allCompleted) {
            setStatusMessage({
              type: "warning",
              text: `Thông báo: Đơn hàng đồ ăn này đã được nhận trước đó!`
            });
          } else {
            setStatusMessage({
              type: "success",
              text: ticket
                ? "Tìm thấy đơn hàng! Vui lòng kiểm tra các món bên dưới và bấm xác nhận lấy đồ ăn."
                : `Tìm thấy đơn hàng CB${orderIdForPickup}! Vui lòng kiểm tra các món bên dưới và bấm xác nhận lấy đồ ăn.`
            });
          }
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
    const actualOrderId = (orderId && typeof orderId !== "object") ? orderId : (orders[0]?.orderId || ticketDetails?.orderId);
    if (!actualOrderId) return;

    const hasExpired = orders.some(o => o.isExpired);
    if (hasExpired) {
      setStatusMessage({
        type: "error",
        text: "❌ Không thể xác nhận lấy đồ ăn cho đơn hàng đã hết hạn!"
      });
      return;
    }
    setLoading(true);
    setStatusMessage(null);

    try {
      // Vì Backend chỉ chấp nhận Pending | Confirmed | Cancelled cho thuộc tính Trạng thái đơn hàng,
      // ta chỉ cần lưu trạng thái đã nhận đồ ăn cục bộ vào LocalStorage để đồng bộ giao diện.
      localStorage.setItem("food_pickup_status_" + actualOrderId, "Completed");

      setOrders(prevOrders =>
        prevOrders.map(o => o.orderId === actualOrderId ? { ...o, status: "Completed" } : o)
      );

      setStatusMessage({
        type: "success",
        text: `Đơn hàng #${actualOrderId} đã được xác nhận khách lấy đồ ăn thành công!`
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
