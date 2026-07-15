import { useEffect, useState, useMemo } from "react";
import { getMovieList } from "../../Admin/Film/movieService";
import { getShowtimeDetailList, createShowtime } from "../../Admin/Rate/showtimeService";
import { getRoomList } from "../../Admin/Room/roomService";
import { getSeatsByRoomId, getAvailableSeats, createBooking } from "../../Booking/bookingService";
import { getShowtimeId, getShowtimeRoomId, getShowtimeDate, getShowtimeHour, getSeatId, getSeatPrice } from "../../Booking/booking.js";

function createStaffDateRange(pastDays = 30, futureDays = 7) {
  const days = [];
  const today = new Date();
  for (let i = -pastDays; i <= futureDays; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const iso = date.toISOString().split("T")[0];
    const label = i === 0
      ? `Hôm nay, ${date.toLocaleDateString("vi-VN")}`
      : date.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" });
    days.push({ iso, label });
  }
  return days;
}

export function useBanVe() {
  const [movies, setMovies] = useState([]);
  const [allShowtimes, setAllShowtimes] = useState([]);
  
  const dates = useMemo(() => createStaffDateRange(30, 7), []);
  const todayIso = new Date().toISOString().split("T")[0];
  const [selectedDateIso, setSelectedDateIso] = useState(todayIso);

  const staffCinemaId = useMemo(() => {
    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : {};
      const email = user.email || user.Email || "";
      
      const mappings = JSON.parse(localStorage.getItem("staff_cinema_mappings") || "{}");
      if (email && mappings[email]) {
        return mappings[email];
      }
      return user.cinemaId || user.CinemaId || null;
    } catch {
      return null;
    }
  }, []);
  
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  
  const [allSeats, setAllSeats] = useState([]);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "" });
  
  const [loading, setLoading] = useState(false);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [error, setError] = useState("");
  const [successReceipt, setSuccessReceipt] = useState(null);

  // ── Tạo suất chiếu mới ──
  const [rooms, setRooms] = useState([]);
  const [showAddShowtime, setShowAddShowtime] = useState(false);
  const [addShowtimeForm, setAddShowtimeForm] = useState({
    movieId: "", roomId: "", showDate: new Date().toISOString().split("T")[0],
    startTime: "08:00", duration: 120, basePrice: 75000,
  });
  const [addShowtimeLoading, setAddShowtimeLoading] = useState(false);
  const [addShowtimeError, setAddShowtimeError] = useState("");

  useEffect(() => {
    getRoomList().then(data => {
      const list = Array.isArray(data) ? data : data?.$values || [];
      setRooms(list);
    }).catch(() => {});
  }, []);

  async function handleAddShowtime(e) {
    e.preventDefault();
    const { movieId, roomId, showDate, startTime, duration, basePrice } = addShowtimeForm;
    if (!movieId) return setAddShowtimeError("Vui lòng chọn phim.");
    if (!roomId) return setAddShowtimeError("Vui lòng chọn phòng chiếu.");
    if (!showDate) return setAddShowtimeError("Vui lòng chọn ngày chiếu.");
    setAddShowtimeError("");
    setAddShowtimeLoading(true);
    try {
      const startDT = `${showDate}T${startTime}:00`;
      // Tính endTime trong local time (không dùng toISOString() vì sẽ bị UTC)
      const endDate = new Date(startDT);
      endDate.setMinutes(endDate.getMinutes() + Number(duration));
      const endHH = String(endDate.getHours()).padStart(2, "0");
      const endMM = String(endDate.getMinutes()).padStart(2, "0");
      const endTimeStr = `${endHH}:${endMM}`;
      // Backend chỉ nhận HH:mm cho startTime và endTime
      await createShowtime({
        movieId: Number(movieId), roomId: Number(roomId),
        showDate, startTime, endTime: endTimeStr,
        basePrice: Number(basePrice), status: "Active",
      });
      // Reload showtimes and switch to the new date
      const newList = await getShowtimeDetailList();
      const arr = Array.isArray(newList) ? newList : newList?.$values || [];
      setAllShowtimes(arr);
      setSelectedDateIso(showDate);
      setShowAddShowtime(false);
      setAddShowtimeForm({ movieId: "", roomId: "", showDate: new Date().toISOString().split("T")[0], startTime: "08:00", duration: 120, basePrice: 75000 });
    } catch (err) {
      setAddShowtimeError(err.message || "Tạo suất chiếu thất bại.");
    } finally {
      setAddShowtimeLoading(false);
    }
  }

  // Load movies and all detailed showtimes on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [movieList, showtimeList] = await Promise.all([
          getMovieList(),
          getShowtimeDetailList()
        ]);
        setMovies(movieList);
        setAllShowtimes(showtimeList);
      } catch (err) {
        setError("Không thể tải danh sách suất chiếu.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter showtimes for the selected date (staff can sell for any time)
  const filteredShowtimes = useMemo(() => {
    return allShowtimes.filter(s => {
      const dateStr = getShowtimeDate(s);
      if (dateStr !== selectedDateIso) return false;

      // Filter by Staff's assigned cinema if they have one
      const showtimeCinemaId = s.cinemaId || s.CinemaId || s.room?.cinemaId || s.room?.CinemaId || s.room?.cinema?.cinemaId;
      if (staffCinemaId && showtimeCinemaId && String(showtimeCinemaId) !== String(staffCinemaId)) {
        return false;
      }

      return true;
    });
  }, [allShowtimes, selectedDateIso, staffCinemaId]);

  // Group filtered showtimes by movie
  const moviesWithShowtimes = useMemo(() => {
    const map = {};
    filteredShowtimes.forEach(s => {
      const movieId = s.movieId || s.MovieId || s.movie?.id || s.movie?.movieId || 0;
      if (!map[movieId]) {
        // Find movie details
        const movieInfo = movies.find(m => (m.id || m.movieId) === movieId) || {
          title: s.movieTitle || s.movie?.title || "Phim",
          posterUrl: s.moviePoster || s.movie?.posterUrl || ""
        };
        map[movieId] = {
          id: movieId,
          title: movieInfo.title || movieInfo.Title || "",
          posterUrl: movieInfo.posterUrl || movieInfo.PosterUrl || "",
          ageRating: movieInfo.ageRating || movieInfo.AgeRating || "T18",
          duration: movieInfo.duration || movieInfo.Duration || "120 phút",
          showtimes: []
        };
      }
      map[movieId].showtimes.push(s);
    });

    // Sort showtimes by start hour
    Object.values(map).forEach(m => {
      m.showtimes.sort((a, b) => getShowtimeHour(a).localeCompare(getShowtimeHour(b)));
    });

    return Object.values(map);
  }, [filteredShowtimes, movies]);

  // When showtime is selected, fetch seats
  useEffect(() => {
    if (!selectedShowtime) {
      setAllSeats([]);
      setAvailableSeats([]);
      setSelectedSeats([]);
      return;
    }

    async function loadSeats() {
      try {
        setLoadingSeats(true);
        const roomId = getShowtimeRoomId(selectedShowtime);
        const showtimeId = getShowtimeId(selectedShowtime);
        
        const [seatsList, availList] = await Promise.all([
          getSeatsByRoomId(roomId),
          getAvailableSeats(showtimeId)
        ]);

        setAllSeats(seatsList);
        setAvailableSeats(availList);
        setSelectedSeats([]);
      } catch (err) {
        console.error("Error loading seats:", err);
      } finally {
        setLoadingSeats(false);
      }
    }
    loadSeats();
  }, [selectedShowtime]);

  // Group seats by row
  const groupedSeats = allSeats.reduce((groups, seat) => {
    const row = seat.rowName || seat.RowName || seat.seatRow || seat.Row || "A";
    if (!groups[row]) groups[row] = [];
    groups[row].push(seat);
    return groups;
  }, {});

  // Sort seats in each row
  Object.keys(groupedSeats).forEach(row => {
    groupedSeats[row].sort((a, b) => {
      const numA = Number(a.seatNumber || a.Number || a.seatCol || 0);
      const numB = Number(b.seatNumber || b.Number || b.seatCol || 0);
      return numA - numB;
    });
  });

  const rowKeys = Object.keys(groupedSeats).sort();

  function handleSeatClick(seat) {
    const seatId = getSeatId(seat);
    const isSelected = selectedSeats.some(s => getSeatId(s) === seatId);
    
    if (isSelected) {
      setSelectedSeats(selectedSeats.filter(s => getSeatId(s) !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  }

  function calculateSeatPrice(seat) {
    return getSeatPrice(seat, selectedShowtime);
  }

  const totalAmount = selectedSeats.reduce((sum, seat) => sum + calculateSeatPrice(seat), 0);

  async function handleSellTickets(e) {
    e.preventDefault();
    if (!selectedShowtime) return alert("Vui lòng chọn suất chiếu!");
    if (selectedSeats.length === 0) return alert("Vui lòng chọn ít nhất một ghế!");
    if (!customer.name.trim()) return alert("Vui lòng nhập tên khách hàng!");

    try {
      setLoading(true);
      setError("");

      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : {};
      const staffUserId = user.userId || user.id || 1;

      const showtimeId = getShowtimeId(selectedShowtime);

      const bookingPromises = selectedSeats.map(async (seat) => {
        const payload = {
          userId: Number(staffUserId),
          showtimeId: Number(showtimeId),
          seatId: Number(getSeatId(seat)),
          totalPrice: Number(calculateSeatPrice(seat)),
          status: "Paid",
          paymentStatus: "Paid"
        };
        return await createBooking(payload);
      });

      await Promise.all(bookingPromises);

      setSuccessReceipt({
        movieTitle: selectedMovie?.title || selectedMovie?.Title || "Phim",
        showtimeDate: getShowtimeDate(selectedShowtime),
        showtimeTime: getShowtimeHour(selectedShowtime),
        roomName: selectedShowtime.roomName || selectedShowtime.RoomName || `Phòng ${getShowtimeRoomId(selectedShowtime)}`,
        seats: selectedSeats.map(s => `${s.rowName || s.seatRow || s.Row || "A"}${s.seatNumber || s.number || s.seatCol || ""}`).join(", "),
        customerName: customer.name,
        customerPhone: customer.phone,
        totalAmount: totalAmount,
        dateBooked: new Date().toLocaleString("vi-VN"),
        ticketCode: `BK${Math.floor(Math.random() * 900000) + 100000}`
      });

      setSelectedSeats([]);
      setCustomer({ name: "", phone: "", email: "" });
      
      const availList = await getAvailableSeats(showtimeId);
      setAvailableSeats(availList);

    } catch (err) {
      setError(err.message || "Đặt vé thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return {
    movies,
    rooms,
    dates,
    selectedDateIso,
    setSelectedDateIso,
    moviesWithShowtimes,
    selectedShowtime,
    setSelectedShowtime,
    selectedMovie,
    setSelectedMovie,
    allSeats,
    availableSeats,
    selectedSeats,
    setSelectedSeats,
    customer,
    setCustomer,
    loading,
    loadingSeats,
    error,
    setError,
    successReceipt,
    setSuccessReceipt,
    rowKeys,
    groupedSeats,
    handleSeatClick,
    getSeatPrice: calculateSeatPrice,
    totalAmount,
    handleSellTickets,
    getShowtimeHour,
    getShowtimeDate,
    getShowtimeRoomId,
    getShowtimeId,
    getSeatId,
    showAddShowtime, setShowAddShowtime,
    addShowtimeForm, setAddShowtimeForm,
    addShowtimeLoading, addShowtimeError,
    handleAddShowtime,
    formatMoney: (n) => Number(n || 0).toLocaleString("vi-VN"),
    sortRows: (keys) => [...keys].sort(),
    sortSeatsByPosition: (seats) =>
      [...seats].sort((a, b) => {
        const na = Number(a.seatNumber || a.number || a.seatCol || 0);
        const nb = Number(b.seatNumber || b.number || b.seatCol || 0);
        return na - nb;
      }),
    getSeatDisplayLabel: (seat, row) =>
      `${row}${seat.seatNumber || seat.number || seat.seatCol || ""}`,
    isSeatBooked: (seat) => {
      const seatId = getSeatId(seat);
      return !availableSeats.some(s => getSeatId(s) === seatId);
    },
    getSeatTypeLabel: (seat) => {
      const t = (seat.seatType || seat.type || seat.SeatType || "").toLowerCase();
      if (t === "vip") return "VIP";
      if (t === "couple") return "Couple";
      return "Thường";
    },
    getSeatClassName: (seat) => {
      const seatId = getSeatId(seat);
      const booked = !availableSeats.some(s => getSeatId(s) === seatId);
      const selected = selectedSeats.some(s => getSeatId(s) === seatId);
      const type = (seat.seatType || seat.type || seat.SeatType || "").toLowerCase();
      let cls = "counter-seat";
      if (booked) cls += " booked";
      else if (selected) cls += " selected";
      if (type === "vip") cls += " vip";
      if (type === "couple") cls += " couple";
      return cls;
    },
    getSelectedSeatsText: () =>
      selectedSeats
        .map(s => {
          const row = s.rowName || s.seatRow || s.Row || "?";
          return `${row}${s.seatNumber || s.number || s.seatCol || ""}`;
        })
        .join(", "),
    getSelectedShowtimeBasePrice: () =>
      selectedShowtime?.basePrice || selectedShowtime?.BasePrice || 0,
  };
}
