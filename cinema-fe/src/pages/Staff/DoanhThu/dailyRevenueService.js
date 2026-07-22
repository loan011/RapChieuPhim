import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";
import { getUser } from "../../../services/authService";

const API_URL = getApiUrl();

export async function getDailyRevenue(date) {
  const headers = getAuthHeaders();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

  let payments = [];
  let bookings = [];
  let orders = [];
  let ticketsList = [];

  try {
    // Fetch all payments, bookings, orders, and tickets in parallel
    const [paymentsRes, bookingsRes, ordersRes, ticketsRes] = await Promise.all([
      fetch(`${API_URL}/Payments`, { headers, signal: controller.signal }),
      fetch(`${API_URL}/Bookings`, { headers, signal: controller.signal }),
      fetch(`${API_URL}/Orders`, { headers, signal: controller.signal }),
      fetch(`${API_URL}/Tickets`, { headers, signal: controller.signal })
    ]);

    if (paymentsRes.ok && bookingsRes.ok && ordersRes.ok && ticketsRes.ok) {
      const [pData, bData, oData, tData] = await Promise.all([
        readResponse(paymentsRes),
        readResponse(bookingsRes),
        readResponse(ordersRes),
        readResponse(ticketsRes)
      ]);
      payments = pData || [];
      bookings = bData || [];
      orders = oData || [];
      ticketsList = tData || [];
    }
  } catch (err) {
    console.warn("Failed to fetch daily revenue from API, falling back to local storage:", err);
  } finally {
    clearTimeout(timeoutId);
  }

  // Lấy chi nhánh của nhân viên đang đăng nhập
  let staffCinemaId = "1";
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user && (user.cinemaId || user.CinemaId)) {
      staffCinemaId = String(user.cinemaId || user.CinemaId);
    }
  } catch (e) {}

  // Filter payments for the selected date and successful status
  const filteredPayments = (payments || []).filter(p => {
    let isSuccess = p.paymentStatus && (
      p.paymentStatus.toLowerCase() === "success" || 
      p.paymentStatus.toLowerCase() === "paid"
    );

    // If payment is pending but created by staff at the counter, treat it as successful
    if (!isSuccess && p.staffId) {
      isSuccess = true;
    }

    if (!isSuccess) return false;

    const pDate = p.createdAt ? p.createdAt.split('T')[0] : "";
    if (pDate !== date) return false;

    // Filter by branch
    let pCinemaId = "1"; // fallback

    let order = p.orderId ? (orders || []).find(o => o.orderId === p.orderId) : null;
    let rootBooking = p.bookingId ? (bookings || []).find(b => b.bookingId === p.bookingId) : null;
    if (!order && rootBooking) {
      order = (orders || []).find(o => o.bookingId === rootBooking.bookingId);
    }

    if (order) {
      let cid = order.cinemaId ?? order.CinemaId ?? order.staff?.cinemaId ?? order.staff?.CinemaId ?? order.Staff?.cinemaId ?? order.Staff?.CinemaId;
      if (cid) {
        pCinemaId = String(cid);
      } else {
        try {
          const map = JSON.parse(localStorage.getItem("order_cinema_map") || "{}");
          const oid = order.orderId ?? order.OrderId ?? order.id ?? order.Id;
          if (oid && map[String(oid)]) pCinemaId = String(map[String(oid)]);
        } catch(e) {}
      }
    } else if (rootBooking) {
      const ticket = (ticketsList || []).find(t => t.bookingId === rootBooking.bookingId);
      if (ticket) {
        let cid = ticket.cinemaId ?? ticket.CinemaId ?? ticket.cinema?.cinemaId ?? ticket.cinema?.CinemaId ?? ticket.showtime?.room?.cinemaId ?? ticket.Showtime?.Room?.CinemaId;
        if (cid) pCinemaId = String(cid);
      }
    }

    return pCinemaId === staffCinemaId;
  });

  const bills = [];
  let totalTicketRevenue = 0;
  let totalConcessionRevenue = 0;
  let totalDiscount = 0;
  let totalOverallRevenue = 0;
  let totalTicketsCount = 0;

  for (const payment of filteredPayments) {
    // 1. Get root booking details
    const rootBooking = payment.bookingId ? (bookings || []).find(b => b.bookingId === payment.bookingId) : null;

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
    let order = payment.orderId ? (orders || []).find(o => o.orderId === payment.orderId) : null;
    if (!order && ticketsInBill.length > 0) {
      const matchBookingIds = ticketsInBill.map(t => t.bookingId);
      order = (orders || []).find(o => o.bookingId && matchBookingIds.includes(o.bookingId));
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

    // 4. Build bill details (recalculate totalAmount to sum ticket + concession, map ticket code to billCode)
    const finalTotalAmount = ticketSubtotal + concessionSubtotal - (payment.discountAmt || 0);
    
    // Resolve ticket code for this booking to display in place of billCode
    let resolvedBillCode = `BILL${String(payment.paymentId).padStart(6, '0')}`;
    if (rootBooking) {
      const ticketObj = (ticketsList || []).find(t => t.bookingId === rootBooking.bookingId);
      if (ticketObj && (ticketObj.ticketCode || ticketObj.code)) {
        resolvedBillCode = ticketObj.ticketCode || ticketObj.code;
      }
    }

    // Resolve if this is a counter purchase (either tickets booked by staff or combo sold by staff)
    const isCounter = (rootBooking && rootBooking.bookingType === "Staff") || 
                      (order && (order.orderType === "Staff" || order.orderType === "Counter" || order.orderType === "Takeaway")) ||
                      (rootBooking && (rootBooking.customerName === "Cơ Sở 2" || rootBooking.customerName === "Hệ Thống Admin")) ||
                      (order && (order.userName === "Cơ Sở 2" || order.userName === "Hệ Thống Admin"));

    const resolvedCustomerName = isCounter ? "Khách mua tại quầy" : (rootBooking ? (rootBooking.customerName || "Khách vãng lai") : "Khách vãng lai");
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
    const discountAmt = payment.discountAmt || 0;
    if (discountAmt > 0 || batchBookings.some(b => b.discountAmt > 0)) {
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
      totalAmount: finalTotalAmount,
      tickets: ticketsInBill,
      ticketSubtotal: ticketSubtotal,
      concessions: concessionsInBill,
      concessionSubtotal: concessionSubtotal
    };

    totalTicketRevenue += ticketSubtotal;
    totalConcessionRevenue += concessionSubtotal;
    totalDiscount += payment.discountAmt || 0;
    totalOverallRevenue += finalTotalAmount;
    totalTicketsCount += ticketsInBill.length;

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

    // Must NOT be linked to any payment (to avoid double-counting)
    const isLinkedToPayment = (payments || []).some(p => p.orderId === o.orderId);
    if (isLinkedToPayment) return false;

    // Date must match
    const oDate = o.orderDate ? o.orderDate.split('T')[0] : "";
    if (oDate !== date) return false;
    
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
      concessions: (localOrder.items || []).map(item => ({
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
    const alreadyInBills = bills.some(b => b.billCode === o.id);
    if (o.date !== date || alreadyInBills) return false;
    
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
    date: date,
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

  // 1. Fetch current daily revenue data for the report date
  const revenueData = await getDailyRevenue(payload.date);

  // 2. Fetch staff shifts to resolve CinemaId
  let cinemaId = 1;
  try {
    const shiftsRes = await fetch(`${API_URL}/StaffShifts/ByStaff/${staffId}`, { headers });
    if (shiftsRes.ok) {
      const shifts = await readResponse(shiftsRes);
      if (shifts && shifts.length > 0) {
        cinemaId = shifts[0].cinemaId || shifts[0].CinemaId || 1;
      }
    }
  } catch (err) {
    console.error("Failed to fetch staff shifts, defaulting cinemaId to 1:", err);
  }

  const totalBookings = revenueData.totalTicketsCount || 0;
  const totalOrders = revenueData.bills ? revenueData.bills.filter(b => b.concessions && b.concessions.length > 0).length : 0;
  const totalRevenue = revenueData.totalOverallRevenue || 0;

  // Format rich and detailed Vietnamese summary
  const summary = `Báo cáo doanh thu ngày ${payload.date}:\n` +
                  `- Giờ gửi báo cáo: ${payload.sendTime || 'N/A'}\n` +
                  `- Doanh thu vé: ${revenueData.totalTicketRevenue?.toLocaleString('vi-VN')}đ (${totalBookings} vé)\n` +
                  `- Doanh thu bắp nước: ${revenueData.totalConcessionRevenue?.toLocaleString('vi-VN')}đ (${totalOrders} đơn)\n` +
                  `- Doanh thu Tiền mặt: ${revenueData.totalCashRevenue?.toLocaleString('vi-VN')}đ (${revenueData.totalCashBillsCount || 0} đơn)\n` +
                  `- Doanh thu Tiền CK: ${revenueData.totalTransferRevenue?.toLocaleString('vi-VN')}đ (${revenueData.totalTransferBillsCount || 0} đơn)\n` +
                  `- Giảm giá: ${revenueData.totalDiscount?.toLocaleString('vi-VN')}đ\n` +
                  `- Tổng doanh thu thực nhận: ${totalRevenue?.toLocaleString('vi-VN')}đ\n` +
                  `- Ghi chú báo cáo: ${payload.notes || "Không có"}\n` +
                  `- Người gửi: ${user?.fullName || user?.FullName || 'Nhân viên T&M'}`;


  const reportBody = {
    staffId: staffId,
    cinemaId: cinemaId,
    reportDate: payload.date,
    summary: summary,
    totalBookings: totalBookings,
    totalOrders: totalOrders,
    totalRevenue: totalRevenue,
    createdAt: new Date().toISOString()
  };

  const response = await fetch(`${API_URL}/StaffReports`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(reportBody)
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Gửi báo cáo doanh thu thất bại!"));
  }

  return data;
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
