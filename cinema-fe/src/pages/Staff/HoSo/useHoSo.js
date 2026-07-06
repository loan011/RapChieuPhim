import { useState, useEffect } from "react";
import { fetchProfile, saveProfile, updatePassword } from "./HoSoService";

export function useHoSo() {
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStaffProfile();
  }, []);

  async function fetchStaffProfile() {
    try {
      setLoading(true);
      setError("");
      const data = await fetchProfile();
      if (data) {
        setProfileForm({
          name: data.fullName || data.FullName || data.name || data.Name || "",
          email: data.email || data.Email || "",
          phone: data.phone || data.Phone || data.phoneNumber || data.PhoneNumber || "",
        });
      }
    } catch (err) {
      console.error("Lỗi lấy profile staff:", err);
      setError(err.message || "Không thể lấy thông tin staff từ server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await saveProfile({
        fullName: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
      });
      alert("Lưu thay đổi thành công!");
    } catch (err) {
      alert(err.message || "Cập nhật thông tin thất bại!");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await updatePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
        confirmPassword: pwForm.confirmPassword,
      });
      alert("Đổi mật khẩu thành công!");
      setPwForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      alert(err.message || "Đổi mật khẩu thất bại!");
    } finally {
      setLoading(false);
    }
  }

  return {
    profileForm,
    setProfileForm,
    pwForm,
    setPwForm,
    loading,
    error,
    handleProfileSubmit,
    handlePasswordSubmit,
  };
}
