import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  MdConfirmationNumber,
  MdReceiptLong,
  MdFastfood,
  MdQrCodeScanner,
  MdMenu,
  MdLogout,
  MdLocalActivity,
  MdBarChart,
  MdPlayCircleOutline,
  MdLockOutline,
} from "react-icons/md";
import { useState, useEffect } from "react";
import { getUser } from "../services/authService";
import { getCinemaList } from "../pages/Admin/Cinema/cinemaService";
import { getMyProfile } from "../pages/Admin/Personnel/employeeService";

const navItems = [
  { to: "/staff/ban-ve", label: "Bán vé", icon: <MdLocalActivity /> },
  { to: "/staff/combo", label: "Đồ ăn", icon: <MdFastfood /> },
  { to: "/staff/quet-qr", label: "Quét QR Vé", icon: <MdQrCodeScanner /> },
  { to: "/staff/quet-qr-do-an", label: "Quét QR Đồ ăn", icon: <MdFastfood /> },
  { to: "/staff/doanh-thu", label: "Doanh thu ngày và kết ca", icon: <MdBarChart /> },
];

export default function StaffLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [branchName, setBranchName] = useState("Đang tải...");

  // Quản lý trạng thái ca làm việc
  const [shiftState, setShiftState] = useState(() => {
    try {
      const saved = localStorage.getItem("staff_shift_state");
      return saved ? JSON.parse(saved) : { status: "NOT_STARTED" };
    } catch (e) {
      return { status: "NOT_STARTED" };
    }
  });

  const [selectedShift, setSelectedShift] = useState("Ca 1 (08:00 - 16:00)");
  const [inputCash, setInputCash] = useState(500000);
  const [timeError, setTimeError] = useState("");

  const user = getUser();

  // Lắng nghe thay đổi trạng thái ca từ các tab/trang khác
  useEffect(() => {
    function handleStateUpdate() {
      try {
        const saved = localStorage.getItem("staff_shift_state");
        setShiftState(saved ? JSON.parse(saved) : { status: "NOT_STARTED" });
      } catch (e) {}
    }
    
    window.addEventListener("storage", handleStateUpdate);
    window.addEventListener("shiftStateChange", handleStateUpdate);
    
    return () => {
      window.removeEventListener("storage", handleStateUpdate);
      window.removeEventListener("shiftStateChange", handleStateUpdate);
    };
  }, []);

  useEffect(() => {
    async function loadBranchName() {
      try {
        let cId = user?.cinemaId ?? user?.CinemaId;
        
        // Nếu API thiếu cinemaId, tìm trong mappings fallback do Admin phân quyền
        if (!cId) {
          const email = user?.email ?? user?.Email;
          if (email) {
            const mappings = JSON.parse(localStorage.getItem("staff_cinema_mappings") || "{}");
            cId = mappings[email];
          }
        }

        // TỰ ĐỘNG FETCH CHI NHÁNH TỪ PROFILE NẾU VẪN KHÔNG TÌM THẤY (dành cho Staff đăng nhập ở máy mới)
        if (!cId) {
          try {
            const uData = await getMyProfile();
            cId = uData?.cinemaId ?? uData?.CinemaId;
          } catch (e) {
            console.warn("Không thể fetch profile Staff:", e);
          }
        }

        if (cId) {
          // Gắn ngược lại vào localStorage để các trang như Quản Lý Vé, Doanh Thu lọc đúng chi nhánh
          if (user && !user.cinemaId && !user.CinemaId) {
            user.cinemaId = cId;
            localStorage.setItem("user", JSON.stringify(user));
          }

          const cinemas = await getCinemaList();
          const found = cinemas.find(c => String(c.cinemaId ?? c.CinemaId ?? c.id ?? c.Id) === String(cId));
          if (found) {
            setBranchName(found.cinemaName ?? found.CinemaName ?? "T&M Cinema");
            return;
          }
        }
        setBranchName("T&M Cinema");
      } catch (e) {
        setBranchName("T&M Cinema");
      }
    }
    loadBranchName();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  }

  // Hàm kiểm tra thời gian vào ca
  function validateShiftTime(shift) {
    const now = new Date();
    const totalMinutes = now.getHours() * 60 + now.getMinutes();
    const timeStr = now.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });

    if (shift.includes("Ca 1")) {
      // Ca 1 (08:00 - 16:00): Cho phép mở từ 07:45 đến 16:00
      if (totalMinutes < 7 * 60 + 45 || totalMinutes > 16 * 60) {
        return `Không thể kích hoạt Ca 1. Ca 1 chỉ được mở từ 07:45 đến 16:00. Hiện tại: ${timeStr}.`;
      }
    } else if (shift.includes("Ca 2")) {
      // Nếu Ca 1 vẫn đang chạy (STARTED) chưa kết ca -> Không cho mở Ca 2
      const isCa1Active = shiftState?.status === "STARTED" && shiftState?.shiftName?.includes("Ca 1");
      if (isCa1Active) {
        return `Ca 1 đang hoạt động và chưa kết ca. Vui lòng kết ca Ca 1 trước khi mở Ca 2!`;
      }

      // Nếu Ca 1 đã kết ca (ENDED) -> Cho phép mở Ca 2 ngay lập tức (kể cả trễ sau 16:00)
      const ca1Ended = shiftState?.status === "ENDED" && shiftState?.shiftName?.includes("Ca 1");
      const ca1EndedFlag = localStorage.getItem("ca1_ended_at");
      if (ca1Ended || ca1EndedFlag) return null;

      // Nếu Ca 1 chưa từng mở hôm nay: Ca 2 chỉ mở từ 15:45
      if (totalMinutes < 15 * 60 + 45) {
        return `Không thể kích hoạt Ca 2. Ca 2 chỉ được mở từ 15:45 (hoặc ngay sau khi Ca 1 kết ca). Hiện tại: ${timeStr}.`;
      }
    }
    return null;
  }

  // Hàm kiểm tra xem ca hiện tại có đang trong giờ bán hàng không
  function isInShiftHours() {
    if (!shiftState?.shiftName || shiftState?.status !== "STARTED") return true;
    
    // Khi ca đã được KÍCH HOẠT (STARTED), nhân viên được phép bán hàng liên tục 
    // cho đến khi thực hiện thao tác Kết Ca (kể cả trường hợp Ca 1 tăng ca / trễ giờ qua 16:00).
    return true;
  }

  // Kích hoạt ca làm việc
  function handleStartShift() {
    const validationErr = validateShiftTime(selectedShift);
    if (validationErr) {
      setTimeError(validationErr);
      return;
    }
    setTimeError("");

    const newState = {
      status: "STARTED",
      shiftName: selectedShift,
      initialCash: Number(inputCash),
      startedAt: new Date().toISOString()
    };
    localStorage.setItem("staff_shift_state", JSON.stringify(newState));
    setShiftState(newState);
    window.dispatchEvent(new CustomEvent("shiftStateChange"));
  }

  // Khởi tạo ca mới
  function handleResetShift() {
    setTimeError("");
    const newState = { status: "NOT_STARTED" };
    localStorage.setItem("staff_shift_state", JSON.stringify(newState));
    setShiftState(newState);
    window.dispatchEvent(new CustomEvent("shiftStateChange"));
  }

  const isSalesPath = location.pathname.includes("/staff/ban-ve") || location.pathname.includes("/staff/combo");
  const inShiftHours = isInShiftHours();

  // Quyết định nội dung hiển thị trong main view
  let mainContent;
  if (isSalesPath && shiftState.status === "NOT_STARTED") {
    mainContent = (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 bg-white rounded-2xl border border-gray-200 shadow-sm max-w-xl mx-auto my-8">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-4 animate-pulse">
          <MdPlayCircleOutline style={{ fontSize: '2.5rem' }} />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Yêu Cầu Bắt Đầu Ca Làm Việc</h3>
        <p className="text-sm text-gray-500 text-center mb-6 px-4">
          Bạn cần xác nhận bắt đầu ca làm việc của mình để kích hoạt các chức năng bán vé và dịch vụ tại quầy.
        </p>

        <div className="w-full space-y-4 px-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Chọn Ca Làm Việc</label>
            <select
              value={selectedShift}
              onChange={(e) => {
                setSelectedShift(e.target.value);
                setTimeError("");
              }}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50/50 transition-all duration-200"
            >
              <option value="Ca 1 (08:00 - 16:00)">Ca 1 (08:00 - 16:00)</option>
              <option value="Ca 2 (16:00 - 24:00)">Ca 2 (16:00 - 24:00)</option>
            </select>
          </div>



          {timeError && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-semibold flex items-start gap-2">
              <span className="shrink-0">⚠️</span>
              <span>{timeError}</span>
            </div>
          )}

          <button
            onClick={handleStartShift}
            className="w-full bg-green-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-700 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-md shadow-green-200 mt-2"
          >
            Kích Hoạt & Bắt Đầu Ca
          </button>
        </div>
      </div>
    );
  } else if (isSalesPath && shiftState.status === "ENDED") {
    mainContent = (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 bg-white rounded-2xl border border-gray-200 shadow-sm max-w-xl mx-auto my-8">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
          <MdLockOutline style={{ fontSize: '2.5rem' }} />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Ca Làm Việc Đã Kết Thúc & Đã Khóa Giao Dịch</h3>
        <p className="text-sm text-gray-500 text-center mb-6 px-4">
          Bạn đã hoàn thành kết ca và gửi báo cáo cho Admin. Hệ thống đã tự động khóa các chức năng giao dịch bán hàng của ca này để bảo mật.
        </p>

        <div className="w-full space-y-4 px-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Ca đã đóng:</span>
              <span className="font-semibold text-gray-800">{shiftState.shiftName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Thời gian đóng ca:</span>
              <span className="font-semibold text-gray-800">
                {shiftState.endedAt ? new Date(shiftState.endedAt).toLocaleTimeString("vi-VN") : ""}
              </span>
            </div>
          </div>

          <button
            onClick={handleResetShift}
            style={{ color: '#ffffff', backgroundColor: '#16a34a' }}
            className="w-full text-white bg-green-600 py-3.5 rounded-xl text-base font-bold hover:bg-green-700 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-md shadow-green-200 cursor-pointer"
          >
            🔓 Mở Ca Làm Việc Mới
          </button>
        </div>
      </div>
    );
  } else if (isSalesPath && shiftState.status === "STARTED" && !inShiftHours) {
    const shiftEnd = shiftState.shiftName?.includes("Ca 1") ? "16:00" : "24:00";
    const shiftStart = shiftState.shiftName?.includes("Ca 1") ? "08:00" : "16:00";
    mainContent = (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 bg-white rounded-2xl border border-gray-200 shadow-sm max-w-xl mx-auto my-8">
        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-4">
          <MdLockOutline style={{ fontSize: '2.5rem' }} />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Ngoài Giờ Bán Vé</h3>
        <p className="text-sm text-gray-500 text-center mb-4 px-4">
          <strong>{shiftState.shiftName}</strong> chỉ được phép bán vé trong khung giờ <strong>{shiftStart} – {shiftEnd}</strong>.
        </p>
        <p className="text-sm text-gray-500 text-center px-4">
          Hiện tại ngoài giờ làm việc của ca này. Vui lòng quay lại đúng khung giờ để tiếp tục bán vé.
        </p>
        <div className="mt-6 px-6 py-3 bg-orange-50 rounded-xl border border-orange-100 text-orange-700 text-sm font-semibold">
          🕐 Giờ bán vé: {shiftStart} – {shiftEnd}
        </div>
      </div>
    );
  } else {
    mainContent = <Outlet />;
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-14"
        } bg-gray-800 text-white flex flex-col transition-all duration-200 shrink-0`}
      >
        <div className="flex items-center gap-2 px-3 py-4 border-b border-gray-700">
          <MdConfirmationNumber className="text-green-400 text-2xl shrink-0" />
          {sidebarOpen && (
            <span className="text-sm font-bold leading-tight truncate">{branchName}</span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 mx-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-green-600 text-white shadow-md shadow-green-900/30 font-bold"
                    : "text-gray-300 hover:bg-gray-700/80 active:bg-gray-700"
                }`
              }
            >
              <span className="text-xl shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => {
            if (typeof window !== "undefined" && window.innerWidth < 1024) {
              setSidebarOpen(false);
            }
            handleLogout();
          }}
          className="flex items-center gap-3 px-3 py-3 mx-1 mb-2 rounded text-sm text-gray-300 hover:bg-red-700 hover:text-white transition-colors cursor-pointer"
        >
          <MdLogout className="text-lg shrink-0" />
          {sidebarOpen && <span>Đăng xuất</span>}
        </button>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white border-b border-gray-200 flex items-center gap-3 px-4 py-3 shrink-0">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-gray-500 hover:text-gray-800"
          >
            <MdMenu className="text-2xl" />
          </button>
          <span className="text-gray-700 font-semibold text-sm">
            Hệ Thống Nhân Viên Rạp Chiếu Phim T&M - {branchName}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {mainContent}
        </main>
      </div>
    </div>
  );
}