import { useEffect, useState, useMemo } from "react";
import {
  getCustomerList,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "./customerService";
import { getInvoiceList } from "../Bill/invoiceService";

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
export const VIP_THRESHOLD = 3_000_000; // 3 triệu

export const EMPTY_CUSTOMER_FORM = {
  fullName: "",
  email: "",
  phone: "",
};

/* ─────────────────────────────────────────────────────────
   HELPER – normalize
───────────────────────────────────────────────────────── */
export function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  return [];
}

/* ─────────────────────────────────────────────────────────
   ACCESSOR HELPERS – Customer fields
───────────────────────────────────────────────────────── */
export function getCustomerId(c) {
  return c?.userId ?? c?.UserId ?? c?.customerId ?? c?.CustomerId ?? c?.id ?? c?.Id;
}

export function getCustomerName(c) {
  return c?.fullName ?? c?.FullName ?? c?.name ?? c?.Name ?? "Chưa có tên";
}

export function getCustomerEmail(c) {
  return c?.email ?? c?.Email ?? "—";
}

export function getCustomerPhone(c) {
  return c?.phone ?? c?.Phone ?? c?.phoneNumber ?? c?.PhoneNumber ?? "—";
}

export function getCustomerPoint(c) {
  return c?.rewardPoint ?? c?.RewardPoint ?? 0;
}

export function getCustomerCreatedAtRaw(c) {
  return (
    c?.createdAt ?? c?.CreatedAt ??
    c?.registrationDate ?? c?.RegistrationDate ??
    c?.joinDate ?? c?.JoinDate ?? ""
  );
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).split("T")[0];
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function getCustomerCreatedAt(c) {
  return formatDate(getCustomerCreatedAtRaw(c));
}

/* ─────────────────────────────────────────────────────────
   SPEND-BASED DERIVED FIELDS
   All derived from invoices map (spendMap: userId → totalSpend)
───────────────────────────────────────────────────────── */

/**
 * Tính tổng chi tiêu từ backend API (totalSpent) hoặc spendMap
 */
export function getCustomerSpend(c, spendMap = {}) {
  if (c?.totalSpent !== undefined) return c.totalSpent;
  if (c?.TotalSpent !== undefined) return c.TotalSpent;
  const id = String(getCustomerId(c));
  return spendMap[id] ?? 0;
}

/**
 * Nhóm khách hàng:
 *  - VIP    : chi tiêu >= 3,000,000
 *  - Thường : đã có ít nhất 1 hóa đơn nhưng < 3,000,000
 *  - Mới    : chưa có hóa đơn nào
 */
export function getCustomerGroup(c, spendMap = {}) {
  const spend = getCustomerSpend(c, spendMap);
  if (spend >= VIP_THRESHOLD) return "VIP";
  return "Thường";
}

export function getGroupStyle(group) {
  if (group === "VIP") return { bg: "#f3e8ff", color: "#a855f7" };
  if (group === "Thường") return { bg: "#eff6ff", color: "#3b82f6" };
  return { bg: "#f0fdf4", color: "#22c55e" };
}

/* ─────────────────────────────────────────────────────────
   FORM HELPERS
───────────────────────────────────────────────────────── */
export function buildFormFromCustomer(c) {
  return {
    fullName: getCustomerName(c) === "Chưa có tên" ? "" : getCustomerName(c),
    email:    getCustomerEmail(c) === "—"          ? "" : getCustomerEmail(c),
    phone:    getCustomerPhone(c) === "—"          ? "" : getCustomerPhone(c),
  };
}

export function validateCustomerForm(form) {
  if (!form.fullName.trim()) return "Vui lòng nhập họ tên khách hàng.";
  if (!form.email.trim())    return "Vui lòng nhập email.";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(form.email.trim())) return "Email không đúng định dạng.";
  if (form.phone.trim() && !/^\d{10}$/.test(form.phone.trim()))
    return "Số điện thoại phải gồm 10 chữ số.";
  return "";
}

/* ─────────────────────────────────────────────────────────
   MAIN HOOK
───────────────────────────────────────────────────────── */
export function useCustomer() {
  const [list,     setList]     = useState([]);
  const [spendMap, setSpendMap] = useState({}); // userId (string) → totalSpend (number)
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const [search,      setSearch]      = useState("");
  const [filterGroup, setFilterGroup] = useState("");

  const [showModal,  setShowModal]  = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [form,       setForm]       = useState(EMPTY_CUSTOMER_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState("");

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      // Fetch customers AND invoices in parallel
      const [customerData, invoiceData] = await Promise.all([
        getCustomerList(),
        getInvoiceList().catch(() => []),   // graceful fallback
      ]);

      const customers = normalizeArray(customerData);
      const invoices  = normalizeArray(invoiceData);

      setList(customers);

      // Build spend map: sum all paid invoices per userId
      const map = {};
      for (const inv of invoices) {
        // Identify customer on invoice
        const uid = String(
          inv?.userId ?? inv?.UserId ??
          inv?.customerId ?? inv?.CustomerId ??
          inv?.user?.userId ?? inv?.user?.UserId ?? ""
        );
        if (!uid) continue;

        const amount = Number(
          inv?.totalAmount ?? inv?.TotalAmount ??
          inv?.total ?? inv?.Total ??
          inv?.amount ?? inv?.Amount ?? 0
        );

        // Only count paid / confirmed invoices
        const status = (inv?.status ?? inv?.Status ?? "").toLowerCase();
        if (status && (status === "cancelled" || status === "hủy" || status === "cancel")) continue;

        map[uid] = (map[uid] ?? 0) + amount;
      }
      setSpendMap(map);
    } catch (err) {
      console.error("Lỗi tải khách hàng:", err);
      setError(err.message || "Lấy danh sách khách hàng thất bại!");
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  /* ── Modal helpers ── */
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
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    const msg = validateCustomerForm(form);
    if (msg) { setFormError(msg); return; }

    try {
      setSubmitting(true);
      const payload = {
        fullName: form.fullName.trim(),
        email:    form.email.trim(),
        phone:    form.phone.trim(),
      };
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
    setFilterGroup("");
  }

  /* ── Derived filtered list ── */
  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return list.filter((c) => {
      const matchSearch = !kw ||
        getCustomerName(c).toLowerCase().includes(kw)  ||
        getCustomerEmail(c).toLowerCase().includes(kw) ||
        getCustomerPhone(c).toLowerCase().includes(kw);
      const matchGroup = !filterGroup || getCustomerGroup(c, spendMap) === filterGroup;
      return matchSearch && matchGroup;
    });
  }, [list, spendMap, search, filterGroup]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const total  = list.length;
    const vip    = list.filter((c) => getCustomerGroup(c, spendMap) === "VIP").length;
    const usual  = list.filter((c) => getCustomerGroup(c, spendMap) === "Thường").length;
    const totalSpend = Object.values(spendMap).reduce((s, v) => s + v, 0);

    return { total, vip, usual, totalSpend };
  }, [list, spendMap]);

  return {
    loading,
    error,
    list,
    spendMap,

    search,       setSearch,
    filterGroup,  setFilterGroup,
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