import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../services/apiHelper";

const API_URL = getApiUrl();

// GET /api/Cinemas
export async function getCinemasForPrice() {
  const response = await fetch(`${API_URL}/Cinemas`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy danh sách rạp chiếu thất bại!"));
  return data;
}

export async function fetchActiveTicketPricings() {
  const response = await fetch(`${API_URL}/TicketPricing/Active`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy bảng giá hoạt động thất bại!"));
  return data;
}
