import { useEffect, useState, useMemo } from "react";
import { getMovieList } from "../../Admin/Film/movieService";
import { getShowtimeDetailList } from "../../Admin/Rate/showtimeService";
import {
  getSeatsByRoomId,
  getAvailableSeats,
  createBooking,
} from "../../Booking/bookingService";
import { createPayment } from "../../Payment/PaymentService";
import {
  createBookingDates,
  getShowtimeId,
  getShowtimeRoomId,
  getShowtimeDate,
  getShowtimeHour,
  getSeatId,
  getSeatPrice,
} from "../../Booking/usebooking.js";

/* =========================
   SEAT HELPER
   Fix lỗi A1, A10, A11, A2...
========================= */

function getRawSeatRow(seat) {
  return (
    seat?.rowName ||
    seat?.RowName ||
    seat?.seatRow ||
    seat?.SeatRow ||
    seat?.row ||
    seat?.Row ||
    ""
  );
}

function getRawSeatNumber(seat) {
  return (
    seat?.seatNumber ??
    seat?.SeatNumber ??
    seat?.number ??
    seat?.Number ??
    seat?.seatCol ??
    seat?.SeatCol ??
    ""
  );
}

function extractSeatRow(seat) {
  const row = String(getRawSeatRow(seat) || "")
    .trim()
    .toUpperCase();

  if (row) return row;

  const rawNumber = String(getRawSeatNumber(seat) || "").trim();
  const match = rawNumber.match(/^[A-Za-z]+/);

  return match ? match[0].toUpperCase() : "A";
}

function extractSeatNumber(seat) {
  const rawNumber = String(getRawSeatNumber(seat) || "").trim();
  const match = rawNumber.match(/\d+/);

  return match ? Number(match[0]) : 0;
}

function getSeatCode(seat) {
  const row = extractSeatRow(seat);
  const number = extractSeatNumber(seat);

  if (!row && !number) return "Không rõ";
  if (!number) return row;

  return `${row}${number}`;
}

function getSeatTypeRaw(seat) {
  return String(
    seat?.seatType ||
      seat?.SeatType ||
      seat?.type ||
      seat?.Type ||
      "Standard"
  ).toLowerCase();
}

function compareSeatRows(a, b) {
  return String(a).localeCompare(String(b), "vi", {
    numeric: true,
    sensitivity: "base",
  });
}

function compareSeatPosition(a, b) {
  const rowA = extractSeatRow(a);
  const rowB = extractSeatRow(b);

  if (rowA !== rowB) {
    return compareSeatRows(rowA, rowB);
  }

  return extractSeatNumber(a) - extractSeatNumber(b);
}

/* =========================
   MAIN HOOK
========================= */

