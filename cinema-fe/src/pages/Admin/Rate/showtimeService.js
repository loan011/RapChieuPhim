import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();

// GET /api/Showtimes
export async function getShowtimeList() {
  const response = await fetch(`${API_URL}/Showtimes`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy danh sách suất chiếu thất bại!"));
  return data;
}

// GET /api/Showtimes/:id
export async function getShowtimeById(id) {
  const response = await fetch(`${API_URL}/Showtimes/${id}`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy thông tin suất chiếu thất bại!"));
  return data;
}

// POST /api/Showtimes
export async function createShowtime(showtime) {
  const response = await fetch(`${API_URL}/Showtimes`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(showtime),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Thêm suất chiếu thất bại!"));
  return data;
}

// PUT /api/Showtimes/:id
export async function updateShowtime(id, showtime) {
  const response = await fetch(`${API_URL}/Showtimes/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(showtime),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Cập nhật suất chiếu thất bại!"));
  return data;
}

// DELETE /api/Showtimes/:id
export async function deleteShowtime(id) {
  const response = await fetch(`${API_URL}/Showtimes/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Xóa suất chiếu thất bại!"));
  return data;
}
