import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import {
  getCinemas,
  getRooms,
  getMovieById,
  getShowtimesByMovie,
  getSeatsByRoomId,
  getAvailableSeats,
  createBooking,
  holdSeat,
  releaseSeat,
  getCombos,
} from "./bookingService.js";

/* =========================
   LOCAL USER
========================= */

export function safeParseJson(value, fallback = {}) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function getSavedUser() {
  const user = safeParseJson(localStorage.getItem("user"), null);
  const currentUser = safeParseJson(localStorage.getItem("currentUser"), null);

  return user || currentUser || {};
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
   BOOKING STATE
   Hỗ trợ:
   1. navigate state
   2. sessionStorage
   3. query params cũ
========================= */

export function getBookingStateFromLocation(location) {
  const stateData = location?.state || {};
  const sessionData = safeParseJson(sessionStorage.getItem("bookingState"), {});

  return {
    ...sessionData,
    ...stateData,
  };
}

export function saveBookingState(state) {
  sessionStorage.setItem("bookingState", JSON.stringify(state));
}

/* =========================
   BOOKING DATE
========================= */

export function createBookingDates(totalDays = 7) {
  const days = [];

  for (let i = 0; i < totalDays; i += 1) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const iso = `${year}-${month}-${day}`;

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
   API WRAPPER
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
      (showtime) => String(getShowtimeId(showtime)) === String(showtimeParam)
    );
  }

  if (!initialShowtime) {
    initialShowtime = showtimes[0] || null;
  }

  let selectedCinemaId = "";
  let selectedDateIso = dates?.[0]?.iso || "";

  if (initialShowtime) {
    const room = rooms.find(
      (item) =>
        String(getRoomId(item)) === String(getShowtimeRoomId(initialShowtime))
    );

    if (room) {
      selectedCinemaId = String(getRoomCinemaId(room));
    }

    const showtimeDate = getShowtimeDate(initialShowtime);

    if (showtimeDate) {
      selectedDateIso = showtimeDate;
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

export function getMovieId(movie) {
  return movie?.movieId ?? movie?.MovieId ?? movie?.id ?? movie?.Id ?? "";
}

export function getMovieTitle(movie) {
  return (
    movie?.title ||
    movie?.Title ||
    movie?.movieTitle ||
    movie?.MovieTitle ||
    ""
  );
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
    room?.cinema?.cinemaId ??
    room?.cinema?.CinemaId ??
    room?.Cinema?.cinemaId ??
    room?.Cinema?.CinemaId ??
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
    showtime?.room?.RoomId ??
    showtime?.Room?.roomId ??
    showtime?.Room?.RoomId ??
    ""
  );
}

export function getShowtimeDate(showtime) {
  const startTimeVal = showtime?.startTime || showtime?.StartTime;
  const validStartTimeAsDate = (typeof startTimeVal === "string" && startTimeVal.includes("-")) ? startTimeVal : null;

  const rawDate =
    showtime?.showDate ||
    showtime?.ShowDate ||
    showtime?.date ||
    showtime?.Date ||
    validStartTimeAsDate ||
    showtime?.showtimeDate ||
    showtime?.ShowtimeDate;

  if (!rawDate) return "";

  const d = new Date(rawDate);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

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
    showtime?.basePrice ||
    showtime?.BasePrice ||
    showtime?.ticketPrice ||
    showtime?.TicketPrice ||
    showtime?.price ||
    showtime?.Price ||
    70000
  );
}

