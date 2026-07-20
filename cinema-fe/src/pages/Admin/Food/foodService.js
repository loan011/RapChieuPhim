import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  return data?.$values ?? data?.data ?? data?.items ?? data?.result ?? [];
}

export async function fetchFoods() {
  const response = await fetch(`${API_URL}/Foods`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(getErrorMessage(await readResponse(response)) || "Lỗi khi tải danh sách đồ ăn");
  }
  return normalizeList(await readResponse(response));
}

export async function fetchBookingsForInventory() {
  const response = await fetch(`${API_URL}/Bookings`, {
    headers: getAuthHeaders()
  });
  const data = await readResponse(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(data) || "Lỗi khi tải dữ liệu bán hàng");
  }
  return Array.isArray(data) ? data : (data?.$values ?? data?.data ?? []);
}

export async function createFood(foodData) {
  const response = await fetch(`${API_URL}/Foods`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(foodData),
  });
  const data = await readResponse(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(data) || "Lỗi khi thêm đồ ăn");
  }
  return data;
}

export async function updateFood(id, foodData) {
  const response = await fetch(`${API_URL}/Foods/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(foodData),
  });
  const data = await readResponse(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(data) || "Lỗi khi cập nhật đồ ăn");
  }
  return data;
}

export async function deleteFood(id) {
  const response = await fetch(`${API_URL}/Foods/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(data) || "Lỗi khi xóa đồ ăn");
  }
  return data;
}

// ================= COMBO APIS =================

export async function fetchCombos() {
  const response = await fetch(`${API_URL}/Combos`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error(getErrorMessage(await readResponse(response)) || "Lỗi khi tải danh sách combo");
  }
  return normalizeList(await readResponse(response));
}

export async function createCombo(comboData) {
  const response = await fetch(`${API_URL}/Combos`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(comboData),
  });
  const data = await readResponse(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(data) || "Lỗi khi thêm combo");
  }
  return data;
}

export async function updateCombo(id, comboData) {
  const response = await fetch(`${API_URL}/Combos/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(comboData),
  });
  const data = await readResponse(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(data) || "Lỗi khi cập nhật combo");
  }
  return data;
}

export async function deleteCombo(id) {
  const response = await fetch(`${API_URL}/Combos/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(data) || "Lỗi khi xóa combo");
  }
  return data;
}
