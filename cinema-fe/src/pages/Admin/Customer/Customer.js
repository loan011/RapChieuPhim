import { useEffect, useState } from "react";

import {
  getCustomerList,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "./customerService";

export const CUSTOMER_TEXT = {
  header: {
    title: "Quản Lý Khách Hàng",
  },

  search: {
    placeholder: "Tìm kiếm theo tên, email, số điện thoại...",
  },

  table: {
    headers: [
      "#",
      "Họ Tên",
      "Email",
      "Điện Thoại",
      "Điểm Tích Lũy",
      "Hạng Thành Viên",
      "Ngày Đăng Ký",
      "Thao Tác",
    ],
  },

  modal: {
    addTitle: "Thêm Khách Hàng",
    editTitle: "Cập Nhật Khách Hàng",
  },

  fields: {
    fullName: {
      label: "Họ Tên",
      placeholder: "Nhập họ tên khách hàng",
    },

    email: {
      label: "Email",
      placeholder: "Nhập email",
    },

    phone: {
      label: "Điện Thoại",
      placeholder: "Nhập số điện thoại",
    },

    rewardPoint: {
      label: "Điểm Tích Lũy",
      placeholder: "Nhập điểm tích lũy",
    },

    membershipLevel: {
      label: "Hạng Thành Viên",
    },
  },

  buttons: {
    add: "+ Thêm",
    edit: "Sửa",
    delete: "Xóa",
    cancel: "Hủy",
    create: "Thêm Mới",
    update: "Cập Nhật",
    processing: "Đang xử lý...",
  },

  messages: {
    loading: "Đang tải...",
    empty: "Không có dữ liệu",
    loadFailed: "Lấy danh sách khách hàng thất bại!",
    saveFailed: "Lưu khách hàng thất bại!",
    deleteFailed: "Xóa khách hàng thất bại!",
    deleteConfirm: "Bạn có chắc muốn xóa khách hàng này?",
    nameRequired: "Vui lòng nhập họ tên khách hàng.",
    emailRequired: "Vui lòng nhập email.",
    emailInvalid: "Email không đúng định dạng.",
    phoneInvalid: "Số điện thoại phải gồm 10 chữ số.",
  },

  classNames: {
    addButton:
      "bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700",

    card: "bg-white rounded-lg shadow-sm border border-gray-100 p-4",

    searchInput:
      "border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-40",

    loadingText: "text-gray-500 text-sm",
    errorText: "text-red-500 text-sm",

    tableHead: "px-3 py-2 text-left",
    tableCell: "px-3 py-2",
    tableRow: "border-t border-gray-100 hover:bg-gray-50",
    emptyCell: "text-center py-6 text-gray-400",

    editButton: "text-blue-600 hover:underline text-xs",
    deleteButton: "text-red-500 hover:underline text-xs",

    modalOverlay:
      "fixed inset-0 z-50 flex items-center justify-center bg-black/40",

    modalBox: "bg-white rounded-xl shadow-xl w-full max-w-lg p-6",

    label: "block text-sm font-medium text-gray-700 mb-1",

    input:
      "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400",

    cancelButton:
      "px-4 py-2 rounded border border-gray-300 text-sm text-gray-600 hover:bg-gray-50",

    submitButton:
      "px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60",
  },
};

export const CUSTOMER_MEMBERSHIP_OPTIONS = [
  {
    value: "",
    label: "-- Chọn hạng thành viên --",
  },
  {
    value: "Bronze",
    label: "Bronze",
  },
  {
    value: "Silver",
    label: "Silver",
  },
  {
    value: "Gold",
    label: "Gold",
  },
  {
    value: "Diamond",
    label: "Diamond",
  },
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
    customer?.userId ??
    customer?.UserId ??
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
    ""
  );
}

export function getCustomerEmail(customer) {
  return customer?.email ?? customer?.Email ?? "";
}

export function getCustomerPhone(customer) {
  return customer?.phone ?? customer?.Phone ?? "";
}

export function getCustomerPoint(customer) {
  return (
    customer?.rewardPoint ??
    customer?.RewardPoint ??
    customer?.points ??
    customer?.Points ??
    0
  );
}

export function getCustomerMembershipLevel(customer) {
  return (
    customer?.membershipLevel ??
    customer?.MembershipLevel ??
    customer?.level ??
    customer?.Level ??
    "Bronze"
  );
}

