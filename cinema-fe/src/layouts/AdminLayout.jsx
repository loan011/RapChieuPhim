import { Outlet, NavLink, useNavigate } from "react-router-dom";

function AdminLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    if (window.confirm("Bạn có muốn đăng xuất không?")) {
      localStorage.clear();
      navigate("/login");
    }
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div style={{ fontFamily: "Segoe UI, sans-serif" }}>
      {/* Topbar */}
      <nav style={{
        background: "#1a2035", color: "#fff",
        padding: "0 24px", height: "60px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 999
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "1.4rem" }}>🎬</span>
          <strong style={{ fontSize: "1rem" }}>T&amp;M Cinema Admin</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
            {user.email || "Admin"}
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: "#0d6efd", color: "#fff",
              border: "none", borderRadius: "8px",
              padding: "7px 16px", cursor: "pointer", fontSize: "0.85rem"
            }}
          >
            Đăng xuất
          </button>
        </div>
      </nav>

      {/* Content */}
      <div style={{ marginTop: "60px", padding: "32px 24px", background: "#f0f2f5", minHeight: "calc(100vh - 60px)" }}>
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;
