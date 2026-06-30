import { useState, useEffect } from "react";
import { fetchTickets, validateTicket } from "./QuetQRService";

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

  async function handleFindTicket(code) {
    if (!code.trim()) return;
    setLoading(true);
    setStatusMessage(null);
    setTicketDetails(null);

    const found = tickets.find(t => {
      const c = t.code || t.ticketCode || `VE${t.id}`;
      return c.toLowerCase() === code.trim().toLowerCase();
    });

    if (found) {
      setTicketDetails(found);
    } else {
      setStatusMessage({
        type: "error",
        text: "Không tìm thấy vé trong hệ thống. Vui lòng kiểm tra lại mã vé!"
      });
    }
    setLoading(false);
  }

  async function handleCheckIn() {
    if (!ticketDetails) return;
    
    setLoading(true);
    setStatusMessage(null);
    try {
      const ticketId = ticketDetails.id || ticketDetails.ticketId;
      
      await validateTicket(ticketId, {
        ...ticketDetails,
        status: "Đã thanh toán"
      });

      setStatusMessage({
        type: "success",
        text: `Vé ${ticketDetails.code || `VE${ticketDetails.id}`} đã được check-in thành công! Chào mừng khách vào phòng.`
      });

      setTicketDetails(prev => ({ ...prev, status: "Used" }));
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
    handleFindTicket,
    handleCheckIn,
    handleSimulateScan,
  };
}
