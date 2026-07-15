import { useState, useEffect } from "react";
import { fetchTickets, fetchTicketById, validateTicket } from "./QuetQRService";

function normalizeTicket(t) {
  const booking  = t.booking  || t.Booking  || {};
  const showTime = booking.showTime || booking.ShowTime || {};
  const movie    = showTime.movie   || showTime.Movie   || {};
  const room     = showTime.room    || showTime.Room    || {};
  const cinema   = room.cinema      || room.Cinema      || {};
  const seat     = booking.seat     || booking.Seat     || {};
  const user     = booking.user     || booking.User     || {};

  const startISO = showTime.startTime || showTime.StartTime || "";

  return {
    id:   t.ticketId ?? t.TicketId ?? t.id,
    code: t.ticketCode || t.TicketCode || t.code || `VE${t.ticketId ?? t.id}`,
    customerName: user.fullName || user.FullName || t.customerName || "—",
    movieTitle:   movie.title   || movie.Title   || t.movieTitle   || "—",
    roomName:     room.roomName || room.RoomName  || t.roomName     || "—",
    cinemaName:   cinema.cinemaName || cinema.CinemaName || t.cinemaName || "—",
    seatCode: seat.seatRow
      ? `${seat.seatRow || seat.SeatRow || ""}${seat.seatNumber || seat.SeatNumber || ""}`
      : (t.seatCode || t.SeatCode || seat.seatNumber || seat.SeatNumber || "—"),
    showDate: startISO ? startISO.split("T")[0] : "—",
    showTime: startISO ? (startISO.split("T")[1] || "").slice(0, 5) : "—",
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

      // Extract numeric ID from code (e.g. "VE12" → 12, "12" → 12)
      const numericId = /^\d+$/.test(raw)
        ? parseInt(raw)
        : /^ve\d+$/i.test(raw)
        ? parseInt(raw.replace(/^ve/i, ""))
        : null;

      // Try direct API fetch by ID first
      if (numericId !== null) {
        try {
          const data = await fetchTicketById(numericId);
          if (data) found = normalizeTicket(data);
        } catch { /* fall through */ }
      }

      // Fallback: search in loaded list by code
      if (!found) {
        const match = tickets.find(t => {
          const c = (t.ticketCode || t.code || `VE${t.ticketId ?? t.id}`).toLowerCase();
          return c === raw.toLowerCase();
        });
        if (match) found = normalizeTicket(match);
      }

      if (found) {
        setTicketDetails(found);
        setCameraActive(false);
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
      setStatusMessage({ type: "error", text: err.message || "Check-in thất bại. Vui lòng thử lại!" });
    } finally {
      setLoading(false);
    }
  }

  function handleSimulateScan() {
    const activeTickets = tickets.filter(t => {
      const s = (t.status || "").toLowerCase();
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

