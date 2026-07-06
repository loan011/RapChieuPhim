import { useEffect, useState, useMemo } from "react";
import { getTicketList, deleteTicket, createTicket, updateTicket } from "./ticketService";
import { getCinemaList } from "../Cinema/cinemaService";

export const PAGE_SIZE = 5;

export const STATUS_OPTIONS = ["Giữ chỗ", "Đã thanh toán", "Đã hủy"];

export const EMPTY_FORM = {
  code: "",
  customerName: "",
  movieTitle: "",
  seatCode: "",
  price: 0,
  status: "Giữ chỗ",
  cinemaId: "",
};

/* ═══════════════════════════════════════════════════════════
   PURE HELPER FUNCTIONS
═══════════════════════════════════════════════════════════ */

export function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export function getTicketId(t) {
  return t?.id ?? t?.ticketId ?? t?.Id ?? t?.TicketId;
}

export function getTicketCode(t) {
  return t?.code ?? t?.ticketCode ?? t?.Code ?? t?.TicketCode ?? "";
}

export function getTicketCustomerName(t) {
  return t?.customerName ?? t?.CustomerName ?? "Chưa rõ";
}

export function getTicketMovieTitle(t) {
  return t?.movieTitle ?? t?.MovieTitle ?? "Chưa rõ";
}

export function getTicketSeatCode(t) {
  return t?.seatCode ?? t?.SeatCode ?? "—";
}

export function getTicketPrice(t) {
  return t?.price ?? t?.amount ?? t?.Price ?? t?.Amount ?? 0;
}

export function getTicketCinema(t) {
  return t?.cinemaName ?? t?.CinemaName ?? t?.cinema ?? t?.Cinema ?? "T&M Cinema";
}

export function getTicketArea(t) {
  return t?.areaName ?? t?.AreaName ?? t?.area ?? t?.Area ?? "Quận 1";
}

export function getTicketRoom(t) {
  return t?.roomName ?? t?.RoomName ?? t?.room ?? t?.Room ?? "—";
}

export function getTicketStatusDisplayName(status) {
  if (status === "Used" || status === "Đã thanh toán") return "Đã thanh toán";
  if (status === "Active" || status === "Đã đặt" || status === "Giữ chỗ") return "Giữ chỗ";
  if (status === "Cancelled" || status === "Đã hủy") return "Đã hủy";
  return status || "Giữ chỗ";
}

export function formatMoney(value) {
  const n = Number(value);
  return Number.isNaN(n) ? "0đ" : `${n.toLocaleString("vi-VN")}đ`;
}

export function getTicketShowtime(t) {
  const rawStartTime = t?.startTime ?? t?.StartTime ?? t?.showTime ?? t?.ShowTime ?? t?.showtime ?? t?.Showtime ?? "";
  const rawShowDate = t?.showDate ?? t?.ShowDate ?? "";
  
  if (rawStartTime && rawShowDate) {
    if (String(rawStartTime).includes("T")) {
      const parts = String(rawStartTime).split("T");
      const datePart = parts[0];
      const timePart = parts[1]?.slice(0, 5) || "";
      const dateObj = new Date(datePart);
      if (!isNaN(dateObj.getTime())) {
        const dd = String(dateObj.getDate()).padStart(2, "0");
        const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
        const yyyy = dateObj.getFullYear();
        return `${timePart} | ${dd}/${mm}/${yyyy}`;
      }
    }
    const dateObj = new Date(rawShowDate);
    if (!isNaN(dateObj.getTime())) {
      const dd = String(dateObj.getDate()).padStart(2, "0");
      const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
      const yyyy = dateObj.getFullYear();
      const timePart = String(rawStartTime).slice(0, 5);
      return `${timePart} | ${dd}/${mm}/${yyyy}`;
    }
  }

  if (rawStartTime && String(rawStartTime).includes("T")) {
    const parts = String(rawStartTime).split("T");
    const datePart = parts[0];
    const timePart = parts[1]?.slice(0, 5) || "";
    const dateObj = new Date(datePart);
    if (!isNaN(dateObj.getTime())) {
      const dd = String(dateObj.getDate()).padStart(2, "0");
      const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
      const yyyy = dateObj.getFullYear();
      return `${timePart} | ${dd}/${mm}/${yyyy}`;
    }
  }
  
  return rawStartTime || "19:30 | 05/07/2026"; // mockup fallback
}

/* ═══════════════════════════════════════════════════════════
   useTicket HOOK
═══════════════════════════════════════════════════════════ */

