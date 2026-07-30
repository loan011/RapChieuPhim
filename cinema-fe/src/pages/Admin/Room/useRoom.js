import { useEffect, useMemo, useState, useRef } from "react";
import {
  getRoomList,
  createRoom,
  updateRoom,
  deleteRoom,
} from "./roomService";
import { getCinemaList } from "../Cinema/cinemaService";
import {
  useSeat,
  getSeatId,
  getSeatCode,
  getSeatRow,
  getSeatNumber,
  getSeatType,
  getSeatStatus,
  getRoomFullName,
} from "../Seat/useSeat";
import { updateSeat } from "../Seat/seatService";
import { fetchActiveTicketPricings } from "../../Ticket/ticketPriceService";

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
    return "Vui lòng chọn chi nhánh.";
  }

  if (!String(form.roomName || "").trim()) {
    return "Vui lòng nhập tên phòng chiếu (nhập số phòng).";
  }

  if (!form.roomType) {
    return "Vui lòng chọn loại phòng chiếu.";
  }

  if (
    !form.totalSeats ||
    Number.isNaN(Number(form.totalSeats)) ||
    Number(form.totalSeats) <= 0
  ) {
    return "Vui lòng nhập sức chứa phòng chiếu hợp lệ.";
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

  function openAddModal(initialCinemaId = "") {
    setEditId(null);
    setForm({
      ...EMPTY_ROOM_FORM,
      cinemaId: initialCinemaId || selectedCinemaId || "",
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
      const digitsOnly = value.replace(/[^0-9]/g, "");
      finalValue = digitsOnly ? `Rạp ${digitsOnly}` : "";
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

    const targetRoomName = String(form.roomName || "").trim().toLowerCase();
    const targetCinemaId = String(form.cinemaId || "").trim();

    if (targetRoomName && targetCinemaId) {
      const isDuplicate = rooms.some((r) => {
        const rCinemaId = String(r?.cinemaId ?? r?.CinemaId ?? r?.cinema?.cinemaId ?? r?.cinema?.CinemaId ?? "").trim();
        const rRoomName = String(r?.roomName ?? r?.RoomName ?? "").trim().toLowerCase();
        const rRoomId = String(r?.roomId ?? r?.RoomId ?? r?.id ?? "").trim();

        const isSameCinema = rCinemaId === targetCinemaId;
        const isSameName = rRoomName === targetRoomName;
        const isDifferentRoom = !editId || rRoomId !== String(editId);

        return isSameCinema && isSameName && isDifferentRoom;
      });

      if (isDuplicate) {
        setFormError("Đã có tên phòng chiếu này rồi");
        return;
      }
    }

    try {
      setSubmitting(true);

      const payload = buildRoomPayload(form, editId);

      if (isEditing) {
        try {
          await updateRoom(editId, payload);
        } catch (apiErr) {
          console.warn("Cập nhật phòng qua API thất bại, lưu cục bộ:", apiErr);
          setRooms(prev => prev.map(r => String(r.roomId || r.RoomId || r.id) === String(editId) ? { ...r, ...payload } : r));
        }
      } else {
        try {
          await createRoom(payload);
        } catch (apiErr) {
          console.warn("Thêm phòng qua API thất bại, lưu cục bộ:", apiErr);
          const newRoom = {
            roomId: Date.now(),
            cinemaId: Number(form.cinemaId),
            roomName: String(form.roomName).trim(),
            roomType: form.roomType || "2D",
            totalSeats: Number(form.totalSeats) || 60,
            isActive: form.isActive === true || form.isActive === "true",
          };
          setRooms(prev => [...prev, newRoom]);
        }
      }

      closeModal();
      await fetchData().catch(() => null);

      if (!selectedCinemaId && form.cinemaId) {
        setSelectedCinemaId(String(form.cinemaId));
      }
    } catch (err) {
      setFormError(err?.message || "Không thể thực hiện thao tác này. Vui lòng thử lại!");
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

export function getStatusInfo(room) {
  const v = room?.isActive ?? room?.IsActive ?? room?.status ?? room?.Status;
  const name = String(room?.roomName ?? room?.RoomName ?? "").toLowerCase();
  
  if (name.includes("05") || name.includes("dọn") || name.includes("clean")) {
    return { dotClass: "cleaning", label: "Đang dọn dẹp" };
  }
  if (v === "maintenance" || v === "Bảo trì" || name.includes("03") || name.includes("trì")) {
    return { dotClass: "maintenance", label: "Bảo trì máy chiếu" };
  }
  return { dotClass: "active", label: "Sẵn sàng" };
}

export function groupRowSeats(seats, getSeatTypeFn) {
  const getSeatType = getSeatTypeFn || ((seat) => seat?.seatType ?? seat?.SeatType ?? "Standard");
  const grouped = [];
  let i = 0;
  while (i < seats.length) {
    const seat = seats[i];
    const type = getSeatType(seat).toLowerCase();

    if (
      type === "couple" &&
      i + 1 < seats.length &&
      getSeatType(seats[i + 1]).toLowerCase() === "couple"
    ) {
      grouped.push({
        isGroup: true,
        seats: [seat, seats[i + 1]],
        type: "couple",
      });
      i += 2;
    } else {
      grouped.push({
        isGroup: false,
        seat: seat,
        type: type,
      });
      i += 1;
    }
  }
  return grouped;
}

export function useRoomAdmin() {
  const roomHook = useRoom();
  const { rooms, cinemas, roomForm, showModal: showRoomModal, isEditing: isEditingRoom, handleSubmit: handleRoomSubmit } = roomHook;

  const seatHook = useSeat();
  const { filterRoom, setFilterRoom, selectedRoomSeats, seatMapLayout } = seatHook;

  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedCinemaFilter, setSelectedCinemaFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);

  const [showLayoutEditor, setShowLayoutEditor] = useState(false);
  const [layoutRowTypes, setLayoutRowTypes] = useState({});
  const [seatOverrides, setSeatOverrides] = useState({});
  const [editMode, setEditMode] = useState('row');
  const [expandedRow, setExpandedRow] = useState(null);
  const [layoutSaving, setLayoutSaving] = useState(false);
  const [layoutError, setLayoutError] = useState('');

  const [priceStdWeekday, setPriceStdWeekday] = useState("");
  const [priceStdWeekend, setPriceStdWeekend] = useState("");
  const [priceVipWeekday, setPriceVipWeekday] = useState("");
  const [priceVipWeekend, setPriceVipWeekend] = useState("");
  const [priceCoupleWeekday, setPriceCoupleWeekday] = useState("");
  const [priceCoupleWeekend, setPriceCoupleWeekend] = useState("");
  const [syncAllRooms, setSyncAllRooms] = useState(false);
  const [activePricings, setActivePricings] = useState([]);

  useEffect(() => {
    fetchActiveTicketPricings()
      .then(data => {
        if (Array.isArray(data)) setActivePricings(data);
        else if (Array.isArray(data?.data)) setActivePricings(data.data);
        else if (Array.isArray(data?.$values)) setActivePricings(data.$values);
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (showRoomModal && roomForm) {
      const getDbFormatted = (rType, sType, isWe) => {
        let dbPricings = activePricings;
        if ((!dbPricings || dbPricings.length === 0) && typeof localStorage !== "undefined") {
          try { dbPricings = JSON.parse(localStorage.getItem("active_ticket_pricings") || "[]"); } catch(e) {}
        }
        if (!Array.isArray(dbPricings) || dbPricings.length === 0) return null;

        const rTypeUpper = String(rType || "2D").trim().toUpperCase();
        const isImaxType = rTypeUpper.includes("IMAX");
        const targetSeat = String(sType || "").toLowerCase();
        const dayTarget = isWe ? "weekend" : "weekday";

        const item = dbPricings.find(p => {
          const pRoom = String(p.roomType || p.RoomType || "").trim().toUpperCase();
          const pSeat = String(p.seatType || p.SeatType || "").trim().toLowerCase();
          const pDay = String(p.dayType || p.DayType || (p.isWeekend ? "Weekend" : "Weekday")).trim().toLowerCase();
          const matchRoom = (isImaxType && pRoom.includes("IMAX")) || (!isImaxType && pRoom === rTypeUpper) || (!pRoom && rTypeUpper === "2D");
          const matchSeat = pSeat.includes(targetSeat);
          const matchDay = pDay === dayTarget;
          return matchRoom && matchSeat && matchDay;
        });
        return item ? new Intl.NumberFormat("vi-VN").format(Number(item.price || item.Price)) : null;
      };

      const cId = roomForm.cinemaId;
      const rName = roomForm.roomName;
      const currentType = roomForm.roomType || "2D";
      const isImax = String(currentType).toUpperCase().includes("IMAX");

      const stdWd = isEditingRoom ? localStorage.getItem(`room_price_std_wd_c${cId}_r${rName}`) : null;
      const stdWe = isEditingRoom ? localStorage.getItem(`room_price_std_we_c${cId}_r${rName}`) : null;
      const vipWd = isEditingRoom ? localStorage.getItem(`room_price_vip_wd_c${cId}_r${rName}`) : null;
      const vipWe = isEditingRoom ? localStorage.getItem(`room_price_vip_we_c${cId}_r${rName}`) : null;
      const cpWd = isEditingRoom ? localStorage.getItem(`room_price_cp_wd_c${cId}_r${rName}`) : null;
      const cpWe = isEditingRoom ? localStorage.getItem(`room_price_cp_we_c${cId}_r${rName}`) : null;

      const dbStdWd = getDbFormatted(currentType, "standard", false);
      const dbStdWe = getDbFormatted(currentType, "standard", true);
      const dbVipWd = getDbFormatted(currentType, "vip", false);
      const dbVipWe = getDbFormatted(currentType, "vip", true);
      const dbCpWd = getDbFormatted(currentType, "couple", false);
      const dbCpWe = getDbFormatted(currentType, "couple", true);

      setPriceStdWeekday(stdWd || dbStdWd || (isImax ? "150.000" : "70.000"));
      setPriceStdWeekend(stdWe || dbStdWe || (isImax ? "180.000" : "90.000"));
      setPriceVipWeekday(vipWd || dbVipWd || (isImax ? "180.000" : "90.000"));
      setPriceVipWeekend(vipWe || dbVipWe || (isImax ? "220.000" : "120.000"));
      setPriceCoupleWeekday(cpWd || dbCpWd || (isImax ? "200.000" : "130.000"));
      setPriceCoupleWeekend(cpWe || dbCpWe || (isImax ? "250.000" : "160.000"));
    }
  }, [showRoomModal, isEditingRoom, roomForm?.cinemaId, roomForm?.roomName, activePricings]);

  useEffect(() => {
    if (showRoomModal && roomForm && !isEditingRoom) {
      const getDbFormatted = (rType, sType, isWe) => {
        let dbPricings = activePricings;
        if ((!dbPricings || dbPricings.length === 0) && typeof localStorage !== "undefined") {
          try { dbPricings = JSON.parse(localStorage.getItem("active_ticket_pricings") || "[]"); } catch(e) {}
        }
        if (!Array.isArray(dbPricings) || dbPricings.length === 0) return null;

        const rTypeUpper = String(rType || "2D").trim().toUpperCase();
        const isImaxType = rTypeUpper.includes("IMAX");
        const targetSeat = String(sType || "").toLowerCase();
        const dayTarget = isWe ? "weekend" : "weekday";

        const item = dbPricings.find(p => {
          const pRoom = String(p.roomType || p.RoomType || "").trim().toUpperCase();
          const pSeat = String(p.seatType || p.SeatType || "").trim().toLowerCase();
          const pDay = String(p.dayType || p.DayType || (p.isWeekend ? "Weekend" : "Weekday")).trim().toLowerCase();
          const matchRoom = (isImaxType && pRoom.includes("IMAX")) || (!isImaxType && pRoom === rTypeUpper) || (!pRoom && rTypeUpper === "2D");
          const matchSeat = pSeat.includes(targetSeat);
          const matchDay = pDay === dayTarget;
          return matchRoom && matchSeat && matchDay;
        });
        return item ? new Intl.NumberFormat("vi-VN").format(Number(item.price || item.Price)) : null;
      };

      const currentType = roomForm.roomType || "2D";
      const isImax = String(currentType).toUpperCase().includes("IMAX");

      const dbStdWd = getDbFormatted(currentType, "standard", false);
      const dbStdWe = getDbFormatted(currentType, "standard", true);
      const dbVipWd = getDbFormatted(currentType, "vip", false);
      const dbVipWe = getDbFormatted(currentType, "vip", true);
      const dbCpWd = getDbFormatted(currentType, "couple", false);
      const dbCpWe = getDbFormatted(currentType, "couple", true);

      setPriceStdWeekday(dbStdWd || (isImax ? "150.000" : "70.000"));
      setPriceStdWeekend(dbStdWe || (isImax ? "180.000" : "90.000"));
      setPriceVipWeekday(dbVipWd || (isImax ? "180.000" : "90.000"));
      setPriceVipWeekend(dbVipWe || (isImax ? "220.000" : "120.000"));
      setPriceCoupleWeekday(dbCpWd || (isImax ? "200.000" : "130.000"));
      setPriceCoupleWeekend(dbCpWe || (isImax ? "250.000" : "160.000"));
    }
  }, [roomForm?.roomType, showRoomModal, isEditingRoom, activePricings]);

  const handleCustomRoomSubmit = async (e) => {
    e.preventDefault();
    const cId = roomForm.cinemaId;
    const rName = roomForm.roomName;
    const currentRoomType = roomForm.roomType || "2D";

    localStorage.setItem(`room_price_std_wd_c${cId}_r${rName}`, priceStdWeekday);
    localStorage.setItem(`room_price_std_we_c${cId}_r${rName}`, priceStdWeekend);
    localStorage.setItem(`room_price_vip_wd_c${cId}_r${rName}`, priceVipWeekday);
    localStorage.setItem(`room_price_vip_we_c${cId}_r${rName}`, priceVipWeekend);
    localStorage.setItem(`room_price_cp_wd_c${cId}_r${rName}`, priceCoupleWeekday);
    localStorage.setItem(`room_price_cp_we_c${cId}_r${rName}`, priceCoupleWeekend);

    if (syncAllRooms && rooms && rooms.length > 0) {
      rooms.forEach(room => {
        const roomCinemaId = room?.cinemaId ?? room?.CinemaId ?? room?.cinema?.cinemaId ?? "";
        const type = room?.roomType ?? room?.RoomType ?? "2D";
        const name = room?.roomName ?? room?.RoomName ?? "";
        if (String(roomCinemaId) === String(cId) && String(type).toUpperCase() === String(currentRoomType).toUpperCase()) {
          localStorage.setItem(`room_price_std_wd_c${cId}_r${name}`, priceStdWeekday);
          localStorage.setItem(`room_price_std_we_c${cId}_r${name}`, priceStdWeekend);
          localStorage.setItem(`room_price_vip_wd_c${cId}_r${name}`, priceVipWeekday);
          localStorage.setItem(`room_price_vip_we_c${cId}_r${name}`, priceVipWeekend);
          localStorage.setItem(`room_price_cp_wd_c${cId}_r${name}`, priceCoupleWeekday);
          localStorage.setItem(`room_price_cp_we_c${cId}_r${name}`, priceCoupleWeekend);
        }
      });
    }

    await handleRoomSubmit(e);
  };

  const menuRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (cinemas.length > 0 && !selectedCinemaFilter) {
      const firstId = String(cinemas[0]?.cinemaId ?? cinemas[0]?.CinemaId ?? cinemas[0]?.id ?? cinemas[0]?.Id ?? "");
      setSelectedCinemaFilter(firstId);
    }
  }, [cinemas, selectedCinemaFilter]);

  const filteredRooms = useMemo(() => {
    let list = selectedCinemaFilter
      ? rooms.filter((r) => String(r?.cinemaId ?? r?.CinemaId ?? r?.cinema?.cinemaId ?? "") === selectedCinemaFilter)
      : rooms;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => 
        (r?.roomName ?? r?.RoomName ?? "").toLowerCase().includes(q) ||
        (r?.roomType ?? r?.RoomType ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [rooms, selectedCinemaFilter, searchQuery]);

  useEffect(() => {
    if (filteredRooms.length > 0) {
      const firstRoomId = String(getRoomId(filteredRooms[0]));
      if (!selectedRoomId || !filteredRooms.some(r => String(getRoomId(r)) === selectedRoomId)) {
        setSelectedRoomId(firstRoomId);
        setFilterRoom(firstRoomId);
      }
    } else {
      setSelectedRoomId("");
      setFilterRoom("");
    }
  }, [filteredRooms, selectedRoomId, setFilterRoom]);

  useEffect(() => {
    setSelectedSeat(null);
  }, [selectedRoomId]);

  function handleSelectRoom(roomId) {
    const idStr = String(roomId);
    setSelectedRoomId(idStr);
    setFilterRoom(idStr);
  }

  const activeLayout = seatMapLayout;
  const activeRoom = rooms.find(r => String(getRoomId(r)) === selectedRoomId);
  const activeRoomType = activeRoom?.roomType ?? activeRoom?.RoomType ?? "2D";

  const getDbPricingValue = (rType, sType, isWeekendDay) => {
    let dbPricings = activePricings;
    if ((!dbPricings || dbPricings.length === 0) && typeof localStorage !== "undefined") {
      try { dbPricings = JSON.parse(localStorage.getItem("active_ticket_pricings") || "[]"); } catch(e) {}
    }
    if (!Array.isArray(dbPricings) || dbPricings.length === 0) return null;

    const rTypeUpper = String(rType || "2D").trim().toUpperCase();
    const isImaxType = rTypeUpper.includes("IMAX");
    const targetSeat = String(sType || "").toLowerCase();
    const dayTarget = isWeekendDay ? "weekend" : "weekday";

    const item = dbPricings.find(p => {
      const pRoom = String(p.roomType || p.RoomType || "").trim().toUpperCase();
      const pSeat = String(p.seatType || p.SeatType || "").trim().toLowerCase();
      const pDay = String(p.dayType || p.DayType || (p.isWeekend ? "Weekend" : "Weekday")).trim().toLowerCase();
      const matchRoom = (isImaxType && pRoom.includes("IMAX")) || (!isImaxType && pRoom === rTypeUpper) || (!pRoom && rTypeUpper === "2D");
      const matchSeat = pSeat.includes(targetSeat);
      const matchDay = pDay === dayTarget;
      return matchRoom && matchSeat && matchDay;
    });
    return item ? Number(item.price || item.Price) : null;
  };

  const formatPriceVND = (val) => {
    if (val === null || val === undefined || val === "") return "";
    const num = Number(String(val).replace(/[^0-9]/g, ""));
    if (isNaN(num) || num <= 0) return String(val);
    return new Intl.NumberFormat("vi-VN").format(num) + " đ";
  };

  const getRoomPriceText = (room, type) => {
    const cId = room?.cinemaId ?? room?.CinemaId ?? room?.cinema?.cinemaId ?? "";
    const rName = room?.roomName ?? room?.RoomName ?? "";
    const roomType = String(room?.roomType ?? room?.RoomType ?? "2D").trim().toUpperCase();
    const isImax = roomType.includes("IMAX");

    const formatShorthand = (val, def) => {
      if (val === undefined || val === null || val === "") return def;
      const num = Number(String(val).replace(/[^0-9]/g, ""));
      if (!isNaN(num) && num > 0) return `${Math.round(num / 1000)}k`;
      return String(val).replace(/\.000/g, "k").replace(/000$/g, "k").replace(/ đ/g, "");
    };

    const targetSeat = type === "std" ? "Standard" : (type === "vip" ? "VIP" : "Couple");
    const dbWd = getDbPricingValue(roomType, targetSeat, false);
    const dbWe = getDbPricingValue(roomType, targetSeat, true);

    if (dbWd && dbWe) {
      return `${formatShorthand(dbWd, "0")} / ${formatShorthand(dbWe, "0")}`;
    }

    const stdWd = localStorage.getItem(`room_price_std_wd_c${cId}_r${rName}`);
    const stdWe = localStorage.getItem(`room_price_std_we_c${cId}_r${rName}`);
    const vipWd = localStorage.getItem(`room_price_vip_wd_c${cId}_r${rName}`);
    const vipWe = localStorage.getItem(`room_price_vip_we_c${cId}_r${rName}`);
    const cpWd = localStorage.getItem(`room_price_cp_wd_c${cId}_r${rName}`);
    const cpWe = localStorage.getItem(`room_price_cp_we_c${cId}_r${rName}`);

    if (type === "std") {
      if (stdWd || stdWe) return `${formatShorthand(stdWd, "0")} / ${formatShorthand(stdWe, "0")}`;
      return isImax ? "150k / 180k" : "70k / 90k";
    }
    if (type === "vip") {
      if (vipWd || vipWe) return `${formatShorthand(vipWd, "0")} / ${formatShorthand(vipWe, "0")}`;
      return isImax ? "180k / 220k" : "90k / 120k";
    }
    if (type === "couple") {
      if (cpWd || cpWe) return `${formatShorthand(cpWd, "0")} / ${formatShorthand(cpWe, "0")}`;
      return isImax ? "200k / 250k" : "130k / 160k";
    }
    return "—";
  };

  const getSeatPrice = (seatType, roomType = "2D") => {
    const type = String(seatType).toLowerCase();
    const targetSeat = (type === "couple" || type === "sweetbox") ? "couple" : (type === "vip" ? "vip" : "standard");

    const dbWd = getDbPricingValue(roomType, targetSeat, false);
    const dbWe = getDbPricingValue(roomType, targetSeat, true);
    if (dbWd !== null && dbWe !== null) {
      return `${formatPriceVND(dbWd)} / ${formatPriceVND(dbWe)}`;
    }

    const cId = activeRoom?.cinemaId ?? activeRoom?.CinemaId ?? "";
    const rName = activeRoom?.roomName ?? activeRoom?.RoomName ?? "";
    const stdWd = localStorage.getItem(`room_price_std_wd_c${cId}_r${rName}`);
    const stdWe = localStorage.getItem(`room_price_std_we_c${cId}_r${rName}`);
    const vipWd = localStorage.getItem(`room_price_vip_wd_c${cId}_r${rName}`);
    const vipWe = localStorage.getItem(`room_price_vip_we_c${cId}_r${rName}`);
    const cpWd = localStorage.getItem(`room_price_cp_wd_c${cId}_r${rName}`);
    const cpWe = localStorage.getItem(`room_price_cp_we_c${cId}_r${rName}`);

    const isImax = String(roomType).toUpperCase().includes("IMAX");

    if (type === "vip") {
      if (vipWd || vipWe) return `${formatPriceVND(vipWd || 90000)} / ${formatPriceVND(vipWe || 120000)}`;
      return isImax ? "180.000 đ / 220.000 đ" : "90.000 đ / 120.000 đ";
    }
    if (type === "couple" || type === "sweetbox") {
      if (cpWd || cpWe) return `${formatPriceVND(cpWd || 130000)} / ${formatPriceVND(cpWe || 160000)}`;
      return isImax ? "200.000 đ / 250.000 đ" : "130.000 đ / 160.000 đ";
    }
    if (stdWd || stdWe) return `${formatPriceVND(stdWd || 70000)} / ${formatPriceVND(stdWe || 90000)}`;
    return isImax ? "150.000 đ / 180.000 đ" : "70.000 đ / 90.000 đ";
  };

  const getLateSeatPrice = (seatType, roomType = "2D") => {
    const type = String(seatType).toLowerCase();
    const targetSeat = (type === "couple" || type === "sweetbox") ? "couple" : (type === "vip" ? "vip" : "standard");

    const dbWe = getDbPricingValue(roomType, targetSeat, true);
    if (dbWe !== null) {
      return formatPriceVND(dbWe);
    }

    const cId = activeRoom?.cinemaId ?? activeRoom?.CinemaId ?? "";
    const rName = activeRoom?.roomName ?? activeRoom?.RoomName ?? "";
    const stdWe = localStorage.getItem(`room_price_std_we_c${cId}_r${rName}`);
    const vipWe = localStorage.getItem(`room_price_vip_we_c${cId}_r${rName}`);
    const cpWe = localStorage.getItem(`room_price_cp_we_c${cId}_r${rName}`);

    const isImax = String(roomType).toUpperCase().includes("IMAX");

    if (type === "vip") {
      if (vipWe) return formatPriceVND(vipWe);
      return isImax ? "220.000 đ" : "120.000 đ";
    }
    if (type === "couple" || type === "sweetbox") {
      if (cpWe) return formatPriceVND(cpWe);
      return isImax ? "250.000 đ" : "160.000 đ";
    }
    if (stdWe) return formatPriceVND(stdWe);
    return isImax ? "180.000 đ" : "90.000 đ";
  };

  const seatsWithFutureBookings = useMemo(() => {
    const ids = new Set();
    try {
      const tickets = JSON.parse(localStorage.getItem('rapchieuphim_tickets') || '[]');
      const now = new Date();
      tickets.forEach(t => {
        const d = new Date(t.showtimeDate || t.date || t.showDate || '');
        if (!isNaN(d) && d > now) {
          const sId = String(t.seatId || t.SeatId || '');
          if (sId) ids.add(sId);
          const code = String(t.seatCode || t.seatNumber || t.seat || '').toUpperCase();
          if (code) ids.add(code);
        }
      });
    } catch(e) {}
    return ids;
  }, [showLayoutEditor]);

  function isSeatBooked(seat) {
    return seatsWithFutureBookings.has(String(getSeatId(seat) || '')) ||
           seatsWithFutureBookings.has(getSeatCode(seat).toUpperCase());
  }

  function openLayoutEditor() {
    const targetRoomId = selectedRoomId || filterRoom;
    if (targetRoomId) {
      setFilterRoom(String(targetRoomId));
    }

    let savedOverrides = {};
    if (targetRoomId) {
      try {
        savedOverrides = JSON.parse(localStorage.getItem(`rapchieuphim_seat_overrides_${targetRoomId}`) || "{}");
      } catch (e) {}
    }

    const rowTypes = {};
    activeLayout.forEach(row => {
      const savedRowVal = savedOverrides.rows ? (
        savedOverrides.rows[row.rowName] ||
        savedOverrides.rows[row.rowName.toUpperCase()] ||
        savedOverrides.rows[row.rowName.toLowerCase()]
      ) : null;
      if (savedRowVal) {
        rowTypes[row.rowName] = savedRowVal;
      } else {
        const types = new Set(row.seats.map(s => String(getSeatType(s) || 'Standard').toLowerCase()));
        rowTypes[row.rowName] = types.size === 1 ? [...types][0] : 'mixed';
      }
    });

    setLayoutRowTypes(rowTypes);
    setSeatOverrides(savedOverrides.seats || {});
    setEditMode('row');
    setExpandedRow(null);
    setLayoutError('');
    setShowLayoutEditor(true);
  }

  function getEffectiveSeatType(seat) {
    const sId = String(getSeatId(seat) || '');
    return seatOverrides[sId]?.type ?? String(getSeatType(seat) || 'Standard').toLowerCase();
  }

  function getEffectiveSeatStatus(seat) {
    const sId = String(getSeatId(seat) || '');
    const sCode = getSeatCode(seat);
    const row = String(getSeatRow(seat)).toUpperCase();

    const overrideStatus = seatOverrides[sId]?.status ?? seatOverrides[sCode]?.status;
    if (overrideStatus !== undefined) return overrideStatus;

    const rowType = layoutRowTypes[row] || layoutRowTypes[row.toUpperCase()] || layoutRowTypes[row.toLowerCase()];
    if (rowType === 'inactive') return 'inactive';
    if (rowType === 'maintenance') return 'maintenance';

    const isActive = seat?.isActive ?? seat?.IsActive;
    return isActive === false ? 'maintenance' : 'active';
  }

  function getRowDisplayType(row) {
    const rowOverride = layoutRowTypes[row.rowName];
    const types = new Set();
    row.seats.forEach(s => {
      const sId = String(getSeatId(s) || '');
      const sCode = getSeatCode(s);
      const ov = seatOverrides[sId]?.type || seatOverrides[sCode]?.type;
      if (ov) {
        types.add(ov);
      } else if (rowOverride && rowOverride !== 'mixed' && rowOverride !== 'inactive' && rowOverride !== 'maintenance') {
        types.add(rowOverride);
      } else if (rowOverride === 'inactive' || rowOverride === 'maintenance') {
        types.add(rowOverride);
      } else {
        types.add(String(getSeatType(s) || 'Standard').toLowerCase());
      }
    });
    return types.size > 1 ? 'mixed' : ([...types][0] || 'standard');
  }

  function handleSeatTypeOverride(row, seat, newType) {
    if (newType === 'couple') {
      const seatNum = Number(getSeatNumber(seat)) || 0;
      const adj = row.seats.find(s => { const n = Number(getSeatNumber(s)); return n === seatNum-1 || n === seatNum+1; });
      if (!adj) { setLayoutError(`Ghế ${getSeatCode(seat)}: Couple phải chọn 2 ghế liền nhau.`); return; }
      const adjId = String(getSeatId(adj) || '');
      const sId = String(getSeatId(seat) || '');
      setSeatOverrides(prev => ({ ...prev, [sId]: { ...(prev[sId]||{}), type:'couple' }, [adjId]: { ...(prev[adjId]||{}), type:'couple' } }));
      setLayoutError('');
      return;
    }
    setLayoutError('');
    const sId = String(getSeatId(seat) || '');
    setSeatOverrides(prev => ({ ...prev, [sId]: { ...(prev[sId]||{}), type: newType } }));
  }

  function handleSeatStatusOverride(seat, newStatus) {
    if ((newStatus === 'maintenance' || newStatus === 'inactive') && isSeatBooked(seat)) {
      setLayoutError(`Ghế ${getSeatCode(seat)} có vé tương lai, không thể thay đổi trạng thái.`);
      return;
    }
    setLayoutError('');
    const sId = String(getSeatId(seat) || '');
    setSeatOverrides(prev => ({ ...prev, [sId]: { ...(prev[sId]||{}), status: newStatus } }));
  }

  async function handleSaveLayoutRowTypes() {
    setLayoutSaving(true);
    setLayoutError('');
    try {
      const roomId = selectedRoomId || filterRoom;
      const typeMap = { standard:'Standard', vip:'VIP', couple:'Couple', sweetbox:'Couple', maintenance:'Standard', inactive:'Standard' };
      const statusMap = { active:true, maintenance:false, inactive:false };
      const changeLog = [];
      const now = new Date().toISOString();

      const seatsToProcess = [];
      activeLayout.forEach(r => {
        if (r.seats) seatsToProcess.push(...r.seats);
      });
      if (seatsToProcess.length === 0 && selectedRoomSeats?.length > 0) {
        seatsToProcess.push(...selectedRoomSeats);
      }

      const savedMap = {
        rows: { ...layoutRowTypes },
        seats: { ...seatOverrides }
      };
      if (roomId) {
        localStorage.setItem(`rapchieuphim_seat_overrides_${roomId}`, JSON.stringify(savedMap));
      }

      const toUpdate = [];
      for (const seat of seatsToProcess) {
        const row = String(getSeatRow(seat)).toUpperCase();
        const sId = String(getSeatId(seat) || '');
        const sCode = getSeatCode(seat);

        const override = seatOverrides[sId] || seatOverrides[sCode];
        const rowType = layoutRowTypes[row] || layoutRowTypes[row.toUpperCase()] || layoutRowTypes[row.toLowerCase()];
        const oldType = String(getSeatType(seat) || 'Standard');
        const oldActive = seat?.isActive ?? seat?.IsActive ?? true;

        const newTypeLower = override?.type ?? (rowType && rowType !== 'mixed' && rowType !== 'inactive' && rowType !== 'maintenance' ? rowType : null);
        const newType = newTypeLower ? (typeMap[newTypeLower] || oldType) : oldType;

        let newActive = true;
        if (override?.status !== undefined) {
          if ((override.status === 'maintenance' || override.status === 'inactive') && isSeatBooked(seat))
            throw new Error(`Ghế ${sCode} có vé tương lai, không thể thay đổi trạng thái.`);
          newActive = statusMap[override.status] ?? true;
        } else if (rowType === 'inactive' || rowType === 'maintenance') {
          newActive = false;
        }

        seat.seatType = newType;
        seat.SeatType = newType;
        seat.isActive = newActive;
        seat.IsActive = newActive;

        if (newType !== oldType || newActive !== oldActive) {
          changeLog.push({ seatCode: sCode, oldType, newType, oldActive, newActive, changedAt: now });
          toUpdate.push({ seat, sId, newType, newActive });
        }
      }

      for (const { seat, sId, newType, newActive } of toUpdate) {
        if (!sId || String(sId).startsWith('mock-')) continue;
        const seatRow = getSeatRow(seat);
        const seatNumber = String(seat?.seatNumber ?? seat?.SeatNumber ?? seat?.col ?? '');
        const rId = seat?.roomId ?? seat?.RoomId ?? seat?.room?.roomId ?? roomId;

        try {
          await updateSeat(sId, {
            seatId: sId,
            roomId: Number(rId),
            seatRow: seatRow,
            seatNumber: seatNumber,
            seatType: newType,
            isActive: newActive,
          });
        } catch (apiErr) {
          console.warn(`Cập nhật ghế ${sId} qua API thất bại, đã lưu cục bộ:`, apiErr);
        }
      }

      if (changeLog.length > 0) {
        let hist = [];
        try { hist = JSON.parse(localStorage.getItem('rapchieuphim_seat_history') || '[]'); } catch(e) {}
        hist.unshift(...changeLog);
        localStorage.setItem('rapchieuphim_seat_history', JSON.stringify(hist.slice(0, 200)));
      }

      try { window.dispatchEvent(new Event('storage')); } catch(e) {}
      setShowLayoutEditor(false);
    } catch(err) {
      setLayoutError(err.message || 'Có lỗi xảy ra khi lưu.');
    } finally {
      setLayoutSaving(false);
    }
  }

  const totalCount = filteredRooms.length;
  const activeCount = filteredRooms.filter(r => getStatusInfo(r).dotClass === "active").length;
  const cleaningCount = filteredRooms.filter(r => getStatusInfo(r).dotClass === "cleaning").length;
  const maintenanceCount = filteredRooms.filter(r => getStatusInfo(r).dotClass === "maintenance").length;

  return {
    // Room hook properties explicitly aliased
    rooms: roomHook.rooms,
    cinemas: roomHook.cinemas,
    loadingRooms: roomHook.loading,
    errorRooms: roomHook.error,
    showRoomModal: roomHook.showModal,
    isEditingRoom: roomHook.isEditing,
    roomForm: roomHook.form,
    roomFormError: roomHook.formError,
    submittingRoom: roomHook.submitting,
    roomTypeOptions: roomHook.roomTypeOptions,
    roomStatusOptions: roomHook.roomStatusOptions,
    cinemaOptions: roomHook.cinemaOptions,
    handleRoomChange: roomHook.handleChange,
    handleRoomSubmit: roomHook.handleSubmit,
    openAddRoomModal: () => roomHook.openAddModal(selectedCinemaFilter),
    openEditRoom: roomHook.openEditRoom,
    closeRoomModal: roomHook.closeModal,
    handleDeleteRoom: roomHook.handleDeleteRoom,

    // Seat hook properties explicitly aliased
    filterRoom: seatHook.filterRoom,
    setFilterRoom: seatHook.setFilterRoom,
    selectedRoomSeats: seatHook.selectedRoomSeats,
    seatMapLayout: seatHook.seatMapLayout,
    mockSeatLayout: seatHook.mockSeatLayout,
    dynamicStats: seatHook.dynamicStats,
    showSeatModal: seatHook.showModal,
    editSeatId: seatHook.editId,
    seatForm: seatHook.form,
    submittingSeat: seatHook.submitting,
    seatFormError: seatHook.formError,
    openAddSeatModal: seatHook.openAddModal,
    openEditSeatModal: seatHook.openEditModal,
    closeSeatModal: seatHook.closeModal,
    handleSeatChange: seatHook.handleChange,
    handleSeatSubmit: seatHook.handleSubmit,
    handleDeleteSeat: seatHook.handleDelete,

    // Admin UI states & handlers
    selectedRoomId,
    setSelectedRoomId,
    selectedCinemaFilter,
    setSelectedCinemaFilter,
    searchQuery,
    setSearchQuery,
    activeMenuId,
    setActiveMenuId,
    selectedSeat,
    setSelectedSeat,

    showLayoutEditor,
    setShowLayoutEditor,
    layoutRowTypes,
    setLayoutRowTypes,
    seatOverrides,
    setSeatOverrides,
    editMode,
    setEditMode,
    expandedRow,
    setExpandedRow,
    layoutSaving,
    setLayoutSaving,
    layoutError,
    setLayoutError,

    priceStdWeekday,
    setPriceStdWeekday,
    priceStdWeekend,
    setPriceStdWeekend,
    priceVipWeekday,
    setPriceVipWeekday,
    priceVipWeekend,
    setPriceVipWeekend,
    priceCoupleWeekday,
    setPriceCoupleWeekday,
    priceCoupleWeekend,
    setPriceCoupleWeekend,
    syncAllRooms,
    setSyncAllRooms,

    filteredRooms,
    handleCustomRoomSubmit,
    menuRef,
    handleSelectRoom,
    activeLayout,
    activeRoom,
    activeRoomType,
    getRoomPriceText,
    getSeatPrice,
    getLateSeatPrice,
    totalCount,
    activeCount,
    cleaningCount,
    maintenanceCount,

    isSeatBooked,
    openLayoutEditor,
    getEffectiveSeatType,
    getEffectiveSeatStatus,
    getRowDisplayType,
    handleSeatTypeOverride,
    handleSeatStatusOverride,
    handleSaveLayoutRowTypes,
  };
}