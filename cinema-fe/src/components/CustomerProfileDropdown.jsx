import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AvatarModal from "./AvatarModal";
import "../styles/Customer/CustomerProfileDropdown.css";

export default function CustomerProfileDropdown() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  function getUser() {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    return {
      fullName:
        savedUser.fullName ||
        savedUser.FullName ||
        localStorage.getItem("fullName") ||
        "Customer",
      email:
        savedUser.email ||
        savedUser.Email ||
        localStorage.getItem("email") ||
        localStorage.getItem("userEmail") ||
        "customer@gmail.com",
      avatarUrl:
        savedUser.avatarUrl ||
        savedUser.AvatarUrl ||
        localStorage.getItem("avatarUrl") ||
        "/images/default-avatar.png",
    };
  }

  const [userInfo, setUserInfo] = useState(getUser);

  function goTo(path) {
    setOpen(false);
    navigate(path);
  }

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

  function handleAvatarSaved(newUrl) {
    setUserInfo((prev) => ({ ...prev, avatarUrl: newUrl }));
  }

  return (
    <>
      <div className="customer-profile-wrapper">
        <button
          type="button"
          className="customer-profile-btn"
          onClick={() => setOpen(!open)}
        >
          <img
            src={userInfo.avatarUrl}
            alt="avatar"
            className="customer-avatar"
            onError={(e) =>
              (e.target.src =
                "https://ui-avatars.com/api/?name=" +
                encodeURIComponent(userInfo.fullName) +
                "&background=dc2626&color=fff&size=32")
            }
          />
          <span>{userInfo.fullName}</span>
          <span className="profile-arrow">▾</span>
        </button>

        {open && (
          <div className="customer-profile-dropdown">
            <div className="profile-card-top">
              <img
                src={userInfo.avatarUrl}
                alt="avatar"
                className="profile-big-avatar"
                onError={(e) =>
                  (e.target.src =
                    "https://ui-avatars.com/api/?name=" +
                    encodeURIComponent(userInfo.fullName) +
                    "&background=dc2626&color=fff&size=76")
                }
              />
              <h3>{userInfo.fullName}</h3>
              <p>{userInfo.email}</p>
            </div>

            <button
              type="button"
              className="profile-menu-item"
              onClick={() => goTo("/customer/profile")}
            >
              ⚙ Thông tin tài khoản
            </button>

            <button
              type="button"
              className="profile-menu-item"
              onClick={() => goTo("/customer/ve-cua-toi")}
            >
              🎫 Vé của tôi
            </button>

            <button
              type="button"
              className="profile-menu-item"
              onClick={() => goTo("/customer/lich-su")}
            >
              🕘 Lịch sử đặt vé
            </button>

            <button
              type="button"
              className="profile-menu-item"
              onClick={() => goTo("/customer/thong-bao")}
            >
              🔔 Thông báo
            </button>

            <button
              type="button"
              className="profile-menu-item"
              onClick={() => {
                setOpen(false);
                setAvatarModalOpen(true);
              }}
            >
              🖼 Đổi avatar
            </button>

            <button
              type="button"
              className="profile-menu-item logout"
              onClick={handleLogout}
            >
              🚪 Đăng xuất
            </button>
          </div>
        )}
      </div>

      {/* Avatar Modal */}
      <AvatarModal
        open={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        onSaved={handleAvatarSaved}
      />
    </>
  );
}