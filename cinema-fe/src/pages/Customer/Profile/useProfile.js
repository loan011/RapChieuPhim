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
  const email = (savedUser.email || savedUser.Email || localStorage.getItem("email") || localStorage.getItem("userEmail") || "").trim().toLowerCase();
  const emailAvatarKey = email ? `user_avatar_${email}` : null;
  const savedEmailAvatar = emailAvatarKey ? localStorage.getItem(emailAvatarKey) : null;
  const savedAvatar = localStorage.getItem("avatarUrl");

  const rawAvatar =
    savedUser.avatarUrl ||
    savedUser.AvatarUrl ||
    savedEmailAvatar ||
    savedAvatar ||
    "/images/default-avatar.png";

  const finalAvatar = isValidAvatarUrl(rawAvatar)
    ? rawAvatar
    : isValidAvatarUrl(savedEmailAvatar)
    ? savedEmailAvatar
    : isValidAvatarUrl(savedAvatar)
    ? savedAvatar
    : "/images/default-avatar.png";

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

    avatarUrl: finalAvatar,
  };
}

function isValidAvatarUrl(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (
    trimmed === "" ||
    trimmed.toLowerCase() === "string" ||
    trimmed.toLowerCase() === "null" ||
    trimmed.toLowerCase() === "undefined"
  ) {
    return false;
  }
  return true;
}

export function normalizeProfileData(data) {
  const email = (data?.email || data?.Email || localStorage.getItem("userEmail") || localStorage.getItem("email") || "").trim().toLowerCase();
  const emailAvatarKey = email ? `user_avatar_${email}` : null;
  const savedEmailAvatar = emailAvatarKey ? localStorage.getItem(emailAvatarKey) : null;
  const savedAvatarUrl = localStorage.getItem("avatarUrl");
  const savedAddress = localStorage.getItem("address");

  const backendAvatar = data?.avatarUrl || data?.AvatarUrl;
  
  let finalAvatar = "/images/default-avatar.png";
  if (isValidAvatarUrl(backendAvatar)) {
    finalAvatar = backendAvatar;
  } else if (isValidAvatarUrl(savedEmailAvatar)) {
    finalAvatar = savedEmailAvatar;
  } else if (isValidAvatarUrl(savedAvatarUrl)) {
    finalAvatar = savedAvatarUrl;
  }

  return {
    fullName: data?.fullName || data?.FullName || "",
    email: data?.email || data?.Email || "",
    phone: data?.phone || data?.Phone || "",
    dateOfBirth: data?.dateOfBirth || data?.DateOfBirth || "",
    gender: data?.gender || data?.Gender || "",
    address: data?.address || data?.Address || savedAddress || "",
    avatarUrl: finalAvatar,
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
  const email = (form.email || oldUser.email || oldUser.Email || localStorage.getItem("userEmail") || "").trim().toLowerCase();

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
  if (isValidAvatarUrl(form.avatarUrl)) {
    localStorage.setItem("avatarUrl", form.avatarUrl);
    if (email) {
      localStorage.setItem(`user_avatar_${email}`, form.avatarUrl);
    }
  }
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

        const mergedUser = {
          ...data,
          fullName: userProfile.fullName,
          avatarUrl: userProfile.avatarUrl,
        };
        localStorage.setItem("user", JSON.stringify(mergedUser));
        if (isValidAvatarUrl(userProfile.avatarUrl)) {
          localStorage.setItem("avatarUrl", userProfile.avatarUrl);
          const email = (userProfile.email || "").trim().toLowerCase();
          if (email) {
            localStorage.setItem(`user_avatar_${email}`, userProfile.avatarUrl);
          }
        }
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

    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length > 10) return;
      setForm((prev) => ({
        ...prev,
        [name]: digitsOnly,
      }));
      return;
    }

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

      // Immediately save to local storage & persistent email key & notify all components
      localStorage.setItem("avatarUrl", avatarUrl);
      const oldUser = getSavedProfileUser();
      const email = (form.email || oldUser.email || oldUser.Email || localStorage.getItem("userEmail") || "").trim().toLowerCase();
      if (email) {
        localStorage.setItem(`user_avatar_${email}`, avatarUrl);
      }
      localStorage.setItem("user", JSON.stringify({ ...oldUser, avatarUrl }));
      window.dispatchEvent(new Event("avatarUpdated"));
    } catch (err) {
      setError(err.message);
    }
  }

  function handleReset() {
    setForm(initialForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      setError("Số điện thoại phải bao gồm đúng 10 chữ số.");
      return;
    }

    if (form.dateOfBirth && new Date(form.dateOfBirth) > new Date()) {
      setError("Ngày sinh không được ở tương lai.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = buildUpdateProfilePayload(form);

      const updatedData = await updateProfile(payload);

      saveProfileToLocalStorage(form, updatedData);
      window.dispatchEvent(new Event("avatarUpdated"));

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