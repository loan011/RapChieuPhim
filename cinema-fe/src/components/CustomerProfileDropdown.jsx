import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CustomerProfileDropdown.css";

export default function CustomerProfileDropdown() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const savedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const fullName =
    savedUser.fullName ||
    savedUser.FullName ||
    localStorage.getItem("fullName") ||
    "Customer";

  const email =
    savedUser.email ||
    savedUser.Email ||
    localStorage.getItem("email") ||
    localStorage.getItem("userEmail") ||
    "customer@gmail.com";
  const avatarUrl =
    savedUser.avatarUrl ||
    savedUser.AvatarUrl ||
    localStorage.getItem("avatarUrl") ||
    "/images/default-avatar.png";

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("email");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("fullName");
    localStorage.removeItem("avatarUrl");

    navigate("/login");
  }

  return (
    <div className="customer-profile-wrapper">
      <button
        type="button"
        className="customer-profile-btn"
        onClick={() => setOpen(!open)}
      >
        <img src={avatarUrl} alt="avatar" className="customer-avatar" />
        <span>{fullName}</span>
        <span className="profile-arrow">▾</span>
      </button>

      {open && (
        <div className="customer-profile-dropdown">
          <div className="profile-card-top">
            <img src={avatarUrl} alt="avatar" className="profile-big-avatar" />
            <h3>{fullName}</h3>
            <p>{email}</p>
          </div>

          <button
            type="button"
            className="profile-menu-item"
            onClick={() => navigate("/customer/profile")}
          >
            ⚙ Profile settings
          </button>

          <button
            type="button"
            className="profile-menu-item"
            onClick={() => navigate("/customer/profile")}
          >
            🖼 Đổi avatar
          </button>

          <button
            type="button"
            className="profile-menu-item logout"
            onClick={handleLogout}
          >
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  );
}