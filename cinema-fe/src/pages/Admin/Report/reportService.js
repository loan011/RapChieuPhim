import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();

// GET /api/Payments – danh sách thanh toán (dùng tổng hợp theo ngày)
export async function getAllPayments() {
  const response = await fetch(`${API_URL}/Payments`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy danh sách thanh toán thất bại!"));
  return data;
}

// GET /api/Payments/RevenueByMovie – doanh thu theo phim (backend tính sẵn)
export async function getRevenueByMovie() {
  const response = await fetch(`${API_URL}/Payments/RevenueByMovie`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy doanh thu theo phim thất bại!"));
  return data;
}

// GET /api/Tickets – danh sách vé (dùng tổng hợp theo rạp)
export async function getAllTickets() {
  const response = await fetch(`${API_URL}/Tickets`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy danh sách vé thất bại!"));
  return data;
}

// GET /api/Movies – danh sách tất cả phim
export async function getAllMovies() {
  const response = await fetch(`${API_URL}/Movies`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy danh sách phim thất bại!"));
  return data;
}

// GET /api/Showtimes – danh sách tất cả suất chiếu
export async function getAllShowtimes() {
  const response = await fetch(`${API_URL}/Showtimes`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy danh sách suất chiếu thất bại!"));
  return data;
}
