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

/* =========================
   STATUS HELPER
   Backend chỉ nhận:
   Active, Cancelled, Completed
========================= */

function toApiStatus(status) {
  if (!status)               return "Active";
  if (status === "Đang chiếu") return "Active";
  if (status === "Sắp chiếu")  return "Active";
  if (status === "Chiếu sớm")  return "Active";
  if (status === "Đã chiếu")   return "Completed";
  return status;
}

function normalizeShowtimePayload(showtime) {
  /* Backend nhận HH:mm cho startTime/endTime
     Khi qua nửa đêm: gửi thêm endDate = ngày hôm sau */
  const endDate = showtime.endDate ?? showtime.showDate;

  /* Đảm bảo chỉ gửi HH:mm (cắt bỏ phần date nếu có) */
  const toHHmm = (t) => {
    if (!t) return t;
    return t.includes("T") ? t.split("T")[1].slice(0, 5) : t.slice(0, 5);
  };

  return {
    movieId:   Number(showtime.movieId),
    roomId:    Number(showtime.roomId),
    showDate:  showtime.showDate,
    endDate,                          /* ngày kết thúc (có thể là hôm sau) */
    startTime: toHHmm(showtime.startTime),
    endTime:   toHHmm(showtime.endTime),
    basePrice: Number(showtime.basePrice),
    status:    toApiStatus(showtime.status),
  };
}

/* =========================
   GET /api/Showtimes
========================= */

export async function getShowtimeList() {
  const response = await fetch(`${API_URL}/Showtimes`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Lấy danh sách suất chiếu thất bại!")
    );
  }

  return normalizeArray(data);
}

/* =========================
   GET /api/Showtimes/:id
========================= */

export async function getShowtimeById(id) {
  const response = await fetch(`${API_URL}/Showtimes/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Lấy thông tin suất chiếu thất bại!")
    );
  }

  return data;
}

/* =========================
   POST /api/Showtimes
========================= */

export async function createShowtime(showtime) {
  const payload = normalizeShowtimePayload(showtime);

  console.log("CREATE SHOWTIME PAYLOAD:", payload);

  const response = await fetch(`${API_URL}/Showtimes`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Thêm suất chiếu thất bại!"));
  }

  return data;
}

/* =========================
   PUT /api/Showtimes/:id
========================= */

export async function updateShowtime(id, showtime) {
  const payload = normalizeShowtimePayload(showtime);

  console.log("UPDATE SHOWTIME ID:", id);
  console.log("UPDATE SHOWTIME PAYLOAD:", payload);

  const response = await fetch(`${API_URL}/Showtimes/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Cập nhật suất chiếu thất bại!"));
  }

  return data;
}

/* =========================
   DELETE /api/Showtimes/:id
========================= */

export async function deleteShowtime(id) {
  const response = await fetch(`${API_URL}/Showtimes/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Xóa suất chiếu thất bại!"));
  }

  return data;
}

/* =========================
   GET /api/Showtimes/ByMovie/:movieId
========================= */

export async function getShowtimesByMovie(movieId) {
  const response = await fetch(`${API_URL}/Showtimes/ByMovie/${movieId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Lấy suất chiếu theo phim thất bại!")
    );
  }

  return normalizeArray(data);
}

/* =========================
   GET /api/Showtimes/ByRoom/:roomId
========================= */

export async function getShowtimesByRoom(roomId) {
  const response = await fetch(`${API_URL}/Showtimes/ByRoom/${roomId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Lấy suất chiếu theo phòng thất bại!")
    );
  }

  return normalizeArray(data);
}

/* =========================
   GET /api/Showtimes/Detail
========================= */

export async function getShowtimeDetailList() {
  const response = await fetch(`${API_URL}/Showtimes/Detail`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Lấy chi tiết suất chiếu thất bại!")
    );
  }

  return normalizeArray(data);
}

/* =========================
   PATCH /api/Showtimes/:id/Cancel
========================= */

export async function cancelShowtime(id) {
  const response = await fetch(`${API_URL}/Showtimes/${id}/Cancel`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Hủy suất chiếu thất bại!"));
  }

  return data;
}