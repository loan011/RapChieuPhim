import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home.jsx";

import Login from "./pages/Auth/Login.jsx";
import Register from "./pages/Auth/Register.jsx";
import Movies from "./pages/Movies/Movies.jsx";
import ForgotPassword from "./pages/Auth/ForgotPassword.jsx";
import TicketPrice from "./pages/Ticket/TicketPrice.jsx";
import Booking from "./pages/Booking/Booking.jsx";
import Payment from "./pages/Payment/Payment.jsx";
import TicketInfo from "./pages/Ticket/TicketInfo.jsx";

import ProtectedRoute from "./components/ProtectedRoute";

import CustomerProfile from "./pages/Customer/Profile/Profile.jsx";
import VeCuaToi from "./pages/Customer/Ticket/Ticket.jsx";
import LichSuDatVe from "./pages/Customer/History/History.jsx";
import CustomerThongBao from "./pages/Customer/Notice/Notice.jsx";

import AdminLayout from "./layouts/AdminLayout";
import UserManagement from "./pages/Admin/UserManagement/UserManagement.jsx";
import Phim from "./pages/Admin/Film/Film.jsx";
import PhongChieu from "./pages/Admin/Room/Room.jsx";
import RapChieu from "./pages/Admin/Cinema/Cinema.jsx";
import SuatChieu from "./pages/Admin/Rate/Rate.jsx";
import Ghe from "./pages/Admin/Seat/Seat.jsx";
import ThongBao from "./pages/Admin/Notice/Notice.jsx";
import Food from "./pages/Admin/Food/Food.jsx";

import StaffLayout from "./layouts/StaffLayout";
import StaffBanVe from "./pages/Staff/BanVe/BanVe.jsx";
import StaffQuanLyVe from "./pages/Staff/QuanLyVe/QuanLyVe.jsx";
import StaffCombo from "./pages/Staff/Combo/Combo.jsx";
import StaffQuetQR from "./pages/Staff/QR/QuetQR.jsx";
import StaffQuetQRDoAn from "./pages/Staff/QuetQRDoAn/QuetQRDoAn.jsx";
import StaffHoSo from "./pages/Staff/HoSo/HoSo.jsx";
import StaffDoanhThu from "./pages/Staff/DoanhThu/DoanhThu.jsx";
import StaffQuanLyDoAn from "./pages/Staff/QuanLyDoAn/QuanLyDoAn.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/ticket-info/:ticketCode" element={<TicketInfo />} />

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
          <Route index element={<Navigate to="ban-ve" replace />} />
          <Route path="ban-ve" element={<StaffBanVe />} />
          <Route path="quan-ly-ve" element={<StaffQuanLyVe />} />
          <Route path="combo" element={<StaffCombo />} />
          <Route path="quet-qr" element={<StaffQuetQR />} />
          <Route path="quet-qr-do-an" element={<StaffQuetQRDoAn />} />
          <Route path="quan-ly-do-an" element={<StaffQuanLyDoAn />} />
          <Route path="ho-so" element={<StaffHoSo />} />
          <Route path="doanh-thu" element={<StaffDoanhThu />} />
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
          <Route index element={<Navigate to="quan-ly-nguoi-dung" replace />} />
          <Route path="quan-ly-nguoi-dung" element={<UserManagement />} />
          <Route path="phim" element={<Phim />} />
          <Route path="phong-chieu" element={<PhongChieu />} />
          <Route path="rap-chieu" element={<Navigate to="/admin/phong-chieu" replace />} />
          <Route path="suat-chieu" element={<SuatChieu />} />
          <Route path="ghe" element={<Navigate to="/admin/phong-chieu" replace />} />
          <Route path="do-an" element={<Food />} />
          <Route path="thong-bao" element={<ThongBao />} />
        </Route>

        {/* Wrong path */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;