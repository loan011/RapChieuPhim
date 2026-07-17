import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();

// GET /api/Bookings/ByUser/{userId}
export async function getCustomerTickets(userId) {
  if (!userId) return [];
  const response = await fetch(`${API_URL}/Bookings/ByUser/${userId}`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy danh sách vé thất bại!"));
  return data;
}

// GET /api/Orders/ticket/{ticketId} — lấy đồ ăn/combo đã mua kèm vé
export async function fetchOrdersByTicket(ticketId) {
  if (!ticketId) return [];
  try {
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
