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

// GET /api/Customers
export async function getCustomerList() {
  const response = await fetch(`${API_URL}/Customers`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Lấy danh sách khách hàng thất bại!")
    );
  }

  return normalizeArray(data);
}

// GET /api/Customers/:id
export async function getCustomerById(id) {
  const response = await fetch(`${API_URL}/Customers/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Lấy thông tin khách hàng thất bại!")
    );
  }

  return data;
}

// POST /api/Customers
export async function createCustomer(customer) {
  const response = await fetch(`${API_URL}/Customers`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(customer),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Thêm khách hàng thất bại!")
    );
  }

  return data;
}

// PUT /api/Customers/:id
export async function updateCustomer(id, customer) {
  const response = await fetch(`${API_URL}/Customers/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(customer),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Cập nhật khách hàng thất bại!")
    );
  }

  return data;
}

// DELETE /api/Customers/:id
export async function deleteCustomer(id) {
  const response = await fetch(`${API_URL}/Customers/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Xóa khách hàng thất bại!")
    );
  }

  return data;
}