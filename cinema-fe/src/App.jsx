import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Movies from "./pages/Movies/Movies";
import ForgotPassword from "./pages/auth/ForgotPassword";
import TicketPrice from "./pages/Ticket/TicketPrice";

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;