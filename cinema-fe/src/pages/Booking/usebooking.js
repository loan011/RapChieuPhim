import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { fetchActiveTicketPricings } from "../Ticket/ticketPriceService";

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
import { getDiscountList } from "../Admin/Discount/discountService";
import { INITIAL_DISCOUNTS, getStoredDiscounts } from "../Admin/Discount/useDiscount";
import { isSellingTime, SELLING_TIME_MESSAGE } from "../../utils/sellingShift";

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
  dateParam,
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
  let selectedDateIso = dateParam || dates?.[0]?.iso || "";

  if (initialShowtime) {
    const room = rooms.find(
      (item) =>
        String(getRoomId(item)) === String(getShowtimeRoomId(initialShowtime))
    );

    if (room) {
      selectedCinemaId = String(getRoomCinemaId(room));
    }

    if (!dateParam) {
      const showtimeDate = getShowtimeDate(initialShowtime);

      if (showtimeDate) {
        selectedDateIso = showtimeDate;
      }
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

  let seats = await getSeatsByRoomId(roomId);
  seats = Array.isArray(seats)
    ? seats.filter(seat => (seat?.isActive ?? seat?.IsActive) !== false)
    : [];

  if (Array.isArray(seats) && seats.length > 0) {
    const seenMap = new Map();
    const uniqueSeats = [];
    for (const seat of seats) {
      const row = String(getSeatRow(seat)).toUpperCase();
      const num = String(getSeatNumber(seat));
      const code = (row && num && num !== "0") ? `${row}${num}` : String(getSeatId(seat) || "");
      if (code && !seenMap.has(code)) {
        seenMap.set(code, true);
        seat.roomId = roomId;
        seat.RoomId = roomId;
        uniqueSeats.push(seat);
      }
    }
    seats = uniqueSeats;
  }

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
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=300&auto=format&fit=crop"
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
    0
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
      const cutoffTime = new Date(now.getTime() - 5 * 60 * 1000);
      const cutoffHour = String(cutoffTime.getHours()).padStart(2, "0");
      const cutoffMin = String(cutoffTime.getMinutes()).padStart(2, "0");
      const cutoffTimeStr = `${cutoffHour}:${cutoffMin}`;

      return showtimeHour >= cutoffTimeStr;
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
  const roomId = seat?.roomId || seat?.RoomId || seat?.room?.roomId || seat?.room?.RoomId;
  const sId = String(getSeatId(seat) || "");
  const row = String(getSeatRow(seat)).toUpperCase();
  const num = String(getSeatNumber(seat));
  const code = (row && num) ? `${row}${num}` : sId;

  if (roomId && typeof localStorage !== "undefined") {
    try {
      const saved = JSON.parse(localStorage.getItem(`rapchieuphim_seat_overrides_${roomId}`) || "{}");
      if (sId && saved.seats && saved.seats[sId]?.type) {
        return saved.seats[sId].type;
      }
      if (code && saved.seats && saved.seats[code]?.type) {
        return saved.seats[code].type;
      }
      if (row && saved.rows) {
        const rType = saved.rows[row] || saved.rows[row.toUpperCase()] || saved.rows[row.toLowerCase()];
        if (rType && rType !== "mixed") {
          return rType;
        }
      }
    } catch (e) {}
  }

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

export function isSeatAvailable(seat, availableSeats, selectedShowtime = null, selectedDateIso = "") {
  const seatId = String(getSeatId(seat));
  const seatRow = String(getSeatRow(seat)).toUpperCase();
  const seatNum = String(getSeatNumber(seat));
  const seatCode = (seatRow && seatNum && seatNum !== "0") ? `${seatRow}${seatNum}` : String(getSeatCode(seat)).toUpperCase();

  const isActive = seat?.isActive ?? seat?.IsActive;
  if (isActive === false) return false;

  try {
    const storedTickets = JSON.parse(localStorage.getItem("rapchieuphim_tickets") || "[]");
    const userBookings = JSON.parse(localStorage.getItem("user_bookings") || "[]");
    const customerDiscounts = JSON.parse(localStorage.getItem("customer_ticket_discounts") || "{}");
    const allCustomerOrders = [...storedTickets, ...userBookings, ...Object.values(customerDiscounts)];

    const activeShowtimeId = String(selectedShowtime?.showtimeId ?? selectedShowtime?.ShowtimeId ?? selectedShowtime?.id ?? selectedShowtime?.Id ?? "");
    const activeDate = selectedShowtime?.showDate || selectedShowtime?.date || selectedDateIso || "";
    const activeTime = selectedShowtime?.startTime || selectedShowtime?.time || "";

    const isBookedInLocal = allCustomerOrders.some(b => {
      const bStatus = String(b.status || b.Status || b.paymentStatus || "").toLowerCase();
      if (bStatus.includes("cancel") || bStatus.includes("hủy") || bStatus.includes("refund")) {
        return false;
      }

      const bShowtimeId = String(b.showtimeId ?? b.ShowtimeId ?? b.showtime?.id ?? b.showTime?.id ?? "");
      const bDate = b.showDate || b.date || b.showtime?.showDate || b.showTime?.showDate || "";
      const bTime = b.startTime || b.time || b.showtime?.startTime || b.showTime?.startTime || "";

      const sameShowtime = (activeShowtimeId && bShowtimeId && activeShowtimeId === bShowtimeId) ||
        (activeDate && bDate && activeDate === bDate && activeTime && bTime && activeTime === bTime);

      if (!sameShowtime) return false;

      const bSeatId = String(b.seatId ?? b.SeatId ?? b.seat?.id ?? b.seat?.seatId ?? "");
      const bSeatCode = String(b.seatCode ?? b.SeatCode ?? b.seatLabel ?? b.seat?.seatNumber ?? (b.seat?.seatCode || "")).toUpperCase();
      const bSeatsList = (b.seatsList || b.seats || b.selectedSeats || b.seatIds || []).map(s =>
        String(typeof s === "object" ? (s.seatNumber || s.code || s.seatRow ? `${s.seatRow}${s.seatNumber}` : s.id) : s).toUpperCase()
      );

      if (bSeatId && bSeatId === seatId) return true;
      if (bSeatCode && (bSeatCode === seatCode || bSeatCode.includes(seatCode))) return true;
      if (bSeatsList.some(s => s === seatCode || s === seatId || s.includes(seatCode) || seatCode.includes(s))) return true;

      return false;
    });

    if (isBookedInLocal) {
      return false; // NOT AVAILABLE!
    }
  } catch (e) {}

  if (!Array.isArray(availableSeats) || availableSeats.length === 0) {
    return true;
  }

  return availableSeats.some((availableSeat) => {
    const availableSeatId = String(
      availableSeat?.seatId ??
      availableSeat?.SeatId ??
      availableSeat?.id ??
      availableSeat?.Id
    );
    const availableSeatNumber = String(
      availableSeat?.seatNumber ??
      availableSeat?.SeatNumber ??
      availableSeat?.seatCode ??
      availableSeat?.SeatCode ??
      ""
    ).toUpperCase();

    return availableSeatId === seatId || (availableSeatNumber && availableSeatNumber === seatCode);
  });
}

export function isSeatHeldByOther(seat, selectedShowtime = null, selectedDateIso = "") {
  try {
    const seatId = String(getSeatId(seat));
    const seatRow = String(getSeatRow(seat)).toUpperCase();
    const seatNum = String(getSeatNumber(seat));
    const seatCode = (seatRow && seatNum && seatNum !== "0") ? `${seatRow}${seatNum}` : String(getSeatCode(seat)).toUpperCase();

    const activeShowtimeId = String(selectedShowtime?.showtimeId ?? selectedShowtime?.ShowtimeId ?? selectedShowtime?.id ?? selectedShowtime?.Id ?? "");
    const activeDate = selectedShowtime?.showDate || selectedShowtime?.date || selectedDateIso || "";
    const activeTime = selectedShowtime?.startTime || selectedShowtime?.time || "";

    const userObj = JSON.parse(localStorage.getItem("user") || "{}");
    const myId = String(userObj.id || userObj.userId || userObj.email || "GUEST_SESSION");

    const holdingMap = JSON.parse(localStorage.getItem("holding_seats") || "{}");
    const now = Date.now();

    return Object.values(holdingMap).some(h => {
      if (!h || !h.seatCode) return false;
      if (now - (h.heldAt || 0) > 5 * 60 * 1000) return false;

      const sameShowtime = (activeShowtimeId && h.showtimeId && activeShowtimeId === String(h.showtimeId)) ||
        (activeDate && h.date && activeDate === h.date && activeTime && h.time && activeTime === h.time);

      if (!sameShowtime) return false;

      const sameSeat = (h.seatCode.toUpperCase() === seatCode || String(h.seatId) === seatId);
      const isOtherUser = String(h.heldBy) !== myId;

      return sameSeat && isOtherUser;
    });
  } catch (e) {
    return false;
  }
}

export function getShowtimeTimeCategory(selectedShowtime) {
  if (!selectedShowtime) return "day";
  const startTimeVal =
    selectedShowtime.startTime ||
    selectedShowtime.StartTime ||
    selectedShowtime.time ||
    selectedShowtime.Time ||
    "";
  if (!startTimeVal) return "day";

  let hour = 12;
  const match = String(startTimeVal).trim().match(/(\d{1,2}):(\d{2})/);
  if (match) {
    hour = parseInt(match[1], 10);
  } else {
    const d = new Date(startTimeVal);
    if (!isNaN(d.getTime())) hour = d.getHours();
  }

  // 07:00 to 20:59 is DAY ("day"), 21:00 to 06:59 is NIGHT ("night")
  if (hour >= 7 && hour < 21) {
    return "day";
  }
  return "night";
}

export function getSeatPrice(seat, selectedShowtime, rooms = [], pricings = []) {
  if (!seat) {
    throw new Error("Không tìm thấy thông tin ghế!");
  }

  // 1. Nếu vé đã được mua trước đó có lưu giá cố định tại thời điểm mua (Ticket.Price / BookingDetail.Price), giữ nguyên giá cũ
  const explicitPrice = Number(seat?.price ?? seat?.Price);
  if (!isNaN(explicitPrice) && explicitPrice > 0) {
    return explicitPrice;
  }

  if (!selectedShowtime) {
    throw new Error("Không tìm thấy thông tin suất chiếu!");
  }

  // 2. Ghế phải thuộc đúng phòng của suất chiếu (showtimeId + seatId)
  const showtimeRoomId = getShowtimeRoomId(selectedShowtime);
  const seatRoomId = seat?.roomId ?? seat?.RoomId;
  if (
    seatRoomId !== undefined &&
    seatRoomId !== null &&
    seatRoomId !== "" &&
    seatRoomId !== 0 &&
    showtimeRoomId !== undefined &&
    showtimeRoomId !== null &&
    showtimeRoomId !== "" &&
    showtimeRoomId !== 0
  ) {
    if (String(seatRoomId) !== String(showtimeRoomId)) {
      throw new Error("Ghế không thuộc phòng chiếu của suất chiếu này!");
    }
  }

  // 3. Lấy loại phòng (RoomType: 2D, 3D, IMAX, 4DX)
  let room = Array.isArray(rooms) ? rooms.find((r) => String(getRoomId(r)) === String(showtimeRoomId)) : null;
  if (!room && selectedShowtime) {
    room = selectedShowtime.room || selectedShowtime.Room;
  }
  const roomType = String(
    selectedShowtime?.roomType ?? 
    selectedShowtime?.RoomType ?? 
    selectedShowtime?.format ?? 
    selectedShowtime?.Format ?? 
    room?.roomType ?? 
    room?.RoomType ?? 
    "2D"
  ).trim().toUpperCase();

  // 4. Lấy loại ghế (SeatType: Standard/Thường, VIP, Couple/Sweetbox)
  const seatTypeRaw = String(getSeatType(seat) || seat?.seatType || seat?.SeatType || seat?.type || "").trim().toLowerCase();

  const isCouple = seatTypeRaw.includes("sweetbox") || seatTypeRaw.includes("couple") || seatTypeRaw.includes("đôi") || seatTypeRaw.includes("doi");
  const isVip = seatTypeRaw.includes("vip");
  const seatCategory = isCouple ? "couple" : (isVip ? "vip" : "standard");

  // 5. Xác định ngày thường / cuối tuần & khung giờ
  const showtimeDateStr = getShowtimeDate(selectedShowtime) || new Date().toISOString();
  const showtimeDate = new Date(showtimeDateStr);
  const dayOfWeek = isNaN(showtimeDate.getTime()) ? new Date().getDay() : showtimeDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const timeCategory = getShowtimeTimeCategory(selectedShowtime);
  const isNight = timeCategory === "night";

  // 6. Tìm bảng giá đang hiệu lực (Active Ticket Pricing)
  let activePricings = pricings;
  if ((!activePricings || activePricings.length === 0) && typeof localStorage !== "undefined") {
    try {
      activePricings = JSON.parse(localStorage.getItem("active_ticket_pricings") || "[]");
    } catch (e) {}
  }

  let calculatedPrice = null;

  if (Array.isArray(activePricings) && activePricings.length > 0) {
    const found = activePricings.find((p) => {
      const pRoomId = p.roomId ?? p.RoomId;
      const pRoomType = String(p.roomType || p.RoomType || "").trim().toUpperCase();
      const pSeatType = String(p.seatType || p.SeatType || "").trim().toLowerCase();
      const pDayType = String(p.dayType || p.DayType || "").trim().toLowerCase();
      const matchRoom = pRoomId
        ? String(pRoomId) === String(showtimeRoomId)
        : (!pRoomType || pRoomType === roomType);
      const matchSeat = !pSeatType || pSeatType.includes(seatCategory);
      const matchDay = !pDayType || pDayType === (isWeekend ? "weekend" : "weekday");
      return matchRoom && matchSeat && matchDay;
    });

    if (found) {
      calculatedPrice = Number(found.price || found.Price);
    }
  }

  // BÁO LỖI NẾU KHÔNG TÌM THẤY BẢNG GIÁ, KHÔNG ĐƯỢC TỰ ĐỘNG ĐỂ GIÁ BẰNG 0
  if (!calculatedPrice || isNaN(calculatedPrice) || calculatedPrice <= 0) {
    throw new Error(`Không tìm thấy bảng giá áp dụng cho phòng ${roomType || "chưa xác định"} và loại ghế ${seatCategory}!`);
  }

  // Đối với ghế Couple, giá trong bảng giá là giá của CẢ CẶP GHE (2 ghế).
  // Vì mỗi ghế trong cặp (VD: H13, H14) được đếm riêng trong danh sách ghế đã chọn,
  // nên đơn giá từng ghế đơn = giá cặp / 2 để tổng 2 ghế bằng đúng giá cả cặp.
  if (isCouple && calculatedPrice > 0) {
    return Math.round(calculatedPrice / 2);
  }

  return calculatedPrice;
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
        return { comboId: id, quantity: Number(combo.quantity), selectedComponents: combo.selectedComponents || [] };
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

  const queryDate = searchParams.get("date") || searchParams.get("showDate");
  const dateParam =
    queryDate ||
    bookingState.selectedDateIso ||
    bookingState.date ||
    bookingState.showDate ||
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
  const [comboSelections, setComboSelections] = useState({});

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
        if (!selectedCinemaId) return;
        const data = await getCombos(selectedCinemaId);

        const normalized = data.map((item, index) => {
          const rawComboId = item?.comboId ?? item?.ComboId ?? null;
          const rawFoodId = item?.foodId ?? item?.FoodId ?? null;
          const isCombo = (rawComboId !== null && rawFoodId === null) || String(item?.type).toLowerCase() === "combo" || !!item?.comboName || !!item?.ComboName || (item?.category && String(item.category).toLowerCase().includes("combo"));
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
            quantityAvailable: Number(item?.quantity ?? item?.Quantity ?? 0),
            isAvailable: Boolean(item?.isAvailable ?? item?.IsAvailable),
            drinkSlotCount: Number(item?.drinkSlotCount ?? item?.DrinkSlotCount ?? 0),
            popcornSlotCount: Number(item?.popcornSlotCount ?? item?.PopcornSlotCount ?? 0),
            allowedItems: item?.foodItems ?? item?.FoodItems ?? [],
          };
        });

        setCombos(normalized);
      } catch (err) {
        console.error("Không tải được danh sách combo:", err);
        setCombos([]);
      }
    }

    loadCombos();
    window.addEventListener("focus", loadCombos);
    return () => window.removeEventListener("focus", loadCombos);
  }, [selectedCinemaId]);

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
        // Chờ bảng giá Backend trước khi hiển thị sơ đồ ghế.
        const pricingData = await fetchActiveTicketPricings();
        localStorage.setItem("active_ticket_pricings", JSON.stringify(pricingData));

        const data = await loadBookingInitialData({
          movieParam,
          showtimeParam,
          dateParam,
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
    const refreshLayout = (event) => {
      const changedRoomId = event?.detail?.roomId;
      if (!changedRoomId || String(changedRoomId) === String(getShowtimeRoomId(selectedShowtime))) {
        fetchSeatsForShowtime();
      }
    };
    window.addEventListener("seatLayoutUpdated", refreshLayout);
    return () => window.removeEventListener("seatLayoutUpdated", refreshLayout);
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

  useEffect(() => {
    try {
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      const myId = String(userObj.id || userObj.userId || userObj.email || "GUEST_SESSION");
      const activeShowtimeId = String(selectedShowtime?.showtimeId ?? selectedShowtime?.ShowtimeId ?? selectedShowtime?.id ?? selectedShowtime?.Id ?? "");
      const activeDate = selectedShowtime?.showDate || selectedShowtime?.date || selectedDateIso || "";
      const activeTime = selectedShowtime?.startTime || selectedShowtime?.time || "";

      const holdingMap = JSON.parse(localStorage.getItem("holding_seats") || "{}");
      const now = Date.now();

      Object.keys(holdingMap).forEach(key => {
        const item = holdingMap[key];
        if (item && String(item.heldBy) === myId && String(item.showtimeId) === activeShowtimeId) {
          delete holdingMap[key];
        }
      });

      selectedSeats.forEach(seat => {
        const seatId = String(getSeatId(seat));
        const seatRow = String(getSeatRow(seat)).toUpperCase();
        const seatNum = String(getSeatNumber(seat));
        const seatCode = (seatRow && seatNum && seatNum !== "0") ? `${seatRow}${seatNum}` : String(getSeatCode(seat)).toUpperCase();
        
        const key = `${activeShowtimeId}_${seatCode}`;
        holdingMap[key] = {
          seatId,
          seatCode,
          showtimeId: activeShowtimeId,
          date: activeDate,
          time: activeTime,
          heldBy: myId,
          heldAt: now
        };
      });

      localStorage.setItem("holding_seats", JSON.stringify(holdingMap));
    } catch (e) {}
  }, [selectedSeats, selectedShowtime, selectedDateIso]);

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

  async function handleCoupleSeatClick(firstSeat, secondSeat) {
    const pair = [firstSeat, secondSeat].filter(Boolean);
    if (pair.length !== 2) return;
    const groupId = getCoupleGroupId(firstSeat);
    if (!groupId || String(groupId) !== String(getCoupleGroupId(secondSeat))) return;
    if (pair.some((seat) => !isSeatAvailable(seat, availableSeats))) return;

    const ids = pair.map(getSeatId);
    const pairSelected = ids.every((id) => selectedSeats.some((s) => String(getSeatId(s)) === String(id)));
    setLoadingSeats(true);
    try {
      if (pairSelected) {
        for (const id of ids) {
          const holdKey = holdKeysRef.current[id];
          if (holdKey) await releaseSeat(holdKey);
          delete holdKeysRef.current[id];
        }
        setSelectedSeats((prev) => prev.filter((s) => !ids.some((id) => String(getSeatId(s)) === String(id))));
        return;
      }

      const showtimeId = getShowtimeId(selectedShowtime);
      const newlyHeld = [];
      try {
        for (const seat of pair) {
          const id = getSeatId(seat);
          const data = await holdSeat(showtimeId, id);
          const holdKey = data?.holdKey || data?.HoldKey || data;
          if (holdKey) holdKeysRef.current[id] = holdKey;
          newlyHeld.push(id);
        }
      } catch (error) {
        for (const id of newlyHeld) {
          const holdKey = holdKeysRef.current[id];
          if (holdKey) await releaseSeat(holdKey).catch(() => {});
          delete holdKeysRef.current[id];
        }
        throw error;
      }
      setSelectedSeats((prev) => [...prev.filter((s) => !ids.some((id) => String(getSeatId(s)) === String(id))), ...pair]);
      setTimeLeft(300);
      setIsHoldActive(true);
    } catch (err) {
      console.error("Không thể giữ cặp ghế Couple:", err);
      alert("Cặp ghế này đã được giữ, đã bán hoặc không còn hoạt động!");
    } finally {
      setLoadingSeats(false);
    }
  }

  const updateComboQuantity = (comboId, delta) => {
    setComboQuantities((prev) => {
      const currentQuantity = prev[comboId] || 0;
      const nextQuantity = Math.max(0, currentQuantity + delta);
      const combo = combos.find(x => x.id === comboId);
      if (combo?._isCombo) {
        const drinkCount = nextQuantity * combo.drinkSlotCount;
        const popcornCount = nextQuantity * combo.popcornSlotCount;
        setComboSelections(current => {
          const existing = current[comboId] || [];
          const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
          const drinks = existing.filter(x => normalize(x.category).includes('nuoc')).slice(0, drinkCount);
          const popcorns = existing.filter(x => normalize(x.category).includes('bap')).slice(0, popcornCount);
          while (drinks.length < drinkCount) drinks.push({foodId:null,category:'Nước Uống',quantity:1});
          while (popcorns.length < popcornCount) popcorns.push({foodId:null,category:'Bắp Rang',quantity:1});
          return {...current,[comboId]:[...drinks,...popcorns]};
        });
      }

      return {
        ...prev,
        [comboId]: nextQuantity,
      };
    });
  };

  const updateComboSelection = (comboId, slotIndex, foodId) => {
    const combo = combos.find(x => x.id === comboId);
    const food = combo?.allowedItems?.find(x => Number(x.foodId ?? x.FoodId) === Number(foodId));
    setComboSelections(current => ({...current, [comboId]:(current[comboId] || []).map((x,i) => i === slotIndex ? {
      foodId:Number(foodId), foodName:food?.foodName ?? food?.FoodName, category:food?.category ?? food?.Category, quantity:1
    } : x)}));
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
          selectedComponents: Object.values((comboSelections[combo.id] || []).filter(x => x.foodId).reduce((a,x) => { const k=String(x.foodId); a[k]=a[k]?{...a[k],quantity:a[k].quantity+1}:x; return a; }, {})),
        };
      })
      .filter((combo) => combo.quantity > 0);
  }, [combos, comboQuantities, comboSelections]);

  const totalAmount = useMemo(() => {
    return selectedSeats.reduce(
      (sum, seat) => {
        try {
          return sum + getSeatPrice(seat, selectedShowtime, rooms);
        } catch (e) {
          console.warn("Lỗi tính giá ghế:", e);
          return sum;
        }
      },
      0
    );
  }, [selectedSeats, selectedShowtime, rooms]);

  const [couponInput, setCouponInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState("");
  const [discountSuccess, setDiscountSuccess] = useState("");
  const [availableDiscounts, setAvailableDiscounts] = useState(() => {
    return getStoredDiscounts().filter((d) => d.isActive !== false);
  });
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  useEffect(() => {
    async function loadDiscounts() {
      const role = localStorage.getItem("role") || "";
      if (role === "Admin") {
        try {
          const list = await getDiscountList();
          if (Array.isArray(list) && list.length > 0) {
            const activeList = list.filter((d) => d.isActive !== false);
            setAvailableDiscounts(activeList);
            return;
          }
        } catch (err) {}
      }
      const stored = getStoredDiscounts().filter((d) => d.isActive !== false);
      setAvailableDiscounts(stored);
    }

    loadDiscounts();

    function handleSync() {
      const stored = getStoredDiscounts().filter((d) => d.isActive !== false);
      setAvailableDiscounts(stored);
    }

    window.addEventListener("storage", handleSync);
    window.addEventListener("discountsUpdated", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("discountsUpdated", handleSync);
    };
  }, []);

  const totalCombosAmount = useMemo(() => {
    return selectedCombos.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );
  }, [selectedCombos]);

  const rawTotalAmount = useMemo(() => {
    return totalAmount + totalCombosAmount;
  }, [totalAmount, totalCombosAmount]);

  const discountAmount = useMemo(() => {
    if (!appliedDiscount || rawTotalAmount <= 0) return 0;

    const minOrder = Number(appliedDiscount.minOrderAmount || 0);
    if (minOrder > 0 && rawTotalAmount < minOrder) {
      return 0;
    }

    // Determine applicable base amount according to Admin Scope
    let applicableBase = rawTotalAmount;
    const scope = (appliedDiscount.scope || "").toLowerCase();
    if (scope.includes("vé") || scope.includes("film") || scope.includes("phim")) {
      applicableBase = totalAmount;
    } else if (scope.includes("đồ ăn") || scope.includes("combo") || scope.includes("thức ăn")) {
      applicableBase = totalCombosAmount;
    }

    if (applicableBase <= 0) return 0;

    let calc = 0;
    if (appliedDiscount.discountType === "Percent") {
      calc = (applicableBase * Number(appliedDiscount.discountValue || 0)) / 100;
      const maxAmt = Number(appliedDiscount.maxDiscountAmount || 0);
      if (maxAmt > 0) {
        calc = Math.min(calc, maxAmt);
      }
    } else {
      calc = Number(appliedDiscount.discountValue || 0);
    }

    return Math.min(calc, applicableBase);
  }, [appliedDiscount, rawTotalAmount, totalAmount, totalCombosAmount]);

  const finalTotalAmount = useMemo(() => {
    return Math.max(0, rawTotalAmount - discountAmount);
  }, [rawTotalAmount, discountAmount]);

  function handleApplyCoupon(inputCode) {
    const code = (inputCode || couponInput).trim().toUpperCase();
    setDiscountError("");
    setDiscountSuccess("");

    if (!code) {
      setDiscountError("Vui lòng nhập mã giảm giá.");
      return;
    }

    const disc = availableDiscounts.find(
      (d) => (d.discountCode || "").toUpperCase() === code
    );

    if (!disc) {
      setDiscountError(`Mã giảm giá "${code}" không tồn tại hoặc đã hết hạn.`);
      return;
    }

    if (disc.isActive === false) {
      setDiscountError(`Mã giảm giá "${code}" hiện đang bị tạm dừng.`);
      return;
    }

    // Kiểm tra số lượt sử dụng toàn hệ thống
    if (disc.maxUsageTotal > 0 && (disc.usedCount || 0) >= disc.maxUsageTotal) {
      setDiscountError(`Mã giảm giá "${code}" đã hết tổng lượt sử dụng trên hệ thống.`);
      return;
    }

    // Kiểm tra số lượt tối đa mỗi khách hàng được sử dụng
    const maxPerUser = Number(disc.maxUsagePerUser ?? disc.MaxUsagePerUser ?? disc.limitPerUser ?? 1);
    if (maxPerUser > 0) {
      let userUsageCount = 0;
      try {
        const userObj = JSON.parse(localStorage.getItem("user") || "{}");
        const userEmail = String(userObj.email || userObj.Email || userObj.username || "").toLowerCase();
        
        const localDiscounts = JSON.parse(localStorage.getItem("customer_ticket_discounts") || "{}");
        const localTickets = JSON.parse(localStorage.getItem("rapchieuphim_tickets") || "[]");
        const usedVoucherLogs = JSON.parse(localStorage.getItem("used_voucher_records") || "[]");

        const countedTicketCodes = new Set();

        // Count in customer_ticket_discounts
        Object.values(localDiscounts).forEach(info => {
          if (info && (info.discountCode || "").toUpperCase() === code) {
            const infoEmail = String(info.email || "").toLowerCase();
            if (!userEmail || !infoEmail || infoEmail === userEmail) {
              const key = info.ticketCode || info.bookingId;
              if (key) countedTicketCodes.add(key);
              else userUsageCount++;
            }
          }
        });

        // Count in rapchieuphim_tickets
        if (Array.isArray(localTickets)) {
          localTickets.forEach(t => {
            const tCode = (t.discountCode || t.appliedDiscount?.discountCode || "").toUpperCase();
            const tStatus = String(t.status || "").toLowerCase();
            if (tCode === code && !tStatus.includes("cancel") && !tStatus.includes("hủy")) {
              const tEmail = String(t.email || "").toLowerCase();
              if (!userEmail || !tEmail || tEmail === userEmail) {
                const key = t.ticketCode || t.bookingId;
                if (key) countedTicketCodes.add(key);
                else userUsageCount++;
              }
            }
          });
        }

        // Count in usedVoucherLogs
        if (Array.isArray(usedVoucherLogs)) {
          usedVoucherLogs.forEach(v => {
            if ((v.discountCode || "").toUpperCase() === code) {
              const vEmail = String(v.email || v.userId || "").toLowerCase();
              if (!userEmail || !vEmail || vEmail === userEmail) {
                userUsageCount++;
              }
            }
          });
        }

        userUsageCount += countedTicketCodes.size;
      } catch (e) {}

      if (userUsageCount >= maxPerUser) {
        setDiscountError(
          `Mã giảm giá "${code}" chỉ được sử dụng tối đa ${maxPerUser} lần cho mỗi tài khoản. Bạn đã dùng mã này rồi!`
        );
        return;
      }
    }

    const now = new Date();
    if (disc.startDate && new Date(disc.startDate) > now) {
      setDiscountError(`Mã giảm giá "${code}" chưa đến thời gian áp dụng.`);
      return;
    }

    if (disc.endDate && new Date(disc.endDate) < now) {
      setDiscountError(`Mã giảm giá "${code}" đã hết hạn sử dụng.`);
      return;
    }

    const minOrder = Number(disc.minOrderAmount || 0);
    if (minOrder > 0 && rawTotalAmount < minOrder) {
      setDiscountError(
        `Mã "${code}" chỉ áp dụng cho đơn hàng từ ${minOrder.toLocaleString("vi-VN")}đ trở lên.`
      );
      return;
    }

    // Kiểm tra phạm vi dịch vụ
    const scope = (disc.scope || "").toLowerCase();
    if ((scope.includes("vé") || scope.includes("phim")) && totalAmount <= 0) {
      setDiscountError(`Mã "${code}" chỉ áp dụng khi có đặt Vé xem phim.`);
      return;
    }
    if ((scope.includes("đồ ăn") || scope.includes("combo")) && totalCombosAmount <= 0) {
      setDiscountError(`Mã "${code}" chỉ áp dụng khi mua Đồ ăn & Combo.`);
      return;
    }

    setAppliedDiscount(disc);
    setDiscountSuccess(`Áp dụng thành công mã "${code}"!`);
    setShowVoucherModal(false);
  }

  function handleRemoveCoupon() {
    setAppliedDiscount(null);
    setCouponInput("");
    setDiscountError("");
    setDiscountSuccess("");
  }

  const groupedSeats = groupSeatsByRow(allSeats);
  const rowsKeys = Object.keys(groupedSeats).sort();

  function handleCheckout() {
    if (!isSellingTime()) {
      alert(SELLING_TIME_MESSAGE);
      return;
    }
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
    if (!isSellingTime()) {
      alert(SELLING_TIME_MESSAGE);
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

      // Dùng kết quả tiền do Backend tính; không tính lại ở trang thanh toán.
      const backendSummaries = bookingResults.map(result => result?.data ?? result ?? {});
      const backendTicketTotal = backendSummaries.reduce(
        (sum, item) => sum + Number(item.ticketTotal ?? item.TicketTotal ?? 0), 0
      );
      const backendDiscountAmount = backendSummaries.reduce(
        (sum, item) => sum + Number(item.discountAmt ?? item.DiscountAmt ?? 0), 0
      );
      const backendFinalAmount = backendSummaries.reduce(
        (sum, item) => sum + Number(
          item.finalAmount ?? item.FinalAmount ?? item.grandTotal ?? item.GrandTotal ?? 0
        ), 0
      );


      // Giải phóng thông tin giữ ghế cục bộ
      holdKeysRef.current = {};
      setIsHoldActive(false);
      
      // Navigate to separate payment page
      navigate("/payment", {
        state: {
          bookingIds: bookedIds.map(Number),
          totalAmount: backendFinalAmount || finalTotalAmount,
          finalAmount: backendFinalAmount || finalTotalAmount,
          rawTotalAmount: backendTicketTotal || rawTotalAmount,
          discountAmount: backendDiscountAmount,
          appliedDiscount,
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
    handleCoupleSeatClick,
    isSeatHeldByOther,
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
    comboSelections, setComboSelections, updateComboSelection,
    handleConfirmBooking,

    // Customer Coupon states
    couponInput,
    setCouponInput,
    appliedDiscount,
    discountAmount,
    discountError,
    discountSuccess,
    availableDiscounts,
    showVoucherModal,
    setShowVoucherModal,
    handleApplyCoupon,
    handleRemoveCoupon,
  };
}

export function getCoupleGroupId(seat) {
  return seat?.coupleGroupId ?? seat?.CoupleGroupId ?? null;
}
