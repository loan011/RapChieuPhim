import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Movies from "./pages/Movies/Movies";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import TicketPrice from "./pages/Ticket/TicketPrice";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Admin/Dashboard/Dashboard";
import TaiKhoan from "./pages/Admin/Account/Account";
import NguoiDung from "./pages/Admin/User/User";
import NhanVien from "./pages/Admin/Personnel/Personnel";
import KhachHang from "./pages/Admin/Customer/Customer";
import Phim from "./pages/Admin/Film/Film";
import PhongChieu from "./pages/Admin/Room/Room";
import SuatChieu from "./pages/Admin/Rate/Rate";
import Ve from "./pages/Admin/Ticket/Ticket";
import HoaDon from "./pages/Admin/Bill/Bill";
import Ghe from "./pages/Admin/Seat/Seat";
import ThongBao from "./pages/Admin/Notice/Notice";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/ticket-price" element={<TicketPrice />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"   element={<Dashboard />} />
          <Route path="tai-khoan"   element={<TaiKhoan />} />
          <Route path="nguoi-dung"  element={<NguoiDung />} />
          <Route path="nhan-vien"   element={<NhanVien />} />
          <Route path="khach-hang"  element={<KhachHang />} />
          <Route path="phim"        element={<Phim />} />
          <Route path="phong-chieu" element={<PhongChieu />} />
          <Route path="suat-chieu"  element={<SuatChieu />} />
          <Route path="ve"          element={<Ve />} />
          <Route path="hoa-don"     element={<HoaDon />} />
          <Route path="ghe"         element={<Ghe />} />
          <Route path="thong-bao"   element={<ThongBao />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;