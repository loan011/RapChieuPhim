const API_URL = import.meta.env.VITE_API_URL;

/* =========================
   API HELPER
========================= */

function getToken() {
  return localStorage.getItem("token");
}

function getAuthHeaders() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readResponse(response) {
  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.Message ||
      data?.title ||
      data?.errors ||
      `Lỗi API ${response.status}`;

    throw new Error(
      typeof message === "string" ? message : JSON.stringify(message)
    );
  }

  return data;
}

async function apiGet(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return readResponse(response);
}

async function apiPost(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  return readResponse(response);
}

/* =========================
   TRY MANY API URLS
   Nếu backend khác tên endpoint,
   chỉ cần sửa danh sách dưới đây.
========================= */

async function tryGet(urls) {
  let lastError = null;

  for (const url of urls) {
    try {
      return await apiGet(url);
    } catch (err) {
      lastError = err;
      console.warn("API GET lỗi:", url, err.message);
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
    }
  }

  throw lastError || new Error("Không gọi được API");
}

/* =========================
   LOCAL USER
========================= */

export function getSavedUser() {
  try {
    return (
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(localStorage.getItem("currentUser")) ||
      {}
    );
  } catch {
    return {};
  }
}

export function getUserEmail() {
  const user = getSavedUser();

  return (
    user.email ||
    user.Email ||
    localStorage.getItem("email") ||
    localStorage.getItem("userEmail") ||
    ""
  );
}

/* =========================
   BOOKING DATE
========================= */

export function createBookingDates(totalDays = 7) {
  const days = [];

  for (let i = 0; i < totalDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    const iso = date.toISOString().split("T")[0];

    const label =
      i === 0
        ? `Hôm nay, ${date.toLocaleDateString("vi-VN")}`
        : date.toLocaleDateString("vi-VN", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
          });

    days.push({
      iso,
      label,
    });
  }

  return days;
}

/* =========================
   API: CINEMA / ROOM / MOVIE / SHOWTIME / SEAT / BOOKING
========================= */

export async function getCinemas() {
  const data = await tryGet([
    `${API_URL}/Cinemas`,
    `${API_URL}/Cinema`,
    `${API_URL}/api/Cinemas`,
    `${API_URL}/api/Cinema`,
  ]);

  return Array.isArray(data) ? data : data?.data || data?.items || [];
}

export async function getRooms() {
  const data = await tryGet([
    `${API_URL}/Rooms`,
    `${API_URL}/Room`,
    `${API_URL}/api/Rooms`,
    `${API_URL}/api/Room`,
  ]);

  return Array.isArray(data) ? data : data?.data || data?.items || [];
}

export async function getMovieById(movieId) {
  if (!movieId) return null;

  const data = await tryGet([
    `${API_URL}/Movies/${movieId}`,
    `${API_URL}/Movies/GetById/${movieId}`,
    `${API_URL}/api/Movies/${movieId}`,
    `${API_URL}/api/Movies/GetById/${movieId}`,
  ]);

  return data?.data || data;
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

  return Array.isArray(data) ? data : data?.data || data?.items || [];
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

  return Array.isArray(data) ? data : data?.data || data?.items || [];
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

  return Array.isArray(data) ? data : data?.data || data?.items || [];
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

  return data?.data || data;
}

/* =========================
   API WRAPPER FOR BOOKING.JSX
   Booking.jsx chỉ gọi 2 hàm này,
   không cần tự Promise.all API nữa.
========================= */

export async function loadBookingInitialData({
  movieParam,
  showtimeParam,
  dates,
}) {
  const [cinemas, rooms, movie, showtimes] = await Promise.all([
    getCinemas(),
    getRooms(),
    getMovieById(movieParam),
    getShowtimesByMovie(movieParam),
  ]);

  let initialShowtime = null;

  if (showtimeParam) {
    initialShowtime = showtimes.find(
      (st) => String(getShowtimeId(st)) === String(showtimeParam)
    );
  }

  if (!initialShowtime) {
    initialShowtime = showtimes[0] || null;
  }

  let selectedCinemaId = "";
  let selectedDateIso = dates?.[0]?.iso || "";

  if (initialShowtime) {
    const room = rooms.find(
      (r) => String(getRoomId(r)) === String(getShowtimeRoomId(initialShowtime))
    );

    if (room) {
      selectedCinemaId = String(getRoomCinemaId(room));
    }

    const date = getShowtimeDate(initialShowtime);

    if (date) {
      selectedDateIso = date;
    }
  }

  return {
    cinemas,
    rooms,
    movie,
    showtimes,
    selectedShowtime: initialShowtime,
    selectedCinemaId,
    selectedDateIso,
  };
}

