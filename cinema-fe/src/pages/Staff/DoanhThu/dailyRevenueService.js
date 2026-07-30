import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders, cachedFetch } from "../../../services/apiHelper";
import { getUser } from "../../../services/authService";

const API_URL = getApiUrl();

function getLocalDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isDateInFilterRange(pDate, filter) {
  if (!pDate) return false;
  if (!filter || filter === "today") {
    const today = getLocalDateStr(new Date());
    return pDate === today;
  }
  
  if (filter === "month") {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return pDate.startsWith(`${year}-${month}`);
  }

  if (filter === "last_month") {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return pDate.startsWith(`${year}-${month}`);
  }

  if (filter === "week") {
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const mondayStr = getLocalDateStr(monday);
    const sundayStr = getLocalDateStr(sunday);
    return pDate >= mondayStr && pDate <= sundayStr;
  }

  if (filter === "last_week") {
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek - 1) - 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const mondayStr = getLocalDateStr(monday);
    const sundayStr = getLocalDateStr(sunday);
    return pDate >= mondayStr && pDate <= sundayStr;
  }

  return pDate === filter;
}

function normalizeArray(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.$values)) return data.$values;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.data?.$values)) return data.data.$values;
  if (Array.isArray(data.result)) return data.result;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

export async function getDailyRevenue(dateOrFilter, targetCinemaId = "") {
  const headers = getAuthHeaders();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

  let payments = [];
  let bookings = [];
  let orders = [];
  let ticketsList = [];

  try {
    let dateParam = "";
    if (typeof dateOrFilter === "string" && dateOrFilter.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateParam = `?date=${dateOrFilter}`;
    }

    // Fetch all payments, bookings, orders, and tickets in parallel using cachedFetch
    const [pData, bData, oData, tData] = await Promise.all([
      cachedFetch(`${API_URL}/Payments${dateParam}`, { headers, signal: controller.signal }),
      cachedFetch(`${API_URL}/Bookings${dateParam}`, { headers, signal: controller.signal }),
      cachedFetch(`${API_URL}/Orders${dateParam}`, { headers, signal: controller.signal }),
      cachedFetch(`${API_URL}/Tickets${dateParam}`, { headers, signal: controller.signal })
    ]);

    payments = normalizeArray(pData);
    bookings = normalizeArray(bData);
    orders = normalizeArray(oData);
    ticketsList = normalizeArray(tData);
  } catch (err) {
    console.warn("Failed to fetch daily revenue from API, falling back to local storage:", err);
  } finally {
    clearTimeout(timeoutId);
  }

  // Merge customer tickets & bookings stored in localStorage into payments array
  try {
    const localDiscounts = JSON.parse(localStorage.getItem("customer_ticket_discounts") || "{}");
    const localTickets = JSON.parse(localStorage.getItem("rapchieuphim_tickets") || "[]");
    
    if (Array.isArray(localTickets)) {
      localTickets.forEach((t, idx) => {
        const bId = t.bookingId || t.id || t.ticketCode || `TICK_${idx}`;
        const exists = payments.some(p => String(p.bookingId || p.BookingId || p.paymentId || p.id) === String(bId));
        if (!exists) {
          const discountInfo = localDiscounts[bId] || localDiscounts[t.ticketCode] || {};
          const seatPrice = discountInfo.seatPrice || t.seatPrice || t.price || 70000;
          const foodsList = (discountInfo.foodsList && discountInfo.foodsList.length > 0) ? discountInfo.foodsList : (t.foodsList || []);
          const concessionTotal = foodsList.reduce((s, f) => s + (Number(f.price || 0) * Number(f.quantity || 1)), 0);
          const discountAmount = Number(discountInfo.discountAmount || discountInfo.totalDiscountAmount || t.discountAmount || 0);
          const rawTotal = seatPrice + concessionTotal;
          const finalTotal = discountInfo.finalTotalAmount || t.finalTotalAmount || Math.max(0, rawTotal - discountAmount);

          const todayStr = getLocalDateStr(new Date());
          const createdDateVal = t.paymentDate || t.createdAt || discountInfo.createdAt || t.bookingDate || `${todayStr}T18:00:00`;
          const cId = t.cinemaId || discountInfo.cinemaId || targetCinemaId || "1";

          payments.push({
            paymentId: `LOCAL_P_${bId}`,
            bookingId: bId,
            amount: finalTotal,
            status: "Paid",
            createdAt: createdDateVal,
            cinemaId: cId,
            _localData: {
              ...t,
              ...discountInfo,
              ticketCode: t.ticketCode || t.code || bId,
              seatPrice,
              foodsList,
              concessionTotal,
              discountAmount,
              finalTotalAmount: finalTotal,
              createdAt: createdDateVal,
              cinemaId: cId
            }
          });
        }
      });
    }
  } catch(e) {}

  // Lấy chi nhánh của nhân viên đang đăng nhập
  let staffCinemaId = targetCinemaId || "1";
  try {
    if (!targetCinemaId) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user && (user.cinemaId || user.CinemaId)) {
        staffCinemaId = String(user.cinemaId || user.CinemaId);
      }
    }
  } catch (e) {}

  let orderCinemaMap = {};
  try {
    orderCinemaMap = JSON.parse(localStorage.getItem("order_cinema_map") || "{}");
  } catch (e) {}

  // Filter payments for the selected date range and cinema
  const filteredPayments = (payments || []).filter(p => {
    let rootBooking = p.bookingId ? (bookings || []).find(b => String(b.bookingId || b.BookingId) === String(p.bookingId)) : null;
    let order = p.orderId ? (orders || []).find(o => String(o.orderId || o.OrderId) === String(p.orderId)) : null;
    if (!order && rootBooking) {
      order = (orders || []).find(o => String(o.bookingId || o.BookingId) === String(rootBooking.bookingId || rootBooking.BookingId));
    }

    const rawDate =
      p.createdAt ||
      p.CreatedAt ||
      p.paymentDate ||
      p.PaymentDate ||
      p.date ||
      p.Date ||
      rootBooking?.bookingDate ||
      rootBooking?.BookingDate ||
      rootBooking?.createdAt ||
      rootBooking?.CreatedAt ||
      order?.orderDate ||
      order?.OrderDate ||
      "";

    let pDate = "";
    if (rawDate) {
      const str = String(rawDate).trim();
      const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        pDate = `${match[1]}-${match[2]}-${match[3]}`;
      } else {
        const dt = new Date(rawDate);
        if (!isNaN(dt.getTime())) pDate = getLocalDateStr(dt);
      }
    }

    if (!isDateInFilterRange(pDate, dateOrFilter)) return false;

    if (targetCinemaId && String(targetCinemaId).trim() !== "") {
      let pCinemaId = "";
      const pCinemaName = String(p.cinemaName || p.CinemaName || order?.cinemaName || order?.CinemaName || rootBooking?.cinemaName || rootBooking?.CinemaName || "").trim().toLowerCase();

      if (p.cinemaId || p.CinemaId) pCinemaId = String(p.cinemaId || p.CinemaId);

      if (!pCinemaId && order) {
        let cid = order.cinemaId ?? order.CinemaId ?? order.staff?.cinemaId ?? order.staff?.CinemaId ?? order.Staff?.cinemaId ?? order.Staff?.CinemaId;
        if (cid) {
          pCinemaId = String(cid);
        } else {
          const oid = order.orderId ?? order.OrderId ?? order.id ?? order.Id;
          if (oid && orderCinemaMap[String(oid)]) pCinemaId = String(orderCinemaMap[String(oid)]);
        }
      }

      if (!pCinemaId && rootBooking) {
        const showtimeObj = rootBooking.showTime ?? rootBooking.showtime ?? rootBooking.ShowTime ?? rootBooking.Showtime;
        const roomObj = showtimeObj?.room ?? showtimeObj?.Room;
        let cid =
          rootBooking.cinemaId ??
          rootBooking.CinemaId ??
          showtimeObj?.cinemaId ??
          showtimeObj?.CinemaId ??
          roomObj?.cinemaId ??
          roomObj?.CinemaId;
        if (cid) pCinemaId = String(cid);
      }

      if (!pCinemaId) {
        const bId = p.bookingId || p.BookingId || rootBooking?.bookingId;
        if (bId) {
          const ticket = (ticketsList || []).find(t => String(t.bookingId || t.BookingId) === String(bId));
          if (ticket) {
            const showtimeObj = ticket.showTime ?? ticket.showtime ?? ticket.ShowTime ?? ticket.Showtime;
            const roomObj = showtimeObj?.room ?? showtimeObj?.Room;
            let cid =
              ticket.cinemaId ??
              ticket.CinemaId ??
              ticket.cinema?.cinemaId ??
              ticket.cinema?.CinemaId ??
              showtimeObj?.cinemaId ??
              showtimeObj?.CinemaId ??
              roomObj?.cinemaId ??
              roomObj?.CinemaId;
            if (cid) pCinemaId = String(cid);
          }

          if (!pCinemaId) {
            try {
              const savedDiscounts = JSON.parse(localStorage.getItem("customer_ticket_discounts") || "{}");
              if (savedDiscounts[bId] && savedDiscounts[bId].cinemaId) {
                pCinemaId = String(savedDiscounts[bId].cinemaId);
              }
            } catch(e) {}
          }
        }
      }

      // Lấy tên rạp tương ứng với targetCinemaId để đối chiếu name
      let targetCinemaName = "";
      try {
        const storedCinemas = JSON.parse(localStorage.getItem("rapchieuphim_cinemas") || "[]");
        const foundT = storedCinemas.find(c => String(c.cinemaId ?? c.CinemaId ?? c.id ?? c.Id) === String(targetCinemaId));
        if (foundT) targetCinemaName = String(foundT.name || foundT.cinemaName || foundT.Name || foundT.CinemaName || "").trim().toLowerCase();
      } catch (e) {}

      // 1. Nếu match ID chính xác
      if (pCinemaId && String(pCinemaId) === String(targetCinemaId)) return true;

      // 2. Nếu match tên rạp
      if (pCinemaName && targetCinemaName && (pCinemaName.includes(targetCinemaName) || targetCinemaName.includes(pCinemaName))) return true;

      // 3. Nếu hoá đơn có ghi tên rạp khác với rạp hiện tại -> Bỏ qua
      if (pCinemaName && targetCinemaName && !pCinemaName.includes(targetCinemaName) && !targetCinemaName.includes(pCinemaName)) return false;

      // 4. Nếu có pCinemaId rõ ràng nhưng khác targetCinemaId -> Bỏ qua
      if (pCinemaId && String(pCinemaId) !== String(targetCinemaId)) return false;

      // 5. Nếu hoá đơn không thể phân định mã/tên rạp khi đang lọc theo rạp cụ thể -> Loại bỏ
      return false;
    }

    return true;
  });

  const bills = [];
  let totalTicketRevenue = 0;
  let totalConcessionRevenue = 0;
  let totalDiscount = 0;
  let totalOverallRevenue = 0;
  let totalTicketsCount = 0;

  for (const payment of filteredPayments) {
    if (payment._localData) {
      const info = payment._localData;
      const isCancelled = String(info.status || "").toLowerCase().includes("hủy") || String(info.status || "").toLowerCase().includes("cancel");

      const seatType = String(info.seatType || info.SeatType || info.type || "").toLowerCase();
      let defaultSeatPrice = 70000;
      if (seatType.includes("vip")) defaultSeatPrice = 90000;
      else if (seatType.includes("couple") || seatType.includes("sweetbox") || seatType.includes("đôi") || seatType.includes("doi")) defaultSeatPrice = 130000;

      const seatPrice = Number(info.seatPrice > 0 ? info.seatPrice : (info.price > 0 ? info.price : defaultSeatPrice));
      const movieTitle = info.movieTitle || "Hành Trình Của Moana";
      const roomName = info.roomName || "Rạp 3";
      
      const concessions = (info.foodsList || []).map((f, idx) => ({
        id: idx,
        name: f.name || f.comboName || "Món ăn",
        quantity: Number(f.quantity || 1),
        unitPrice: Number(f.price || 0),
        subtotal: Number(f.price || 0) * Number(f.quantity || 1)
      }));

      const concessionSubtotal = Number(concessions.reduce((sum, c) => sum + c.subtotal, 0));
      const discountAmt = Number(info.discountAmount || 0);
      const calculatedTotal = Math.max(0, (seatPrice + concessionSubtotal) - discountAmt);
      const finalTot = (info.finalTotalAmount && info.finalTotalAmount > 0)
        ? Number(info.finalTotalAmount)
        : calculatedTotal;

      const bill = {
        paymentId: payment.paymentId,
        billCode: info.ticketCode || payment.bookingId || `VE${payment.paymentId}`,
        paymentDate: payment.createdAt,
        customerName: info.customerName || "Rabbit",
        customerEmail: info.email || "hongloancute1234@gmail.com",
        customerEmail: info.email || "hongloancute1234@gmail.com",
        staffName: "Đặt Trực Tuyến",
        paymentMethod: info.paymentMethod || "QRCODE",
        cashReceived: finalTot,
        changeAmount: 0,
        discountAmt: discountAmt,
        totalAmount: finalTot,
        isCancelled: isCancelled,
        statusText: isCancelled ? "Đã Hủy Vé" : "Thành Công",
        tickets: [{
          bookingId: payment.bookingId,
          movieTitle: movieTitle,
          roomName: roomName,
          seatNumber: seatCode,
          showtime: info.startTime || "09:00",
          price: seatPrice
        }],
        ticketSubtotal: seatPrice,
        concessions: concessions,
        concessionSubtotal: concessionSubtotal
      };

      if (!isCancelled) {
        totalTicketRevenue += seatPrice;
        totalConcessionRevenue += concessionSubtotal;
        totalDiscount += discountAmt;
        totalOverallRevenue += finalTot;
        totalTicketsCount += 1;
      }

      bills.push(bill);
      continue;
    }
    // 1. Get root booking details
    const rootBooking = payment.bookingId ? (bookings || []).find(b => String(b.bookingId || b.BookingId) === String(payment.bookingId)) : null;

    // 2. Find sibling bookings in the same batch
    let ticketsInBill = [];
    let ticketSubtotal = 0;

    let batchBookings = [];

    if (rootBooking) {
      batchBookings = (bookings || []).filter(b => 
        b.bookingDate === rootBooking.bookingDate && 
        b.email === rootBooking.email
      );

      ticketsInBill = batchBookings.map(b => ({
        bookingId: b.bookingId,
        movieTitle: b.movieTitle || "N/A",
        roomName: b.roomName || "N/A",
        seatNumber: b.seatNumber || "N/A",
        showtime: b.startTime || "",
        price: b.ticketPrice || 0
      }));

      ticketSubtotal = batchBookings.reduce((sum, b) => sum + (b.ticketPrice || 0), 0);
    }

    // 3. Find order if payment has OrderId OR by matching bookingId of the tickets in this bill
    let order = payment.orderId ? (orders || []).find(o => String(o.orderId || o.OrderId) === String(payment.orderId)) : null;
    if (!order && ticketsInBill.length > 0) {
      const matchBookingIds = ticketsInBill.map(t => String(t.bookingId));
      order = (orders || []).find(o => o.bookingId && matchBookingIds.includes(String(o.bookingId || o.BookingId)));
    }

    let concessionsInBill = [];
    let concessionSubtotal = 0;

    if (order) {
      concessionSubtotal = order.totalAmount || 0;
      const items = order.items?.$values ?? order.items ?? [];
      concessionsInBill = items.map((item, idx) => {
        const isCombo = item.comboId || item.ComboId || item.combo || item.Combo;
        const itemName = isCombo 
          ? (item.comboName ?? item.ComboName ?? item.combo?.comboName ?? item.Combo?.ComboName ?? "Combo")
          : (item.foodName ?? item.FoodName ?? item.food?.foodName ?? item.Food?.FoodName ?? "N/A");

        return {
          id: item.foodId || item.comboId || idx,
          name: itemName,
          quantity: item.quantity || 0,
          unitPrice: item.unitPrice || 0,
          subtotal: item.subtotal || 0
        };
      });
    }

    // 4. Build bill details (recalculate totalAmount to sum ticket + concession minus discounts)
    let discountAmt = Number(
      payment.discountAmt ??
      payment.DiscountAmt ??
      payment.discountAmount ??
      payment.DiscountAmount ??
      rootBooking?.discountAmt ??
      rootBooking?.discountAmount ??
      0
    );

    if (!discountAmt && typeof window !== "undefined") {
      try {
        const savedDiscounts = JSON.parse(localStorage.getItem("customer_ticket_discounts") || "{}");
        const bId = rootBooking?.bookingId || payment.bookingId;
        if (bId && savedDiscounts[bId]) {
          discountAmt = Number(savedDiscounts[bId].discountAmount || savedDiscounts[bId].totalDiscountAmount || 0);
        }
      } catch (e) {}
    }

    const rawTotalAmount = ticketSubtotal + concessionSubtotal;
    const finalTotalAmount = Math.max(0, rawTotalAmount - discountAmt);
    
    // Resolve ticket code for this booking to display in place of billCode
    let resolvedBillCode = `BILL${String(payment.paymentId).padStart(6, '0')}`;
    if (rootBooking) {
      const ticketObj = (ticketsList || []).find(t => String(t.bookingId || t.BookingId) === String(rootBooking.bookingId || rootBooking.BookingId));
      if (ticketObj && (ticketObj.ticketCode || ticketObj.code)) {
        resolvedBillCode = ticketObj.ticketCode || ticketObj.code;
      }
    } else if (order) {
      const orderIdVal = order.orderId ?? order.OrderId ?? order.id ?? order.Id;
      if (orderIdVal) {
        resolvedBillCode = `CB${orderIdVal}`;
      }
    }

    // Resolve if this is a counter purchase (either tickets booked by staff or combo sold by staff)
    const isCounter = (rootBooking && rootBooking.bookingType === "Staff") || 
                      (order && (order.orderType === "Staff" || order.orderType === "Counter" || order.orderType === "Takeaway")) ||
                      (rootBooking && (rootBooking.customerName === "Cơ Sở 2" || rootBooking.customerName === "Hệ Thống Admin")) ||
                      (order && (order.userName === "Cơ Sở 2" || order.userName === "Hệ Thống Admin"));

    let resolvedCustomerName = isCounter ? "Khách mua tại quầy" : (rootBooking ? (rootBooking.customerName || rootBooking.userName || rootBooking.fullName || "") : "");
    if (!isCounter && (!resolvedCustomerName || resolvedCustomerName === "Khách vãng lai")) {
      const emailVal = (rootBooking?.email || rootBooking?.customerEmail || "").trim();
      if (emailVal && emailVal.includes("@") && emailVal !== "N/A" && emailVal !== "Tại quầy") {
        resolvedCustomerName = emailVal.split("@")[0];
      } else {
        resolvedCustomerName = "Khách vãng lai";
      }
    }
    const resolvedCustomerEmail = isCounter ? "Tại quầy" : (rootBooking ? (rootBooking.email || "N/A") : "N/A");

    let savedCash = payment.cashReceived || payment.CashReceived;
    if (!savedCash && rootBooking) {
      savedCash = localStorage.getItem("cash_received_booking_" + rootBooking.bookingId);
    }
    if (!savedCash && resolvedBillCode) {
      savedCash = localStorage.getItem("cash_received_bill_" + resolvedBillCode);
    }
    const resolvedCashReceived = savedCash ? Number(savedCash) : finalTotalAmount;
    const resolvedChangeAmount = Math.max(0, resolvedCashReceived - finalTotalAmount);

    let resolvedDiscountReason = "Khấu trừ giảm giá";
    if (discountAmt > 0 || batchBookings.some(b => (b.discountAmt || 0) > 0)) {
      const note = (payment.notes || payment.Notes || rootBooking?.notes || "");
      if (note.includes("HS/SV") || note.includes("Học sinh") || note.includes("Sinh viên")) {
        const match = note.match(/\[(HS\/SV-15%)\] (Ưu đãi HS\/SV \(\d+ vé\))/);
        resolvedDiscountReason = match ? match[2] + " (-15%)" : "Ưu đãi Học sinh / Sinh viên (-15%)";
      } else if (note.includes("[Mã ưu đãi")) {
        const match = note.match(/\[Mã ưu đãi (.*?)\]/);
        if (match) resolvedDiscountReason = `Mã ưu đãi (${match[1]})`;
      } else {
        const code = payment.discountCode || rootBooking?.discountCode || "";
        resolvedDiscountReason = code ? `Mã ưu đãi (${code})` : "Khấu trừ giảm giá";
      }
    }

    const pStatusLower = (payment.paymentStatus || "").toLowerCase();
    let isCancelled = pStatusLower.includes("cancel") || pStatusLower.includes("hủy") || pStatusLower.includes("refund");

    if (rootBooking) {
      const bStatus = (rootBooking.status || "").toLowerCase();
      if (bStatus.includes("cancel") || bStatus.includes("hủy")) {
        isCancelled = true;
      }
    }

    if (payment.bookingId) {
      const ticket = (ticketsList || []).find(t => String(t.bookingId || t.BookingId) === String(payment.bookingId));
      if (ticket) {
        const tStatus = (ticket.status || "").toLowerCase();
        if (tStatus.includes("cancel") || tStatus.includes("hủy")) {
          isCancelled = true;
        }
      }
    }

    try {
      const storedT = JSON.parse(localStorage.getItem("rapchieuphim_tickets") || "[]");
      const ticketObj = (ticketsList || []).find(t => String(t.bookingId || t.BookingId) === String(rootBooking?.bookingId || rootBooking?.BookingId));
      const codeToMatch = (ticketObj?.ticketCode || ticketObj?.code || resolvedBillCode || "").toString().toLowerCase();
      const foundLocal = storedT.find(t => String(t.ticketCode || t.code || "").toLowerCase() === codeToMatch);
      if (foundLocal && String(foundLocal.status || "").toLowerCase().includes("cancel")) {
        isCancelled = true;
      }
    } catch(e) {}

    const bill = {
      paymentId: payment.paymentId,
      billCode: resolvedBillCode,
      paymentDate: payment.createdAt,
      customerName: resolvedCustomerName,
      customerEmail: resolvedCustomerEmail,
      staffName: order && order.staffName ? order.staffName : (payment.staffId ? `Nhân viên (ID ${payment.staffId})` : "Hệ thống Online"),
      paymentMethod: payment.paymentMethod,
      cashReceived: resolvedCashReceived,
      changeAmount: resolvedChangeAmount,
      discountAmt: discountAmt,
      discountReason: resolvedDiscountReason,
      rawTotalAmount: rawTotalAmount,
      totalAmount: finalTotalAmount,
      tickets: ticketsInBill,
      ticketSubtotal: ticketSubtotal,
      concessions: concessionsInBill,
      concessionSubtotal: concessionSubtotal,
      status: isCancelled ? "Cancelled" : "Paid",
      isCancelled: isCancelled
    };

    if (!isCancelled) {
      const ratio = rawTotalAmount > 0 ? (finalTotalAmount / rawTotalAmount) : 1;
      totalTicketRevenue += Math.round(ticketSubtotal * ratio);
      totalConcessionRevenue += Math.round(concessionSubtotal * ratio);
      totalDiscount += discountAmt;
      totalOverallRevenue += finalTotalAmount;
      totalTicketsCount += ticketsInBill.length;
    }

    bills.push(bill);
  }

  // 5. Load and merge real standalone combo orders from Database
  const realStandaloneOrders = (orders || []).filter(o => {
    // Must be Confirmed or Success status
    const isConfirmed = o.status && (
      o.status.toLowerCase() === "confirmed" || 
      o.status.toLowerCase() === "success"
    );
    if (!isConfirmed) return false;

    // Must NOT be linked to any payment or booking already included in bills (to avoid double-counting online ticket+concession orders)
    const isLinkedToPayment = (payments || []).some(p => String(p.orderId || p.OrderId) === String(o.orderId || o.OrderId));
    if (isLinkedToPayment) return false;

    if (o.bookingId) {
      const isLinkedToBookingPayment = (payments || []).some(p => String(p.bookingId || p.BookingId) === String(o.bookingId || o.BookingId));
      if (isLinkedToBookingPayment) return false;
    }

    const alreadyProcessedInBills = bills.some(b => {
      if (o.orderId && String(b.billCode) === `CB${o.orderId}`) return true;
      if (o.bookingId && b.tickets && b.tickets.some(t => String(t.bookingId) === String(o.bookingId))) return true;

      // Filter out standalone order if ticket bill already has matching food & customer
      const sameCustomer = (b.customerEmail && o.email && b.customerEmail === o.email) ||
        (b.customerName && o.customerName && b.customerName === o.customerName) ||
        (b.customerName && o.userName && b.customerName === o.userName) ||
        (b.customerName === "Rabbit");

      if (sameCustomer && b.concessions && b.concessions.length > 0) {
        const oItems = o.items?.$values ?? o.items ?? [];
        const hasMatchingFood = b.concessions.some(c =>
          oItems.some(item => (item.comboName || item.foodName || item.name) === c.name)
        );
        if (hasMatchingFood) return true; // Already included in online ticket bill!
      }
      return false;
    });
    if (alreadyProcessedInBills) return false;

    // Date must match
    const oDate = o.orderDate ? o.orderDate.split('T')[0] : "";
    if (!isDateInFilterRange(oDate, dateOrFilter)) return false;
    
    // Branch must match
    let oCinemaId = o.cinemaId ?? o.CinemaId ?? o.staff?.cinemaId ?? o.staff?.CinemaId ?? o.Staff?.cinemaId ?? o.Staff?.CinemaId;
    if (!oCinemaId) {
      try {
        const map = JSON.parse(localStorage.getItem("order_cinema_map") || "{}");
        const oid = o.orderId ?? o.OrderId ?? o.id ?? o.Id;
        if (oid && map[String(oid)]) oCinemaId = String(map[String(oid)]);
      } catch(e) {}
    }
    return String(oCinemaId || "1") === staffCinemaId;
  });

  const user = getUser();
  for (const localOrder of realStandaloneOrders) {
    const isLocalCounter = localOrder.userName === "Cơ Sở 2" || localOrder.userName === "Hệ Thống Admin" || localOrder.orderType === "Staff" || localOrder.orderType === "Counter" || localOrder.orderType === "Takeaway";
    const resolvedLocalName = isLocalCounter ? "Khách mua tại quầy" : (localOrder.userName || "Khách mua combo");
    const resolvedLocalEmail = isLocalCounter ? "Tại quầy" : "N/A";

    const savedCash = localStorage.getItem("cash_received_order_" + localOrder.orderId) || 
                      localStorage.getItem("cash_received_bill_CB" + localOrder.orderId) || 
                      localOrder.cashReceived;
    const resolvedCashReceived = savedCash ? Number(savedCash) : (localOrder.totalAmount || 0);
    const resolvedChangeAmount = Math.max(0, resolvedCashReceived - (localOrder.totalAmount || 0));

    const bill = {
      paymentId: localOrder.orderId + 2000000, // Unique simulated paymentId mapping
      billCode: `CB${localOrder.orderId}`,
      paymentDate: localOrder.orderDate,
      customerName: resolvedLocalName,
      customerEmail: resolvedLocalEmail,
      staffName: localOrder.staffName || "Nhân viên T&M",
      paymentMethod: "Tiền mặt",
      cashReceived: resolvedCashReceived,
      changeAmount: resolvedChangeAmount,
      discountAmt: 0,
      totalAmount: localOrder.totalAmount || 0,
      tickets: [],
      ticketSubtotal: 0,
      concessions: (localOrder.items?.$values ?? localOrder.items ?? []).map(item => ({
        name: item.comboName || item.foodName || "N/A",
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || 0,
        subtotal: item.subtotal || 0
      })),
      concessionSubtotal: localOrder.totalAmount || 0
    };

    totalConcessionRevenue += localOrder.totalAmount || 0;
    totalOverallRevenue += localOrder.totalAmount || 0;

    bills.push(bill);
  }

  // 6. Merge legacy simulated combo orders from localStorage (excluding any already matched by code to prevent double count)
  const localOrdersStr = localStorage.getItem("simulated_orders") || "[]";
  const localOrders = JSON.parse(localOrdersStr);
  const matchingLocalOrders = localOrders.filter(o => {
    const alreadyInBills = bills.some(b => String(b.billCode) === String(o.id || o.orderId));
    if (!isDateInFilterRange(o.date, dateOrFilter) || alreadyInBills) return false;
    
    const defaultCinemaId = user?.cinemaId || user?.CinemaId || 1;
    const oCinemaId = String(o.cinemaId || o.CinemaId || defaultCinemaId);
    return oCinemaId === staffCinemaId;
  });

  for (const localOrder of matchingLocalOrders) {
    const savedCash = localStorage.getItem("cash_received_order_" + localOrder.orderId) || 
                      localStorage.getItem("cash_received_bill_" + localOrder.id) || 
                      localOrder.cashReceived;
    const resolvedCashReceived = savedCash ? Number(savedCash) : (localOrder.totalAmount || 0);
    const resolvedChangeAmount = Math.max(0, resolvedCashReceived - (localOrder.totalAmount || 0));

    const bill = {
      paymentId: localOrder.orderId + 1000000, // Unique simulated paymentId
      billCode: localOrder.id,
      paymentDate: localOrder.createdAt,
      customerName: localOrder.customerName || "Khách mua combo",
      customerEmail: "N/A",
      staffName: user?.fullName || user?.FullName || "Nhân viên T&M",
      paymentMethod: "Tiền mặt",
      cashReceived: resolvedCashReceived,
      changeAmount: resolvedChangeAmount,
      discountAmt: 0,
      totalAmount: localOrder.totalAmount || 0,
      tickets: [],
      ticketSubtotal: 0,
      concessions: (localOrder.items || []).map(item => ({
        name: item.name || "N/A",
        quantity: item.quantity || 0,
        unitPrice: item.price || 0,
        subtotal: (item.price * item.quantity) || 0
      })),
      concessionSubtotal: localOrder.totalAmount || 0
    };

    totalConcessionRevenue += localOrder.totalAmount || 0;
    totalOverallRevenue += localOrder.totalAmount || 0;

    bills.push(bill);
  }

  // Calculate Cash vs Transfer totals
  let totalCashRevenue = 0;
  let totalTransferRevenue = 0;
  let totalCashBillsCount = 0;
  let totalTransferBillsCount = 0;

  for (const bill of bills) {
    if (bill.isCancelled) continue;
    const pm = bill.paymentMethod ? String(bill.paymentMethod).toLowerCase() : "";
    if (pm === "cash" || pm === "tiền mặt") {
      totalCashRevenue += bill.totalAmount || 0;
      totalCashBillsCount += 1;
    } else {
      totalTransferRevenue += bill.totalAmount || 0;
      totalTransferBillsCount += 1;
    }
  }

  // Sort bills by paymentDate descending (newest first)
  bills.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

  return {
    date: dateOrFilter,
    totalTicketRevenue,
    totalConcessionRevenue,
    totalDiscount,
    totalOverallRevenue,
    totalBillsCount: bills.length,
    totalTicketsCount,
    totalCashRevenue,
    totalTransferRevenue,
    totalCashBillsCount,
    totalTransferBillsCount,
    bills
  };
}

