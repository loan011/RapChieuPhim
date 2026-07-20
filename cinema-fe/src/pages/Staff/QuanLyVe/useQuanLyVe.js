import { useEffect, useState } from "react";
import { fetchTickets, removeTicket, addTicket, editTicket } from "./QuanLyVeService";
import { getShowtimeDetailList } from "../../Admin/Rate/showtimeService";
import { EMPTY_FORM } from "../../Admin/Ticket/useTicket.js";

export function useQuanLyVe() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState(new Date().toLocaleDateString("en-CA")); // YYYY-MM-DD format

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
      
      const [data, showtimes] = await Promise.all([
        fetchTickets(),
        getShowtimeDetailList().catch(() => [])
      ]);
      
      let normalized = normalizeArray(data);
      const normalizedShowtimes = normalizeArray(showtimes);
      
      const showtimeCinemaMap = {};
      normalizedShowtimes.forEach(st => {
          const id = st.id || st.Id;
          const cinemaId = st.room?.cinemaId || st.Room?.CinemaId;
          if (id && cinemaId) {
             showtimeCinemaMap[id] = String(cinemaId);
          }
      });

      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          const staffCinemaId = String(user.cinemaId || user.CinemaId || "");
          if (staffCinemaId) {
            normalized = normalized.filter((t) => {
              let tCinemaId = String(
                t.cinemaId ??
                  t.CinemaId ??
                  t.cinema?.cinemaId ??
                  t.cinema?.CinemaId ??
                  t.showtime?.room?.cinemaId ??
                  t.Showtime?.Room?.CinemaId ??
                  ""
              );

              // 1. Map via showtime
              if (!tCinemaId) {
                  const sId = t.showtimeId || t.ShowtimeId || t.showTimeId || t.ShowTimeId;
                  if (sId && showtimeCinemaMap[sId]) {
                      tCinemaId = showtimeCinemaMap[sId];
                  }
              }

              // 2. Map via name
              if (!tCinemaId) {
                 const name = (t.cinemaName || t.CinemaName || t.cinema || t.roomName || t.RoomName || t.movieTitle || "").toLowerCase();
                 if (name.includes("đồng khởi") || name.includes("dong khoi")) tCinemaId = "1";
                 else if (name.includes("bến thành") || name.includes("ben thanh")) tCinemaId = "2";
                 else if (name.includes("tân bình") || name.includes("tan binh")) tCinemaId = "3";
                 else if (name.includes("nguyễn trãi") || name.includes("nguyen trai")) tCinemaId = "4";
              }

              const finalCinemaId = tCinemaId || "1"; // Mặc định về Đồng Khởi (1) nếu thiếu dữ liệu
              return finalCinemaId === staffCinemaId;
            });
          }
        }
      } catch (e) {
        console.error("Lỗi lọc vé theo chi nhánh:", e);
      }

      normalized.sort((a, b) => {
        const dateA = new Date(a.issuedAt || a.IssuedAt || 0);
        const dateB = new Date(b.issuedAt || b.IssuedAt || 0);
        return dateB - dateA;
      });
      setList(normalized);
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
      await removeTicket(id);
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
    setEditId(ticket.id || ticket.ticketId);
    setFormData({
      code: ticket.code || ticket.ticketCode || "",
      customerName: ticket.customerName || "",
      movieTitle: ticket.movieTitle || "",
      seatCode: ticket.seatCode || "",
      price: ticket.price || ticket.amount || 0,
      status: ticket.status || "Đã đặt",
      cinemaId: ticket.cinemaId || ticket.CinemaId || "",
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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        await editTicket(editId, payload);
      } else {
        await addTicket(payload);
      }
      closeModal();
      fetchData();
    } catch (err) {
      setFormError(err?.message || "Lưu thông tin vé thất bại.");
    } finally {
      setFormLoading(false);
    }
  }

  const STATUS_OPTIONS = ["Đang hoạt động", "Đã sử dụng"];

  const filtered = list.filter((t) => {
    const isKeepStatus =
      t.status === "Active" ||
      t.status === "Used" ||
      t.status === "Đã đặt" ||
      t.status === "Đã thanh toán";
    if (!isKeepStatus) return false;

    // Filter by date
    if (filterDate) {
      const tDateRaw = t.issuedAt || t.IssuedAt || t.CreatedAt || t.createdAt;
      if (tDateRaw) {
         const tDateStr = tDateRaw.split("T")[0];
         if (tDateStr !== filterDate) return false;
      } else {
         return false; // hide items without date if filter is applied
      }
    }

    const query = search.toLowerCase().trim();
    const cleanQuery = query.replace(/\s+/g, "");

    const code = (t.code || t.ticketCode || t.Code || t.TicketCode || "").toLowerCase();
    const cleanCode = code.replace(/\s+/g, "");
    const customer = (t.customerName || t.CustomerName || "").toLowerCase();
    const movie = (t.movieTitle || t.MovieTitle || "").toLowerCase();
    const ticketId = String(t.ticketId || t.TicketId || t.id || t.Id || "").toLowerCase();
    const bookingId = String(t.bookingId || t.BookingId || "").toLowerCase();

    const matchSearch =
      !query ||
      code.includes(query) ||
      cleanCode.includes(cleanQuery) ||
      ticketId.includes(query) ||
      bookingId.includes(query) ||
      movie.includes(query) ||
      customer.includes(query);

    let matchStatus = true;
    if (filterStatus === "Đang hoạt động") {
      matchStatus = t.status === "Active" || t.status === "Đã đặt";
    } else if (filterStatus === "Đã sử dụng") {
      matchStatus = t.status === "Used" || t.status === "Đã thanh toán";
    }

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
    filterDate,
    setFilterDate,
    filtered,
    showModal,
    editId,
    formData,
    formLoading,
    formError,
    STATUS_OPTIONS,
    fetchData,
    handleDelete,
    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmitForm,
  };
}