export function filterShowtimesForBooking({
  showtimes,
  rooms,
  selectedDateIso,
  selectedCinemaId,
}) {
  const now = new Date();

  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const todayStr = vnTime.toISOString().split("T")[0];

  const currentHour = String(now.getHours()).padStart(2, "0");
  const currentMin = String(now.getMinutes()).padStart(2, "0");
  const currentTimeStr = `${currentHour}:${currentMin}`;

  return showtimes.filter((showtime) => {
    const showtimeDate = getShowtimeDate(showtime);
    const room = findRoomByShowtime(showtime, rooms);

    const sameDate = !selectedDateIso || showtimeDate === selectedDateIso;

    const sameCinema =
      !selectedCinemaId ||
      (room && String(getRoomCinemaId(room)) === String(selectedCinemaId));

    if (!sameDate || !sameCinema) return false;

    if (showtimeDate === todayStr) {
      const showtimeHour = getShowtimeHour(showtime);

      return showtimeHour >= currentTimeStr;
    }

    return true;
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
  let row = seat?.seatRow || seat?.SeatRow || seat?.row || seat?.Row || "";
  if (!row) {
    const rawNum = String(
      seat?.seatNumber || seat?.SeatNumber || seat?.number || seat?.Number || ""
    );
    const match = rawNum.match(/^[A-Za-z]+/);
    if (match) row = match[0].toUpperCase();
  }
  return row;
}

export function getSeatNumber(seat) {
  const raw = String(
    seat?.seatNumber ||
    seat?.SeatNumber ||
    seat?.number ||
    seat?.Number ||
    ""
  );
  // Extract only digits
  const match = raw.match(/\d+/);
  return match ? match[0] : raw;
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

export function getSeatPrice(seat, selectedShowtime, rooms = []) {
  const explicitPrice = Number(seat?.price ?? seat?.Price);
  if (!isNaN(explicitPrice) && explicitPrice > 0) {
    return explicitPrice;
  }

  const basePrice = Number(getShowtimeBasePrice(selectedShowtime));

  const roomId = getShowtimeRoomId(selectedShowtime);
  
  // 1. Try to find the room in rooms array
  let room = Array.isArray(rooms) ? rooms.find((r) => String(getRoomId(r)) === String(roomId)) : null;
  
  // 2. Try to fallback to nested room on selectedShowtime
  if (!room && selectedShowtime) {
    room = selectedShowtime.room || selectedShowtime.Room;
  }

  const type = String(getSeatType(seat)).toLowerCase();
  const isVip = type.includes("vip");
  const isCouple = type.includes("sweetbox") || type.includes("couple") || type.includes("đôi");

  let finalPrice = null;

  // We can get cinemaId and roomName either from the resolved room, or directly from the showtime!
  let cId = "";
  let rName = "";

  if (room) {
    cId = getRoomCinemaId(room);
    rName = getRoomName(room);
  }

  // Fallback to showtime direct attributes if room properties weren't fully resolved
  if (!cId && selectedShowtime) {
    cId = selectedShowtime.cinemaId ??
          selectedShowtime.CinemaId ??
          selectedShowtime.room?.cinemaId ??
          selectedShowtime.room?.CinemaId ??
          selectedShowtime.Room?.cinemaId ??
          selectedShowtime.Room?.CinemaId ??
          selectedShowtime.room?.cinema?.cinemaId ??
          selectedShowtime.Room?.Cinema?.CinemaId ??
          "";
  }

  if (!rName && selectedShowtime) {
    rName = selectedShowtime.roomName ??
            selectedShowtime.RoomName ??
            selectedShowtime.room?.roomName ??
            selectedShowtime.Room?.roomName ??
            selectedShowtime.room?.RoomName ??
            selectedShowtime.Room?.RoomName ??
            "";
  }

  let isWeekend = false;
  const dateStr = getShowtimeDate(selectedShowtime);
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = d.getDay();
      isWeekend = day === 0 || day === 6;
    }
  }

  if (cId && rName) {
    let priceKey = "";
    if (isCouple) {
      priceKey = isWeekend ? `room_price_cp_we_c${cId}_r${rName}` : `room_price_cp_wd_c${cId}_r${rName}`;
    } else if (isVip) {
      priceKey = isWeekend ? `room_price_vip_we_c${cId}_r${rName}` : `room_price_vip_wd_c${cId}_r${rName}`;
    } else {
      priceKey = isWeekend ? `room_price_std_we_c${cId}_r${rName}` : `room_price_std_wd_c${cId}_r${rName}`;
    }

    const storedPriceStr = localStorage.getItem(priceKey);
    if (storedPriceStr) {
      const cleaned = storedPriceStr.replace(/\./g, "").trim();
      const parsed = Number(cleaned);
      if (!isNaN(parsed) && parsed > 0) {
        finalPrice = isCouple ? parsed / 2 : parsed;
      }
    }
  }

  if (finalPrice === null) {
    if (isCouple) {
      return isWeekend ? 80000 : 65000;
    }
    if (isVip) {
      return isWeekend ? 120000 : 90000;
    }
    return isWeekend ? 90000 : 70000;
  }

  return finalPrice;
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

export function buildBookingPayload({
  userId,
  showtimeId,
  seat,
  selectedShowtime,
  selectedCombos = [],
  rooms = [],
}) {
  const payload = {
    userId: Number(userId),
    showtimeId: Number(showtimeId),
    seatId: Number(getSeatId(seat)),
    seatIds: [Number(getSeatId(seat))],
    SeatIds: [Number(getSeatId(seat))],
    totalPrice: Number(getSeatPrice(seat, selectedShowtime, rooms)),
    status: "Pending",
    paymentStatus: "Pending",
  };

  if (selectedCombos.length > 0) {
    const list = selectedCombos.map((combo) => {
      // Phân biệt rõ Food vs Combo, chỉ gửi 1 trong 2 để tránh lỗi 400 "FoodOrComboNotBoth"
      const id = Number(combo._resolvedId ?? combo.comboId ?? combo.foodId ?? combo.id);
      if (combo._isCombo) {
        return { comboId: id, quantity: Number(combo.quantity) };
      }
      return { foodId: id, quantity: Number(combo.quantity) };
    });

    payload.orderItems = list; // khớp với BookingCreateRequest.OrderItems
    payload.bookingFoods = list;
    payload.foods = list;
    payload.bookingCombos = list;
    payload.combos = list;
  }

  return payload;
}

/* =========================
   ROBUST BOOKING ID EXTRACTOR
========================= */

export function extractBookingId(data) {
  if (data === null || data === undefined) return null;
  
  if (typeof data === "number") return data;
  if (typeof data === "string" && !isNaN(Number(data)) && data.trim() !== "") {
    return Number(data);
  }
  
  if (Array.isArray(data)) {
    return data.length > 0 ? extractBookingId(data[0]) : null;
  }
  if (Array.isArray(data?.$values)) {
    return data.$values.length > 0 ? extractBookingId(data.$values[0]) : null;
  }
  if (Array.isArray(data?.data)) {
    return data.data.length > 0 ? extractBookingId(data.data[0]) : null;
  }
  
  if (data?.value !== null && data?.value !== undefined) {
    return extractBookingId(data.value);
  }
  
  // Handle bookingIds (plural) - array of IDs returned by API
  if (Array.isArray(data?.bookingIds) && data.bookingIds.length > 0) {
    return extractBookingId(data.bookingIds[0]);
  }
  if (Array.isArray(data?.BookingIds) && data.BookingIds.length > 0) {
    return extractBookingId(data.BookingIds[0]);
  }
  
  const idVal =
    data?.bookingId ??
    data?.BookingId ??
    data?.bookingID ??
    data?.BookingID ??
    data?.id ??
    data?.Id ??
    data?.booking?.bookingId ??
    data?.booking?.BookingId ??
    data?.booking?.bookingID ??
    data?.booking?.BookingID ??
    data?.booking?.id ??
    data?.booking?.Id;
    
  if (idVal !== null && idVal !== undefined) {
    return extractBookingId(idVal);
  }
  
  return null;
}

/* =========================
   USE BOOKING HOOK
========================= */

export function useBooking() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const bookingState = getBookingStateFromLocation(location);

  const queryMovie = searchParams.get("movie");
  const queryShowtimeId = searchParams.get("showtimeId");
  const queryTime = searchParams.get("time");

  const movieParam =
    queryMovie ||
    bookingState.movieId ||
    bookingState.movie ||
    bookingState.MovieId ||
    bookingState.MovieID ||
    "";

  const showtimeParam =
    queryShowtimeId ||
    bookingState.showtimeId ||
    bookingState.showTimeId ||
    bookingState.ShowtimeId ||
    bookingState.ShowTimeId ||
    "";

  const timeParam =
    queryTime ||
    bookingState.time ||
    bookingState.showTime ||
    bookingState.ShowTime ||
    "";

  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [selectedCinemaId, setSelectedCinemaId] = useState("");
  const [selectedDateIso, setSelectedDateIso] = useState("");
  const [selectedShowtime, setSelectedShowtime] = useState(null);

  const [allSeats, setAllSeats] = useState([]);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [showComboModal, setShowComboModal] = useState(false);
  const [combos, setCombos] = useState([]);
  const [comboQuantities, setComboQuantities] = useState({});

  const savedUser = getSavedUser();
  const userEmail = getUserEmail();

  const dates = useMemo(() => createBookingDates(7), []);

  const [timeLeft, setTimeLeft] = useState(300);
  const [isHoldActive, setIsHoldActive] = useState(false);
  const holdKeysRef = useRef({});

  useEffect(() => {
    if (queryMovie || queryShowtimeId || queryTime) {
      const nextBookingState = {
        movieId: movieParam,
        showtimeId: showtimeParam,
        time: timeParam,
      };

      saveBookingState(nextBookingState);

      navigate("/booking", {
        replace: true,
        state: nextBookingState,
      });
    }
  }, [
    queryMovie,
    queryShowtimeId,
    queryTime,
    movieParam,
    showtimeParam,
    timeParam,
    navigate,
  ]);

  useEffect(() => {
    if (selectedSeats.length === 0) {
      setIsHoldActive(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);

          const keys = Object.values(holdKeysRef.current);

          Promise.all(
            keys.map((key) =>
              releaseSeat(key).catch((err) => console.error(err))
            )
          ).finally(() => {
            holdKeysRef.current = {};
            setSelectedSeats([]);
            setIsHoldActive(false);
            alert(
              "Thời gian giữ ghế đã hết hạn. Các ghế bạn chọn đã được giải phóng!"
            );
          });

          return 300;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedSeats.length]);

  useEffect(() => {
    return () => {
      const keys = Object.values(holdKeysRef.current);

      if (keys.length > 0) {
        keys.forEach((key) =>
          releaseSeat(key).catch((err) => console.error(err))
        );
      }
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Vui lòng đăng nhập tài khoản của bạn để tiến hành đặt vé!");
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    async function loadCombos() {
      try {
        const data = await getCombos();

        const normalized = data.map((item, index) => {
          const rawComboId = item?.comboId ?? item?.ComboId ?? null;
          const rawFoodId = item?.foodId ?? item?.FoodId ?? null;
          const isCombo = rawComboId !== null && rawFoodId === null;
          const baseId = rawComboId ?? rawFoodId ?? item?.id ?? item?.Id ?? index;
          
          // Tránh trùng React key (ví dụ Combo ID 6 và Food ID 6)
          const uniqueId = isCombo ? `combo-${baseId}` : `food-${baseId}`;

          const name =
            item?.foodName ??
            item?.FoodName ??
            item?.name ??
            item?.Name ??
            item?.comboName ??
            item?.ComboName ??
            "Đồ ăn kèm";

          const price =
            item?.price ?? item?.Price ?? item?.unitPrice ?? item?.UnitPrice ?? 0;

          const description = item?.description ?? item?.Description ?? "";

          const image =
            item?.image ||
            item?.Image ||
            item?.imageUrl ||
            item?.ImageUrl ||
            "";

          return {
            id: uniqueId,
            _resolvedId: baseId,
            _isCombo: isCombo,
            comboId: isCombo ? baseId : null,
            foodId: !isCombo ? baseId : null,
            name,
            price,
            description,
            image,
          };
        });

        setCombos(normalized);
      } catch (err) {
        console.error("Không tải được danh sách combo:", err);
        setCombos([]);
      }
    }

    loadCombos();
  }, []);

  useEffect(() => {
    async function init() {
      if (!movieParam) {
        setLoading(false);
        setMovie(null);
        setBookingError(
          "Không tìm thấy thông tin phim. Vui lòng quay lại trang phim và chọn suất chiếu lại."
        );
        return;
      }

      setLoading(true);
      setBookingError("");

      try {
        const data = await loadBookingInitialData({
          movieParam,
          showtimeParam,
          dates,
        });

        setCinemas(data.cinemas);
        setRooms(data.rooms);
        setMovie(data.movie);
        setShowtimes(data.showtimes);

        setSelectedShowtime(data.selectedShowtime);
        setSelectedCinemaId(data.selectedCinemaId);
        setSelectedDateIso(data.selectedDateIso);
      } catch (err) {
        console.error("Lỗi khi tải thông tin đặt vé:", err);

        setMovie(null);
        setShowtimes([]);
        setCinemas([]);
        setRooms([]);
        setBookingError(
          err?.message || "Lỗi khi tải thông tin đặt vé. Vui lòng thử lại."
        );
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [movieParam, showtimeParam, dates]);

  useEffect(() => {
    if (!selectedShowtime) {
      setAllSeats([]);
      setAvailableSeats([]);
      setSelectedSeats([]);
      return;
    }

    async function fetchSeatsForShowtime() {
      setLoadingSeats(true);
      setSelectedSeats([]);
      setBookingError("");

      try {
        const data = await loadBookingSeatsData(selectedShowtime);

        setAllSeats(data.seats);
        setAvailableSeats(data.availableSeats);
      } catch (err) {
        console.error("Lỗi tải thông tin ghế ngồi:", err);

        setAllSeats([]);
        setAvailableSeats([]);
      } finally {
        setLoadingSeats(false);
      }
    }

    fetchSeatsForShowtime();
  }, [selectedShowtime]);

  const filteredShowtimes = filterShowtimesForBooking({
    showtimes,
    rooms,
    selectedDateIso,
    selectedCinemaId,
  });

  function handleCinemaChange(cinemaId) {
    setSelectedCinemaId(cinemaId);
    setSelectedSeats([]);

    const found = findFirstShowtime({
      showtimes,
      rooms,
      selectedDateIso,
      selectedCinemaId: cinemaId,
    });

    setSelectedShowtime(found);
  }

  function handleDateChange(dateIso) {
    setSelectedDateIso(dateIso);
    setSelectedSeats([]);

    const found = findFirstShowtime({
      showtimes,
      rooms,
      selectedDateIso: dateIso,
      selectedCinemaId,
    });

    if (found) {
      setSelectedShowtime(found);

      const room = findRoomByShowtime(found, rooms);

      if (room) {
        setSelectedCinemaId(String(getRoomCinemaId(room)));
      }
    } else {
      setSelectedShowtime(null);
    }
  }

  function handleShowtimeClick(showtime) {
    setSelectedShowtime(showtime);
    setSelectedSeats([]);

    const room = findRoomByShowtime(showtime, rooms);

    if (room) {
      setSelectedCinemaId(String(getRoomCinemaId(room)));
    }
  }

  async function handleSeatClick(seat) {
    const available = isSeatAvailable(seat, availableSeats);

    if (!available) return;

    const seatId = getSeatId(seat);
    const showtimeId = getShowtimeId(selectedShowtime);

    const isSelected = selectedSeats.some(
      (selectedSeat) => String(getSeatId(selectedSeat)) === String(seatId)
    );

    if (isSelected) {
      try {
        const holdKey = holdKeysRef.current[seatId];

        if (holdKey) {
          await releaseSeat(holdKey);
          delete holdKeysRef.current[seatId];
        }

        setSelectedSeats((prev) =>
          prev.filter(
            (selectedSeat) => String(getSeatId(selectedSeat)) !== String(seatId)
          )
        );
      } catch (err) {
        console.error("Lỗi giải phóng ghế:", err);
      }
    } else {
      try {
        setLoadingSeats(true);

        const data = await holdSeat(showtimeId, seatId);

        const holdKey = data?.holdKey || data?.HoldKey || data;

        if (holdKey) {
          holdKeysRef.current[seatId] = holdKey;
        }

        setSelectedSeats((prev) => [...prev, seat]);
        setTimeLeft(300);
        setIsHoldActive(true);
      } catch (err) {
        console.error("Lỗi giữ ghế:", err);
        alert("Ghế này đã được người khác giữ hoặc đặt mua!");
      } finally {
        setLoadingSeats(false);
      }
    }
  }

  const updateComboQuantity = (comboId, delta) => {
    setComboQuantities((prev) => {
      const currentQuantity = prev[comboId] || 0;
      const nextQuantity = Math.max(0, currentQuantity + delta);

      return {
        ...prev,
        [comboId]: nextQuantity,
      };
    });
  };

  const selectedCombos = useMemo(() => {
    return combos
      .map((combo) => {
        const name =
          combo.name ??
          combo.Name ??
          combo.foodName ??
          combo.FoodName ??
          combo.comboName ??
          combo.ComboName ??
          "Combo";

        return {
          ...combo,
          name,
          quantity: comboQuantities[combo.id] || 0,
        };
      })
      .filter((combo) => combo.quantity > 0);
  }, [combos, comboQuantities]);

  const totalAmount = useMemo(() => {
    return selectedSeats.reduce(
      (sum, seat) => sum + getSeatPrice(seat, selectedShowtime, rooms),
      0
    );
  }, [selectedSeats, selectedShowtime, rooms]);

  const totalCombosAmount = useMemo(() => {
    return selectedCombos.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );
  }, [selectedCombos]);

  const finalTotalAmount = useMemo(() => {
    return totalAmount + totalCombosAmount;
  }, [totalAmount, totalCombosAmount]);

  const groupedSeats = groupSeatsByRow(allSeats);
  const rowsKeys = Object.keys(groupedSeats).sort();

  function handleCheckout() {
    if (!userEmail) {
      alert("Vui lòng đăng nhập trước khi tiến hành thanh toán!");
      navigate("/login");
      return;
    }

    if (!selectedShowtime) {
      alert("Vui lòng chọn suất chiếu hợp lệ!");
      return;
    }

    if (selectedSeats.length === 0) {
      alert("Vui lòng chọn ít nhất một ghế!");
      return;
    }

    setShowComboModal(true);
  }

  async function handleConfirmBooking() {
    const showtimeId = getShowtimeId(selectedShowtime);

    const userId =
      savedUser.userId ??
      savedUser.id ??
      savedUser.UserId ??
      savedUser.Id;

    if (!userId) {
      alert("Không tìm thấy thông tin tài khoản của bạn. Vui lòng đăng nhập lại!");
      navigate("/login");
      return;
    }

    setLoadingSeats(true);
    setBookingError("");
    setShowComboModal(false);

    try {
      const bookingResults = await Promise.all(
        selectedSeats.map(async (seat, index) => {
          const combosForPayload = index === 0 ? selectedCombos : [];
          const extraPrice = index === 0 ? totalCombosAmount : 0;

          const payload = buildBookingPayload({
            userId,
            showtimeId,
            seat,
            selectedShowtime,
            selectedCombos: combosForPayload,
            rooms,
          });

          payload.totalPrice = Number(payload.totalPrice) + Number(extraPrice);

          const data = await createBooking(payload);
          console.log("CREATE BOOKING RESPONSE FOR SEAT:", seat, data);
          console.log("DEBUG RESPONSE STRING:", JSON.stringify(data));
          return data;
        })
      );

      const bookedIds = bookingResults.map((data) => {
        const id = extractBookingId(data);
        if (id === null || isNaN(Number(id))) {
          console.error("Không trích xuất được bookingId từ phản hồi API:", JSON.stringify(data));
        }
        return id;
      }).filter(id => id !== null && !isNaN(Number(id))).map(Number);

      if (bookedIds.length === 0) {
        throw new Error("Đặt vé thất bại: Không nhận được mã đặt vé hợp lệ từ máy chủ.");
      }


      // Giải phóng thông tin giữ ghế cục bộ
      holdKeysRef.current = {};
      setIsHoldActive(false);
      
      // Navigate to separate payment page
      navigate("/payment", {
        state: {
          bookingIds: bookedIds.map(Number),
          totalAmount: finalTotalAmount,
          movie,
          selectedCinemaId,
          selectedDateIso,
          selectedShowtime,
          selectedSeats,
          selectedCombos,
          rooms,
          cinemas,
        },
      });
    } catch (err) {
      console.error("Đặt vé thất bại:", err);

      setBookingError(err.message || "Đặt vé thất bại. Vui lòng thử lại!");
      alert(err.message || "Đặt vé thất bại. Vui lòng thử lại!");
    } finally {
      setLoadingSeats(false);
    }
  }

  return {
    movie,
    showtimes,
    cinemas,
    rooms,
    selectedCinemaId,
    selectedDateIso,
    selectedShowtime,
    allSeats,
    availableSeats,
    selectedSeats,
    loading,
    loadingSeats,
    bookingError,
    savedUser,
    userEmail,
    dates,
    filteredShowtimes,
    handleCinemaChange,
    handleDateChange,
    handleShowtimeClick,
    handleSeatClick,
    totalAmount,
    rowsKeys,
    groupedSeats,
    handleCheckout,
    timeLeft,
    isHoldActive,

    // Combo states
    showComboModal,
    setShowComboModal,
    combos,
    comboQuantities,
    selectedCombos,
    totalCombosAmount,
    finalTotalAmount,
    updateComboQuantity,
    handleConfirmBooking,
  };
}