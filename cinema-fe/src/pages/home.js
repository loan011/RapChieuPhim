const API_URL = import.meta.env.VITE_API_URL;

export const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/* =========================
   COMMON HELPERS
========================= */

export function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;

  return [];
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
    throw new Error(
      data?.message ||
        data?.title ||
        text ||
        `Lỗi API: ${response.status}`
    );
  }

  return data;
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchApi(path) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  return normalizeArray(data);
}

/* =========================
   API HOME
========================= */

export async function getHomeMovies() {
  return fetchApi("/Movies");
}

export async function getHomeShowtimes() {
  return fetchApi("/Showtimes");
}

export async function getHomeRooms() {
  return fetchApi("/Rooms");
}

export async function getHomeCinemas() {
  return fetchApi("/Cinemas");
}

/* =========================
   DATE HELPERS
========================= */

export function toISODate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

export function formatDateVN(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");

  return `${dd}/${mm} - ${dayNames[date.getDay()]}`;
}

export function createDateRange(startDate, total = 8) {
  return Array.from({ length: total }, (_, index) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + index);

    return {
      iso: toISODate(d),
      label: formatDateVN(d),
      day: String(d.getDate()).padStart(2, "0"),
      month: String(d.getMonth() + 1).padStart(2, "0"),
      weekDay: dayNames[d.getDay()],
    };
  });
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
    "Rạp không tên"
  );
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
    "Phòng không tên"
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

export function getRoomTotalSeats(room) {
  return (
    room?.totalSeats ??
    room?.TotalSeats ??
    room?.capacity ??
    room?.Capacity ??
    0
  );
}

/* =========================
   MOVIE HELPERS
========================= */

export function getMovieId(movie) {
  return movie?.movieId ?? movie?.MovieId ?? movie?.id ?? movie?.Id;
}

export function getMovieTitle(movie) {
  return (
    movie?.title ??
    movie?.Title ??
    movie?.movieTitle ??
    movie?.MovieTitle ??
    movie?.name ??
    movie?.Name ??
    "Chưa có tên phim"
  );
}

export function getMovieDescription(movie) {
  return movie?.description ?? movie?.Description ?? "Chưa có mô tả.";
}

export function getMovieDuration(movie) {
  const duration =
    movie?.duration ??
    movie?.Duration ??
    movie?.durationMinutes ??
    movie?.DurationMinutes ??
    movie?.runningTime ??
    movie?.RunningTime;

  if (!duration) return "Đang cập nhật";

  if (String(duration).toLowerCase().includes("phút")) {
    return duration;
  }

  return `${duration} phút`;
}

export function getMovieDirector(movie) {
  return movie?.director ?? movie?.Director ?? "Đang cập nhật";
}

export function getMovieActors(movie) {
  return movie?.actors ?? movie?.Actors ?? "Đang cập nhật";
}

export function getMovieLanguage(movie) {
  return movie?.language ?? movie?.Language ?? "Đang cập nhật";
}

export function getMovieSubtitles(movie) {
  return movie?.subtitles ?? movie?.Subtitles ?? "Đang cập nhật";
}

export function getMovieReleaseDate(movie) {
  const value =
    movie?.releaseDate ??
    movie?.ReleaseDate ??
    movie?.startDate ??
    movie?.StartDate;

  if (!value) return "Đang cập nhật";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).split("T")[0];
  }

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  return `${dd}/${mm}/${yyyy}`;
}

export function getMoviePoster(movie) {
  const poster =
    movie?.posterUrl ??
    movie?.PosterUrl ??
    movie?.posterURL ??
    movie?.PosterURL ??
    movie?.imageUrl ??
    movie?.ImageUrl ??
    movie?.image ??
    movie?.Image ??
    "";

  if (!poster) return "/img/no-image.png";

  if (poster.startsWith("http://") || poster.startsWith("https://")) {
    return poster;
  }

  if (poster.startsWith("/")) {
    return poster;
  }

  return `/img/${poster}`;
}

export function convertYoutubeToEmbed(url) {
  if (!url) return "";

  if (url.includes("youtube.com/embed/")) {
    return url;
  }

  if (url.includes("youtube.com/watch?v=")) {
    const videoId = url.split("watch?v=")[1]?.split("&")[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  }

  if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1]?.split("?")[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  }

  return url;
}

