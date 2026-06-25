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