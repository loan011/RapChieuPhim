import { useEffect, useState, useMemo } from "react";

import {
  getShowtimeList,
  createShowtime,
  updateShowtime,
  deleteShowtime,
} from "./showtimeService";

import { getMovieList } from "../Film/movieService";
import { getRoomList } from "../Room/roomService";
import { getCinemaList } from "../Cinema/cinemaService";

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════ */

export const STATUS_OPTIONS = [
  "Đang chiếu",
  "Sắp chiếu",
  "Chiếu sớm",
  "Đã chiếu"
];

export const EMPTY_FORM = {
  cinemaId: "",
  movieId: "",
  roomId: "",
  showDate: "",
  startHour: "",
  endHour: "",
  status: "Đang chiếu",
};

export const CALENDAR_HOURS = Array.from({ length: 17 }, (_, i) => i + 7);
// 7h -> 23h

/* ═══════════════════════════════════════════════════════════
   PURE HELPER FUNCTIONS
═══════════════════════════════════════════════════════════ */

export function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  return [];
}

/* ── ID helpers ── */

export function getShowtimeId(s) {
  return (
    s?.showTimeId ??
    s?.ShowTimeId ??
    s?.showtimeId ??
    s?.ShowtimeId ??
    s?.id ??
    s?.Id
  );
}

export function getMovieId(m) {
  return m?.movieId ?? m?.MovieId ?? m?.id ?? m?.Id;
}

export function getRoomId(r) {
  return r?.roomId ?? r?.RoomId ?? r?.id ?? r?.Id;
}

export function getCinemaId(c) {
  return c?.cinemaId ?? c?.CinemaId ?? c?.id ?? c?.Id;
}

/* ── Name helpers ── */

export function getMovieTitle(m) {
  return (
    m?.title ??
    m?.Title ??
    m?.movieTitle ??
    m?.MovieTitle ??
    m?.name ??
    m?.Name ??
    "Chưa có tên phim"
  );
}

/**
 * Trả về thời lượng phim (phút) dưới dạng số, hoặc null nếu không có.
 */
