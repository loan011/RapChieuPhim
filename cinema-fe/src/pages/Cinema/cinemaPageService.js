import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../services/apiHelper";

const API_URL = getApiUrl();

// Headers không có auth (cho endpoint public)
function getPublicHeaders() {
  return { "Content-Type": "application/json" };
}

// Thử gọi với auth trước, nếu 401 thì gọi lại không auth
async function fetchWithFallback(url) {
  // Lần 1: gọi có auth
  let response = await fetch(url, { headers: getAuthHeaders() });

  // Nếu 401 → thử không auth (public endpoint)
  if (response.status === 401) {
    response = await fetch(url, { headers: getPublicHeaders() });
  }

  const data = await readResponse(response);
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("email");
    }
    throw new Error(
      response.status === 401
        ? "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!"
        : getErrorMessage(data, "Gọi API thất bại!")
    );
  }
  return data;
}

// GET /api/Cinemas
export async function getCinemaList() {
  try {
    return await fetchWithFallback(`${API_URL}/Cinemas`);
  } catch (err) {
    throw new Error(err.message || "Lấy danh sách rạp chiếu thất bại!");
  }
}

// GET /api/Cinemas/:id
export async function getCinemaById(id) {
  try {
    return await fetchWithFallback(`${API_URL}/Cinemas/${id}`);
  } catch (err) {
    throw new Error(err.message || "Lấy thông tin rạp chiếu thất bại!");
  }
}

// GET /api/Areas
export async function getAreaList() {
  try {
    return await fetchWithFallback(`${API_URL}/Areas`);
  } catch (err) {
    throw new Error(err.message || "Lấy danh sách khu vực thất bại!");
  }
}

// GET /api/Rooms — lọc theo cinemaId trên client
export async function getRoomsByCinema(cinemaId) {
  try {
    const raw = await fetchWithFallback(`${API_URL}/Rooms`);
    const arr = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.$values)
      ? raw.$values
      : [];
    // Lọc phòng theo cinemaId và chỉ lấy phòng đang hoạt động
    return arr.filter(
      (r) =>
        String(r.cinemaId ?? r.CinemaId ?? "").toLowerCase() === String(cinemaId).toLowerCase() &&
        (r.isActive ?? r.IsActive) !== false
    );
  } catch (err) {
    throw new Error(err.message || "Lấy danh sách phòng chiếu thất bại!");
  }
}