export async function sendDailyRevenueReport(payload) {
  const headers = getAuthHeaders();
  const user = getUser();
  const staffId = user?.userId || user?.UserId || 1;

  // 1. Get revenue data for payload (custom shift or full day)
  const revenueData = payload.shiftRevenueData || await getDailyRevenue(payload.date);

  // 2. Fetch staff shifts to resolve CinemaId
  let cinemaId = 1;
  try {
    const shiftsData = await cachedFetch(`${API_URL}/StaffShifts/ByStaff/${staffId}`);
    const shifts = normalizeArray(shiftsData);
    if (shifts && shifts.length > 0) {
      cinemaId = shifts[0].cinemaId || shifts[0].CinemaId || 1;
    }
  } catch (err) {
    console.error("Failed to fetch staff shifts, defaulting cinemaId to 1:", err);
  }

  // Fetch cinema name
  let cinemaName = "Đồng Khởi";
  try {
    const cinemasData = await cachedFetch(`${API_URL}/Cinemas`);
    const cinemas = normalizeArray(cinemasData);
    const found = cinemas.find(c => String(c.cinemaId ?? c.CinemaId ?? c.id ?? c.Id) === String(cinemaId));
    if (found) {
      cinemaName = found.cinemaName ?? found.CinemaName ?? "Đồng Khởi";
    }
  } catch (err) {
    console.error("Failed to fetch cinemas:", err);
  }

  let branchDisplayName = cinemaName;
  if (branchDisplayName.startsWith("CinemaHCM ")) {
    branchDisplayName = branchDisplayName.replace("CinemaHCM ", "Chi nhánh ");
  } else if (!branchDisplayName.startsWith("Chi nhánh ")) {
    branchDisplayName = "Chi nhánh " + branchDisplayName;
  }

  const totalBookings = revenueData.totalTicketsCount || 0;
  const totalOrders = revenueData.bills ? revenueData.bills.filter(b => b.concessions && b.concessions.length > 0).length : 0;
  const totalRevenue = revenueData.totalOverallRevenue || 0;
  const shiftName = payload.shiftName || "Ca làm việc";
  const initialCash = Number(payload.initialCash || 0);
  const actualCash = Number(payload.actualCash || 0);
  const cashDifference = Number(payload.cashDifference || 0);
  const diffStatusStr = cashDifference === 0 ? "Khớp 0đ" : (cashDifference > 0 ? `Dư +${cashDifference.toLocaleString('vi-VN')}đ` : `Thiếu ${cashDifference.toLocaleString('vi-VN')}đ`);

  // Format rich and detailed Vietnamese summary
  const summary = `Báo cáo kết ca ngày ${payload.date}:\n` +
                  `- Tên ca: ${shiftName}\n` +
                  `- Giờ gửi báo cáo: ${payload.sendTime || new Date().toLocaleTimeString('vi-VN')}\n` +
                  `- Doanh thu vé: ${revenueData.totalTicketRevenue?.toLocaleString('vi-VN')}đ (${totalBookings} vé)\n` +
                  `- Doanh thu bắp nước: ${revenueData.totalConcessionRevenue?.toLocaleString('vi-VN')}đ (${totalOrders} đơn)\n` +
                  `- Doanh thu Tiền mặt: ${revenueData.totalCashRevenue?.toLocaleString('vi-VN')}đ (${revenueData.totalCashBillsCount || 0} đơn)\n` +
                  `- Doanh thu Tiền CK: ${revenueData.totalTransferRevenue?.toLocaleString('vi-VN')}đ (${revenueData.totalTransferBillsCount || 0} đơn)\n` +
                  `- Giảm giá: ${revenueData.totalDiscount?.toLocaleString('vi-VN')}đ\n` +
                  `- Tổng doanh thu thực nhận: ${totalRevenue?.toLocaleString('vi-VN')}đ\n` +
                  `- Kiểm kê két tiền: Đầu ca: ${initialCash.toLocaleString('vi-VN')}đ | Thực đếm: ${actualCash.toLocaleString('vi-VN')}đ | Chênh lệch: ${diffStatusStr}\n` +
                  `- Ghi chú báo cáo: ${payload.notes || "Không có"}\n` +
                  `- Nơi gửi: ${branchDisplayName}`;

  const reportBody = {
    staffId: staffId,
    cinemaId: cinemaId,
    reportDate: payload.date,
    shiftName: shiftName,
    summary: summary,
    totalBookings: totalBookings,
    totalOrders: totalOrders,
    totalRevenue: totalRevenue,
    cashRevenue: revenueData.totalCashRevenue || 0,
    transferRevenue: revenueData.totalTransferRevenue || 0,
    initialCash: initialCash,
    actualCash: actualCash,
    cashDifference: cashDifference,
    createdAt: new Date().toISOString()
  };

  let data = null;
  try {
    const response = await fetch(`${API_URL}/StaffReports`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(reportBody)
    });
    if (response.ok) {
      data = await readResponse(response);
    }
  } catch (err) {
    console.warn("Could not post to StaffReports API directly, relying on local sync:", err);
  }

  // Backup sync into localStorage so Admin page receives real-time update
  try {
    const existingHistory = JSON.parse(localStorage.getItem("staff_reports_history") || "[]");
    const localReportItem = {
      date: payload.date,
      sendTime: payload.sendTime || new Date().toLocaleTimeString('vi-VN'),
      sender: user?.fullName || user?.FullName || 'Nhân viên T&M',
      shiftName: shiftName,
      summary: summary,
      totalRevenue: totalRevenue,
      totalBookings: totalBookings,
      totalOrders: totalOrders,
      totalCashRevenue: revenueData.totalCashRevenue || 0,
      totalTransferRevenue: revenueData.totalTransferRevenue || 0,
      initialCash: initialCash,
      actualCash: actualCash,
      cashDifference: cashDifference,
      cinemaId: cinemaId,
      notes: payload.notes || ""
    };
    existingHistory.unshift(localReportItem);
    localStorage.setItem("staff_reports_history", JSON.stringify(existingHistory));
  } catch (e) {}

  return data || reportBody;
}

