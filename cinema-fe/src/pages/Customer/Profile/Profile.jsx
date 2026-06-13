import { useEffect, useState } from "react";
import "../../../styles/Customer/CustomerProfile.css";
import {
  getApiUrl,
  readResponse,
  getErrorMessage,
  getAuthHeaders,
} from "../../../services/apiHelper";

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
    // Load from backend profile endpoint
    async function fetchProfile() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${getApiUrl()}/api/Users/GetProfile`, {
          headers: getAuthHeaders(),
        });

        const data = await readResponse(res);
        if (!res.ok) throw new Error(getErrorMessage(data, "Lấy hồ sơ thất bại"));

        // API returns object with PascalCase keys. Normalize to camelCase and store locally.
        const normalized = {
          fullName: data.fullName || data.FullName || "",
          email: data.email || data.Email || "",
          phone: data.phone || data.Phone || "",
          dateOfBirth: data.dateOfBirth || data.DateOfBirth || "",
          gender: data.gender || data.Gender || "",
          address: data.address || data.Address || "",
          avatarUrl: data.avatarUrl || data.AvatarUrl || localStorage.getItem("avatarUrl") || "/images/default-avatar.png",
        };

        setForm(normalized);

        // keep localStorage in sync for other parts of app
        const storageUser = {
          ...normalized,
          FullName: normalized.fullName,
          Email: normalized.email,
          Phone: normalized.phone,
          DateOfBirth: normalized.dateOfBirth,
          Gender: normalized.gender,
          Address: normalized.address,
          AvatarUrl: normalized.avatarUrl,
        };
        localStorage.setItem("user", JSON.stringify(storageUser));
        localStorage.setItem("fullName", normalized.fullName);
        localStorage.setItem("email", normalized.email);
        localStorage.setItem("phone", normalized.phone);
        localStorage.setItem("dateOfBirth", normalized.dateOfBirth);
        localStorage.setItem("gender", normalized.gender);
        localStorage.setItem("address", normalized.address);
        localStorage.setItem("avatarUrl", normalized.avatarUrl);
      } catch (err) {
        setError(err.message || "Lỗi khi tải hồ sơ");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
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

    // Basic validation
    if (!form.fullName.trim()) return setError("Vui lòng nhập họ tên.");
    if (!form.phone.trim()) return setError("Vui lòng nhập số điện thoại.");
    if (!form.dateOfBirth) return setError("Vui lòng chọn ngày sinh.");

    setSaving(true);
    try {
      const payload = {
        FullName: form.fullName.trim(),
        Email: form.email.trim(),
        Phone: form.phone.trim(),
        DateOfBirth: form.dateOfBirth.slice(0, 10), // yyyy-MM-dd
        Gender: form.gender || null,
      };

      const res = await fetch(`${getApiUrl()}/api/Users/UpdateProfile`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await readResponse(res);
      if (!res.ok) throw new Error(getErrorMessage(data, "Cập nhật thất bại"));

      // Update localStorage and UI
      const updatedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const merged = {
        ...updatedUser,
        fullName: form.fullName,
        FullName: form.fullName,
        phone: form.phone,
        Phone: form.phone,
        dateOfBirth: form.dateOfBirth,
        DateOfBirth: form.dateOfBirth,
        gender: form.gender,
        Gender: form.gender,
        address: form.address,
        Address: form.address,
        avatarUrl: form.avatarUrl,
        AvatarUrl: form.avatarUrl,
      };
      localStorage.setItem("user", JSON.stringify(merged));
      localStorage.setItem("fullName", form.fullName);
      localStorage.setItem("phone", form.phone);
      localStorage.setItem("dateOfBirth", form.dateOfBirth);
      localStorage.setItem("gender", form.gender);
      localStorage.setItem("address", form.address);
      localStorage.setItem("avatarUrl", form.avatarUrl);

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
        <h2>Thông tin cá nhân</h2>

        {loading ? (
          <p>Đang tải hồ sơ...</p>
        ) : (
          <>
            <div className="avatar-section">
              <img src={form.avatarUrl} alt="avatar" className="profile-avatar-preview" />

              <label className="avatar-upload-btn">
                Đổi ảnh đại diện
                <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
              </label>
            </div>

            <form onSubmit={handleSubmit} className="profile-form">
              {error && <div className="form-error">{error}</div>}
              {success && <div className="form-success">{success}</div>}

              <label>Họ tên</label>
              <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Nhập họ tên" />

              <label>Email</label>
              <input name="email" value={form.email} disabled placeholder="Email" />

              <label>Số điện thoại</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="Nhập số điện thoại" />

              <label>Ngày sinh</label>
              <input name="dateOfBirth" type="date" value={form.dateOfBirth ? form.dateOfBirth.slice(0, 10) : ""} onChange={handleChange} />

              <label>Giới tính</label>
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option value="">Chọn giới tính</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>

              <label>Địa chỉ</label>
              <input name="address" value={form.address} onChange={handleChange} placeholder="Nhập địa chỉ" />

              <button type="submit" className="profile-save-btn" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu thông tin"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}