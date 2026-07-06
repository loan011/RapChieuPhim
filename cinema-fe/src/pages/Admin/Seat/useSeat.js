import { useEffect, useState, useMemo } from "react";
import {
  getSeatList,
  createSeat,
  updateSeat,
  deleteSeat,
} from "./seatService";
import { getRoomList } from "../Room/roomService";
import { getCinemaList } from "../Cinema/cinemaService";

export const PAGE_SIZE = 10;

export const SEAT_TYPE_OPTIONS = [
  { value: "Standard", label: "Standard" },
  { value: "VIP", label: "VIP" },
  { value: "Couple", label: "Couple" },
];

export const SEAT_STATUS_OPTIONS = [
  { value: "true", label: "Hoạt động" },
  { value: "false", label: "Ngừng hoạt động" },
];

export const EMPTY_SEAT_FORM = {
  roomId: "",
  seatRow: "",
  seatNumber: "",
  seatType: "Standard",
  isActive: true,
};

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

export function getSeatId(seat) {
  return seat?.seatId ?? seat?.SeatId ?? seat?.id ?? seat?.Id;
}

export function getSeatRoomId(seat) {
  return seat?.roomId ?? seat?.RoomId ?? seat?.room?.roomId ?? seat?.room?.RoomId ?? seat?.Room?.roomId ?? seat?.Room?.RoomId;
}

export function getRoomId(room) {
  return room?.roomId ?? room?.RoomId ?? room?.id ?? room?.Id;
}

export function getRoomName(room) {
  return room?.roomName ?? room?.RoomName ?? room?.name ?? room?.Name ?? "Chưa có phòng";
}

export function getRoomCinemaId(room) {
  return room?.cinemaId ?? room?.CinemaId ?? room?.cinema?.cinemaId ?? room?.cinema?.CinemaId ?? room?.Cinema?.cinemaId ?? room?.Cinema?.CinemaId;
}

export function getCinemaId(cinema) {
  return cinema?.cinemaId ?? cinema?.CinemaId ?? cinema?.id ?? cinema?.Id;
}

