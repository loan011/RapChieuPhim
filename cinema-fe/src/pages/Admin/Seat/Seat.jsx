import "./Seat.css";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getSeatList, createSeat, updateSeat, deleteSeat } from "./seatService";
import { getRoomList } from "../Room/roomService";
import { getCinemaList } from "../Cinema/cinemaService";

const TYPE_OPTIONS = ["Standard", "VIP", "Couple"];

const EMPTY_FORM = {
  roomId: "",
  seatRow: "",
  seatNumber: "",
  seatType: "Standard",
  isActive: true,
};

function getSeatId(seat) {
  return seat.seatId ?? seat.SeatId ?? seat.id ?? seat.Id;
}

function getSeatRoomId(seat) {
  return seat.roomId ?? seat.RoomId ?? seat.room?.roomId ?? seat.Room?.RoomId;
}

function getRoomId(room) {
  return room.roomId ?? room.RoomId ?? room.id ?? room.Id;
}

function getRoomName(room) {
  return room.roomName ?? room.RoomName ?? room.name ?? room.Name ?? "Chưa có phòng";
}

function getRoomCinemaId(room) {
  return (
    room.cinemaId ??
    room.CinemaId ??
    room.cinema?.cinemaId ??
    room.cinema?.CinemaId ??
    room.Cinema?.cinemaId ??
    room.Cinema?.CinemaId
  );
}

function getCinemaId(cinema) {
  return cinema.cinemaId ?? cinema.CinemaId ?? cinema.id ?? cinema.Id;
}

function getCinemaName(cinema) {
  return (
    cinema.cinemaName ??
    cinema.CinemaName ??
    cinema.name ??
    cinema.Name ??
    "Chưa có tên rạp"
  );
}

function getSeatRow(seat) {
  return seat.seatRow ?? seat.SeatRow ?? seat.row ?? "";
}

function getSeatNumber(seat) {
  return seat.seatNumber ?? seat.SeatNumber ?? seat.col ?? "";
}

function getSeatType(seat) {
  return seat.seatType ?? seat.SeatType ?? seat.type ?? "Standard";
}

function getSeatCode(seat) {
  const row = String(getSeatRow(seat)).trim();
  const number = String(getSeatNumber(seat)).trim();

  if (!row && !number) return "Chưa có";

  if (/^[A-Za-z]+\d+$/.test(number)) {
    return number.toUpperCase();
  }

  return `${row}${number}`.toUpperCase();
}

function getSeatStatus(seat) {
  const isActive = seat.isActive ?? seat.IsActive;

  if (isActive === true) return "Hoạt động";
  if (isActive === false) return "Ngừng";

  return seat.status ?? seat.Status ?? "Chưa có";
}

