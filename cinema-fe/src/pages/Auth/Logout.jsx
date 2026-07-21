import { useLogout } from "./useLogout";

function Logout() {
  const { userEmail, handleLogout } = useLogout();

  return (
    <div className="top-login">
      <span>
        Xin chào, {userEmail}
      </span>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default Logout;