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

// GET /api/Users/ByRole/Customer
export async function getCustomerList() {
  const response = await fetch(`${API_URL}/Users/ByRole/Customer`, {
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

// GET /api/Users/:id
export async function getCustomerById(id) {
  const response = await fetch(`${API_URL}/Users/${id}`, {
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

// POST /api/Auth/Register
export async function createCustomer(customer) {
  const payload = {
    fullName: customer.fullName,
    email: customer.email,
    password: "123456a@", // Mật khẩu mặc định
    confirmPassword: "123456a@",
    phone: customer.phone || "0900000000",
    dateOfBirth: customer.dateOfBirth || "2000-01-01",
    gender: customer.gender || "Nam",
  };

  const response = await fetch(`${API_URL}/Auth/Register`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Thêm khách hàng thất bại!")
    );
  }

  return data;
}

// PUT /api/Users/AdminUpdate/:id
export async function updateCustomer(id, customer) {
  const payload = {
    fullName: customer.fullName,
    email: customer.email,
    phone: customer.phone || "0900000000",
    dateOfBirth: customer.dateOfBirth || "2000-01-01",
    gender: customer.gender || "Nam",
    role: "Customer",
  };

  const response = await fetch(`${API_URL}/Users/AdminUpdate/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Cập nhật khách hàng thất bại!")
    );
  }

  return data;
}

// DELETE /api/Users/:id
export async function deleteCustomer(id) {
  const response = await fetch(`${API_URL}/Users/${id}`, {
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