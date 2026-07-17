import { useEffect, useMemo, useState } from "react";
import {
  getRoomList,
  createRoom,
  updateRoom,
  deleteRoom,
} from "./roomService";
import { getCinemaList } from "../Cinema/cinemaService";

const DEFAULT_TEXT = {
  roomName: "Chưa có tên phòng",
  cinemaName: "Chưa có rạp",
  roomType: "Chưa có",
  area: "Không xác định",
};

const EMPTY_ROOM_FORM = {
  roomName: "",
  cinemaId: "",
  totalSeats: "",
  roomType: "",
  isActive: true,
};

const ROOM_TYPE_OPTIONS = [
  { value: "", label: "-- Chọn loại phòng --" },
  { value: "2D", label: "2D" },
  { value: "3D", label: "3D" },
  { value: "IMAX", label: "IMAX" },
  { value: "4DX", label: "4DX" },
];

const ROOM_STATUS_OPTIONS = [
  { value: "true", label: "Hoạt động" },
  { value: "false", label: "Ngừng hoạt động" },
];

const ROOM_FIELDS = {
  id: ["roomId", "RoomId", "id", "Id"],
  name: ["roomName", "RoomName", "name", "Name"],

  cinemaId: [
    "cinemaId",
    "CinemaId",
    "cinema.cinemaId",
    "cinema.CinemaId",
    "Cinema.cinemaId",
    "Cinema.CinemaId",
  ],

  cinemaName: [
    "cinemaName",
    "CinemaName",
    "cinema.cinemaName",
    "cinema.CinemaName",
    "Cinema.cinemaName",
    "Cinema.CinemaName",
    "cinema.name",
    "cinema.Name",
    "Cinema.name",
    "Cinema.Name",
  ],

  totalSeats: ["totalSeats", "TotalSeats", "capacity", "Capacity"],
  roomType: ["roomType", "RoomType", "type", "Type"],
  isActive: ["isActive", "IsActive", "active", "Active", "status", "Status"],

  area: [
    "areaName",
    "AreaName",
    "area",
    "Area",
    "region",
    "Region",
    "city",
    "City",
    "province",
    "Province",
    "district",
    "District",
    "location",
    "Location",
    "address",
    "Address",

    "cinema.areaName",
    "cinema.AreaName",
    "cinema.area",
    "cinema.Area",
    "cinema.city",
    "cinema.City",
    "cinema.province",
    "cinema.Province",
    "cinema.address",
    "cinema.Address",

    "Cinema.areaName",
    "Cinema.AreaName",
    "Cinema.area",
    "Cinema.Area",
    "Cinema.city",
    "Cinema.City",
    "Cinema.province",
    "Cinema.Province",
    "Cinema.address",
    "Cinema.Address",
  ],
};

const CINEMA_FIELDS = {
  id: ["cinemaId", "CinemaId", "id", "Id"],
  name: ["cinemaName", "CinemaName", "name", "Name"],

  area: [
    "areaName",
    "AreaName",
    "area",
    "Area",
    "region",
    "Region",
    "city",
    "City",
    "province",
    "Province",
    "district",
    "District",
    "location",
    "Location",
    "address",
    "Address",
  ],
};

function getValueByPath(source, path) {
  return path.split(".").reduce((current, key) => {
    if (current === null || current === undefined) return undefined;
    return current[key];
  }, source);
}

function pickValue(source, paths, fallback = "") {
  for (const path of paths) {
    const value = getValueByPath(source, path);

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return fallback;
}

function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;

  return [];
}

function getRoomId(room) {
  return pickValue(room, ROOM_FIELDS.id);
}

function getRoomName(room) {
  return pickValue(room, ROOM_FIELDS.name, DEFAULT_TEXT.roomName);
}

function getRoomCinemaId(room) {
  return pickValue(room, ROOM_FIELDS.cinemaId);
}

function getRoomCinemaNameWithoutFallback(room) {
  return pickValue(room, ROOM_FIELDS.cinemaName);
}

function getRoomTotalSeats(room) {
  return pickValue(room, ROOM_FIELDS.totalSeats, 0);
}

function getRoomType(room) {
  return pickValue(room, ROOM_FIELDS.roomType, DEFAULT_TEXT.roomType);
}

function getRoomIsActive(room) {
  const value = pickValue(room, ROOM_FIELDS.isActive, true);

  if (value === true) return true;
  if (value === false) return false;

  const normalizedValue = String(value).toLowerCase();

  if (normalizedValue === "true") return true;
  if (normalizedValue === "false") return false;
  if (normalizedValue === "active") return true;
  if (normalizedValue === "inactive") return false;
  if (normalizedValue === "hoạt động") return true;
  if (normalizedValue === "ngừng hoạt động") return false;

  return true;
}

function getRoomStatusText(room) {
  return getRoomIsActive(room) ? "Hoạt động" : "Ngừng hoạt động";
}

function getCinemaId(cinema) {
  return pickValue(cinema, CINEMA_FIELDS.id);
}

