import {
  getApiUrl,
  readResponse,
  getErrorMessage,
  getAuthHeaders,
} from "../../services/apiHelper";

const API_URL = getApiUrl();

export const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/* =========================
   COMMON
========================= */

export function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;

  return [];
}

export function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

export function getUserEmail() {
  const savedUser = getSavedUser();

  return (
    localStorage.getItem("userEmail") ||
    localStorage.getItem("email") ||
    savedUser.email ||
    savedUser.Email
  );
}

/* =========================
   DATE
========================= */

export function toISODate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

export function formatDateLabel(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");

  return `${dd}/${mm} - ${dayNames[date.getDay()]}`;
}

export function createBookingDates(total = 7) {
  return Array.from({ length: total }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);

    return {
      iso: toISODate(d),
      label: formatDateLabel(d),
    };
  });
}

/* =========================
   API
========================= */

export async function getCinemas() {
  const response = await fetch(`${API_URL}/Cinemas`, {
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Lấy danh sách rạp thất bại"));
  }

  return normalizeArray(data);
}

export async function getRooms() {
  const response = await fetch(`${API_URL}/Rooms`, {
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Lấy danh sách phòng thất bại"));
  }

  return normalizeArray(data);
}

export async function getMovieById(movieId) {
  const response = await fetch(`${API_URL}/Movies/${movieId}`, {
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Lấy thông tin phim thất bại"));
  }

  return data;
}

export async function getShowtimesByMovie(movieId) {
  const response = await fetch(`${API_URL}/Showtimes/ByMovie/${movieId}`, {
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Lấy suất chiếu thất bại"));
  }

  return normalizeArray(data);
}

export async function getSeatsByRoomId(roomId) {
  const response = await fetch(`${API_URL}/Seats/ByRoom/${roomId}`, {
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Lấy danh sách ghế thất bại"));
  }

  return normalizeArray(data);
}

export async function getAvailableSeats(showtimeId) {
  const response = await fetch(`${API_URL}/Bookings/AvailableSeats/${showtimeId}`, {
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Lấy ghế trống thất bại"));
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
    throw new Error(getErrorMessage(data, "Đặt vé thất bại"));
  }

  return data;
}

/* =========================
   MOVIE HELPERS
========================= */

export function getMovieTitle(movie) {
  return (
    movie?.title ??
    movie?.Title ??
    movie?.movieTitle ??
    movie?.MovieTitle ??
    movie?.name ??
    movie?.Name ??
    "Không rõ tên phim"
  );
}

export function getMoviePoster(movie) {
  const poster =
    movie?.posterUrl ??
    movie?.PosterUrl ??
    movie?.posterURL ??
    movie?.PosterURL ??
    movie?.imageUrl ??
    movie?.ImageUrl ??
    "";

  if (!poster) return "/img/no-image.png";
  if (poster.startsWith("http://") || poster.startsWith("https://")) return poster;
  if (poster.startsWith("/")) return poster;

  return `/img/${poster}`;
}

export function getMovieAgeRating(movie) {
  return movie?.ageRating ?? movie?.AgeRating ?? "P";
}

export function getMovieDuration(movie) {
  const duration =
    movie?.duration ??
    movie?.Duration ??
    movie?.durationMinutes ??
    movie?.DurationMinutes ??
    120;

  if (String(duration).toLowerCase().includes("phút")) return duration;

  return `${duration} phút`;
}

export function getMovieDirector(movie) {
  return movie?.director ?? movie?.Director ?? "Đang cập nhật";
}

/* =========================
   CINEMA HELPERS
========================= */

export function getCinemaId(cinema) {
  return cinema?.cinemaId ?? cinema?.CinemaId ?? cinema?.id ?? cinema?.Id;
}

export function getCinemaName(cinema) {
  return (
    cinema?.cinemaName ??
    cinema?.CinemaName ??
    cinema?.name ??
    cinema?.Name ??
    "Rạp chưa chọn"
  );
}

export function getCinemaNameById(cinemas, cinemaId) {
  const found = cinemas.find(
    (cinema) => String(getCinemaId(cinema)) === String(cinemaId)
  );

  return found ? getCinemaName(found) : "Rạp chưa chọn";
}

/* =========================
   ROOM HELPERS
========================= */

export function getRoomId(room) {
  return room?.roomId ?? room?.RoomId ?? room?.id ?? room?.Id;
}

export function getRoomName(room) {
  return (
    room?.roomName ??
    room?.RoomName ??
    room?.name ??
    room?.Name ??
    "N/A"
  );
}

export function getRoomCinemaId(room) {
  return (
    room?.cinemaId ??
    room?.CinemaId ??
    room?.cinema?.cinemaId ??
    room?.cinema?.CinemaId ??
    room?.Cinema?.cinemaId ??
    room?.Cinema?.CinemaId
  );
}

export function findRoomByShowtime(showtime, rooms = []) {
  const roomId = getShowtimeRoomId(showtime);

  return rooms.find((room) => String(getRoomId(room)) === String(roomId));
}

/* =========================
   SHOWTIME HELPERS
========================= */

export function getShowtimeId(showtime) {
  return (
    showtime?.showTimeId ??
    showtime?.ShowTimeId ??
    showtime?.showtimeId ??
    showtime?.ShowtimeId ??
    showtime?.id ??
    showtime?.Id
  );
}

export function getShowtimeRoomId(showtime) {
  return (
    showtime?.roomId ??
    showtime?.RoomId ??
    showtime?.room?.roomId ??
    showtime?.room?.RoomId ??
    showtime?.Room?.roomId ??
    showtime?.Room?.RoomId
  );
}

export function getShowtimeStartTime(showtime) {
  return showtime?.startTime ?? showtime?.StartTime ?? "";
}

export function getShowtimeDate(showtime) {
  const startTime = getShowtimeStartTime(showtime);

  if (!startTime) return "";

  return String(startTime).split("T")[0];
}

export function getShowtimeHour(showtime) {
  const startTime = getShowtimeStartTime(showtime);

  if (!startTime) return "";

  if (String(startTime).includes("T")) {
    return String(startTime).split("T")[1]?.slice(0, 5) || "";
  }

  return String(startTime).slice(0, 5);
}

export function getShowtimeStatus(showtime) {
  const status = showtime?.status ?? showtime?.Status ?? "Chưa mở bán";

  if (status === "Active") return "Đang bán";
  if (status === "Inactive") return "Hủy";

  return status;
}

export function getShowtimeBasePrice(showtime) {
  return (
    showtime?.basePrice ??
    showtime?.BasePrice ??
    showtime?.price ??
    showtime?.Price ??
    75000
  );
}

export function isShowtimeActive(showtime) {
  const status = getShowtimeStatus(showtime);

  return status !== "Hủy" && status !== "Inactive";
}

export function filterShowtimesForBooking({
  showtimes = [],
  rooms = [],
  selectedDateIso = "",
  selectedCinemaId = "",
}) {
  return showtimes
    .filter((showtime) => {
      const showDate = getShowtimeDate(showtime);

      if (selectedDateIso && showDate !== selectedDateIso) return false;

      const room = findRoomByShowtime(showtime, rooms);

      if (!room) return false;

      if (
        selectedCinemaId &&
        String(getRoomCinemaId(room)) !== String(selectedCinemaId)
      ) {
        return false;
      }

      return isShowtimeActive(showtime);
    })
    .sort((a, b) => getShowtimeHour(a).localeCompare(getShowtimeHour(b)));
}

export function findFirstShowtime({
  showtimes = [],
  rooms = [],
  selectedDateIso = "",
  selectedCinemaId = "",
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
   SEAT HELPERS
========================= */

export function getSeatId(seat) {
  return (
    seat?.seatId ??
    seat?.SeatId ??
    seat?.id ??
    seat?.Id ??
    seat?.seat?.seatId ??
    seat?.seat?.SeatId ??
    seat?.Seat?.seatId ??
    seat?.Seat?.SeatId
  );
}

export function getSeatRow(seat) {
  return seat?.seatRow ?? seat?.SeatRow ?? seat?.row ?? seat?.Row ?? "";
}

export function getSeatNumber(seat) {
  return (
    seat?.seatNumber ??
    seat?.SeatNumber ??
    seat?.number ??
    seat?.Number ??
    ""
  );
}

export function getSeatType(seat) {
  return seat?.seatType ?? seat?.SeatType ?? seat?.type ?? seat?.Type ?? "Standard";
}

export function isSeatActive(seat) {
  const value = seat?.isActive ?? seat?.IsActive;

  return value !== false && value !== 0;
}

export function getSeatLabel(seat) {
  const row = String(getSeatRow(seat));
  const number = String(getSeatNumber(seat));

  if (!number) return row;

  if (row && number.toUpperCase().startsWith(row.toUpperCase())) {
    return number;
  }

  return `${row}${number}`;
}

export function getSeatDisplayNumber(seat) {
  const row = String(getSeatRow(seat));
  const number = String(getSeatNumber(seat));

  if (row && number.toUpperCase().startsWith(row.toUpperCase())) {
    return number.slice(row.length);
  }

  return number;
}

export function isSeatAvailable(seat, availableSeats = []) {
  if (!isSeatActive(seat)) return false;

  if (!Array.isArray(availableSeats) || availableSeats.length === 0) {
    return false;
  }

  const targetId = String(getSeatId(seat));
  const targetLabel = String(getSeatLabel(seat));
  const targetNumber = String(getSeatNumber(seat));

  return availableSeats.some((item) => {
    if (item == null) return false;

    if (typeof item !== "object") {
      const value = String(item);
      return (
        value === targetId ||
        value === targetLabel ||
        value === targetNumber
      );
    }

    const itemId = getSeatId(item);
    const itemLabel = getSeatLabel(item);
    const itemNumber = getSeatNumber(item);

    return (
      String(itemId) === targetId ||
      String(itemLabel) === targetLabel ||
      String(itemNumber) === targetNumber
    );
  });
}

export function getSeatPrice(seat, selectedShowtime) {
  const base = Number(getShowtimeBasePrice(selectedShowtime)) || 75000;
  const seatType = String(getSeatType(seat)).toLowerCase();

  if (seatType === "vip") return base + 20000;
  if (seatType === "sweetbox") return base + 40000;

  return base;
}

export function groupSeatsByRow(seats = []) {
  const grouped = seats.reduce((acc, seat) => {
    const row = getSeatRow(seat) || "A";

    if (!acc[row]) acc[row] = [];

    acc[row].push(seat);

    return acc;
  }, {});

  Object.keys(grouped).forEach((row) => {
    grouped[row].sort((a, b) => {
      const numA = parseInt(String(getSeatNumber(a)).replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(String(getSeatNumber(b)).replace(/\D/g, ""), 10) || 0;

      return numA - numB;
    });
  });

  return grouped;
}

export function buildBookingPayload({
  userId,
  showtimeId,
  seat,
  selectedShowtime,
}) {
  const ticketPrice = getSeatPrice(seat, selectedShowtime);

  return {
    userId: Number(userId),
    showTimeId: Number(showtimeId),
    seatId: Number(getSeatId(seat)),
    bookingDate: new Date().toISOString(),
    ticketPrice,
    discountAmt: 0,
    totalAmount: ticketPrice,
    bookingType: "Online",
    status: "Confirmed",
  };
}