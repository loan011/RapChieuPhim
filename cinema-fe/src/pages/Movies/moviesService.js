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
