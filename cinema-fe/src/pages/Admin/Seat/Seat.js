import { useEffect, useState } from "react";
import {
  getSeatList,
  createSeat,
  updateSeat,
  deleteSeat,
} from "./seatService";
import { getRoomList } from "../Room/roomService";
import { getCinemaList } from "../Cinema/cinemaService";

export const SEAT_TYPE_OPTIONS = [
  {
    value: "Standard",
    label: "Standard",
  },
  {
    value: "VIP",
    label: "VIP",
  },
  {
    value: "Couple",
    label: "Couple",
  },
];

export const SEAT_STATUS_OPTIONS = [
  {
    value: "true",
    label: "Hoạt động",
  },
  {
    value: "false",
    label: "Ngừng hoạt động",
  },
];

export const EMPTY_SEAT_FORM = {
  roomId: "",
  seatRow: "",
  seatNumber: "",
  seatType: "Standard",
  isActive: true,
};

export function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;

  return [];
}

export function getSeatId(seat) {
  return seat?.seatId ?? seat?.SeatId ?? seat?.id ?? seat?.Id;
}

export function getSeatRoomId(seat) {
  return (
    seat?.roomId ??
    seat?.RoomId ??
    seat?.room?.roomId ??
    seat?.room?.RoomId ??
    seat?.Room?.roomId ??
    seat?.Room?.RoomId
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

export function getRoomCinemaId(room) {
  return (
    room?.cinemaId ??
    room?.CinemaId ??
    room?.cinema?.cinemaId ??
    room?.cinema?.CinemaId ??
    room?.Cinema?.cinemaId ??
    room?.Cinema?.CinemaId
  );
}

export function getCinemaId(cinema) {
  return cinema?.cinemaId ?? cinema?.CinemaId ?? cinema?.id ?? cinema?.Id;
}

export function getCinemaName(cinema) {
  return (
    cinema?.cinemaName ??
    cinema?.CinemaName ??
    cinema?.name ??
    cinema?.Name ??
    "Chưa có tên rạp"
  );
}

export function getRoomFullName(room, cinemas = []) {
  if (!room) return "Chưa có phòng";

  const roomName = getRoomName(room);

  const cinemaNameFromRoom =
    room?.cinemaName ??
    room?.CinemaName ??
    room?.cinema?.cinemaName ??
    room?.cinema?.CinemaName ??
    room?.Cinema?.cinemaName ??
    room?.Cinema?.CinemaName;

  if (cinemaNameFromRoom) {
    return `${roomName} - ${cinemaNameFromRoom}`;
  }

  const cinemaId = getRoomCinemaId(room);

  const cinema = cinemas.find(
    (item) => String(getCinemaId(item)) === String(cinemaId)
  );

  if (cinema) {
    return `${roomName} - ${getCinemaName(cinema)}`;
  }

  if (cinemaId) {
    return `${roomName} - Cinema ID ${cinemaId}`;
  }

  return roomName;
}

export function getRoomNameBySeat(seat, rooms = [], cinemas = []) {
  const roomId = getSeatRoomId(seat);

  if (!roomId) return "Chưa có phòng";

  const room = rooms.find(
    (item) => String(getRoomId(item)) === String(roomId)
  );

  if (!room) return `Phòng ID ${roomId}`;

  return getRoomFullName(room, cinemas);
}

export function getSeatRow(seat) {
  return seat?.seatRow ?? seat?.SeatRow ?? seat?.row ?? "";
}

export function getSeatNumber(seat) {
  return seat?.seatNumber ?? seat?.SeatNumber ?? seat?.col ?? "";
}

export function getSeatType(seat) {
  return seat?.seatType ?? seat?.SeatType ?? seat?.type ?? "Standard";
}

export function getSeatCode(seat) {
  const row = String(getSeatRow(seat)).trim();
  const number = String(getSeatNumber(seat)).trim();

  if (!row && !number) return "Chưa có";

  if (/^[A-Za-z]+\d+$/.test(number)) {
    return number.toUpperCase();
  }

  return `${row}${number}`.toUpperCase();
}

export function getSeatStatus(seat) {
  const isActive = seat?.isActive ?? seat?.IsActive;

  if (isActive === true) return "Hoạt động";
  if (isActive === false) return "Ngừng hoạt động";

  return seat?.status ?? seat?.Status ?? "Chưa có";
}

export function getSeatSortNumber(seat) {
  const code = getSeatCode(seat);
  const match = code.match(/\d+/);

  return match ? Number(match[0]) : 0;
}

export function buildFormFromSeat(seat) {
  return {
    roomId: getSeatRoomId(seat) ?? "",
    seatRow: getSeatRow(seat),
    seatNumber: getSeatNumber(seat),
    seatType: getSeatType(seat),
    isActive: seat?.isActive ?? seat?.IsActive ?? true,
  };
}

export function validateSeatForm(form) {
  if (!form.roomId) {
    return "Vui lòng chọn phòng chiếu.";
  }

  if (!form.seatRow.trim()) {
    return "Vui lòng nhập hàng ghế.";
  }

  if (!String(form.seatNumber).trim()) {
    return "Vui lòng nhập số ghế.";
  }

  return "";
}

export function buildSeatPayload(form, editId = null) {
  const payload = {
    roomId: Number(form.roomId),
    seatRow: form.seatRow.trim().toUpperCase(),
    seatNumber: String(form.seatNumber).trim(),
    seatType: form.seatType,
    isActive: form.isActive === true || form.isActive === "true",
  };

  if (editId !== null) {
    return {
      seatId: editId,
      ...payload,
    };
  }

  return payload;
}

export function filterSeatList({
  list,
  filterRoom,
  filterType,
}) {
  return list
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
}

export function useSeat() {
  const [list, setList] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [cinemas, setCinemas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterRoom, setFilterRoom] = useState("");
  const [filterType, setFilterType] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_SEAT_FORM);
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

      setList(normalizeArray(seatData));
      setRooms(normalizeArray(roomData));
      setCinemas(normalizeArray(cinemaData));
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

  function openAddModal() {
    setEditId(null);
    setForm(EMPTY_SEAT_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(seat) {
    setEditId(getSeatId(seat));
    setForm(buildFormFromSeat(seat));
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setForm(EMPTY_SEAT_FORM);
    setFormError("");
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "isActive" ? value === "true" : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    const validateMessage = validateSeatForm(form);

    if (validateMessage) {
      setFormError(validateMessage);
      return;
    }

    const payload = buildSeatPayload(form, editId);

    try {
      setSubmitting(true);

      if (editId !== null) {
        await updateSeat(editId, payload);
      } else {
        await createSeat(payload);
      }

      closeModal();
      fetchData();
    } catch (err) {
      console.error("Lỗi lưu ghế:", err);
      setFormError(err?.message || "Lưu ghế thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Bạn có chắc muốn xóa ghế này?")) return;

    try {
      await deleteSeat(id);
      fetchData();
    } catch (err) {
      console.error("Lỗi xóa ghế:", err);
      alert(err?.message || "Xóa ghế thất bại.");
    }
  }

  const filtered = filterSeatList({
    list,
    filterRoom,
    filterType,
  });

  return {
    list,
    setList,

    rooms,
    setRooms,

    cinemas,
    setCinemas,

    loading,
    setLoading,

    error,
    setError,

    filterRoom,
    setFilterRoom,

    filterType,
    setFilterType,

    filtered,

    showModal,
    setShowModal,

    editId,
    setEditId,

    form,
    setForm,

    submitting,
    setSubmitting,

    formError,
    setFormError,

    fetchData,
    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmit,
    handleDelete,
  };
}