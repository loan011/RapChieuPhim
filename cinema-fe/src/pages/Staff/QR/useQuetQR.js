import { useState, useEffect } from "react";
import { fetchTickets, validateTicket, fetchTicketByCode, fetchBookingById } from "./QuetQRService";
import { getDailyRevenue } from "../DoanhThu/dailyRevenueService";

const CINEMA_NAME_MAP = {
  "1": "CinemaHCM Đồng Khởi",
  "2": "CinemaHCM Bến Thành",
  "3": "CinemaHCM Tân Bình",
  "4": "CinemaHCM Vincom Thủ Đức"
};

function formatCinemaDisplayName(cinemaId, cinemaName) {
  const cId = String(cinemaId || "").trim();
  const cName = String(cinemaName || "").trim();

  if (cName && !cName.toLowerCase().startsWith("chi nhánh id") && !cName.toLowerCase().startsWith("chi nhánh ")) {
    return cName;
  }

  if (cId && CINEMA_NAME_MAP[cId]) {
    return CINEMA_NAME_MAP[cId];
  }

  return cName || (cId ? `Chi nhánh ${cId}` : "chi nhánh khác");
}

// Lấy thông tin chi nhánh của nhân viên đang đăng nhập
function getStaffCinema() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const cId = String(user?.cinemaId || user?.CinemaId || "").trim();
    const rawName = String(user?.cinemaName || user?.CinemaName || user?.cinema?.cinemaName || user?.cinema?.name || "").trim();
    const cName = formatCinemaDisplayName(cId, rawName);
    return { cinemaId: cId, cinemaName: cName };
  } catch (e) {
    return { cinemaId: "", cinemaName: "" };
  }
}

