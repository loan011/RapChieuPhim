import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();

// GET /api/Seats
export async function getSeatList() {
  const response = await fetch(`${API_URL}/Seats`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy danh sách ghế thất bại!"));
  return data;
}

// GET /api/Seats/:id
export async function getSeatById(id) {
  const response = await fetch(`${API_URL}/Seats/${id}`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy thông tin ghế thất bại!"));
  return data;
}

// POST /api/Seats
export async function createSeat(seat) {
  const response = await fetch(`${API_URL}/Seats`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(seat),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Thêm ghế thất bại!"));
  return data;
}

// PUT /api/Seats/:id
export async function updateSeat(id, seat) {
  const response = await fetch(`${API_URL}/Seats/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(seat),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Cập nhật ghế thất bại!"));
  return data;
}

// DELETE /api/Seats/:id
export async function deleteSeat(id) {
  const response = await fetch(`${API_URL}/Seats/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Xóa ghế thất bại!"));
  return data;
}
