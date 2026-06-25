import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("userEmail");

    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }

    throw new Error("Phiên đăng nhập đã hết hạn.");
  }

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

export async function getHomeAreas() {
  return fetchApi("/Areas");
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
   AREA HELPERS
========================= */

export function getAreaId(area) {
  return area?.areaId ?? area?.AreaId ?? area?.id ?? area?.Id;
}

export function getAreaName(area) {
  return (
    area?.areaName ??
    area?.AreaName ??
    area?.name ??
    area?.Name ??
    "Khu vực không tên"
  );
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

export function getCinemaAreaId(cinema) {
  return (
    cinema?.areaId ??
    cinema?.AreaId ??
    cinema?.area?.areaId ??
    cinema?.area?.AreaId ??
    cinema?.Area?.areaId ??
    cinema?.Area?.AreaId
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

  if (String(startTime).includes("T")) {
    return String(startTime).split("T")[1]?.slice(0, 5) || "";
  }

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

export function findRoomByShowtime(showtime, rooms = []) {
  const roomId = getShowtimeRoomId(showtime);

  return rooms.find((room) => String(getRoomId(room)) === String(roomId));
}

export function findMovieByShowtime(showtime, movies = []) {
  const movieId = getShowtimeMovieId(showtime);

  return movies.find((movie) => String(getMovieId(movie)) === String(movieId));
}

export function findCinemaByRoom(room, cinemas = []) {
  const cinemaId = getRoomCinemaId(room);

  return cinemas.find(
    (cinema) => String(getCinemaId(cinema)) === String(cinemaId)
  );
}

export function filterShowtimesByCinemaAndDate({
  showtimes = [],
  rooms = [],
  selectedDate = "",
  selectedCinemaId = "",
  selectedAreaId = "",
  cinemas = [],
}) {
  const now = new Date();

  return showtimes.filter((showtime) => {
    const showDate = getShowDate(showtime);
    const status = getShowtimeStatus(showtime);

    const matchDate = selectedDate ? showDate === selectedDate : true;

    const room = findRoomByShowtime(showtime, rooms);

    if (!room) return false;

    const cinema = findCinemaByRoom(room, cinemas);

    if (!cinema) return false;

    const roomCinemaId = getRoomCinemaId(room);
    const cinemaAreaId = getCinemaAreaId(cinema);

    const matchCinema = selectedCinemaId
      ? String(roomCinemaId) === String(selectedCinemaId)
      : true;

    const matchArea = selectedAreaId
      ? String(cinemaAreaId) === String(selectedAreaId)
      : true;

    const notCanceled = status !== "Hủy";

    const startTimeStr = getStartDateTime(showtime);
    const notPast = startTimeStr ? new Date(startTimeStr) >= now : true;

    return matchDate && matchCinema && matchArea && notCanceled && notPast;
  });
}

/* =========================
   GROUP SHOWTIMES BY MOVIE
========================= */

export function groupShowtimesByMovie({ movies = [], showtimes = [] }) {
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

/* =========================
   TEXT / STATE CONTAINER
========================= */

export const HOME_TEXT = {
  logo: "Cinemas HCM",

  routes: {
    home: "/",
    login: "/login",
    register: "/register",
    movies: "/movies",
    cinema: "/cinema",
    ticketPrice: "/ticket-price",
    booking: "/booking",
  },

  anchors: {
    news: "#news",
    franchise: "#franchise",
    member: "#member",
  },

  auth: {
    login: "Đăng nhập",
    register: "Đăng ký",
    language: "GB",
  },

  nav: {
    movies: "PHIM",
    showtimesByCinema: "LỊCH CHIẾU THEO RẠP",
    cinema: "RẠP",
    ticketPrice: "GIÁ VÉ",
    news: "TIN MỚI VÀ ƯU ĐÃI",
    franchise: "NHƯỢNG QUYỀN",
    member: "THÀNH VIÊN",
  },

  select: {
    allAreas: "Tất cả khu vực",
    allCinemas: "Tất cả rạp",
  },

  calendar: {
    previous: "‹",
    next: "›",
  },

  loading: {
    showtimes: "Đang tải lịch chiếu...",
  },

  empty: {
    noShowtimes: "Ngày này chưa có lịch chiếu phim.",
  },

  buttons: {
    detail: "Chi tiết",
    hideDetail: "Ẩn chi tiết",
    trailer: "Trailer",
    buyTicket: "Mua vé",
  },

  detail: {
    director: "Đạo diễn:",
    actors: "Diễn viên:",
    duration: "Thời lượng:",
    language: "Ngôn ngữ:",
    subtitles: "Phụ đề:",
    releaseDate: "Ngày khởi chiếu:",
  },

  movieFormat: {
    dubbed: "2D LỒNG TIẾNG",
    subtitled: "2D PHỤ ĐỀ",
  },

  trailer: {
    heading: "TRAILER",
    titlePrefix: "Trailer",
    close: "×",
    noTrailer: "Phim này chưa có trailer.",
  },

  fallback: {
    poster: "/img/no-image.png",
  },

  messages: {
    allCinemaSchedule: "Lịch chiếu theo rạp",
    cinemaSchedulePrefix: "Lịch chiếu tại",
    areaSchedulePrefix: "Lịch chiếu khu vực",
    loadShowtimeError: "Lỗi tải lịch chiếu:",
  },
};

export function getSavedHomeUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

export function getHomeUserEmail() {
  const savedUser = getSavedHomeUser();

  return (
    localStorage.getItem("userEmail") ||
    localStorage.getItem("email") ||
    savedUser.email ||
    savedUser.Email ||
    ""
  );
}

export async function loadHomeInitialData() {
  const [movieData, showtimeData, roomData, cinemaData, areaData] =
    await Promise.all([
      getHomeMovies(),
      getHomeShowtimes(),
      getHomeRooms(),
      getHomeCinemas(),
      getHomeAreas(),
    ]);

  return {
    movies: Array.isArray(movieData) ? movieData : [],
    showtimes: Array.isArray(showtimeData) ? showtimeData : [],
    rooms: Array.isArray(roomData) ? roomData : [],
    cinemas: Array.isArray(cinemaData) ? cinemaData : [],
    areas: Array.isArray(areaData) ? areaData : [],
  };
}

export function useHome() {
  const navigate = useNavigate();
  const T = HOME_TEXT;

  const [startDate, setStartDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));

  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [areas, setAreas] = useState([]);

  const [selectedCinemaId, setSelectedCinemaId] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("");

  const [showDetail, setShowDetail] = useState({});
  const [selectedTrailer, setSelectedTrailer] = useState(null);
  const [loading, setLoading] = useState(true);

  const dates = createDateRange(startDate);
  const userEmail = getHomeUserEmail();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      const data = await loadHomeInitialData();

      console.log("HOME MOVIES:", data.movies);
      console.log("HOME SHOWTIMES:", data.showtimes);
      console.log("HOME ROOMS:", data.rooms);
      console.log("HOME CINEMAS:", data.cinemas);
      console.log("HOME AREAS:", data.areas);

      setMovies(data.movies);
      setShowtimes(data.showtimes);
      setRooms(data.rooms);
      setCinemas(data.cinemas);
      setAreas(data.areas);

      setSelectedCinemaId("");
      setSelectedAreaId("");
    } catch (error) {
      console.error(T.messages.loadShowtimeError, error);

      setMovies([]);
      setShowtimes([]);
      setRooms([]);
      setCinemas([]);
      setAreas([]);
    } finally {
      setLoading(false);
    }
  }

  function resetSelection() {
    setShowDetail({});
    setSelectedTrailer(null);
  }

  function isPreviousDateDisabled(currentStartDate) {
    return toISODate(currentStartDate) <= toISODate(new Date());
  }

  function changeDateRange(days) {
    const nextStart = new Date(startDate);
    nextStart.setDate(nextStart.getDate() + days);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (nextStart < today) {
      const now = new Date();

      setStartDate(now);
      setSelectedDate(toISODate(now));
    } else {
      setStartDate(nextStart);
      setSelectedDate(toISODate(nextStart));
    }

    resetSelection();
  }

  function handleDateClick(dateIso) {
    setSelectedDate(dateIso);
    resetSelection();
  }

  function handleAreaChange(areaId) {
    setSelectedAreaId(areaId);
    setSelectedCinemaId("");
    resetSelection();
  }

  function handleCinemaChange(cinemaId) {
    setSelectedCinemaId(cinemaId);
    resetSelection();
  }

  function toggleDetail(movieId) {
    setShowDetail((prev) => ({
      ...prev,
      [movieId]: !prev[movieId],
    }));
  }

  function handleOpenTrailer(movie) {
    setSelectedTrailer(movie);
  }

  function handleCloseTrailer() {
    setSelectedTrailer(null);
  }

  function handleSelectTime(movie, showtime) {
    const movieId = getMovieId(movie);
    const showtimeId = getShowtimeId(showtime);
    const time = getStartHour(showtime);

    navigate(
      `${T.routes.booking}?movie=${movieId}&showtimeId=${showtimeId}&time=${time}`
    );
  }

  function handleBuyTicket(movie, movieShowtimes) {
    const movieId = getMovieId(movie);

    if (movieShowtimes && movieShowtimes.length > 0) {
      handleSelectTime(movie, movieShowtimes[0]);
      return;
    }

    navigate(`${T.routes.booking}?movie=${movieId}`);
  }

  const filteredCinemas = selectedAreaId
    ? cinemas.filter((cinema) => {
        const areaId = getCinemaAreaId(cinema);
        return String(areaId) === String(selectedAreaId);
      })
    : cinemas;

  const filteredShowtimes = filterShowtimesByCinemaAndDate({
    showtimes,
    rooms,
    cinemas,
    selectedDate,
    selectedCinemaId,
    selectedAreaId,
  });

  const groupedMovies = groupShowtimesByMovie({
    movies,
    showtimes: filteredShowtimes,
  });

  const hasMovies = groupedMovies.length > 0;

  const selectedCinema = cinemas.find(
    (cinema) => String(getCinemaId(cinema)) === String(selectedCinemaId)
  );

  const selectedArea = areas.find(
    (area) => String(getAreaId(area)) === String(selectedAreaId)
  );

  const selectedMessage = selectedCinema
    ? `${T.messages.cinemaSchedulePrefix} ${getCinemaName(selectedCinema)}`
    : selectedArea
    ? `${T.messages.areaSchedulePrefix} ${getAreaName(selectedArea)}`
    : T.messages.allCinemaSchedule;

  return {
    dates,
    startDate,
    selectedDate,
    selectedCinemaId,
    selectedAreaId,

    movies,
    showtimes,
    rooms,
    cinemas,
    areas,

    filteredCinemas,
    filteredShowtimes,
    groupedMovies,
    hasMovies,

    showDetail,
    selectedTrailer,
    loading,
    userEmail,
    selectedMessage,

    fetchData,
    resetSelection,
    changeDateRange,
    handleDateClick,
    handleAreaChange,
    handleCinemaChange,
    toggleDetail,
    handleOpenTrailer,
    handleCloseTrailer,
    handleSelectTime,
    handleBuyTicket,
    isPreviousDateDisabled,
  };
}