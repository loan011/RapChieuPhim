import { useState, useEffect } from "react";
import { fetchTickets, validateTicket, fetchTicketByCode, fetchBookingById } from "./QuetQRService";

export function useQuetQR() {
  const [ticketCode, setTicketCode] = useState("");
  const [ticketDetails, setTicketDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [statusMessage, setStatusMessage] = useState(null);

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

      if (found) {
        const ticketId = found.ticketId || found.id;
        const isAlreadyUsed = found.status === "Used" || found.status === "Đã sử dụng";
        
        // Fetch linked booking to ensure we have the exact showtime
        const bId = found.bookingId || found.BookingId;
        let booking = null;
        if (bId) {
          booking = await fetchBookingById(bId);
        }

        // Check showtime expiration (ticket only valid BEFORE and DURING showtime)
        const rawStartTime = found.startTime || found.showtime || found.showTime || found.startTimeDate || booking?.startTime || booking?.showtime || booking?.bookingDate;
        const rawEndTime = found.endTime || found.showtimeEnd || found.endTimeDate || booking?.endTime;

        let isShowtimeExpired = false;
        let startDate = rawStartTime ? new Date(rawStartTime) : null;
        let endDate = rawEndTime ? new Date(rawEndTime) : null;

        if (startDate && !isNaN(startDate.getTime())) {
          if (!endDate || isNaN(endDate.getTime())) {
            endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
          }
          if (new Date() > endDate) {
            isShowtimeExpired = true;
          }
        }

        const enrichedDetails = {
          ...found,
          movieTitle: found.movieTitle || booking?.movieTitle || "—",
          roomName: found.roomName || booking?.roomName || "—",
          seatCode: found.seatCode || booking?.seatNumber || "—",
          customerName: found.customerName || booking?.customerName || "—",
          startTimeStr: startDate ? startDate.toLocaleString("vi-VN") : "N/A",
          endTimeStr: endDate ? endDate.toLocaleString("vi-VN") : "N/A",
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
