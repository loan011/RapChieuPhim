import {
  getApiUrl,
  readResponse,
  getErrorMessage,
  getAuthHeaders,
} from "../../../services/apiHelper";

const API_URL = getApiUrl();
const ROOM_ENDPOINT = "Rooms";

function buildRoomUrl(id = "") {
  const baseUrl = API_URL.replace(/\/$/, "");

  if (id) {
    return `${baseUrl}/${ROOM_ENDPOINT}/${id}`;
  }

  return `${baseUrl}/${ROOM_ENDPOINT}`;
}

function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;

  return [];
}

function buildHeaders(hasBody = false) {
  const headers = {
    ...getAuthHeaders(),
  };

  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

async function sendRoomRequest({
  id = "",
  method = "GET",
  body,
  errorMessage = "Có lỗi xảy ra!",
}) {
  const hasBody = body !== undefined;

  const response = await fetch(buildRoomUrl(id), {
    method,
    headers: buildHeaders(hasBody),
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, errorMessage));
  }

  return data;
}

// Lấy danh sách phòng chiếu
export async function getRoomList() {
  const data = await sendRoomRequest({
    method: "GET",
    errorMessage: "Lấy danh sách phòng chiếu thất bại!",
  });

  return normalizeArray(data);
}

// Lấy chi tiết 1 phòng chiếu
export async function getRoomById(id) {
  return sendRoomRequest({
    id,
    method: "GET",
    errorMessage: "Lấy thông tin phòng chiếu thất bại!",
  });
}

// Thêm phòng chiếu
export async function createRoom(roomData) {
  return sendRoomRequest({
    method: "POST",
    body: roomData,
    errorMessage: "Thêm phòng chiếu thất bại!",
  });
}

// Cập nhật phòng chiếu
export async function updateRoom(id, roomData) {
  return sendRoomRequest({
    id,
    method: "PUT",
    body: roomData,
    errorMessage: "Cập nhật phòng chiếu thất bại!",
  });
}

// Xóa phòng chiếu
export async function deleteRoom(id) {
  return sendRoomRequest({
    id,
    method: "DELETE",
    errorMessage: "Xóa phòng chiếu thất bại!",
  });
}