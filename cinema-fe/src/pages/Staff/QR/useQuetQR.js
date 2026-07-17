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

    const found = tickets.find(t => {
      const c = t.ticketCode || t.code || `VE${t.ticketId || t.id}`;
      return c.toLowerCase() === cleanCode.toLowerCase();
    });

    if (found) {
      setTicketDetails(found);
      
      const ticketId = found.ticketId || found.id;
      const isAlreadyUsed = found.status === "Used" || found.status === "Đã sử dụng";
      
      if (autoCheckIn && !isAlreadyUsed) {
        try {
          await validateTicket(ticketId, {
            ...found,
            status: "Đã thanh toán" // API will translate this to "Used"
          });
          
          setStatusMessage({
            type: "success",
            text: `Vé ${found.ticketCode || `VE${ticketId}`} đã tự động check-in thành công! Chào mừng khách vào phòng.`
          });
          
          setTicketDetails(prev => prev ? { ...prev, status: "Used" } : null);
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
