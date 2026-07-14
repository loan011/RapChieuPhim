import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPayment, checkPaymentStatus } from "./PaymentService.js";
import { cancelBooking } from "../Booking/bookingService.js";

export function usePayment() {
  const location = useLocation();
  const navigate = useNavigate();

  const bookingData = location.state;

  const [paymentMethod, setPaymentMethod] = useState("QrCode"); // Mặc định là QrCode (VietQR)
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentQrCode, setPaymentQrCode] = useState("");
  const [newTicketIds, setNewTicketIds] = useState([]);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300 seconds)

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

  useEffect(() => {
    if (!bookingData || !bookingData.bookingIds || bookingData.bookingIds.length === 0) return;
    if (showPaymentSuccess) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          
          const bookingIds = bookingData.bookingIds;
          setLoading(true);
          
          Promise.all(bookingIds.map(id => cancelBooking(id).catch(err => console.error(err))))
            .finally(() => {
              setLoading(false);
              alert("Thời gian giữ ghế và thanh toán (5 phút) đã hết hạn. Đơn đặt vé của bạn đã bị hủy!");
              navigate("/");
            });

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [bookingData, navigate, showPaymentSuccess]);

  // Polling checkPaymentStatus mỗi 3 giây khi đang mở QR modal
  useEffect(() => {
    if (!showQrModal || showPaymentSuccess || !bookingData || !bookingData.bookingIds || bookingData.bookingIds.length === 0) return;

    const firstBookingId = bookingData.bookingIds[0];

    const pollTimer = setInterval(async () => {
      const isPaid = await checkPaymentStatus(firstBookingId);
      if (isPaid) {
        clearInterval(pollTimer);
        handleCompleteQrPayment();
      }
    }, 3000);

    return () => clearInterval(pollTimer);
  }, [showQrModal, showPaymentSuccess, bookingData]);

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
          try {
            // Đảm bảo số tiền trong QR khớp với tổng tiền thanh toán thực tế (bao gồm cả vé + đồ ăn)
            const urlObj = new URL(qr);
            urlObj.searchParams.set("amount", String(bookingData.totalAmount));
            qrCodeUrlToUse = urlObj.toString();
          } catch (e) {
            if (qr.includes("amount=")) {
              qrCodeUrlToUse = qr.replace(/amount=\d+/, `amount=${bookingData.totalAmount}`);
            } else {
              qrCodeUrlToUse = qr + (qr.includes("?") ? "&" : "?") + `amount=${bookingData.totalAmount}`;
            }
          }
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
    // Tự động chuyển sang trang Vé của tôi sau 2.5 giây
    setTimeout(() => {
      navigate("/customer/ve-cua-toi");
    }, 2500);
  }

  function handleFinishBooking() {
    setShowPaymentSuccess(false);
    navigate("/customer/ve-cua-toi");
  }

  const handleCancelAndGoBack = async () => {
    if (bookingData && bookingData.bookingIds && bookingData.bookingIds.length > 0) {
      setLoading(true);
      try {
        await Promise.all(
          bookingData.bookingIds.map(id => cancelBooking(id).catch(err => console.error(err)))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

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
    timeLeft,
    handleCancelAndGoBack,
  };
}
