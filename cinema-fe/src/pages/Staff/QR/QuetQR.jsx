import "./QuetQR.css";
import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useQuetQR } from "./QuetQR.js";
import {
  MdQrCodeScanner, MdCameraAlt, MdCheckCircle, MdError,
  MdWarning, MdArrowForward, MdRefresh, MdVideocam, MdVideocamOff,
} from "react-icons/md";

const SCANNER_ID = "html5-qr-scanner";

export default function StaffQuetQR() {
  const {
    ticketCode, setTicketCode,
    ticketDetails,
    loading,
    statusMessage,
    cameraActive, setCameraActive,
    handleFindTicket,
    handleCheckIn,
    handleSimulateScan,
    resetScan,
  } = useQuetQR();

  const scannerRef = useRef(null);
  const lastCodeRef = useRef(null);
  const handleFindRef = useRef(handleFindTicket);
  useEffect(() => { handleFindRef.current = handleFindTicket; });

  // Start / stop camera
  useEffect(() => {
    if (!cameraActive) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current = null;
        });
      }
      return;
    }

    const scanner = new Html5Qrcode(SCANNER_ID);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 230, height: 230 }, aspectRatio: 1.0 },
      (decodedText) => {
        if (decodedText === lastCodeRef.current) return;
        lastCodeRef.current = decodedText;
        setTimeout(() => { lastCodeRef.current = null; }, 4000);
        setTicketCode(decodedText);
        handleFindRef.current(decodedText);
      },
      () => {} // per-frame errors — ignore
    ).catch(() => {
      setCameraActive(false);
      alert("Không thể truy cập camera. Hãy cho phép quyền camera trong trình duyệt và thử lại.");
    });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [cameraActive]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (scannerRef.current) scannerRef.current.stop().catch(() => {});
  }, []);

  const statusStyle =
    statusMessage?.type === "success" ? "bg-green-50 text-green-800 border-green-200"
    : statusMessage?.type === "warning" ? "bg-yellow-50 text-yellow-800 border-yellow-200"
    : "bg-red-50 text-red-800 border-red-200";

  return (
    <div className="staff-qr-container">
      <h4 className="font-bold text-2xl text-gray-805 mb-6 flex items-center gap-2">
        <MdQrCodeScanner className="text-green-600" /> Quét QR Vé Vào Cổng
      </h4>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Camera Panel ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
          <h5 className="font-bold text-gray-800 text-base mb-4 self-start border-b border-gray-50 pb-2 w-full">
            Trình Quét QR Camera
          </h5>

          {/* Scanner mount point — always rendered so html5-qrcode can find the element */}
          <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-gray-900 min-h-[300px] flex items-center justify-center">
            {cameraActive ? (
              <div id={SCANNER_ID} className="w-full" />
            ) : (
              <div className="text-center text-gray-400 p-8 flex flex-col items-center">
                <MdCameraAlt className="text-6xl mb-3 text-green-500/70" />
                <p className="text-sm font-medium text-gray-300">Camera chưa bật</p>
                <p className="text-xs text-gray-500 mt-2 px-4">
                  Nhấn "Bật Camera" để quét mã QR trên vé điện tử
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-5 w-full max-w-sm">
            <button
              onClick={() => setCameraActive(v => !v)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                cameraActive
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {cameraActive ? <><MdVideocamOff className="text-base" /> Tắt Camera</> : <><MdVideocam className="text-base" /> Bật Camera</>}
            </button>
            <button
              onClick={handleSimulateScan}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
              title="Mô phỏng quét vé ngẫu nhiên"
            >
              <MdQrCodeScanner className="text-base" /> Mô phỏng
            </button>
          </div>
        </div>

        {/* ── Search + Ticket Detail Panel ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
          {/* Manual input */}
          <div>
            <h5 className="font-bold text-gray-800 text-base mb-3 border-b border-gray-50 pb-2">
              Nhập Mã Vé Thủ Công
            </h5>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập mã vé (VD: VE1 hoặc code từ hóa đơn)"
                value={ticketCode}
                onChange={e => setTicketCode(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleFindTicket(ticketCode)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50/50 transition-all"
              />
              <button
                onClick={() => handleFindTicket(ticketCode)}
                disabled={loading}
                className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                {loading ? "..." : <><span>Tìm Kiếm</span> <MdArrowForward /></>}
              </button>
            </div>
          </div>

          {/* Status message */}
          {statusMessage && (
            <div className={`p-3.5 rounded-xl text-sm flex items-start gap-2.5 border ${statusStyle}`}>
              <span className="text-lg shrink-0 mt-0.5">
                {statusMessage.type === "success" && <MdCheckCircle className="text-green-600" />}
                {statusMessage.type === "warning" && <MdWarning className="text-yellow-600" />}
                {statusMessage.type === "error" && <MdError className="text-red-500" />}
              </span>
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Ticket details */}
          {ticketDetails && (
            <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 flex-1">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200/60">
                <span className="font-bold text-gray-800 text-sm">
                  Vé: <span className="text-green-700">{ticketDetails.code}</span>
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  ticketDetails.status === "Used"
                    ? "bg-green-100 text-green-800"
                    : ticketDetails.status === "Active"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {ticketDetails.status === "Used" ? "Đã sử dụng"
                    : ticketDetails.status === "Active" ? "Chờ vào cổng"
                    : ticketDetails.status}
                </span>
              </div>

              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-xs">
                {[
                  ["Khách hàng", ticketDetails.customerName],
                  ["Phim chiếu", ticketDetails.movieTitle],
                  ["Suất chiếu", ticketDetails.showDate !== "—" ? `${ticketDetails.showDate} – ${ticketDetails.showTime}` : "—"],
                  ["Phòng / Ghế", `${ticketDetails.roomName} / ${ticketDetails.seatCode}`],
                  ["Rạp chiếu",   ticketDetails.cinemaName],
                  ["Giá vé",      `${(ticketDetails.price || 0).toLocaleString("vi-VN")} đ`],
                ].map(([label, value]) => (
                  <>
                    <span key={label + "-l"} className="text-gray-500 whitespace-nowrap">{label}:</span>
                    <span key={label + "-v"} className="font-semibold text-gray-800 text-right">{value}</span>
                  </>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-auto">
            {ticketDetails && (
              ticketDetails.status === "Used" ? (
                <div className="w-full text-center bg-gray-100 text-gray-500 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 border border-gray-200">
                  <MdCheckCircle /> VÉ ĐÃ ĐƯỢC CHECK-IN TRƯỚC ĐÓ
                </div>
              ) : ticketDetails.status === "Cancelled" ? (
                <div className="w-full text-center bg-red-50 text-red-600 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 border border-red-200">
                  <MdError /> VÉ ĐÃ HỦY — KHÔNG CHO VÀO
                </div>
              ) : (
                <button
                  onClick={handleCheckIn}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 active:scale-[0.98] transition-all shadow-sm hover:shadow-green-100 hover:shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <MdCheckCircle className="text-lg" />
                  {loading ? "Đang xử lý..." : "XÁC NHẬN CHO VÀO PHÒNG CHIẾU"}
                </button>
              )
            )}

            {(ticketDetails || statusMessage) && (
              <button
                onClick={resetScan}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all"
              >
                <MdRefresh /> Quét vé mới
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

