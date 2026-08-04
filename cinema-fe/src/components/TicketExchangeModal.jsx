import { useState, useEffect } from "react";
import { MdSearch, MdClose, MdRefresh, MdCancel, MdCheckCircle, MdWarning, MdPrint, MdConfirmationNumber, MdEventSeat, MdAttachMoney } from "react-icons/md";
import { getTicketList, updateTicket, requestSeatExchange, confirmCashSeatExchange } from "../pages/Admin/Ticket/ticketService";
import { getSeatsByRoomId, getAvailableSeats, cancelBooking, getRooms } from "../pages/Booking/bookingService";
import { restoreInventory } from "../pages/Staff/Combo/ComboService";
import { getApiUrl, getAuthHeaders, clearApiCache } from "../services/apiHelper";
import "../pages/Staff/BanVe/BanVe.css";

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

  // Cash Payment Modal states for seat exchange
  const [cashPaymentModalOpen, setCashPaymentModalOpen] = useState(false);
  const [pendingExchange, setPendingExchange] = useState(null); // { exchangeId, additionalAmount, holdUntil, newSeatCode, newSeatPrice }
  const [customerPaidAmount, setCustomerPaidAmount] = useState("");
  const [cashPaymentError, setCashPaymentError] = useState("");

  // Room type and pricing states
  const [pricingList, setPricingList] = useState([]);
  const [currentRoomType, setCurrentRoomType] = useState("2D");

  useEffect(() => {
    if (isOpen) {
      loadTickets();
      loadPricings();
      resetForm();
    }
  }, [isOpen]);

  async function loadPricings() {
    try {
      const response = await fetch(`${getApiUrl()}/TicketPricing/Active`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : data?.$values || [];
        setPricingList(list);
      }
    } catch (e) {
      console.warn("Lỗi tải bảng giá:", e);
    }
  }

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
          setActionMode("SELECT");
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
            setActionMode("SELECT");
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
    setCashPaymentModalOpen(false);
    setPendingExchange(null);
    setCustomerPaidAmount("");
    setCashPaymentError("");
  }

  async function handleSearchTicket(codeToSearch) {
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
      // Clear cache to always get the latest tickets directly from Database
      clearApiCache();
      const data = await getTicketList();
      const list = Array.isArray(data) ? data : data?.$values || [];
      setTicketList(list);

      const found = list.find((t) => {
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

      // Fallback 1: Lookup roomId by matching roomName from getRooms() if roomId is not yet determined
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
            setCurrentRoomType(matched.roomType || matched.RoomType || "2D");
          } else {
            setCurrentRoomType("2D");
          }
        } catch (e) {
          setCurrentRoomType("2D");
        }
      } else {
        // Just resolve roomType if roomId is already known
        try {
          const rooms = await getRooms().catch(() => []);
          const matched = (rooms || []).find(r => String(r.roomId || r.RoomId || r.id) === String(roomId));
          if (matched) {
            setCurrentRoomType(matched.roomType || matched.RoomType || "2D");
          } else {
            setCurrentRoomType("2D");
          }
        } catch (e) {
          setCurrentRoomType("2D");
        }
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
  const oldSeatPrice = Number(selectedTicket?.price || selectedTicket?.amount || selectedTicket?.booking?.ticketPrice || 0);

  const newSeatPrice = (() => {
    if (!selectedNewSeat) return oldSeatPrice;

    const showtimeDate = selectedTicket.showtimeStart || selectedTicket.ShowtimeStart || selectedTicket.showtime || selectedTicket.Showtime || selectedTicket.booking?.showTime?.startTime || selectedTicket.booking?.showTime?.StartTime;
    const newType = selectedNewSeat.seatType || selectedNewSeat.SeatType || "Standard";

    // 1. Determine DayType (Weekday / Weekend)
    let dayType = "Weekday";
    if (showtimeDate) {
      const dt = new Date(showtimeDate);
      if (!isNaN(dt.getTime())) {
        const day = dt.getDay();
        if (day === 0 || day === 6) {
          dayType = "Weekend";
        }
      }
    }

    const rType = String(currentRoomType || "2D").trim().toUpperCase();
    const sType = String(newType).trim().toLowerCase();

    let targetSeatType = "Standard";
    if (sType.includes("vip")) targetSeatType = "VIP";
    else if (sType.includes("couple") || sType.includes("sweetbox") || sType.includes("đôi")) targetSeatType = "Couple";

    // 2. Find matching pricing rule
    const match = (pricingList || []).find(p => {
      const pRoom = String(p.roomType || p.RoomType || "").trim().toUpperCase();
      const pSeat = String(p.seatType || p.SeatType || "").trim().toUpperCase();
      const pDay = String(p.dayType || p.DayType || "").trim().toUpperCase();

      return (pRoom === rType || !pRoom) &&
             (pSeat === targetSeatType.toUpperCase()) &&
             (pDay === dayType.toUpperCase() || !pDay);
    });

    if (match) {
      return Number(match.price || match.Price || 0);
    }

    // Không tự suy diễn/hard-code giá ở Frontend. Backend sẽ kiểm tra lại giá SQL.
    return oldSeatPrice;
  })();

  const priceDifference = newSeatPrice - oldSeatPrice;

  // Helper notify local & window updates
  function notifySystemUpdates(ticketId, newSeatCode, newSeatId, newSeatPrice) {
    try {
      const stored = JSON.parse(localStorage.getItem("rapchieuphim_tickets") || "[]");
      const updated = stored.map((t) => {
        if (String(t.ticketId || t.id) === String(ticketId)) {
          return {
            ...t,
            seatCode: newSeatCode,
            seatId: newSeatId,
            price: newSeatPrice,
            ticketPrice: newSeatPrice,
            seatPrice: newSeatPrice,
            status: "Active",
          };
        }
        return t;
      });
      localStorage.setItem("rapchieuphim_tickets", JSON.stringify(updated));
    } catch (e) {}

    try {
      const saved = JSON.parse(localStorage.getItem("customer_ticket_discounts") || "{}");
      const bookingId = selectedTicket?.bookingId ?? selectedTicket?.BookingId ?? selectedTicket?.booking?.bookingId;
      const ticketCode = selectedTicket?.ticketCode ?? selectedTicket?.TicketCode ?? selectedTicket?.code;
      const keys = [bookingId, ticketCode].filter(Boolean).map(String);
      keys.forEach((key) => {
        saved[key] = {
          ...(saved[key] || {}),
          seatCode: newSeatCode,
          seatsList: [newSeatCode],
          seatId: newSeatId,
          seatPrice: newSeatPrice,
          ticketPrice: newSeatPrice,
          ticketSubtotal: newSeatPrice,
        };
      });
      localStorage.setItem("customer_ticket_discounts", JSON.stringify(saved));
    } catch (e) {}

    setSelectedTicket((previous) => previous ? {
      ...previous,
      seatCode: newSeatCode,
      seatNumber: newSeatCode,
      seatId: newSeatId,
      price: newSeatPrice,
      ticketPrice: newSeatPrice,
      seatPrice: newSeatPrice,
    } : previous);

    window.dispatchEvent(new Event("ticketsUpdated"));
    window.dispatchEvent(new Event("bookingsUpdated"));
    window.dispatchEvent(new Event("paymentsUpdated"));
  }

  // Perform Change Seat — Step 1: Request Exchange
  async function handleConfirmChangeSeat() {
    if (!selectedNewSeat) {
      alert("Vui lòng chọn ghế mới muốn đổi!");
      return;
    }

    if (priceDifference < 0) {
      alert("Khách chỉ được chọn ghế cùng giá hoặc giá cao hơn!");
      return;
    }

    setProcessing(true);
    try {
      const ticketId = Number(selectedTicket.ticketId || selectedTicket.id);
      const newSeatId = Number(selectedNewSeat.seatId || selectedNewSeat.id || selectedNewSeat.SeatId);
      const newSeatCode = `${selectedNewSeat.seatRow || selectedNewSeat.SeatRow || ""}${selectedNewSeat.seatNumber || selectedNewSeat.SeatNumber || ""}`;

      // Call API 1: Request Seat Exchange
      const res = await requestSeatExchange(ticketId, newSeatId);

      const isSuccess = res.isSuccess ?? res.IsSuccess;
      if (!isSuccess) {
        alert(res.message || res.Message || "Lỗi khi yêu cầu đổi ghế");
        return;
      }

      const requiresPayment = res.requiresPayment ?? res.RequiresPayment;
      const additionalAmount = res.additionalAmount ?? res.AdditionalAmount ?? 0;
      const exchangeId = res.exchangeId ?? res.ExchangeId;
      const resolvedNewSeatPrice = Number(
        res.newSeatPrice ?? res.NewSeatPrice ??
        res.ticketPrice ?? res.TicketPrice ??
        newSeatPrice
      );

      if (requiresPayment) {
        // Case B: Higher price -> Open Cash Payment Modal
        setPendingExchange({
          exchangeId,
          additionalAmount,
          holdUntil: res.holdUntil ?? res.HoldUntil,
          newSeatCode,
          newSeatPrice: resolvedNewSeatPrice
        });
        setCustomerPaidAmount(String(additionalAmount));
        setCashPaymentError("");
        setCashPaymentModalOpen(true);
      } else {
        // Case A: Same price -> Exchange completed immediately without payment
        notifySystemUpdates(ticketId, newSeatCode, newSeatId, resolvedNewSeatPrice);
        setSuccessMsg(res.message || res.Message || `✅ ĐỔI GHẾ THÀNH CÔNG! Vé ${selectedTicket.ticketCode || selectedTicket.code} đã chuyển sang ghế ${newSeatCode} (Cùng giá ${oldSeatPrice.toLocaleString("vi-VN")}đ).`);
        if (onRefreshData) onRefreshData();
        setActionMode("SUCCESS");
      }
    } catch (err) {
      alert("Lỗi thực hiện đổi ghế: " + (err.message || err));
    } finally {
      setProcessing(false);
    }
  }

  // Handle Confirm Cash Payment for seat exchange — Step 2: Confirm Cash
  async function handleConfirmCashPayment() {
    if (!pendingExchange) return;

    const paid = Number(customerPaidAmount);
    if (isNaN(paid) || paid < pendingExchange.additionalAmount) {
      setCashPaymentError(`Số tiền đưa (${paid.toLocaleString("vi-VN")}đ) chưa đủ số tiền cần thu (${pendingExchange.additionalAmount.toLocaleString("vi-VN")}đ).`);
      return;
    }

    setProcessing(true);
    setCashPaymentError("");
    try {
      const res = await confirmCashSeatExchange(pendingExchange.exchangeId, paid);

      const isSuccess = res.isSuccess ?? res.IsSuccess;
      if (!isSuccess) {
        setCashPaymentError(res.message || res.Message || "Lỗi xác nhận thanh toán tiền mặt");
        return;
      }

      const ticketId = Number(selectedTicket.ticketId || selectedTicket.id);
      const newSeatId = Number(selectedNewSeat?.seatId || selectedNewSeat?.id || selectedNewSeat?.SeatId);

      setCashPaymentModalOpen(false);
      notifySystemUpdates(ticketId, pendingExchange.newSeatCode, newSeatId, pendingExchange.newSeatPrice);

      const change = Math.max(0, paid - pendingExchange.additionalAmount);
      setSuccessMsg(`✅ ĐỔI GHẾ THÀNH CÔNG! Đã thu ${pendingExchange.additionalAmount.toLocaleString("vi-VN")}đ tiền mặt (Khách đưa: ${paid.toLocaleString("vi-VN")}đ, Tiền thừa: ${change.toLocaleString("vi-VN")}đ). Vé đã chuyển sang ghế ${pendingExchange.newSeatCode}.`);
      if (onRefreshData) onRefreshData();
      setActionMode("SUCCESS");
    } catch (err) {
      setCashPaymentError("Lỗi xác nhận thu tiền: " + (err.message || err));
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
    <div className="ticket-exchange-overlay fixed inset-0 bg-black/75 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
      <div className="ticket-exchange-shell bg-white w-full overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="ticket-exchange-header bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl">
              🔄
            </div>
            <div>
              <h3 className="font-extrabold text-lg leading-tight">ĐỔI GHẾ TẠI QUẦY</h3>
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
        <div className="ticket-exchange-body space-y-4">
          {/* Step 1: Tra cứu vé */}
          <div className="exchange-search-card bg-gray-50 border border-gray-200 rounded-2xl p-4">
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
              <div className="exchange-ticket-card bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-extrabold text-blue-700 uppercase bg-blue-100 px-2 py-0.5 rounded-md">
                      MÃ VÉ: {selectedTicket.ticketCode || selectedTicket.code || `VE${selectedTicket.ticketId}`}
                    </span>
                    <h4 className="text-base font-extrabold text-gray-900 mt-1">
                      {selectedTicket.movieTitle || selectedTicket.movie?.title ||
                        (selectedTicket.isFoodOnly ? "Đơn Đồ Ăn / Combo" : "Vé Xem Phim")}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {(selectedTicket.roomName || selectedTicket.RoomName) && `📍 ${selectedTicket.roomName || selectedTicket.RoomName}`}
                      {(() => {
                        const rawStart = selectedTicket.showtimeStart || selectedTicket.ShowtimeStart || selectedTicket.showtime || selectedTicket.Showtime || selectedTicket.booking?.showTime?.startTime || selectedTicket.booking?.showTime?.StartTime;
                        if (!rawStart) return "";
                        try {
                          const dt = new Date(rawStart);
                          if (!isNaN(dt.getTime())) {
                            const timeStr = dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                            const dateStr = dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
                            return ` · ⏰ ${timeStr} (${dateStr})`;
                          }
                        } catch (e) {}
                        return ` · ⏰ ${rawStart}`;
                      })()}
                    </p>
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
                  <div className="col-span-2 md:col-span-1">🎭 Suất chiếu: <strong className="text-gray-900">
                    {(() => {
                      const rawStart = selectedTicket.showtimeStart || selectedTicket.ShowtimeStart || selectedTicket.showtime || selectedTicket.Showtime || selectedTicket.booking?.showTime?.startTime || selectedTicket.booking?.showTime?.StartTime;
                      if (!rawStart) return "N/A";
                      try {
                        const dt = new Date(rawStart);
                        if (!isNaN(dt.getTime())) {
                          const timeStr = dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                          const dateStr = dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
                          return `${timeStr} (${dateStr})`;
                        }
                      } catch (e) {}
                      return String(rawStart);
                    })()}
                  </strong></div>
                  <div>💺 Ghế: <strong className="text-gray-900">{selectedTicket.seatCode || selectedTicket.seatNumber || "N/A"}</strong></div>
                  <div>💰 Giá vé: <strong className="text-red-600">{Number(selectedTicket.price || selectedTicket.amount || selectedTicket.totalAmount || 0).toLocaleString("vi-VN")}đ</strong></div>
                  <div>📍 Hình thức mua: <strong className="text-gray-900">{isCounterTicket ? "Mua tại Quầy" : "Mua Online App/Web"}</strong></div>
                  <div>💳 Thanh toán: <strong className="text-gray-900">{isCashPayment ? "Tiền Mặt (Cash)" : "QR / VNPay / Thẻ"}</strong></div>
                </div>
              </div>

              {/* Ineligible Warning */}
              {/* Chỉ hỗ trợ đổi ghế tại quầy */}
              {actionMode === "SELECT" && (
                <div className="pt-2 grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={handleOpenChangeSeat}
                    className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white border-2 border-blue-500 rounded-2xl text-left transition-all active:scale-98 shadow-md flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                        <MdEventSeat />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-white text-base">💺 ĐỔI GHẾ TẠI QUẦY</h5>
                        <p className="text-[11px] text-blue-100 font-medium mt-0.5">Đổi sang ghế khác cùng giá hoặc giá cao hơn</p>
                      </div>
                    </div>
                  </button>

                </div>
              )}

              {/* Action Mode 1: CHANGE SEAT */}
              {actionMode === "CHANGE_SEAT" && (
                <div className="exchange-change-section space-y-3 pt-2 border-t border-gray-200">
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
                    <div className="exchange-seat-workspace space-y-3">
                      <div className="bv-screen mx-auto">MÀN HÌNH</div>

                      <div className="exchange-seat-map max-h-[430px] overflow-auto p-5 bg-[#0f0f13] border border-[#27272a] rounded-2xl text-white shadow-inner">
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
                            <div className="bv-seat-rows exchange-seat-rows">
                              {rowKeys.map((row) => {
                                const rowSeats = grouped[row].sort((a, b) => {
                                  const nA = Number(String(a.seatNumber || a.SeatNumber || 0).replace(/\D/g, ""));
                                  const nB = Number(String(b.seatNumber || b.SeatNumber || 0).replace(/\D/g, ""));
                                  return nA - nB;
                                });

                                return (
                                  <div key={row} className="bv-seat-row">
                                    <span className="bv-row-letter">{row}</span>
                                    <div className="bv-seat-cols">
                                      {rowSeats.map((seat, seatIndex) => {
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

                                        // Color badge by type (bright POS style)
                                        const isVip = seatType.includes("vip");
                                        const isCouple = seatType.includes("couple") || seatType.includes("sweetbox") || seatType.includes("đôi");
                                        const coupleGroupId = seat.coupleGroupId ?? seat.CoupleGroupId;
                                        const partnerSeat = isCouple && coupleGroupId
                                          ? rowSeats.find((candidate) => String(candidate.coupleGroupId ?? candidate.CoupleGroupId ?? "") === String(coupleGroupId)
                                              && Number(candidate.seatId || candidate.id || candidate.SeatId) !== seatId)
                                          : null;
                                        const partnerId = Number(partnerSeat?.seatId || partnerSeat?.id || partnerSeat?.SeatId || 0);
                                        const partnerAvailable = !isCouple || (partnerSeat && (availableSeatList || []).some((av) =>
                                          Number(av.seatId ?? av.SeatId ?? av.id ?? av.Id) === partnerId));
                                        if (isCouple && !partnerAvailable) isAvailable = false;
                                        const selectedGroupId = selectedNewSeat?.coupleGroupId ?? selectedNewSeat?.CoupleGroupId;
                                        const isSelected = selectedNewSeat && (
                                          Number(selectedNewSeat.seatId || selectedNewSeat.id) === seatId ||
                                          (isCouple && coupleGroupId && String(selectedGroupId) === String(coupleGroupId))
                                        );
                                        const typeOf = (value) => String(value?.seatType || value?.SeatType || value?.type || value?.Type || "").toLowerCase();
                                        const previousIsCouple = seatIndex > 0 && /couple|sweetbox|đôi/.test(typeOf(rowSeats[seatIndex - 1]));
                                        const nextIsCouple = seatIndex < rowSeats.length - 1 && /couple|sweetbox|đôi/.test(typeOf(rowSeats[seatIndex + 1]));

                                        let seatBtnStyle = `counter-seat-btn ${isVip ? "seat-vip" : isCouple ? "seat-couple" : "seat-standard"}`;
                                        if (isCouple && !previousIsCouple && nextIsCouple) seatBtnStyle += " seat-couple-left";
                                        if (isCouple && previousIsCouple && !nextIsCouple) seatBtnStyle += " seat-couple-right";
                                        if (isSelected) seatBtnStyle += " seat-selected";
                                        else if (isCurrentSeat) seatBtnStyle += " exchange-seat-current";
                                        else if (!isAvailable) seatBtnStyle += " seat-taken";

                                        return (
                                          <button
                                            key={seatId}
                                            type="button"
                                            disabled={!isAvailable}
                                            onClick={() => setSelectedNewSeat(isSelected ? null : seat)}
                                            className={seatBtnStyle}
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
                                    <span className="bv-row-letter">{row}</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Legend footer matching POS layout */}
                      <div className="bv-legend mt-3">
                        <span className="bv-legend-item"><span className="bv-legend-box legend-standard"></span>Thường</span>
                        <span className="bv-legend-item"><span className="bv-legend-box legend-vip"></span>VIP</span>
                        <span className="bv-legend-item"><span className="bv-legend-box legend-couple"></span>Couple</span>
                        <span className="bv-legend-item"><span className="bv-legend-box exchange-legend-current"></span>Ghế cũ ({selectedTicket.seatCode})</span>
                        <span className="bv-legend-item"><span className="bv-legend-box legend-selected"></span>Ghế mới chọn</span>
                        <span className="bv-legend-item bv-legend-dim"><span className="bv-legend-box legend-taken"></span>Đã bán</span>
                      </div>

                      {/* Price Difference Calculation Box */}
                      <div className="exchange-summary-card">
                        <div><span>Ghế cũ</span><strong>{selectedTicket.seatCode || selectedTicket.seatNumber || "N/A"}</strong></div>
                        <div><span>Ghế mới</span><strong>{selectedNewSeat ? `${selectedNewSeat.seatRow || selectedNewSeat.SeatRow || ""}${selectedNewSeat.seatNumber || selectedNewSeat.SeatNumber || ""}` : "Chưa chọn"}</strong></div>
                        <div><span>Chênh lệch giá</span><strong>{selectedNewSeat ? `${priceDifference > 0 ? "+" : ""}${priceDifference.toLocaleString("vi-VN")}đ` : "—"}</strong></div>
                        <div className="exchange-summary-total"><span>Tổng tiền cần trả thêm</span><strong>{selectedNewSeat ? `${Math.max(0, priceDifference).toLocaleString("vi-VN")}đ` : "0đ"}</strong></div>
                      </div>
                      {selectedNewSeat && (
                        <div className="exchange-old-price-box p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                            <span>Ghế cũ ({selectedTicket.seatCode}): <strong>{oldSeatPrice.toLocaleString("vi-VN")}đ</strong></span>
                            <span>➔</span>
                            <span>Ghế mới ({selectedNewSeat.seatRow || selectedNewSeat.SeatRow}{selectedNewSeat.seatNumber || selectedNewSeat.SeatNumber}): <strong>{newSeatPrice.toLocaleString("vi-VN")}đ</strong></span>
                          </div>

                          <div className="pt-2 border-t border-amber-200 flex justify-between items-center">
                            <span className="font-extrabold text-sm text-gray-900">CHÊNH LỆCH TIỀN MẶT:</span>
                            <span className={`text-base font-extrabold ${priceDifference > 0 ? "text-red-600" : priceDifference < 0 ? "text-red-500 line-through" : "text-gray-700"}`}>
                              {priceDifference > 0 && `+ THU THÊM ${priceDifference.toLocaleString("vi-VN")}đ (TIỀN MẶT)`}
                              {priceDifference < 0 && `KHÔNG CHO ĐỔI (GHẾ GIÁ THẤP HƠN)`}
                              {priceDifference === 0 && "0đ (CÙNG GIÁ)"}
                            </span>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={!selectedNewSeat || priceDifference < 0 || processing}
                        onClick={handleConfirmChangeSeat}
                        className="exchange-confirm-button w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer"
                      >
                        {processing ? "Đang xử lý đổi ghế..." : priceDifference > 0 ? "TIẾN HÀNH ĐỔI GHẾ (CẦN THU TIỀN MẶT)" : "XÁC NHẬN ĐỔI GHẾ (CÙNG GIÁ)"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Action Mode 2: SUCCESS */}
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

      {/* Cash Payment Modal for Seat Exchange */}
      {cashPaymentModalOpen && pendingExchange && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold">
                  💵
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">THANH TOÁN ĐỔI GHẾ (TIỀN MẶT)</h3>
                  <p className="text-xs text-emerald-100">Thu tiền mặt chênh lệch trực tiếp tại quầy</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCashPaymentModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <MdClose className="text-xl" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Payment Method (Fixed Cash) */}
              <div>
                <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                  Phương thức thanh toán
                </label>
                <div className="p-3 bg-gray-100 border border-gray-300 rounded-xl font-black text-gray-800 text-sm flex items-center justify-between select-none">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                    💵 Tiền mặt (Cash at Counter)
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded">Cố định</span>
                </div>
              </div>

              {/* Amount to collect */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex justify-between items-center">
                <span className="text-xs font-extrabold text-emerald-900 uppercase">Số tiền cần thu (Chênh lệch):</span>
                <span className="text-xl font-black text-emerald-700">
                  {pendingExchange.additionalAmount.toLocaleString("vi-VN")} VNĐ
                </span>
              </div>

              {/* Customer Paid Input */}
              <div>
                <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                  Số tiền khách đưa (VNĐ):
                </label>
                <input
                  type="number"
                  min={pendingExchange.additionalAmount}
                  value={customerPaidAmount}
                  onChange={(e) => setCustomerPaidAmount(e.target.value)}
                  className="w-full border-2 border-emerald-500 rounded-xl px-4 py-3 text-lg font-black text-gray-900 bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  placeholder="Nhập số tiền..."
                />
              </div>

              {/* Change Calculation */}
              {(() => {
                const paid = Number(customerPaidAmount) || 0;
                const change = Math.max(0, paid - pendingExchange.additionalAmount);
                const isSufficient = paid >= pendingExchange.additionalAmount;

                return (
                  <div className={`p-4 rounded-2xl border ${isSufficient ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-gray-700 uppercase">Tiền thừa trả khách:</span>
                      <span className={`text-lg font-black ${isSufficient ? "text-blue-700" : "text-red-600"}`}>
                        {isSufficient ? `${change.toLocaleString("vi-VN")} VNĐ` : "Số tiền chưa đủ"}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {cashPaymentError && (
                <p className="text-xs font-bold text-red-600 flex items-center gap-1">
                  <MdWarning className="text-sm" /> {cashPaymentError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCashPaymentModalOpen(false)}
                  className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-extrabold text-xs rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={Number(customerPaidAmount) < pendingExchange.additionalAmount || processing}
                  onClick={handleConfirmCashPayment}
                  className="flex-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-extrabold text-xs rounded-xl shadow-lg cursor-pointer"
                >
                  {processing ? "Đang xử lý..." : "XÁC NHẬN ĐÃ THU TIỀN MẶT"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
