import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();

export async function getBookingHistory(userId) {
  if (!userId) return [];
  const response = await fetch(`${API_URL}/Bookings/ByUser/${userId}`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy lịch sử giao dịch thất bại!"));
  return data;
}
