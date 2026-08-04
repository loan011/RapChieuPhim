import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders, clearApiCache } from "../../../services/apiHelper";

const API_URL = getApiUrl();

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  return data?.$values ?? data?.data ?? data?.items ?? data?.result ?? [];
}

export async function fetchFoods() {
  // Ưu tiên gọi /Foods/Available trước để tránh lỗi 500 do vòng lặp dữ liệu trên Backend C# (/Foods)
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

export async function fetchCinemaInventory(cinemaId) {
  if (!cinemaId) return [];
  const response = await fetch(`${API_URL}/food-inventory?cinemaId=${encodeURIComponent(cinemaId)}`, { headers: getAuthHeaders() });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data) || "Không tải được tồn kho của rạp");
  return normalizeList(data);
}

export async function fetchCinemaInventoryMenu(cinemaId) {
  const response = await fetch(`${API_URL}/food-inventory/menu?cinemaId=${encodeURIComponent(cinemaId)}`, { headers: getAuthHeaders() });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data) || "Không tải được menu tồn kho của rạp");
  return data;
}

function periodQuery(period) {
  if (!period) return "";
  const isDate = /^\d{4}-\d{2}-\d{2}$/.test(period);
  return isDate ? `?date=${encodeURIComponent(period)}` : `?period=${encodeURIComponent(period)}`;
}

async function getCinemaFoodEndpoint(cinemaId, endpoint, period) {
  if (!cinemaId) throw new Error("Chưa chọn rạp.");
  const response = await fetch(`${API_URL}/cinemas/${encodeURIComponent(cinemaId)}/${endpoint}${periodQuery(period)}`, { headers: getAuthHeaders() });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data) || "Không tải được dữ liệu đồ ăn theo rạp");
  return data;
}

export const loadFoodInventory = (cinemaId) => getCinemaFoodEndpoint(cinemaId, "food-inventory");
export const loadFoodStatistics = (cinemaId, period) => getCinemaFoodEndpoint(cinemaId, "food-statistics", period);
export const loadFoodRevenue = (cinemaId, period) => getCinemaFoodEndpoint(cinemaId, "food-revenue", period);
export const loadTopSellingFoods = (cinemaId, period) => getCinemaFoodEndpoint(cinemaId, "top-selling-foods", period);

export async function deleteCinemaFood(cinemaId, foodId) {
  const response = await fetch(`${API_URL}/cinemas/${encodeURIComponent(cinemaId)}/foods/${encodeURIComponent(foodId)}`, {
    method: "DELETE", headers: getAuthHeaders()
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data) || "Xóa món thất bại");
  return data;
}

export async function updateCinemaFoodSaleStatus(cinemaId, foodId, saleStatus) {
  clearApiCache("food-inventory/menu");
  const response = await fetch(`${API_URL}/cinemas/${encodeURIComponent(cinemaId)}/foods/${encodeURIComponent(foodId)}/status`, {
    method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ saleStatus })
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data) || "Cập nhật trạng thái món thất bại");
  clearApiCache("food-inventory/menu");
  return data;
}

export async function updateCinemaComboSaleStatus(cinemaId, comboId, saleStatus) {
  clearApiCache("food-inventory/menu");
  const response = await fetch(`${API_URL}/cinemas/${encodeURIComponent(cinemaId)}/combos/${encodeURIComponent(comboId)}/status`, {
    method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ saleStatus })
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data) || "Cập nhật trạng thái Combo thất bại");
  clearApiCache("food-inventory/menu");
  return data;
}

export async function receiveFoodStock(payload) {
  const response = await fetch(`${API_URL}/food-inventory/receive`, {
    method: "POST", headers: getAuthHeaders(), body: JSON.stringify(payload)
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data) || "Nhập hàng thất bại");
  return data;
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