export function getCustomerCreatedAtRaw(customer) {
  return (
    customer?.createdAt ??
    customer?.CreatedAt ??
    customer?.registeredAt ??
    customer?.RegisteredAt ??
    customer?.createdDate ??
    customer?.CreatedDate ??
    ""
  );
}

export function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function getCustomerCreatedAt(customer) {
  return formatDate(getCustomerCreatedAtRaw(customer));
}

export function getMembershipClass(level) {
  const baseClass = "px-2 py-0.5 rounded-full text-xs font-medium";

  if (level === "Diamond") {
    return `${baseClass} bg-purple-100 text-purple-700`;
  }

  if (level === "Gold") {
    return `${baseClass} bg-yellow-100 text-yellow-700`;
  }

  if (level === "Silver") {
    return `${baseClass} bg-gray-100 text-gray-700`;
  }

  return `${baseClass} bg-orange-100 text-orange-700`;
}

export function buildFormFromCustomer(customer) {
  return {
    fullName: getCustomerName(customer),
    email: getCustomerEmail(customer),
    phone: getCustomerPhone(customer),
    rewardPoint: getCustomerPoint(customer),
    membershipLevel: getCustomerMembershipLevel(customer),
  };
}

export function buildCustomerPayload(form) {
  return {
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    rewardPoint: Number(form.rewardPoint || 0),
    membershipLevel: form.membershipLevel || "Bronze",
    role: "Customer",
    roleName: "Customer",
    isActive: true,
  };
}

export function validateCustomerForm(form) {
  const T = CUSTOMER_TEXT;

  if (!form.fullName.trim()) {
    return T.messages.nameRequired;
  }

  if (!form.email.trim()) {
    return T.messages.emailRequired;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(form.email.trim())) {
    return T.messages.emailInvalid;
  }

  if (form.phone.trim()) {
    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneRegex.test(form.phone.trim())) {
      return T.messages.phoneInvalid;
    }
  }

  return "";
}

export function filterCustomerList(list, search) {
  const keyword = search.trim().toLowerCase();

  if (!keyword) return list;

  return list.filter((customer) => {
    const name = getCustomerName(customer).toLowerCase();
    const email = getCustomerEmail(customer).toLowerCase();
    const phone = getCustomerPhone(customer).toLowerCase();
    const level = getCustomerMembershipLevel(customer).toLowerCase();

    return (
      name.includes(keyword) ||
      email.includes(keyword) ||
      phone.includes(keyword) ||
      level.includes(keyword)
    );
  });
}

export function useCustomer() {
  const T = CUSTOMER_TEXT;

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

      setList([]);
      setError(err.message || T.messages.loadFailed);
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
      [name]: value,
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

    const payload = buildCustomerPayload(form);

    try {
      setSubmitting(true);

      if (editId !== null) {
        await updateCustomer(editId, payload);

        setList((prev) =>
          prev.map((customer) =>
            String(getCustomerId(customer)) === String(editId)
              ? {
                  ...customer,
                  ...payload,
                }
              : customer
          )
        );
      } else {
        const created = await createCustomer(payload);

        setList((prev) => [
          ...prev,
          {
            ...payload,
            ...(created || {}),
          },
        ]);
      }

      closeModal();
    } catch (err) {
      console.error("Lỗi lưu khách hàng:", err);

      setFormError(err.message || T.messages.saveFailed);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!id) return;

    if (!window.confirm(T.messages.deleteConfirm)) {
      return;
    }

    try {
      await deleteCustomer(id);

      setList((prev) =>
        prev.filter((customer) => String(getCustomerId(customer)) !== String(id))
      );
    } catch (err) {
      console.error("Lỗi xóa khách hàng:", err);
      alert(err.message || T.messages.deleteFailed);
    }
  }

  const filtered = filterCustomerList(list, search);

  return {
    list,
    setList,

    loading,
    setLoading,

    error,
    setError,

    search,
    setSearch,

    filtered,

    showModal,
    setShowModal,

    editId,
    setEditId,

    form,
    setForm,

    submitting,
    setSubmitting,

    formError,
    setFormError,

    fetchData,
    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmit,
    handleDelete,
  };
}