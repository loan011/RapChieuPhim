import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  return data?.$values ?? data?.data ?? data?.items ?? data?.result ?? [];
}

export async function fetchFoods() {
  // Ưu tiên gọi /Foods/Available trước để tránh lỗi 500 do vòng lặp dữ liệu trên Backend (/Foods)
  try {
    const resAvailable = await fetch(`${API_URL}/Foods/Available`, { headers: getAuthHeaders() });
    if (resAvailable.ok) {
      const data = await readResponse(resAvailable);
      const list = normalizeList(data);
      if (list && list.length > 0) return list;
    }
  } catch (e) {
    // Ignore and fallback
  }

  const response = await fetch(`${API_URL}/Foods`, { headers: getAuthHeaders() });
  const data = await readResponse(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(data) || "Lỗi khi tải danh sách đồ ăn");
  }
  return normalizeList(data);
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

export async function fetchOrdersForInventory() {
  try {
    const response = await fetch(`${API_URL}/Orders`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) return [];
    const data = await readResponse(response);
    return Array.isArray(data) ? data : (data?.$values ?? data?.data ?? []);
  } catch (e) {
    return [];
  }
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
  // Ưu tiên gọi /Combos/Available trước để tránh lỗi 500 do vòng lặp dữ liệu trên Backend (/Combos)
  try {
    const resAvailable = await fetch(`${API_URL}/Combos/Available`, { headers: getAuthHeaders() });
    if (resAvailable.ok) {
      const data = await readResponse(resAvailable);
      const list = normalizeList(data);
      if (list && list.length > 0) return list;
    }
  } catch (e) {
    // Ignore and fallback
  }

  const response = await fetch(`${API_URL}/Combos`, { headers: getAuthHeaders() });
  const data = await readResponse(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(data) || "Lỗi khi tải danh sách combo");
  }
  return normalizeList(data);
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
