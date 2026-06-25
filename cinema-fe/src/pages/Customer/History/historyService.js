import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();

// GET /api/Invoices/MyHistory (Giả lập api lấy lịch sử giao dịch hóa đơn của user đăng nhập)
export async function getBookingHistory() {
  const response = await fetch(`${API_URL}/Invoices`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy lịch sử giao dịch thất bại!"));
  return data;
}
