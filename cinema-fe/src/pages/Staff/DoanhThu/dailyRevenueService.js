import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();

export async function getDailyRevenue(date) {
  const response = await fetch(`${API_URL}/DailyRevenue?date=${date}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Lấy thông tin doanh thu ngày thất bại!"));
  }

  return data;
}

export async function sendDailyRevenueReport(payload) {
  const response = await fetch(`${API_URL}/DailyRevenue/SendReport`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Gửi báo cáo doanh thu thất bại!"));
  }

  return data;
}
