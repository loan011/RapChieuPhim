import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();

// GET /api/Rooms
export async function getRoomList() {
  const response = await fetch(`${API_URL}/Rooms`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy danh sách phòng chiếu thất bại!"));
  return data;
}

// GET /api/Rooms/:id
export async function getRoomById(id) {
  const response = await fetch(`${API_URL}/Rooms/${id}`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy thông tin phòng chiếu thất bại!"));
  return data;
}

// POST /api/Rooms
export async function createRoom(room) {
  const response = await fetch(`${API_URL}/Rooms`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(room),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Thêm phòng chiếu thất bại!"));
  return data;
}

// PUT /api/Rooms/:id
export async function updateRoom(id, room) {
  const response = await fetch(`${API_URL}/Rooms/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(room),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Cập nhật phòng chiếu thất bại!"));
  return data;
}

// DELETE /api/Rooms/:id
export async function deleteRoom(id) {
  const response = await fetch(`${API_URL}/Rooms/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Xóa phòng chiếu thất bại!"));
  return data;
}
