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

// GET /api/Users/ByRole/Staff
export async function getEmployeeList() {
  const response = await fetch(`${API_URL}/Users/ByRole/Staff`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Lấy danh sách nhân viên thất bại!")
    );
  }

  return normalizeArray(data);
}

// GET /api/Users/:id
export async function getEmployeeById(id) {
  const response = await fetch(`${API_URL}/Users/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Lấy thông tin nhân viên thất bại!")
    );
  }

  return data;
}

// POST /api/Auth/CreateInternalAccount
export async function createEmployee(employee) {
  const payload = {
    fullName: employee.fullName,
    email: employee.email,
    password: employee.password || "123456a@", // Mật khẩu từ form hoặc mặc định
    confirmPassword: employee.password || "123456a@",
    phone: employee.phone || "0900000000",
    dateOfBirth: employee.dateOfBirth || "1995-01-01",
    gender: employee.gender || "Nam",
    roleName: "Staff",
    cinemaId: employee.cinemaId ? Number(employee.cinemaId) : null,
  };

  const response = await fetch(`${API_URL}/Auth/CreateInternalAccount`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Tạo nhân viên thất bại!"));
  }

  return data;
}

// PUT /api/Users/AdminUpdate/:id
export async function updateEmployee(id, employee) {
  const payload = {
    fullName: employee.fullName,
    email: employee.email,
    phone: employee.phone || "0900000000",
    dateOfBirth: employee.dateOfBirth || "1995-01-01",
    gender: employee.gender || "Nam",
    role: "Staff",
    isActive: employee.isActive === true || employee.status === "Active",
    cinemaId: employee.cinemaId ? Number(employee.cinemaId) : null,
    ...(employee.password ? { password: employee.password, confirmPassword: employee.password } : {})
  };

  const response = await fetch(`${API_URL}/Users/AdminUpdate/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Cập nhật nhân viên thất bại!")
    );
  }

  return data;
}

// DELETE /api/Users/:id
export async function deleteEmployee(id) {
  const response = await fetch(`${API_URL}/Users/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Xóa nhân viên thất bại!")
    );
  }

  return data;
}