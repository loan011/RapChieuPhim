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
];

export const EMPTY_FORM = {
  cinemaId: "",
  movieId: "",
  roomId: "",
  showDate: "",
  startHour: "",
  endHour: "",
  status: "Sắp chiếu",
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
  const endStr = getEndHour(s);

  if (dateStr) {
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

export function validateShowtimeForm(form) {
  if (!form.cinemaId) return "Vui lòng chọn chi nhánh/khu vực.";
  if (!form.movieId) return "Vui lòng chọn phim.";
  if (!form.roomId) return "Vui lòng chọn phòng chiếu.";
  if (!form.showDate) return "Vui lòng chọn ngày chiếu.";
  if (!form.startHour) return "Vui lòng chọn giờ bắt đầu.";
  if (!form.endHour) return "Vui lòng chọn giờ kết thúc.";

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

  /* ── Modal / form state ── */

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  /* ── Modal handlers ── */

  function openAddModal() {
    setEditId(null);
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

    /* Khi chọn phim → tự động tính giờ kết thúc nếu đã có giờ bắt đầu */
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

    /* Khi đổi giờ bắt đầu → tự động tính lại giờ kết thúc nếu đã chọn phim */
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

    const err = validateShowtimeForm(form);

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

    /* modal/form */
    showModal,
    editId,
    form,
    formError,
    submitting,
    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmit,
    handleDelete,

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