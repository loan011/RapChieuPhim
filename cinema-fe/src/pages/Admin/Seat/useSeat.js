import { useEffect, useMemo, useState } from "react";
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
  { value: "false", label: "Bảo trì" },
];

export const SEAT_ROW_OPTIONS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
].map((row) => ({
  value: row,
  label: row,
}));

export const SEAT_NUMBER_OPTIONS = Array.from({ length: 20 }, (_, index) => {
  const value = String(index + 1);

  return {
    value,
    label: value,
  };
});

export const EMPTY_SEAT_FORM = {
  roomId: "",
  seatRow: "",
  seatNumber: "",
  seatType: "Standard",
  isActive: true,
};

/* ═══════════════════════════════════════════════════════════
   NORMALIZE FUNCTIONS
═══════════════════════════════════════════════════════════ */

export function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  return [];
}

export function normalizeSeatRow(value) {
  return String(value ?? "").trim().toUpperCase();
}

export function normalizeSeatNumber(value) {
  const text = String(value ?? "").trim();

  if (!text) return "";

  // Dữ liệu cũ có thể đang lưu kiểu E4, A10.
  // Khi mở form cập nhật thì dropdown số ghế chỉ cần lấy 4, 10.
  return text.replace(/^[A-Za-z]+/, "");
}

export function extractRowFromSeatNumber(value) {
  const text = String(value ?? "").trim();
  const match = text.match(/^([A-Za-z]+)/);

  return match ? match[1].toUpperCase() : "";
}

/* ═══════════════════════════════════════════════════════════
   GETTER FUNCTIONS
═══════════════════════════════════════════════════════════ */

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

  const room = rooms.find((item) => String(getRoomId(item)) === String(roomId));

  if (!room) return `Phòng ID ${roomId}`;

  return getRoomFullName(room, cinemas);
}

export function getSeatRow(seat) {
  const rawRow = seat?.seatRow ?? seat?.SeatRow ?? seat?.row ?? "";

  if (rawRow) {
    return normalizeSeatRow(rawRow);
  }

  const rawNumber = seat?.seatNumber ?? seat?.SeatNumber ?? seat?.col ?? "";

  return extractRowFromSeatNumber(rawNumber);
}

export function getSeatNumber(seat) {
  const rawNumber = seat?.seatNumber ?? seat?.SeatNumber ?? seat?.col ?? "";

  return normalizeSeatNumber(rawNumber);
}

export function getSeatType(seat) {
  return seat?.seatType ?? seat?.SeatType ?? seat?.type ?? "Standard";
}

export function getSeatCode(seat) {
  const row = normalizeSeatRow(getSeatRow(seat));
  const number = normalizeSeatNumber(getSeatNumber(seat));

  if (!row && !number) return "Chưa có";

  return `${row}${number}`.toUpperCase();
}

export function getSeatStatus(seat) {
  const isActive = seat?.isActive ?? seat?.IsActive;

  if (isActive === true) return "Hoạt động";
  if (isActive === false) return "Bảo trì";

  return seat?.status ?? seat?.Status ?? "Chưa có";
}

export function getSeatSortNumber(seat) {
  const code = getSeatCode(seat);
  const match = code.match(/\d+/);

  return match ? Number(match[0]) : 0;
}

/* ═══════════════════════════════════════════════════════════
   FORM FUNCTIONS
═══════════════════════════════════════════════════════════ */

export function buildFormFromSeat(seat) {
  const rawRow = getSeatRow(seat);
  const rawNumber = seat?.seatNumber ?? seat?.SeatNumber ?? seat?.col ?? "";

  const rowFromNumber = extractRowFromSeatNumber(rawNumber);

  return {
    roomId: getSeatRoomId(seat) ?? "",
    seatRow: normalizeSeatRow(rawRow || rowFromNumber),
    seatNumber: normalizeSeatNumber(rawNumber),
    seatType: getSeatType(seat),
    isActive: seat?.isActive ?? seat?.IsActive ?? true,
  };
}

