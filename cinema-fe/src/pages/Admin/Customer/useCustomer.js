import { useEffect, useState, useMemo } from "react";
import {
  getCustomerList,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "./customerService";

export const CUSTOMER_DEFAULT_VALUES = {
  empty: "",
  zero: 0,
};

export const CUSTOMER_MEMBERSHIP_OPTIONS = [
  { value: "", label: "-- Chọn hạng thành viên --" },
  { value: "Bronze", label: "Bronze" },
  { value: "Silver", label: "Silver" },
  { value: "Gold", label: "Gold" },
  { value: "Diamond", label: "Diamond" },
];

export const EMPTY_CUSTOMER_FORM = {
  fullName: "",
  email: "",
  phone: "",
  rewardPoint: 0,
  membershipLevel: "Bronze",
};

export function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  return [];
}

export function getCustomerId(customer) {
  return (
    customer?.customerId ??
    customer?.CustomerId ??
    customer?.id ??
    customer?.Id
  );
}

export function getCustomerName(customer) {
  return (
    customer?.fullName ??
    customer?.FullName ??
    customer?.name ??
    customer?.Name ??
    "Chưa có tên"
  );
}

export function getCustomerEmail(customer) {
  return customer?.email ?? customer?.Email ?? "—";
}

export function getCustomerPhone(customer) {
  return customer?.phone ?? customer?.Phone ?? "—";
}

export function getCustomerPoint(customer) {
  return customer?.rewardPoint ?? customer?.RewardPoint ?? 0;
}

export function getCustomerCreatedAtRaw(customer) {
  return (
    customer?.createdAt ??
    customer?.CreatedAt ??
    customer?.registrationDate ??
    customer?.RegistrationDate ??
    ""
  );
}

export function getCustomerMembershipLevel(customer) {
  return (
    customer?.membershipLevel ??
    customer?.MembershipLevel ??
    "Bronze"
  );
}

export function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).split("T")[0];
  }

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  return `${dd}/${mm}/${yyyy}`;
}

export function getCustomerCreatedAt(customer) {
  return formatDate(getCustomerCreatedAtRaw(customer));
}

/* ── Custom derived attributes for Customer mockup ── */
export function getCustomerType(c) {
  const email = getCustomerEmail(c);
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  const val = Math.abs(hash) % 3;
  if (val === 0) return "Sử dụng hệ thống";
  if (val === 1) return "Mua tại quầy";
  return "Không sử dụng";
}

export function getCustomerGroup(c) {
  const level = getCustomerMembershipLevel(c);
  if (level === "Diamond") return "VIP";
  if (level === "Gold") return "Thân thiết";
  if (level === "Silver") return "Thường";
  return "Mới";
}

export function getCustomerSpend(c) {
  const points = getCustomerPoint(c);
  return points * 100000; // 1 point = 100,000đ
}

export function getCustomerStatus(c) {
  const spend = getCustomerSpend(c);
  if (spend >= 5000000) return "Đã xem phim";
  if (spend > 0) return "Đã mua - Chưa xem";
  return "Chưa sử dụng";
}

/* ── Color styling helpers for badges ── */
export function getTypeStyle(type) {
  if (type === "Sử dụng hệ thống") {
    return { bg: "#e6f9f0", color: "#10b981" };
  }
  if (type === "Mua tại quầy") {
    return { bg: "#eff6ff", color: "#3b82f6" };
  }
  return { bg: "#f3f4f6", color: "#6b7280" };
}

export function getGroupStyle(group) {
  if (group === "VIP") {
    return { bg: "#f3e8ff", color: "#a855f7" };
  }
  if (group === "Thân thiết") {
    return { bg: "#fff7ed", color: "#f97316" };
  }
  if (group === "Thường") {
    return { bg: "#eff6ff", color: "#3b82f6" };
  }
  return { bg: "#f0fdf4", color: "#22c55e" };
}

export function getStatusStyle(status) {
  if (status === "Đã xem phim") {
    return { bg: "#e6f9f0", color: "#10b981" };
  }
  if (status === "Đã mua - Chưa xem") {
    return { bg: "#fff7ed", color: "#f97316" };
  }
  return { bg: "#f3f4f6", color: "#6b7280" };
}

export function getCustomerWatchHistory(c) {
  const spend = getCustomerSpend(c);
  if (spend === 0) return [];

  const moviesList = [
    { title: "Lật Mặt 7: Một Điều Ước", date: "24/05/2026", rating: 5, comment: "Phim rất xúc động, cả nhà mình đi xem ai cũng khóc. Rất đáng xem!" },
    { title: "Mai", date: "15/02/2026", rating: 4, comment: "Nội dung phim hay, sâu sắc. Diễn xuất của diễn viên rất đạt." },
    { title: "Dune: Hành Tinh Cát - Phần 2", date: "10/03/2026", rating: 5, comment: "Kỹ xảo và âm thanh quá đỉnh, xem rạp cực kỳ phê!" },
    { title: "Kung Fu Panda 4", date: "20/04/2026", rating: 4, comment: "Phim giải trí tốt, hài hước, thích hợp xem cùng gia đình." },
    { title: "Godzilla x Kong: Đế Chế Mới", date: "05/04/2026", rating: 3, comment: "Phim hành động mãn nhãn nhưng nội dung hơi đơn giản." },
  ];

  const email = getCustomerEmail(c);
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const numWatched = Math.min(Math.floor(spend / 1000000) + 1, moviesList.length);
  const history = [];
  
  for (let i = 0; i < numWatched; i++) {
    const index = (Math.abs(hash) + i) % moviesList.length;
    if (!history.some(h => h.title === moviesList[index].title)) {
      history.push(moviesList[index]);
    }
  }
  return history;
}

