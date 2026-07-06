import {
  getApiUrl,
  readResponse,
  getErrorMessage,
  getAuthHeaders,
} from "../../services/apiHelper";

const API_URL = getApiUrl();

async function apiGet(url) {
  let response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (response.status === 401 || response.status === 403) {
    response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage?.(data) ||
        data?.message ||
        data?.title ||
        `Lỗi API status: ${response.status}`
    );
  }

  return data;
}

async function apiPost(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage?.(data) ||
        data?.message ||
        data?.title ||
        `Lỗi API status: ${response.status}`
    );
  }

  return data;
}

async function apiDelete(url, body) {
  const response = await fetch(url, {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage?.(data) ||
        data?.message ||
        data?.title ||
        `Lỗi API status: ${response.status}`
    );
  }

  return data;
}

async function tryGet(urls) {
  let lastError = null;

  for (const url of urls) {
    try {
      return await apiGet(url);
    } catch (err) {
      lastError = err;
      console.warn("API GET lỗi:", url, err.message);

      if (
        err.message.includes("Phiên đăng nhập") ||
        err.message.includes("hết hạn")
      ) {
        throw err;
      }
    }
  }

  throw lastError || new Error("Không gọi được API");
}

async function tryPost(urls, body) {
  let lastError = null;

  for (const url of urls) {
    try {
      return await apiPost(url, body);
    } catch (err) {
      lastError = err;
      console.warn("API POST lỗi:", url, err.message);

      if (
        err.message.includes("Phiên đăng nhập") ||
        err.message.includes("hết hạn")
      ) {
        throw err;
      }
    }
  }

  throw lastError || new Error("Không gọi được API");
}

async function tryDelete(urls, body) {
  let lastError = null;

  for (const url of urls) {
    try {
      return await apiDelete(url, body);
    } catch (err) {
      lastError = err;
      console.warn("API DELETE lỗi:", url, err.message);

      if (
        err.message.includes("Phiên đăng nhập") ||
        err.message.includes("hết hạn")
      ) {
        throw err;
      }
    }
  }

  throw lastError || new Error("Không gọi được API");
}

function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  return [];
}

function unwrapData(data) {
  return data?.data || data?.result || data;
}

export async function getCinemas() {
  const data = await tryGet([
    `${API_URL}/Cinemas`,
    `${API_URL}/Cinema`,
    `${API_URL}/api/Cinemas`,
    `${API_URL}/api/Cinema`,
  ]);

  return normalizeArray(data);
}

export async function getRooms() {
  const data = await tryGet([
    `${API_URL}/Rooms`,
    `${API_URL}/Room`,
    `${API_URL}/api/Rooms`,
    `${API_URL}/api/Room`,
  ]);

  return normalizeArray(data);
}

export async function getMovieById(movieId) {
  if (!movieId) return null;

  const data = await tryGet([
    `${API_URL}/Movies/${movieId}`,
    `${API_URL}/Movies/GetById/${movieId}`,
    `${API_URL}/api/Movies/${movieId}`,
    `${API_URL}/api/Movies/GetById/${movieId}`,
  ]);

  return unwrapData(data);
}

export async function getShowtimesByMovie(movieId) {
  if (!movieId) return [];

  const data = await tryGet([
    `${API_URL}/Showtimes/ByMovie/${movieId}`,
    `${API_URL}/Showtime/ByMovie/${movieId}`,
    `${API_URL}/Showtimes/Movie/${movieId}`,
    `${API_URL}/Showtime/Movie/${movieId}`,
    `${API_URL}/api/Showtimes/ByMovie/${movieId}`,
    `${API_URL}/api/Showtime/ByMovie/${movieId}`,
    `${API_URL}/Showtimes?movieId=${movieId}`,
    `${API_URL}/Showtime?movieId=${movieId}`,
  ]);

  return normalizeArray(data);
}

export async function getSeatsByRoomId(roomId) {
  if (!roomId) return [];

  const data = await tryGet([
    `${API_URL}/Seats/ByRoom/${roomId}`,
    `${API_URL}/Seat/ByRoom/${roomId}`,
    `${API_URL}/Seats/Room/${roomId}`,
    `${API_URL}/Seat/Room/${roomId}`,
    `${API_URL}/api/Seats/ByRoom/${roomId}`,
    `${API_URL}/api/Seat/ByRoom/${roomId}`,
    `${API_URL}/Seats?roomId=${roomId}`,
    `${API_URL}/Seat?roomId=${roomId}`,
  ]);

  return normalizeArray(data);
}

export async function getAvailableSeats(showtimeId) {
  if (!showtimeId) return [];

  const data = await tryGet([
    `${API_URL}/Bookings/AvailableSeats/${showtimeId}`,
    `${API_URL}/Booking/AvailableSeats/${showtimeId}`,
    `${API_URL}/Seats/Available/${showtimeId}`,
    `${API_URL}/Seat/Available/${showtimeId}`,
    `${API_URL}/api/Bookings/AvailableSeats/${showtimeId}`,
    `${API_URL}/api/Seats/Available/${showtimeId}`,
    `${API_URL}/Bookings/GetAvailableSeats?showtimeId=${showtimeId}`,
    `${API_URL}/Booking/GetAvailableSeats?showtimeId=${showtimeId}`,
  ]);

  return normalizeArray(data);
}

export async function createBooking(payload) {
  const data = await tryPost(
    [
      `${API_URL}/Bookings`,
      `${API_URL}/Booking`,
      `${API_URL}/api/Bookings`,
      `${API_URL}/api/Booking`,
    ],
    payload
  );

  return unwrapData(data);
}

export async function holdSeat(showTimeId, seatId) {
  const data = await tryPost(
    [
      `${API_URL}/Bookings/Hold`,
      `${API_URL}/api/Bookings/Hold`,
    ],
    {
      showTimeId: Number(showTimeId),
      seatId: Number(seatId),
    }
  );

  return unwrapData(data);
}

export async function releaseSeat(holdKey) {
  const data = await tryDelete(
    [
      `${API_URL}/Bookings/Hold`,
      `${API_URL}/api/Bookings/Hold`,
    ],
    { holdKey }
  );

  return unwrapData(data);
}

export async function getCombos() {
  const data = await tryGet([
    `${API_URL}/Foods/Available`,
    `${API_URL}/api/Foods/Available`,
    `${API_URL}/Foods`,
    `${API_URL}/api/Foods`,
    `${API_URL}/Combos`,
    `${API_URL}/api/Combos`,
  ]);

  return normalizeArray(data);
}