export async function loadBookingSeatsData(selectedShowtime) {
  if (!selectedShowtime) {
    return {
      seats: [],
      availableSeats: [],
    };
  }

  const showtimeId = getShowtimeId(selectedShowtime);
  const roomId = getShowtimeRoomId(selectedShowtime);

  if (!roomId) {
    return {
      seats: [],
      availableSeats: [],
    };
  }

  const seats = await getSeatsByRoomId(roomId);

  let availableSeats = [];

  try {
    availableSeats = await getAvailableSeats(showtimeId);
  } catch (err) {
    console.error("Lỗi tải ghế trống:", err);
    availableSeats = [];
  }

  return {
    seats,
    availableSeats,
  };
}

/* =========================
   MOVIE HELPER
========================= */

export function getMovieTitle(movie) {
  return movie?.title || movie?.Title || movie?.movieTitle || movie?.MovieTitle || "";
}

export function getMoviePoster(movie) {
  return (
    movie?.posterUrl ||
    movie?.PosterUrl ||
    movie?.imageUrl ||
    movie?.ImageUrl ||
    movie?.poster ||
    movie?.Poster ||
    "https://via.placeholder.com/300x450?text=No+Poster"
  );
}

export function getMovieAgeRating(movie) {
  return movie?.ageRating || movie?.AgeRating || movie?.age || movie?.Age || "P";
}

export function getMovieDuration(movie) {
  const duration =
    movie?.duration ||
    movie?.Duration ||
    movie?.durationMinutes ||
    movie?.DurationMinutes ||
    movie?.runningTime ||
    movie?.RunningTime;

  if (!duration) return "Đang cập nhật";

  return String(duration).includes("phút") ? duration : `${duration} phút`;
}

export function getMovieDirector(movie) {
  return movie?.director || movie?.Director || "Đang cập nhật";
}

/* =========================
   CINEMA HELPER
========================= */

export function getCinemaId(cinema) {
  return cinema?.cinemaId ?? cinema?.CinemaId ?? cinema?.id ?? cinema?.Id;
}

export function getCinemaName(cinema) {
  return (
    cinema?.cinemaName ||
    cinema?.CinemaName ||
    cinema?.name ||
    cinema?.Name ||
    "Không rõ rạp"
  );
}

export function getCinemaNameById(cinemas, cinemaId) {
  const found = cinemas.find(
    (cinema) => String(getCinemaId(cinema)) === String(cinemaId)
  );

  return found ? getCinemaName(found) : "Chưa chọn";
}

/* =========================
   ROOM HELPER
========================= */

export function getRoomId(room) {
  return room?.roomId ?? room?.RoomId ?? room?.id ?? room?.Id;
}

export function getRoomName(room) {
  return (
    room?.roomName ||
    room?.RoomName ||
    room?.name ||
    room?.Name ||
    "Không rõ phòng"
  );
}

export function getRoomCinemaId(room) {
  return (
    room?.cinemaId ??
    room?.CinemaId ??
    room?.cinemaID ??
    room?.CinemaID ??
    ""
  );
}

export function findRoomByShowtime(showtime, rooms) {
  const roomId = getShowtimeRoomId(showtime);

  return rooms.find((room) => String(getRoomId(room)) === String(roomId));
}

/* =========================
   SHOWTIME HELPER
========================= */

export function getShowtimeId(showtime) {
  return (
    showtime?.showtimeId ??
    showtime?.ShowtimeId ??
    showtime?.showTimeId ??
    showtime?.ShowTimeId ??
    showtime?.id ??
    showtime?.Id
  );
}

export function getShowtimeRoomId(showtime) {
  return (
    showtime?.roomId ??
    showtime?.RoomId ??
    showtime?.roomID ??
    showtime?.RoomID ??
    showtime?.room?.roomId ??
    showtime?.Room?.RoomId ??
    ""
  );
}

export function getShowtimeDate(showtime) {
  const rawDate =
    showtime?.showDate ||
    showtime?.ShowDate ||
    showtime?.date ||
    showtime?.Date ||
    showtime?.startTime ||
    showtime?.StartTime ||
    showtime?.showtimeDate ||
    showtime?.ShowtimeDate;

  if (!rawDate) return "";

  return String(rawDate).split("T")[0];
}