function getCinemaName(cinema) {
  return pickValue(cinema, CINEMA_FIELDS.name, DEFAULT_TEXT.cinemaName);
}

function getCinemaArea(cinema) {
  return pickValue(cinema, CINEMA_FIELDS.area, DEFAULT_TEXT.area);
}

function findCinemaByRoom(room, cinemas = []) {
  const roomCinemaId = getRoomCinemaId(room);
  const roomCinemaName = getRoomCinemaNameWithoutFallback(room);

  return cinemas.find((cinema) => {
    const cinemaId = getCinemaId(cinema);
    const cinemaName = getCinemaName(cinema);

    if (roomCinemaId && cinemaId) {
      return String(cinemaId) === String(roomCinemaId);
    }

    if (roomCinemaName && cinemaName) {
      return String(cinemaName) === String(roomCinemaName);
    }

    return false;
  });
}

export function getRoomCinemaName(room, cinemas = []) {
  const directCinemaName = getRoomCinemaNameWithoutFallback(room);

  if (directCinemaName) return directCinemaName;

  const foundCinema = findCinemaByRoom(room, cinemas);

  if (foundCinema) return getCinemaName(foundCinema);

  return DEFAULT_TEXT.cinemaName;
}

function getRoomArea(room, cinemas = []) {
  const directArea = pickValue(room, ROOM_FIELDS.area);

  if (directArea) return directArea;

  const foundCinema = findCinemaByRoom(room, cinemas);

  if (foundCinema) return getCinemaArea(foundCinema);

  return DEFAULT_TEXT.area;
}

function isRoomBelongToCinema(room, cinema) {
  if (!room || !cinema) return false;

  const roomCinemaId = getRoomCinemaId(room);
  const cinemaId = getCinemaId(cinema);

  if (roomCinemaId && cinemaId) {
    return String(roomCinemaId) === String(cinemaId);
  }

  const roomCinemaName = getRoomCinemaNameWithoutFallback(room);
  const cinemaName = getCinemaName(cinema);

  if (roomCinemaName && cinemaName) {
    return String(roomCinemaName) === String(cinemaName);
  }

  return false;
}

function buildCinemaOptions(cinemas) {
  return cinemas.map((cinema) => ({
    value: getCinemaId(cinema),
    label: getCinemaName(cinema),
  }));
}

function buildSelectedRoomInfo(room, cinemas) {
  if (!room) return null;

  return {
    id: getRoomId(room),
    name: getRoomName(room),
    area: getRoomArea(room, cinemas),
    cinemaName: getRoomCinemaName(room, cinemas),
    roomType: getRoomType(room),
    totalSeats: getRoomTotalSeats(room),
    statusText: getRoomStatusText(room),
  };
}

function buildFormFromRoom(room) {
  return {
    roomName: getRoomName(room) === DEFAULT_TEXT.roomName ? "" : getRoomName(room),
    cinemaId: getRoomCinemaId(room),
    totalSeats: getRoomTotalSeats(room),
    roomType: getRoomType(room) === DEFAULT_TEXT.roomType ? "" : getRoomType(room),
    isActive: getRoomIsActive(room),
  };
}

