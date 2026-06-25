import { LOGOUT_TEXT as T, useLogout } from "./logout";

function Logout() {
  const { userEmail, handleLogout } = useLogout();

  return (
    <div className="top-login">
      <span>
        {T.greeting}, {userEmail}
      </span>

      <button className="logout-btn" onClick={handleLogout}>
        {T.button.logout}
      </button>
    </div>
  );
}

export default Logout;