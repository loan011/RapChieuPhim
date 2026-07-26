import { useState, useEffect } from "react";
import { fetchTickets, validateTicket, fetchTicketByCode, fetchBookingById } from "./QuetQRService";

export function useQuetQR() {
  const [ticketCode, setTicketCode] = useState("");
  const [ticketDetails, setTicketDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    loadAllTickets();
  }, []);

  async function loadAllTickets() {
    try {
      const data = await fetchTickets();
      const list = Array.isArray(data) ? data : data?.$values || data?.data || [];
      setTickets(list);
    } catch (err) {
      console.error("Error loading tickets:", err);
    }
  }

  async function handleFindTicket(code, autoCheckIn = false) {
    if (!code.trim()) return;
    setLoading(true);
    setStatusMessage(null);
    setTicketDetails(null);

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
      // 1. Tìm trực tiếp từ API bằng mã vé để đảm bảo tính thời gian thực và độ chính xác 100%
      let found = await fetchTicketByCode(cleanCode);

      // 2. Dự phòng: Tìm cục bộ nếu API trả về lỗi hoặc null
      if (!found) {
        found = tickets.find(t => {
          const c = t.ticketCode || t.code || `VE${t.ticketId || t.id}`;
          return c.toLowerCase() === cleanCode.toLowerCase();
        });
      }

      // Check saved discounts / bookings in localStorage
      let savedInfo = {};
      try {
        const savedDiscounts = JSON.parse(localStorage.getItem("customer_ticket_discounts") || "{}");
        const bId = found?.bookingId || found?.BookingId || found?.id;
        const codeKey = cleanCode;
        if (bId && savedDiscounts[bId]) savedInfo = savedDiscounts[bId];
        else if (codeKey && savedDiscounts[codeKey]) savedInfo = savedDiscounts[codeKey];
        else {
          const matchKey = Object.keys(savedDiscounts).find(k => k.toLowerCase() === codeKey.toLowerCase());
          if (matchKey) savedInfo = savedDiscounts[matchKey];
        }
      } catch (e) {}

      let savedTicketLocal = null;
      try {
        const storedT = JSON.parse(localStorage.getItem("rapchieuphim_tickets") || "[]");
        savedTicketLocal = storedT.find(t => {
          const c = String(t.ticketCode || t.code || t.bookingId || t.id || "").toLowerCase();
          return c === cleanCode.toLowerCase();
        });
      } catch (e) {}

      if (!found && (savedInfo.seatPrice || savedTicketLocal)) {
        found = {
          ticketCode: cleanCode,
          ticketId: cleanCode,
          status: savedTicketLocal?.status || "Active",
          ...savedTicketLocal
        };
      }

      if (found) {
        const ticketId = found.ticketId || found.id;
        const isAlreadyUsed = found.status === "Used" || found.status === "Đã sử dụng";
        
        // Fetch linked booking to ensure we have the exact showtime
        const bId = found.bookingId || found.BookingId;
        let booking = null;
        if (bId) {
          booking = await fetchBookingById(bId);
        }

        // Check showtime expiration
        const rawStartTime = savedInfo.showDate && savedInfo.startTime
          ? `${savedInfo.showDate}T${savedInfo.startTime}`
          : (found.startTime || found.showtime || found.showTime || booking?.startTime || booking?.showtime || booking?.bookingDate);

        const rawEndTime = found.endTime || found.showtimeEnd || booking?.endTime;

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

        const seatPriceVal = savedInfo.seatPrice > 0
          ? savedInfo.seatPrice
          : (found.price || found.ticketPrice || (found.seatPrice > 0 ? found.seatPrice : 70000));

        const seatCodeVal = savedInfo.seatCode ||
          (savedInfo.seatsList && savedInfo.seatsList.join(", ")) ||
          found.seatCode || found.seatNumber || "A11";

        const foodsVal = (savedInfo.foodsList && savedInfo.foodsList.length > 0)
          ? savedInfo.foodsList
          : (found.foods || found.bookingFoods || (savedTicketLocal?.foodsList || []));

        const showDateVal = savedInfo.showDate || found.showDate || savedTicketLocal?.showDate || "27/7/2026";
        const startTimeVal = savedInfo.startTime || found.startTime || savedTicketLocal?.startTime || "09:00";

        const discountAmtVal = savedInfo.discountAmount || savedInfo.totalDiscountAmount || found.discountAmount || 0;
        const discountCodeVal = savedInfo.discountCode || found.discountCode || "SALE10";
        const finalTotalVal = savedInfo.finalTotalAmount || found.totalAmount || savedTicketLocal?.totalAmount || 109250;

        const enrichedDetails = {
          ...found,
          ticketCode: found.ticketCode || cleanCode,
          movieTitle: savedInfo.movieTitle || found.movieTitle || booking?.movieTitle || "Hành Trình Của Moana",
          roomName: savedInfo.roomName || found.roomName || booking?.roomName || "Rạp 3",
          cinemaName: savedInfo.cinemaName || found.cinemaName || "CinemaHCM Đồng Khởi",
          seatCode: seatCodeVal,
          seatPrice: seatPriceVal,
          showDate: showDateVal,
          startTime: startTimeVal,
          foods: foodsVal,
          discountAmount: discountAmtVal,
          discountCode: discountCodeVal,
          finalTotalAmount: finalTotalVal,
          customerName: found.customerName || booking?.customerName || "Rabbit",
          isExpired: isShowtimeExpired
        };
        setTicketDetails(enrichedDetails);

        if (isShowtimeExpired) {
          setStatusMessage({
            type: "error",
            text: `❌ CẢNH BÁO: Vé ${found.ticketCode || `VE${ticketId}`} ĐÃ HẾT HẠN QUÉT! Suất chiếu này (kết thúc lúc ${endDate ? endDate.toLocaleString("vi-VN") : ""}) đã qua. Vé chỉ được phép quét TRƯỚC và TRONG khung giờ chiếu phim!`
          });
        } else if (isAlreadyUsed) {
          setStatusMessage({
            type: "error",
            text: `CẢNH BÁO: Vé ${found.ticketCode || `VE${ticketId}`} đã được check-in sử dụng trước đó! Không hợp lệ.`
          });
        } else if (autoCheckIn) {
          try {
            await validateTicket(ticketId, {
              ...found,
              status: "Đã thanh toán" // API will translate this to "Used"
            });
            
            setStatusMessage({
              type: "success",
              text: `Vé ${found.ticketCode || `VE${ticketId}`} đã tự động check-in thành công! Chào mừng khách vào phòng.`
            });
            
            setTicketDetails(prev => prev ? { ...prev, status: "Used", checkedInJustNow: true } : null);
            await loadAllTickets();
          } catch (err) {
            setStatusMessage({
              type: "error",
              text: err.message || "Tự động check-in vé thất bại."
            });
          }
        }
      } else {
        setStatusMessage({
          type: "error",
          text: "Không tìm thấy vé trong hệ thống. Vui lòng kiểm tra lại mã vé!"
        });
      }
    } catch (err) {
      console.error("Error in handleFindTicket:", err);
      setStatusMessage({
        type: "error",
        text: "Có lỗi xảy ra khi tìm kiếm vé. Vui lòng thử lại!"
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn() {
    if (!ticketDetails) return;
    if (ticketDetails.isExpired) {
      setStatusMessage({
        type: "error",
        text: "❌ Không thể check-in vé đã hết hạn suất chiếu!"
      });
      return;
    }
    
    setLoading(true);
    setStatusMessage(null);
    try {
      const ticketId = ticketDetails.ticketId || ticketDetails.id;
      
      await validateTicket(ticketId, {
        ...ticketDetails,
        status: "Đã thanh toán"
      });

      setStatusMessage({
        type: "success",
        text: `Vé ${ticketDetails.ticketCode || `VE${ticketId}`} đã được check-in thành công! Chào mừng khách vào phòng.`
      });

      setTicketDetails(prev => ({ ...prev, status: "Used", checkedInJustNow: true }));
      await loadAllTickets();

    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.message || "Check-in vé thất bại."
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSimulateScan() {
    const activeTickets = tickets.filter(t => t.status === "Đã đặt" || t.status === "Đã thanh toán" || t.status === "Active");
    if (activeTickets.length === 0) {
      alert("Không có vé nào ở trạng thái chờ check-in trong hệ thống!");
      return;
    }
    const randomTicket = activeTickets[Math.floor(Math.random() * activeTickets.length)];
    const code = randomTicket.code || randomTicket.ticketCode || `VE${randomTicket.id}`;
    setTicketCode(code);
    handleFindTicket(code);
  }

  return {
    ticketCode,
    setTicketCode,
    ticketDetails,
    loading,
    statusMessage,
    setStatusMessage,
    handleFindTicket,
    handleCheckIn,
    handleSimulateScan,
  };
}
