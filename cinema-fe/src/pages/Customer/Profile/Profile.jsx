import { useState } from "react";
import "../../../styles/Customer/CustomerProfile.css";

export default function CustomerProfile() {
  const savedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [form, setForm] = useState({
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
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        avatarUrl: reader.result,
      }));
    };

    reader.readAsDataURL(file);
  }

  function handleSubmit(e) {
    e.preventDefault();

    const oldUser = JSON.parse(localStorage.getItem("user") || "{}");

    const updatedUser = {
      ...oldUser,
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

    alert("Cập nhật thông tin thành công!");
  }

  return (
    <div className="profile-page">
      <div className="profile-form-card">
        <h2>Thông tin cá nhân</h2>

        <div className="avatar-section">
          <img
            src={form.avatarUrl}
            alt="avatar"
            className="profile-avatar-preview"
          />

          <label className="avatar-upload-btn">
            Đổi ảnh đại diện
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              hidden
            />
          </label>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <label>Họ tên</label>
          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Nhập họ tên"
          />

          <label>Email</label>
          <input
            name="email"
            value={form.email}
            disabled
            placeholder="Email"
          />

          <label>Số điện thoại</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Nhập số điện thoại"
          />

          <label>Ngày sinh</label>
          <input
            name="dateOfBirth"
            type="date"
            value={form.dateOfBirth ? form.dateOfBirth.slice(0, 10) : ""}
            onChange={handleChange}
          />

          <label>Giới tính</label>
          <select name="gender" value={form.gender} onChange={handleChange}>
            <option value="">Chọn giới tính</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
          </select>

          <label>Địa chỉ</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Nhập địa chỉ"
          />

          <button type="submit" className="profile-save-btn">
            Lưu thông tin
          </button>
        </form>
      </div>
    </div>
  );
}