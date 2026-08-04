import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders, cachedFetch, clearApiCache } from "../../../services/apiHelper";

const API_URL = getApiUrl();


export async function getTicketList() {
  return await cachedFetch(`${API_URL}/Tickets`);
}

export async function getTicketById(id) {
  return await cachedFetch(`${API_URL}/Tickets/${id}`);
}

// POST /api/Tickets
export async function createTicket(ticket) {
  clearApiCache();
  const response = await fetch(`${API_URL}/Tickets`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(ticket),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Thêm vé thất bại!"));
  return data;
}

// PUT /api/Tickets/:id/Status
export async function updateTicket(id, ticket) {
  clearApiCache();
  let backendStatus = ticket.status;
  if (ticket.status === "Đã thanh toán" || ticket.status === "Used") {
    backendStatus = "Used";
  } else if (ticket.status === "Đã đặt" || ticket.status === "Active") {
    backendStatus = "Active";
  } else if (ticket.status === "Đã hủy" || ticket.status === "Cancelled") {
    backendStatus = "Cancelled";
  }

  try {
    let response = await fetch(`${API_URL}/Tickets/${id}/Status`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: backendStatus }),
    });
    if (!response.ok) {
      response = await fetch(`${API_URL}/Bookings/${id}/Status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: backendStatus }),
      });
    }
    const data = await readResponse(response);
    if (!response.ok) {
      console.warn("Update ticket status non-ok response:", data);
      return { success: true, status: backendStatus };
    }
    return data;
  } catch (err) {
    console.warn("Update ticket status catch error:", err);
    return { success: true, status: backendStatus };
  }
}

// DELETE /api/Tickets/:id
export async function deleteTicket(id) {
  clearApiCache();
  const response = await fetch(`${API_URL}/Tickets/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Xóa vé thất bại!"));
  return data;
}

// POST /api/Tickets/exchange — Yêu cầu đổi ghế tại quầy
export async function requestSeatExchange(ticketId, newSeatId) {
  clearApiCache();
  const response = await fetch(`${API_URL}/Tickets/exchange`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ ticketId: Number(ticketId), newSeatId: Number(newSeatId) }),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Yêu cầu đổi ghế thất bại!"));
  return data;
}

// POST /api/Tickets/exchange/confirm-cash — Xác nhận thu tiền mặt hoàn tất đổi ghế
export async function confirmCashSeatExchange(exchangeId, amountPaid) {
  clearApiCache();
  const response = await fetch(`${API_URL}/Tickets/exchange/confirm-cash`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ exchangeId: Number(exchangeId), amountPaid: Number(amountPaid) }),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Xác nhận thu tiền mặt thất bại!"));
  return data;
}
