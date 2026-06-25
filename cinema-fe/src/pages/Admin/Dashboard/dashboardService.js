import {
  getApiUrl,
  readResponse,
  getErrorMessage,
  getAuthHeaders,
} from "../../../services/apiHelper";

const API_URL = getApiUrl();

async function apiGet(path, fallbackMessage) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, fallbackMessage));
  }

  return data;
}

export async function getDashboardStats() {
  return apiGet(
    "/Dashboard/Stats",
    "Lấy thống kê dashboard thất bại!"
  );
}

export async function getRecentTickets() {
  return apiGet(
    "/Dashboard/RecentTickets",
    "Lấy danh sách vé gần đây thất bại!"
  );
}