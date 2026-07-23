import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import "./QuetQRDoAn.css";
import { useQuetQRDoAn } from "./useQuetQRDoAn";
import { 
  MdQrCodeScanner, 
  MdFastfood, 
  MdCheckCircle, 
  MdError, 
  MdWarning, 
  MdArrowForward,
  MdRestaurant,
  MdPerson,
  MdDateRange,
  MdShoppingCart,
  MdCameraAlt
} from "react-icons/md";

export default function StaffQuetQRDoAn() {
  const {
    ticketCode,
    setTicketCode,
    ticketDetails,
    orders,
    loading,
    statusMessage,
    setStatusMessage,
    handleFindTicket,
    handleConfirmPickup,
    handleSimulateScan,
  } = useQuetQRDoAn();

  const html5QrCodeRef = useRef(null);
  const lastScanTimeRef = useRef(0);
  const lastScanCodeRef = useRef("");
  const [facingMode, setFacingMode] = useState("environment");
  const [scannerKey, setScannerKey] = useState(0);

  useEffect(() => {
    let isStopped = false;
    let scannerInstance = null;

    async function initScanner() {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
        } catch (e) {}
      }

      if (isStopped) return;
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (isStopped) return;

      try {
        const html5QrCode = new Html5Qrcode("reader-food");
        html5QrCodeRef.current = html5QrCode;
        scannerInstance = html5QrCode;

        const config = { fps: 15, qrbox: { width: 250, height: 250 } };

        const qrCodeSuccessCallback = (decodedText) => {
          const now = Date.now();
          if (decodedText === lastScanCodeRef.current && now - lastScanTimeRef.current < 3000) return;
          lastScanCodeRef.current = decodedText;
          lastScanTimeRef.current = now;

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

          setTicketCode(cleanCode);
          handleFindTicket(cleanCode);
        };

        try {
          await scannerInstance.start(
            { facingMode: facingMode },
            config,
            qrCodeSuccessCallback,
            () => {}
          );
        } catch (e) {
          console.warn("Failed starting food camera, trying fallback:", e);
          try {
            await scannerInstance.start(
              { facingMode: facingMode === "environment" ? "user" : "environment" },
              config,
              qrCodeSuccessCallback,
              () => {}
            );
          } catch (e2) {
            if (!isStopped) {
              setStatusMessage({
                type: "error",
                text: "Không thể tự động mở camera. Vui lòng sử dụng đường link HTTPS (Localtunnel) và bấm nút 'Mở / Bật Lại Camera Quét' bên dưới để cấp quyền truy cập Camera trên thiết bị."
              });
            }
          }
        }
      } catch (err) {
        console.error("Food Camera startup error:", err);
      }
    }

    initScanner();

    return () => {
      isStopped = true;
      if (scannerInstance && scannerInstance.isScanning) {
        scannerInstance.stop().catch(() => {});
      }
    };
  }, [facingMode, scannerKey]);

  const restartScanner = () => {
    setScannerKey(prev => prev + 1);
  };

  return (
    <div className="staff-qr-food-container">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
          <MdFastfood className="text-orange-500 text-3xl" /> Quét QR Nhận Đồ Ăn Online
        </h4>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scanner Component */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
          <h5 className="font-bold text-gray-800 text-base mb-4 self-start border-b border-gray-50 pb-2 w-full flex items-center gap-1.5">
            <MdQrCodeScanner className="text-orange-500" /> Trình Quét QR Camera
          </h5>
          
          <div className="relative w-full max-w-sm aspect-square bg-gray-50 rounded-2xl overflow-hidden flex flex-col items-center justify-center border border-gray-200 shadow-inner group">
            <div id="reader-food" style={{ width: "100%", height: "100%" }}></div>
            <div className="absolute left-0 right-0 h-0.5 bg-orange-500 top-1/2 -translate-y-1/2 animate-pulse shadow-[0_0_10px_#f97316] pointer-events-none z-10"></div>
          </div>

          <button
            type="button"
            onClick={() => setFacingMode(prev => prev === "environment" ? "user" : "environment")}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <MdCameraAlt className="text-gray-500 text-sm" /> Chuyển sang Camera {facingMode === "environment" ? "Trước (Selfie)" : "Sau (Chính)"}
          </button>
        </div>

        {/* Search and Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h5 className="font-bold text-gray-800 text-base mb-4 border-b border-gray-50 pb-2 flex items-center gap-1.5">
                <MdRestaurant className="text-orange-500" /> Nhập Mã Đơn / Mã Vé Thủ Công
              </h5>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleFindTicket(ticketCode);
                }}
                className="flex gap-3"
              >
                <input
                  type="text"
                  placeholder="Nhập mã vé hoặc mã hóa đơn (VD: VE... hoặc CB...)"
                  value={ticketCode}
                  onChange={e => setTicketCode(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50/50 transition-all duration-200"
                />
                <button
                  type="submit"
                  className="bg-orange-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-600 active:scale-98 transition-all flex items-center gap-1 shadow-md shadow-orange-100"
                >
                  Tìm Kiếm <MdArrowForward />
                </button>
              </form>
            </div>

            {statusMessage?.text && (
              <div
                className={`p-4 rounded-xl text-xs font-semibold flex items-start gap-2 border ${
                  statusMessage.type === "success"
                    ? "bg-green-50 text-green-800 border-green-200"
                    : statusMessage.type === "warning"
                    ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                <span className="text-lg shrink-0 mt-0.5">
                  {statusMessage.type === "success" && <MdCheckCircle className="text-green-600" />}
                  {statusMessage.type === "warning" && <MdWarning className="text-yellow-600" />}
                  {statusMessage.type === "error" && <MdError className="text-red-500" />}
                </span>
                <span>{statusMessage.text}</span>
              </div>
            )}

            {orders && orders.length > 0 && (
              <div className="border border-gray-100 rounded-2xl p-5 bg-orange-50/20 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200/60">
                  <h6 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                    <MdShoppingCart className="text-orange-500 text-base" />
                    Danh Sách Đồ Ăn Đã Đặt:
                  </h6>
                  {ticketDetails && (
                    <span className="text-xs text-gray-500 font-mono bg-white px-2 py-0.5 rounded border border-gray-200">
                      Vé: {ticketDetails.ticketCode || ticketDetails.code}
                    </span>
                  )}
                </div>

                {ticketDetails && (
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-1"><MdPerson className="text-gray-400" /> Khách:</div>
                    <div className="font-bold text-gray-800 text-right">{ticketDetails.customerName || "Khách tại quầy"}</div>
                    
                    <div className="flex items-center gap-1"><MdDateRange className="text-gray-400" /> Ngày đặt:</div>
                    <div className="font-semibold text-gray-800 text-right">{ticketDetails.dateBooked || "—"}</div>
                  </div>
                )}

                <div className="space-y-2">
                  {orders.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-orange-100 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        <span className="font-bold text-gray-800 text-sm">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-gray-500">Số lượng:</span>
                        <span className="text-base font-extrabold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-lg border border-orange-200">
                          x{item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleConfirmPickup}
                  disabled={loading}
                  className="w-full mt-4 bg-orange-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-orange-600 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-100 disabled:opacity-50"
                >
                  <MdCheckCircle className="text-lg" /> {loading ? "Đang xử lý..." : "XÁC NHẬN GIAO ĐỒ ĂN CHO KHÁCH"}
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
            <span>Giả lập quầy đồ ăn</span>
            <button
              onClick={handleSimulateScan}
              className="text-gray-500 hover:text-gray-800 underline cursor-pointer"
            >
              Thử nghiệm mã mẫu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
