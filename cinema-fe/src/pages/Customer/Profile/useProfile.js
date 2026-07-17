import { useEffect, useRef, useState } from "react";

import {
  MdPerson,
  MdEmail,
  MdPhone,
  MdCake,
  MdWc,
  MdLocationOn,
  MdSave,
  MdRefresh,
  MdCameraAlt,
  MdCheckCircle,
  MdLock,
} from "react-icons/md";

import { getProfileCustomer, updateProfile } from "../../Admin/User/userService";

export const GENDER_OPTIONS = [
  {
    value: "",
    label: "Chọn giới tính",
  },
  {
    value: "Nam",
    label: "Nam",
  },
  {
    value: "Nữ",
    label: "Nữ",
  },
  {
    value: "Khác",
    label: "Khác",
  },
];

export const PROFILE_FIELDS = [
  {
    name: "fullName",
    label: "Họ và tên",
    type: "text",
    placeholder: "Nhập họ và tên",
    autoComplete: "name",
    Icon: MdPerson,
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "Email",
    disabled: true,
    Icon: MdEmail,
  },
  {
    name: "phone",
    label: "Số điện thoại",
    type: "tel",
    placeholder: "Nhập số điện thoại",
    Icon: MdPhone,
  },
  {
    name: "dateOfBirth",
    label: "Ngày sinh",
    type: "date",
    placeholder: "",
    Icon: MdCake,
  },
  {
    name: "gender",
    label: "Giới tính",
    type: "select",
    Icon: MdWc,
  },
  {
    name: "address",
    label: "Địa chỉ",
    type: "text",
    placeholder: "Nhập địa chỉ",
    Icon: MdLocationOn,
  },
];

export function getSavedProfileUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

export function getInitialProfileForm() {
  const savedUser = getSavedProfileUser();

  return {
    fullName:
      savedUser.fullName ||
      savedUser.FullName ||
      localStorage.getItem("fullName") ||
      "",

    email:
      savedUser.email ||
      savedUser.Email ||
      localStorage.getItem("email") ||
      localStorage.getItem("userEmail") ||
      "",

    phone:
      savedUser.phone ||
      savedUser.Phone ||
      localStorage.getItem("phone") ||
      "",

    dateOfBirth:
      savedUser.dateOfBirth ||
      savedUser.DateOfBirth ||
      localStorage.getItem("dateOfBirth") ||
      "",

    gender:
      savedUser.gender ||
      savedUser.Gender ||
      localStorage.getItem("gender") ||
      "",

    address:
      savedUser.address ||
      savedUser.Address ||
      localStorage.getItem("address") ||
      "",

    avatarUrl:
      savedUser.avatarUrl ||
      savedUser.AvatarUrl ||
      localStorage.getItem("avatarUrl") ||
      "/images/default-avatar.png",
  };
}

export function normalizeProfileData(data) {
  return {
    fullName: data?.fullName || data?.FullName || "",
    email: data?.email || data?.Email || "",
    phone: data?.phone || data?.Phone || "",
    dateOfBirth: data?.dateOfBirth || data?.DateOfBirth || "",
    gender: data?.gender || data?.Gender || "",
    address: data?.address || data?.Address || "",
    avatarUrl:
      data?.avatarUrl ||
      data?.AvatarUrl ||
      "/images/default-avatar.png",
  };
}

export function getProfileFallbackAvatar(fullName) {
  return (
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(fullName || "User") +
    "&background=dc2626&color=fff&size=100"
  );
}

export function buildUpdateProfilePayload(form) {
  return {
    fullName: form.fullName,
    email: form.email,
    phone: form.phone,
    dateOfBirth: form.dateOfBirth,
    gender: form.gender,
    address: form.address,
    avatarUrl: form.avatarUrl,
  };
}

export function saveProfileToLocalStorage(form, updatedData) {
  const oldUser = getSavedProfileUser();

  const updatedUser = {
    ...oldUser,
    ...(updatedData || {}),
    fullName: form.fullName,
    email: form.email,
    phone: form.phone,
    dateOfBirth: form.dateOfBirth,
    gender: form.gender,
    address: form.address,
    avatarUrl: form.avatarUrl,
  };

  localStorage.setItem("user", JSON.stringify(updatedUser));
  localStorage.setItem("fullName", form.fullName);
  localStorage.setItem("email", form.email);
  localStorage.setItem("phone", form.phone);
  localStorage.setItem("dateOfBirth", form.dateOfBirth);
  localStorage.setItem("gender", form.gender);
  localStorage.setItem("address", form.address);
  localStorage.setItem("avatarUrl", form.avatarUrl);
}

export function readAvatarFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error("Không thể đọc file ảnh."));
    };

    reader.readAsDataURL(file);
  });
}

export function useProfile() {
  const [initialForm, setInitialForm] = useState(getInitialProfileForm());
  const [form, setForm] = useState(initialForm);

  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      setError("");

      const data = await getProfileCustomer();

      if (data) {
        const userProfile = normalizeProfileData(data);

        setForm(userProfile);
        setInitialForm(userProfile);

        localStorage.setItem("user", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Lỗi lấy thông tin profile:", err);

      setError(err.message || "Không thể lấy thông tin cá nhân từ server.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleAvatarChange(e) {
    const file = e.target.files[0];

    if (!file) return;

    try {
      const avatarUrl = await readAvatarFile(file);

      setForm((prev) => ({
        ...prev,
        avatarUrl,
      }));
    } catch (err) {
      setError(err.message);
    }
  }

  function handleReset() {
    setForm(initialForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const payload = buildUpdateProfilePayload(form);

      const updatedData = await updateProfile(payload);

      saveProfileToLocalStorage(form, updatedData);

      setInitialForm(form);
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
      }, 2700);
    } catch (err) {
      setError(err.message || "Cập nhật thông tin cá nhân thất bại!");
    } finally {
      setLoading(false);
    }
  }

  return {
    form,
    initialForm,
    showToast,
    loading,
    error,
    fileInputRef,

    setForm,
    handleChange,
    handleAvatarChange,
    handleReset,
    handleSubmit,
    fetchProfile,
  };
}