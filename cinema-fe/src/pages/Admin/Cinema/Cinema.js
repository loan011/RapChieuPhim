import { useEffect, useState } from "react";

import {
  getCinemaList,
  createCinema,
  updateCinema,
  deleteCinema,
  getAreaList,
} from "./cinemaService";

export const CINEMA_TEXT = {
  header: {
    title: "Quản Lý Rạp Chiếu",
  },

  search: {
    placeholder: "Tìm kiếm theo tên, khu vực, địa chỉ, số điện thoại...",
  },

  table: {
    headers: [
      "#",
      "Tên Rạp",
      "Địa Chỉ",
      "Khu Vực",
      "Điện Thoại",
      "Email",
      "Trạng Thái",
      "Thao Tác",
    ],
  },

  modal: {
    addTitle: "Thêm Rạp Chiếu",
    editTitle: "Cập Nhật Rạp Chiếu",
  },

  fields: {
    cinemaName: {
      label: "Tên Rạp",
      placeholder: "Nhập tên rạp chiếu",
    },

    address: {
      label: "Địa Chỉ",
      placeholder: "Nhập địa chỉ rạp",
    },

    area: {
      label: "Khu Vực / Thành Phố",
      placeholder: "-- Chọn khu vực --",
    },

    phone: {
      label: "Điện Thoại",
      placeholder: "Số điện thoại",
    },

    email: {
      label: "Email",
      placeholder: "Email liên hệ",
    },

    status: {
      label: "Trạng Thái",
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
    loadFailed: "Lấy dữ liệu rạp chiếu thất bại!",
    saveFailed: "Lưu rạp chiếu thất bại!",
    deleteFailed: "Xóa rạp chiếu thất bại!",
    deleteConfirm: "Bạn có chắc muốn xóa rạp chiếu này?",
    cinemaNameRequired: "Vui lòng nhập tên rạp chiếu.",
    addressRequired: "Vui lòng nhập địa chỉ rạp.",
    areaRequired: "Vui lòng chọn khu vực.",
  },

  statusText: {
    Active: "Hoạt động",
    Inactive: "Ngừng HĐ",
  },

  classNames: {
    addButton:
      "bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700",

    card: "bg-white rounded-lg shadow-sm border border-gray-100 p-4",

    searchInput:
      "border border-gray-300 rounded px-3 py-1.5 text-sm w-full max-w-sm",

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

export const EMPTY_CINEMA_FORM = {
  cinemaName: "",
  address: "",
  areaId: "",
  phone: "",
  email: "",
  status: "Active",
};

export const CINEMA_STATUS_OPTIONS = [
  {
    value: "Active",
    label: "Hoạt động",
  },
  {
    value: "Inactive",
    label: "Ngừng hoạt động",
  },
];

export function getCinemaId(cinema) {
  return cinema?.cinemaId ?? cinema?.CinemaId ?? cinema?.id ?? cinema?.Id;
}

export function getCinemaName(cinema) {
  return (
    cinema?.cinemaName ??
    cinema?.CinemaName ??
    cinema?.name ??
    cinema?.Name ??
    ""
  );
}

export function getCinemaAddress(cinema) {
  return cinema?.address ?? cinema?.Address ?? "";
}

export function getCinemaPhone(cinema) {
  return cinema?.phone ?? cinema?.Phone ?? "";
}

export function getCinemaEmail(cinema) {
  return cinema?.email ?? cinema?.Email ?? "";
}

export function getCinemaStatus(cinema) {
  return cinema?.status ?? cinema?.Status ?? "";
}

export function getCinemaAreaId(cinema) {
  return (
    cinema?.areaId ??
    cinema?.AreaId ??
    cinema?.area?.areaId ??
    cinema?.area?.AreaId ??
    cinema?.Area?.areaId ??
    cinema?.Area?.AreaId ??
    ""
  );
}

export function getCinemaAreaName(cinema) {
  return (
    cinema?.areaName ??
    cinema?.AreaName ??
    cinema?.area?.areaName ??
    cinema?.area?.AreaName ??
    cinema?.Area?.areaName ??
    cinema?.Area?.AreaName ??
    cinema?.city ??
    cinema?.City ??
    ""
  );
}

export function getAreaId(area) {
  return area?.areaId ?? area?.AreaId ?? area?.id ?? area?.Id;
}

export function getAreaName(area) {
  return (
    area?.areaName ??
    area?.AreaName ??
    area?.name ??
    area?.Name ??
    "Khu vực không tên"
  );
}

export function getAreaNameById(areas, areaId) {
  const found = areas.find(
    (area) => String(getAreaId(area)) === String(areaId)
  );

  return found ? getAreaName(found) : "";
}

export function getStatusText(status) {
  return CINEMA_TEXT.statusText[status] || status || "—";
}

export function getStatusClass(status) {
  const baseClass = "px-2 py-0.5 rounded-full text-xs font-medium";

  if (status === "Active") {
    return `${baseClass} bg-green-100 text-green-700`;
  }

  if (status === "Inactive") {
    return `${baseClass} bg-red-100 text-red-600`;
  }

  return `${baseClass} bg-yellow-100 text-yellow-700`;
}

export function buildFormFromCinema(cinema) {
  return {
    cinemaName: getCinemaName(cinema),
    address: getCinemaAddress(cinema),
    areaId: String(getCinemaAreaId(cinema) || ""),
    phone: getCinemaPhone(cinema),
    email: getCinemaEmail(cinema),
    status: getCinemaStatus(cinema) || "Active",
  };
}

export function buildCinemaPayload(form, areas) {
  const areaName = getAreaNameById(areas, form.areaId);

  return {
    cinemaName: form.cinemaName.trim(),
    address: form.address.trim(),
    areaId: form.areaId ? Number(form.areaId) : null,
    areaName,
    phone: form.phone.trim(),
    email: form.email.trim(),
    status: form.status,
    isActive: form.status === "Active",
  };
}

export function filterCinemaList(list, search) {
  const keyword = search.trim().toLowerCase();

  if (!keyword) return list;

  return list.filter((cinema) => {
    const name = getCinemaName(cinema).toLowerCase();
    const address = getCinemaAddress(cinema).toLowerCase();
    const areaName = getCinemaAreaName(cinema).toLowerCase();
    const phone = getCinemaPhone(cinema).toLowerCase();
    const email = getCinemaEmail(cinema).toLowerCase();
    const status = getStatusText(getCinemaStatus(cinema)).toLowerCase();

    return (
      name.includes(keyword) ||
      address.includes(keyword) ||
      areaName.includes(keyword) ||
      phone.includes(keyword) ||
      email.includes(keyword) ||
      status.includes(keyword)
    );
  });
}

export function validateCinemaForm(form) {
  const T = CINEMA_TEXT;

  if (!form.cinemaName.trim()) {
    return T.messages.cinemaNameRequired;
  }

  if (!form.address.trim()) {
    return T.messages.addressRequired;
  }

  if (!form.areaId) {
    return T.messages.areaRequired;
  }

  return "";
}

export function useCinema() {
  const T = CINEMA_TEXT;

  const [list, setList] = useState([]);
  const [areas, setAreas] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_CINEMA_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      setLoading(true);
      setError("");

      const [cinemaData, areaData] = await Promise.all([
        getCinemaList(),
        getAreaList(),
      ]);

      setList(Array.isArray(cinemaData) ? cinemaData : []);
      setAreas(Array.isArray(areaData) ? areaData : []);
    } catch (err) {
      console.error("Lỗi tải dữ liệu rạp chiếu:", err);

      setList([]);
      setAreas([]);
      setError(err.message || T.messages.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditId(null);
    setForm(EMPTY_CINEMA_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(cinema) {
    setEditId(getCinemaId(cinema));
    setForm(buildFormFromCinema(cinema));
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setForm(EMPTY_CINEMA_FORM);
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

    const validateMessage = validateCinemaForm(form);

    if (validateMessage) {
      setFormError(validateMessage);
      return;
    }

    const payload = buildCinemaPayload(form, areas);

    try {
      setSubmitting(true);

      if (editId !== null) {
        await updateCinema(editId, payload);

        setList((prev) =>
          prev.map((cinema) =>
            String(getCinemaId(cinema)) === String(editId)
              ? {
                  ...cinema,
                  ...payload,
                }
              : cinema
          )
        );
      } else {
        const created = await createCinema(payload);

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
      console.error("Lỗi lưu rạp chiếu:", err);

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
      await deleteCinema(id);

      setList((prev) =>
        prev.filter((cinema) => String(getCinemaId(cinema)) !== String(id))
      );
    } catch (err) {
      console.error("Lỗi xóa rạp chiếu:", err);
      alert(err.message || T.messages.deleteFailed);
    }
  }

  const filtered = filterCinemaList(list, search);

  return {
    list,
    setList,

    areas,
    setAreas,

    loading,
    setLoading,

    error,
    setError,

    search,
    setSearch,

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

    filtered,

    fetchInitialData,
    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmit,
    handleDelete,
  };
}