import { useState, useRef, useEffect } from "react";
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
import "../../../styles/Customer/CustomerProfile.css";
import { getProfileCustomer, updateProfile } from "../../Admin/User/userService";

export default function CustomerProfile() {
  const savedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const initialForm = {
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

  const [form, setForm] = useState(initialForm);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        setError("");
        const data = await getProfileCustomer();
        if (data) {
          const userProfile = {
            fullName: data.fullName || data.FullName || "",
            email: data.email || data.Email || "",
            phone: data.phone || data.Phone || "",
            dateOfBirth: data.dateOfBirth || data.DateOfBirth || "",
            gender: data.gender || data.Gender || "",
            address: data.address || data.Address || "",
            avatarUrl: data.avatarUrl || data.AvatarUrl || "/images/default-avatar.png",
          };
          setForm(userProfile);
          localStorage.setItem("user", JSON.stringify(data));
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin profile:", err);
        setError(err.message || "Không thể lấy thông tin cá nhân từ server.");
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
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, avatarUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  }

  function handleReset() {
    setForm(initialForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const updatedData = await updateProfile({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        address: form.address,
        avatarUrl: form.avatarUrl,
      });

      const oldUser = JSON.parse(localStorage.getItem("user") || "{}");
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

      setShowToast(true);
      setTimeout(() => setShowToast(false), 2700);
    } catch (err) {
      setError(err.message || "Cập nhật thông tin cá nhân thất bại!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-wrapper">
        {/* Header */}
        <div className="profile-header">
          <h1>Thông tin cá nhân</h1>
          <p>Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
        </div>

        {/* Main Card */}
        <div className="profile-card">
          {/* Banner */}
          <div className="profile-card-banner" />

          {/* Body */}
          <div className="profile-card-body">
            {/* Avatar Section */}
            <div className="profile-avatar-section">
              <div className="profile-avatar-wrapper">
                <img
                  src={form.avatarUrl}
                  alt="Avatar"
                  className="profile-avatar-img"
                  onError={(e) =>
                    (e.target.src =
                      "https://ui-avatars.com/api/?name=" +
                      encodeURIComponent(form.fullName || "User") +
                      "&background=dc2626&color=fff&size=100")
                  }
                />
                <label
                  className="profile-avatar-overlay"
                  htmlFor="avatarFileInput"
                >
                  <MdCameraAlt />
                </label>
                <input
                  id="avatarFileInput"
                  type="file"
                  accept="image/*"
                  className="avatar-file-input"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                />
              </div>
              <div className="profile-avatar-info">
                <p className="profile-avatar-name">
                  {form.fullName || "Người dùng"}
                </p>
                <p className="profile-avatar-email">{form.email}</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="profile-form">
              {error && (
                <div style={{ color: "#fca5a5", fontSize: "0.85rem", background: "rgba(220, 38, 38, 0.15)", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(220, 38, 38, 0.3)", display: "flex", gap: "8px", alignItems: "center" }}>
                  <span>⚠️</span> {error}
                </div>
              )}
              {/* Section: Thông tin cơ bản */}
              <div className="profile-section-label">Thông tin cơ bản</div>

              <div className="profile-form-grid">
                {/* Họ tên */}
                <div className="profile-field">
                  <label>
                    <MdPerson />
                    Họ và tên
                  </label>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên"
                    autoComplete="name"
                  />
                </div>

                {/* Email */}
                <div className="profile-field">
                  <label>
                    <MdEmail />
                    Email
                    <span className="profile-disabled-badge">
                      <MdLock style={{ fontSize: "0.65rem" }} />
                      Không thể sửa
                    </span>
                  </label>
                  <input
                    name="email"
                    value={form.email}
                    disabled
                    placeholder="Email"
                  />
                </div>

                {/* Số điện thoại */}
                <div className="profile-field">
                  <label>
                    <MdPhone />
                    Số điện thoại
                  </label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                    type="tel"
                  />
                </div>

                {/* Ngày sinh */}
                <div className="profile-field">
                  <label>
                    <MdCake />
                    Ngày sinh
                  </label>
                  <input
                    name="dateOfBirth"
                    type="date"
                    value={form.dateOfBirth ? form.dateOfBirth.slice(0, 10) : ""}
                    onChange={handleChange}
                  />
                </div>

                {/* Giới tính */}
                <div className="profile-field">
                  <label>
                    <MdWc />
                    Giới tính
                  </label>
                  <select name="gender" value={form.gender} onChange={handleChange}>
                    <option value="">Chọn giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                {/* Địa chỉ */}
                <div className="profile-field">
                  <label>
                    <MdLocationOn />
                    Địa chỉ
                  </label>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="profile-form-actions">
                <button
                  type="button"
                  className="profile-reset-btn"
                  onClick={handleReset}
                >
                  <MdRefresh style={{ marginRight: 4, verticalAlign: "middle" }} />
                  Đặt lại
                </button>
                <button type="submit" className="profile-save-btn" disabled={loading}>
                  <MdSave />
                  {loading ? "Đang lưu..." : "Lưu thông tin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="profile-toast">
          <MdCheckCircle style={{ fontSize: "1.2rem" }} />
          Cập nhật thông tin thành công!
        </div>
      )}
    </div>
  );
}