import { useState, useEffect } from "react";
import { getCombosList, sellCombo, addFood, deleteItem, addCombo } from "./ComboService";
import { fetchTicketById } from "../QR/QuetQRService";

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
    status: t.status || t.Status || "Active",
  };
}

export function useCombo() {
  const [combos, setCombos] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [showAddFood, setShowAddFood] = useState(false);
  const [addingFood, setAddingFood] = useState(false);
  const [showAddCombo, setShowAddCombo] = useState(false);
  const [addingCombo, setAddingCombo] = useState(false);

  // Ticket scan
  const [ticketCode, setTicketCode] = useState("");
  const [ticketInfo, setTicketInfo] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketStatusMsg, setTicketStatusMsg] = useState(null);

  useEffect(() => {
    async function loadData() {
      const list = await getCombosList();
      setCombos(list);
    }
    loadData();
  }, []);

  function handleQuantityChange(id, type, delta) {
    const key = `${type}-${id}`;
    setQuantities(prev => {
      const current = prev[key] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [key]: next };
    });
  }

  const selectedItems = combos.filter(item => (quantities[`${item.type}-${item.id}`] || 0) > 0);
  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.price * (quantities[`${item.type}-${item.id}`] || 0)), 0);

  async function handleFindTicket(code) {
    const raw = (code || "").trim();
    if (!raw) return;
    setTicketLoading(true);
    setTicketStatusMsg(null);
    setTicketInfo(null);
    try {
      const numericId = /^\d+$/.test(raw)
        ? parseInt(raw)
        : /^ve\d+$/i.test(raw)
        ? parseInt(raw.replace(/^ve/i, ""))
        : null;
      let found = null;
      if (numericId !== null) {
        try {
          const data = await fetchTicketById(numericId);
          if (data) found = normalizeTicket(data);
        } catch { /* fall through */ }
      }
      if (found) {
        setTicketInfo(found);
        if (found.status === "Used") {
          setTicketStatusMsg({ type: "warning", text: "⚠️ Vé này đã được sử dụng trước đó!" });
        } else if (found.status === "Cancelled") {
          setTicketStatusMsg({ type: "error", text: "✗ Vé đã bị hủy, không thể bán combo!" });
          setTicketInfo(null);
        } else {
          setTicketStatusMsg({ type: "success", text: "✓ Tìm thấy vé hợp lệ! Có thể bán combo cho khách." });
        }
      } else {
        setTicketStatusMsg({ type: "error", text: "✗ Không tìm thấy vé. Kiểm tra lại mã vé!" });
      }
    } finally {
      setTicketLoading(false);
    }
  }

  function resetTicket() {
    setTicketCode("");
    setTicketInfo(null);
    setTicketStatusMsg(null);
  }

  async function handleAddCombo(comboData) {
    try {
      setAddingCombo(true);
      await addCombo({ ...comboData, isAvailable: true });
      const list = await getCombosList();
      setCombos(list);
      setShowAddCombo(false);
    } catch (err) {
      alert(err.message || "Thêm combo thất bại!");
    } finally {
      setAddingCombo(false);
    }
  }

  async function handleAddFood(foodData) {
    try {
      setAddingFood(true);
      await addFood({ ...foodData, isAvailable: true });
      const list = await getCombosList();
      setCombos(list);
      setShowAddFood(false);
    } catch (err) {
      alert(err.message || "Thêm đồ ăn thất bại!");
    } finally {
      setAddingFood(false);
    }
  }

  async function handleDeleteItem(id, type) {
    if (!window.confirm("Xóa món này khỏi danh sách?")) return;
    try {
      await deleteItem(id, type);
      setCombos(prev => prev.filter(item => !(item.id === id && item.type === type)));
      setQuantities(prev => { const q = { ...prev }; delete q[`${type}-${id}`]; return q; });
    } catch (err) {
      alert(err.message || "Xóa thất bại!");
    }
  }

  async function handleSell(e) {
    e.preventDefault();
    if (selectedItems.length === 0) return alert("Vui l\u00f2ng ch\u1ecdn \u00edt nh\u1ea5t m\u1ed9t Combo/M\u00f3n \u0103n!");
    if (!ticketInfo) return alert("Vui l\u00f2ng qu\u00e9t ho\u1eb7c nh\u1eadp m\u00e3 v\u00e9 c\u1ee7a kh\u00e1ch h\u00e0ng!");

    try {
      setLoading(true);
      const res = await sellCombo({
        customerName: ticketInfo.customerName,
        ticketId: ticketInfo.id,
        items: selectedItems.map(item => ({
          id: item.id,
          type: item.type,
          name: item.name,
          quantity: quantities[`${item.type}-${item.id}`],
          price: item.price
        })),
        totalAmount
      });
      setSuccess(res);
      setQuantities({});
      resetTicket();
    } catch (err) {
      alert("B\u00e1n combo th\u1ea5t b\u1ea1i.");
    } finally {
      setLoading(false);
    }
  }

  return {
    combos,
    quantities,
    loading,
    success,
    setSuccess,
    handleQuantityChange,
    selectedItems,
    totalAmount,
    handleSell,
    showAddCombo,
    setShowAddCombo,
    addingCombo,
    handleAddCombo,
    showAddFood,
    setShowAddFood,
    addingFood,
    handleAddFood,
    handleDeleteItem,
    ticketCode,
    setTicketCode,
    ticketInfo,
    ticketLoading,
    ticketStatusMsg,
    handleFindTicket,
    resetTicket,
  };
}
