import { useEffect, useState, useMemo } from "react";
import {
  getEmployeeList,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "./employeeService";
import { getCinemaList } from "../Cinema/cinemaService";

export const PAGE_SIZE = 6;

export const EMPLOYEE_POSITION_OPTIONS = [
  { value: "Nhân viên trưởng", label: "Nhân viên trưởng" },
  { value: "Nhân viên bán vé", label: "Nhân viên bán vé" },
  { value: "Nhân viên kỹ thuật", label: "Nhân viên kỹ thuật" },
  { value: "Nhân viên soát vé", label: "Nhân viên soát vé" },
  { value: "Nhân viên CSKH", label: "Nhân viên CSKH" },
];

export const EMPLOYEE_STATUS_OPTIONS = [
  { value: "Đang làm việc", label: "Đang làm việc" },
  { value: "Tạm nghỉ", label: "Tạm nghỉ" },
  { value: "Nghỉ việc", label: "Nghỉ việc" },
];

export const EMPTY_EMPLOYEE_FORM = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  position: "Nhân viên bán vé",
  salary: 0,
  status: "Đang làm việc",
  cinemaId: "",
};

/* ═══════════════════════════════════════════════════════════
   PURE HELPER FUNCTIONS
═══════════════════════════════════════════════════════════ */

export function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  return [];
}

export function getEmployeeId(employee) {
  return employee?.employeeId ?? employee?.EmployeeId ?? employee?.userId ?? employee?.UserId ?? employee?.id ?? employee?.Id;
}

export function getEmployeeName(employee) {
  return employee?.fullName ?? employee?.FullName ?? employee?.name ?? employee?.Name ?? "";
}

export function getEmployeeEmail(employee) {
  return employee?.email ?? employee?.Email ?? "";
}

export function getEmployeePhone(employee) {
  return employee?.phone ?? employee?.Phone ?? "";
}

export function getEmployeePosition(employee) {
  const raw = employee?.position ?? employee?.Position ?? employee?.roleName ?? employee?.RoleName ?? "Nhân viên bán vé";
  if (raw === "Quản lý" || raw === "quản lý") {
    return "Nhân viên trưởng";
  }
  return raw;
}

export function getEmployeeSalary(employee) {
  return employee?.salary ?? employee?.Salary ?? employee?.baseSalary ?? employee?.BaseSalary ?? 0;
}

export function getEmployeeStatus(employee) {
  const rawStatus = employee?.status ?? employee?.Status ?? "";
  const isActive = employee?.isActive ?? employee?.IsActive;

  if (rawStatus === "Active" || rawStatus === "Đang làm việc" || isActive === true) {
    return "Đang làm việc";
  }
  if (rawStatus === "Resigned" || rawStatus === "Nghỉ việc") {
    return "Nghỉ việc";
  }
  return "Tạm nghỉ";
}

export function getStaffCinemaId(employee) {
  const apiCinemaId = employee?.cinemaId ?? employee?.CinemaId;
  if (apiCinemaId) return apiCinemaId;

  try {
    const mappings = JSON.parse(localStorage.getItem("staff_cinema_mappings") || "{}");
    const email = employee?.email ?? employee?.Email ?? "";
    return mappings[email] || "";
  } catch {
    return "";
  }
}

export function buildFormFromEmployee(employee) {
  return {
    fullName: getEmployeeName(employee),
    email: getEmployeeEmail(employee),
    phone: getEmployeePhone(employee),
    password: "",
    position: getEmployeePosition(employee),
    salary: getEmployeeSalary(employee),
    status: getEmployeeStatus(employee),
    cinemaId: getStaffCinemaId(employee),
  };
}

export function buildEmployeePayload(form) {
  let backendStatus = "Active";
  if (form.status === "Tạm nghỉ") {
    backendStatus = "Inactive";
  } else if (form.status === "Nghỉ việc") {
    backendStatus = "Resigned";
  }

  let apiPosition = form.position;
  if (form.position === "Nhân viên trưởng") {
    apiPosition = "Quản lý";
  }

  return {
    fullName: form.fullName.trim(),
    name: form.fullName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    password: form.password ? form.password.trim() : "",
    position: apiPosition,
    salary: Number(form.salary || 0),
    status: backendStatus,
    role: "Staff",
    roleName: "Staff",
    isActive: form.status === "Đang làm việc",
    cinemaId: form.cinemaId ? Number(form.cinemaId) : null,
  };
}

export function validateEmployeeForm(form, isNew) {
  if (!form.fullName.trim()) {
    return "Vui lòng nhập họ tên nhân viên.";
  }
  if (!form.email.trim()) {
    return "Vui lòng nhập email.";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(form.email.trim())) {
    return "Email không đúng định dạng.";
  }
  if (isNew && !form.password) {
    return "Vui lòng nhập mật khẩu.";
  }
  if (form.phone.trim()) {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(form.phone.trim())) {
      return "Số điện thoại phải gồm 10 chữ số.";
    }
  }
  return "";
}

/* ═══════════════════════════════════════════════════════════
   usePersonnel HOOK
═══════════════════════════════════════════════════════════ */

