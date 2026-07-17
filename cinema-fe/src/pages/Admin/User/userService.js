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

// POST /api/Auth/Register (admin tạo user mới)
export async function createUser(user) {
  const response = await fetch(`${API_URL}/Auth/Register`, {
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
  const isStaff = String(user?.role || user?.roleName || "").trim().toLowerCase() === "staff";
  
  const url = isStaff 
    ? `${API_URL}/Users/AdminUpdate/${id}`
    : `${API_URL}/Users/${id}`;

  const payload = isStaff 
    ? {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || "0900000000",
        dateOfBirth: user.dateOfBirth || "1995-01-01",
        gender: user.gender || "Nam",
        role: "Staff",
        isActive: user.isActive === true || user.isActive === "true",
        ...(user.password ? { password: user.password, confirmPassword: user.password } : {})
      }
    : user;

  const response = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Cập nhật người dùng thất bại!"));
  }

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

// GET /api/Users/GetProfile (for customer profile)
export async function getProfileCustomer() {
  const response = await fetch(`${API_URL}/Users/GetProfile`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy thông tin cá nhân thất bại!"));
  return data;
}

// PUT /api/Users/UpdateProfile (update profile)
export async function updateProfile(user) {
  const response = await fetch(`${API_URL}/Users/UpdateProfile`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(user),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Cập nhật thông tin cá nhân thất bại!"));
  return data;
}

// POST /api/Users/ChangePassword
export async function changePassword(payload) {
  // Gửi cả 2 dạng tên field (camelCase và PascalCase) để tương thích với backend ASP.NET Core
  const body = {
    currentPassword: payload.currentPassword,
    CurrentPassword: payload.currentPassword,
    oldPassword: payload.currentPassword,
    OldPassword: payload.currentPassword,
    newPassword: payload.newPassword,
    NewPassword: payload.newPassword,
    confirmPassword: payload.confirmPassword,
    ConfirmPassword: payload.confirmPassword,
  };
  const response = await fetch(`${API_URL}/Users/ChangePassword`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Đổi mật khẩu thất bại!"));
  return data;
}

