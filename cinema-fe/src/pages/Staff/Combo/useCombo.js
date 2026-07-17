import { useState, useEffect } from "react";
import { getCombosList, sellCombo } from "./ComboService";

export function useCombo() {
  const [combos, setCombos] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    async function loadData() {
      const list = await getCombosList();
      setCombos(list);
    }
    loadData();
  }, []);

  function handleQuantityChange(id, delta) {
    setQuantities(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  }

  const selectedItems = combos.filter(item => (quantities[item.id] || 0) > 0);
  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.price * quantities[item.id]), 0);

  async function handleSell(e) {
    e.preventDefault();
    if (selectedItems.length === 0) return alert("Vui lòng chọn ít nhất một Combo/Món ăn!");
    if (!customerName.trim()) return alert("Vui lòng nhập tên khách hàng!");

    try {
      setLoading(true);
      const res = await sellCombo({
        customerName,
        items: selectedItems.map(item => ({
          name: item.name,
          quantity: quantities[item.id],
          price: item.price
        })),
        totalAmount
      });
      setSuccess(res);
      setQuantities({});
      setCustomerName("");
    } catch (err) {
      alert("Bán combo thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return {
    combos,
    quantities,
    customerName,
    setCustomerName,
    loading,
    success,
    setSuccess,
    handleQuantityChange,
    selectedItems,
    totalAmount,
    handleSell,
  };
}
