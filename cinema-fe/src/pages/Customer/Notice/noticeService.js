import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();

// GET /api/Notifications (cho Customer)
export async function getNotificationsForCustomer() {
  const response = await fetch(`${API_URL}/Notifications`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy thông báo thất bại!"));
  return data;
}

// PUT /api/Notifications/:id/Read (hoặc tương tự, giả lập API/hướng dẫn tùy backend)
export async function markNotificationAsRead(id) {
  const response = await fetch(`${API_URL}/Notifications/${id}/read`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Đánh dấu đọc thông báo thất bại!"));
  return data;
}
