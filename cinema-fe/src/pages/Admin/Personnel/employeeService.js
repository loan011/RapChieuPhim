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

// GET /api/Employees
export async function getEmployeeList() {
  const response = await fetch(`${API_URL}/Employees`, {
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

// GET /api/Employees/:id
export async function getEmployeeById(id) {
  const response = await fetch(`${API_URL}/Employees/${id}`, {
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

// POST /api/Employees
export async function createEmployee(employee) {
  const response = await fetch(`${API_URL}/Employees`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(employee),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Thêm nhân viên thất bại!")
    );
  }

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

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Cập nhật nhân viên thất bại!")
    );
  }

  return data;
}

// DELETE /api/Employees/:id
export async function deleteEmployee(id) {
  const response = await fetch(`${API_URL}/Employees/${id}`, {
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