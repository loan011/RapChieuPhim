import {
  getApiUrl,
  readResponse,
  getErrorMessage,
  getAuthHeaders,
} from "../../../services/apiHelper";

import { generateMockSeats } from "../../Booking/usebooking.js";

const API_URL = getApiUrl();

function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.$values)) return data.data.$values;
  return [];
}

export async function getMovieList() {
  const response = await fetch(`${API_URL}/Movies`, {
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Lấy danh sách phim thất bại!"));
  }

  return normalizeArray(data);
}

export async function getShowtimeList() {
  const response = await fetch(`${API_URL}/Showtimes`, {
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

export async function getShowtimeDetailList() {
  const response = await fetch(`${API_URL}/Showtimes`, {
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

export async function getSeatsByRoomId(roomId) {
  const response = await fetch(`${API_URL}/Seats/ByRoom/${roomId}`, {
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Lấy sơ đồ ghế thất bại!"));
  }

  const seats = normalizeArray(data);

  if (seats.length === 0) {
    return generateMockSeats(roomId);
  }

  return seats;
}

export async function getAvailableSeats(showtimeId) {
  const response = await fetch(
    `${API_URL}/Bookings/AvailableSeats/${showtimeId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Lấy danh sách ghế trống thất bại!")
    );
  }

  return normalizeArray(data);
}

export async function createBooking(payload) {
  const response = await fetch(`${API_URL}/Bookings`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Đặt vé thất bại!"));
  }

  return data?.data || data;
}

export async function getRoomList() {
  const response = await fetch(`${API_URL}/Rooms`, {
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Lấy danh sách phòng thất bại!")
    );
  }

  return normalizeArray(data);
}