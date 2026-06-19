import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();

// GET /api/Users
export async function getUserList() {
  const response = await fetch(`${API_URL}/Users`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy danh sách người dùng thất bại!"));
  return data;
}

// GET /api/Users/:id
export async function getUserById(id) {
  const response = await fetch(`${API_URL}/Users/${id}`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy thông tin người dùng thất bại!"));
  return data;
}

// POST /api/Users
export async function createUser(user) {
  const response = await fetch(`${API_URL}/Users`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(user),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Thêm người dùng thất bại!"));
  return data;
}

// PUT /api/Users/:id
export async function updateUser(id, user) {
  const response = await fetch(`${API_URL}/Users/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(user),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Cập nhật người dùng thất bại!"));
  return data;
}

// DELETE /api/Users/:id
export async function deleteUser(id) {
  const response = await fetch(`${API_URL}/Users/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Xóa người dùng thất bại!"));
  return data;
}

// GET /api/Users/GetProfile (for admin)
export async function getProfileAdmin() {
  const response = await fetch(`${API_URL}/Users/GetProfile`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy thông tin cá nhân admin thất bại!"));
  return data;
}

// GET /api/Users (for customer profile)
export async function getProfileCustomer() {
  const response = await fetch(`${API_URL}/Users`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy thông tin cá nhân thất bại!"));
  return data;
}

// PUT /api/Users (update profile)
export async function updateProfile(user) {
  const response = await fetch(`${API_URL}/Users`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(user),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Cập nhật thông tin cá nhân thất bại!"));
  return data;
}