// ==========================================
// MÃ MỚI THÊM VÀO THEO YÊU CẦU CỦA BẠN
// (Đã chỉnh sửa để dùng đúng API_URL của dự án)
// ==========================================

const DAILY_REVENUE_STORAGE_KEY = "dailyRevenue";

const normalizeDailyRevenueData = (responseData) => {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.result)) return responseData.result;
  if (Array.isArray(responseData?.items)) return responseData.items;
  if (Array.isArray(responseData?.$values)) return responseData.$values;
  return [];
};

export const getDailyRevenueFromLocalStorage = () => {
  try {
    const storedData = localStorage.getItem(DAILY_REVENUE_STORAGE_KEY);
    if (!storedData) return [];
    const parsedData = JSON.parse(storedData);
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    console.error("Không thể đọc doanh thu từ localStorage:", error);
    return [];
  }
};

export const saveDailyRevenueToLocalStorage = (data) => {
  try {
    const safeData = Array.isArray(data) ? data : [];
    localStorage.setItem(DAILY_REVENUE_STORAGE_KEY, JSON.stringify(safeData));
  } catch (error) {
    console.error("Không thể lưu doanh thu vào localStorage:", error);
  }
};

export const fetchDailyRevenue = async (signal) => {
  try {
    if (signal?.aborted) return null;

    const response = await fetch(`${API_URL}/revenue/daily`, {
      method: "GET",
      headers: getAuthHeaders(),
      signal,
    });

    if (!response.ok) {
      let errorMessage = `Không thể lấy doanh thu. HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.message || errorData?.error || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    const dailyRevenue = normalizeDailyRevenueData(responseData);

    saveDailyRevenueToLocalStorage(dailyRevenue);
    return dailyRevenue;
  } catch (error) {
    if (error?.name === "AbortError") {
      console.log("Request lấy doanh thu đã được hủy.");
      return null;
    }

    console.warn("Không thể lấy doanh thu từ API, sử dụng dữ liệu localStorage:", error);
    return getDailyRevenueFromLocalStorage();
  }
};
