import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";
const API_URL = getApiUrl();

export async function getAreaList() {
  const r = await fetch(`${API_URL}/Areas`, { headers: getAuthHeaders() });
  const d = await readResponse(r);
  if (!r.ok) throw new Error(getErrorMessage(d, "Lấy danh sách khu vực thất bại!"));
  return d;
}
export async function createArea(area) {
  const r = await fetch(`${API_URL}/Areas`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(area) });
  const d = await readResponse(r);
  if (!r.ok) throw new Error(getErrorMessage(d, "Thêm khu vực thất bại!"));
  return d;
}
export async function updateArea(id, area) {
  const r = await fetch(`${API_URL}/Areas/${id}`, { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(area) });
  const d = await readResponse(r);
  if (!r.ok) throw new Error(getErrorMessage(d, "Cập nhật khu vực thất bại!"));
  return d;
}
export async function deleteArea(id) {
  const r = await fetch(`${API_URL}/Areas/${id}`, { method: "DELETE", headers: getAuthHeaders() });
  const d = await readResponse(r);
  if (!r.ok) throw new Error(getErrorMessage(d, "Xóa khu vực thất bại!"));
  return d;
}
