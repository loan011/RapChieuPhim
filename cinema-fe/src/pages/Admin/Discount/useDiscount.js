import { useState, useEffect, useMemo } from "react";
import {
  getDiscountList,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from "./discountService";

export const LOCAL_STORAGE_KEY = "rapchieuphim_discounts_data";

export const INITIAL_DISCOUNTS = [
  {
    discountId: 1,
    discountCode: "GIAM20K",
    programName: "Giảm 20.000đ cho đơn hàng từ 150.000đ",
    description: "Giảm 20.000đ cho đơn hàng từ 150.000đ",
    discountType: "Fixed", // Fixed (Số tiền)
    discountValue: 10000,
    maxDiscountAmount: 0,
    minOrderAmount: 150000,
    maxUsageTotal: 100,
    maxUsagePerUser: 1,
    usedCount: 0,
    isStackable: false,
    couponType: "Public", // Mã công khai
    targetCustomer: "All", // Tất cả khách
    scope: "Tất cả dịch vụ",
    appliedItems: "Toàn bộ hệ thống rạp",
    startDate: "2026-07-14T00:00:00",
    endDate: "2026-08-29T23:59:59",
    isActive: true,
  },
  {
    discountId: 2,
    discountCode: "SALE10",
    programName: "Giảm 5% cho đơn hàng từ 100.000đ",
    description: "Giảm 5% cho đơn hàng từ 100.000đ",
    discountType: "Percent", // Percent (Phần trăm)
    discountValue: 5,
    maxDiscountAmount: 0,
    minOrderAmount: 100000,
    maxUsageTotal: 100,
    maxUsagePerUser: 1,
    usedCount: 0,
    isStackable: false,
    couponType: "Public",
    targetCustomer: "All",
    scope: "Tất cả dịch vụ",
    appliedItems: "Toàn bộ hệ thống rạp",
    startDate: "2026-07-15T00:00:00",
    endDate: "2026-08-30T23:59:59",
    isActive: true,
  },
  {
    discountId: 3,
    discountCode: "SUMMER20",
    programName: "Giảm giá mùa hè 2026",
    description: "Ưu đãi chào hè bùng nổ giảm 20% cho tất cả đơn hàng đặt vé xem phim và mua combo popcorn.",
    discountType: "Percent",
    discountValue: 20,
    maxDiscountAmount: 100000,
    minOrderAmount: 300000,
    maxUsageTotal: 500,
    maxUsagePerUser: 1,
    usedCount: 42,
    isStackable: false,
    couponType: "Public",
    targetCustomer: "All",
    scope: "Tất cả dịch vụ",
    appliedItems: "Áp dụng toàn bộ hệ thống rạp",
    startDate: "2026-06-01T00:00:00",
    endDate: "2026-08-31T23:59:59",
    isActive: true,
  },
];

export function getStoredDiscounts() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Lỗi đọc discounts từ localStorage:", e);
  }
  return INITIAL_DISCOUNTS;
}

export function saveStoredDiscounts(data) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event("discountsUpdated"));
  } catch (e) {
    console.warn("Lỗi ghi discounts vào localStorage:", e);
  }
}

export const EMPTY_FORM = {
  // 1. Thông tin khuyến mãi
  discountCode: "",
  programName: "",
  description: "",
  discountType: "Percent",
  discountValue: 20,
  maxDiscountAmount: 100000,

  // 2. Điều kiện sử dụng
  minOrderAmount: 300000,
  maxUsageTotal: 500,
  maxUsagePerUser: 1,
  isStackable: false,

  // 3. Đối tượng và phạm vi
  couponType: "Public", // Public / Private
  targetCustomer: "All", // All / Newbie / VIP
  scope: "Tất cả dịch vụ",
  appliedItems: "Tất cả các rạp & phim",

  // 4. Thời gian và trạng thái
  startDate: new Date().toISOString().slice(0, 16),
  endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 16),
  isActive: true,
};

export function getDiscountStatus(discount) {
  if (!discount.isActive) return { label: "Tạm dừng", class: "status-inactive" };

  const now = new Date();
  const start = discount.startDate ? new Date(discount.startDate) : null;
  const end = discount.endDate ? new Date(discount.endDate) : null;

  if (start && start > now) {
    return { label: "Sắp diễn ra", class: "status-upcoming" };
  }
  if (end && end < now) {
    return { label: "Đã kết thúc", class: "status-expired" };
  }
  if (discount.maxUsageTotal && discount.usedCount >= discount.maxUsageTotal) {
    return { label: "Hết lượt", class: "status-expired" };
  }
  return { label: "Đang diễn ra", class: "status-active" };
}

export function formatCurrency(amount) {
  if (!amount && amount !== 0) return "0 VNĐ";
  return new Intl.NumberFormat("vi-VN").format(amount) + " VNĐ";
}

