import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import CustomerProfileDropdown from "../components/CustomerProfileDropdown";
import "../styles/Customer/CustomerProfile.css";
import "../styles/Movies.css";
import {
  MdPerson,
  MdAccessTime,
  MdConfirmationNumber,
  MdNotifications,
  MdLock,
  MdLogout
} from "react-icons/md";

export default function CustomerProfileLayout() {
  const navigate = useNavigate();

  const savedUser = (() => {
    try {
      return (
        JSON.parse(localStorage.getItem("user")) ||
        JSON.parse(localStorage.getItem("currentUser")) ||
        {}
      );
    } catch {
      return {};
    }
  })();

  const userEmail =
    savedUser.email ||
    savedUser.Email ||
    localStorage.getItem("email") ||
    localStorage.getItem("userEmail");

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
    <div className="customer-site-layout" style={{ background: "#0f1014", minHeight: "100vh" }}>
      {/* Top Header Bar */}
      <div className="movie-top-login">
        <div className="top-login-content">
          {userEmail ? (
            <CustomerProfileDropdown />
          ) : (
            <div className="auth-links">
              <Link to="/login">Đăng nhập</Link>
              <span> | </span>
              <Link to="/register">Đăng ký</Link>
            </div>
          )}
        </div>
      </div>

      <header className="movie-header">
        <div className="movie-logo-container">
          <Link to="/" className="movie-logo">
            <span>Cinemas</span><b>HCM</b>
          </Link>
        </div>

        <nav className="movie-nav">
          <Link to="/showtimes">LỊCH CHIẾU</Link>
          <Link to="/">PHIM</Link>
          <Link to="/ticket-price">GIÁ VÉ</Link>
        </nav>
      </header>

      {/* Main Container */}
      <div className="profile-page">
        <div className="profile-container">
          
          {/* SIDEBAR */}
          <div className="profile-sidebar">
            <h2 className="profile-sidebar-title">TÀI KHOẢN CỦA TÔI</h2>
            <nav className="profile-nav">
              <NavLink to="/customer/profile" end className={({ isActive }) => `profile-nav-item ${isActive ? "active" : ""}`}>
                <MdPerson /> Thông tin cá nhân
              </NavLink>
              <NavLink to="/customer/lich-su" className={({ isActive }) => `profile-nav-item ${isActive ? "active" : ""}`}>
                <MdAccessTime /> Lịch sử đặt vé
              </NavLink>
              <NavLink to="/customer/ve-cua-toi" className={({ isActive }) => `profile-nav-item ${isActive ? "active" : ""}`}>
                <MdConfirmationNumber /> Vé của tôi
              </NavLink>
              <NavLink to="/customer/thong-bao" className={({ isActive }) => `profile-nav-item ${isActive ? "active" : ""}`}>
                <MdNotifications /> Thông báo
              </NavLink>
              <NavLink to="/customer/doi-mat-khau" className={({ isActive }) => `profile-nav-item ${isActive ? "active" : ""}`}>
                <MdLock /> Đổi mật khẩu
              </NavLink>
              <button onClick={handleLogout} className="profile-nav-item">
                <MdLogout /> Đăng xuất
              </button>
            </nav>
          </div>

          {/* MAIN CONTENT OUTLET */}
          <div className="profile-wrapper">
            <Outlet />
          </div>
          
        </div>
      </div>
    </div>
  );
}
