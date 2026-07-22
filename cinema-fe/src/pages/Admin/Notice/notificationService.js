import {
  getApiUrl,
  readResponse,
  getErrorMessage,
  getAuthHeaders,
} from "../../../services/apiHelper";

const API_URL = getApiUrl();

function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;

  return [];
}

// GET /api/Notifications
export async function getNotificationList() {
  const response = await fetch(`${API_URL}/Notifications`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Lấy lịch sử thông báo thất bại!")
    );
  }

  return normalizeArray(data);
}

// POST /api/Notifications
export async function sendNotification(notification) {
  const response = await fetch(`${API_URL}/Notifications`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(notification),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Gửi thông báo thất bại!")
    );
  }

  return data;
}

// DELETE /api/Notifications/:id
export async function deleteNotification(id) {
  const response = await fetch(`${API_URL}/Notifications/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Xóa thông báo thất bại!")
    );
  }

  return data;
}