export function getMovieDurationMinutes(m) {
  const raw =
    m?.duration ??
    m?.Duration ??
    m?.durationMinutes ??
    m?.DurationMinutes ??
    m?.runningTime ??
    m?.RunningTime;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

/**
 * Kiểm tra xem phim có đang chiếu hoặc sắp chiếu hay không.
 * Loại bỏ các phim có trạng thái "Đã chiếu" hoặc ngày kết thúc (endDate) đã trôi qua.
 */
export function isMovieNowOrUpcoming(m) {
  if (!m) return false;
  let status = (m?.status ?? m?.Status ?? "").toLowerCase().trim();

  if (
    status.includes("đã chiếu") ||
    status.includes("completed") ||
    status.includes("ngừng") ||
    status.includes("hủy") ||
    status.includes("kết thúc")
  ) {
    return false;
  }

  const endDateValue = m?.endDate ?? m?.EndDate ?? m?.endTime ?? m?.EndTime;
  if (endDateValue) {
    const endDate = new Date(endDateValue);
    endDate.setHours(23, 59, 59, 999);
    if (!Number.isNaN(endDate.getTime()) && endDate < new Date()) {
      return false;
    }
  }

  if (
    !status ||
    status.includes("đang chiếu") ||
    status.includes("sắp chiếu") ||
    status.includes("chiếu sớm") ||
    status.includes("active")
  ) {
    return true;
  }

  return false;
}

/**
 * Kiểm tra xem phim có thể được hiển thị/chọn tại thời điểm ngày chiếu đang xét hay không.
 * Nếu phim sắp chiếu, chỉ được hiển thị khi ngày chiếu cách ngày khởi chiếu tối đa 4 ngày.
 */
export function isMovieSelectable(movie, referenceDateStr) {
  if (!isMovieNowOrUpcoming(movie)) return false;

  const relDateVal = movie.releaseDate ?? movie.ReleaseDate ?? movie.startDate ?? movie.StartDate;
  if (relDateVal) {
    const releaseDate = parseDateOnly(relDateVal);
    const showDate = parseDateOnly(referenceDateStr || new Date());
    const daysDiff = (releaseDate.getTime() - showDate.getTime()) / (1000 * 3600 * 24);
    
    // Nếu ngày xem xét (showDate) trước ngày khởi chiếu (daysDiff > 0)
    // thì chỉ cho phép nếu khoảng cách tối đa là 4 ngày
    if (daysDiff > 0 && Math.round(daysDiff) > 4) {
      return false;
    }
  }
  return true;
}

/**
 * Tính giờ kết thúc (HH:mm) từ giờ bắt đầu và số phút.
 * @param {string} startHour  - "HH:mm"
 * @param {number} durationMin - số phút
 * @returns {string} "HH:mm"
 */
export function calcEndHour(startHour, durationMin) {
  if (!startHour || !durationMin) return "";
  const [hStr, mStr] = startHour.split(":");
  const totalMins = Number(hStr) * 60 + Number(mStr) + Number(durationMin);
  const endH = Math.floor(totalMins / 60) % 24;
  const endM = totalMins % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

export function getRoomName(r) {
  return r?.roomName ?? r?.RoomName ?? r?.name ?? r?.Name ?? "Chưa có phòng";
}

export function getCinemaName(c) {
  return (
    c?.cinemaName ??
    c?.CinemaName ??
    c?.name ??
    c?.Name ??
    "Chi nhánh"
  );
}

/* ── Showtime relation helpers ── */

export function getShowtimeMovieId(s) {
  return (
    s?.movieId ??
    s?.MovieId ??
    s?.movie?.movieId ??
    s?.movie?.MovieId ??
    s?.Movie?.movieId ??
    s?.Movie?.MovieId
  );
}

export function getShowtimeRoomId(s) {
  return (
    s?.roomId ??
    s?.RoomId ??
    s?.room?.roomId ??
    s?.room?.RoomId ??
    s?.Room?.roomId ??
    s?.Room?.RoomId
  );
}

export function getShowtimeMovieTitle(s, movies) {
  const direct =
    s?.movieTitle ??
    s?.MovieTitle ??
    s?.movie?.title ??
    s?.movie?.Title ??
    s?.Movie?.title ??
    s?.Movie?.Title;

  if (direct) return direct;

  const mid = getShowtimeMovieId(s);

  if (mid) {
    const found = movies.find((m) => String(getMovieId(m)) === String(mid));
    if (found) return getMovieTitle(found);
  }

  return "Chưa có phim";
}

export function getShowtimeRoomName(s, rooms) {
  const direct =
    s?.roomName ??
    s?.RoomName ??
    s?.room?.roomName ??
    s?.room?.RoomName ??
    s?.Room?.roomName ??
    s?.Room?.RoomName;

  if (direct) return direct;

  const rid = getShowtimeRoomId(s);

  if (rid) {
    const found = rooms.find((r) => String(getRoomId(r)) === String(rid));
    if (found) return getRoomName(found);
  }

  return "Chưa có phòng";
}

/* ── DateTime helpers ── */

export function getShowDate(s) {
  const d = s?.showDate ?? s?.ShowDate;

  if (d) return String(d).split("T")[0];

  const st = s?.startTime ?? s?.StartTime ?? "";

  return String(st).includes("T") ? String(st).split("T")[0] : "";
}

export function getStartHour(s) {
  const v = s?.startTime ?? s?.StartTime ?? "";

  if (!v) return "";

  return String(v).includes("T")
    ? String(v).split("T")[1]?.slice(0, 5) || ""
    : String(v).slice(0, 5);
}

export function getEndHour(s) {
  const v = s?.endTime ?? s?.EndTime ?? "";

  if (!v) return "";

  return String(v).includes("T")
    ? String(v).split("T")[1]?.slice(0, 5) || ""
    : String(v).slice(0, 5);
}

export function getBasePrice(s) {
  return s?.basePrice ?? s?.BasePrice ?? s?.price ?? s?.Price ?? 0;
}

export function formatMoney(value) {
  const n = Number(value);
  return Number.isNaN(n) ? "0 đ" : `${n.toLocaleString("vi-VN")} đ`;
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";

  const clean = String(dateStr).split("T")[0];
  const [y, m, d] = clean.split("-");

  if (!y || !m || !d) return clean;

  return `${d}/${m}/${y}`;
}

export function toDateInputValue(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

export function parseDateOnly(value) {
  if (!value) return new Date();

  const [y, m, d] = String(value).split("-").map(Number);

  return new Date(y, m - 1, d);
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);

  return d;
}

export function getWeekStartSunday(dateValue = new Date()) {
  const d = new Date(dateValue);

  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());

  return d;
}

export function formatCalendarHour(hour) {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";

  return `${hour - 12} PM`;
}

/* ── Status helper ── */

export function getStatus(s) {
  const raw = s?.status ?? s?.Status ?? "";

  const dateStr = getShowDate(s);
  const startStr = getStartHour(s);

  if (dateStr && startStr) {
    const startDt = new Date(`${dateStr}T${startStr}:00`);
    if (!Number.isNaN(startDt.getTime())) {
      const cutoffDt = new Date(startDt.getTime() + 5 * 60 * 1000);
      if (cutoffDt < new Date()) {
        return "Đã chiếu";
      }
    }
  } else if (dateStr) {
    const endStr = getEndHour(s);
    const endDt = new Date(
      endStr ? `${dateStr}T${endStr}:00` : `${dateStr}T23:59:00`
    );

    if (!Number.isNaN(endDt.getTime()) && endDt < new Date()) {
      return "Đã chiếu";
    }
  }

  if (raw === "Completed" || raw === "Đã chiếu") return "Đã chiếu";

  if (
    raw === "Active" ||
    raw === "Đang chiếu" ||
    raw === "Đang bán"
  ) {
    return "Đang chiếu";
  }

  if (
    raw === "Cancelled" ||
    raw === "Ngưng chiếu" ||
    raw === "Hủy" ||
    raw === "Hết vé"
  ) {
    return "Đã chiếu";
  }

  if (raw === "Chiếu sớm") return "Chiếu sớm";

  if (raw === "Sắp chiếu" || raw === "Chưa mở bán") return "Sắp chiếu";

  return "Sắp chiếu";
}

/* ── Form helpers ── */

export function buildFormFromShowtime(s) {
  return {
    movieId: getShowtimeMovieId(s) ?? "",
    roomId: getShowtimeRoomId(s) ?? "",
    showDate: getShowDate(s),
    startHour: getStartHour(s),
    endHour: getEndHour(s),
    basePrice: getBasePrice(s),
    status: getStatus(s),
  };
}

export function validateShowtimeForm(form, movies) {
  if (!form.cinemaId) return "Vui lòng chọn chi nhánh/khu vực.";
  if (!form.movieId) return "Vui lòng chọn phim.";
  if (!form.roomId) return "Vui lòng chọn phòng chiếu.";
  if (!form.showDate) return "Vui lòng chọn ngày chiếu.";
  if (!form.startHour) return "Vui lòng chọn giờ bắt đầu.";
  if (!form.endHour) return "Vui lòng chọn giờ kết thúc.";

  if (movies && form.movieId) {
    const movie = movies.find((m) => String(getMovieId(m)) === String(form.movieId));
    if (movie) {
      const releaseDateRaw = movie.releaseDate ?? movie.ReleaseDate ?? movie.startDate ?? movie.StartDate;
      if (releaseDateRaw) {
        const releaseDate = parseDateOnly(releaseDateRaw);
        const showDate = parseDateOnly(form.showDate);
        
        const daysDiff = (releaseDate.getTime() - showDate.getTime()) / (1000 * 3600 * 24);
        
        if (daysDiff > 0 && Math.round(daysDiff) > 4) {
          return "Chỉ được tạo suất chiếu sớm tối đa 4 ngày trước ngày khởi chiếu!";
        }
      }
    }
  }

  return "";
}

/**
 * Kiểm tra liệu suất chiếu có qua nửa đêm không.
 * @param {string} startHour - "HH:mm"
 * @param {string} endHour   - "HH:mm"
 */
export function isCrossMidnight(startHour, endHour) {
  if (!startHour || !endHour) return false;
  const toMins = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  return toMins(endHour) <= toMins(startHour);
}

export function buildShowtimePayload(form) {
  const STATUS_TO_API = {
    "Đang chiếu": "Active",
    "Sắp chiếu": "Active",
    "Chiếu sớm": "Active",
    "Đã chiếu": "Completed",
  };

  /* Nếu kết thúc qua nửa đêm → endDate = showDate + 1 ngày */
  const crossMidnight = isCrossMidnight(form.startHour, form.endHour);
  const endDate = crossMidnight
    ? toDateInputValue(addDays(parseDateOnly(form.showDate), 1))
    : form.showDate;

  return {
    movieId: Number(form.movieId),
    roomId: Number(form.roomId),
    showDate: form.showDate,
    startTime: form.startHour,
    endTime: form.endHour,
    endDate,                      /* ngày kết thúc (có thể là hôm sau) */
    status: STATUS_TO_API[form.status] ?? form.status,
    basePrice: Number(form.basePrice || 70000),
  };
}

/* ═══════════════════════════════════════════════════════════
   INTERNAL HELPERS
═══════════════════════════════════════════════════════════ */

export function getRoomCinemaId(room) {
  return String(
    room?.cinemaId ??
      room?.CinemaId ??
      room?.cinema?.cinemaId ??
      room?.cinema?.CinemaId ??
      room?.Cinema?.cinemaId ??
      room?.Cinema?.CinemaId ??
      ""
  );
}

function getRoomCinemaName(room) {
  return (
    room?.cinemaName ??
    room?.CinemaName ??
    room?.cinema?.cinemaName ??
    room?.cinema?.CinemaName ??
    room?.Cinema?.cinemaName ??
    room?.Cinema?.CinemaName ??
    ""
  );
}

function getShowtimeCinemaId(showtime, rooms) {
  const directCinemaId =
    showtime?.cinemaId ??
    showtime?.CinemaId ??
    showtime?.room?.cinemaId ??
    showtime?.room?.CinemaId ??
    showtime?.Room?.cinemaId ??
    showtime?.Room?.CinemaId;

  if (directCinemaId) return String(directCinemaId);

  const rid = getShowtimeRoomId(showtime);
  const room = rooms.find((r) => String(getRoomId(r)) === String(rid));

  return room ? getRoomCinemaId(room) : "";
}

/* ═══════════════════════════════════════════════════════════
   BATCH SHOWTIME GENERATOR HELPERS
═══════════════════════════════════════════════════════════ */

export const WEEKDAY_OPTIONS = [
  { id: 1, label: "Thứ 2" },
  { id: 2, label: "Thứ 3" },
  { id: 3, label: "Thứ 4" },
  { id: 4, label: "Thứ 5" },
  { id: 5, label: "Thứ 6" },
  { id: 6, label: "Thứ 7" },
  { id: 0, label: "Chủ Nhật" },
];

export const EMPTY_BATCH_FORM = {
  cinemaId: "",
  roomId: "",
  movieId: "",
  fromDate: "",
  toDate: "",
  selectedWeekdays: [1, 2, 3, 4, 5, 6, 0],
  adTime: 10,
  cleanTime: 15,
  startTimes: ["09:00", "12:00", "15:00", "18:00", "21:00"],
  basePrice: 70000,
  status: "Đang chiếu",
};

export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = String(timeStr).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function getVietnameseDayOfWeek(dateObj) {
  const day = dateObj.getDay();
  if (day === 0) return "Chủ Nhật";
  return `Thứ ${day + 1}`;
}

export function generateBatchShowtimes(batchForm, movies, rooms, existingList) {
  if (!batchForm.cinemaId || !batchForm.roomId || !batchForm.movieId) return [];
  if (!batchForm.fromDate || !batchForm.toDate) return [];
  if (!batchForm.startTimes || batchForm.startTimes.length === 0) return [];
  if (!batchForm.selectedWeekdays || batchForm.selectedWeekdays.length === 0) return [];

  const selectedMovie = movies.find(
    (m) => String(getMovieId(m)) === String(batchForm.movieId)
  );
  const movieDur = getMovieDurationMinutes(selectedMovie) || 120;
  const adTime = Number(batchForm.adTime || 0);
  const cleanTime = Number(batchForm.cleanTime || 0);
  const totalShowMins = movieDur + adTime + cleanTime;

  const startD = parseDateOnly(batchForm.fromDate);
  const endD = parseDateOnly(batchForm.toDate);
  if (startD > endD) return [];

  const generated = [];
  const current = new Date(startD);

  while (current <= endD) {
    const dayOfWeek = current.getDay();
    if (batchForm.selectedWeekdays.includes(dayOfWeek)) {
      const dateStr = toDateInputValue(current);
      const dayName = getVietnameseDayOfWeek(current);

      batchForm.startTimes.forEach((sTime) => {
        if (!sTime) return;
        const eTime = calcEndHour(sTime, totalShowMins);
        const crossMid = isCrossMidnight(sTime, eTime);
        const endDateStr = crossMid
          ? toDateInputValue(addDays(current, 1))
          : dateStr;

        const startMins = timeToMinutes(sTime);
        const endMins = startMins + totalShowMins;

        generated.push({
          tempId: `batch_${dateStr}_${sTime}_${Math.random().toString(36).substring(2, 6)}`,
          cinemaId: batchForm.cinemaId,
          roomId: batchForm.roomId,
          movieId: batchForm.movieId,
          movieTitle: getMovieTitle(selectedMovie),
          showDate: dateStr,
          endDate: endDateStr,
          startHour: sTime,
          endHour: eTime,
          startMins,
          endMins,
          basePrice: Number(batchForm.basePrice || 70000),
          status: batchForm.status || "Đang chiếu",
          duration: movieDur,
          adTime,
          cleanTime,
          totalShowMins,
          dayName,
          crossMid,
          isConflict: false,
          conflictReason: "",
        });
      });
    }
    current.setDate(current.getDate() + 1);
  }

  // ── KIỂM TRA TRÙNG LỊCH (CONFLICT DETECTION) ──
  const existingInRoom = existingList.filter(
    (s) => String(getShowtimeRoomId(s)) === String(batchForm.roomId)
  );

  generated.forEach((item, idx) => {
    // 1. So sánh với các suất chiếu đã có trong CSDL (sử dụng đối tượng Date để xử lý chính xác qua ngày/qua đêm)
    for (const ex of existingInRoom) {
      const exStart = new Date(ex.startTime || ex.StartTime);
      const exEnd = new Date(ex.endTime || ex.EndTime);
      if (isNaN(exStart.getTime()) || isNaN(exEnd.getTime())) continue;

      // Cộng thêm 15 phút dọn phòng cho suất chiếu hiện có trên hệ thống (Clean time buffer)
      const exEndWithBuffer = new Date(exEnd.getTime() + 15 * 60 * 1000);

      const itemStart = new Date(`${item.showDate}T${item.startHour}:00`);
      const itemEnd = new Date(itemStart.getTime() + totalShowMins * 60 * 1000);

      if (itemStart < exEndWithBuffer && exStart < itemEnd) {
        item.isConflict = true;
        const exStartStr = getStartHour(ex);
        const exEndStr = getEndHour(ex);
        item.conflictReason = `Trùng với suất "${getShowtimeMovieTitle(ex, movies)}" (${exStartStr} - ${exEndStr}) đã có trên hệ thống!`;
        break;
      }
    }

    // 2. So sánh với các suất khác vừa sinh trong đợt này
    if (!item.isConflict) {
      const itemStart = new Date(`${item.showDate}T${item.startHour}:00`);
      const itemEnd = new Date(itemStart.getTime() + totalShowMins * 60 * 1000);

      for (let j = 0; j < generated.length; j++) {
        if (idx === j) continue;
        const other = generated[j];
        const otherStart = new Date(`${other.showDate}T${other.startHour}:00`);
        const otherEnd = new Date(otherStart.getTime() + totalShowMins * 60 * 1000);

        if (itemStart < otherEnd && otherStart < itemEnd) {
          item.isConflict = true;
          item.conflictReason = `Trùng giờ với suất ${other.startHour} - ${other.endHour} trong danh sách sinh tự động!`;
          break;
        }
      }
    }

    // 3. Kiểm tra ngày khởi chiếu (Suất chiếu sớm tối đa 4 ngày)
    if (!item.isConflict && selectedMovie) {
      const releaseDateRaw = selectedMovie.releaseDate ?? selectedMovie.ReleaseDate ?? selectedMovie.startDate ?? selectedMovie.StartDate;
      if (releaseDateRaw) {
        const releaseDate = parseDateOnly(releaseDateRaw);
        const showDate = parseDateOnly(item.showDate);
        
        const daysDiff = (releaseDate.getTime() - showDate.getTime()) / (1000 * 3600 * 24);
        if (daysDiff > 0 && Math.round(daysDiff) > 4) {
          item.isConflict = true;
          item.conflictReason = `Phim chỉ được tạo suất chiếu sớm tối đa 4 ngày trước ngày khởi chiếu (${formatDate(releaseDateRaw)})!`;
        }
      }
    }
  });

  return generated;
}

/* ═══════════════════════════════════════════════════════════
   useRate HOOK
═══════════════════════════════════════════════════════════ */

export function useRate() {
  /* ── Raw data ── */

  const [list, setList] = useState([]);
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [cinemas, setCinemas] = useState([]);

  /* ── Async status ── */

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ── Filter / selection state ── */

  const [selectedCinemaId, setSelectedCinemaId] = useState("");
  const [cinemaSearch, setCinemaSearch] = useState("");

  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [movieSearch, setMovieSearch] = useState("");

  const [filterStatus, setFilterStatus] = useState("Đang chiếu");
  const [filterDate, setFilterDate] = useState("");

  const [weekStart, setWeekStart] = useState(() =>
    toDateInputValue(getWeekStartSunday(new Date()))
  );

  /* ── Modal đơn lẻ ── */

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ── Modal Tạo Lịch Chiếu Hàng Loạt ── */
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchForm, setBatchForm] = useState(EMPTY_BATCH_FORM);
  const [batchError, setBatchError] = useState("");
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [excludedBatchIds, setExcludedBatchIds] = useState(new Set());
  const [newStartTimeInput, setNewStartTimeInput] = useState("");

  /* ── Fetch on mount ── */

  useEffect(() => {
    fetchData();
  }, []);

  /* ── Tự động tính Giờ Kết Thúc khi movieId hoặc startHour thay đổi ── */

  useEffect(() => {
    if (!form.movieId || !form.startHour) return;
    const selectedMovie = movies.find(
      (m) => String(getMovieId(m)) === String(form.movieId)
    );
    const dur = getMovieDurationMinutes(selectedMovie);
    if (!dur) return;
    const newEnd = calcEndHour(form.startHour, dur);
    if (newEnd && newEnd !== form.endHour) {
      setForm((prev) => ({ ...prev, endHour: newEnd }));
    }
  }, [form.movieId, form.startHour, movies]);

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const [showtimeData, movieData, roomData, cinemaData] =
        await Promise.all([
          getShowtimeList(),
          getMovieList(),
          getRoomList(),
          getCinemaList(),
        ]);

      const normalizedShowtimes = normalizeArray(showtimeData);
      const normalizedMovies = normalizeArray(movieData);
      const normalizedRooms = normalizeArray(roomData);
      const normalizedCinemas = normalizeArray(cinemaData);

      setList(normalizedShowtimes);
      setMovies(normalizedMovies);
      setRooms(normalizedRooms);
      setCinemas(normalizedCinemas);

      if (normalizedCinemas.length > 0) {
        const firstCinemaId = String(getCinemaId(normalizedCinemas[0]) ?? "");
        setSelectedCinemaId((prev) => prev || firstCinemaId);
      }
    } catch (err) {
      console.error("Lỗi tải dữ liệu lịch chiếu:", err);
      setError(err?.message || "Không tải được dữ liệu suất chiếu.");
      setList([]);
      setMovies([]);
      setRooms([]);
      setCinemas([]);
    } finally {
      setLoading(false);
    }
  }

  /* ── Modal đơn lẻ handlers ── */

  function openAddModal() {
    setEditId(null);
    setIsEditMode(true);
    setForm({
      ...EMPTY_FORM,
      cinemaId: selectedCinemaId || "",
    });
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(item) {
    const baseForm = buildFormFromShowtime(item);
    const rId = baseForm.roomId;
    const roomObj = rooms.find((r) => String(getRoomId(r)) === String(rId));
    const cId = roomObj ? getRoomCinemaId(roomObj) : selectedCinemaId || "";

    setEditId(getShowtimeId(item));
    setIsEditMode(false); // Mặc định hiển thị chế độ Xem Chi Tiết
    setForm({
      ...baseForm,
      cinemaId: cId || "",
    });
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setIsEditMode(false);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "cinemaId") {
      setForm((prev) => ({
        ...prev,
        cinemaId: value,
        roomId: "",
      }));
      return;
    }

    if (name === "movieId") {
      const selectedMovie = movies.find(
        (m) => String(getMovieId(m)) === String(value)
      );
      const dur = getMovieDurationMinutes(selectedMovie);
      setForm((prev) => {
        const newEnd = dur && prev.startHour
          ? calcEndHour(prev.startHour, dur)
          : prev.endHour;
        return { ...prev, movieId: value, endHour: newEnd };
      });
      return;
    }

    if (name === "startHour") {
      const selectedMovie = movies.find(
        (m) => String(getMovieId(m)) === String(form.movieId)
      );
      const dur = getMovieDurationMinutes(selectedMovie);
      setForm((prev) => {
        const newEnd = dur && value ? calcEndHour(value, dur) : prev.endHour;
        return { ...prev, startHour: value, endHour: newEnd };
      });
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    const err = validateShowtimeForm(form, movies);

    if (err) {
      setFormError(err);
      return;
    }

    try {
      setSubmitting(true);

      const payload = buildShowtimePayload(form);

      if (editId !== null) {
        await updateShowtime(editId, payload);
      } else {
        await createShowtime(payload);
      }

      closeModal();
      fetchData();
    } catch (err) {
      console.error("Lỗi lưu lịch chiếu:", err);
      setFormError(err?.message || "Lưu suất chiếu thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!id) {
      alert("Không tìm thấy ID suất chiếu.");
      return;
    }

    if (!window.confirm("Bạn có chắc muốn xóa suất chiếu này?")) return;

    try {
      await deleteShowtime(id);
      fetchData();
    } catch (err) {
      alert(err?.message || "Xóa suất chiếu thất bại.");
    }
  }

  /* ── Batch Showtime Modal Handlers ── */

  function openBatchModal() {
    setBatchForm({
      ...EMPTY_BATCH_FORM,
      cinemaId: selectedCinemaId || "",
      fromDate: toDateInputValue(new Date()),
      toDate: toDateInputValue(addDays(new Date(), 30)),
    });
    setExcludedBatchIds(new Set());
    setBatchError("");
    setNewStartTimeInput("");
    setShowBatchModal(true);
  }

  function closeBatchModal() {
    setShowBatchModal(false);
    setBatchError("");
    setExcludedBatchIds(new Set());
  }

  function handleBatchFormChange(e) {
    const { name, value } = e.target;
    setExcludedBatchIds(new Set()); // Reset excluded items when generator params change

    if (name === "cinemaId") {
      setBatchForm((prev) => ({
        ...prev,
        cinemaId: value,
        roomId: "",
      }));
      return;
    }

    setBatchForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleToggleWeekday(dayId) {
    setExcludedBatchIds(new Set());
    setBatchForm((prev) => {
      const exists = prev.selectedWeekdays.includes(dayId);
      const updated = exists
        ? prev.selectedWeekdays.filter((d) => d !== dayId)
        : [...prev.selectedWeekdays, dayId];
      return { ...prev, selectedWeekdays: updated };
    });
  }

  function handleSelectWeekdayPreset(preset) {
    setExcludedBatchIds(new Set());
    let days = [1, 2, 3, 4, 5, 6, 0];
    if (preset === "weekdays") days = [1, 2, 3, 4, 5];
    if (preset === "weekend") days = [6, 0];
    setBatchForm((prev) => ({ ...prev, selectedWeekdays: days }));
  }

  function handleAddStartTime(timeStr) {
    if (!timeStr) return;
    const clean = timeStr.trim();
    if (!clean) return;
    setExcludedBatchIds(new Set());
    setBatchForm((prev) => {
      if (prev.startTimes.includes(clean)) return prev;
      const sorted = [...prev.startTimes, clean].sort((a, b) => a.localeCompare(b));
      return { ...prev, startTimes: sorted };
    });
    setNewStartTimeInput("");
  }

  function handleRemoveStartTime(timeStr) {
    setExcludedBatchIds(new Set());
    setBatchForm((prev) => ({
      ...prev,
      startTimes: prev.startTimes.filter((t) => t !== timeStr),
    }));
  }

  // Tự động sinh danh sách các suất chiếu hàng loạt dựa theo form
  const rawBatchItems = useMemo(() => {
    return generateBatchShowtimes(batchForm, movies, rooms, list);
  }, [batchForm, movies, rooms, list]);

  const batchItems = useMemo(() => {
    return rawBatchItems.filter((item) => !excludedBatchIds.has(item.tempId));
  }, [rawBatchItems, excludedBatchIds]);

  const conflictCount = useMemo(() => {
    return batchItems.filter((item) => item.isConflict).length;
  }, [batchItems]);

  function handleRemoveBatchItem(tempId) {
    setExcludedBatchIds((prev) => {
      const next = new Set(prev);
      next.add(tempId);
      return next;
    });
  }

  async function handleBatchSubmit(e) {
    e.preventDefault();
    setBatchError("");

    if (!batchForm.cinemaId) {
      setBatchError("Vui lòng chọn chi nhánh / khu vực.");
      return;
    }
    if (!batchForm.roomId) {
      setBatchError("Vui lòng chọn phòng chiếu.");
      return;
    }
    if (!batchForm.movieId) {
      setBatchError("Vui lòng chọn phim.");
      return;
    }
    if (batchItems.length === 0) {
      setBatchError("Không có suất chiếu nào được tạo ra. Vui lòng kiểm tra lại khoảng ngày và giờ bắt đầu!");
      return;
    }
    if (conflictCount > 0) {
      setBatchError(`Phát hiện ${conflictCount} suất chiếu bị trùng lịch (màu đỏ)! Vui lòng xóa bớt hoặc điều chỉnh lại giờ chiếu trước khi lưu.`);
      return;
    }

    try {
      setBatchSubmitting(true);

      const payloads = batchItems.map((item) => buildShowtimePayload(item));

      // Lưu song song tất cả các suất chiếu hợp lệ
      await Promise.all(payloads.map((p) => createShowtime(p)));

      closeBatchModal();
      fetchData();
      alert(`Đã tạo thành công ${payloads.length} suất chiếu hàng loạt!`);
    } catch (err) {
      console.error("Lỗi lưu lịch hàng loạt:", err);
      setBatchError(err?.message || "Lưu danh sách suất chiếu thất bại.");
    } finally {
      setBatchSubmitting(false);
    }
  }

  /* ── Cinema / movie handlers ── */

  function handleCinemaChange(id) {
    setSelectedCinemaId(id);
    setSelectedMovieId("");
    setMovieSearch("");
    setCinemaSearch("");
  }

  function handleMovieClick(movieId) {
    setSelectedMovieId((prev) => (prev === movieId ? "" : movieId));
    setMovieSearch("");
  }

  /* ── Calendar handlers ── */

  function handleFilterDateChange(value) {
    setFilterDate(value);

    if (value) {
      setWeekStart(toDateInputValue(getWeekStartSunday(parseDateOnly(value))));
    }
  }

  function goPrevWeek() {
    setWeekStart((prev) =>
      toDateInputValue(addDays(parseDateOnly(prev), -7))
    );
    setFilterDate("");
  }

  function goNextWeek() {
    setWeekStart((prev) =>
      toDateInputValue(addDays(parseDateOnly(prev), 7))
    );
    setFilterDate("");
  }

  function goToday() {
    const today = new Date();

    setWeekStart(toDateInputValue(getWeekStartSunday(today)));
    setFilterDate(toDateInputValue(today));
  }

  function clearFilters() {
    setFilterDate("");
    setFilterStatus("Đang chiếu");
    setWeekStart(toDateInputValue(getWeekStartSunday(new Date())));
  }

  /* ════════════════════════════════════════════════════
     COMPUTED VALUES
  ════════════════════════════════════════════════════ */

  const allCinemaOptions = useMemo(() => {
    if (cinemas.length > 0) {
      return cinemas
        .map((c) => ({
          id: String(getCinemaId(c) ?? ""),
          name: getCinemaName(c),
        }))
        .filter((c) => c.id);
    }

    const map = new Map();

    rooms.forEach((r) => {
      const id = getRoomCinemaId(r);
      const name = getRoomCinemaName(r);

      if (id && !map.has(id)) {
        map.set(id, name || `Chi nhánh ${id}`);
      }
    });

    return Array.from(map.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }, [cinemas, rooms]);

  const cinemaOptions = useMemo(() => {
    const kw = cinemaSearch.trim().toLowerCase();

    if (!kw) return allCinemaOptions;

    return allCinemaOptions.filter((c) =>
      c.name.toLowerCase().includes(kw)
    );
  }, [allCinemaOptions, cinemaSearch]);

  const selectedCinema = useMemo(() => {
    return (
      allCinemaOptions.find((c) => String(c.id) === String(selectedCinemaId)) ??
      null
    );
  }, [allCinemaOptions, selectedCinemaId]);

  const showtimesByCinema = useMemo(() => {
    if (!selectedCinemaId) return list;

    return list.filter(
      (s) => getShowtimeCinemaId(s, rooms) === String(selectedCinemaId)
    );
  }, [list, rooms, selectedCinemaId]);

  const moviesInCinema = useMemo(() => {
    const ids = new Set(
      showtimesByCinema.map((s) => String(getShowtimeMovieId(s)))
    );

    return movies.filter((m) => ids.has(String(getMovieId(m))));
  }, [showtimesByCinema, movies]);

  const moviesFiltered = useMemo(() => {
    const kw = movieSearch.trim().toLowerCase();

    if (!kw) return moviesInCinema;

    return moviesInCinema.filter((m) =>
      getMovieTitle(m).toLowerCase().includes(kw)
    );
  }, [moviesInCinema, movieSearch]);

  function getMovieShowtimeCount(movieId) {
    return showtimesByCinema.filter(
      (s) => String(getShowtimeMovieId(s)) === String(movieId)
    ).length;
  }

  const filtered = useMemo(() => {
    return showtimesByCinema
      .filter((s) => {
        const matchMovie = selectedMovieId
          ? String(getShowtimeMovieId(s)) === String(selectedMovieId)
          : true;

        const matchStatus = filterStatus
          ? getStatus(s) === filterStatus
          : true;

        return matchMovie && matchStatus;
      })
      .sort((a, b) =>
        `${getShowDate(a)} ${getStartHour(a)}`.localeCompare(
          `${getShowDate(b)} ${getStartHour(b)}`
        )
      );
  }, [showtimesByCinema, selectedMovieId, filterStatus]);

  const today = toDateInputValue(new Date());

  const todayCount = useMemo(() => {
    return showtimesByCinema.filter((s) => getShowDate(s) === today).length;
  }, [showtimesByCinema, today]);

  const sellingCount = useMemo(() => {
    return showtimesByCinema.filter((s) => getStatus(s) === "Đang chiếu")
      .length;
  }, [showtimesByCinema]);

  const movieCount = useMemo(() => moviesInCinema.length, [moviesInCinema]);

  const weekDays = useMemo(() => {
    const start = parseDateOnly(weekStart);
    const todayStr = toDateInputValue(new Date());
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(start, index);
      const dateValue = toDateInputValue(date);

      return {
        date: dateValue,
        dayName: dayNames[date.getDay()],
        dayNumber: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        isToday: dateValue === todayStr,
      };
    });
  }, [weekStart]);

  const weekTitle = useMemo(() => {
    if (weekDays.length === 0) return "";

    const first = weekDays[0];
    const last = weekDays[6];

    return `${String(first.dayNumber).padStart(2, "0")}/${String(
      first.month
    ).padStart(2, "0")} - ${String(last.dayNumber).padStart(2, "0")}/${String(
      last.month
    ).padStart(2, "0")}/${last.year}`;
  }, [weekDays]);

  const calendarItems = useMemo(() => {
    const weekDateSet = new Set(weekDays.map((d) => d.date));

    return filtered.filter((s) => weekDateSet.has(getShowDate(s)));
  }, [filtered, weekDays]);

  function getShowtimesByDayHour(dayDate, hour) {
    return calendarItems
      .filter((s) => {
        const showDate = getShowDate(s);
        const startHour = getStartHour(s);
        const h = Number(String(startHour).split(":")[0]);

        return showDate === dayDate && h === Number(hour);
      })
      .sort((a, b) => getStartHour(a).localeCompare(getStartHour(b)));
  }

  /* ── Return ── */

  return {
    /* raw data */
    list,
    movies,
    rooms,
    cinemas,

    /* async */
    loading,
    error,

    /* modal đơn lẻ */
    showModal,
    editId,
    isEditMode,
    setIsEditMode,
    form,
    formError,
    submitting,
    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmit,
    handleDelete,

    /* modal hàng loạt (batch generator) */
    showBatchModal,
    batchForm,
    batchItems,
    conflictCount,
    batchError,
    batchSubmitting,
    newStartTimeInput,
    setNewStartTimeInput,
    openBatchModal,
    closeBatchModal,
    handleBatchFormChange,
    handleToggleWeekday,
    handleSelectWeekdayPreset,
    handleAddStartTime,
    handleRemoveStartTime,
    handleRemoveBatchItem,
    handleBatchSubmit,

    /* cinema/movie selection */
    selectedCinemaId,
    selectedCinema,
    cinemaSearch,
    setCinemaSearch,
    selectedMovieId,
    movieSearch,
    setMovieSearch,
    cinemaOptions,
    moviesInCinema,
    moviesFiltered,
    getMovieShowtimeCount,
    handleCinemaChange,
    handleMovieClick,

    /* filters */
    filterStatus,
    setFilterStatus,
    filterDate,
    handleFilterDateChange,
    clearFilters,

    /* calendar */
    weekStart,
    weekDays,
    weekTitle,
    calendarHours: CALENDAR_HOURS,
    calendarItems,
    getShowtimesByDayHour,
    goPrevWeek,
    goNextWeek,
    goToday,

    /* stats */
    todayCount,
    sellingCount,
    movieCount,
  };
}