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
    try {
      if (cleanCode.includes("%")) {
        cleanCode = decodeURIComponent(cleanCode);
      }
    } catch (e) {}

    // Tự động bóc tách mã vé nếu quét ra link web dạng /ticket-info/TICxxxxx hoặc chuỗi VE:...
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

    // Xử lý trường hợp cleanCode có chứa nhiều mã vé phân cách bởi dấu phẩy
    const codeCandidates = cleanCode
      .split(/[,;\s]+/)
      .map((c) => c.trim())
      .filter(Boolean);

    try {
      let found = null;

      // 1. Thử tra cứu từng candidate qua API Ticket hoặc API Booking
      for (const cand of codeCandidates) {
        if (!cand) continue;

        // a) Thử gọi API tra cứu vé trực tiếp
        let res = await fetchTicketByCode(cand);

        // b) Nếu chưa tìm thấy (VD: cand có dạng BK45 hoặc số 45), thử tra cứu theo BookingId
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
          found = res;
          break;
        }
      }

      // 2. Dự phòng: Tìm cục bộ trong danh sách `tickets`
      if (!found) {
        found = tickets.find((t) => {
          const ticketCodeStr =
            t.ticketCode ||
            t.TicketCode ||
            t.code ||
            t.Code ||
            `VE${t.ticketId || t.TicketId || t.id || t.Id}`;

          const bIdStr = String(t.bookingId ?? t.BookingId ?? t.id ?? t.Id ?? "");

          const isDirectMatch = codeCandidates.some((cand) => {
            const candLower = cand.toLowerCase();
            const numericCand = cand.replace(/\D/g, "");
            return (
              candLower === String(ticketCodeStr).toLowerCase() ||
              (numericCand && numericCand === bIdStr) ||
              candLower === `bk${bIdStr}`.toLowerCase()
            );
          });

          if (isDirectMatch) return true;

          if (Array.isArray(t.ticketCodes)) {
            return t.ticketCodes.some((tc) =>
              codeCandidates.some(
                (cand) => cand.toLowerCase() === String(tc).toLowerCase()
              )
            );
          }
          return false;
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
