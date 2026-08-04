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

export async function getSeatsByRoom(roomId) {
  const response = await fetch(`${API_URL}/Seats/ByRoom/${roomId}`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy sơ đồ ghế theo phòng thất bại!"));
  return Array.isArray(data) ? data : (data?.$values || data?.data || []);
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

export async function createSeatRange(payload) {
  const response = await fetch(`${API_URL}/Seats/Range`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Thêm dải ghế thất bại!"));
  return data;
}

export async function updateRoomSeatLayout(roomId, changes) {
  const response = await fetch(`${API_URL}/Seats/Room/${roomId}/Layout`, {
    method: "PUT",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ changes }),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lưu sơ đồ ghế thất bại!"));
  return data;
}
