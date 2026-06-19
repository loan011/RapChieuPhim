import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Movies from "./pages/Movies/Movies.jsx";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import TicketPrice from "./pages/Ticket/TicketPrice";
import Cinema from "./pages/Cinema/Cinema";
import Booking from "./pages/Booking/Booking";

import ProtectedRoute from "./components/ProtectedRoute";

import CustomerProfile from "./pages/Customer/Profile/Profile";
import VeCuaToi from "./pages/Customer/Ticket/Ticket";
import LichSuDatVe from "./pages/Customer/History/History";
import CustomerThongBao from "./pages/Customer/Notice/Notice";

import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Admin/Dashboard/Dashboard";
import TaiKhoan from "./pages/Admin/Account/Account";
import NguoiDung from "./pages/Admin/User/User";
import NhanVien from "./pages/Admin/Personnel/Personnel";
import KhachHang from "./pages/Admin/Customer/Customer";
import Phim from "./pages/Admin/Film/Film";
import PhongChieu from "./pages/Admin/Room/Room";
import RapChieu from "./pages/Admin/Cinema/Cinema";
import SuatChieu from "./pages/Admin/Rate/Rate";
import AdminVe from "./pages/Admin/Ticket/Ticket";
import HoaDon from "./pages/Admin/Bill/Bill";
import Ghe from "./pages/Admin/Seat/Seat";
import ThongBao from "./pages/Admin/Notice/Notice";

function StaffPage() {
  return (
    <div style={{ padding: "40px" }}>
      <h1>Staff Page</h1>
      <p>Đây là trang dành riêng cho Staff.</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Customer routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["Customer"]}>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/movies"
          element={
            <ProtectedRoute allowedRoles={["Customer"]}>
              <Movies />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ticket-price"
          element={
            <ProtectedRoute allowedRoles={["Customer"]}>
              <TicketPrice />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cinema"
          element={
            <ProtectedRoute allowedRoles={["Customer"]}>
              <Cinema />
            </ProtectedRoute>
          }
        />

        <Route
          path="/booking"
          element={
            <ProtectedRoute allowedRoles={["Customer"]}>
              <Booking />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/profile"
          element={
            <ProtectedRoute allowedRoles={["Customer"]}>
              <CustomerProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/ve-cua-toi"
          element={
            <ProtectedRoute allowedRoles={["Customer"]}>
              <VeCuaToi />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/lich-su"
          element={
            <ProtectedRoute allowedRoles={["Customer"]}>
              <LichSuDatVe />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/thong-bao"
          element={
            <ProtectedRoute allowedRoles={["Customer"]}>
              <CustomerThongBao />
            </ProtectedRoute>
          }
        />

        {/* Staff routes */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={["Staff"]}>
              <StaffPage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tai-khoan" element={<TaiKhoan />} />
          <Route path="nguoi-dung" element={<NguoiDung />} />
          <Route path="nhan-vien" element={<NhanVien />} />
          <Route path="khach-hang" element={<KhachHang />} />
          <Route path="phim" element={<Phim />} />
          <Route path="phong-chieu" element={<PhongChieu />} />
          <Route path="rap-chieu" element={<RapChieu />} />
          <Route path="suat-chieu" element={<SuatChieu />} />
          <Route path="ve" element={<AdminVe />} />
          <Route path="hoa-don" element={<HoaDon />} />
          <Route path="ghe" element={<Ghe />} />
          <Route path="thong-bao" element={<ThongBao />} />
        </Route>

        {/* Wrong path */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;