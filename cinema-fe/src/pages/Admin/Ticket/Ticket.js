import { useEffect, useState } from "react";
import { getTicketList, deleteTicket, createTicket, updateTicket } from "./ticketService";

export const STATUS_OPTIONS = ["Đã đặt", "Đã thanh toán", "Đã hủy"];

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
    setEditId(ticket.id || ticket.ticketId);
    setFormData({
      code: ticket.code || ticket.ticketCode || "",
      customerName: ticket.customerName || "",
      movieTitle: ticket.movieTitle || "",
      seatCode: ticket.seatCode || "",
      price: ticket.price || ticket.amount || 0,
      status: ticket.status || "Đã đặt",
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