// Kiểm tra xem vé có thuộc chi nhánh của nhân viên không
function isSameCinema(staffCinema, ticketCinemaId, ticketCinemaName) {
  // Nếu không xác định được chi nhánh nhân viên → cho qua (tránh chặn nhầm)
  if (!staffCinema.cinemaId && !staffCinema.cinemaName) return true;

  // So sánh theo ID (ưu tiên)
  if (staffCinema.cinemaId && ticketCinemaId) {
    return String(ticketCinemaId) === staffCinema.cinemaId;
  }

  // So sánh theo tên
  const tName = String(ticketCinemaName || "").toLowerCase().trim();
  const sName = String(staffCinema.cinemaName || "").toLowerCase().trim();
  if (sName && tName) {
    return tName.includes(sName) || sName.includes(tName);
  }

  return true; // Không xác định được → cho qua
}

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

        // Check showtime expiration - uu tien du lieu tu API
        const rawStartTime = found.showtimeStart || found.ShowtimeStart || (savedInfo.showDate && savedInfo.startTime
          ? `${savedInfo.showDate}T${savedInfo.startTime}`
          : (found.startTime || found.showtime || found.showTime || booking?.startTime || booking?.showtime || booking?.bookingDate));

        const rawEndTime = found.showtimeEnd || found.ShowtimeEnd || found.endTime || found.showtimeEnd || booking?.endTime;

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

        // ─── TÌM HÓA ĐƠN THANH TOÁN ĐẦY ĐỦ (matchedBill) ─────────────────────
        let matchedBill = null;
        try {
          const dailyData = await getDailyRevenue();
          if (dailyData?.bills) {
            matchedBill = dailyData.bills.find(b => 
              String(b.billCode || "").toLowerCase() === cleanCode.toLowerCase() ||
              b.tickets?.some(t => String(t.ticketCode || t.bookingId || "").toLowerCase() === cleanCode.toLowerCase())
            );
          }
        } catch (e) {}

        let ticketCount = 1;
        let seatCodeVal = "";
        let totalTicketPrice = 0;
        let foodsVal = [];
        let discountAmtVal = 0;
        let discountCodeVal = "";
        let finalTotalVal = 0;
        let customerNameVal = found.customerName || found.CustomerName || booking?.customerName || "Khách";

        if (matchedBill) {
          const billTickets = matchedBill.tickets || [];
          ticketCount = Math.max(1, billTickets.length);
          seatCodeVal = billTickets.map(t => t.seatNumber).filter(Boolean).join(", ") || (found.seatCode || "N/A");
          totalTicketPrice = matchedBill.ticketSubtotal || (Number(found.price || 200000) * ticketCount);
          foodsVal = matchedBill.concessions || [];
          discountAmtVal = Number(matchedBill.discountAmt || 0);
          discountCodeVal = matchedBill.discountReason || "";
          finalTotalVal = matchedBill.totalAmount;
          if (matchedBill.customerName) customerNameVal = matchedBill.customerName;
        } else {
          // Fallback nếu không tìm thấy matchedBill
          let siblingTickets = [];
          if (bId && Array.isArray(tickets)) {
            siblingTickets = tickets.filter(t => String(t.bookingId || t.BookingId) === String(bId));
          }

          let seatCodeList = [];
          if (siblingTickets.length > 0) {
            seatCodeList = siblingTickets.map(t => {
              const r = String(t.seatRow || t.SeatRow || "").trim();
              const n = String(t.seatNumber || t.SeatNumber || "").trim();
              if (r && n && !n.toUpperCase().startsWith(r.toUpperCase())) return `${r}${n}`;
              return n || r || t.seatCode || t.SeatCode || "";
            }).filter(Boolean);
          }

          if (seatCodeList.length === 0) {
            if (savedInfo.seatsList && savedInfo.seatsList.length > 0) {
              seatCodeList = savedInfo.seatsList;
            } else if (savedTicketLocal?.seats) {
              seatCodeList = String(savedTicketLocal.seats).split(/[,;\s]+/).filter(Boolean);
            } else {
              const rawSeat = String(found.seatCode || found.SeatCode || found.seatNumber || savedInfo.seatCode || "").trim();
              const cleanedSeat = rawSeat.replace(/^([A-Za-z]+)\s+\1(\d+)/, "$1$2");
              if (cleanedSeat) seatCodeList = [cleanedSeat];
            }
          }

          ticketCount = Math.max(1, siblingTickets.length > 0 ? siblingTickets.length : seatCodeList.length);
          seatCodeVal = seatCodeList.join(", ") || "N/A";

          if (siblingTickets.length > 0) {
            totalTicketPrice = siblingTickets.reduce((sum, t) => sum + Number(t.price || t.Price || t.ticketPrice || 0), 0);
          }
          if (totalTicketPrice <= 0) {
            const singlePrice = Number(found.price || found.Price || found.ticketPrice || savedInfo.seatPrice || 0);
            totalTicketPrice = singlePrice > 0 ? (singlePrice * ticketCount) : Number(savedInfo.ticketSubtotal || savedTicketLocal?.ticketSubtotal || 0);
          }

          foodsVal = (found.foods && found.foods.length > 0)
            ? found.foods
            : ((savedInfo.foodsList && savedInfo.foodsList.length > 0)
              ? savedInfo.foodsList
              : (found.bookingFoods || (savedTicketLocal?.foodsList || [])));

          discountAmtVal = Number(savedInfo.discountAmount || savedInfo.totalDiscountAmount || found.discountAmount || 0);
          discountCodeVal = savedInfo.discountCode || found.discountCode || "";

          const foodTotal = foodsVal.reduce((sum, f) => sum + (Number(f.price || f.Price || 0) * Number(f.quantity || f.Quantity || 1)), 0);
          finalTotalVal = Math.max(0, (totalTicketPrice + foodTotal) - discountAmtVal);
        }

        // Tính ngày giờ chiếu từ dữ liệu API
        // Luôn ưu tiên ghế và giá mới nhất sau khi đổi ghế. Dữ liệu trong
        // ticket/hóa đơn có thể vẫn là ảnh chụp trước lúc thực hiện exchange.
        const exchangedSeat = found.newSeat ?? found.NewSeat ?? booking?.newSeat ?? booking?.NewSeat;
        const currentSeat = exchangedSeat ?? booking?.seat ?? booking?.Seat ?? found.seat ?? found.Seat;
        const currentSeatRow = String(
          currentSeat?.seatRow ?? currentSeat?.SeatRow ??
          booking?.seatRow ?? booking?.SeatRow ??
          found.newSeatRow ?? found.NewSeatRow ?? ""
        ).trim();
        const currentSeatNumber = String(
          currentSeat?.seatNumber ?? currentSeat?.SeatNumber ??
          booking?.seatNumber ?? booking?.SeatNumber ??
          found.newSeatNumber ?? found.NewSeatNumber ?? ""
        ).trim();
        const currentSeatCode = String(
          found.newSeatCode ?? found.NewSeatCode ??
          booking?.newSeatCode ?? booking?.NewSeatCode ??
          savedInfo.seatCode ?? savedInfo.SeatCode ??
          currentSeat?.seatCode ?? currentSeat?.SeatCode ??
          booking?.seatCode ?? booking?.SeatCode ?? ""
        ).trim() || (
          currentSeatRow && currentSeatNumber
            ? (currentSeatNumber.toUpperCase().startsWith(currentSeatRow.toUpperCase())
              ? currentSeatNumber
              : `${currentSeatRow}${currentSeatNumber}`)
            : ""
        );
        const currentSeatPrice = Number(
          found.newSeatPrice ?? found.NewSeatPrice ??
          booking?.newSeatPrice ?? booking?.NewSeatPrice ??
          savedInfo.ticketPrice ?? savedInfo.seatPrice ??
          booking?.ticketPrice ?? booking?.TicketPrice ??
          booking?.seatPrice ?? booking?.SeatPrice ??
          currentSeat?.price ?? currentSeat?.Price ?? 0
        );

        if (currentSeatCode) {
          seatCodeVal = currentSeatCode;
          ticketCount = 1;
        }
        if (currentSeatPrice > 0) {
          totalTicketPrice = currentSeatPrice * ticketCount;
          const recalculatedFoodTotal = foodsVal.reduce(
            (sum, food) => sum + (
              Number(food.price ?? food.Price ?? food.unitPrice ?? food.UnitPrice ?? 0) *
              Number(food.quantity ?? food.Quantity ?? 1)
            ),
            0
          );
          finalTotalVal = Math.max(0, totalTicketPrice + recalculatedFoodTotal - discountAmtVal);
        }

        let showDateVal = "";
        let startTimeVal = "";
        if (startDate && !isNaN(startDate.getTime())) {
          showDateVal = startDate.toLocaleDateString("vi-VN");
          startTimeVal = startDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
        } else {
          showDateVal = savedInfo.showDate || found.showDate || savedTicketLocal?.showDate || "";
          startTimeVal = savedInfo.startTime || found.startTime || savedTicketLocal?.startTime || "";
        }

        // ─── KIỂM TRA CHI NHÁNH ────────────────────────────────────────────────
        const staffCinema = getStaffCinema();
        const ticketCinemaId = String(
          found.cinemaId || found.CinemaId ||
          booking?.cinemaId || booking?.CinemaId ||
          found.showtime?.room?.cinemaId ||
          ""
        );
        const ticketCinemaName = matchedBill?.cinemaName || savedInfo.cinemaName || found.cinemaName || found.CinemaName || booking?.cinemaName || "";
        const isCrossChain = Boolean(staffCinema.cinemaId && !isSameCinema(staffCinema, ticketCinemaId, ticketCinemaName));
        // ───────────────────────────────────────────────────────────────────────

        const enrichedDetails = {
          ...found,
          ticketCode: found.ticketCode || found.TicketCode || cleanCode,
          movieTitle: matchedBill?.tickets?.[0]?.movieTitle || found.movieTitle || found.MovieTitle || savedInfo.movieTitle || booking?.movieTitle || "N/A",
          roomName: matchedBill?.tickets?.[0]?.roomName || found.roomName || found.RoomName || savedInfo.roomName || booking?.roomName || "N/A",
          cinemaName: ticketCinemaName || "N/A",
          seatCode: seatCodeVal,
          ticketCount: ticketCount,
          totalTicketPrice: totalTicketPrice,
          seatPrice: totalTicketPrice,
          showDate: showDateVal,
          startTime: startTimeVal,
          foods: foodsVal,
          discountAmount: discountAmtVal,
          discountCode: discountCodeVal,
          finalTotalAmount: finalTotalVal,
          customerName: customerNameVal,
          isExpired: isShowtimeExpired,
          isCrossChain: isCrossChain
        };
        setTicketDetails(enrichedDetails);

        if (isCrossChain) {
          const staffDisplayName = formatCinemaDisplayName(staffCinema.cinemaId, staffCinema.cinemaName);
          const ticketDisplayName = formatCinemaDisplayName(ticketCinemaId, ticketCinemaName);
          setStatusMessage({
            type: "error",
            text: `🚫 Vé ${found.ticketCode || found.TicketCode || cleanCode} KHÔNG THUỘC CHI NHÁNH NÀY! Vé được đặt tại: "${ticketDisplayName}". Nhân viên chỉ có thể quét vé tại chi nhánh của mình ("${staffDisplayName}").`
          });
          setLoading(false);
          return;
        }

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
    if (ticketDetails.isCrossChain) {
      setStatusMessage({
        type: "error",
        text: "🚫 Không thể check-in vé thuộc chi nhánh khác!"
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
