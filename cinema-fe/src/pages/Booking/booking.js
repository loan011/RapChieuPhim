import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import {
  getCinemas,
  getRooms,
  getMovieById,
  getShowtimesByMovie,
  getSeatsByRoomId,
  getAvailableSeats,
  createBooking,
} from "./bookingService.js";

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

export function useBooking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const movieParam = searchParams.get("movie");
  const showtimeParam = searchParams.get("showtimeId");

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
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [newTicketIds, setNewTicketIds] = useState([]);

  const savedUser = getSavedUser();
  const userEmail = getUserEmail();

  const dates = useMemo(() => createBookingDates(7), []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Vui lòng đăng nhập tài khoản của bạn để tiến hành đặt vé!");
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (!movieParam) return;

    async function init() {
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

  function handleSeatClick(seat) {
    const available = isSeatAvailable(seat, availableSeats);

    if (!available) return;

    setSelectedSeats((prev) => {
      const exists = prev.some(
        (s) => String(getSeatId(s)) === String(getSeatId(seat))
      );

      if (exists) {
        return prev.filter(
          (s) => String(getSeatId(s)) !== String(getSeatId(seat))
        );
      }

      return [...prev, seat];
    });
  }

  const totalAmount = selectedSeats.reduce(
    (sum, seat) => sum + getSeatPrice(seat, selectedShowtime),
    0
  );

  const groupedSeats = groupSeatsByRow(allSeats);
  const rowsKeys = Object.keys(groupedSeats).sort();

  async function handleCheckout() {
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

    try {
      const bookingPromises = selectedSeats.map(async (seat) => {
        const payload = buildBookingPayload({
          userId,
          showtimeId,
          seat,
          selectedShowtime,
        });

        const data = await createBooking(payload);

        return (
          data?.bookingId ??
          data?.BookingId ??
          data?.id ??
          data?.Id ??
          `BK${Math.floor(Math.random() * 90000)}`
        );
      });

      const bookedIds = await Promise.all(bookingPromises);

      setNewTicketIds(bookedIds);
      setShowPaymentSuccess(true);
    } catch (err) {
      console.error("Đặt vé thất bại:", err);

      setBookingError(err.message || "Đặt vé thất bại. Vui lòng thử lại!");
      alert(err.message || "Đặt vé thất bại. Vui lòng thử lại!");
    } finally {
      setLoadingSeats(false);
    }
  }

  function handleFinishBooking() {
    setShowPaymentSuccess(false);
    navigate("/customer/ve-cua-toi");
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
    showPaymentSuccess,
    newTicketIds,
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
    handleFinishBooking,
  };
}