import {
  getApiUrl,
  readResponse,
  getErrorMessage,
  getAuthHeaders,
} from "../../../services/apiHelper";

const API_URL = getApiUrl();

/* =========================
   STATUS HELPER
   Backend chỉ nhận:
   Active, Cancelled, Completed
========================= */

function toApiStatus(status) {
  if (!status) return "Active";

  if (status === "Đang bán") return "Active";
  if (status === "Đang chiếu") return "Active";
  if (status === "Chưa mở bán") return "Active";
  if (status === "Hết vé") return "Active";

  if (status === "Đã chiếu") return "Completed";
  if (status === "Hủy") return "Cancelled";

  return status;
}

function normalizeShowtimePayload(showtime) {
  return {
    movieId: Number(showtime.movieId),
    roomId: Number(showtime.roomId),
    showDate: showtime.showDate,
    startTime: showtime.startTime,
    endTime: showtime.endTime,
    basePrice: Number(showtime.basePrice),
    status: toApiStatus(showtime.status),
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

  return data;
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
    throw new Error(
      getErrorMessage(data, "Thêm suất chiếu thất bại!")
    );
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
    throw new Error(
      getErrorMessage(data, "Cập nhật suất chiếu thất bại!")
    );
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
    throw new Error(
      getErrorMessage(data, "Xóa suất chiếu thất bại!")
    );
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

  return data;
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

  return data;
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

  return data;
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
    throw new Error(
      getErrorMessage(data, "Hủy suất chiếu thất bại!")
    );
  }

  return data;
}