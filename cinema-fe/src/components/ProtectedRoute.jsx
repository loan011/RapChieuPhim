import { Navigate } from "react-router-dom";

/**
 * Bảo vệ route dựa theo token và role.
 * allowedRoles: mảng role được phép, ví dụ ["Admin"] hoặc ["Admin","Staff"]
 * Nếu không truyền allowedRoles → chỉ cần đăng nhập là vào được.
 */
function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
