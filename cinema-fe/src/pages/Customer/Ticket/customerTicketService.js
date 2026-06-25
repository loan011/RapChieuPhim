import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();

// GET /api/Tickets/MyTickets (Lấy danh sách vé đã mua của khách hàng)
export async function getCustomerTickets() {
  const response = await fetch(`${API_URL}/Tickets`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy danh sách vé thất bại!"));
  return data;
}
