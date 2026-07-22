import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";

import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Movies from "./pages/Movies/Movies";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ChangePassword from "./pages/Auth/ChangePassword";
import TicketPrice from "./pages/Ticket/TicketPrice";
import Booking from "./pages/Booking/Booking";
import Payment from "./pages/Payment/Payment.jsx";
import TicketInfo from "./pages/Ticket/TicketInfo";

import ProtectedRoute from "./components/ProtectedRoute";

import CustomerProfile from "./pages/Customer/Profile/Profile";
import VeCuaToi from "./pages/Customer/Ticket/Ticket";
import LichSuDatVe from "./pages/Customer/History/History";
import CustomerThongBao from "./pages/Customer/Notice/Notice";
import CustomerDoiMatKhau from "./pages/Customer/ChangePassword/ChangePassword";
import CustomerProfileLayout from "./layouts/CustomerProfileLayout";

import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Admin/Dashboard/Dashboard";
import UserManagement from "./pages/Admin/UserManagement/UserManagement";
import Phim from "./pages/Admin/Film/Film";
import PhongChieu from "./pages/Admin/Room/Room";
import RapChieu from "./pages/Admin/Cinema/Cinema";
import SuatChieu from "./pages/Admin/Rate/Rate";
import Ghe from "./pages/Admin/Seat/Seat";
import ThongBao from "./pages/Admin/Notice/Notice";
import Food from "./pages/Admin/Food/Food";
import BaoCao from "./pages/Admin/BaoCao/BaoCao";

import StaffLayout from "./layouts/StaffLayout";
import StaffBanVe from "./pages/Staff/BanVe/BanVe";
import StaffQuanLyVe from "./pages/Staff/QuanLyVe/QuanLyVe";
import StaffCombo from "./pages/Staff/Combo/Combo";
import StaffQuetQR from "./pages/Staff/QR/QuetQR";
import StaffQuetQRDoAn from "./pages/Staff/QuetQRDoAn/QuetQRDoAn";
import StaffHoSo from "./pages/Staff/HoSo/HoSo";
import StaffDoanhThu from "./pages/Staff/DoanhThu/DoanhThu";
import StaffQuanLyDoAn from "./pages/Staff/QuanLyDoAn/QuanLyDoAn";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />
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
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={["Customer"]}>
              <CustomerProfileLayout />
            </ProtectedRoute>
          }
        >
          <Route path="profile" element={<CustomerProfile />} />
          <Route path="ve-cua-toi" element={<VeCuaToi />} />
          <Route path="lich-su" element={<LichSuDatVe />} />
          <Route path="thong-bao" element={<CustomerThongBao />} />
          <Route path="doi-mat-khau" element={<CustomerDoiMatKhau />} />
        </Route>

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
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="quan-ly-nguoi-dung" element={<UserManagement />} />
          <Route path="phim" element={<Phim />} />
          <Route path="phong-chieu" element={<PhongChieu />} />
          <Route path="rap-chieu" element={<Navigate to="/admin/phong-chieu" replace />} />
          <Route path="suat-chieu" element={<SuatChieu />} />
          <Route path="ghe" element={<Navigate to="/admin/phong-chieu" replace />} />
          <Route path="do-an" element={<Food />} />
          <Route path="bao-cao" element={<BaoCao />} />
          <Route path="thong-bao" element={<ThongBao />} />
        </Route>

        {/* Wrong path */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;