export function useBanVe() {
  const [movies, setMovies] = useState([]);
  const [allShowtimes, setAllShowtimes] = useState([]);

  const dates = useMemo(() => createBookingDates(7), []);
  const [selectedDateIso, setSelectedDateIso] = useState(dates[0]?.iso || "");

  const staffCinemaId = useMemo(() => {
    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : {};
      const email = user.email || user.Email || "";

      const mappings = JSON.parse(
        localStorage.getItem("staff_cinema_mappings") || "{}"
      );

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
  const [showQrModal, setShowQrModal] = useState(false);
  const [paymentQrCode, setPaymentQrCode] = useState("");
  const [paymentTicketIds, setPaymentTicketIds] = useState([]);
  const [tempReceipt, setTempReceipt] = useState(null);

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [error, setError] = useState("");
  const [successReceipt, setSuccessReceipt] = useState(null);

  /* =========================
     LOAD MOVIES + SHOWTIMES
  ========================= */

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [movieList, showtimeList] = await Promise.all([
          getMovieList(),
          getShowtimeDetailList(),
        ]);

        setMovies(Array.isArray(movieList) ? movieList : []);
        setAllShowtimes(Array.isArray(showtimeList) ? showtimeList : []);
      } catch (err) {
        console.error("Lỗi tải danh sách suất chiếu:", err);
        setError("Không thể tải danh sách suất chiếu.");
        setMovies([]);
        setAllShowtimes([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  /* =========================
     FILTER SHOWTIMES
  ========================= */

  const filteredShowtimes = useMemo(() => {
    const now = new Date();

    const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const todayStr = vnTime.toISOString().split("T")[0];

    const currentHour = String(now.getHours()).padStart(2, "0");
    const currentMin = String(now.getMinutes()).padStart(2, "0");
    const currentTimeStr = `${currentHour}:${currentMin}`;

    return allShowtimes.filter((showtime) => {
      const dateStr = getShowtimeDate(showtime);

      if (dateStr !== selectedDateIso) return false;

      const showtimeCinemaId =
        showtime.cinemaId ||
        showtime.CinemaId ||
        showtime.room?.cinemaId ||
        showtime.room?.CinemaId ||
        showtime.Room?.cinemaId ||
        showtime.Room?.CinemaId ||
        showtime.room?.cinema?.cinemaId ||
        showtime.room?.cinema?.CinemaId ||
        showtime.Room?.Cinema?.cinemaId ||
        showtime.Room?.Cinema?.CinemaId;

      if (
        staffCinemaId &&
        showtimeCinemaId &&
        String(showtimeCinemaId) !== String(staffCinemaId)
      ) {
        return false;
      }

      if (dateStr === todayStr) {
        const timeStr = getShowtimeHour(showtime);
        return timeStr >= currentTimeStr;
      }

      return true;
    });
  }, [allShowtimes, selectedDateIso, staffCinemaId]);

  /* =========================
     GROUP SHOWTIMES BY MOVIE
  ========================= */

  const moviesWithShowtimes = useMemo(() => {
    const map = {};

    filteredShowtimes.forEach((showtime) => {
      const movieId =
        showtime.movieId ||
        showtime.MovieId ||
        showtime.movie?.id ||
        showtime.movie?.movieId ||
        showtime.Movie?.Id ||
        showtime.Movie?.MovieId ||
        0;

      if (!map[movieId]) {
        const movieInfo =
          movies.find((movie) => {
            const id = movie.id || movie.Id || movie.movieId || movie.MovieId;
            return String(id) === String(movieId);
          }) || {};

        map[movieId] = {
          id: movieId,
          title:
            movieInfo.title ||
            movieInfo.Title ||
            showtime.movieTitle ||
            showtime.MovieTitle ||
            showtime.movie?.title ||
            showtime.Movie?.Title ||
            "Phim",
          posterUrl:
            movieInfo.posterUrl ||
            movieInfo.PosterUrl ||
            showtime.moviePoster ||
            showtime.MoviePoster ||
            showtime.movie?.posterUrl ||
            showtime.Movie?.PosterUrl ||
            "",
          ageRating:
            movieInfo.ageRating ||
            movieInfo.AgeRating ||
            showtime.ageRating ||
            showtime.AgeRating ||
            "T18",
          duration:
            movieInfo.duration ||
            movieInfo.Duration ||
            showtime.duration ||
            showtime.Duration ||
            "120 phút",
          showtimes: [],
        };
      }

      map[movieId].showtimes.push(showtime);
    });

    Object.values(map).forEach((movie) => {
      movie.showtimes.sort((a, b) =>
        getShowtimeHour(a).localeCompare(getShowtimeHour(b), "vi", {
          numeric: true,
        })
      );
    });

    return Object.values(map);
  }, [filteredShowtimes, movies]);

  /* =========================
     LOAD SEATS WHEN SHOWTIME CHANGED
  ========================= */

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
        setError("");

        const roomId = getShowtimeRoomId(selectedShowtime);
        const showtimeId = getShowtimeId(selectedShowtime);

        const [seatsList, availableList] = await Promise.all([
          getSeatsByRoomId(roomId),
          getAvailableSeats(showtimeId),
        ]);

        const normalizedSeats = Array.isArray(seatsList) ? seatsList : [];
        const normalizedAvailable = Array.isArray(availableList)
          ? availableList
          : [];

        setAllSeats([...normalizedSeats].sort(compareSeatPosition));
        setAvailableSeats(normalizedAvailable);
        setSelectedSeats([]);
      } catch (err) {
        console.error("Error loading seats:", err);
        setAllSeats([]);
        setAvailableSeats([]);
        setSelectedSeats([]);
      } finally {
        setLoadingSeats(false);
      }
    }

    loadSeats();
  }, [selectedShowtime]);

  /* =========================
     GROUP SEATS BY ROW + SORT
  ========================= */

  const groupedSeats = useMemo(() => {
    const groups = {};

    allSeats.forEach((seat) => {
      const row = extractSeatRow(seat);

      if (!groups[row]) {
        groups[row] = [];
      }

      groups[row].push(seat);
    });

    Object.keys(groups).forEach((row) => {
      groups[row].sort((a, b) => {
        return extractSeatNumber(a) - extractSeatNumber(b);
      });
    });

    return groups;
  }, [allSeats]);

  const rowKeys = useMemo(() => {
    return Object.keys(groupedSeats).sort(compareSeatRows);
  }, [groupedSeats]);

  /* =========================
     SEAT ACTIONS
  ========================= */

  function isSeatBooked(seat) {
    const seatId = getSeatId(seat);

    if (!Array.isArray(availableSeats) || availableSeats.length === 0) {
      return false;
    }

    return !availableSeats.some((availableSeat) => {
      const availableSeatId =
        availableSeat?.seatId ??
        availableSeat?.SeatId ??
        availableSeat?.id ??
        availableSeat?.Id;

      return String(availableSeatId) === String(seatId);
    });
  }

  function handleSeatClick(seat) {
    if (isSeatBooked(seat)) return;

    const seatId = getSeatId(seat);

    const isSelected = selectedSeats.some(
      (selectedSeat) => String(getSeatId(selectedSeat)) === String(seatId)
    );

    if (isSelected) {
      setSelectedSeats((prev) =>
        prev.filter(
          (selectedSeat) => String(getSeatId(selectedSeat)) !== String(seatId)
        )
      );
    } else {
      setSelectedSeats((prev) =>
        [...prev, seat].sort(compareSeatPosition)
      );
    }
  }

  function calculateSeatPrice(seat) {
    return getSeatPrice(seat, selectedShowtime);
  }

  const totalAmount = useMemo(() => {
    return selectedSeats.reduce(
      (sum, seat) => sum + Number(calculateSeatPrice(seat)),
      0
    );
  }, [selectedSeats, selectedShowtime]);

  /* =========================
     SELL TICKET
  ========================= */

  async function handleSellTickets(e) {
    e.preventDefault();

    if (!selectedShowtime) {
      alert("Vui lòng chọn suất chiếu!");
      return;
    }

    if (selectedSeats.length === 0) {
      alert("Vui lòng chọn ít nhất một ghế!");
      return;
    }

    if (!customer.name.trim()) {
      alert("Vui lòng nhập tên khách hàng!");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : {};

      const staffUserId =
        user.userId || user.UserId || user.id || user.Id || 1;

      const showtimeId = getShowtimeId(selectedShowtime);

      const bookingPromises = selectedSeats.map(async (seat) => {
        const seatId = Number(getSeatId(seat));
        const price = Number(calculateSeatPrice(seat));

        const payload = {
          userId: Number(staffUserId),
          showtimeId: Number(showtimeId),
          seatId,
          seatIds: [seatId],
          SeatIds: [seatId],
          totalPrice: price,
          status: "Paid",
          paymentStatus: "Paid",
        };

        return await createBooking(payload);
      });

      const bookingResults = await Promise.all(bookingPromises);
      const bookedIds = bookingResults.map((data, idx) => {
        return (
          data?.bookingId ??
          data?.BookingId ??
          data?.id ??
          data?.Id ??
          `BK${Math.floor(Math.random() * 90000)}`
        );
      });

      // Gọi API Payments sau khi tạo Booking thành công
      let qrCodeUrlToUse = "";
      try {
        const paymentPayload = {
          bookingId: Number(bookedIds[0]),
          bookingIds: bookedIds.map(Number),
          amount: Number(totalAmount),
          paymentMethod: "VNPay",
          description: `Thanh toan ve tai quay cho booking ${bookedIds.join(", ")}`,
        };

        console.log("SENDING STAFF PAYMENTS PAYLOAD:", paymentPayload);
        const paymentResult = await createPayment(paymentPayload);
        console.log("STAFF PAYMENTS RESPONSE:", paymentResult);

        // 1. Hỗ trợ VNPay / MoMo redirect URL
        const redirectUrl =
          paymentResult?.paymentUrl ??
          paymentResult?.paymentURL ??
          paymentResult?.url ??
          paymentResult?.Url ??
          paymentResult?.redirectUrl ??
          paymentResult?.RedirectUrl ??
          paymentResult?.vnPayUrl ??
          paymentResult?.VnPayUrl;

        // 2. Kiểm tra mã QR thanh toán trả về từ BE
        const qr =
          paymentResult?.qrCode ??
          paymentResult?.QrCode ??
          paymentResult?.qrCodeUrl ??
          paymentResult?.QrCodeUrl ??
          paymentResult?.qrUrl ??
          paymentResult?.QrUrl ??
          paymentResult?.vietQrUrl ??
          paymentResult?.VietQrUrl ??
          paymentResult?.qr ??
          paymentResult?.Qr;

        // 3. Nếu BE trả về thông tin ngân hàng để tự tạo VietQR
        const bankId = paymentResult?.bankId ?? paymentResult?.BankId ?? paymentResult?.bankCode ?? paymentResult?.BankCode;
        const accountNo = paymentResult?.accountNo ?? paymentResult?.AccountNo ?? paymentResult?.accountNumber ?? paymentResult?.AccountNumber;

        if (redirectUrl && typeof redirectUrl === "string" && redirectUrl.startsWith("http")) {
          qrCodeUrlToUse = redirectUrl;
        } else if (qr) {
          qrCodeUrlToUse = qr;
        } else if (bankId && accountNo) {
          const addInfo = encodeURIComponent(`Thanh toan ve ${bookedIds.join(" ")}`);
          qrCodeUrlToUse = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${totalAmount}&addInfo=${addInfo}`;
        }
      } catch (payErr) {
        console.warn("Payments API failed in staff flow, using fallback QR:", payErr);
      }

      // NẾU KHÔNG CÓ QR TỪ BE HOẶC API LỖI, TỰ ĐỘNG TẠO MÃ VIETQR MOCK ĐỂ LUÔN HIỂN THỊ
      if (!qrCodeUrlToUse) {
        const defaultBank = "MB";
        const defaultAccount = "190220042001";
        const addInfo = encodeURIComponent(`Thanh toan ve ${bookedIds.join(" ")}`);
        qrCodeUrlToUse = `https://img.vietqr.io/image/${defaultBank}-${defaultAccount}-compact2.png?amount=${totalAmount}&addInfo=${addInfo}`;
        console.log("GENERATED STAFF FALLBACK VIETQR:", qrCodeUrlToUse);
      }

      setTempReceipt({
        movieTitle: selectedMovie?.title || selectedMovie?.Title || "Phim",
        showtimeDate: getShowtimeDate(selectedShowtime),
        showtimeTime: getShowtimeHour(selectedShowtime),
        roomName:
          selectedShowtime.roomName ||
          selectedShowtime.RoomName ||
          `Phòng ${getShowtimeRoomId(selectedShowtime)}`,
        seats: selectedSeats.map((seat) => getSeatCode(seat)).join(", "),
        customerName: customer.name,
        customerPhone: customer.phone,
        totalAmount,
        dateBooked: new Date().toLocaleString("vi-VN"),
        ticketCode: bookedIds.join(", "),
      });

      setPaymentQrCode(qrCodeUrlToUse);
      setPaymentTicketIds(bookedIds);
      setShowQrModal(true);
      return;

    } catch (err) {
      console.error("Đặt vé thất bại:", err);
      setError(err.message || "Đặt vé thất bại.");
    } finally {
      setLoading(false);
    }
  }

  function handleCompleteStaffQrPayment() {
    setSuccessReceipt(tempReceipt);
    setShowQrModal(false);
    setPaymentQrCode("");
    setSelectedSeats([]);
    setCustomer({ name: "", phone: "", email: "" });
    const showtimeId = getShowtimeId(selectedShowtime);
    getAvailableSeats(showtimeId)
      .then((list) => {
        setAvailableSeats(Array.isArray(list) ? list : []);
      })
      .catch((e) => console.error(e));
  }

  function handleCancelStaffQrPayment() {
    setShowQrModal(false);
    setPaymentQrCode("");
    const showtimeId = getShowtimeId(selectedShowtime);
    getAvailableSeats(showtimeId)
      .then((list) => {
        setAvailableSeats(Array.isArray(list) ? list : []);
      })
      .catch((e) => console.error(e));
  }

  /* =========================
     FORMAT + DISPLAY HELPERS
  ========================= */

  function formatMoney(value) {
    const n = Number(value);
    return Number.isNaN(n) ? "0" : n.toLocaleString("vi-VN");
  }

  const sortRows = (rows = []) => {
    return [...rows].sort(compareSeatRows);
  };

  const sortSeatsByPosition = (seats = []) => {
    return [...seats].sort(compareSeatPosition);
  };

  function getSeatClassName(seat) {
    const seatId = getSeatId(seat);
    const booked = isSeatBooked(seat);

    const isSelected = selectedSeats.some(
      (selectedSeat) => String(getSeatId(selectedSeat)) === String(seatId)
    );

    let className = "counter-seat-btn";

    const type = getSeatTypeRaw(seat);

    if (type.includes("vip")) {
      className += " seat-vip";
    } else if (
      type.includes("couple") ||
      type.includes("sweetbox") ||
      type.includes("đôi")
    ) {
      className += " seat-couple";
    } else {
      className += " seat-standard";
    }

    if (booked) {
      className += " seat-taken";
    } else if (isSelected) {
      className += " seat-selected";
    }

    return className;
  }

  function getSeatDisplayLabel(seat) {
    return getSeatCode(seat);
  }

  function getSeatTypeLabel(seat) {
    const type = getSeatTypeRaw(seat);

    if (type.includes("vip")) return "VIP";

    if (
      type.includes("couple") ||
      type.includes("sweetbox") ||
      type.includes("đôi")
    ) {
      return "Couple";
    }

    return "Thường";
  }

  function getSelectedSeatsText() {
    if (selectedSeats.length === 0) return "Chưa chọn";

    return [...selectedSeats]
      .sort(compareSeatPosition)
      .map((seat) => getSeatCode(seat))
      .join(", ");
  }

  function getSelectedShowtimeBasePrice() {
    if (!selectedShowtime) return 0;

    return Number(
      selectedShowtime.basePrice ||
        selectedShowtime.BasePrice ||
        selectedShowtime.price ||
        selectedShowtime.Price ||
        0
    );
  }

  return {
    movies,
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

    formatMoney,
    sortRows,
    sortSeatsByPosition,

    getSeatClassName,
    getSeatDisplayLabel,
    isSeatBooked,
    getSeatTypeLabel,
    getSelectedSeatsText,
    getSelectedShowtimeBasePrice,

    // QR states
    showQrModal,
    setShowQrModal,
    paymentQrCode,
    paymentTicketIds,
    handleCompleteStaffQrPayment,
    handleCancelStaffQrPayment,
  };
}