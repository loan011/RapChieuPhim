import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import "./QuetQR.css";
import { useQuetQR } from "./useQuetQR.js";
import { MdQrCodeScanner, MdCameraAlt, MdCheckCircle, MdError, MdWarning, MdArrowForward } from "react-icons/md";

export default function StaffQuetQR() {
  const {
    ticketCode,
    setTicketCode,
    ticketDetails,
    loading,
    statusMessage,
    setStatusMessage,
    handleFindTicket,
    handleCheckIn,
    handleSimulateScan,
  } = useQuetQR();

  const [facingMode, setFacingMode] = useState("user"); // Mặc định cam trước (user) theo yêu cầu
  const html5QrCodeRef = useRef(null);
  const lastScanTimeRef = useRef(0);
  const lastScanCodeRef = useRef("");

  // Tự động mở camera quét khi tải trang
  useEffect(() => {
    startScanner();

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(err => console.error("Error stopping scanner on unmount:", err));
      }
    };
  }, []);

  async function startScanner() {
    // Đợi phần tử DOM #reader được gắn vào cây DOM
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader");
        html5QrCodeRef.current = html5QrCode;
        
        const config = { 
          fps: 15
        };
        
        await html5QrCode.start(
          { facingMode: facingMode },
          config,
          (decodedText) => {
            // Khi quét thành công QR
            const now = Date.now();
            if (decodedText === lastScanCodeRef.current && now - lastScanTimeRef.current < 3000) {
              return; // Cooldown 3 giây cho cùng 1 mã QR
            }
            lastScanCodeRef.current = decodedText;
            lastScanTimeRef.current = now;

            console.log("QR Code Scanned:", decodedText);
            
            // Tự động bóc tách mã vé sạch sẽ
            let cleanCode = decodedText.trim();
            if (cleanCode.includes("/ticket-info/")) {
              const parts = cleanCode.split("/ticket-info/");
              cleanCode = parts[parts.length - 1];
            } else if (cleanCode.includes("data=VE:")) {
              const match = cleanCode.match(/data=VE:([^|&]+)/);
              if (match) cleanCode = match[1];
            } else if (cleanCode.startsWith("VE:")) {
              const match = cleanCode.match(/VE:([^|]+)/);
              if (match) cleanCode = match[1];
            }

            setTicketCode(cleanCode); // Hiển thị mã vé sạch trên ô nhập liệu
            handleFindTicket(cleanCode, true); // Gọi tìm kiếm và TỰ ĐỘNG check-in!
          },
          (errorMessage) => {
            // Quét từng khung hình
          }
        );
      } catch (err) {
        console.error("Camera startup error:", err);
        setStatusMessage({
          type: "error",
          text: "Không thể khởi động camera. Vui lòng kiểm tra và cấp quyền truy cập camera ở góc trái thanh địa chỉ trình duyệt (biểu tượng camera/khóa), hoặc đảm bảo camera không bị chiếm dụng bởi tab/ứng dụng khác."
        });
      }
    }, 100);
  }

  async function toggleCameraFacing() {
    const nextFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacing);
    
    // Tắt cam hiện tại trước khi đổi
    if (html5QrCodeRef.current) {
      await html5QrCodeRef.current.stop();
      html5QrCodeRef.current = null;
    }
    
    // Khởi động lại với chiều cam mới
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader");
        html5QrCodeRef.current = html5QrCode;
        const config = { fps: 15 };
        await html5QrCode.start(
          { facingMode: nextFacing },
          config,
          (decodedText) => {
            const now = Date.now();
            if (decodedText === lastScanCodeRef.current && now - lastScanTimeRef.current < 3000) {
              return;
            }
            lastScanCodeRef.current = decodedText;
            lastScanTimeRef.current = now;

            console.log("QR Code Scanned:", decodedText);
            
            // Tự động bóc tách mã vé sạch sẽ
            let cleanCode = decodedText.trim();
            if (cleanCode.includes("/ticket-info/")) {
              const parts = cleanCode.split("/ticket-info/");
              cleanCode = parts[parts.length - 1];
            } else if (cleanCode.includes("data=VE:")) {
              const match = cleanCode.match(/data=VE:([^|&]+)/);
              if (match) cleanCode = match[1];
            } else if (cleanCode.startsWith("VE:")) {
              const match = cleanCode.match(/VE:([^|]+)/);
              if (match) cleanCode = match[1];
            }

            setTicketCode(cleanCode); // Hiển thị mã vé sạch trên ô nhập liệu
            handleFindTicket(cleanCode, true); // Gọi tìm kiếm và TỰ ĐỘNG check-in!
          },
          (errorMessage) => {}
        );
      } catch (err) {
        console.error("Camera startup error after switch:", err);
        setStatusMessage({
          type: "error",
          text: `Đổi chiều camera thất bại: ${err.message || err}`
        });
      }
    }, 100);
  }

  return (
    <div className="staff-qr-container">
      <h4 className="font-bold text-2xl text-gray-805 mb-6 flex items-center gap-2">
        <MdQrCodeScanner className="text-green-600" /> Quét QR Vé Vào Cổng
      </h4>
 
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scanner Component */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
          <h5 className="font-bold text-gray-800 text-base mb-4 self-start border-b border-gray-50 pb-2 w-full">
            Trình Quét QR Camera
          </h5>
          
          <div className="relative w-full max-w-sm aspect-square bg-gray-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center border border-gray-850 shadow-inner group">
            <div id="reader" style={{ width: "100%", height: "100%" }}></div>
            
            {/* Laser line effect */}
            <div className="absolute left-0 right-0 h-0.5 bg-green-500 top-1/2 -translate-y-1/2 animate-pulse shadow-[0_0_10px_#22c55e] pointer-events-none z-10"></div>
            
            {/* Switch camera button */}
            <button
              onClick={toggleCameraFacing}
              className="absolute bottom-3 right-3 bg-black/75 hover:bg-black text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-all z-20 flex items-center gap-1 cursor-pointer"
            >
              <MdCameraAlt /> {facingMode === "user" ? "Đổi Cam Sau" : "Đổi Cam Trước"}
            </button>
          </div>
        </div>

        {/* Search and Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h5 className="font-bold text-gray-800 text-base mb-4 border-b border-gray-50 pb-2">
                Nhập Mã Vé Thủ Công
              </h5>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Nhập mã vé (VD: VE1 hoặc code từ hóa đơn)"
                  value={ticketCode}
                  onChange={e => setTicketCode(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50/50 transition-all duration-200"
                />
                <button
                  onClick={() => handleFindTicket(ticketCode)}
                  className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 active:scale-98 transition-all flex items-center gap-1"
                >
                  Tìm Kiếm <MdArrowForward />
                </button>
              </div>
            </div>

            {statusMessage && (
              <div className={`p-4 rounded-xl text-sm flex items-start gap-2.5 border ${
                statusMessage.type === "success" 
                  ? "bg-green-50 text-green-800 border-green-200"
                  : statusMessage.type === "warning"
                  ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                  : "bg-red-50 text-red-805 border-red-200"
              }`}>
                <span className="text-lg shrink-0 mt-0.5">
                  {statusMessage.type === "success" && <MdCheckCircle className="text-green-600" />}
                  {statusMessage.type === "warning" && <MdWarning className="text-yellow-600" />}
                  {statusMessage.type === "error" && <MdError className="text-red-500" />}
                </span>
                <span>{statusMessage.text}</span>
              </div>
            )}

            {ticketDetails && (
              <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/40">
                <h6 className="font-bold text-gray-800 text-sm mb-3.5 pb-2 border-b border-gray-200/50 flex justify-between items-center">
                  <span>Thông Tin Vé: {ticketDetails.ticketCode || ticketDetails.code || `VE${ticketDetails.ticketId || ticketDetails.id}`}</span>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider ${
                    ticketDetails.status === "Used" || ticketDetails.status === "Đã thanh toán"
                      ? "bg-green-100 text-green-805"
                      : ticketDetails.status === "Active" || ticketDetails.status === "Đã đặt"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {ticketDetails.status === "Used" ? "Đã sử dụng" : ticketDetails.status === "Active" ? "Đang hoạt động" : ticketDetails.status}
                  </span>
                </h6>

                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs text-gray-600">
                  <div>Tên khách hàng:</div>
                  <div className="font-semibold text-gray-800 text-right">{ticketDetails.customerName || "—"}</div>
                  
                  <div>Phim chiếu:</div>
                  <div className="font-semibold text-gray-800 text-right">{ticketDetails.movieTitle || "—"}</div>
                  
                  <div>Phòng & Ghế:</div>
                  <div className="font-bold text-green-700 text-right">{ticketDetails.roomName || "—"} / {ticketDetails.seatCode || "—"}</div>
                  
                  <div>Rạp:</div>
                  <div className="font-semibold text-gray-800 text-right">{ticketDetails.cinemaName || "—"}</div>
                  
                  <div>Chi phí vé:</div>
                  <div className="font-bold text-gray-800 text-right">{(ticketDetails.price || ticketDetails.amount || 0).toLocaleString("vi-VN")} đ</div>

                  {ticketDetails.foods && ticketDetails.foods.length > 0 && (
                    <>
                      <div className="col-span-2 border-t border-dashed border-gray-200 my-2"></div>
                      <div>Đồ ăn & Nước uống:</div>
                      <div className="text-right" style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-end" }}>
                        {ticketDetails.foods.map((food, idx) => (
                          <div key={idx} className="font-semibold text-gray-800">
                            {food.name} <span className="text-gray-400 font-normal">(x{food.quantity})</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {ticketDetails && (
            <div className="pt-6 border-t border-gray-100 mt-6">
              {ticketDetails.status === "Used" ? (
                <div className="w-full text-center bg-gray-100 text-gray-500 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 border border-gray-200">
                  <MdCheckCircle /> VÉ ĐÃ ĐƯỢC CHECK-IN TRƯỚC ĐÓ
                </div>
              ) : (
                <button
                  onClick={handleCheckIn}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 active:scale-98 transition-all hover:shadow-lg hover:shadow-green-100 flex items-center justify-center gap-1.5"
                >
                  {loading ? "Đang check-in..." : "XÁC NHẬN CHO VÀO PHÒNG CHIẾU"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
