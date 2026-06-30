import { useEffect, useState } from "react";

import {
  getEmployeeList,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "./employeeService";



import { getCinemaList } from "../Cinema/cinemaService";

export const EMPLOYEE_POSITION_OPTIONS = [
  {
    value: "Thu ngân",
    label: "Thu ngân",
  },
  {
    value: "Bảo vệ",
    label: "Bảo vệ",
  },
  {
    value: "Nhân viên chiếu phim",
    label: "Nhân viên chiếu phim",
  },
  {
    value: "Quản lý",
    label: "Quản lý",
  },
];

export const EMPLOYEE_STATUS_OPTIONS = [
  {
    value: "Active",
    label: "Hoạt động",
  },
  {
    value: "Inactive",
    label: "Ngừng hoạt động",
  },
];

export const EMPTY_EMPLOYEE_FORM = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  position: "Thu ngân",
  salary: 0,
  status: "Active",
  cinemaId: "",
};

export function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;

  return [];
}

export function getEmployeeId(employee) {
  return (
    employee?.employeeId ??
    employee?.EmployeeId ??
    employee?.userId ??
    employee?.UserId ??
    employee?.id ??
    employee?.Id
  );
}

export function getEmployeeName(employee) {
  return (
    employee?.fullName ??
    employee?.FullName ??
    employee?.name ??
    employee?.Name ??
    ""
  );
}

export function getEmployeeEmail(employee) {
  return employee?.email ?? employee?.Email ?? "";
}

export function getEmployeePhone(employee) {
  return employee?.phone ?? employee?.Phone ?? "";
}

export function getEmployeePosition(employee) {
  return (
    employee?.position ??
    employee?.Position ??
    employee?.roleName ??
    employee?.RoleName ??
    "Nhân viên"
  );
}

export function getEmployeeSalary(employee) {
  return (
    employee?.salary ??
    employee?.Salary ??
    employee?.baseSalary ??
    employee?.BaseSalary ??
    0
  );
}

export function getEmployeeStatus(employee) {
  const status =
    employee?.status ??
    employee?.Status ??
    employee?.isActive ??
    employee?.IsActive;

  if (status === true) return "Active";
  if (status === false) return "Inactive";

  return status || "Active";
}

export function getStatusText(status) {
  const map = {
    Active: "Hoạt động",
    Inactive: "Ngừng hoạt động",
  };

  return map[status] || status || "—";
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
  return {
    fullName: form.fullName.trim(),
    name: form.fullName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    password: form.password ? form.password.trim() : "",
    position: form.position,
    salary: Number(form.salary || 0),
    status: form.status,
    role: "Staff",
    roleName: "Staff",
    isActive: form.status === "Active",
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

export function filterEmployeeList(list, search, filterPos) {
  const keyword = search.trim().toLowerCase();

  return list.filter((employee) => {
    const name = getEmployeeName(employee).toLowerCase();
    const email = getEmployeeEmail(employee).toLowerCase();
    const phone = getEmployeePhone(employee).toLowerCase();
    const position = getEmployeePosition(employee);
    const positionLower = position.toLowerCase();

    const matchSearch =
      !keyword ||
      name.includes(keyword) ||
      email.includes(keyword) ||
      phone.includes(keyword) ||
      positionLower.includes(keyword);

    const matchPosition = filterPos ? position === filterPos : true;

    return matchSearch && matchPosition;
  });
}

export function usePersonnel() {
  const [list, setList] = useState([]);
  const [cinemas, setCinemas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterPos, setFilterPos] = useState("");

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

        setList((prev) =>
          prev.map((employee) =>
            String(getEmployeeId(employee)) === String(editId)
              ? {
                  ...employee,
                  ...payload,
                }
              : employee
          )
        );
      } else {
        const created = await createEmployee(payload);

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

    if (!window.confirm("Bạn có chắc muốn xóa nhân viên này?")) {
      return;
    }

    try {
      await deleteEmployee(id);

      setList((prev) =>
        prev.filter((employee) => String(getEmployeeId(employee)) !== String(id))
      );
    } catch (err) {
      console.error("Lỗi xóa nhân viên:", err);

      alert(err.message || "Xóa nhân viên thất bại!");
    }
  }

  const filtered = filterEmployeeList(list, search, filterPos);

  return {
    list,
    setList,
    cinemas,

    loading,
    setLoading,

    error,
    setError,

    search,
    setSearch,

    filterPos,
    setFilterPos,

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