import { useNavigate } from "react-router-dom";

function Logout() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");

  function handleLogout() {
    localStorage.removeItem("userEmail");
    navigate("/");
    window.location.reload();
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