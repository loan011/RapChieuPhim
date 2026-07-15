import { useEffect, useState } from "react";

import {
  getCinemaList,
  createCinema,
  updateCinema,
  deleteCinema,
  getAreaList,
} from "./cinemaService";
import { getRoomList } from "../Room/roomService";
import { getEmployeeList } from "../Personnel/employeeService";

// Text configurations are now handled directly inside Cinema.jsx.

export function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  return [];
}

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
  if (status === "Active") return "Hoạt động";
  if (status === "Inactive") return "Ngừng hoạt động";
  return status || "—";
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
  if (!form.cinemaName.trim()) {
    return "Vui lòng nhập tên rạp chiếu.";
  }

  if (!form.address.trim()) {
    return "Vui lòng nhập địa chỉ rạp.";
  }

  if (!form.areaId) {
    return "Vui lòng chọn khu vực.";
  }

  return "";
}

export function useCinema() {
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

      const [cinemaData, areaData, roomData, employeeData] = await Promise.all([
        getCinemaList(),
        getAreaList(),
        getRoomList().catch(() => []),
        getEmployeeList().catch(() => []),
      ]);

      const normalizedCinemas = normalizeArray(cinemaData);
      const normalizedRooms = normalizeArray(roomData);
      const normalizedEmployees = normalizeArray(employeeData);

      const mappedCinemas = normalizedCinemas.map((c) => {
        const cId = String(c?.cinemaId ?? c?.CinemaId ?? c?.id ?? c?.Id ?? "");
        
        // Count rooms
        const rCount = normalizedRooms.filter(
          (r) => String(r?.cinemaId ?? r?.CinemaId ?? r?.cinema?.cinemaId ?? r?.cinema?.CinemaId ?? "") === cId
        ).length;

        // Count staff
        const sCount = normalizedEmployees.filter((e) => {
          const ecId = String(e?.cinemaId ?? e?.CinemaId ?? "");
          let localCId = "";
          try {
            const mappings = JSON.parse(localStorage.getItem("staff_cinema_mappings") || "{}");
            localCId = String(mappings[e?.email ?? e?.Email ?? ""] || "");
          } catch {}
          return ecId === cId || localCId === cId;
        }).length;

        // Find manager
        const manager = normalizedEmployees.find((e) => {
          const ecId = String(e?.cinemaId ?? e?.CinemaId ?? "");
          let localCId = "";
          try {
            const mappings = JSON.parse(localStorage.getItem("staff_cinema_mappings") || "{}");
            localCId = String(mappings[e?.email ?? e?.Email ?? ""] || "");
          } catch {}
          const isAtCinema = ecId === cId || localCId === cId;
          const pos = String(e?.position ?? e?.Position ?? e?.roleName ?? e?.RoleName ?? "").toLowerCase();
          return isAtCinema && (pos.includes("quản lý") || pos.includes("nhân viên trưởng"));
        });
        const mName = manager ? (manager?.fullName ?? manager?.FullName ?? manager?.name ?? manager?.Name) : "—";

        return {
          ...c,
          roomCount: rCount,
          staffCount: sCount,
          managerName: mName,
        };
      });

      setList(mappedCinemas);
      setAreas(normalizeArray(areaData));
    } catch (err) {
      console.error("Lỗi tải dữ liệu rạp chiếu:", err);
      setList([]);
      setAreas([]);
      setError(err.message || "Lấy dữ liệu rạp chiếu thất bại!");
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

  const capitalizeWords = (str) => {
    if (!str) return str;
    return str.split(' ').map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };

  function handleChange(e) {
    const { name, value } = e.target;
    
    let finalValue = value;
    if (["cinemaName", "address"].includes(name)) {
      finalValue = capitalizeWords(finalValue);
    }

    setForm((prev) => ({
      ...prev,
      [name]: finalValue,
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
      } else {
        await createCinema(payload);
      }

      closeModal();
      fetchInitialData();
    } catch (err) {
      console.error("Lỗi lưu rạp chiếu:", err);

      setFormError(err.message || "Lưu rạp chiếu thất bại!");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!id) return;

    if (!window.confirm("Bạn có chắc muốn xóa rạp chiếu này?")) {
      return;
    }

    try {
      await deleteCinema(id);

      setList((prev) =>
        prev.filter((cinema) => String(getCinemaId(cinema)) !== String(id))
      );
    } catch (err) {
      console.error("Lỗi xóa rạp chiếu:", err);
      alert(err.message || "Xóa rạp chiếu thất bại!");
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