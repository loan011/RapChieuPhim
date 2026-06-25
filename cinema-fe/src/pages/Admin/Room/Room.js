import { useEffect, useState } from "react";
import {
  getRoomList,
  createRoom,
  updateRoom,
  deleteRoom,
} from "./roomService";
import { getCinemaList } from "../Cinema/cinemaService";

export const EMPTY_ROOM_FORM = {
  roomName: "",
  cinemaId: "",
  totalSeats: "",
  roomType: "",
  isActive: true,
};

export const ROOM_TYPE_OPTIONS = [
  {
    value: "",
    label: "-- Chọn loại phòng --",
  },
  {
    value: "2D",
    label: "2D",
  },
  {
    value: "3D",
    label: "3D",
  },
  {
    value: "IMAX",
    label: "IMAX",
  },
  {
    value: "4DX",
    label: "4DX",
  },
];

export const ROOM_STATUS_OPTIONS = [
  {
    value: "true",
    label: "Hoạt động",
  },
  {
    value: "false",
    label: "Ngừng hoạt động",
  },
];

export function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;

  return [];
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
    "Chưa có tên phòng"
  );
}

export function getRoomCinemaId(room) {
  return (
    room?.cinemaId ??
    room?.CinemaId ??
    room?.cinema?.cinemaId ??
    room?.cinema?.CinemaId ??
    room?.Cinema?.cinemaId ??
    room?.Cinema?.CinemaId ??
    ""
  );
}

export function getRoomCinemaName(room, cinemas = []) {
  const directCinemaName =
    room?.cinemaName ??
    room?.CinemaName ??
    room?.cinema?.cinemaName ??
    room?.cinema?.CinemaName ??
    room?.Cinema?.cinemaName ??
    room?.Cinema?.CinemaName;

  if (directCinemaName) return directCinemaName;

  const cinemaId = getRoomCinemaId(room);

  const foundCinema = cinemas.find(
    (cinema) => String(getCinemaId(cinema)) === String(cinemaId)
  );

  if (foundCinema) return getCinemaName(foundCinema);

  return "Chưa có rạp";
}

export function getRoomTotalSeats(room) {
  return (
    room?.totalSeats ??
    room?.TotalSeats ??
    room?.capacity ??
    room?.Capacity ??
    0
  );
}

export function getRoomType(room) {
  return (
    room?.roomType ??
    room?.RoomType ??
    room?.type ??
    room?.Type ??
    "Chưa có"
  );
}

export function getRoomIsActive(room) {
  const value =
    room?.isActive ??
    room?.IsActive ??
    room?.active ??
    room?.Active ??
    room?.status ??
    room?.Status;

  if (value === true) return true;
  if (value === false) return false;
  if (value === "Active") return true;
  if (value === "Inactive") return false;

  return true;
}

export function getRoomStatusText(room) {
  return getRoomIsActive(room) ? "Hoạt động" : "Ngừng hoạt động";
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
    "Chưa có rạp"
  );
}

export function buildFormFromRoom(room) {
  return {
    roomName: getRoomName(room) === "Chưa có tên phòng"
      ? ""
      : getRoomName(room),
    cinemaId: getRoomCinemaId(room),
    totalSeats: getRoomTotalSeats(room),
    roomType: getRoomType(room) === "Chưa có"
      ? ""
      : getRoomType(room),
    isActive: getRoomIsActive(room),
  };
}

export function validateRoomForm(form) {
  if (!form.cinemaId) {
    return "Vui lòng chọn rạp chiếu.";
  }

  if (!form.roomName.trim()) {
    return "Vui lòng nhập tên phòng chiếu.";
  }

  if (
    !form.totalSeats ||
    Number.isNaN(Number(form.totalSeats)) ||
    Number(form.totalSeats) <= 0
  ) {
    return "Vui lòng nhập sức chứa hợp lệ.";
  }

  return "";
}

export function buildRoomPayload(form, editId = null) {
  return {
    roomId: editId ? Number(editId) : 0,
    cinemaId: Number(form.cinemaId),
    roomName: form.roomName.trim(),
    roomType: form.roomType,
    totalSeats: Number(form.totalSeats),
    isActive: form.isActive === true || form.isActive === "true",
  };
}

export function useRoom() {
  const [list, setList] = useState([]);
  const [cinemas, setCinemas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_ROOM_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const [roomData, cinemaData] = await Promise.all([
        getRoomList(),
        getCinemaList(),
      ]);

      setList(normalizeArray(roomData));
      setCinemas(normalizeArray(cinemaData));
    } catch (err) {
      console.error("Lỗi tải phòng chiếu:", err);

      setError(err.message || "Lỗi tải dữ liệu.");
      setList([]);
      setCinemas([]);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditId(null);
    setForm(EMPTY_ROOM_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(room) {
    setEditId(getRoomId(room));
    setForm(buildFormFromRoom(room));
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setForm(EMPTY_ROOM_FORM);
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

    const validateMessage = validateRoomForm(form);

    if (validateMessage) {
      setFormError(validateMessage);
      return;
    }

    try {
      setSubmitting(true);

      const payload = buildRoomPayload(form, editId);

      if (editId !== null) {
        await updateRoom(editId, payload);
      } else {
        await createRoom(payload);
      }

      closeModal();
      fetchData();
    } catch (err) {
      console.error("Lỗi lưu phòng chiếu:", err);
      setFormError(err.message || "Lưu phòng chiếu thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Bạn có chắc muốn xóa phòng chiếu này?")) return;

    try {
      await deleteRoom(id);
      fetchData();
    } catch (err) {
      console.error("Lỗi xóa phòng chiếu:", err);
      alert(err.message || "Xóa phòng chiếu thất bại.");
    }
  }

  return {
    list,
    setList,

    cinemas,
    setCinemas,

    loading,
    setLoading,

    error,
    setError,

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