export function usePersonnel() {
  const [list, setList] = useState([]);
  const [cinemas, setCinemas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterPos, setFilterPos] = useState("");
  const [filterCinemaId, setFilterCinemaId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_EMPLOYEE_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const [empData, cinemaData] = await Promise.all([
        getEmployeeList(),
        getCinemaList().catch(() => [])
      ]);

      setList(normalizeArray(empData));
      setCinemas(normalizeArray(cinemaData));
    } catch (err) {
      console.error("Lỗi tải nhân viên:", err);
      setList([]);
      setError(err.message || "Lấy danh sách nhân viên thất bại!");
    } finally {
      setLoading(false);
    }
  }

  /* ── Stats Calculations ── */
  const totalCount = list.length;
  
  const activeCount = useMemo(() => {
    return list.filter((e) => getEmployeeStatus(e) === "Đang làm việc").length;
  }, [list]);

  const temporaryCount = useMemo(() => {
    return list.filter((e) => getEmployeeStatus(e) === "Tạm nghỉ").length;
  }, [list]);

  const resignedCount = useMemo(() => {
    return list.filter((e) => getEmployeeStatus(e) === "Nghỉ việc").length;
  }, [list]);

  /* ── Cinema Options ── */
  const cinemaOptions = useMemo(() => {
    return cinemas.map((c) => ({
      id: String(c?.cinemaId ?? c?.CinemaId ?? c?.id ?? c?.Id ?? ""),
      name: c?.cinemaName ?? c?.CinemaName ?? c?.name ?? c?.Name ?? "Chi nhánh",
    })).filter((c) => c.id);
  }, [cinemas]);

  /* ── Filter ── */
  const filtered = useMemo(() => {
    const kw = search.toLowerCase().trim();
    return list.filter((employee) => {
      const name = getEmployeeName(employee).toLowerCase();
      const email = getEmployeeEmail(employee).toLowerCase();
      const phone = getEmployeePhone(employee).toLowerCase();
      const position = getEmployeePosition(employee).toLowerCase();
      const status = getEmployeeStatus(employee).toLowerCase();
      const cinemaId = String(getStaffCinemaId(employee));

      const matchSearch =
        !kw ||
        name.includes(kw) ||
        email.includes(kw) ||
        phone.includes(kw) ||
        position.includes(kw);

      const matchPosition = filterPos ? position === filterPos.toLowerCase() : true;
      const matchCinema = filterCinemaId ? cinemaId === filterCinemaId : true;
      const matchStatus = filterStatus ? status === filterStatus.toLowerCase() : true;

      return matchSearch && matchPosition && matchCinema && matchStatus;
    });
  }, [list, search, filterPos, filterCinemaId, filterStatus]);

  /* ── Pagination ── */
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)), [filtered]);
  const safePage = useMemo(() => Math.min(page, totalPages), [page, totalPages]);
  const pageItems = useMemo(() => {
    return filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  }, [filtered, safePage]);

  /* ── Handlers ── */
  function openAddModal() {
    setEditId(null);
    setForm(EMPTY_EMPLOYEE_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(employee) {
    setEditId(getEmployeeId(employee));
    setForm(buildFormFromEmployee(employee));
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setForm(EMPTY_EMPLOYEE_FORM);
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

    const validateMessage = validateEmployeeForm(form, editId === null);
    if (validateMessage) {
      setFormError(validateMessage);
      return;
    }

    const payload = buildEmployeePayload(form);

    try {
      setSubmitting(true);

      // Save to local storage mapping fallback
      try {
        const mappings = JSON.parse(localStorage.getItem("staff_cinema_mappings") || "{}");
        const email = form.email.trim();
        if (form.cinemaId) {
          mappings[email] = Number(form.cinemaId);
        } else {
          delete mappings[email];
        }
        localStorage.setItem("staff_cinema_mappings", JSON.stringify(mappings));
      } catch (e) {
        console.error("Local storage error:", e);
      }

      if (editId !== null) {
        await updateEmployee(editId, payload);
      } else {
        await createEmployee(payload);
      }
      closeModal();
      fetchData();
    } catch (err) {
      console.error("Lỗi lưu nhân viên:", err);
      setFormError(err.message || "Lưu nhân viên thất bại!");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!id) {
      alert("Không tìm thấy ID nhân viên.");
      return;
    }
    if (!window.confirm("Bạn có chắc muốn xóa nhân viên này?")) return;

    try {
      await deleteEmployee(id);
      fetchData();
    } catch (err) {
      console.error("Lỗi xóa nhân viên:", err);
      alert(err.message || "Xóa nhân viên thất bại!");
    }
  }

  return {
    list,
    cinemas,
    loading,
    error,

    /* filters */
    search,
    setSearch,
    filterPos,
    setFilterPos,
    filterCinemaId,
    setFilterCinemaId,
    filterStatus,
    setFilterStatus,
    cinemaOptions,
    filtered,

    /* pagination */
    page,
    setPage,
    pageItems,
    totalPages,
    safePage,

    /* Stats */
    totalCount,
    activeCount,
    temporaryCount,
    resignedCount,

    /* Modal / Form */
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