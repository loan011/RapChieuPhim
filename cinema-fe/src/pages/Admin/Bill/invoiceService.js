import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();

// GET /api/Invoices
export async function getInvoiceList() {
  const response = await fetch(`${API_URL}/Invoices`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy danh sách hóa đơn thất bại!"));
  return data;
}

// GET /api/Invoices/:id
export async function getInvoiceById(id) {
  const response = await fetch(`${API_URL}/Invoices/${id}`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy thông tin hóa đơn thất bại!"));
  return data;
}

// PUT /api/Invoices/:id  (cập nhật trạng thái)
export async function updateInvoice(id, invoice) {
  const response = await fetch(`${API_URL}/Invoices/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(invoice),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Cập nhật hóa đơn thất bại!"));
  return data;
}
