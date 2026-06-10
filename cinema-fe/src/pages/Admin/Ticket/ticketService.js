import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();


export async function getTicketList() {
  const response = await fetch(`${API_URL}/Tickets`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy danh sách vé thất bại!"));
  return data;
}

export async function getTicketById(id) {
  const response = await fetch(`${API_URL}/Tickets/${id}`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy thông tin vé thất bại!"));
  return data;
}

// POST /api/Tickets
export async function createTicket(ticket) {
  const response = await fetch(`${API_URL}/Tickets`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(ticket),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Thêm vé thất bại!"));
  return data;
}

// PUT /api/Tickets/:id
export async function updateTicket(id, ticket) {
  const response = await fetch(`${API_URL}/Tickets/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(ticket),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Cập nhật vé thất bại!"));
  return data;
}

// DELETE /api/Tickets/:id
export async function deleteTicket(id) {
  const response = await fetch(`${API_URL}/Tickets/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Xóa vé thất bại!"));
  return data;
}
