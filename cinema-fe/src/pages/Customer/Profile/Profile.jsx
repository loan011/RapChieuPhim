import { useEffect, useState } from "react";
import "../../../styles/Customer/CustomerProfile.css";
import {
  fetchCustomerProfile,
  updateCustomerProfile,
} from "../customerService";
import ProfileAvatar from "./ProfileAvatar";
import ProfileForm from "./ProfileForm";
import ProfileHeader from "./ProfileHeader";

export default function CustomerProfile() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    avatarUrl: "/images/default-avatar.png",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        const profile = await fetchCustomerProfile();
        setForm(profile);
      } catch (err) {
        setError(err.message || "Lỗi khi tải hồ sơ");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, avatarUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.fullName.trim()) return setError("Vui lòng nhập họ tên.");
    if (!form.phone.trim()) return setError("Vui lòng nhập số điện thoại.");
    if (!form.dateOfBirth) return setError("Vui lòng chọn ngày sinh.");

    setSaving(true);
    try {
      const data = await updateCustomerProfile(form);
      setSuccess(data?.message || "Cập nhật hồ sơ thành công.");
    } catch (err) {
      setError(err.message || "Lỗi khi cập nhật");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-form-card">
        <ProfileHeader title="Thông tin cá nhân" />

        {loading ? (
          <p>Đang tải hồ sơ...</p>
        ) : (
          <>
            <ProfileAvatar avatarUrl={form.avatarUrl} onAvatarChange={handleAvatarChange} />
            <ProfileForm
              form={form}
              error={error}
              success={success}
              saving={saving}
              onChange={handleChange}
              onSubmit={handleSubmit}
            />
          </>
        )}
      </div>
    </div>
  );
}