export function buildFormFromCustomer(customer) {
  return {
    fullName: getCustomerName(customer) === "Chưa có tên"
      ? ""
      : getCustomerName(customer),
    email: getCustomerEmail(customer) === "—" ? "" : getCustomerEmail(customer),
    phone: getCustomerPhone(customer) === "—" ? "" : getCustomerPhone(customer),
    rewardPoint: getCustomerPoint(customer),
    membershipLevel: getCustomerMembershipLevel(customer),
  };
}

export function validateCustomerForm(form) {
  if (!form.fullName.trim()) {
    return "Vui lòng nhập họ tên khách hàng.";
  }

  if (!form.email.trim()) {
    return "Vui lòng nhập email.";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(form.email.trim())) {
    return "Email không đúng định dạng.";
  }

  if (form.phone.trim() && !/^\d{10}$/.test(form.phone.trim())) {
    return "Số điện thoại phải gồm 10 chữ số.";
  }

  return "";
}

export function buildCustomerPayload(form) {
  return {
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    rewardPoint: Number(form.rewardPoint) || 0,
    membershipLevel: form.membershipLevel || "Bronze",
  };
}

export function useCustomer() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_CUSTOMER_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const data = await getCustomerList();

      setList(normalizeArray(data));
    } catch (err) {
      console.error("Lỗi tải khách hàng:", err);

      setError(err.message || "Lấy danh sách khách hàng thất bại!");
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditId(null);
    setForm(EMPTY_CUSTOMER_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(customer) {
    setEditId(getCustomerId(customer));
    setForm(buildFormFromCustomer(customer));
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setForm(EMPTY_CUSTOMER_FORM);
    setFormError("");
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "rewardPoint" ? Number(value) || 0 : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    const validateMessage = validateCustomerForm(form);

    if (validateMessage) {
      setFormError(validateMessage);
      return;
    }

    try {
      setSubmitting(true);

      const payload = buildCustomerPayload(form);

      if (editId !== null) {
        await updateCustomer(editId, payload);
      } else {
        await createCustomer(payload);
      }

      closeModal();
      fetchData();
    } catch (err) {
      console.error("Lỗi lưu khách hàng:", err);
      setFormError(err.message || "Lưu khách hàng thất bại!");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Bạn có chắc muốn xóa khách hàng này?")) return;

    try {
      await deleteCustomer(id);
      fetchData();
    } catch (err) {
      console.error("Lỗi xóa khách hàng:", err);
      alert(err.message || "Xóa khách hàng thất bại!");
    }
  }

  function resetFilters() {
    setSearch("");
    setFilterType("");
    setFilterGroup("");
    setFilterStatus("");
    setFilterDate("");
  }

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    return list.filter((c) => {
      const name = getCustomerName(c).toLowerCase();
      const email = getCustomerEmail(c).toLowerCase();
      const phone = getCustomerPhone(c).toLowerCase();
      const kw = search.trim().toLowerCase();

      const matchSearch = !kw || name.includes(kw) || email.includes(kw) || phone.includes(kw);
      const matchType = !filterType || getCustomerType(c) === filterType;
      const matchGroup = !filterGroup || getCustomerGroup(c) === filterGroup;
      const matchStatus = !filterStatus || getCustomerStatus(c) === filterStatus;

      return matchSearch && matchType && matchGroup && matchStatus;
    });
  }, [list, search, filterType, filterGroup, filterStatus]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const total = list.length;
    const usedSystem = list.filter((c) => getCustomerType(c) === "Sử dụng hệ thống").length;
    const counter = list.filter((c) => getCustomerType(c) === "Mua tại quầy").length;
    const notUsed = list.filter((c) => getCustomerType(c) === "Không sử dụng").length;
    const spend = list.reduce((acc, c) => acc + getCustomerSpend(c), 0);

    const vip = list.filter((c) => getCustomerGroup(c) === "VIP").length;
    const thânThiết = list.filter((c) => getCustomerGroup(c) === "Thân thiết").length;
    const thường = list.filter((c) => getCustomerGroup(c) === "Thường").length;
    const mới = list.filter((c) => getCustomerGroup(c) === "Mới").length;

    return {
      total,
      usedSystem,
      counter,
      notUsed,
      spend,
      groups: { vip, thânThiết, thường, mới }
    };
  }, [list]);

  return {
    loading,
    error,
    list,

    search,
    setSearch,
    filterType,
    setFilterType,
    filterGroup,
    setFilterGroup,
    filterStatus,
    setFilterStatus,
    filterDate,
    setFilterDate,
    resetFilters,

    filtered,
    stats,

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