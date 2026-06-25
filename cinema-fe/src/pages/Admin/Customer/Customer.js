import { useEffect, useState } from "react";
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
  membershipLevel: "",
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

export function getMembershipClass(level) {
  const baseClass = "px-2 py-0.5 rounded-full text-xs font-semibold uppercase";

  if (level === "Diamond") {
    return `${baseClass} bg-cyan-100 text-cyan-800`;
  }

  if (level === "Gold") {
    return `${baseClass} bg-yellow-100 text-yellow-800`;
  }

  if (level === "Silver") {
    return `${baseClass} bg-gray-100 text-gray-800`;
  }

  return `${baseClass} bg-orange-100 text-orange-800`;
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

export function filterCustomerList(list, search) {
  const keyword = search.trim().toLowerCase();

  if (!keyword) return list;

  return list.filter((customer) => {
    const name = getCustomerName(customer).toLowerCase();
    const email = getCustomerEmail(customer).toLowerCase();
    const phone = getCustomerPhone(customer).toLowerCase();

    return (
      name.includes(keyword) ||
      email.includes(keyword) ||
      phone.includes(keyword)
    );
  });
}

export function useCustomer() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

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

  const filtered = filterCustomerList(list, search);

  return {
    loading,
    error,

    search,
    setSearch,

    filtered,

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