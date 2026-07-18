import { useState, useEffect } from "react";
import { getCombosList, sellCombo } from "./ComboService";

export function useCombo() {
  const [combos, setCombos] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash"); // "cash" | "qr"
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      const list = await getCombosList();
      setCombos(list);
    }
    loadData();
  }, []);

  function handleQuantityChange(id, delta) {
    setQuantities(prev => {
      const item = combos.find(c => c.id === id);
      const current = prev[id] || 0;
      const maxQty = item ? item.quantity : 999;
      const next = Math.min(maxQty, Math.max(0, current + delta));
      return { ...prev, [id]: next };
    });
  }

  const selectedItems = combos.filter(item => (quantities[item.id] || 0) > 0);
  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.price * quantities[item.id]), 0);

  async function executeSell() {
    try {
      setLoading(true);
      const res = await sellCombo({
        items: selectedItems.map(item => ({
          id: item.id,
          type: item.type,
          name: item.name,
          quantity: quantities[item.id],
          price: item.price
        })),
        totalAmount,
        paymentMethod
      });
      setSuccess(res);
      setQuantities({});
      setShowQRModal(false);
    } catch (err) {
      alert("Bán combo thất bại: " + (err.message || "Lỗi không xác định"));
    } finally {
      setLoading(false);
    }
  }

  async function handleSell(e) {
    e.preventDefault();
    if (selectedItems.length === 0) return alert("Vui lòng chọn ít nhất một Combo/Món ăn!");

    if (paymentMethod === "qr") {
      setShowQRModal(true);
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
    showQRModal,
    setShowQRModal,
    handleSell,
    executeSell,
  };
}