export function validateSeatForm(form) {
  if (!form.roomId) {
    return "Vui lòng chọn phòng chiếu.";
  }

  if (!normalizeSeatRow(form.seatRow)) {
    return "Vui lòng chọn hàng ghế.";
  }

  if (!normalizeSeatNumber(form.seatNumber)) {
    return "Vui lòng chọn số thứ tự ghế.";
  }

  return "";
}

export function buildSeatPayload(form, editId = null) {
  const payload = {
    roomId: Number(form.roomId),
    seatRow: normalizeSeatRow(form.seatRow),
    seatNumber: normalizeSeatNumber(form.seatNumber),
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
   USE SEAT HOOK
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

  const queryRoomId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("roomId");
  }, []);

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

      const normalizedSeats = normalizeArray(seatData);
      const normalizedRooms = normalizeArray(roomData);
      const normalizedCinemas = normalizeArray(cinemaData);

      setList(normalizedSeats);
      setRooms(normalizedRooms);
      setCinemas(normalizedCinemas);

      if (queryRoomId && normalizedRooms.length > 0) {
        const targetRoom = normalizedRooms.find(r => String(getRoomId(r)) === String(queryRoomId));
        if (targetRoom) {
          const targetCinemaId = String(getRoomCinemaId(targetRoom) ?? "");
          setFilterCinemaId(targetCinemaId);
          setFilterRoom(String(queryRoomId));
        } else if (normalizedCinemas.length > 0 && !filterCinemaId) {
          const firstCinemaId = String(getCinemaId(normalizedCinemas[0]) ?? "");
          setFilterCinemaId(firstCinemaId);
          const cinemaRooms = normalizedRooms.filter(
            (room) => String(getRoomCinemaId(room)) === firstCinemaId
          );
          if (cinemaRooms.length > 0 && !filterRoom) {
            setFilterRoom(String(getRoomId(cinemaRooms[0])));
          }
        }
      } else if (normalizedCinemas.length > 0 && !filterCinemaId) {
        const firstCinemaId = String(getCinemaId(normalizedCinemas[0]) ?? "");

        setFilterCinemaId(firstCinemaId);

        const cinemaRooms = normalizedRooms.filter(
          (room) => String(getRoomCinemaId(room)) === firstCinemaId
        );

        if (cinemaRooms.length > 0 && !filterRoom) {
          setFilterRoom(String(getRoomId(cinemaRooms[0])));
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
    const keyword = search.toLowerCase().trim();

    return list
      .filter((seat) => {
        const code = getSeatCode(seat).toLowerCase();
        const seatRoomId = getSeatRoomId(seat);
        const seatType = getSeatType(seat);

        const room = rooms.find(
          (item) => String(getRoomId(item)) === String(seatRoomId)
        );

        const cinemaId = room ? String(getRoomCinemaId(room)) : "";

        const matchSearch = !keyword || code.includes(keyword);

        const matchRoom = filterRoom
          ? String(seatRoomId) === String(filterRoom)
          : true;

        const matchCinema = filterCinemaId
          ? cinemaId === String(filterCinemaId)
          : true;

        const matchType = filterType ? seatType === filterType : true;

        return matchSearch && matchRoom && matchCinema && matchType;
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
  }, [list, search, filterRoom, filterCinemaId, filterType, rooms]);

  /* ── Pagination ── */
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  }, [filtered]);

  const safePage = useMemo(() => {
    return Math.min(page, totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    const end = safePage * PAGE_SIZE;

    return filtered.slice(start, end);
  }, [filtered, safePage]);

  /* ── Selected Room Seats ── */
  const selectedRoomSeats = useMemo(() => {
    const roomId = filterRoom || (rooms[0] ? getRoomId(rooms[0]) : "");

    if (!roomId) return [];

    return list.filter((seat) => String(getSeatRoomId(seat)) === String(roomId));
  }, [list, filterRoom, rooms]);

  const selectedRoomName = useMemo(() => {
    const roomId = filterRoom || (rooms[0] ? getRoomId(rooms[0]) : "");

    const room = rooms.find((item) => String(getRoomId(item)) === String(roomId));

    return room ? getRoomFullName(room, cinemas) : "Standard";
  }, [rooms, filterRoom, cinemas]);

  /* ── Dynamic Seat Map Layout Builder ── */
  const seatMapLayout = useMemo(() => {
    if (selectedRoomSeats.length === 0) return [];

    const rows = {};

    selectedRoomSeats.forEach((seat) => {
      const row = getSeatRow(seat) || "A";

      if (!rows[row]) {
        rows[row] = [];
      }

      rows[row].push(seat);
    });

    const sortedRowNames = Object.keys(rows).sort();

    return sortedRowNames.map((rowName) => {
      const sortedSeats = rows[rowName].sort((a, b) => {
        return getSeatSortNumber(a) - getSeatSortNumber(b);
      });

      return {
        rowName,
        seats: sortedSeats,
      };
    });
  }, [selectedRoomSeats]);

  /* ── Mock Seat Map Layout ── */
  const mockSeatLayout = useMemo(() => {
    const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

    return rows.map((row) => {
      const isCoupleRow = row === "I";
      const isVipRow = ["C", "D", "E", "F", "G"].includes(row);
      const seatCount = isCoupleRow ? 6 : 12;
      const seats = [];

      for (let index = 1; index <= seatCount; index += 1) {
        let seatType = "Standard";
        let code = `${row}${String(index).padStart(2, "0")}`;

        if (isCoupleRow) {
          seatType = "Couple";

          const startNum = (index - 1) * 2 + 1;
          const endNum = startNum + 1;

          code = `${String(startNum).padStart(2, "0")}-${String(
            endNum
          ).padStart(2, "0")}`;
        } else if (isVipRow && index >= 5 && index <= 8) {
          seatType = "VIP";
        }

        seats.push({
          seatId: `mock-${row}-${index}`,
          seatRow: row,
          seatNumber: String(index),
          seatType,
          code,
          isActive: true,
        });
      }

      return {
        rowName: row,
        seats,
      };
    });
  }, []);

  /* ── Stats ── */
  const dynamicStats = useMemo(() => {
    const activeList = selectedRoomSeats.length > 0 ? selectedRoomSeats : list;

    if (activeList.length === 0) {
      return {
        total: 120,
        standard: 84,
        vip: 24,
        couple: 12,
      };
    }

    const total = activeList.length;

    const standard = activeList.filter((seat) => {
      return String(getSeatType(seat)).toLowerCase() === "standard";
    }).length;

    const vip = activeList.filter((seat) => {
      return String(getSeatType(seat)).toLowerCase() === "vip";
    }).length;

    const couple = activeList.filter((seat) => {
      return String(getSeatType(seat)).toLowerCase() === "couple";
    }).length;

    return {
      total,
      standard,
      vip,
      couple,
    };
  }, [selectedRoomSeats, list]);

  /* ── Modal Handlers ── */
  function openAddModal(initialValues = null) {
    setEditId(null);
    setForm(initialValues ? { ...EMPTY_SEAT_FORM, ...initialValues } : EMPTY_SEAT_FORM);
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

    setForm((prev) => {
      if (name === "isActive") {
        return {
          ...prev,
          isActive: value === "true",
        };
      }

      if (name === "seatRow") {
        return {
          ...prev,
          seatRow: normalizeSeatRow(value),
        };
      }

      if (name === "seatNumber") {
        return {
          ...prev,
          seatNumber: normalizeSeatNumber(value),
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
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

    search,
    setSearch,
    filterCinemaId,
    setFilterCinemaId,
    filterRoom,
    setFilterRoom,
    filterType,
    setFilterType,
    filtered,

    page,
    setPage,
    pageItems,
    totalPages,
    safePage,

    dynamicStats,

    selectedRoomName,
    selectedRoomSeats,
    seatMapLayout,
    mockSeatLayout,

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