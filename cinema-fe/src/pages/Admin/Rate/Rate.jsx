import "./Rate.css";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  getShowtimeList,
  createShowtime,
  updateShowtime,
  deleteShowtime,
} from "./showtimeService";

import { getMovieList } from "../Film/movieService";
import { getRoomList } from "../Room/roomService";

const STATUS_OPTIONS = [
  "Chưa mở bán",
  "Đang bán",
  "Hết vé",
  "Đang chiếu",
  "Đã chiếu",
  "Hủy",
];

const EMPTY_FORM = {
  movieId: "",
  roomId: "",
  showDate: "",
  startHour: "",
  endHour: "",
  basePrice: "",
  status: "Chưa mở bán",
};

function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;

  return [];
}

function getShowtimeId(s) {
  return (
    s.showTimeId ??
    s.ShowTimeId ??
    s.showtimeId ??
    s.ShowtimeId ??
    s.id ??
    s.Id
  );
}

function getMovieId(m) {
  return m.movieId ?? m.MovieId ?? m.id ?? m.Id;
}

function getMovieTitle(m) {
  return (
    m.title ??
    m.Title ??
    m.movieTitle ??
    m.MovieTitle ??
    m.name ??
    m.Name ??
    "Chưa có tên phim"
  );
}

function getRoomId(r) {
  return r.roomId ?? r.RoomId ?? r.id ?? r.Id;
}

function getRoomName(r) {
  return r.roomName ?? r.RoomName ?? r.name ?? r.Name ?? "Chưa có phòng";
}

function getRoomFullName(r) {
  const roomName = getRoomName(r);

  const cinemaName =
    r.cinemaName ??
    r.CinemaName ??
    r.cinema?.cinemaName ??
    r.cinema?.CinemaName ??
    r.Cinema?.cinemaName ??
    r.Cinema?.CinemaName;

  if (cinemaName) {
    return `${roomName} - ${cinemaName}`;
  }

  const cinemaId = r.cinemaId ?? r.CinemaId;

  if (cinemaId) {
    return `${roomName} - Cinema ${cinemaId}`;
  }

  return roomName;
}

function getShowtimeMovieId(s) {
  return (
    s.movieId ??
    s.MovieId ??
    s.movie?.movieId ??
    s.movie?.MovieId ??
    s.Movie?.movieId ??
    s.Movie?.MovieId
  );
}

function getShowtimeRoomId(s) {
  return (
    s.roomId ??
    s.RoomId ??
    s.room?.roomId ??
    s.room?.RoomId ??
    s.Room?.roomId ??
    s.Room?.RoomId
  );
}

function getShowtimeMovieTitle(s, movies) {
  const directTitle =
    s.movieTitle ??
    s.MovieTitle ??
    s.movie?.title ??
    s.movie?.Title ??
    s.Movie?.title ??
    s.Movie?.Title;

  if (directTitle) return directTitle;

  const movieId = getShowtimeMovieId(s);

  if (movieId) {
    const foundMovie = movies.find(
      (movie) => String(getMovieId(movie)) === String(movieId)
    );

    if (foundMovie) {
      return getMovieTitle(foundMovie);
    }
  }

  return "Chưa có phim";
}

function getShowtimeRoomName(s, rooms) {
  const directRoom =
    s.roomName ??
    s.RoomName ??
    s.room?.roomName ??
    s.room?.RoomName ??
    s.Room?.roomName ??
    s.Room?.RoomName;

  if (directRoom) return directRoom;

  const roomId = getShowtimeRoomId(s);

  if (roomId) {
    const foundRoom = rooms.find(
      (room) => String(getRoomId(room)) === String(roomId)
    );

    if (foundRoom) {
      return getRoomFullName(foundRoom);
    }
  }

  return "Chưa có phòng";
}

function getStartDateTime(s) {
  return s.startTime ?? s.StartTime ?? "";
}

function getEndDateTime(s) {
  return s.endTime ?? s.EndTime ?? "";
}

function getShowDate(s) {
  const value = getStartDateTime(s);

  if (!value) return "";

  return String(value).split("T")[0];
}

function getStartHour(s) {
  const value = getStartDateTime(s);

  if (!value) return "";

  if (String(value).includes("T")) {
    return String(value).split("T")[1]?.slice(0, 5) || "";
  }

  return String(value).slice(0, 5);
}

function getEndHour(s) {
  const value = getEndDateTime(s);

  if (!value) return "";

  if (String(value).includes("T")) {
    return String(value).split("T")[1]?.slice(0, 5) || "";
  }

  return String(value).slice(0, 5);
}

function getBasePrice(s) {
  return s.basePrice ?? s.BasePrice ?? s.price ?? s.Price ?? 0;
}

function getStatus(s) {
  const status = s.status ?? s.Status ?? "Chưa mở bán";

  if (status === "Active") return "Đang bán";
  if (status === "Inactive") return "Hủy";

  return status;
}

function formatMoney(value) {
  const number = Number(value);

  if (Number.isNaN(number)) return "0 đ";

  return `${number.toLocaleString("vi-VN")} đ`;
}

function buildDateTime(date, time) {
  if (!date || !time) return "";

  return `${date}T${time}:00`;
}

