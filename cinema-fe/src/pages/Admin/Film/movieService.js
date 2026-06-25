import {
  getApiUrl,
  readResponse,
  getErrorMessage,
  getAuthHeaders,
} from "../../../services/apiHelper";

const API_URL = getApiUrl();

function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;

  return [];
}

// GET /api/Movies
export async function getMovieList() {
  const response = await fetch(`${API_URL}/Movies`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Lấy danh sách phim thất bại!"));
  }

  return normalizeArray(data);
}

// GET /api/MovieCategories
export async function getMovieCategoryList() {
  const response = await fetch(`${API_URL}/MovieCategories`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Lấy danh sách thể loại thất bại!"));
  }

  return normalizeArray(data);
}

// GET /api/Movies/:id
export async function getMovieById(id) {
  const response = await fetch(`${API_URL}/Movies/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Lấy thông tin phim thất bại!"));
  }

  return data;
}

// POST /api/Movies
export async function createMovie(movie) {
  const response = await fetch(`${API_URL}/Movies`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(movie),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Thêm phim thất bại!"));
  }

  return data;
}

// PUT /api/Movies/:id
export async function updateMovie(id, movie) {
  const response = await fetch(`${API_URL}/Movies/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(movie),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Cập nhật phim thất bại!"));
  }

  return data;
}

// DELETE /api/Movies/:id
export async function deleteMovie(id) {
  const response = await fetch(`${API_URL}/Movies/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Xóa phim thất bại!"));
  }

  return data;
}