export function getMovieTrailer(movie) {
  const trailer =
    movie?.trailerUrl ??
    movie?.TrailerUrl ??
    movie?.trailerURL ??
    movie?.TrailerURL ??
    movie?.trailer ??
    movie?.Trailer ??
    "";

  return convertYoutubeToEmbed(trailer);
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

export function getShowtimeMovieId(showtime) {
  return (
    showtime?.movieId ??
    showtime?.MovieId ??
    showtime?.movie?.movieId ??
    showtime?.movie?.MovieId ??
    showtime?.Movie?.movieId ??
    showtime?.Movie?.MovieId
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

export function getStartDateTime(showtime) {
  return showtime?.startTime ?? showtime?.StartTime ?? "";
}

export function getEndDateTime(showtime) {
  return showtime?.endTime ?? showtime?.EndTime ?? "";
}

export function getShowDate(showtime) {
  const showDate = showtime?.showDate ?? showtime?.ShowDate;

  if (showDate) {
    return String(showDate).split("T")[0];
  }

  const startTime = getStartDateTime(showtime);

  if (!startTime) return "";

  return String(startTime).split("T")[0];
}

export function getStartHour(showtime) {
  const startTime = getStartDateTime(showtime);
  const showDate = showtime?.showDate ?? showtime?.ShowDate;

  if (!startTime) return "";

  // Nếu API trả StartTime dạng 2026-06-25T14:00:00
  if (String(startTime).includes("T")) {
    return String(startTime).split("T")[1]?.slice(0, 5) || "";
  }

  // Nếu API trả startTime dạng 14:00
  if (showDate) {
    return String(startTime).slice(0, 5);
  }

  return String(startTime).slice(0, 5);
}

export function getEndHour(showtime) {
  const endTime = getEndDateTime(showtime);

  if (!endTime) return "";

  if (String(endTime).includes("T")) {
    return String(endTime).split("T")[1]?.slice(0, 5) || "";
  }

  return String(endTime).slice(0, 5);
}

export function getBasePrice(showtime) {
  return (
    showtime?.basePrice ??
    showtime?.BasePrice ??
    showtime?.price ??
    showtime?.Price ??
    0
  );
}

export function getShowtimeStatus(showtime) {
  const status = showtime?.status ?? showtime?.Status ?? "Chưa mở bán";

  if (status === "Active") return "Đang bán";
  if (status === "Inactive") return "Hủy";

  return status;
}

export function isBookable(status) {
  return status === "Đang bán" || status === "Đang chiếu";
}

/* =========================
   MAP DATA
========================= */

export function findRoomByShowtime(showtime, rooms) {
  const roomId = getShowtimeRoomId(showtime);

  return rooms.find((room) => String(getRoomId(room)) === String(roomId));
}

export function findMovieByShowtime(showtime, movies) {
  const movieId = getShowtimeMovieId(showtime);

  return movies.find((movie) => String(getMovieId(movie)) === String(movieId));
}

export function filterShowtimesByCinemaAndDate({
  showtimes,
  rooms,
  selectedDate,
  selectedCinemaId,
}) {
  return showtimes.filter((showtime) => {
    const showDate = getShowDate(showtime);
    const status = getShowtimeStatus(showtime);
    const room = findRoomByShowtime(showtime, rooms);

    const matchDate = showDate === selectedDate;

    const matchCinema = selectedCinemaId
      ? String(getRoomCinemaId(room)) === String(selectedCinemaId)
      : true;

    const notCanceled = status !== "Hủy";

    return matchDate && matchCinema && notCanceled;
  });
}

export function groupShowtimesByMovie({ movies, showtimes }) {
  return movies
    .map((movie) => {
      const movieId = getMovieId(movie);

      const movieShowtimes = showtimes
        .filter(
          (showtime) =>
            String(getShowtimeMovieId(showtime)) === String(movieId)
        )
        .sort((a, b) => getStartHour(a).localeCompare(getStartHour(b)));

      return {
        movie,
        showtimes: movieShowtimes,
      };
    })
    .filter((group) => group.showtimes.length > 0);
}