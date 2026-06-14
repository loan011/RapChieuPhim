// ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    if (user.role === "Admin") return <Navigate to="/admin" replace />;
    if (user.role === "Staff") return <Navigate to="/staff" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}