export default function SuatChieu() {
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

    setForm({
      movieId: getShowtimeMovieId(item) ?? "",
      roomId: getShowtimeRoomId(item) ?? "",
      showDate: getShowDate(item),
      startHour: getStartHour(item),
      endHour: getEndHour(item),
      basePrice: getBasePrice(item),
      status: getStatus(item),
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

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!form.movieId) {
      setFormError("Vui lòng chọn phim.");
      return;
    }

    if (!form.roomId) {
      setFormError("Vui lòng chọn phòng chiếu.");
      return;
    }

    if (!form.showDate) {
      setFormError("Vui lòng chọn ngày chiếu.");
      return;
    }

    if (!form.startHour) {
      setFormError("Vui lòng chọn giờ bắt đầu.");
      return;
    }

    if (!form.endHour) {
      setFormError("Vui lòng chọn giờ kết thúc.");
      return;
    }

    if (!form.basePrice || Number(form.basePrice) <= 0) {
      setFormError("Vui lòng nhập giá vé hợp lệ.");
      return;
    }

    const payload = {
      movieId: Number(form.movieId),
      roomId: Number(form.roomId),
      startTime: buildDateTime(form.showDate, form.startHour),
      endTime: buildDateTime(form.showDate, form.endHour),
      basePrice: Number(form.basePrice),
      status: form.status,
    };

    try {
      setSubmitting(true);

      if (editId !== null) {
        await updateShowtime(editId, {
          showTimeId: editId,
          ...payload,
        });
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
    if (!confirm("Bạn có chắc muốn xóa suất chiếu này?")) return;

    try {
      await deleteShowtime(id);
      fetchData();
    } catch (err) {
      alert(err?.message || "Xóa suất chiếu thất bại.");
    }
  }

  const filtered = list.filter((item) => {
    const keyword = search.toLowerCase().trim();

    const movieTitle = getShowtimeMovieTitle(item, movies).toLowerCase();
    const roomName = getShowtimeRoomName(item, rooms).toLowerCase();
    const showDate = getShowDate(item);
    const status = getStatus(item);

    const matchSearch =
      movieTitle.includes(keyword) || roomName.includes(keyword);

    const matchDate = filterDate ? showDate === filterDate : true;

    const matchStatus = filterStatus ? status === filterStatus : true;

    return matchSearch && matchDate && matchStatus;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-xl">Quản Lý Suất Chiếu</h4>

        <button
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          onClick={openAddModal}
        >
          + Thêm
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            placeholder="Tìm phim, phòng..."
            className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-40"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <input
            type="date"
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />

          <select
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>

            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {loading && <p className="text-gray-500 text-sm">Đang tải...</p>}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Phim</th>
                  <th className="px-3 py-2 text-left">Phòng Chiếu</th>
                  <th className="px-3 py-2 text-left">Ngày Chiếu</th>
                  <th className="px-3 py-2 text-left">Giờ Chiếu</th>
                  <th className="px-3 py-2 text-left">Giá Vé</th>
                  <th className="px-3 py-2 text-left">Trạng Thái</th>
                  <th className="px-3 py-2 text-left">Thao Tác</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-6 text-gray-400"
                    >
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, index) => {
                    const id = getShowtimeId(item);

                    return (
                      <tr
                        key={id ?? index}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-3 py-2">{index + 1}</td>

                        <td className="px-3 py-2 font-medium">
                          {getShowtimeMovieTitle(item, movies)}
                        </td>

                        <td className="px-3 py-2">
                          {getShowtimeRoomName(item, rooms)}
                        </td>

                        <td className="px-3 py-2">
                          {getShowDate(item)}
                        </td>

                        <td className="px-3 py-2">
                          {getStartHour(item)}
                          {getEndHour(item) ? ` - ${getEndHour(item)}` : ""}
                        </td>

                        <td className="px-3 py-2">
                          {formatMoney(getBasePrice(item))}
                        </td>

                        <td className="px-3 py-2">
                          {getStatus(item)}
                        </td>

                        <td className="px-3 py-2 flex gap-2">
                          <button
                            className="text-blue-600 hover:underline text-xs"
                            onClick={() => openEditModal(item)}
                          >
                            Sửa
                          </button>

                          <button
                            className="text-red-500 hover:underline text-xs"
                            onClick={() => handleDelete(id)}
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
              <h5 className="font-bold text-lg mb-4 text-gray-800">
                {editId !== null
                  ? "Cập Nhật Suất Chiếu"
                  : "Thêm Suất Chiếu Mới"}
              </h5>

              {formError && (
                <p className="text-red-500 text-sm mb-3">{formError}</p>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phim <span className="text-red-500">*</span>
                    </label>

                    <select
                      name="movieId"
                      value={form.movieId}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">-- Chọn phim --</option>

                      {movies.map((movie) => {
                        const movieId = getMovieId(movie);

                        return (
                          <option key={movieId} value={movieId}>
                            {getMovieTitle(movie)}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phòng Chiếu <span className="text-red-500">*</span>
                    </label>

                    <select
                      name="roomId"
                      value={form.roomId}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">-- Chọn phòng --</option>

                      {rooms.map((room) => {
                        const roomId = getRoomId(room);

                        return (
                          <option key={roomId} value={roomId}>
                            {getRoomFullName(room)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày Chiếu <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="date"
                      name="showDate"
                      value={form.showDate}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giờ Bắt Đầu <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="time"
                      name="startHour"
                      value={form.startHour}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giờ Kết Thúc <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="time"
                      name="endHour"
                      value={form.endHour}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá Vé <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="number"
                      name="basePrice"
                      value={form.basePrice}
                      onChange={handleChange}
                      placeholder="VD: 75000"
                      min="0"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng Thái
                    </label>

                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                    disabled={submitting}
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Đang xử lý..."
                      : editId !== null
                      ? "Cập Nhật"
                      : "Thêm Mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}