import { getApiUrl, readResponse, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();

function normalizeArray(arr) {
  if (!arr) return [];
  if (Array.isArray(arr)) return arr;
  if (arr.$values && Array.isArray(arr.$values)) return arr.$values;
  if (arr.data && Array.isArray(arr.data)) return arr.data;
  if (arr.data?.$values && Array.isArray(arr.data?.$values)) return arr.data.$values;
  return [];
}

export async function fetchTicketByCode(ticketCode) {
  try {
    const response = await fetch(`${API_URL}/Tickets/ByCode/${ticketCode}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    return await readResponse(response);
  } catch (err) {
    console.error("Error fetching ticket by code:", err);
    return null;
  }
}

export async function fetchOrdersByBooking(bookingId) {
  try {
    const response = await fetch(`${API_URL}/Orders/ByBooking/${bookingId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return [];
    const data = await readResponse(response);
    return normalizeArray(data);
  } catch (err) {
    console.error("Error fetching orders by booking:", err);
    return [];
  }
}

export async function updateOrderStatus(orderId, status) {
  const response = await fetch(`${API_URL}/Orders/${orderId}/Status`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const errData = await readResponse(response);
    throw new Error(errData?.message || errData?.Message || "Cập nhật trạng thái đơn hàng thất bại!");
  }
  return true;
}
