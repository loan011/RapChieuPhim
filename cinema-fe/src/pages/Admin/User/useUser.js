import { useEffect, useState } from "react";
import { getUserList, createUser, updateUser, deleteUser } from "./userService";

export const ROLE_OPTIONS = ["Admin", "Staff", "Customer"];

export const EMPTY_FORM = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  dateOfBirth: "",
  gender: "Nam",
  address: "",
  roleName: "Customer",
  isActive: true,
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

export function getUserId(user) {
  return user.userId ?? user.UserId ?? user.id ?? user.Id;
}

export function getFullName(user) {
  return (
    user?.fullName ??
    user?.FullName ??
    user?.userName ??
    user?.UserName ??
    user?.username ??
    user?.Username ??
    "Chưa có tên"
  );
}

export function getEmail(user) {
  return user?.email ?? user?.Email ?? "Chưa có email";
}

export function getPhone(user) {
  return user?.phone ?? user?.Phone ?? "Chưa có SĐT";
}

export function getDateOfBirth(user) {
  const value = user?.dateOfBirth ?? user?.DateOfBirth;

  if (!value) return "Chưa có";

  return String(value).split("T")[0];
}

export function getGender(user) {
  return user?.gender ?? user?.Gender ?? "Chưa có";
}

export function getAddress(user) {
  return user?.address ?? user?.Address ?? "Chưa có";
}

export function getRewardPoint(user) {
  return user?.rewardPoint ?? user?.RewardPoint ?? 0;
}

export function getMembershipLevel(user) {
  return user?.membershipLevel ?? user?.MembershipLevel ?? "Chưa có";
}

export function getRole(user) {
  return user?.role ?? user?.Role ?? user?.roleName ?? user?.RoleName ?? "Chưa có";
}

export function getStatus(user) {
  const isActive = user?.isActive ?? user?.IsActive;

  if (isActive === true || isActive === 1) return "Hoạt động";
  if (isActive === false || isActive === 0) return "Ngừng hoạt động";

  return user?.status ?? user?.Status ?? "Chưa có";
}

export function getCreatedAt(user) {
  const value = user?.createdAt ?? user?.CreatedAt;

  if (!value) return "Chưa có";

  return String(value).replace("T", " ").slice(0, 19);
}

export function useUser() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const data = await getUserList();

      console.log("USER API DATA:", data);

      setList(normalizeArray(data));
    } catch (err) {
      console.error("Lỗi tải người dùng:", err);
      setError(err?.message || "Không tải được danh sách người dùng.");
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditId(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(user) {
    setEditId(getUserId(user));

    setFormData({
      fullName: getFullName(user) === "Chưa có tên" ? "" : getFullName(user),
      email: getEmail(user) === "Chưa có email" ? "" : getEmail(user),
      password: "",
      confirmPassword: "",
      phone: getPhone(user) === "Chưa có SĐT" ? "" : getPhone(user),
      dateOfBirth: getDateOfBirth(user) === "Chưa có" ? "" : getDateOfBirth(user),
      gender: getGender(user) === "Chưa có" ? "Nam" : getGender(user),
      address: getAddress(user) === "Chưa có" ? "" : getAddress(user),
      roleName: getRole(user) === "Chưa có" ? "Customer" : getRole(user),
      isActive:
        user?.isActive ??
        user?.IsActive ??
        true,
      rewardPoint: getRewardPoint(user),
      membershipLevel:
        getMembershipLevel(user) === "Chưa có"
          ? ""
          : getMembershipLevel(user),
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

    if (!formData.fullName.trim()) {
      setFormError("Vui lòng nhập họ tên.");
      return;
    }

    if (!formData.email.trim()) {
      setFormError("Vui lòng nhập email.");
      return;
    }

    if (!formData.phone.trim()) {
      setFormError("Vui lòng nhập số điện thoại.");
      return;
    }

    if (!formData.dateOfBirth) {
      setFormError("Vui lòng chọn ngày sinh.");
      return;
    }

    if (editId === null) {
      if (!formData.password.trim()) {
        setFormError("Vui lòng nhập mật khẩu.");
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setFormError("Mật khẩu xác nhận không khớp.");
        return;
      }
    }

    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setFormError("Mật khẩu xác nhận không khớp.");
        return;
      }
    }

    const payload = {
      userId: editId ?? 0,
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      address: formData.address.trim(),
      rewardPoint: Number(formData.rewardPoint) || 0,
      membershipLevel: formData.membershipLevel || null,
      role: formData.roleName,
      roleName: formData.roleName,
      isActive: formData.isActive === true || formData.isActive === "true",
    };

    if (formData.password) {
      payload.password = formData.password;
      payload.confirmPassword = formData.confirmPassword;
    }

    try {
      setFormLoading(true);

      if (editId !== null) {
        await updateUser(editId, payload);
      } else {
        await createUser(payload);
      }

      closeModal();
      fetchData();
    } catch (err) {
      console.error("Lỗi lưu người dùng:", err);
      setFormError(err?.message || "Lưu người dùng thất bại.");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Bạn có chắc muốn xóa người dùng này?")) return;

    try {
      await deleteUser(id);
      fetchData();
    } catch (err) {
      alert(err?.message || "Xóa người dùng thất bại.");
    }
  }

  const filtered = list.filter((user) => {
    const keyword = search.toLowerCase().trim();

    const fullName = getFullName(user).toLowerCase();
    const email = getEmail(user).toLowerCase();
    const phone = getPhone(user).toLowerCase();
    const role = getRole(user);

    const matchSearch =
      fullName.includes(keyword) ||
      email.includes(keyword) ||
      phone.includes(keyword);

    const matchRole = filterRole ? role === filterRole : true;

    return matchSearch && matchRole;
  });

  return {
    list,
    loading,
    error,
    search,
    setSearch,
    filterRole,
    setFilterRole,
    showModal,
    editId,
    formData,
    setFormData,
    formError,
    formLoading,
    filtered,

    fetchData,
    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmitForm,
    handleDelete,
  };
}
