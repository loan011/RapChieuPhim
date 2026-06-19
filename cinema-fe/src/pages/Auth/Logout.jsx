import { useNavigate } from "react-router-dom";

function Logout() {
  const navigate = useNavigate();

  const userEmail =
    localStorage.getItem("userEmail") ||
    localStorage.getItem("email") ||
    "Customer";

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenType");
    localStorage.removeItem("expiresAt");
    localStorage.removeItem("user");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("fullName");
    localStorage.removeItem("avatarUrl");

    navigate("/login", { replace: true });
  }

  return (
    <div className="top-login">
      <span>Xin chào, {userEmail}</span>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default Logout;