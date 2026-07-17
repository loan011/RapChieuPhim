import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();

// GET /api/Bookings/ByUser/{userId} (Lấy danh sách vé đã đặt của khách hàng)
export async function getCustomerTickets(userId) {
  if (!userId) return [];
  const response = await fetch(`${API_URL}/Bookings/ByUser/${userId}`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy danh sách vé thất bại!"));
  return data;
}