export function useDiscount() {
  const [discounts, setDiscounts] = useState(getStoredDiscounts());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [detailDiscount, setDetailDiscount] = useState(null);

  useEffect(() => {
    fetchDiscounts();

    function handleStorageChange() {
      setDiscounts(getStoredDiscounts());
    }

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("discountsUpdated", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("discountsUpdated", handleStorageChange);
    };
  }, []);

  async function fetchDiscounts() {
    try {
      setLoading(true);
      setError("");
      const data = await getDiscountList();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((d) => ({
          ...d,
          programName: d.programName || d.description || "Chương trình ưu đãi",
          couponType: d.couponType || "Public",
          targetCustomer: d.targetCustomer || "All",
          isStackable: d.isStackable ?? false,
          appliedItems: d.appliedItems || "Tất cả dịch vụ",
        }));
        setDiscounts(mapped);
        saveStoredDiscounts(mapped);
      } else {
        const stored = getStoredDiscounts();
        setDiscounts(stored);
      }
    } catch (err) {
      console.warn("Lỗi API getDiscountList, dùng dữ liệu đã lưu:", err);
      const stored = getStoredDiscounts();
      setDiscounts(stored);
    } finally {
      setLoading(false);
    }
  }

  const filteredDiscounts = useMemo(() => {
    return discounts.filter((d) => {
      const code = (d.discountCode || "").toLowerCase();
      const prog = (d.programName || d.description || "").toLowerCase();
      const desc = (d.description || "").toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || code.includes(q) || prog.includes(q) || desc.includes(q);

      const matchType =
        filterType === "all" ||
        (filterType === "Percent" && d.discountType === "Percent") ||
        (filterType === "Fixed" && d.discountType === "Fixed");

      const status = getDiscountStatus(d).label;
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && status === "Đang diễn ra") ||
        (filterStatus === "upcoming" && status === "Sắp diễn ra") ||
        (filterStatus === "expired" && (status === "Đã kết thúc" || status === "Hết lượt")) ||
        (filterStatus === "inactive" && status === "Tạm dừng");

      return matchSearch && matchType && matchStatus;
    });
  }, [discounts, searchQuery, filterType, filterStatus]);

  function handleOpenAdd() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function handleOpenEdit(item) {
    setEditId(item.discountId);
    setForm({
      discountCode: (item.discountCode || "").toUpperCase(),
      programName: item.programName || item.description || "",
      description: item.description || "",
      discountType: item.discountType || "Percent",
      discountValue: item.discountValue || 0,
      maxDiscountAmount: item.maxDiscountAmount || 0,
      minOrderAmount: item.minOrderAmount || 0,
      maxUsageTotal: item.maxUsageTotal ?? "",
      maxUsagePerUser: item.maxUsagePerUser || 1,
      isStackable: item.isStackable ?? false,
      couponType: item.couponType || "Public",
      targetCustomer: item.targetCustomer || "All",
      scope: item.scope || "Tất cả dịch vụ",
      appliedItems: item.appliedItems || "Tất cả các rạp & phim",
      startDate: item.startDate ? new Date(item.startDate).toISOString().slice(0, 16) : "",
      endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 16) : "",
      isActive: item.isActive ?? true,
    });
    setFormError("");
    setShowModal(true);
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    let finalValue = type === "checkbox" ? checked : value;

    if (name === "discountCode" && typeof finalValue === "string") {
      finalValue = finalValue.toUpperCase().trim();
    }

    setForm((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    const parseNum = (val) => {
      if (val === "" || val === null || val === undefined) return 0;
      if (typeof val === "number") return val;
      const str = String(val).replace(/\./g, "").replace(/,/g, "").trim();
      return isNaN(Number(str)) ? 0 : Number(str);
    };

    if (!form.discountCode || !form.discountCode.trim()) {
      setFormError("❌ Quy tắc 1: Mã giảm giá (DiscountCode) không được để trống.");
      return;
    }

    const codeUpper = form.discountCode.trim().toUpperCase();

    const isDuplicate = discounts.some(
      (d) => (d.discountCode || "").toUpperCase() === codeUpper && String(d.discountId) !== String(editId)
    );
    if (isDuplicate) {
      setFormError(`❌ Quy tắc 2: Mã giảm giá "${codeUpper}" đã tồn tại trong hệ thống. Vui lòng chọn mã khác.`);
      return;
    }

    if (!["Percent", "Fixed"].includes(form.discountType)) {
      setFormError("❌ Quy tắc 4: Loại giảm giá (DiscountType) chỉ được chọn là Percent (%) hoặc Fixed (Số tiền cố định).");
      return;
    }

    const val = parseNum(form.discountValue);
    if (val <= 0) {
      setFormError("❌ Quy tắc 5: Giá trị giảm (DiscountValue) phải lớn hơn 0.");
      return;
    }

    if (form.discountType === "Percent" && val > 100) {
      setFormError("❌ Quy tắc 6: Khi chọn loại giảm Phần trăm (Percent), Giá trị giảm không được lớn hơn 100%.");
      return;
    }

    const minOrder = parseNum(form.minOrderAmount);
    if (minOrder < 0) {
      setFormError("❌ Quy tắc 7: Đơn hàng tối thiểu (MinOrderAmount) phải lớn hơn hoặc bằng 0.");
      return;
    }

    const hasTotal = form.maxUsageTotal !== "" && form.maxUsageTotal !== null && form.maxUsageTotal !== undefined;
    const totalUsage = hasTotal ? parseNum(form.maxUsageTotal) : null;
    if (hasTotal && (totalUsage === null || totalUsage <= 0)) {
      setFormError("❌ Quy tắc 8: Tổng lượt sử dụng tối đa (MaxUsageTotal) phải lớn hơn 0.");
      return;
    }

    const usagePerUser = parseNum(form.maxUsagePerUser);
    if (usagePerUser <= 0) {
      setFormError("❌ Quy tắc 9: Số lượt tối đa mỗi khách hàng (MaxUsagePerUser) phải lớn hơn 0.");
      return;
    }

    if (totalUsage !== null && usagePerUser > totalUsage) {
      setFormError(`❌ Quy tắc 10: Số lượt mỗi khách hàng (${usagePerUser}) không được lớn hơn Tổng lượt sử dụng tối đa (${totalUsage}).`);
      return;
    }

    if (form.startDate && form.endDate) {
      const startDt = new Date(form.startDate);
      const endDt = new Date(form.endDate);
      if (!isNaN(startDt.getTime()) && !isNaN(endDt.getTime()) && endDt <= startDt) {
        setFormError("❌ Quy tắc 11: Thời gian kết thúc (EndDate) phải sau Thời gian bắt đầu (StartDate).");
        return;
      }
    }

    const payload = {
      discountCode: codeUpper,
      programName: form.programName.trim() || codeUpper,
      description: form.description.trim() || form.programName.trim(),
      discountType: form.discountType,
      discountValue: val,
      minOrderAmount: minOrder,
      maxDiscountAmount: parseNum(form.maxDiscountAmount),
      maxUsageTotal: totalUsage,
      maxUsagePerUser: usagePerUser,
      isStackable: form.isStackable,
      couponType: form.couponType,
      targetCustomer: form.targetCustomer,
      scope: form.scope,
      appliedItems: form.appliedItems,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : new Date().toISOString(),
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      isActive: form.isActive,
    };

    setSubmitting(true);
    try {
      let updatedList = [];
      if (editId !== null) {
        try {
          await updateDiscount(editId, payload);
        } catch (apiErr) {
          console.warn("Lỗi API Cập nhật, vẫn lưu đồng bộ ứng dụng:", apiErr);
        }
        updatedList = discounts.map((d) => (String(d.discountId) === String(editId) ? { ...d, ...payload, discountId: editId } : d));
      } else {
        let created = null;
        try {
          created = await createDiscount(payload);
        } catch (apiErr) {
          console.warn("Lỗi API Tạo mới, vẫn lưu đồng bộ ứng dụng:", apiErr);
        }
        const newItem = created || {
          ...payload,
          discountId: Date.now(),
          usedCount: 0,
        };
        updatedList = [newItem, ...discounts];
      }
      setDiscounts(updatedList);
      saveStoredDiscounts(updatedList);
      setShowModal(false);
    } catch (err) {
      setFormError(err.message || "Đã xảy ra lỗi khi lưu chương trình giảm giá.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirmId) return;
    try {
      await deleteDiscount(deleteConfirmId).catch(() => null);
      const updated = discounts.filter((d) => String(d.discountId) !== String(deleteConfirmId));
      setDiscounts(updated);
      saveStoredDiscounts(updated);
    } catch (err) {
      console.error("Xóa mã thất bại:", err);
    } finally {
      setDeleteConfirmId(null);
    }
  }

  async function handleToggleStatus(item) {
    const updatedStatus = !item.isActive;
    const payload = { ...item, isActive: updatedStatus };
    try {
      await updateDiscount(item.discountId, payload).catch(() => null);
      const updated = discounts.map((d) => (String(d.discountId) === String(item.discountId) ? { ...d, isActive: updatedStatus } : d));
      setDiscounts(updated);
      saveStoredDiscounts(updated);
    } catch (err) {
      console.error("Lỗi thay đổi trạng thái:", err);
    }
  }

  return {
    discounts: filteredDiscounts,
    totalCount: discounts.length,
    activeCount: discounts.filter((d) => getDiscountStatus(d).label === "Đang diễn ra").length,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    showModal,
    setShowModal,
    editId,
    form,
    formError,
    submitting,
    deleteConfirmId,
    setDeleteConfirmId,
    detailDiscount,
    setDetailDiscount,
    handleOpenAdd,
    handleOpenEdit,
    handleFormChange,
    handleSubmit,
    handleDeleteConfirm,
    handleToggleStatus,
    fetchDiscounts,
  };
}
