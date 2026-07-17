import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";
import { getUser } from "../../../services/authService";

const API_URL = getApiUrl();

export async function getDailyRevenue(date) {
  const headers = getAuthHeaders();

  // Fetch all payments, bookings, and orders in parallel
  const [paymentsRes, bookingsRes, ordersRes] = await Promise.all([
    fetch(`${API_URL}/Payments`, { headers }),
    fetch(`${API_URL}/Bookings`, { headers }),
    fetch(`${API_URL}/Orders`, { headers })
  ]);

  if (!paymentsRes.ok || !bookingsRes.ok || !ordersRes.ok) {
    throw new Error("Lấy dữ liệu từ máy chủ thất bại!");
  }

  const [payments, bookings, orders] = await Promise.all([
    readResponse(paymentsRes),
    readResponse(bookingsRes),
    readResponse(ordersRes)
  ]);

  // Filter payments for the selected date and successful status
  const filteredPayments = (payments || []).filter(p => {
    let isSuccess = p.paymentStatus && (
      p.paymentStatus.toLowerCase() === "success" || 
      p.paymentStatus.toLowerCase() === "paid"
    );

    // If payment is pending but has a booking, check if the booking status is Paid (e.g. staff counter bookings)
    if (!isSuccess && p.bookingId) {
      const associatedBooking = (bookings || []).find(b => b.bookingId === p.bookingId);
      if (associatedBooking && (
        (associatedBooking.paymentStatus && associatedBooking.paymentStatus.toLowerCase() === "paid") ||
        (associatedBooking.status && associatedBooking.status.toLowerCase() === "paid")
      )) {
        isSuccess = true;
      }
    }

    if (!isSuccess) return false;

    const pDate = p.createdAt ? p.createdAt.split('T')[0] : "";
    return pDate === date;
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

    if (rootBooking) {
      const batchBookings = (bookings || []).filter(b => 
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

    // 3. Find order if payment has OrderId
    const order = payment.orderId ? (orders || []).find(o => o.orderId === payment.orderId) : null;
    let concessionsInBill = [];
    let concessionSubtotal = 0;

    if (order) {
      concessionSubtotal = order.totalAmount || 0;
      if (order.items) {
        concessionsInBill = order.items.map(item => ({
          name: item.foodName || item.comboName || "N/A",
          quantity: item.quantity || 0,
          unitPrice: item.unitPrice || 0,
          subtotal: item.subtotal || 0
        }));
      }
    }

    // 4. Build bill details matching backend schema
    const bill = {
      paymentId: payment.paymentId,
      billCode: `BILL${String(payment.paymentId).padStart(6, '0')}`,
      paymentDate: payment.createdAt,
      customerName: rootBooking ? (rootBooking.customerName || "Khách vãng lai") : "Khách vãng lai",
      customerEmail: rootBooking ? (rootBooking.email || "N/A") : "N/A",
      staffName: order && order.staffName ? order.staffName : (payment.staffId ? `Nhân viên (ID ${payment.staffId})` : "Hệ thống Online"),
      paymentMethod: payment.paymentMethod,
      discountAmt: payment.discountAmt || 0,
      totalAmount: payment.totalAmount || 0,
      tickets: ticketsInBill,
      ticketSubtotal: ticketSubtotal,
      concessions: concessionsInBill,
      concessionSubtotal: concessionSubtotal
    };

    totalTicketRevenue += ticketSubtotal;
    totalConcessionRevenue += concessionSubtotal;
    totalDiscount += payment.discountAmt || 0;
    totalOverallRevenue += payment.totalAmount || 0;
    totalTicketsCount += ticketsInBill.length;

    bills.push(bill);
  }

  // 5. Load and merge simulated combo orders from localStorage
  const user = getUser();
  const localOrdersStr = localStorage.getItem("simulated_orders") || "[]";
  const localOrders = JSON.parse(localOrdersStr);
  const matchingLocalOrders = localOrders.filter(o => o.date === date);

  for (const localOrder of matchingLocalOrders) {
    const bill = {
      paymentId: localOrder.orderId + 1000000, // Unique simulated paymentId
      billCode: localOrder.id,
      paymentDate: localOrder.createdAt,
      customerName: localOrder.customerName || "Khách mua combo",
      customerEmail: "N/A",
      staffName: user?.fullName || user?.FullName || "Nhân viên T&M",
      paymentMethod: "Tiền mặt",
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
    totalRevenue: totalRevenue
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
