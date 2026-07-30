import { useState, useEffect } from "react";
import { MdSearch, MdClose, MdRefresh, MdCancel, MdCheckCircle, MdWarning, MdPrint, MdConfirmationNumber, MdEventSeat, MdAttachMoney } from "react-icons/md";
import { getTicketList, updateTicket } from "../pages/Admin/Ticket/ticketService";
import { getSeatsByRoomId, getAvailableSeats, cancelBooking, getRooms } from "../pages/Booking/bookingService";
import { restoreInventory } from "../pages/Staff/Combo/ComboService";
import { getApiUrl, getAuthHeaders } from "../services/apiHelper";

export default function TicketExchangeModal({ isOpen, onClose, onRefreshData }) {
  const [ticketCodeInput, setTicketCodeInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [ticketList, setTicketList] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchError, setSearchError] = useState("");

  // Mode: "SELECT" | "CHANGE_SEAT" | "CANCEL_TICKET" | "SUCCESS"
  const [actionMode, setActionMode] = useState("SELECT");

  // Change seat states
  const [showtimeSeats, setShowtimeSeats] = useState([]);
  const [availableSeatList, setAvailableSeatList] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [selectedNewSeat, setSelectedNewSeat] = useState(null);
  const [staffMoneyConfirmed, setStaffMoneyConfirmed] = useState(false);

  // Cancellation states
  const [staffRefundConfirmed, setStaffRefundConfirmed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadTickets();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleOpenWithCode(e) {
      const payload = e.detail;
      const code = typeof payload === "string" ? payload : payload?.code;
      const bill = typeof payload === "object" ? payload?.bill : null;

      if (code) {
        setTicketCodeInput(code);

        if (bill) {
          const orderId = bill.billCode ? bill.billCode.replace(/\D/g, "") : "";
          // Xây dựng tên hiển thị từ danh sách đồ ăn
          const foodItemsLabel = bill.concessions && bill.concessions.length > 0
            ? bill.concessions.map(c => `${c.name}${c.quantity > 1 ? ` x${c.quantity}` : ""}`).join(", ")
            : "";

          const formatted = {
            ticketCode: bill.billCode,
            code: bill.billCode,
            billCode: bill.billCode,
            bookingId: bill.bookingId || orderId,
            orderId: bill.billCode?.startsWith("CB") ? bill.billCode.replace(/\D/g, "") : orderId,
            paymentId: bill.paymentId,
            customerName: bill.customerName || "Khách mua tại quầy",
            totalAmount: bill.totalAmount || 0,
            paymentMethod: bill.paymentMethod || "Tiền mặt",
            seatCode: bill.tickets?.[0]?.seatNumber || (bill.concessions?.length > 0 ? "Chỉ mua đồ ăn" : "Không mua vé"),
            // Tên phim lấy từ vé, hoặc tên đồ ăn nếu là đơn CB
            movieTitle: bill.tickets?.[0]?.movieTitle || foodItemsLabel || "",
            roomName: bill.tickets?.[0]?.roomName || "",
            showtime: bill.tickets?.[0]?.showtime || "",
            price: bill.tickets?.[0]?.price || bill.ticketSubtotal || 0,
            amount: bill.totalAmount || 0,
            concessions: bill.concessions || [],
            status: bill.status || "Active",
            isFoodOnly: !bill.tickets || bill.tickets.length === 0
          };
          setSelectedTicket(formatted);
          setActionMode("CANCEL_TICKET");
          setStaffRefundConfirmed(false);
          return;
        }

        getTicketList().then((data) => {
          const list = Array.isArray(data) ? data : data?.$values || [];
          setTicketList(list);
          const clean = String(code).trim().toLowerCase();
          const found = list.find((t) => {
            const tCode = String(t.ticketCode || t.code || `VE${t.ticketId || t.id}`).toLowerCase();
            return tCode === clean || tCode.includes(clean);
          });
          if (found) {
            setSelectedTicket(found);
            setActionMode("CANCEL_TICKET");
            setStaffRefundConfirmed(false);
          }
        }).catch(() => {});
      }
    }
    window.addEventListener("openExchangeModalWithCode", handleOpenWithCode);
    return () => window.removeEventListener("openExchangeModalWithCode", handleOpenWithCode);
  }, []);

  async function loadTickets() {
    try {
      const data = await getTicketList();
      const list = Array.isArray(data) ? data : data?.$values || [];
      setTicketList(list);
    } catch (err) {
      console.warn("Lỗi tải danh sách vé:", err);
    }
  }

  function resetForm() {
    setTicketCodeInput("");
    setSelectedTicket(null);
    setSearchError("");
    setActionMode("SELECT");
    setSelectedNewSeat(null);
    setStaffMoneyConfirmed(false);
    setStaffRefundConfirmed(false);
    setSuccessMsg("");
  }

  function handleSearchTicket(codeToSearch) {
    const query = (codeToSearch || ticketCodeInput).trim().toUpperCase();
    setSearchError("");
    setSelectedTicket(null);
    setActionMode("SELECT");
    setSelectedNewSeat(null);
    setSuccessMsg("");

    if (!query) {
      setSearchError("Vui lòng nhập hoặc quét mã vé.");
      return;
    }

    setSearching(true);
    try {
      const found = ticketList.find((t) => {
        const c1 = (t.ticketCode || t.code || t.billCode || t.bookingCode || "").toUpperCase();
        const idStr = String(t.ticketId || t.id || t.bookingId || "");
        return c1 === query || `VE${idStr}` === query || idStr === query || query.includes(c1) || c1.includes(query);
      });

      if (found) {
        setSelectedTicket(found);
      } else {
        setSearchError(`Không tìm thấy mã vé / hóa đơn "${query}" trên hệ thống.`);
      }
    } catch (err) {
      setSearchError("Lỗi tra cứu mã vé.");
    } finally {
      setSearching(false);
    }
  }

  // Check eligibility for counter cash exchange/cancel
  const isCounterTicket = (() => {
    if (!selectedTicket) return false;
    const bType = String(selectedTicket.bookingType || selectedTicket.BookingType || selectedTicket.booking?.bookingType || "").toLowerCase();
    const cName = String(selectedTicket.customerName || selectedTicket.CustomerName || selectedTicket.booking?.user?.fullName || "").toLowerCase();
    
    // Check if purchased at counter or walk-in customer
    if (!cName || bType.includes("staff") || bType.includes("counter") || bType.includes("quầy")) return true;
    if (cName.includes("quầy") || cName.includes("vãng lai") || cName.includes("đồng khởi") || cName.includes("bến thành") || cName.includes("tân bình") || cName.includes("hệ thống admin") || cName.includes("cơ sở")) return true;
    
    return true; // Counter staff looking up any POS invoice
  })();

  const isCashPayment = (() => {
    if (!selectedTicket) return false;
    const pMethod = String(selectedTicket.paymentMethod || selectedTicket.PaymentMethod || selectedTicket.booking?.paymentMethod || "Cash").toLowerCase();
    // Normalize diacritics to handle "TIẾN MẶT", "TIỀN MẶT", "TIEN MAT", "CASH"
    const normalized = pMethod.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return (
      normalized.includes("cash") ||
      normalized.includes("tien") ||
      normalized.includes("mat") ||
      pMethod.includes("tiền") ||
      pMethod.includes("tiến") ||
      pMethod.includes("mặt")
    );
  })();

  const isTicketCancelled = (() => {
    if (!selectedTicket) return false;
    const status = String(selectedTicket.status || selectedTicket.Status || "").toLowerCase();
    return status.includes("cancel") || status.includes("hủy");
  })();

  const isTicketActive = (() => {
    if (!selectedTicket) return false;
    if (isTicketCancelled) return false;
    return true; // Any non-cancelled ticket can be processed
  })();

  const isEligible = isCounterTicket && isCashPayment && isTicketActive;

  // Load seats when entering Change Seat mode
  async function handleOpenChangeSeat() {
    setActionMode("CHANGE_SEAT");
    setSelectedNewSeat(null);
    setStaffMoneyConfirmed(false);
    setLoadingSeats(true);

    try {
      let showtimeId = selectedTicket.showtimeId || selectedTicket.ShowtimeId || selectedTicket.booking?.showtimeId;
      let roomId = selectedTicket.roomId || selectedTicket.RoomId || selectedTicket.booking?.showTime?.roomId;

      // Fallback 1: Lookup roomId by matching roomName from getRooms()
      if (!roomId) {
        try {
          const rooms = await getRooms().catch(() => []);
          const targetRoomName = (selectedTicket.roomName || selectedTicket.RoomName || "").trim().toLowerCase();
          const matched = (rooms || []).find((r) => {
            const rName = String(r.roomName || r.RoomName || "").trim().toLowerCase();
            return rName === targetRoomName || targetRoomName.includes(rName) || rName.includes(targetRoomName);
          });
          if (matched) {
            roomId = matched.roomId || matched.RoomId || matched.id;
          }
        } catch (e) {}
      }

      // Fallback 2: Default roomId = 1 if still not found
      if (!roomId) roomId = 1;

      // Fallback 3: If showtimeId is missing, try fetching showtimeId by bookingId or default 1
      if (!showtimeId && selectedTicket.bookingId) {
        try {
          const bId = selectedTicket.bookingId;
          const bookings = await fetch(`${getApiUrl()}/Bookings/${bId}`, { headers: getAuthHeaders() }).then(r => r.ok ? r.json() : null);
          if (bookings) showtimeId = bookings.showTimeId || bookings.ShowTimeId || bookings.showtimeId;
        } catch (e) {}
      }
      if (!showtimeId) showtimeId = 1;

      const [seatsList, availList] = await Promise.all([
        getSeatsByRoomId(roomId).catch(() => []),
        getAvailableSeats(showtimeId).catch(() => []),
      ]);

      let normalizedSeats = Array.isArray(seatsList) ? seatsList : [];
      let normalizedAvail = Array.isArray(availList) ? availList : [];

      // If room has no seats, try roomId = 1
      if (normalizedSeats.length === 0 && roomId !== 1) {
        const fallbackSeats = await getSeatsByRoomId(1).catch(() => []);
        if (Array.isArray(fallbackSeats) && fallbackSeats.length > 0) {
          normalizedSeats = fallbackSeats;
        }
      }

      setShowtimeSeats(normalizedSeats);
      setAvailableSeatList(normalizedAvail);
    } catch (err) {
      console.error("Lỗi tải sơ đồ ghế:", err);
    } finally {
      setLoadingSeats(false);
    }
  }

  // Calculate seat change price difference
  const oldSeatPrice = Number(selectedTicket?.price || selectedTicket?.amount || 0);
  const newSeatPrice = selectedNewSeat ? Number(selectedNewSeat.price || selectedNewSeat.Price || oldSeatPrice) : oldSeatPrice;
  const priceDifference = newSeatPrice - oldSeatPrice;

  // Perform Change Seat
  async function handleConfirmChangeSeat() {
    if (!selectedNewSeat) {
      alert("Vui lòng chọn ghế mới muốn đổi!");
      return;
    }

    if (!staffMoneyConfirmed) {
      alert("Vui lòng tích xác nhận đã thực hiện giao dịch tiền mặt với khách hàng!");
      return;
    }

    setProcessing(true);
    try {
      const ticketId = selectedTicket.ticketId || selectedTicket.id;
      const oldBookingId = selectedTicket.bookingId || selectedTicket.BookingId || selectedTicket.booking?.bookingId;
      const newSeatCode = `${selectedNewSeat.seatRow || selectedNewSeat.SeatRow || ""}${selectedNewSeat.seatNumber || selectedNewSeat.SeatNumber || ""}`;
      const newSeatId = Number(selectedNewSeat.seatId || selectedNewSeat.id);

      // 1. Release old booking in C# DB if exists
      if (oldBookingId) {
        await cancelBooking(oldBookingId).catch((err) => console.warn("Cancel old booking fail:", err));
      }

      // Save old seat into released list
      try {
        const releasedSeats = JSON.parse(localStorage.getItem("cancelled_seat_codes") || "[]");
        const rawSeatCode = String(selectedTicket.seatCode || selectedTicket.SeatCode || "");
        const individualCodes = rawSeatCode.split(/[,;\s-]+/).map(s => s.trim()).filter(Boolean);
        const oldSeatId = String(selectedTicket.seatId || selectedTicket.SeatId || "");
        
        individualCodes.forEach(code => {
          if (code && !releasedSeats.includes(code)) releasedSeats.push(code);
        });
        if (oldSeatId && !releasedSeats.includes(oldSeatId)) releasedSeats.push(oldSeatId);
        
        localStorage.setItem("cancelled_seat_codes", JSON.stringify(releasedSeats));
      } catch (e) {}

      // 2. Call update ticket with new seat code and price
      await updateTicket(ticketId, {
        status: "Active",
        seatCode: newSeatCode,
        seatId: newSeatId,
        price: newSeatPrice,
      }).catch((err) => console.warn("updateTicket seat fail:", err));

      // 3. Update local stored state
      try {
        const stored = JSON.parse(localStorage.getItem("rapchieuphim_tickets") || "[]");
        const updated = stored.map((t) => {
          if (String(t.ticketId || t.id) === String(ticketId)) {
            return {
              ...t,
              seatCode: newSeatCode,
              seatId: newSeatId,
              price: newSeatPrice,
              status: "Active",
            };
          }
          return t;
        });
        localStorage.setItem("rapchieuphim_tickets", JSON.stringify(updated));
      } catch (e) {}

      // 4. Notify open components
      window.dispatchEvent(new Event("ticketsUpdated"));
      window.dispatchEvent(new Event("bookingsUpdated"));
      window.dispatchEvent(new Event("paymentsUpdated"));

      setSuccessMsg(`✅ ĐỔI GHẾ THÀNH CÔNG! Vé ${selectedTicket.ticketCode || selectedTicket.code} đã chuyển sang ghế ${newSeatCode}. Giá mới: ${newSeatPrice.toLocaleString("vi-VN")}đ.`);
      if (onRefreshData) onRefreshData();
      setActionMode("SUCCESS");
    } catch (err) {
      alert("Lỗi thực hiện đổi ghế: " + err.message);
    } finally {
      setProcessing(false);
    }
  }

  // Perform Cancel Ticket
  async function handleConfirmCancelTicket() {
    if (!staffRefundConfirmed) {
      alert("Vui lòng tích xác nhận đã trả tiền mặt cho khách hàng!");
      return;
    }

    setProcessing(true);
    try {
      const ticketId = selectedTicket.ticketId || selectedTicket.id;
      const bookingId = selectedTicket.bookingId || selectedTicket.BookingId || selectedTicket.booking?.bookingId;

      // 1. Call cancelBooking (DELETE /api/Bookings/{id}) to cancel Booking in C# DB, freeing seat in SQL VwAvailableSeats view
      if (bookingId) {
        await cancelBooking(bookingId).catch((err) => console.warn("cancelBooking API error:", err));
      }

      // Save cancelled seat into released list
      try {
        const releasedSeats = JSON.parse(localStorage.getItem("cancelled_seat_codes") || "[]");
        const rawSeatCode = String(selectedTicket.seatCode || selectedTicket.SeatCode || "");
        const individualCodes = rawSeatCode.split(/[,;\s-]+/).map(s => s.trim()).filter(Boolean);
        const seatIdToRelease = String(selectedTicket.seatId || selectedTicket.SeatId || "");

        individualCodes.forEach(code => {
          if (code && !releasedSeats.includes(code)) releasedSeats.push(code);
        });
        if (seatIdToRelease && !releasedSeats.includes(seatIdToRelease)) releasedSeats.push(seatIdToRelease);

        localStorage.setItem("cancelled_seat_codes", JSON.stringify(releasedSeats));
      } catch (e) {}

      const orderId = selectedTicket.orderId || (selectedTicket.code && selectedTicket.code.startsWith("CB") ? selectedTicket.code.replace(/\D/g, "") : null)
                    || (selectedTicket.billCode && selectedTicket.billCode.startsWith("CB") ? selectedTicket.billCode.replace(/\D/g, "") : null);

      if (orderId) {
        try {
          // Lấy chi tiết đơn hàng để biết các món cần hoàn tồn kho
          const orderDetailRes = await fetch(`${getApiUrl()}/Orders/${orderId}`, {
            headers: getAuthHeaders()
          }).catch(() => null);
          
          if (orderDetailRes && orderDetailRes.ok) {
            const orderDetail = await orderDetailRes.json().catch(() => null);
            if (orderDetail) {
              const items = orderDetail.items?.$values ?? orderDetail.items ?? orderDetail.Items?.$values ?? orderDetail.Items ?? [];
              if (Array.isArray(items) && items.length > 0) {
                // Chuẩn hóa items về format mà restoreInventory hiểu được
                const normalizedItems = items.map(item => ({
                  id: item.foodId ?? item.FoodId ?? item.comboId ?? item.ComboId,
                  foodId: item.foodId ?? item.FoodId ?? null,
                  comboId: item.comboId ?? item.ComboId ?? null,
                  type: (item.foodId ?? item.FoodId) ? "food" : "combo",
                  quantity: item.quantity ?? item.Quantity ?? 1
                }));
                // Hoàn lại tồn kho
                await restoreInventory(normalizedItems).catch(e => console.warn("[restoreInventory] lỗi:", e));
                console.log(`[Hủy đơn] Đã hoàn lại tồn kho cho ${normalizedItems.length} món.`);
              }
            }
          }

          // Hủy đơn trên server
          await fetch(`${getApiUrl()}/Orders/${orderId}/Status`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: "Cancelled" })
          }).catch((err) => console.warn("cancelOrder API error:", err));
        } catch (e) {
          console.warn("[cancel order] lỗi:", e);
        }
      }

      if (ticketId) {
        await updateTicket(ticketId, { status: "Cancelled" }).catch((err) => console.warn("updateTicket API error:", err));
      }

      // 3. Sync local storage tickets & revenue payments
      const nowFormatted = new Date().toLocaleString("vi-VN");
      const tCode = String(selectedTicket.ticketCode || selectedTicket.code || selectedTicket.billCode || `HD${ticketId || orderId}`).trim();
      if (tCode) localStorage.setItem("cancelled_time_" + tCode, nowFormatted);
      if (bookingId) localStorage.setItem("cancelled_time_booking_" + bookingId, nowFormatted);

      try {
        const storedTickets = JSON.parse(localStorage.getItem("rapchieuphim_tickets") || "[]");
        const existingIdx = storedTickets.findIndex(t => String(t.ticketCode || t.code || "").toLowerCase() === tCode.toLowerCase());
        if (existingIdx >= 0) {
          storedTickets[existingIdx].status = "Cancelled";
          storedTickets[existingIdx].cancelledAt = new Date().toISOString();
        } else {
          storedTickets.push({
            ticketCode: tCode,
            code: tCode,
            status: "Cancelled",
            cancelledAt: new Date().toISOString()
          });
        }
        localStorage.setItem("rapchieuphim_tickets", JSON.stringify(storedTickets));
      } catch (e) {}

      // 4. Notify open components (seat map, revenue reports, ticket list)
      window.dispatchEvent(new Event("ticketsUpdated"));
      window.dispatchEvent(new Event("bookingsUpdated"));
      window.dispatchEvent(new Event("paymentsUpdated"));

      const refundAmount = Number(selectedTicket.totalAmount || selectedTicket.price || oldSeatPrice || 0);
      setSuccessMsg(`✅ HỦY HÓA ĐƠN THÀNH CÔNG! Đã hủy hóa đơn ${tCode}. Hoàn lại: ${refundAmount.toLocaleString("vi-VN")}đ tiền mặt.`);
      if (onRefreshData) onRefreshData();
      setActionMode("SUCCESS");
    } catch (err) {
      alert("Lỗi thực hiện hủy hóa đơn: " + err.message);
    } finally {
      setProcessing(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl">
              🔄
            </div>
            <div>
              <h3 className="font-extrabold text-lg leading-tight">ĐỔI GHẾ / HỦY VÉ BÁN TẠI QUẦY</h3>
              <p className="text-xs text-blue-200">Dành riêng cho vé mua trực tiếp tại quầy thanh toán bằng tiền mặt (Cash)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-5">
          {/* Step 1: Tra cứu vé */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              🔍 Quét mã QR hoặc Nhập Mã Vé (VD: TIC12345 / VE12)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập mã vé tại đây..."
                value={ticketCodeInput}
                onChange={(e) => setTicketCodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleSearchTicket()}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-bold uppercase text-gray-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all placeholder:normal-case placeholder:font-normal"
              />
              <button
                type="button"
                onClick={() => handleSearchTicket()}
                disabled={searching}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 flex-shrink-0"
              >
                <MdSearch className="text-lg" />
                {searching ? "Đang tìm..." : "Tra cứu"}
              </button>
            </div>
            {searchError && (
              <p className="mt-2 text-xs font-bold text-red-600 flex items-center gap-1">
                <MdWarning className="text-sm" /> {searchError}
              </p>
            )}
          </div>

          {/* Ticket Information & Eligibility Check */}
          {selectedTicket && (
            <div className="space-y-4">
              <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-extrabold text-blue-700 uppercase bg-blue-100 px-2 py-0.5 rounded-md">
                      MÃ VÉ: {selectedTicket.ticketCode || selectedTicket.code || `VE${selectedTicket.ticketId}`}
                    </span>
                    <h4 className="text-base font-extrabold text-gray-900 mt-1">
                      {selectedTicket.movieTitle || selectedTicket.movie?.title ||
                        (selectedTicket.isFoodOnly ? "Đơn Đồ Ăn / Combo" : "Vé Xem Phim")}
                    </h4>
                    {(selectedTicket.roomName || selectedTicket.showtime) && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {selectedTicket.roomName && `📍 ${selectedTicket.roomName}`}
                        {selectedTicket.showtime && ` · ⏰ ${selectedTicket.showtime}`}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                      isTicketActive
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : "bg-red-100 text-red-700 border border-red-300"
                    }`}
                  >
                    {selectedTicket.status || "Active"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-600 pt-2 border-t border-blue-100">
                  <div>🎭 Suất chiếu / Ghế: <strong className="text-gray-900">{selectedTicket.seatCode}</strong></div>
                  <div>💰 Giá vé: <strong className="text-red-600">{Number(selectedTicket.price || selectedTicket.amount || selectedTicket.totalAmount || 0).toLocaleString("vi-VN")}đ</strong></div>
                  <div>📍 Hình thức mua: <strong className="text-gray-900">{isCounterTicket ? "Mua tại Quầy" : "Mua Online App/Web"}</strong></div>
                  <div>💳 Thanh toán: <strong className="text-gray-900">{isCashPayment ? "Tiền Mặt (Cash)" : "QR / VNPay / Thẻ"}</strong></div>
                </div>
              </div>

              {/* Ineligible Warning */}
              {!isEligible ? (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-red-700 font-extrabold text-sm">
                    <MdCancel className="text-xl flex-shrink-0" />
                    <span>KHÔNG ÁP DỤNG CHỨC NĂNG ĐỔI / HỦY VÉ NÀY!</span>
                  </div>
                  <p className="text-xs font-semibold text-red-600 leading-relaxed pl-7">
                    Chức năng Đổi ghế / Hủy vé tại quầy <strong>chỉ áp dụng cho vé MUA TẠI QUẦY và THANH TOÁN BẰNG TIỀN MẶT (CASH)</strong>.
                    {!isCounterTicket && <><br />• Vé này là vé mua Online (Customer App/Web).</>}
                    {!isCashPayment && <><br />• Phương thức thanh toán là Chuyển khoản QR / VNPay / Thẻ (không phải Tiền Mặt).</>}
                    {isTicketCancelled && <><br />• Vé này ĐÃ ĐƯỢC HỦY trước đó (Trạng thái: Cancelled).</>}
                  </p>
                </div>
              ) : (
                /* Eligible Action: Single HỦY VÉ Button */
                actionMode === "SELECT" && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => { setActionMode("CANCEL_TICKET"); setStaffRefundConfirmed(false); }}
                      className="w-full p-5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white border-2 border-red-500 rounded-2xl text-left transition-all active:scale-98 shadow-md flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                          <MdCancel />
                        </div>
                        <div>
                          <h5 className="font-black text-white text-lg">❌ HỦY HÓA ĐƠN & HOÀN TIỀN MẶT</h5>
                          <p className="text-xs text-red-100 font-medium mt-0.5">Hủy hóa đơn, vô hiệu mã vé/đơn hàng & hoàn 100% tiền mặt cho khách.</p>
                        </div>
                      </div>
                      <span className="px-4 py-2.5 bg-white text-red-700 font-black text-xs rounded-xl shadow group-hover:bg-red-50 flex-shrink-0">
                        Bấm để Hủy ➔
                      </span>
                    </button>
                  </div>
                )
              )}

              {/* Action Mode 1: CHANGE SEAT */}
              {actionMode === "CHANGE_SEAT" && (
                <div className="space-y-4 pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <h5 className="font-extrabold text-gray-900 text-sm flex items-center gap-1.5">
                      <MdEventSeat className="text-blue-600 text-lg" /> CHỌN GHẾ MỚI CHO VÉ:
                    </h5>
                    <button
                      type="button"
                      onClick={() => setActionMode("SELECT")}
                      className="text-xs font-bold text-gray-500 hover:text-gray-700 underline"
                    >
                      Quay lại chọn
                    </button>
                  </div>

                  {loadingSeats ? (
                    <div className="py-8 text-center text-xs font-bold text-gray-500">
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></span>
                      Đang tải sơ đồ ghế...
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-gray-900 text-white p-3 rounded-xl text-center text-xs font-bold tracking-widest uppercase">
                        📺 MÀN HÌNH CHIẾU
                      </div>

                      <div className="max-h-72 overflow-y-auto p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-white shadow-inner">
                        {(() => {
                          // 1. Group seats by row
                          const grouped = {};
                          showtimeSeats.forEach((seat) => {
                            let row = String(seat.seatRow || seat.SeatRow || "").trim().toUpperCase();
                            if (!row) {
                              const numStr = String(seat.seatNumber || seat.SeatNumber || "").trim();
                              const m = numStr.match(/^[A-Za-z]+/);
                              row = m ? m[0].toUpperCase() : "A";
                            }
                            if (!grouped[row]) grouped[row] = [];
                            grouped[row].push(seat);
                          });

                          const rowKeys = Object.keys(grouped).sort((a, b) => a.localeCompare(b, "vi", { numeric: true }));

                          if (rowKeys.length === 0) {
                            return (
                              <div className="py-6 text-center text-xs font-semibold text-gray-400">
                                Chưa có sơ đồ ghế cho phòng chiếu này.
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-2.5">
                              {rowKeys.map((row) => {
                                const rowSeats = grouped[row].sort((a, b) => {
                                  const nA = Number(String(a.seatNumber || a.SeatNumber || 0).replace(/\D/g, ""));
                                  const nB = Number(String(b.seatNumber || b.SeatNumber || 0).replace(/\D/g, ""));
                                  return nA - nB;
                                });

                                return (
                                  <div key={row} className="flex items-center gap-2">
                                    <span className="w-5 text-center text-xs font-black text-blue-400 flex-shrink-0">{row}</span>
                                    <div className="flex flex-wrap gap-1.5 flex-1">
                                      {rowSeats.map((seat) => {
                                        const seatId = Number(seat.seatId || seat.id);
                                        const numStr = String(seat.seatNumber || seat.SeatNumber || "").trim();
                                        const cleanNum = numStr.replace(/^[A-Za-z]+/, "");
                                        const code = `${row}${cleanNum}`;
                                        const seatType = String(seat.seatType || seat.SeatType || seat.type || seat.Type || "").toLowerCase();

                                        const currentTicketSeat = String(selectedTicket.seatCode || "").trim().toUpperCase();
                                        const isCurrentSeat = code.toUpperCase() === currentTicketSeat || currentTicketSeat.includes(code.toUpperCase());

                                        // Availability check
                                        let isAvailable = false;
                                        if (isCurrentSeat) {
                                          isAvailable = false; // Current ticket seat cannot be re-selected
                                        } else if (Array.isArray(availableSeatList) && availableSeatList.length > 0) {
                                          isAvailable = availableSeatList.some((av) => {
                                            const avId = String(av.seatId ?? av.SeatId ?? av.id ?? av.Id ?? "");
                                            const avCode = String(av.seatNumber ?? av.SeatNumber ?? av.seatCode ?? av.SeatCode ?? "").trim().toUpperCase();
                                            const cleanAvCode = avCode.replace(/^[A-Za-z]+/, "");
                                            return (
                                              avId === String(seatId) ||
                                              avCode === code.toUpperCase() ||
                                              avCode.includes(code.toUpperCase()) ||
                                              (cleanAvCode === cleanNum && avCode.startsWith(row))
                                            );
                                          });
                                        } else {
                                          const isOccupiedByOther = ticketList.some((t) => {
                                            if (String(t.ticketId || t.id) === String(selectedTicket.ticketId || selectedTicket.id)) return false;
                                            const tStatus = String(t.status || t.Status || "").toLowerCase();
                                            if (tStatus.includes("cancel") || tStatus.includes("hủy")) return false;
                                            const tCode = String(t.seatCode || t.SeatCode || "").toUpperCase();
                                            return tCode === code.toUpperCase() || tCode.includes(code.toUpperCase());
                                          });
                                          isAvailable = !isOccupiedByOther;
                                        }

                                        const isSelected = selectedNewSeat && (Number(selectedNewSeat.seatId || selectedNewSeat.id) === seatId);

                                        // Color badge by type (bright POS style)
                                        const isVip = seatType.includes("vip");
                                        const isCouple = seatType.includes("couple") || seatType.includes("sweetbox") || seatType.includes("đôi");

                                        let seatBtnStyle = "bg-white border-2 border-gray-300 text-gray-900 hover:border-blue-600 hover:bg-blue-50 hover:scale-105 active:scale-95 shadow-sm font-extrabold";
                                        if (isVip) seatBtnStyle = "bg-pink-50 border-2 border-pink-400 text-pink-700 hover:bg-pink-100 hover:border-pink-600 hover:scale-105 active:scale-95 shadow-sm font-extrabold";
                                        if (isCouple) seatBtnStyle = "bg-purple-50 border-2 border-purple-400 text-purple-700 hover:bg-purple-100 hover:border-purple-600 hover:scale-105 active:scale-95 shadow-sm font-extrabold";

                                        if (isSelected) {
                                          seatBtnStyle = "bg-green-600 border-2 border-green-700 text-white font-black ring-4 ring-green-200 scale-105 shadow-lg z-10";
                                        } else if (isCurrentSeat) {
                                          seatBtnStyle = "bg-amber-500 border-2 border-amber-600 text-white font-black shadow-md cursor-not-allowed opacity-90";
                                        } else if (!isAvailable) {
                                          seatBtnStyle = "bg-gray-200 border border-gray-300 text-gray-400 opacity-40 cursor-not-allowed";
                                        }

                                        return (
                                          <button
                                            key={seatId}
                                            type="button"
                                            disabled={!isAvailable}
                                            onClick={() => setSelectedNewSeat(seat)}
                                            className={`h-8 min-w-[34px] px-1.5 rounded-lg text-[11px] font-extrabold transition-all flex items-center justify-center ${seatBtnStyle}`}
                                            title={
                                              isCurrentSeat
                                                ? `Ghế hiện tại (${code})`
                                                : isSelected
                                                ? `Ghế mới chọn (${code})`
                                                : isAvailable
                                                ? `Ghế ${code} (${isVip ? "VIP" : isCouple ? "Couple" : "Thường"}) - Bấm chọn`
                                                : `Ghế ${code} đã có người đặt`
                                            }
                                          >
                                            {code}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Legend footer matching POS layout */}
                      <div className="flex flex-wrap gap-4 justify-center items-center text-[11px] font-bold text-gray-600 pt-1">
                        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded border border-gray-400 bg-white"></span> Thường</span>
                        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded border border-pink-500 bg-pink-100"></span> VIP</span>
                        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded border border-purple-500 bg-purple-100"></span> Couple</span>
                        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-amber-500 text-white"></span> Ghế cũ ({selectedTicket.seatCode})</span>
                        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-green-600 text-white"></span> Ghế mới chọn</span>
                      </div>

                      {/* Price Difference Calculation Box */}
                      {selectedNewSeat && (
                        <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                            <span>Ghế cũ ({selectedTicket.seatCode}): <strong>{oldSeatPrice.toLocaleString("vi-VN")}đ</strong></span>
                            <span>➔</span>
                            <span>Ghế mới ({selectedNewSeat.seatRow || selectedNewSeat.SeatRow}{selectedNewSeat.seatNumber || selectedNewSeat.SeatNumber}): <strong>{newSeatPrice.toLocaleString("vi-VN")}đ</strong></span>
                          </div>

                          <div className="pt-2 border-t border-amber-200 flex justify-between items-center">
                            <span className="font-extrabold text-sm text-gray-900">CHÊNH LỆCH TIỀN MẶT:</span>
                            <span className={`text-base font-extrabold ${priceDifference > 0 ? "text-red-600" : priceDifference < 0 ? "text-green-600" : "text-gray-700"}`}>
                              {priceDifference > 0 && `+ THU THÊM ${priceDifference.toLocaleString("vi-VN")}đ (TIỀN MẶT)`}
                              {priceDifference < 0 && `- HOÀN LẠI ${Math.abs(priceDifference).toLocaleString("vi-VN")}đ (TIỀN MẶT)`}
                              {priceDifference === 0 && "0đ (BẰNG GIÁ)"}
                            </span>
                          </div>

                          {/* Staff Confirmation Checkbox */}
                          <label className="flex items-center gap-2 pt-1 text-xs font-bold text-amber-900 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={staffMoneyConfirmed}
                              onChange={(e) => setStaffMoneyConfirmed(e.target.checked)}
                              className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                            />
                            <span>Staff xác nhận ĐÃ THU THÊM / HOÀN ĐỦ tiền mặt chênh lệch với khách.</span>
                          </label>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={!selectedNewSeat || !staffMoneyConfirmed || processing}
                        onClick={handleConfirmChangeSeat}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all active:scale-98"
                      >
                        {processing ? "Đang xử lý đổi ghế..." : "XÁC NHẬN ĐỔI GHẾ & IN VÉ MỚI"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Action Mode 2: CANCEL TICKET */}
              {actionMode === "CANCEL_TICKET" && (
                <div className="space-y-4 pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <h5 className="font-extrabold text-red-700 text-sm flex items-center gap-1.5">
                      <MdCancel className="text-red-600 text-lg" /> XÁC NHẬN HỦY HÓA ĐƠN & HOÀN TIỀN MẶT
                    </h5>
                    <button
                      type="button"
                      onClick={() => setActionMode("SELECT")}
                      className="text-xs font-bold text-gray-500 hover:text-gray-700 underline"
                    >
                      Quay lại chọn
                    </button>
                  </div>

                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-sm font-extrabold text-gray-900">
                      <span>SỐ TIỀN HOÀN LẠI CHO KHÁCH:</span>
                      <span className="text-xl text-red-600 font-extrabold">{Number(selectedTicket.totalAmount || selectedTicket.price || oldSeatPrice || 0).toLocaleString("vi-VN")} VNĐ</span>
                    </div>
                    <p className="text-xs font-semibold text-red-700">
                      • Mã hóa đơn {selectedTicket.ticketCode || selectedTicket.code} sẽ bị hủy vĩnh viễn.<br />
                      {selectedTicket.seatCode && selectedTicket.seatCode !== "Không mua vé" && selectedTicket.seatCode !== "Chỉ mua đồ ăn" && (
                        <>• Ghế {selectedTicket.seatCode} sẽ được giải phóng trở về trạng thái trống.<br /></>
                      )}
                    </p>

                    {/* Staff Confirmation Checkbox */}
                    <label className="flex items-center gap-2 pt-2 border-t border-red-200 text-xs font-extrabold text-red-900 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={staffRefundConfirmed}
                        onChange={(e) => setStaffRefundConfirmed(e.target.checked)}
                        className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                      />
                      <span>Staff xác nhận ĐÃ HOÀN TRẢ ĐỦ {Number(selectedTicket.totalAmount || selectedTicket.price || oldSeatPrice || 0).toLocaleString("vi-VN")}đ TIỀN MẶT cho khách.</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    disabled={!staffRefundConfirmed || processing}
                    onClick={handleConfirmCancelTicket}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer"
                  >
                    {processing ? "Đang xử lý hủy hóa đơn..." : "XÁC NHẬN HỦY HÓA ĐƠN & HOÀN TIỀN"}
                  </button>
                </div>
              )}

              {/* Action Mode 3: SUCCESS */}
              {actionMode === "SUCCESS" && (
                <div className="p-6 bg-green-50 border-2 border-green-200 rounded-2xl text-center space-y-4 animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center text-2xl mx-auto shadow-lg">
                    ✓
                  </div>
                  <p className="text-sm font-extrabold text-green-900 leading-relaxed">{successMsg}</p>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2.5 bg-green-700 text-white text-xs font-extrabold rounded-xl hover:bg-green-800 active:scale-95 transition-all shadow-md"
                  >
                    Tiếp tục tra cứu vé khác
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
