import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();

// GET /api/Cinemas
export async function getCinemaList() {
  const response = await fetch(`${API_URL}/Cinemas`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy danh sách rạp chiếu thất bại!"));
  return data;
}

// GET /api/Cinemas/:id
export async function getCinemaById(id) {
  const response = await fetch(`${API_URL}/Cinemas/${id}`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy thông tin rạp chiếu thất bại!"));
  return data;
}

// POST /api/Cinemas
export async function createCinema(cinema) {
  const response = await fetch(`${API_URL}/Cinemas`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(cinema),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Thêm rạp chiếu thất bại!"));
  return data;
}

// PUT /api/Cinemas/:id
export async function updateCinema(id, cinema) {
  const response = await fetch(`${API_URL}/Cinemas/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(cinema),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Cập nhật rạp chiếu thất bại!"));
  return data;
}

// DELETE /api/Cinemas/:id
export async function deleteCinema(id) {
  const response = await fetch(`${API_URL}/Cinemas/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Xóa rạp chiếu thất bại!"));
  return data;
}

// GET /api/Areas
export async function getAreaList() {
  const response = await fetch(`${API_URL}/Areas`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy danh sách khu vực thất bại!"));
  return data;
}
