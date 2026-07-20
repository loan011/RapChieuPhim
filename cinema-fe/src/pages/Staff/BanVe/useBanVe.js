import { useEffect, useState, useMemo } from "react";
import { getMovieList } from "../../Admin/Film/movieService";
import { getShowtimeDetailList } from "../../Admin/Rate/showtimeService";
import { getTicketList, updateTicket } from "../../Admin/Ticket/ticketService";
import {
  getSeatsByRoomId,
  getAvailableSeats,
  createBooking,
  cancelBooking,
} from "../../Booking/bookingService";
import { createPayment, updatePaymentStatus, checkPaymentStatus } from "../../Payment/PaymentService";
import { getCombosAndFoodsList } from "./BanVeService";
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
   ROBUST BOOKING ID EXTRACTOR
========================= */

function extractBookingId(data) {
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
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [cashReceived, setCashReceived] = useState("");
  const [currentPaymentId, setCurrentPaymentId] = useState(null);

  const [customer, setCustomer] = useState({
    name: "Khách vãng lai",
    phone: "",
    email: "",
  });

  // Food & Combo States
  const [foodMenu, setFoodMenu] = useState([]);
  const [selectedFoods, setSelectedFoods] = useState({});
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [foodSearchQuery, setFoodSearchQuery] = useState("");
  const [foodFilterType, setFoodFilterType] = useState("all");

  const [loading, setLoading] = useState(false);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [error, setError] = useState("");
  const [successReceipt, setSuccessReceipt] = useState(null);

  /* =========================
     LOAD MOVIES + SHOWTIMES + FOODS
  ========================= */

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [movieList, showtimeList, foodList] = await Promise.all([
          getMovieList(),
          getShowtimeDetailList(),
          getCombosAndFoodsList(),
        ]);

        setMovies(Array.isArray(movieList) ? movieList : []);
        setAllShowtimes(Array.isArray(showtimeList) ? showtimeList : []);
        setFoodMenu(Array.isArray(foodList) ? foodList : []);
      } catch (err) {
        console.error("Lỗi tải danh sách suất chiếu/đồ ăn:", err);
        setError("Không thể tải danh sách suất chiếu hoặc đồ ăn.");
        setMovies([]);
        setAllShowtimes([]);
        setFoodMenu([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Polling for Sepay QR Payment Success
  useEffect(() => {
    if (!showQrModal || !paymentTicketIds || paymentTicketIds.length === 0) return;

    const firstBookingId = paymentTicketIds[0];
    let intervalId = setInterval(async () => {
      try {
        console.log(`Polling payment status for booking ID: ${firstBookingId}...`);
        const isPaid = await checkPaymentStatus(firstBookingId);
        
        if (isPaid) {
          console.log(`Payment confirmed automatically for booking ${firstBookingId}! Transitioning to success receipt.`);
          clearInterval(intervalId);
          
          // Force activate tickets to Active in DB
          await forceActivateTickets(paymentTicketIds);
          
          // Complete checkout on frontend
          setSuccessReceipt(tempReceipt);
          setShowQrModal(false);
          setPaymentQrCode("");
          setCurrentPaymentId(null);
          setPaymentTicketIds([]);
          setSelectedSeats([]);
          setSelectedFoods({});
          setCustomer({ name: "Khách vãng lai", phone: "", email: "" });
          
          // Reload seat map
          const showtimeId = getShowtimeId(selectedShowtime);
          const list = await getAvailableSeats(showtimeId);
          setAvailableSeats(Array.isArray(list) ? list : []);
        }
      } catch (pollErr) {
        console.warn("Error polling payment status:", pollErr);
      }
    }, 2500); // Poll every 2.5 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [showQrModal, paymentTicketIds, tempReceipt, selectedShowtime]);

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

  function findCouplePair(seat) {
    const type = getSeatTypeRaw(seat);
    if (!type.includes("couple") && !type.includes("sweetbox") && !type.includes("đôi")) {
      return null;
    }

    const row = extractSeatRow(seat);
    const rowSeats = groupedSeats[row] || [];
    const sortedRowSeats = [...rowSeats].sort((a, b) => {
      return extractSeatNumber(a) - extractSeatNumber(b);
    });

    const coupleSeats = sortedRowSeats.filter(s => {
      const t = getSeatTypeRaw(s);
      return t.includes("couple") || t.includes("sweetbox") || t.includes("đôi");
    });

    const index = coupleSeats.findIndex(s => getSeatId(s) === getSeatId(seat));
    if (index === -1) return null;

    if (index % 2 === 0) {
      return coupleSeats[index + 1] || null;
    } else {
      return coupleSeats[index - 1] || null;
    }
  }

  function handleSeatClick(seat) {
    if (isSeatBooked(seat)) return;

    const seatId = getSeatId(seat);
    const pair = findCouplePair(seat);

    const isSelected = selectedSeats.some(
      (selectedSeat) => String(getSeatId(selectedSeat)) === String(seatId)
    );

    if (isSelected) {
      setSelectedSeats((prev) => {
        let filtered = prev.filter(
          (selectedSeat) => String(getSeatId(selectedSeat)) !== String(seatId)
        );
        if (pair) {
          filtered = filtered.filter(
            (selectedSeat) => String(getSeatId(selectedSeat)) !== String(getSeatId(pair))
          );
        }
        return filtered.sort(compareSeatPosition);
      });
    } else {
      setSelectedSeats((prev) => {
        const added = [...prev, seat];
        if (pair && !isSeatBooked(pair) && !added.some(s => getSeatId(s) === getSeatId(pair))) {
          added.push(pair);
        }
        return added.sort(compareSeatPosition);
      });
    }
  }

  function calculateSeatPrice(seat) {
    return getSeatPrice(seat, selectedShowtime);
  }

  function handleFoodQuantityChange(item, delta) {
    const key = `${item.id}_${item.type}`;
    setSelectedFoods((prev) => {
      const current = prev[key] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [key]: next };
    });
  }

  const filteredFoodMenu = useMemo(() => {
    return foodMenu.filter((item) => {
      if (foodFilterType !== "all" && item.category !== foodFilterType) {
        return false;
      }
      if (foodSearchQuery.trim() !== "") {
        const q = foodSearchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [foodMenu, foodFilterType, foodSearchQuery]);

  const selectedFoodsList = useMemo(() => {
    return foodMenu
      .filter((item) => (selectedFoods[`${item.id}_${item.type}`] || 0) > 0)
      .map((item) => ({
        ...item,
        quantity: selectedFoods[`${item.id}_${item.type}`],
      }));
  }, [foodMenu, selectedFoods]);

  const foodTotalAmount = useMemo(() => {
    return selectedFoodsList.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }, [selectedFoodsList]);

  const totalAmount = useMemo(() => {
    const seatsPrice = selectedSeats.reduce(
      (sum, seat) => sum + Number(calculateSeatPrice(seat)),
      0
    );
    return seatsPrice + foodTotalAmount;
  }, [selectedSeats, selectedShowtime, foodTotalAmount]);

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

    if (paymentMethod === "Cash" && cashReceived !== "" && Number(cashReceived) < totalAmount) {
      alert(`Số tiền nhận (${Number(cashReceived).toLocaleString("vi-VN")} đ) phải lớn hơn hoặc bằng tổng tiền đơn hàng (${totalAmount.toLocaleString("vi-VN")} đ)!`);
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

      const orderItemsPayload = selectedFoodsList.map((item) => {
        const isCombo = item.type === "Combo" || item.isCombo || item._isCombo;
        const id = Number(item.id);
        if (isCombo) {
          return { comboId: id, quantity: Number(item.quantity) };
        }
        return { foodId: id, quantity: Number(item.quantity) };
      });

      const seatIds = selectedSeats.map(seat => Number(getSeatId(seat)));

      // Tạo duy nhất 1 request booking chứa tất cả các ghế và đồ ăn kèm
      const payload = {
        showTimeId: Number(showtimeId),
        seatIds: seatIds,
        bookingType: "Staff",
        targetUserId: Number(staffUserId),
      };

      if (orderItemsPayload.length > 0) {
        payload.orderItems = orderItemsPayload;
      }

      console.log("SENDING STAFF CREATE BOOKING PAYLOAD:", payload);
      const res = await createBooking(payload);
      console.log("STAFF CREATE BOOKING RESPONSE:", res);

      // Trích xuất bookingIds
      let bookedIds = [];
      const resData = res?.data ?? res;
      if (resData && (resData.bookingIds || resData.BookingIds)) {
        const rawIds = resData.bookingIds ?? resData.BookingIds;
        bookedIds = Array.isArray(rawIds) ? rawIds : (rawIds?.$values || []);
      }
      if (bookedIds.length === 0) {
        const singleId = extractBookingId(res);
        bookedIds = singleId !== null ? [singleId] : [`BK${Math.floor(Math.random() * 90000)}`];
      }

      // NẾU CHỌN THANH TOÁN TIỀN MẶT
      if (paymentMethod === "Cash") {
        try {
          const paymentPayload = {
            bookingId: Number(bookedIds[0]),
            bookingIds: bookedIds.map(Number),
            amount: Number(totalAmount),
            paymentMethod: "Cash",
            description: `Thanh toan tien mat tai quay cho booking ${bookedIds.join(", ")}`,
          };
          await createPayment(paymentPayload);
        } catch (payErr) {
          console.warn("Cash Payment creation failed:", payErr);
        }

        if (bookedIds[0] && cashReceived) {
          localStorage.setItem("cash_received_booking_" + bookedIds[0], cashReceived);
        }

        // Force activate tickets to Active state immediately
        await forceActivateTickets(bookedIds);

        setSuccessReceipt({
          movieTitle: selectedMovie?.title || selectedMovie?.Title || "Phim",
          showtimeDate: getShowtimeDate(selectedShowtime),
          showtimeTime: getShowtimeHour(selectedShowtime),
          roomName:
            selectedShowtime.roomName ||
            selectedShowtime.RoomName ||
            `Phòng ${getShowtimeRoomId(selectedShowtime)}`,
          seats: selectedSeats.map((seat) => getSeatCode(seat)).join(", "),
          foodsText: selectedFoodsList.map(item => `${item.name} x${item.quantity}`).join(", "),
          customerName: customer.name || "Khách vãng lai",
          customerPhone: customer.phone || "",
          totalAmount,
          cashReceived: Number(cashReceived) || 0,
          dateBooked: new Date().toLocaleString("vi-VN"),
          ticketCode: bookedIds.join(", "),
          paymentMethod: "Tiền mặt",
        });
        setCashReceived("");

        setSelectedSeats([]);
        setSelectedFoods({});
        setCustomer({ name: "Khách vãng lai", phone: "", email: "" });
        
        // Tải lại danh sách ghế trống
        const showtimeId = getShowtimeId(selectedShowtime);
        getAvailableSeats(showtimeId)
          .then((list) => {
            setAvailableSeats(Array.isArray(list) ? list : []);
          })
          .catch((e) => console.error(e));

        return;
      }

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
        
        const pId = paymentResult?.paymentId ?? paymentResult?.PaymentId ?? paymentResult?.id ?? paymentResult?.Id;
        setCurrentPaymentId(pId);

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

      // ALWAYS USE USER'S TPBANK DETAILS FOR SEPAY AUTOMATIC DETECTION
      const addInfo = encodeURIComponent(`DATVE ${bookedIds[0]}`);
      qrCodeUrlToUse = `https://img.vietqr.io/image/TPB-15145686888-compact.png?amount=${totalAmount}&addInfo=${addInfo}&accountName=Nguyen%20Quang%20Vinh`;
      console.log("GENERATED STAFF VIETQR FOR SEPAY:", qrCodeUrlToUse);

      setTempReceipt({
        movieTitle: selectedMovie?.title || selectedMovie?.Title || "Phim",
        showtimeDate: getShowtimeDate(selectedShowtime),
        showtimeTime: getShowtimeHour(selectedShowtime),
        roomName:
          selectedShowtime.roomName ||
          selectedShowtime.RoomName ||
          `Phòng ${getShowtimeRoomId(selectedShowtime)}`,
        seats: selectedSeats.map((seat) => getSeatCode(seat)).join(", "),
        foodsText: selectedFoodsList.map(item => `${item.name} x${item.quantity}`).join(", "),
        customerName: customer.name || "Khách vãng lai",
        customerPhone: customer.phone || "",
        totalAmount,
        dateBooked: new Date().toLocaleString("vi-VN"),
        ticketCode: bookedIds.join(", "),
        paymentMethod: "Quét QR ngân hàng",
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

  async function handleCompleteStaffQrPayment() {
    // Kiểm tra thanh toán thực sự đã thành công chưa qua API
    try {
      if (paymentTicketIds && paymentTicketIds.length > 0) {
        const firstId = paymentTicketIds[0];
        const isPaid = await checkPaymentStatus(firstId);
        if (!isPaid) {
          // Chưa nhận được tiền → báo lỗi, KHÔNG hoàn tất
          return false;
        }
      }
    } catch (checkErr) {
      console.warn("Could not verify payment status:", checkErr);
      // Nếu API check lỗi, cũng không cho qua
      return false;
    }

    // Đã xác nhận thanh toán thành công → cập nhật trạng thái
    try {
      if (currentPaymentId) {
        await updatePaymentStatus(currentPaymentId, "Success", "Xác nhận bởi nhân viên tại quầy");
      }
    } catch (payErr) {
      console.warn("Failed to update QR payment status in backend:", payErr);
    }

    // Force activate tickets to Active state immediately
    if (paymentTicketIds && paymentTicketIds.length > 0) {
      await forceActivateTickets(paymentTicketIds);
    }

    setSuccessReceipt(tempReceipt);
    setShowQrModal(false);
    setPaymentQrCode("");
    setCurrentPaymentId(null);
    setSelectedSeats([]);
    setSelectedFoods({});
    setCustomer({ name: "Khách vãng lai", phone: "", email: "" });
    const showtimeId = getShowtimeId(selectedShowtime);
    getAvailableSeats(showtimeId)
      .then((list) => {
        setAvailableSeats(Array.isArray(list) ? list : []);
      })
      .catch((e) => console.error(e));

    return true;
  }

  async function handleCancelStaffQrPayment() {
    try {
      if (paymentTicketIds && paymentTicketIds.length > 0) {
        await Promise.all(
          paymentTicketIds.map((id) => cancelBooking(id))
        );
        console.log("Cancelled all pending bookings:", paymentTicketIds);
      }
    } catch (err) {
      console.error("Failed to cancel bookings on QR modal cancel:", err);
    }

    setShowQrModal(false);
    setPaymentQrCode("");
    setCurrentPaymentId(null);
    setPaymentTicketIds([]);

    const showtimeId = getShowtimeId(selectedShowtime);
    getAvailableSeats(showtimeId)
      .then((list) => {
        setAvailableSeats(Array.isArray(list) ? list : []);
      })
      .catch((e) => console.error(e));
  }

  async function forceActivateTickets(bookedIds) {
    if (!bookedIds || bookedIds.length === 0) return;
    try {
      const ticketsList = await getTicketList();
      const normalizedTickets = Array.isArray(ticketsList) ? ticketsList : (ticketsList?.$values || []);
      const matchIds = bookedIds.map(Number);
      const myTickets = normalizedTickets.filter(t => {
        const bId = Number(t.bookingId ?? t.BookingId ?? 0);
        return matchIds.includes(bId);
      });

      for (const ticket of myTickets) {
        const ticketId = ticket.ticketId ?? ticket.TicketId;
        if (ticketId) {
          await updateTicket(ticketId, { status: "Active" });
          console.log(`Force activated ticket ${ticketId} to Active`);
        }
      }
    } catch (err) {
      console.error("Force activating tickets failed:", err);
    }
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

    // Payment Method
    paymentMethod,
    setPaymentMethod,
    cashReceived,
    setCashReceived,

    // Foods States & Handlers
    foodMenu,
    selectedFoods,
    setSelectedFoods,
    showFoodModal,
    setShowFoodModal,
    foodSearchQuery,
    setFoodSearchQuery,
    foodFilterType,
    setFoodFilterType,
    filteredFoodMenu,
    selectedFoodsList,
    foodTotalAmount,
    handleFoodQuantityChange,
  };
}