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

export async function getCinemaList() {
  const response = await fetch(`${API_URL}/Cinemas`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Lấy danh sách rạp chiếu thất bại!")
    );
  }

  return normalizeArray(data);
}

export async function getCinemaById(id) {
  const response = await fetch(`${API_URL}/Cinemas/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Lấy thông tin rạp chiếu thất bại!")
    );
  }

  return data;
}

export async function createCinema(cinema) {
  const response = await fetch(`${API_URL}/Cinemas`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(cinema),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Thêm rạp chiếu thất bại!")
    );
  }

  return data;
}

export async function updateCinema(id, cinema) {
  const response = await fetch(`${API_URL}/Cinemas/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(cinema),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Cập nhật rạp chiếu thất bại!")
    );
  }

  return data;
}

export async function deleteCinema(id) {
  const response = await fetch(`${API_URL}/Cinemas/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Xóa rạp chiếu thất bại!")
    );
  }

  return data;
}

export async function getAreaList() {
  const response = await fetch(`${API_URL}/Areas`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Lấy danh sách khu vực thất bại!")
    );
  }

  return normalizeArray(data);
}