function validateRoomForm(form) {
  if (!form.cinemaId) {
    return "Vui lòng chọn rạp chiếu.";
  }

  if (!String(form.roomName).trim()) {
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

function buildRoomPayload(form, editId = null) {
  return {
    roomId: editId ? Number(editId) : 0,
    cinemaId: Number(form.cinemaId),
    roomName: String(form.roomName).trim(),
    roomType: form.roomType,
    totalSeats: Number(form.totalSeats),
    isActive: form.isActive === true || form.isActive === "true",
  };
}

export function useRoom() {
  const [rooms, setRooms] = useState([]);
  const [cinemas, setCinemas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [selectedCinemaId, setSelectedCinemaId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_ROOM_FORM });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEditing = editId !== null;

  useEffect(() => {
    fetchData();
  }, []);

  const cinemaOptions = useMemo(() => {
    return buildCinemaOptions(cinemas);
  }, [cinemas]);

  const selectedCinema = useMemo(() => {
    return cinemas.find(
      (cinema) => String(getCinemaId(cinema)) === String(selectedCinemaId)
    );
  }, [cinemas, selectedCinemaId]);

  const selectedCinemaArea = useMemo(() => {
    if (!selectedCinema) return "";
    return getCinemaArea(selectedCinema);
  }, [selectedCinema]);

  const roomsByCinema = useMemo(() => {
    if (!selectedCinema) return [];

    return rooms.filter((room) => isRoomBelongToCinema(room, selectedCinema));
  }, [rooms, selectedCinema]);

  const selectedRoom = useMemo(() => {
    return rooms.find(
      (room) => String(getRoomId(room)) === String(selectedRoomId)
    );
  }, [rooms, selectedRoomId]);

  const selectedRoomInfo = useMemo(() => {
    return buildSelectedRoomInfo(selectedRoom, cinemas);
  }, [selectedRoom, cinemas]);

  const roomButtons = useMemo(() => {
    return roomsByCinema.map((room) => {
      const roomId = getRoomId(room);

      return {
        id: roomId,
        name: getRoomName(room),
        isSelected: String(selectedRoomId) === String(roomId),
        onClick: () => handleRoomSelect(roomId),
      };
    });
  }, [roomsByCinema, selectedRoomId]);

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const [roomData, cinemaData] = await Promise.all([
        getRoomList(),
        getCinemaList(),
      ]);

      setRooms(normalizeArray(roomData));
      setCinemas(normalizeArray(cinemaData));
    } catch (err) {
      console.error("Lỗi tải dữ liệu phòng chiếu:", err);

      setError(err.message || "Lỗi tải dữ liệu.");
      setRooms([]);
      setCinemas([]);
    } finally {
      setLoading(false);
    }
  }

  function handleCinemaChange(e) {
    setSelectedCinemaId(e.target.value);
    setSelectedRoomId("");
  }

  function handleRoomSelect(roomId) {
    setSelectedRoomId(roomId);
  }

  function openAddModal() {
    setEditId(null);
    setForm({
      ...EMPTY_ROOM_FORM,
      cinemaId: selectedCinemaId || "",
    });
    setFormError("");
    setShowModal(true);
  }

  function openEditSelectedRoom() {
    if (!selectedRoom) {
      alert("Vui lòng chọn phòng cần sửa.");
      return;
    }

    setEditId(getRoomId(selectedRoom));
    setForm(buildFormFromRoom(selectedRoom));
    setFormError("");
    setShowModal(true);
  }

  // Card-grid: edit any room directly
  function openEditRoom(room) {
    setEditId(getRoomId(room));
    setForm(buildFormFromRoom(room));
    setFormError("");
    setShowModal(true);
  }

  // Card-grid: delete any room by id
  async function handleDeleteRoom(id) {
    if (!id) return;
    if (!window.confirm("Bạn có chắc muốn xóa phòng chiếu này?")) return;
    try {
      await deleteRoom(id);
      await fetchData();
    } catch (err) {
      console.error("Lỗi xóa phòng chiếu:", err);
      alert(err.message || "Xóa phòng chiếu thất bại.");
    }
  }

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setForm({ ...EMPTY_ROOM_FORM });
    setFormError("");
  }

  const capitalizeWords = (str) => {
    if (!str) return str;
    return str.split(' ').map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };

  function handleChange(e) {
    const { name, value } = e.target;
    
    let finalValue = name === "isActive" ? value === "true" : value;
    if (name === "roomName") {
      finalValue = capitalizeWords(finalValue);
    }

    setForm((prev) => ({
      ...prev,
      [name]: finalValue,
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

    const isDuplicate = rooms.some(r => 
        String(r.cinemaId) === String(form.cinemaId) && 
        r.roomName?.trim().toLowerCase() === form.roomName?.trim().toLowerCase() &&
        String(r.roomId) !== String(editId)
    );

    if (isDuplicate) {
      setFormError(`Tên phòng "${form.roomName}" đã tồn tại trong rạp này. Vui lòng chọn tên khác.`);
      return;
    }

    try {
      setSubmitting(true);

      const payload = buildRoomPayload(form, editId);

      if (isEditing) {
        await updateRoom(editId, payload);
      } else {
        await createRoom(payload);
      }

      closeModal();
      await fetchData();

      if (!selectedCinemaId && form.cinemaId) {
        setSelectedCinemaId(String(form.cinemaId));
      }
    } catch (err) {
      console.error("Lỗi lưu phòng chiếu:", err);
      setFormError(err.message || "Lưu phòng chiếu thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteSelectedRoom() {
    if (!selectedRoom) {
      alert("Vui lòng chọn phòng cần xóa.");
      return;
    }

    const roomId = getRoomId(selectedRoom);
    const roomName = getRoomName(selectedRoom);

    if (!window.confirm(`Bạn có chắc muốn xóa "${roomName}" không?`)) return;

    try {
      await deleteRoom(roomId);
      setSelectedRoomId("");
      await fetchData();
    } catch (err) {
      console.error("Lỗi xóa phòng chiếu:", err);
      alert(err.message || "Xóa phòng chiếu thất bại.");
    }
  }

  return {
    loading,
    error,

    rooms,
    cinemas,
    search,
    setSearch,

    selectedCinemaId,
    cinemaOptions,
    selectedCinemaArea,
    cinemaRoomCount: roomsByCinema.length,
    roomButtons,
    selectedRoomInfo,

    showModal,
    isEditing,
    form,
    formError,
    submitting,
    roomTypeOptions: ROOM_TYPE_OPTIONS,
    roomStatusOptions: ROOM_STATUS_OPTIONS,

    handleCinemaChange,
    handleChange,
    handleSubmit,
    openAddModal,
    openEditRoom,
    openEditSelectedRoom,
    closeModal,
    handleDeleteRoom,
    handleDeleteSelectedRoom,
  };
}