import { useState, useEffect } from "react";
import { getCombosList, sellCombo, addFood, deleteItem, addCombo } from "./ComboService";

export function useCombo() {
  const [combos, setCombos] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [showAddFood, setShowAddFood] = useState(false);
  const [addingFood, setAddingFood] = useState(false);
  const [showAddCombo, setShowAddCombo] = useState(false);
  const [addingCombo, setAddingCombo] = useState(false);

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

  async function handleAddCombo(comboData) {
    try {
      setAddingCombo(true);
      await addCombo({ ...comboData, isAvailable: true });
      const list = await getCombosList();
      setCombos(list);
      setShowAddCombo(false);
    } catch (err) {
      alert(err.message || "Thêm combo thất bại!");
    } finally {
      setAddingCombo(false);
    }
  }

  async function handleAddFood(foodData) {
    try {
      setAddingFood(true);
      await addFood({ ...foodData, isAvailable: true });
      const list = await getCombosList();
      setCombos(list);
      setShowAddFood(false);
    } catch (err) {
      alert(err.message || "Thêm đồ ăn thất bại!");
    } finally {
      setAddingFood(false);
    }
  }

  async function handleDeleteItem(id, type) {
    if (!window.confirm("Xóa món này khỏi danh sách?")) return;
    try {
      await deleteItem(id, type);
      setCombos(prev => prev.filter(item => !(item.id === id && item.type === type)));
      setQuantities(prev => { const q = { ...prev }; delete q[id]; return q; });
    } catch (err) {
      alert(err.message || "Xóa thất bại!");
    }
  }

  async function handleSell(e) {
    e.preventDefault();
    if (selectedItems.length === 0) return alert("Vui lòng chọn ít nhất một Combo/Món ăn!");
    if (!customerName.trim()) return alert("Vui lòng nhập tên khách hàng!");

    try {
      setLoading(true);
      const res = await sellCombo({
        customerName,
        items: selectedItems.map(item => ({
          id: item.id,
          type: item.type,
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
    showAddCombo,
    setShowAddCombo,
    addingCombo,
    handleAddCombo,
    showAddFood,
    setShowAddFood,
    addingFood,
    handleAddFood,
    handleDeleteItem,
  };
}
