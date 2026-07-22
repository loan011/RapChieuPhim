import { useState, useEffect, useRef } from "react";
import {
  getCombosList,
  sellCombo,
  createPendingOrder,
  checkOrderStatus,
  confirmOrder,
  cancelOrder,
  deductInventory,
} from "./ComboService";

export function useCombo() {
  const [combos, setCombos] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash"); // "cash" | "qr"
  const [cashReceived, setCashReceived] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);

  // QR payment state
  const [qrPendingOrderId, setQrPendingOrderId] = useState(null);
  const [qrPaymentStatus, setQrPaymentStatus] = useState("pending"); // "pending" | "paid" | "error"
  const pollingRef = useRef(null);

  async function loadData() {
    const list = await getCombosList();
    setCombos(list);
  }

  useEffect(() => {
    loadData();
  }, []);

  // Dọn dẹp polling khi unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  function handleQuantityChange(uid, delta) {
    setQuantities(prev => {
      const item = combos.find(c => c.uid === uid);
      const current = prev[uid] || 0;
      const maxQty = item ? item.quantity : 999;
      const next = Math.min(maxQty, Math.max(0, current + delta));
      return { ...prev, [uid]: next };
    });
  }

  const selectedItems = combos.filter(item => (quantities[item.uid] || 0) > 0);
  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.price * quantities[item.uid]), 0);

  /**
   * Bắt đầu polling trạng thái đơn hàng mỗi 3 giây
   */
  function startPolling(orderId) {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      const status = await checkOrderStatus(orderId);
      console.log("[QR Polling] Order status:", status);

      if (status === "Confirmed") {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        setQrPaymentStatus("paid");
      } else if (status === "Cancelled") {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        setQrPaymentStatus("error");
      }
      // Nếu null hoặc "Pending" thì tiếp tục poll
    }, 3000);
  }

  /**
   * Dừng polling
   */
  function stopPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  /**
   * Hoàn tất bán (Tiền mặt): tạo order và confirm ngay
   */
  async function executeSell() {
    try {
      setLoading(true);
      const res = await sellCombo({
        items: selectedItems.map(item => ({
          id: item.id,
          type: item.type,
          name: item.name,
          quantity: quantities[item.uid],
          price: item.price
        })),
        totalAmount,
        paymentMethod
      });
      if (cashReceived && res?.orderId) {
        localStorage.setItem("cash_received_order_" + res.orderId, cashReceived);
        localStorage.setItem("cash_received_bill_CB" + res.orderId, cashReceived);
      }
      setSuccess({
        ...res,
        cashReceived: Number(cashReceived) || 0
      });
      setCashReceived("");
      setQuantities({});
      setShowQRModal(false);
      await loadData();
    } catch (err) {
      alert("Bán combo thất bại: " + (err.message || "Lỗi không xác định"));
    } finally {
      setLoading(false);
    }
  }

  /**
   * Hoàn tất bán (QR): Staff bấm "Xác nhận đã nhận tiền" sau khi đã poll thấy paid
   * orderId đã có, chỉ cần confirm (hoặc đã auto-confirm qua Sepay webhook)
   */
  async function executeQrConfirm() {
    if (!qrPendingOrderId) return;
    try {
      setLoading(true);
      stopPolling();

      // Nếu status chưa Confirmed qua webhook, gọi thủ công
      if (qrPaymentStatus !== "paid") {
        await confirmOrder(qrPendingOrderId);
      }

      const res = {
        success: true,
        id: `CB${qrPendingOrderId}`,
        orderId: qrPendingOrderId,
        items: selectedItems.map(item => ({
          id: item.id,
          type: item.type,
          name: item.name,
          quantity: quantities[item.uid],
          price: item.price
        })),
        totalAmount,
        time: new Date().toLocaleString("vi-VN"),
        date: new Date().toLocaleDateString("en-CA"),
        createdAt: new Date().toISOString()
      };

      // Trừ tồn kho trực tiếp vào Database cho các món đã bán qua QR
      await deductInventory(res.items);

      setSuccess(res);
      setQuantities({});
      setShowQRModal(false);
      setQrPendingOrderId(null);
      setQrPaymentStatus("pending");
      await loadData();
    } catch (err) {
      alert("Xác nhận thất bại: " + (err.message || "Lỗi không xác định"));
    } finally {
      setLoading(false);
    }
  }

  /**
   * Hủy giao dịch QR
   */
  async function handleCancelQr() {
    stopPolling();
    if (qrPendingOrderId) {
      await cancelOrder(qrPendingOrderId);
    }
    setShowQRModal(false);
    setQrPendingOrderId(null);
    setQrPaymentStatus("pending");
  }

  async function handleSell(e) {
    e.preventDefault();
    if (selectedItems.length === 0) return alert("Vui lòng chọn ít nhất một Combo/Món ăn!");

    if (paymentMethod === "cash" && cashReceived !== "" && Number(cashReceived) < totalAmount) {
      alert(`Số tiền nhận (${Number(cashReceived).toLocaleString("vi-VN")} đ) phải lớn hơn hoặc bằng tổng tiền đơn hàng (${totalAmount.toLocaleString("vi-VN")} đ)!`);
      return;
    }

    if (paymentMethod === "qr") {
      // Tạo pending order trước khi hiện QR modal
      try {
        setLoading(true);
        const { orderId } = await createPendingOrder({
          items: selectedItems.map(item => ({
            id: item.id,
            type: item.type,
            name: item.name,
            quantity: quantities[item.uid],
            price: item.price
          })),
          totalAmount,
          paymentMethod: "QR"
        });
        setQrPendingOrderId(orderId);
        setQrPaymentStatus("pending");
        setShowQRModal(true);
        // Bắt đầu polling
        startPolling(orderId);
      } catch (err) {
        alert("Không thể tạo đơn hàng: " + (err.message || "Lỗi không xác định"));
      } finally {
        setLoading(false);
      }
    } else {
      await executeSell();
    }
  }

  return {
    combos,
    quantities,
    loading,
    success,
    setSuccess,
    handleQuantityChange,
    selectedItems,
    totalAmount,
    paymentMethod,
    setPaymentMethod,
    cashReceived,
    setCashReceived,
    showQRModal,
    setShowQRModal,
    handleSell,
    executeSell,
    // QR payment
    qrPendingOrderId,
    qrPaymentStatus,
    executeQrConfirm,
    handleCancelQr,
  };
}
