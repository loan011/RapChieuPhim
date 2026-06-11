import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();

// GET /api/Notifications
export async function getNotificationList() {
  const response = await fetch(`${API_URL}/Notifications`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy lịch sử thông báo thất bại!"));
  return data;
}

// POST /api/Notifications  (gửi thông báo)
export async function sendNotification(notification) {
  const response = await fetch(`${API_URL}/Notifications`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(notification),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Gửi thông báo thất bại!"));
  return data;
}

// DELETE /api/Notifications/:id
export async function deleteNotification(id) {
  const response = await fetch(`${API_URL}/Notifications/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Xóa thông báo thất bại!"));
  return data;
}
