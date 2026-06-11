import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Trang Admin - chuyển hướng sang Admin Panel HTML (index.html ở root).
 * Chạy trong cùng origin nên dùng window.location.
 */
function AdminPage() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  useEffect(() => {
    if (role !== "Admin") {
      navigate("/", { replace: true });
      return;
    }
    // Admin panel là file tĩnh HTML ở thư mục gốc
    window.location.href = "/admin-panel/index.html";
  }, [role, navigate]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      fontFamily: "Segoe UI, sans-serif",
      background: "#f0f2f5"
    }}>
      <div style={{
        background: "#fff",
        padding: "40px 60px",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        textAlign: "center"
      }}>
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🎬</div>
        <h2 style={{ color: "#1a2035", marginBottom: "8px" }}>Đang mở Admin Panel...</h2>
        <p style={{ color: "#6b7280", marginBottom: "24px" }}>
          Đang chuyển hướng sang trang quản trị
        </p>
        <div style={{
          width: "40px", height: "40px",
          border: "4px solid #e2e8f0",
          borderTop: "4px solid #0d6efd",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto"
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ marginTop: "24px" }}>
          <button
            onClick={() => window.location.href = "/admin-panel/index.html"}
            style={{
              background: "#0d6efd", color: "#fff", border: "none",
              padding: "10px 24px", borderRadius: "8px",
              cursor: "pointer", fontSize: "0.9rem"
            }}
          >
            Mở ngay
          </button>
        </p>
      </div>
    </div>
  );
}

export default AdminPage;
