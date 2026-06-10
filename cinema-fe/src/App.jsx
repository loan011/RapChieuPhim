import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Movies from "./pages/Movies/Movies";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import TicketPrice from "./pages/Ticket/TicketPrice";
import AdminPage from "./pages/Admin/Admin";

import ProtectedRoute from "./components/ProtectedRoute";

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
        <AdminPage />
      </ProtectedRoute>
    }
  />
</Routes>
    </BrowserRouter>
  );
}

export default App;