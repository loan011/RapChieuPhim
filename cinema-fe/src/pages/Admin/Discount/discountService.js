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

// GET /api/Discounts
export async function getDiscountList() {
  const response = await fetch(`${API_URL}/Discounts`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Lấy danh sách mã giảm giá thất bại!"));
  }

  return normalizeArray(data);
}

// GET /api/Discounts/:id
export async function getDiscountById(id) {
  const response = await fetch(`${API_URL}/Discounts/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, `Không tìm thấy mã giảm giá #${id}`));
  }

  return data;
}

// POST /api/Discounts
export async function createDiscount(payload) {
  const response = await fetch(`${API_URL}/Discounts`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Tạo mã giảm giá thất bại!"));
  }

  return data;
}

// PUT /api/Discounts/:id
export async function updateDiscount(id, payload) {
  const response = await fetch(`${API_URL}/Discounts/${id}`, {
    method: "PUT",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Cập nhật mã giảm giá thất bại!"));
  }

  return data;
}

// DELETE /api/Discounts/:id
export async function deleteDiscount(id) {
  const response = await fetch(`${API_URL}/Discounts/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Xóa mã giảm giá thất bại!"));
  }

  return data;
}
