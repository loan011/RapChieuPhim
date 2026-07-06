import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPayment } from "./PaymentService.js";

export function usePayment() {
  const location = useLocation();
  const navigate = useNavigate();

  const bookingData = location.state;

  const [paymentMethod, setPaymentMethod] = useState("VNPay"); // Mặc định là VNPay
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentQrCode, setPaymentQrCode] = useState("");
  const [newTicketIds, setNewTicketIds] = useState([]);

  useEffect(() => {
    // Nếu không có dữ liệu đơn hàng chuyển qua, quay về trang Vé của tôi sau 500ms
    if (!bookingData || !bookingData.bookingIds || bookingData.bookingIds.length === 0) {
      console.warn("Không tìm thấy thông tin đặt vé, đang chuyển hướng...");
      const timer = setTimeout(() => {
        navigate("/customer/ve-cua-toi");
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setNewTicketIds(bookingData.bookingIds);
    }
  }, [bookingData, navigate]);

  async function handlePaymentSubmit(e) {
    if (e) e.preventDefault();
    if (!bookingData) return;

    setLoading(true);
    setPaymentError("");

    try {
      const payload = {
        bookingId: Number(bookingData.bookingIds[0]),
        bookingIds: bookingData.bookingIds.map(Number),
        amount: Number(bookingData.totalAmount),
        paymentMethod: paymentMethod, // "VNPay" hoặc "QrCode"
        description: `Thanh toan ve xem phim cho booking ${bookingData.bookingIds.join(", ")}`,
      };

      console.log("SENDING PAYMENTS PAYLOAD:", payload);
      const paymentResult = await createPayment(payload);
      console.log("PAYMENTS RESPONSE:", paymentResult);

      if (paymentMethod === "VNPay") {
        const redirectUrl =
          paymentResult?.paymentUrl ??
          paymentResult?.paymentURL ??
          paymentResult?.url ??
          paymentResult?.Url ??
          paymentResult?.redirectUrl ??
          paymentResult?.RedirectUrl ??
          paymentResult?.vnPayUrl ??
          paymentResult?.VnPayUrl;

        if (redirectUrl && typeof redirectUrl === "string" && redirectUrl.startsWith("http")) {
          window.location.href = redirectUrl;
          return;
        } else {
          throw new Error("Không lấy được đường dẫn thanh toán VNPay từ máy chủ.");
        }
      } else {
        // Phương thức thanh toán QR chuyển khoản ngân hàng (QrCode)
        let qrCodeUrlToUse = "";
        const qr =
          paymentResult?.qrCode ??
          paymentResult?.QrCode ??
          paymentResult?.qrCodeUrl ??
          paymentResult?.QrCodeUrl ??
          paymentResult?.qrUrl ??
          paymentResult?.QrUrl ??
          paymentResult?.vietQrUrl ??
          paymentResult?.VietQrUrl ??
          paymentResult?.qr ??
          paymentResult?.Qr;

        const bankId = paymentResult?.bankId ?? paymentResult?.BankId ?? paymentResult?.bankCode ?? paymentResult?.BankCode;
        const accountNo = paymentResult?.accountNo ?? paymentResult?.AccountNo ?? paymentResult?.accountNumber ?? paymentResult?.AccountNumber;

        if (qr) {
          qrCodeUrlToUse = qr;
        } else if (bankId && accountNo) {
          const amount = bookingData.totalAmount;
          const addInfo = encodeURIComponent(`Thanh toan ve ${bookingData.bookingIds.join(" ")}`);
          qrCodeUrlToUse = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${addInfo}`;
        }

        // Tạo VietQR dự phòng nếu API không trả về
        if (!qrCodeUrlToUse) {
          const defaultBank = "MB";
          const defaultAccount = "190220042001";
          const amount = bookingData.totalAmount;
          const addInfo = encodeURIComponent(`Thanh toan ve ${bookingData.bookingIds.join(" ")}`);
          qrCodeUrlToUse = `https://img.vietqr.io/image/${defaultBank}-${defaultAccount}-compact2.png?amount=${amount}&addInfo=${addInfo}`;
          console.log("GENERATED FALLBACK VIETQR:", qrCodeUrlToUse);
        }

        setPaymentQrCode(qrCodeUrlToUse);
        setShowQrModal(true);
      }
    } catch (err) {
      console.error("Thanh toán thất bại:", err);
      setPaymentError(err.message || "Thành toán thất bại. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  }

  function handleCompleteQrPayment() {
    setShowQrModal(false);
    setShowPaymentSuccess(true);
  }

  function handleFinishBooking() {
    setShowPaymentSuccess(false);
    navigate("/customer/ve-cua-toi");
  }

  return {
    bookingData,
    paymentMethod,
    setPaymentMethod,
    loading,
    paymentError,
    showQrModal,
    setShowQrModal,
    showPaymentSuccess,
    paymentQrCode,
    newTicketIds,
    handlePaymentSubmit,
    handleCompleteQrPayment,
    handleFinishBooking,
  };
}
