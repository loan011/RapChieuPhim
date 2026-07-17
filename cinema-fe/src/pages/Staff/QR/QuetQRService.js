import { getTicketList, getTicketById, updateTicket } from "../../Admin/Ticket/ticketService";
import { getApiUrl, readResponse, getAuthHeaders } from "../../../services/apiHelper";

export async function fetchTickets() {
  return await getTicketList();
}

export async function fetchTicketById(id) {
  return await getTicketById(id);
}

// GET /api/Tickets/ByCode/{code}
export async function fetchTicketByCode(code) {
  try {
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/Tickets/ByCode/${encodeURIComponent(code)}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    return await readResponse(response);
  } catch {
    return null;
  }
}

export async function validateTicket(id, statusPayload) {
  return await updateTicket(id, statusPayload);
}

// GET /api/Orders/ticket/{ticketId}
export async function fetchTicketOrders(ticketId) {
  if (!ticketId) return [];
  try {
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/Orders/ticket/${ticketId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return [];
    const data = await readResponse(response);
    const orders = Array.isArray(data) ? data : (data?.$values || data?.data || []);
    return orders.flatMap(order => {
      const rawItems = order.orderItems || order.OrderItems || order.orderitems || order.Orderitems || [];
      const items = Array.isArray(rawItems) ? rawItems : (rawItems.$values || []);
      return items.map(item => {
        const combo = item.combo || item.Combo;
        const food  = item.food  || item.Food;
        return {
          name:     combo?.comboName || combo?.ComboName || food?.foodName || food?.FoodName || item.name || "Món",
          quantity: item.quantity  || item.Quantity  || 1,
          price:    item.unitPrice || item.UnitPrice || 0,
        };
      });
    });
  } catch {
    return [];
  }
}
