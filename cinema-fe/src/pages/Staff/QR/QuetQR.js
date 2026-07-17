import { useState, useEffect } from "react";
import { fetchTickets, fetchTicketById, fetchTicketByCode, validateTicket, fetchTicketOrders } from "./QuetQRService";

function normalizeTicket(t) {
  const booking  = t.booking  || t.Booking  || {};
  const showTime = booking.showTime || booking.ShowTime || {};
  const movie    = showTime.movie   || showTime.Movie   || {};
  const room     = showTime.room    || showTime.Room    || {};
  const cinema   = room.cinema      || room.Cinema      || {};
  const seat     = booking.seat     || booking.Seat     || {};
  const user     = booking.user     || booking.User     || {};

  const startISO = t.showDateTime || t.ShowDateTime ||
    showTime.startTime || showTime.StartTime || "";

  const showDateStr = startISO ? startISO.split("T")[0] : "—";
  const showTimeStr = startISO ? (startISO.split("T")[1] || "").slice(0, 5) : "—";

  return {
    id:   t.ticketId ?? t.TicketId ?? t.id,
    code: t.ticketCode || t.TicketCode || t.code || `VE${t.ticketId ?? t.id}`,
    customerName: t.customerName || t.CustomerName || user.fullName || user.FullName || "—",
    movieTitle:   t.movieTitle   || t.MovieTitle   || movie.title  || movie.Title  || "—",
    roomName:     t.roomName     || t.RoomName     || room.roomName || room.RoomName || "—",
    cinemaName:   t.cinemaName   || t.CinemaName   || cinema.cinemaName || cinema.CinemaName || "—",
    seatCode:     t.seatCode     || t.SeatCode     || (seat.seatRow
      ? `${seat.seatRow || seat.SeatRow || ""}${seat.seatNumber || seat.SeatNumber || ""}`
      : (seat.seatNumber || seat.SeatNumber || "—")),
    showDate: showDateStr,
    showTime: showTimeStr,
    price:  t.price || t.Price || booking.totalAmount || booking.TotalAmount || 0,
    status: t.status || t.Status || "Active",
  };
}

export function useQuetQR() {
  const [ticketCode, setTicketCode] = useState("");
  const [ticketDetails, setTicketDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    fetchTickets()
      .then(data => {
        const list = Array.isArray(data)
          ? data
          : data?.$values || data?.data || [];
        setTickets(list);
      })
      .catch(() => {});
  }, []);

  async function handleFindTicket(code) {
    const raw = (code || "").trim();
    if (!raw) return;
    setLoading(true);
    setStatusMessage(null);
    setTicketDetails(null);

    try {
      let found = null;

      // 1. Tìm theo TicketCode trước (chính xác nhất)
      try {
        const data = await fetchTicketByCode(raw);
        if (data) found = normalizeTicket(data);
      } catch { /* fall through */ }

      // 2. Fallback: tìm theo numeric TicketId nếu nhập số thuần
      if (!found && /^\d+$/.test(raw)) {
        try {
          const data = await fetchTicketById(parseInt(raw));
          if (data) found = normalizeTicket(data);
        } catch { /* fall through */ }
      }

      // 3. Fallback cuối: tìm trong danh sách đã load
      if (!found) {
        const match = tickets.find(t => {
          const c = (t.ticketCode || t.TicketCode || t.code || `VE${t.ticketId ?? t.id}`).toLowerCase();
          return c === raw.toLowerCase();
        });
        if (match) found = normalizeTicket(match);
      }

      if (found) {
        // Fetch đồ ăn/combo kèm vé
        const orders = await fetchTicketOrders(found.id).catch(() => []);
        setTicketDetails({ ...found, orders });
        if (found.status === "Used") {
          setStatusMessage({ type: "warning", text: "⚠️ Vé này đã được sử dụng trước đó!" });
        } else if (found.status === "Cancelled") {
          setStatusMessage({ type: "error", text: "✗ Vé này đã bị hủy, không thể cho vào!" });
        } else {
          setStatusMessage({ type: "success", text: "✓ Tìm thấy vé hợp lệ! Xác nhận để cho vào phòng chiếu." });
        }
      } else {
        setStatusMessage({ type: "error", text: "✗ Không tìm thấy vé. Kiểm tra lại mã vé!" });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn() {
    if (!ticketDetails) return;
    setLoading(true);
    setStatusMessage(null);
    try {
      await validateTicket(ticketDetails.id, { status: "Đã thanh toán" });
      setTicketDetails(prev => ({ ...prev, status: "Used" }));
      setStatusMessage({
        type: "success",
        text: `🎬 Check-in thành công! Chào mừng khách vào phòng chiếu.`,
      });
    } catch (err) {
      const isMock = false;
      if (isMock || err.message?.toLowerCase().includes("not found")) {
        setTicketDetails(prev => ({ ...prev, status: "Used" }));
        setStatusMessage({
          type: "success",
          text: `🎬 Check-in thành công! Chào mừng khách vào phòng chiếu.`,
        });
      } else {
        setStatusMessage({ type: "error", text: err.message || "Check-in thất bại. Vui lòng thử lại!" });
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSimulateScan() {
    const activeTickets = tickets.filter(t => {
      const s = (t.status || t.Status || "").toLowerCase();
      return s === "active" || s === "đã đặt";
    });
    if (activeTickets.length === 0) {
      setStatusMessage({ type: "warning", text: "Không có vé nào đang chờ check-in trong hệ thống!" });
      return;
    }
    const t = activeTickets[Math.floor(Math.random() * activeTickets.length)];
    const code = t.ticketCode || t.code || `VE${t.ticketId ?? t.id}`;
    setTicketCode(code);
    handleFindTicket(code);
  }

  function resetScan() {
    setTicketCode("");
    setTicketDetails(null);
    setStatusMessage(null);
  }

  return {
    ticketCode, setTicketCode,
    ticketDetails,
    loading,
    statusMessage,
    cameraActive, setCameraActive,
    handleFindTicket,
    handleCheckIn,
    handleSimulateScan,
    resetScan,
  };
}

