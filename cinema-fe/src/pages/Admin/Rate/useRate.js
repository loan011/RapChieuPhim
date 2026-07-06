import { useEffect, useState, useMemo } from "react";

import {
  getShowtimeList,
  createShowtime,
  updateShowtime,
  deleteShowtime,
} from "./showtimeService";

import { getMovieList } from "../Film/movieService";
import { getRoomList }  from "../Room/roomService";
import { getCinemaList } from "../Cinema/cinemaService";

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════ */

export const PAGE_SIZE = 5;

export const STATUS_OPTIONS = [
  "Đang chiếu",
  "Sắp chiếu",
  "Đã chiếu",
  "Chiếu sớm",
];

export const EMPTY_FORM = {
  movieId:   "",
  roomId:    "",
  showDate:  "",
  startHour: "",
  endHour:   "",
  basePrice: "",
  status:    "Sắp chiếu",
};

/* ═══════════════════════════════════════════════════════════
   PURE HELPER FUNCTIONS (exported for use in JSX if needed)
═══════════════════════════════════════════════════════════ */

export function normalizeArray(data) {
  if (Array.isArray(data))          return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data))    return data.data;
  if (Array.isArray(data?.items))   return data.items;
  if (Array.isArray(data?.result))  return data.result;
  return [];
}

/* ── ID helpers ── */
export function getShowtimeId(s) {
  return s?.showTimeId ?? s?.ShowTimeId ?? s?.showtimeId ?? s?.ShowtimeId ?? s?.id ?? s?.Id;
}
export function getMovieId(m) {
  return m?.movieId ?? m?.MovieId ?? m?.id ?? m?.Id;
}
export function getRoomId(r) {
  return r?.roomId ?? r?.RoomId ?? r?.id ?? r?.Id;
}

/* ── Name helpers ── */
export function getMovieTitle(m) {
  return m?.title ?? m?.Title ?? m?.movieTitle ?? m?.MovieTitle ?? m?.name ?? m?.Name ?? "Chưa có tên phim";
}
export function getRoomName(r) {
  return r?.roomName ?? r?.RoomName ?? r?.name ?? r?.Name ?? "Chưa có phòng";
}

