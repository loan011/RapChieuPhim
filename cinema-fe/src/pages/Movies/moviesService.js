import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../services/apiHelper";

const API_URL = getApiUrl();

// GET /api/Movies
export async function getMovieList() {
  const response = await fetch(`${API_URL}/Movies`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy danh sách phim thất bại!"));
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

// GET /api/Showtimes
export async function getShowtimeList() {
  const response = await fetch(`${API_URL}/Showtimes`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy danh sách suất chiếu thất bại!"));
  return data;
}

// GET /api/Cinemas
export async function getCinemaList() {
  const response = await fetch(`${API_URL}/Cinemas`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy danh sách rạp thất bại!"));
  return data;
}

// GET /api/Rooms
export async function getRoomList() {
  const response = await fetch(`${API_URL}/Rooms`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy danh sách phòng thất bại!"));
  return data;
}