export function getCinemaName(cinema) {
  return cinema?.cinemaName ?? cinema?.CinemaName ?? cinema?.name ?? cinema?.Name ?? "Chưa có tên rạp";
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

/* ═══════════════════════════════════════════════════════════
   useSeat HOOK
═══════════════════════════════════════════════════════════ */

export function useSeat() {
  const [list, setList] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [cinemas, setCinemas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterCinemaId, setFilterCinemaId] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [filterType, setFilterType] = useState("");
  const [page, setPage] = useState(1);

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

      setList(normalizeArray(seatData));
      const normalizedRooms = normalizeArray(roomData);
      const normalizedCinemas = normalizeArray(cinemaData);
      setRooms(normalizedRooms);
      setCinemas(normalizedCinemas);

      if (normalizedCinemas.length > 0 && !filterCinemaId) {
        const firstCId = String(normalizedCinemas[0]?.cinemaId ?? normalizedCinemas[0]?.CinemaId ?? normalizedCinemas[0]?.id ?? normalizedCinemas[0]?.Id ?? "");
        setFilterCinemaId(firstCId);

        const cinemaRooms = normalizedRooms.filter(r => String(getRoomCinemaId(r)) === firstCId);
        if (cinemaRooms.length > 0 && !filterRoom) {
          const firstRId = String(getRoomId(cinemaRooms[0]));
          setFilterRoom(firstRId);
        }
      }
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

  /* ── Filter ── */
  const filtered = useMemo(() => {
    const kw = search.toLowerCase().trim();
    return list.filter((seat) => {
      const code = getSeatCode(seat).toLowerCase();
      const seatRoomId = getSeatRoomId(seat);
      const seatType = getSeatType(seat);
      
      const room = rooms.find(r => String(getRoomId(r)) === String(seatRoomId));
      const cinemaId = room ? String(getRoomCinemaId(room)) : "";

      const matchSearch = !kw || code.includes(kw);
      const matchRoom = filterRoom ? String(seatRoomId) === String(filterRoom) : true;
      const matchCinema = filterCinemaId ? cinemaId === String(filterCinemaId) : true;
      const matchType = filterType ? seatType === filterType : true;

      return matchSearch && matchRoom && matchCinema && matchType;
    }).sort((a, b) => {
      const roomA = Number(getSeatRoomId(a) ?? 0);
      const roomB = Number(getSeatRoomId(b) ?? 0);
      if (roomA !== roomB) return roomA - roomB;

      const rowA = getSeatRow(a);
      const rowB = getSeatRow(b);
      if (rowA !== rowB) return rowA.localeCompare(rowB);

      return getSeatSortNumber(a) - getSeatSortNumber(b);
    });
  }, [list, search, filterRoom, filterCinemaId, filterType, rooms]);

  /* ── Pagination ── */
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)), [filtered]);
  const safePage = useMemo(() => Math.min(page, totalPages), [page, totalPages]);
  const pageItems = useMemo(() => {
    return filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  }, [filtered, safePage]);

  /* ── Dynamic Seat Map Layout Builder ── */
  const selectedRoomSeats = useMemo(() => {
    const roomId = filterRoom || (rooms[0] ? getRoomId(rooms[0]) : "");
    if (!roomId) return [];
    return list.filter(s => String(getSeatRoomId(s)) === String(roomId));
  }, [list, filterRoom, rooms]);

  const selectedRoomName = useMemo(() => {
    const roomId = filterRoom || (rooms[0] ? getRoomId(rooms[0]) : "");
    const room = rooms.find(r => String(getRoomId(r)) === String(roomId));
    return room ? getRoomFullName(room, cinemas) : "Standard";
  }, [rooms, filterRoom, cinemas]);

  const seatMapLayout = useMemo(() => {
    if (selectedRoomSeats.length === 0) return [];
    
    const rows = {};
    selectedRoomSeats.forEach(seat => {
      const row = getSeatRow(seat).toUpperCase() || "A";
      if (!rows[row]) rows[row] = [];
      rows[row].push(seat);
    });

    const sortedRowNames = Object.keys(rows).sort();
    return sortedRowNames.map(rowName => {
      const sortedSeats = rows[rowName].sort((a, b) => {
        return getSeatSortNumber(a) - getSeatSortNumber(b);
      });
      return {
        rowName,
        seats: sortedSeats
      };
    });
  }, [selectedRoomSeats]);

  const mockSeatLayout = useMemo(() => {
    const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    return rows.map(r => {
      const isCoupleRow = r === "I";
      const isVIPRow = ["C", "D", "E", "F", "G"].includes(r);
      const seatCount = isCoupleRow ? 6 : 12;
      const seats = [];
      for (let i = 1; i <= seatCount; i++) {
        let seatType = "Standard";
        let code = `${r}${String(i).padStart(2, "0")}`;
        if (isCoupleRow) {
          seatType = "Couple";
          const startNum = (i - 1) * 2 + 1;
          const endNum = startNum + 1;
          code = `${String(startNum).padStart(2, "0")}-${String(endNum).padStart(2, "0")}`;
        } else if (isVIPRow && i >= 5 && i <= 8) {
          seatType = "VIP";
        }
        seats.push({
          seatId: `mock-${r}-${i}`,
          seatRow: r,
          seatNumber: String(i),
          seatType,
          code,
          isActive: true
        });
      }
      return {
        rowName: r,
        seats
      };
    });
  }, []);

  const dynamicStats = useMemo(() => {
    const activeList = selectedRoomSeats.length > 0 ? selectedRoomSeats : list;
    if (activeList.length === 0) {
      return { total: 120, standard: 84, vip: 24, couple: 12 };
    }
    const total = activeList.length;
    const standard = activeList.filter(s => getSeatType(s) === "Standard" || getSeatType(s) === "standard").length;
    const vip = activeList.filter(s => getSeatType(s) === "VIP" || getSeatType(s) === "vip").length;
    const couple = activeList.filter(s => getSeatType(s) === "Couple" || getSeatType(s) === "couple").length;
    return { total, standard, vip, couple };
  }, [selectedRoomSeats, list]);

  /* ── Handlers ── */
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

  return {
    list,
    rooms,
    cinemas,
    loading,
    error,

    /* Filters */
    search,
    setSearch,
    filterCinemaId,
    setFilterCinemaId,
    filterRoom,
    setFilterRoom,
    filterType,
    setFilterType,
    filtered,

    /* Pagination */
    page,
    setPage,
    pageItems,
    totalPages,
    safePage,

    /* Stats */
    dynamicStats,

    /* Seat map layout elements */
    selectedRoomName,
    selectedRoomSeats,
    seatMapLayout,
    mockSeatLayout,

    /* Form actions */
    showModal,
    editId,
    form,
    submitting,
    formError,
    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmit,
    handleDelete,
  };
}