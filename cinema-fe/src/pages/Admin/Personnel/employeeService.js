import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();

// GET /api/Employees
export async function getEmployeeList() {
  const response = await fetch(`${API_URL}/Employees`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy danh sách nhân viên thất bại!"));
  return data;
}

// GET /api/Employees/:id
export async function getEmployeeById(id) {
  const response = await fetch(`${API_URL}/Employees/${id}`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy thông tin nhân viên thất bại!"));
  return data;
}

// POST /api/Employees
export async function createEmployee(employee) {
  const response = await fetch(`${API_URL}/Employees`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(employee),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Thêm nhân viên thất bại!"));
  return data;
}

// PUT /api/Employees/:id
export async function updateEmployee(id, employee) {
  const response = await fetch(`${API_URL}/Employees/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(employee),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Cập nhật nhân viên thất bại!"));
  return data;
}

// DELETE /api/Employees/:id
export async function deleteEmployee(id) {
  const response = await fetch(`${API_URL}/Employees/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Xóa nhân viên thất bại!"));
  return data;
}