export function useTicket() {
  const [list, setList] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCinemaId, setFilterCinemaId] = useState("");
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const [ticketData, cinemaData] = await Promise.all([
        getTicketList(),
        getCinemaList(),
      ]);
      setList(normalizeArray(ticketData));
      const normalizedCinemas = normalizeArray(cinemaData);
      setCinemas(normalizedCinemas);
      if (normalizedCinemas.length > 0 && !filterCinemaId) {
        const firstCinemaId = String(normalizedCinemas[0]?.cinemaId ?? normalizedCinemas[0]?.CinemaId ?? normalizedCinemas[0]?.id ?? normalizedCinemas[0]?.Id ?? "");
        setFilterCinemaId(firstCinemaId);
      }
    } catch (err) {
      setList([]);
      setCinemas([]);
      setError(err?.message || "Không thể tải danh sách vé.");
    } finally {
      setLoading(false);
    }
  }

  const cinemaOptions = useMemo(() => {
    return cinemas.map((c) => ({
      id: String(c?.cinemaId ?? c?.CinemaId ?? c?.id ?? c?.Id ?? ""),
      name: c?.cinemaName ?? c?.CinemaName ?? c?.name ?? c?.Name ?? "Chi nhánh",
    })).filter((c) => c.id);
  }, [cinemas]);

  /* ── Stats Calculations ── */
  const totalCount = list.length;
  
  const soldCount = useMemo(() => {
    return list.filter((t) => {
      const displayStatus = getTicketStatusDisplayName(t.status);
      return displayStatus === "Đã thanh toán";
    }).length;
  }, [list]);

  const totalRevenue = useMemo(() => {
    return list
      .filter((t) => {
        const displayStatus = getTicketStatusDisplayName(t.status);
        return displayStatus === "Đã thanh toán";
      })
      .reduce((sum, t) => sum + (Number(t.price ?? t.amount) || 0), 0);
  }, [list]);

  /* ── Filter ── */
  const filtered = useMemo(() => {
    const kw = search.toLowerCase().trim();
    const selectedCinemaName = filterCinemaId
      ? cinemas.find(c => String(c?.cinemaId ?? c?.CinemaId ?? c?.id ?? c?.Id) === filterCinemaId)?.cinemaName || ""
      : "";

    return list.filter((t) => {
      const code = getTicketCode(t).toLowerCase();
      const customer = getTicketCustomerName(t).toLowerCase();
      const movie = getTicketMovieTitle(t).toLowerCase();
      const displayStatus = getTicketStatusDisplayName(t.status);
      
      const tCinemaId = String(t.cinemaId ?? t.CinemaId ?? t.cinema?.cinemaId ?? t.cinema?.CinemaId ?? "");
      const tCinemaName = String(t.cinemaName ?? t.CinemaName ?? t.cinema ?? t.Cinema ?? "");

      const matchSearch =
        !kw ||
        code.includes(kw) ||
        customer.includes(kw) ||
        movie.includes(kw);

      const matchStatus = filterStatus
        ? displayStatus.toLowerCase() === filterStatus.toLowerCase()
        : true;

      const matchCinema = filterCinemaId
        ? (tCinemaId === filterCinemaId || 
           (selectedCinemaName && tCinemaName.toLowerCase().includes(selectedCinemaName.toLowerCase())))
        : true;

      return matchSearch && matchStatus && matchCinema;
    });
  }, [list, search, filterStatus, filterCinemaId, cinemas]);

  /* ── Pagination ── */
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)), [filtered]);
  const safePage = useMemo(() => Math.min(page, totalPages), [page, totalPages]);
  const pageItems = useMemo(() => {
    return filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  }, [filtered, safePage]);

  /* ── Handlers ── */
  async function handleDelete(id) {
    if (!id) {
      alert("Không tìm thấy ID vé");
      return;
    }
    if (!window.confirm("Bạn có chắc muốn xóa vé này?")) return;
    try {
      await deleteTicket(id);
      fetchData();
    } catch (err) {
      alert(err?.message || "Xóa vé thất bại.");
    }
  }

  function openAddModal() {
    setEditId(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(ticket) {
    setEditId(getTicketId(ticket));
    setFormData({
      code: getTicketCode(ticket),
      customerName: getTicketCustomerName(ticket),
      movieTitle: getMovieTitle(ticket),
      seatCode: getTicketSeatCode(ticket),
      price: getTicketPrice(ticket),
      status: getTicketStatusDisplayName(ticket.status),
      cinemaId: String(ticket?.cinemaId ?? ticket?.CinemaId ?? ticket?.cinema?.cinemaId ?? ticket?.cinema?.CinemaId ?? ""),
    });
    setFormError("");
    setShowModal(true);
  }

  function getMovieTitle(ticket) {
    return ticket.movieTitle ?? ticket.MovieTitle ?? "Chưa rõ";
  }

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setFormData(EMPTY_FORM);
    setFormError("");
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmitForm(e) {
    e.preventDefault();
    setFormError("");

    if (!formData.code.trim()) {
      setFormError("Vui lòng nhập mã vé.");
      return;
    }
    if (!formData.customerName.trim()) {
      setFormError("Vui lòng nhập tên khách hàng.");
      return;
    }
    if (!formData.movieTitle.trim()) {
      setFormError("Vui lòng nhập tên phim.");
      return;
    }
    if (!formData.seatCode.trim()) {
      setFormError("Vui lòng nhập mã ghế.");
      return;
    }

    const payload = {
      id: editId ?? 0,
      ticketId: editId ?? 0,
      code: formData.code.trim(),
      ticketCode: formData.code.trim(),
      customerName: formData.customerName.trim(),
      movieTitle: formData.movieTitle.trim(),
      seatCode: formData.seatCode.trim(),
      price: Number(formData.price) || 0,
      amount: Number(formData.price) || 0,
      status: formData.status,
      cinemaId: formData.cinemaId ? Number(formData.cinemaId) : null,
      cinemaName: cinemas.find(c => String(c?.cinemaId ?? c?.CinemaId ?? c?.id ?? c?.Id) === String(formData.cinemaId))?.cinemaName || "",
    };

    try {
      setFormLoading(true);
      if (editId !== null) {
        await updateTicket(editId, payload);
      } else {
        await createTicket(payload);
      }
      closeModal();
      fetchData();
    } catch (err) {
      setFormError(err?.message || "Lưu thông tin vé thất bại.");
    } finally {
      setFormLoading(false);
    }
  }

  return {
    list,
    loading,
    error,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterCinemaId,
    setFilterCinemaId,
    cinemaOptions,
    filtered,
    pageItems,
    totalPages,
    safePage,
    setPage,

    /* Stats */
    totalCount,
    soldCount,
    totalRevenue,

    /* Modal add/edit */
    showModal,
    editId,
    formData,
    formLoading,
    formError,
    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmitForm,
    handleDelete,
  };
}