export function getShowtimeHour(showtime) {
  const rawTime =
    showtime?.showTime ||
    showtime?.ShowTime ||
    showtime?.time ||
    showtime?.Time ||
    showtime?.startTime ||
    showtime?.StartTime ||
    showtime?.startAt ||
    showtime?.StartAt;

  if (!rawTime) return "N/A";

  const value = String(rawTime);

  if (value.includes("T")) {
    return value.split("T")[1]?.slice(0, 5) || "N/A";
  }

  return value.slice(0, 5);
}

export function getShowtimeBasePrice(showtime) {
  return (
    showtime?.basePrice ??
    showtime?.BasePrice ??
    showtime?.ticketPrice ??
    showtime?.TicketPrice ??
    showtime?.price ??
    showtime?.Price ??
    70000
  );
}

export function filterShowtimesForBooking({
  showtimes,
  rooms,
  selectedDateIso,
  selectedCinemaId,
}) {
  return showtimes.filter((showtime) => {
    const showtimeDate = getShowtimeDate(showtime);
    const room = findRoomByShowtime(showtime, rooms);

    const sameDate = !selectedDateIso || showtimeDate === selectedDateIso;

    const sameCinema =
      !selectedCinemaId ||
      (room && String(getRoomCinemaId(room)) === String(selectedCinemaId));

    return sameDate && sameCinema;
  });
}

export function findFirstShowtime({
  showtimes,
  rooms,
  selectedDateIso,
  selectedCinemaId,
}) {
  const list = filterShowtimesForBooking({
    showtimes,
    rooms,
    selectedDateIso,
    selectedCinemaId,
  });

  return list[0] || null;
}

/* =========================
   SEAT HELPER
========================= */

export function getSeatId(seat) {
  return seat?.seatId ?? seat?.SeatId ?? seat?.id ?? seat?.Id;
}

export function getSeatRow(seat) {
  return seat?.seatRow || seat?.SeatRow || seat?.row || seat?.Row || "";
}

export function getSeatNumber(seat) {
  return (
    seat?.seatNumber ||
    seat?.SeatNumber ||
    seat?.number ||
    seat?.Number ||
    ""
  );
}

export function getSeatType(seat) {
  return (
    seat?.seatType ||
    seat?.SeatType ||
    seat?.type ||
    seat?.Type ||
    "standard"
  );
}

export function getSeatLabel(seat) {
  return `${getSeatRow(seat)}${getSeatNumber(seat)}`;
}

export function getSeatDisplayNumber(seat) {
  return getSeatNumber(seat);
}

export function isSeatAvailable(seat, availableSeats) {
  const seatId = getSeatId(seat);

  if (!Array.isArray(availableSeats) || availableSeats.length === 0) {
    return true;
  }

  return availableSeats.some((availableSeat) => {
    const availableSeatId =
      availableSeat?.seatId ??
      availableSeat?.SeatId ??
      availableSeat?.id ??
      availableSeat?.Id;

    return String(availableSeatId) === String(seatId);
  });
}

export function getSeatPrice(seat, selectedShowtime) {
  const basePrice = Number(getShowtimeBasePrice(selectedShowtime));

  const type = String(getSeatType(seat)).toLowerCase();

  if (type.includes("sweetbox") || type.includes("couple") || type.includes("đôi")) {
    return basePrice + 40000;
  }

  if (type.includes("vip")) {
    return basePrice + 20000;
  }

  return basePrice;
}

export function groupSeatsByRow(seats) {
  return seats.reduce((groups, seat) => {
    const row = getSeatRow(seat) || "A";

    if (!groups[row]) {
      groups[row] = [];
    }

    groups[row].push(seat);

    groups[row].sort((a, b) => {
      const aNumber = Number(getSeatNumber(a));
      const bNumber = Number(getSeatNumber(b));

      return aNumber - bNumber;
    });

    return groups;
  }, {});
}

/* =========================
   BOOKING PAYLOAD
========================= */

export function buildBookingPayload({ userId, showtimeId, seat, selectedShowtime }) {
  return {
    userId: Number(userId),
    showtimeId: Number(showtimeId),
    seatId: Number(getSeatId(seat)),
    totalPrice: Number(getSeatPrice(seat, selectedShowtime)),
    status: "Paid",
    paymentStatus: "Paid",
  };
}