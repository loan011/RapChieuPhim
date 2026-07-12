import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home.jsx";

import Login from "./pages/Auth/Login.jsx";
import Register from "./pages/Auth/Register.jsx";
import Movies from "./pages/Movies/Movies.jsx";
import ForgotPassword from "./pages/Auth/ForgotPassword.jsx";
import TicketPrice from "./pages/Ticket/TicketPrice.jsx";
import Booking from "./pages/Booking/Booking.jsx";
import Payment from "./pages/Payment/Payment.jsx";

import ProtectedRoute from "./components/ProtectedRoute";

import CustomerProfile from "./pages/Customer/Profile/Profile.jsx";
import VeCuaToi from "./pages/Customer/Ticket/Ticket.jsx";
import LichSuDatVe from "./pages/Customer/History/History.jsx";
import CustomerThongBao from "./pages/Customer/Notice/Notice.jsx";

import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Admin/Dashboard/Dashboard.jsx";
import UserManagement from "./pages/Admin/UserManagement/UserManagement.jsx";
import Phim from "./pages/Admin/Film/Film.jsx";
import PhongChieu from "./pages/Admin/Room/Room.jsx";
import RapChieu from "./pages/Admin/Cinema/Cinema.jsx";
import SuatChieu from "./pages/Admin/Rate/Rate.jsx";
import AdminVe from "./pages/Admin/Ticket/Ticket.jsx";
import HoaDon from "./pages/Admin/Bill/Bill.jsx";
import Ghe from "./pages/Admin/Seat/Seat.jsx";
import ThongBao from "./pages/Admin/Notice/Notice.jsx";

import StaffLayout from "./layouts/StaffLayout";
import StaffDashboard from "./pages/Staff/Dashbord/Dashboard.jsx";
import StaffBanVe from "./pages/Staff/BanVe/BanVe.jsx";
import StaffQuanLyVe from "./pages/Staff/QuanLyVe/QuanLyVe.jsx";
import StaffCombo from "./pages/Staff/Combo/Combo.jsx";
import StaffQuetQR from "./pages/Staff/QR/QuetQR.jsx";
import StaffHoSo from "./pages/Staff/HoSo/HoSo.jsx";

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
              <Movies />
            </ProtectedRoute>
          }
        />

        <Route
          path="/movies"
          element={<Navigate to="/" replace />}
        />

        <Route
          path="/showtimes"
          element={
            <ProtectedRoute allowedRoles={["Customer"]}>
              <Home />
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
          path="/booking"
          element={
            <ProtectedRoute allowedRoles={["Customer"]}>
              <Booking />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment"
          element={
            <ProtectedRoute allowedRoles={["Customer"]}>
              <Payment />
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
              <StaffLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StaffDashboard />} />
          <Route path="ban-ve" element={<StaffBanVe />} />
          <Route path="quan-ly-ve" element={<StaffQuanLyVe />} />
          <Route path="combo" element={<StaffCombo />} />
          <Route path="quet-qr" element={<StaffQuetQR />} />
          <Route path="ho-so" element={<StaffHoSo />} />
        </Route>

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
          <Route path="quan-ly-nguoi-dung" element={<UserManagement />} />
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