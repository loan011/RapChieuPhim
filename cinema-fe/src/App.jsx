import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Chatbot from "./components/Chatbot";

// Lazy-loaded Public / Customer pages
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Auth/Login"));
const Register = lazy(() => import("./pages/Auth/Register"));
const Movies = lazy(() => import("./pages/Movies/Movies"));
const ForgotPassword = lazy(() => import("./pages/Auth/ForgotPassword"));
const ChangePassword = lazy(() => import("./pages/Auth/ChangePassword"));
const TicketPrice = lazy(() => import("./pages/Ticket/TicketPrice"));
const Booking = lazy(() => import("./pages/Booking/Booking"));
const Payment = lazy(() => import("./pages/Payment/Payment.jsx"));
const TicketInfo = lazy(() => import("./pages/Ticket/TicketInfo"));

// Lazy-loaded Customer Profile pages
const CustomerProfile = lazy(() => import("./pages/Customer/Profile/Profile"));
const VeCuaToi = lazy(() => import("./pages/Customer/Ticket/Ticket"));
const LichSuDatVe = lazy(() => import("./pages/Customer/History/History"));
const CustomerThongBao = lazy(() => import("./pages/Customer/Notice/Notice"));
const CustomerDoiMatKhau = lazy(() => import("./pages/Customer/ChangePassword/ChangePassword"));
const CustomerProfileLayout = lazy(() => import("./layouts/CustomerProfileLayout"));

// Lazy-loaded Admin pages
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const Dashboard = lazy(() => import("./pages/Admin/Dashboard/Dashboard"));
const UserManagement = lazy(() => import("./pages/Admin/UserManagement/UserManagement"));
const Phim = lazy(() => import("./pages/Admin/Film/Film"));
const PhongChieu = lazy(() => import("./pages/Admin/Room/Room"));
const SuatChieu = lazy(() => import("./pages/Admin/Rate/Rate"));
const ThongBao = lazy(() => import("./pages/Admin/Notice/Notice"));
const Food = lazy(() => import("./pages/Admin/Food/Food"));
const BaoCao = lazy(() => import("./pages/Admin/BaoCao/BaoCao"));
const Discount = lazy(() => import("./pages/Admin/Discount/Discount"));
const StudentVerification = lazy(() => import("./pages/Admin/StudentVerification/StudentVerification"));

// Lazy-loaded Staff pages
const StaffLayout = lazy(() => import("./layouts/StaffLayout"));
const StaffBanVe = lazy(() => import("./pages/Staff/BanVe/BanVe"));
const StaffQuanLyVe = lazy(() => import("./pages/Staff/QuanLyVe/QuanLyVe"));
const StaffCombo = lazy(() => import("./pages/Staff/Combo/Combo"));
const StaffQuetQR = lazy(() => import("./pages/Staff/QR/QuetQR"));
const StaffQuetQRDoAn = lazy(() => import("./pages/Staff/QuetQRDoAn/QuetQRDoAn"));
const StaffHoSo = lazy(() => import("./pages/Staff/HoSo/HoSo"));
const StaffDoanhThu = lazy(() => import("./pages/Staff/DoanhThu/DoanhThu"));
const StaffQuanLyDoAn = lazy(() => import("./pages/Staff/QuanLyDoAn/QuanLyDoAn"));

function LoadingFallback() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#0d0d0f",
      color: "#ffffff"
    }}>
      <div style={{
        width: "48px",
        height: "48px",
        border: "4px solid rgba(229, 9, 20, 0.2)",
        borderTop: "4px solid #e50914",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
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
            <Route path="ma-giam-gia" element={<Discount />} />
            <Route path="do-an" element={<Food />} />
            <Route path="bao-cao" element={<BaoCao />} />
            <Route path="thong-bao" element={<ThongBao />} />
            <Route path="xac-minh-sinh-vien" element={<StudentVerification />} />
          </Route>

          {/* Wrong path */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Chatbot />
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