function getSeatSortNumber(seat) {
  const code = getSeatCode(seat);
  const match = code.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export default function Ghe() {
  const [list, setList] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterRoom, setFilterRoom] = useState("");
  const [filterType, setFilterType] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const [seatData, roomData, cinemaData] = await Promise.all([
        getSeatList(),
        getRoomList(),
        getCinemaList(),
      ]);

      console.log("SEAT API DATA:", seatData);
      console.log("ROOM API DATA:", roomData);
      console.log("CINEMA API DATA:", cinemaData);

      setList(Array.isArray(seatData) ? seatData : []);
      setRooms(Array.isArray(roomData) ? roomData : []);
      setCinemas(Array.isArray(cinemaData) ? cinemaData : []);
    } catch (err) {
      console.error("Lỗi tải dữ liệu ghế/phòng/rạp:", err);
      setError(err?.message || "Lỗi tải dữ liệu.");
      setList([]);
      setRooms([]);
      setCinemas([]);
    } finally {
      setLoading(false);
    }
  }

  const roomMap = useMemo(() => {
    const map = new Map();

    rooms.forEach((room) => {
      const roomId = getRoomId(room);

      if (roomId !== undefined && roomId !== null) {
        map.set(Number(roomId), room);
      }
    });

    return map;
  }, [rooms]);

  const cinemaMap = useMemo(() => {
    const map = new Map();

    cinemas.forEach((cinema) => {
      const cinemaId = getCinemaId(cinema);

      if (cinemaId !== undefined && cinemaId !== null) {
        map.set(Number(cinemaId), cinema);
      }
    });

    return map;
  }, [cinemas]);

  function getRoomFullName(room) {
    if (!room) return "Chưa có phòng";

    const roomName = getRoomName(room);

    const cinemaNameFromRoom =
      room.cinema?.cinemaName ??
      room.cinema?.CinemaName ??
      room.Cinema?.cinemaName ??
      room.Cinema?.CinemaName;

    if (cinemaNameFromRoom) {
      return `${roomName} - ${cinemaNameFromRoom}`;
    }

    const cinemaId = getRoomCinemaId(room);
    const cinema = cinemaMap.get(Number(cinemaId));

    if (cinema) {
      return `${roomName} - ${getCinemaName(cinema)}`;
    }

    if (cinemaId) {
      return `${roomName} - Cinema ID ${cinemaId}`;
    }

    return roomName;
  }

  function getRoomNameBySeat(seat) {
    const roomId = getSeatRoomId(seat);

    if (!roomId) return "Chưa có phòng";

    const room = roomMap.get(Number(roomId));

    if (!room) return `Phòng ID ${roomId}`;

    return getRoomFullName(room);
  }

  function openAddModal() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(seat) {
    setEditId(getSeatId(seat));

    setForm({
      roomId: getSeatRoomId(seat) ?? "",
      seatRow: getSeatRow(seat),
      seatNumber: getSeatNumber(seat),
      seatType: getSeatType(seat),
      isActive: seat.isActive ?? seat.IsActive ?? true,
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

    if (!form.roomId) {
      setFormError("Vui lòng chọn phòng chiếu.");
      return;
    }

    if (!form.seatRow.trim()) {
      setFormError("Vui lòng nhập hàng ghế.");
      return;
    }

    if (!form.seatNumber.trim()) {
      setFormError("Vui lòng nhập số ghế.");
      return;
    }

    const payload = {
      roomId: Number(form.roomId),
      seatRow: form.seatRow.trim().toUpperCase(),
      seatNumber: String(form.seatNumber).trim(),
      seatType: form.seatType,
      isActive: form.isActive === true || form.isActive === "true",
    };

    try {
      setSubmitting(true);

      if (editId !== null) {
        await updateSeat(editId, {
          seatId: editId,
          ...payload,
        });
      } else {
        await createSeat(payload);
      }

      closeModal();
      fetchData();
    } catch (err) {
      setFormError(err?.message || "Lưu ghế thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Bạn có chắc muốn xóa ghế này?")) return;

    try {
      await deleteSeat(id);
      fetchData();
    } catch (err) {
      alert(err?.message || "Xóa ghế thất bại.");
    }
  }

  const filtered = list
    .filter((seat) => {
      const seatRoomId = getSeatRoomId(seat);
      const seatType = getSeatType(seat);

      const matchRoom = filterRoom
        ? Number(seatRoomId) === Number(filterRoom)
        : true;

      const matchType = filterType ? seatType === filterType : true;

      return matchRoom && matchType;
    })
    .sort((a, b) => {
      const roomA = Number(getSeatRoomId(a) ?? 0);
      const roomB = Number(getSeatRoomId(b) ?? 0);

      if (roomA !== roomB) return roomA - roomB;

      const rowA = getSeatRow(a);
      const rowB = getSeatRow(b);

      if (rowA !== rowB) return rowA.localeCompare(rowB);

      return getSeatSortNumber(a) - getSeatSortNumber(b);
    });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-xl">Quản Lý Ghế</h4>

        <button
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          onClick={openAddModal}
        >
          + Thêm
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <select
            className="border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-900 bg-white min-w-[260px]"
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
          >
            <option value="">Tất cả phòng</option>

            {rooms.map((room) => {
              const roomId = getRoomId(room);

              return (
                <option key={roomId} value={roomId}>
                  {getRoomFullName(room)}
                </option>
              );
            })}
          </select>

          <select
            className="border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-900 bg-white"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Tất cả loại</option>

            {TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type}
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
                  <th className="px-3 py-2 text-left">Mã Ghế</th>
                  <th className="px-3 py-2 text-left">Phòng Chiếu</th>
                  <th className="px-3 py-2 text-left">Loại Ghế</th>
                  <th className="px-3 py-2 text-left">Trạng Thái</th>
                  <th className="px-3 py-2 text-left">Thao Tác</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-6 text-gray-400"
                    >
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  filtered.map((seat, index) => {
                    const seatId = getSeatId(seat);

                    return (
                      <tr
                        key={seatId}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-3 py-2">{index + 1}</td>

                        <td className="px-3 py-2 font-medium">
                          {getSeatCode(seat)}
                        </td>

                        <td className="px-3 py-2">
                          {getRoomNameBySeat(seat)}
                        </td>

                        <td className="px-3 py-2">
                          {getSeatType(seat)}
                        </td>

                        <td className="px-3 py-2">
                          {getSeatStatus(seat)}
                        </td>

                        <td className="px-3 py-2 flex gap-2">
                          <button
                            className="text-blue-600 hover:underline text-xs"
                            onClick={() => openEditModal(seat)}
                          >
                            Sửa
                          </button>

                          <button
                            className="text-red-500 hover:underline text-xs"
                            onClick={() => handleDelete(seatId)}
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
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h5 className="font-bold text-lg mb-4 text-gray-800">
                {editId !== null ? "Cập Nhật Ghế" : "Thêm Ghế Mới"}
              </h5>

              {formError && (
                <p className="text-red-500 text-sm mb-3">{formError}</p>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hàng <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      name="seatRow"
                      value={form.seatRow}
                      onChange={handleChange}
                      placeholder="VD: A"
                      maxLength={2}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số Ghế <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      name="seatNumber"
                      value={form.seatNumber}
                      onChange={handleChange}
                      placeholder="VD: 1 hoặc A1"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại Ghế
                  </label>

                  <select
                    name="seatType"
                    value={form.seatType}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng Thái
                  </label>

                  <select
                    name="isActive"
                    value={String(form.isActive)}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        isActive: e.target.value === "true",
                      }))
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="true">Hoạt động</option>
                    <option value="false">Ngừng hoạt động</option>
                  </select>
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