/* ── Showtime relation helpers ── */
export function getShowtimeMovieId(s) {
  return s?.movieId ?? s?.MovieId ?? s?.movie?.movieId ?? s?.movie?.MovieId ?? s?.Movie?.movieId ?? s?.Movie?.MovieId;
}
export function getShowtimeRoomId(s) {
  return s?.roomId ?? s?.RoomId ?? s?.room?.roomId ?? s?.room?.RoomId ?? s?.Room?.roomId ?? s?.Room?.RoomId;
}
export function getShowtimeMovieTitle(s, movies) {
  const direct = s?.movieTitle ?? s?.MovieTitle ?? s?.movie?.title ?? s?.movie?.Title ?? s?.Movie?.title ?? s?.Movie?.Title;
  if (direct) return direct;
  const mid = getShowtimeMovieId(s);
  if (mid) {
    const found = movies.find((m) => String(getMovieId(m)) === String(mid));
    if (found) return getMovieTitle(found);
  }
  return "Chưa có phim";
}
export function getShowtimeRoomName(s, rooms) {
  const direct = s?.roomName ?? s?.RoomName ?? s?.room?.roomName ?? s?.room?.RoomName ?? s?.Room?.roomName ?? s?.Room?.RoomName;
  if (direct) return direct;
  const rid = getShowtimeRoomId(s);
  if (rid) {
    const found = rooms.find((r) => String(getRoomId(r)) === String(rid));
    if (found) {
      const rn = getRoomName(found);
      const cn = found?.cinemaName ?? found?.CinemaName ?? found?.cinema?.cinemaName ?? found?.cinema?.CinemaName ?? "";
      return cn ? `${rn} - ${cn}` : rn;
    }
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
  return String(v).includes("T") ? (String(v).split("T")[1]?.slice(0, 5) || "") : String(v).slice(0, 5);
}
export function getEndHour(s) {
  const v = s?.endTime ?? s?.EndTime ?? "";
  if (!v) return "";
  return String(v).includes("T") ? (String(v).split("T")[1]?.slice(0, 5) || "") : String(v).slice(0, 5);
}
export function getBasePrice(s) {
  return s?.basePrice ?? s?.BasePrice ?? s?.price ?? s?.Price ?? 0;
}
export function formatMoney(value) {
  const n = Number(value);
  return Number.isNaN(n) ? "0 đ" : `${n.toLocaleString("vi-VN")} đ`;
}

/* ── Status helper ── */
export function getStatus(s) {
  const raw = s?.status ?? s?.Status ?? "";

  // Tự động "Đã chiếu" nếu giờ kết thúc đã qua
  const dateStr = getShowDate(s);
  const endStr  = getEndHour(s);
  if (dateStr) {
    const endDt = new Date(endStr ? `${dateStr}T${endStr}:00` : `${dateStr}T23:59:00`);
    if (!isNaN(endDt) && endDt < new Date()) return "Đã chiếu";
  }

  // Map giá trị API → nhãn hiển thị
  if (raw === "Completed" || raw === "Đã chiếu")                        return "Đã chiếu";
  if (raw === "Active"    || raw === "Đang chiếu" || raw === "Đang bán") return "Đang chiếu";
  if (raw === "Cancelled" || raw === "Ngưng chiếu" || raw === "Hủy"
      || raw === "Hết vé")                                              return "Đã chiếu";
  if (raw === "Chiếu sớm")                                              return "Chiếu sớm";
  if (raw === "Sắp chiếu" || raw === "Chưa mở bán")                    return "Sắp chiếu";

  return "Sắp chiếu";
}

/* ── Form helpers ── */
export function buildFormFromShowtime(s) {
  return {
    movieId:   getShowtimeMovieId(s) ?? "",
    roomId:    getShowtimeRoomId(s)  ?? "",
    showDate:  getShowDate(s),
    startHour: getStartHour(s),
    endHour:   getEndHour(s),
    basePrice: getBasePrice(s),
    status:    getStatus(s),
  };
}
export function validateShowtimeForm(form) {
  if (!form.movieId)                              return "Vui lòng chọn phim.";
  if (!form.roomId)                               return "Vui lòng chọn phòng chiếu.";
  if (!form.showDate)                             return "Vui lòng chọn ngày chiếu.";
  if (!form.startHour)                            return "Vui lòng chọn giờ bắt đầu.";
  if (!form.endHour)                              return "Vui lòng chọn giờ kết thúc.";
  if (!form.basePrice || Number(form.basePrice) <= 0) return "Vui lòng nhập giá vé hợp lệ.";
  return "";
}
export function buildShowtimePayload(form) {
  const STATUS_TO_API = {
    "Đang chiếu": "Active",
    "Sắp chiếu":  "Active",
    "Chiếu sớm":  "Active",
    "Đã chiếu":   "Completed",
  };
  return {
    movieId:   Number(form.movieId),
    roomId:    Number(form.roomId),
    showDate:  form.showDate,
    startTime: form.startHour,
    endTime:   form.endHour,
    basePrice: Number(form.basePrice),
    status:    STATUS_TO_API[form.status] ?? form.status,
  };
}

/* ═══════════════════════════════════════════════════════════
   INTERNAL HELPERS (cinema / room derivation)
═══════════════════════════════════════════════════════════ */

function _getRoomCinemaId(room) {
  return String(
    room?.cinemaId     ?? room?.CinemaId     ??
    room?.cinema?.cinemaId ?? room?.cinema?.CinemaId ??
    room?.Cinema?.cinemaId ?? room?.Cinema?.CinemaId ?? ""
  );
}
function _getRoomCinemaName(room) {
  return (
    room?.cinemaName     ?? room?.CinemaName     ??
    room?.cinema?.cinemaName ?? room?.cinema?.CinemaName ??
    room?.Cinema?.cinemaName ?? room?.Cinema?.CinemaName ?? ""
  );
}
function _getShowtimeCinemaId(showtime, rooms) {
  const rid  = getShowtimeRoomId(showtime);
  const room = rooms.find((r) => String(getRoomId(r)) === String(rid));
  return room ? _getRoomCinemaId(room) : "";
}

/* ═══════════════════════════════════════════════════════════
   useRate HOOK
═══════════════════════════════════════════════════════════ */

export function useRate() {
  /* ── Raw data ── */
  const [list,    setList]    = useState([]);
  const [movies,  setMovies]  = useState([]);
  const [rooms,   setRooms]   = useState([]);
  const [cinemas, setCinemas] = useState([]);

  /* ── Async status ── */
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  /* ── Filter / selection state ── */
  const [selectedCinemaId, setSelectedCinemaId] = useState("");
  const [cinemaSearch,     setCinemaSearch]     = useState("");
  const [selectedMovieId,  setSelectedMovieId]  = useState("");
  const [movieSearch,      setMovieSearch]      = useState("");
  const [filterStatus,     setFilterStatus]     = useState("Đang chiếu");
  const [filterDate,       setFilterDate]       = useState("");
  const [page,             setPage]             = useState(1);

  /* ── Modal / form state ── */
  const [showModal,  setShowModal]  = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [formError,  setFormError]  = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ── Fetch on mount ── */
  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError("");
      const [showtimeData, movieData, roomData, cinemaData] = await Promise.all([
        getShowtimeList(),
        getMovieList(),
        getRoomList(),
        getCinemaList(),
      ]);
      setList(normalizeArray(showtimeData));
      setMovies(normalizeArray(movieData));
      setRooms(normalizeArray(roomData));
      
      const normalizedCinemas = normalizeArray(cinemaData);
      setCinemas(normalizedCinemas);
      if (normalizedCinemas.length > 0 && !selectedCinemaId) {
        const firstCinemaId = String(normalizedCinemas[0]?.cinemaId ?? normalizedCinemas[0]?.CinemaId ?? normalizedCinemas[0]?.id ?? normalizedCinemas[0]?.Id ?? "");
        setSelectedCinemaId(firstCinemaId);
      }
    } catch (err) {
      setError(err?.message || "Không tải được dữ liệu suất chiếu.");
      setList([]); setMovies([]); setRooms([]); setCinemas([]);
    } finally {
      setLoading(false);
    }
  }

  /* ── Modal handlers ── */
  function openAddModal() {
    setEditId(null); setForm(EMPTY_FORM); setFormError(""); setShowModal(true);
  }
  function openEditModal(item) {
    setEditId(getShowtimeId(item)); setForm(buildFormFromShowtime(item));
    setFormError(""); setShowModal(true);
  }
  function closeModal() {
    setShowModal(false); setEditId(null); setForm(EMPTY_FORM); setFormError("");
  }
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    const err = validateShowtimeForm(form);
    if (err) { setFormError(err); return; }
    try {
      setSubmitting(true);
      const payload = buildShowtimePayload(form);
      if (editId !== null) await updateShowtime(editId, payload);
      else                 await createShowtime(payload);
      closeModal();
      fetchData();
    } catch (err) {
      setFormError(err?.message || "Lưu suất chiếu thất bại.");
    } finally {
      setSubmitting(false);
    }
  }
  async function handleDelete(id) {
    if (!window.confirm("Bạn có chắc muốn xóa suất chiếu này?")) return;
    try { await deleteShowtime(id); fetchData(); }
    catch (err) { alert(err?.message || "Xóa suất chiếu thất bại."); }
  }

  /* ── Cinema filter handlers ── */
  function handleCinemaChange(id) {
    setSelectedCinemaId(id); setSelectedMovieId(""); setMovieSearch(""); setCinemaSearch(""); setPage(1);
  }
  function handleMovieClick(movieId) {
    setSelectedMovieId((prev) => (prev === movieId ? "" : movieId));
    setMovieSearch(""); setPage(1);
  }
  function clearFilters() {
    setFilterDate(""); setFilterStatus("Đang chiếu"); setPage(1);
  }

  /* ════════════════════════════════════════════════════
     COMPUTED VALUES  (all logic lives here, not in JSX)
  ════════════════════════════════════════════════════ */

  /* Cinema options (from API or derived from rooms) */
  const cinemaOptions = useMemo(() => {
    let rawOptions = [];
    if (cinemas.length > 0) {
      rawOptions = cinemas.map((c) => ({
        id:   String(c?.cinemaId ?? c?.CinemaId ?? c?.id ?? c?.Id ?? ""),
        name: c?.cinemaName ?? c?.CinemaName ?? c?.name ?? c?.Name ?? "Chi nhánh",
      })).filter((c) => c.id);
    } else {
      const map = new Map();
      rooms.forEach((r) => {
        const id   = _getRoomCinemaId(r);
        const name = _getRoomCinemaName(r);
        if (id && !map.has(id)) map.set(id, name || `Chi nhánh ${id}`);
      });
      rawOptions = Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }

    const kw = cinemaSearch.trim().toLowerCase();
    if (kw) {
      return rawOptions.filter((c) => c.name.toLowerCase().includes(kw));
    }
    return rawOptions;
  }, [cinemas, rooms, cinemaSearch]);

  const selectedCinema = useMemo(
    () => cinemaOptions.find((c) => c.id === selectedCinemaId) ?? null,
    [cinemaOptions, selectedCinemaId]
  );

  /* Showtimes filtered by selected cinema */
  const showtimesByCinema = useMemo(() => {
    if (!selectedCinemaId) return list;
    return list.filter((s) => _getShowtimeCinemaId(s, rooms) === selectedCinemaId);
  }, [list, rooms, selectedCinemaId]);

  /* Movies that have at least one showtime in this cinema */
  const moviesInCinema = useMemo(() => {
    const ids = new Set(showtimesByCinema.map((s) => String(getShowtimeMovieId(s))));
    return movies.filter((m) => ids.has(String(getMovieId(m))));
  }, [showtimesByCinema, movies]);

  /* Final filtered list (movie + status + date) */
  const filtered = useMemo(() => {
    return showtimesByCinema
      .filter((s) => {
        const matchMovie  = selectedMovieId ? String(getShowtimeMovieId(s)) === selectedMovieId : true;
        const matchStatus = filterStatus    ? getStatus(s) === filterStatus                     : true;
        const matchDate   = filterDate      ? getShowDate(s) === filterDate                     : true;
        return matchMovie && matchStatus && matchDate;
      })
      .sort((a, b) =>
        `${getShowDate(a)} ${getStartHour(a)}`.localeCompare(`${getShowDate(b)} ${getStartHour(b)}`)
      );
  }, [showtimesByCinema, selectedMovieId, filterStatus, filterDate]);

  /* Pagination */
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)), [filtered]);
  const safePage   = useMemo(() => Math.min(page, totalPages),                          [page, totalPages]);
  const pageItems  = useMemo(() =>
    filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage]
  );

  /* Stats (based on cinema selection) */
  const today        = new Date().toISOString().split("T")[0];
  const todayCount   = useMemo(() => showtimesByCinema.filter((s) => getShowDate(s) === today).length,              [showtimesByCinema, today]);
  const sellingCount = useMemo(() => showtimesByCinema.filter((s) => getStatus(s) === "Đang chiếu").length,         [showtimesByCinema]);
  const movieCount   = useMemo(() => moviesInCinema.length,                                                         [moviesInCinema]);

  /* Filtered movie chips (by movieSearch keyword) */
  const moviesFiltered = useMemo(() => {
    const kw = movieSearch.trim().toLowerCase();
    return kw ? moviesInCinema.filter((m) => getMovieTitle(m).toLowerCase().includes(kw)) : moviesInCinema;
  }, [moviesInCinema, movieSearch]);

  /* Count of showtimes per movie (for chip badge) */
  function getMovieShowtimeCount(movieId) {
    return showtimesByCinema.filter((s) => String(getShowtimeMovieId(s)) === String(movieId)).length;
  }

  /* ── Return ── */
  return {
    /* raw data */
    list, movies, rooms, cinemas,

    /* async */
    loading, error,

    /* modal/form */
    showModal, editId, form, formError, submitting,
    openAddModal, openEditModal, closeModal, handleChange, handleSubmit, handleDelete,

    /* cinema/movie selection */
    selectedCinemaId, selectedCinema,
    cinemaSearch, setCinemaSearch,
    selectedMovieId,
    movieSearch, setMovieSearch,
    cinemaOptions,
    moviesInCinema, moviesFiltered,
    getMovieShowtimeCount,
    handleCinemaChange, handleMovieClick,

    /* filters */
    filterStatus, setFilterStatus,
    filterDate,   setFilterDate,
    clearFilters,

    /* pagination */
    page, setPage,
    filtered, pageItems, totalPages, safePage,

    /* stats */
    todayCount, sellingCount, movieCount,
  };
}