import { useEffect, useState } from "react";
import { getTicketList, deleteTicket, createTicket, updateTicket } from "./ticketService";

export const STATUS_OPTIONS = ["Đã đặt", "Đã thanh toán", "Đã hủy"];

// Helpers đọc nested data từ API thật
export function getTicketCode(t) {
  return t?.ticketCode || t?.code || `VE${t?.ticketId || t?.id || ""}`;
}
export function getTicketCustomer(t) {
  return t?.customerName || t?.booking?.user?.fullName || t?.booking?.User?.FullName || "—";
}
export function getTicketMovie(t) {
  return t?.movieTitle || t?.booking?.showTime?.movie?.title || t?.booking?.ShowTime?.Movie?.Title || "—";
}
export function getTicketCinema(t) {
  return t?.cinemaName || t?.cinema ||
    t?.booking?.showTime?.room?.cinema?.cinemaName ||
    t?.booking?.ShowTime?.Room?.Cinema?.CinemaName || "—";
}
export function getTicketRoom(t) {
  return t?.roomName || t?.room ||
    t?.booking?.showTime?.room?.roomName ||
    t?.booking?.ShowTime?.Room?.RoomName || "—";
}
export function getTicketArea(t) {
  return t?.areaName || t?.area ||
    t?.booking?.showTime?.room?.cinema?.area?.areaName ||
    t?.booking?.ShowTime?.Room?.Cinema?.Area?.AreaName || "—";
}
export function getTicketSeat(t) {
  if (t?.seatCode) return t.seatCode;
  const s = t?.booking?.seat || t?.booking?.Seat;
  if (s) return `${s.seatRow || s.SeatRow || ""}${s.seatNumber || s.SeatNumber || ""}`;
  return "—";
}
export function getTicketPrice(t) {
  return t?.price || t?.Price || t?.amount || t?.booking?.ticketPrice || 0;
}
export function getTicketStatus(t) {
  const s = t?.status || t?.Status || "";
  if (s === "Used") return "Đã sử dụng";
  if (s === "Active") return "Đã đặt";
  if (s === "Cancelled") return "Đã hủy";
  return s || "Đã đặt";
}
export function getTicketDate(t) {
  const d = t?.issuedAt || t?.IssuedAt || t?.booking?.bookingDate || t?.booking?.BookingDate;
  return d ? String(d).split("T")[0] : "—";
}

export const EMPTY_FORM = {
  code: "",
  customerName: "",
  movieTitle: "",
  seatCode: "",
  price: 0,
  status: "Đã đặt",
};

export function useTicket() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  function normalizeArray(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.$values)) return data.$values;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const data = await getTicketList();
      setList(normalizeArray(data));
    } catch (err) {
      setList([]);
      setError(err?.message || "Không thể tải danh sách vé.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Bạn có chắc muốn xóa vé này?")) return;
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
    setEditId(ticket.ticketId || ticket.id);
    setFormData({
      code: getTicketCode(ticket),
      movieTitle: getTicketMovie(ticket),
      price: getTicketPrice(ticket),
      status: ticket.status || "Active",
    });
    setFormError("");
    setShowModal(true);
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

  const filtered = list.filter((t) => {
    const code = t.code || t.ticketCode || "";
    const customer = t.customerName || "";
    const movie = t.movieTitle || "";

    const matchSearch =
      code.toLowerCase().includes(search.toLowerCase()) ||
      customer.toLowerCase().includes(search.toLowerCase()) ||
      movie.toLowerCase().includes(search.toLowerCase());

    const matchStatus = filterStatus ? t.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  return {
    list,
    loading,
    error,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filtered,
    showModal,
    editId,
    formData,
    formLoading,
    formError,
    fetchData,
    handleDelete,
    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmitForm,
  };
}
