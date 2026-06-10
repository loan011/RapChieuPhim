import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function AdminPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");

    if (role !== "Admin") {
      navigate("/", { replace: true });
      return;
    }

    window.location.replace("/Admin/index.html");
  }, [navigate]);

  return <div>Đang mở Admin Panel...</div>;
}

export default AdminPage;