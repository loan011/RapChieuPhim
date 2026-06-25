import { useEffect, useState } from "react";

import {
  getShowtimeList,
  createShowtime,
  updateShowtime,
  deleteShowtime,
} from "./showtimeService";

import { getMovieList } from "../Film/movieService";
import { getRoomList } from "../Room/roomService";

export const STATUS_OPTIONS = [
  "Chưa mở bán",
  "Đang bán",
  "Hết vé",
  "Đang chiếu",
  "Đã chiếu",
  "Hủy",
];

export const EMPTY_FORM = {
  movieId: "",
  roomId: "",
  showDate: "",
  startHour: "",
  endHour: "",
  basePrice: "",
  status: "Chưa mở bán",
};



export function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;

  return [];
}

export function getShowtimeId(showtime) {
  return (
    showtime?.showTimeId ??
    showtime?.ShowTimeId ??
    showtime?.showtimeId ??
    showtime?.ShowtimeId ??
    showtime?.id ??
    showtime?.Id
  );
}

export function getMovieId(movie) {
  return movie?.movieId ?? movie?.MovieId ?? movie?.id ?? movie?.Id;
}

export function getMovieTitle(movie) {
  return (
    movie?.title ??
    movie?.Title ??
    movie?.movieTitle ??
    movie?.MovieTitle ??
    movie?.name ??
    movie?.Name ??
    "Chưa có tên phim"
  );
}

export function getRoomId(room) {
  return room?.roomId ?? room?.RoomId ?? room?.id ?? room?.Id;
}

export function getRoomName(room) {
  return (
    room?.roomName ??
    room?.RoomName ??
    room?.name ??
    room?.Name ??
    "Chưa có phòng"
  );
}

export function getRoomFullName(room) {
  const roomName = getRoomName(room);

  const cinemaName =
    room?.cinemaName ??
    room?.CinemaName ??
    room?.cinema?.cinemaName ??
    room?.cinema?.CinemaName ??
    room?.Cinema?.cinemaName ??
    room?.Cinema?.CinemaName;

  if (cinemaName) {
    return `${roomName} - ${cinemaName}`;
  }

  const cinemaId = room?.cinemaId ?? room?.CinemaId;

  if (cinemaId) {
    return `${roomName} - Cinema ${cinemaId}`;
  }

  return roomName;
}

export function getShowtimeMovieId(showtime) {
  return (
    showtime?.movieId ??
    showtime?.MovieId ??
    showtime?.movie?.movieId ??
    showtime?.movie?.MovieId ??
    showtime?.Movie?.movieId ??
    showtime?.Movie?.MovieId
  );
}

export function getShowtimeRoomId(showtime) {
  return (
    showtime?.roomId ??
    showtime?.RoomId ??
    showtime?.room?.roomId ??
    showtime?.room?.RoomId ??
    showtime?.Room?.roomId ??
    showtime?.Room?.RoomId
  );
}

export function getShowtimeMovieTitle(showtime, movies) {
  const directTitle =
    showtime?.movieTitle ??
    showtime?.MovieTitle ??
    showtime?.movie?.title ??
    showtime?.movie?.Title ??
    showtime?.Movie?.title ??
    showtime?.Movie?.Title;

  if (directTitle) return directTitle;

  const movieId = getShowtimeMovieId(showtime);

  if (movieId) {
    const foundMovie = movies.find(
      (movie) => String(getMovieId(movie)) === String(movieId)
    );

    if (foundMovie) return getMovieTitle(foundMovie);
  }

  return "Chưa có phim";
}

export function getShowtimeRoomName(showtime, rooms) {
  const directRoom =
    showtime?.roomName ??
    showtime?.RoomName ??
    showtime?.room?.roomName ??
    showtime?.room?.RoomName ??
    showtime?.Room?.roomName ??
    showtime?.Room?.RoomName;

  if (directRoom) return directRoom;

  const roomId = getShowtimeRoomId(showtime);

  if (roomId) {
    const foundRoom = rooms.find(
      (room) => String(getRoomId(room)) === String(roomId)
    );

    if (foundRoom) return getRoomFullName(foundRoom);
  }

  return "Chưa có phòng";
}

export function getStartDateTime(showtime) {
  return showtime?.startTime ?? showtime?.StartTime ?? "";
}

export function getEndDateTime(showtime) {
  return showtime?.endTime ?? showtime?.EndTime ?? "";
}

export function getShowDate(showtime) {
  const showDate = showtime?.showDate ?? showtime?.ShowDate;

  if (showDate) {
    return String(showDate).split("T")[0];
  }

  const startTime = getStartDateTime(showtime);

  if (!startTime) return "";

  if (String(startTime).includes("T")) {
    return String(startTime).split("T")[0];
  }

  return "";
}

export function getStartHour(showtime) {
  const value = getStartDateTime(showtime);

  if (!value) return "";

  if (String(value).includes("T")) {
    return String(value).split("T")[1]?.slice(0, 5) || "";
  }

  return String(value).slice(0, 5);
}

export function getEndHour(showtime) {
  const value = getEndDateTime(showtime);

  if (!value) return "";

  if (String(value).includes("T")) {
    return String(value).split("T")[1]?.slice(0, 5) || "";
  }

  return String(value).slice(0, 5);
}

export function getBasePrice(showtime) {
  return (
    showtime?.basePrice ??
    showtime?.BasePrice ??
    showtime?.price ??
    showtime?.Price ??
    0
  );
}

export function getStatus(showtime) {
  const status = showtime?.status ?? showtime?.Status ?? "Chưa mở bán";

  if (status === "Active") return "Đang bán";
  if (status === "Inactive") return "Hủy";
  if (status === "Completed") return "Đã chiếu";
  if (status === "Cancelled") return "Hủy";

  return status;
}

export function formatMoney(value) {
  const number = Number(value);

  if (Number.isNaN(number)) return "0 đ";

  return `${number.toLocaleString("vi-VN")} đ`;
}

export function buildFormFromShowtime(showtime) {
  return {
    movieId: getShowtimeMovieId(showtime) ?? "",
    roomId: getShowtimeRoomId(showtime) ?? "",
    showDate: getShowDate(showtime),
    startHour: getStartHour(showtime),
    endHour: getEndHour(showtime),
    basePrice: getBasePrice(showtime),
    status: getStatus(showtime),
  };
}

export function validateShowtimeForm(form) {
  if (!form.movieId) return "Vui lòng chọn phim.";
  if (!form.roomId) return "Vui lòng chọn phòng chiếu.";
  if (!form.showDate) return "Vui lòng chọn ngày chiếu.";
  if (!form.startHour) return "Vui lòng chọn giờ bắt đầu.";
  if (!form.endHour) return "Vui lòng chọn giờ kết thúc.";

  if (!form.basePrice || Number(form.basePrice) <= 0) {
    return "Vui lòng nhập giá vé hợp lệ.";
  }

  return "";
}

export function buildShowtimePayload(form) {
  return {
    movieId: Number(form.movieId),
    roomId: Number(form.roomId),
    showDate: form.showDate,
    startTime: form.startHour,
    endTime: form.endHour,
    basePrice: Number(form.basePrice),
    status: form.status,
  };
}

export function filterShowtimeList({
  list,
  movies,
  rooms,
  search,
  filterDate,
  filterStatus,
}) {
  const keyword = search.toLowerCase().trim();

  return list
    .filter((item) => {
      const movieTitle = getShowtimeMovieTitle(item, movies).toLowerCase();
      const roomName = getShowtimeRoomName(item, rooms).toLowerCase();
      const showDate = getShowDate(item);
      const status = getStatus(item);

      const matchSearch =
        !keyword ||
        movieTitle.includes(keyword) ||
        roomName.includes(keyword);

      const matchDate = filterDate ? showDate === filterDate : true;

      const matchStatus = filterStatus ? status === filterStatus : true;

      return matchSearch && matchDate && matchStatus;
    })
    .sort((a, b) => {
      const dateA = `${getShowDate(a)} ${getStartHour(a)}`;
      const dateB = `${getShowDate(b)} ${getStartHour(b)}`;

      return dateA.localeCompare(dateB);
    });
}

export function useRate() {
  const [list, setList] = useState([]);
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const [showtimeData, movieData, roomData] = await Promise.all([
        getShowtimeList(),
        getMovieList(),
        getRoomList(),
      ]);

      console.log("SHOWTIME API DATA:", showtimeData);
      console.log("MOVIE API DATA:", movieData);
      console.log("ROOM API DATA:", roomData);

      setList(normalizeArray(showtimeData));
      setMovies(normalizeArray(movieData));
      setRooms(normalizeArray(roomData));
    } catch (err) {
      console.error("Lỗi tải dữ liệu suất chiếu:", err);

      setError(err?.message || "Không tải được dữ liệu suất chiếu.");
      setList([]);
      setMovies([]);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(item) {
    setEditId(getShowtimeId(item));
    setForm(buildFormFromShowtime(item));
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

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    const validateMessage = validateShowtimeForm(form);

    if (validateMessage) {
      setFormError(validateMessage);
      return;
    }

    const payload = buildShowtimePayload(form);

    console.log("SHOWTIME PAYLOAD:", payload);
    console.log("EDIT ID:", editId);

    try {
      setSubmitting(true);

      if (editId !== null) {
        await updateShowtime(editId, payload);
      } else {
        await createShowtime(payload);
      }

      closeModal();
      fetchData();
    } catch (err) {
      console.error("Lỗi lưu suất chiếu:", err);
      setFormError(err?.message || "Lưu suất chiếu thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Bạn có chắc muốn xóa suất chiếu này?")) return;

    try {
      await deleteShowtime(id);
      fetchData();
    } catch (err) {
      alert(err?.message || "Xóa suất chiếu thất bại.");
    }
  }

  const filtered = filterShowtimeList({
    list,
    movies,
    rooms,
    search,
    filterDate,
    filterStatus,
  });

  return {
    list,
    setList,

    movies,
    setMovies,

    rooms,
    setRooms,

    loading,
    setLoading,

    error,
    setError,

    search,
    setSearch,

    filterDate,
    setFilterDate,

    filterStatus,
    setFilterStatus,

    showModal,
    setShowModal,

    editId,
    setEditId,

    form,
    setForm,

    formError,
    setFormError,

    submitting,
    setSubmitting,

    filtered,

    fetchData,
    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmit,
    handleDelete,
  };
}