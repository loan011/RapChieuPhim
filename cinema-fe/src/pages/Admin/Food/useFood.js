import { useState, useEffect } from "react";
import { fetchFoods, createFood, updateFood, deleteFood, fetchCombos, createCombo, updateCombo, deleteCombo, fetchBookingsForInventory } from "./foodService";

function toList(value) {
  if (Array.isArray(value)) return value;
  return value?.$values || value?.data || value?.items || [];
}

function getMonthlySoldQuantities(bookings) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const foodSales = new Map();
  const comboSales = new Map();

  toList(bookings).forEach((booking) => {
    const status = String(booking.status ?? booking.Status ?? booking.paymentStatus ?? booking.PaymentStatus ?? "").toLowerCase();
    if (["pending", "unpaid", "cancelled", "canceled"].some(value => status.includes(value))) return;

    const rawDate = booking.bookingDate ?? booking.BookingDate ?? booking.createdAt ?? booking.CreatedAt;
    const date = rawDate ? new Date(rawDate) : null;
    if (date && !Number.isNaN(date.getTime()) && (date.getMonth() !== month || date.getFullYear() !== year)) return;

    const rawItems = booking.bookingFoods ?? booking.BookingFoods ?? booking.foods ?? booking.Foods ?? booking.bookingCombos ?? booking.BookingCombos ?? booking.combos ?? booking.Combos ?? [];
    toList(rawItems).forEach((item) => {
      const quantity = Number(item.quantity ?? item.Quantity ?? 1);
      const foodId = item.foodId ?? item.FoodId ?? item.food?.foodId ?? item.Food?.FoodId;
      const comboId = item.comboId ?? item.ComboId ?? item.combo?.comboId ?? item.Combo?.ComboId;
      if (foodId != null) foodSales.set(String(foodId), (foodSales.get(String(foodId)) || 0) + quantity);
      if (comboId != null) comboSales.set(String(comboId), (comboSales.get(String(comboId)) || 0) + quantity);
    });
  });

  return { foodSales, comboSales };
}

// ─── Dữ liệu mẫu khớp với database thật (fallback khi API chưa trả về) ───
const MOCK_FOODS = [
  { id: 1, itemType: 'food', name: 'Trà Sữa',     category: 'Nước Uống', price: 50000, quantity: 100, imageUrl: '/img/trasua.jpg',      isAvailable: true, soldThisMonth: 0, revenueThisMonth: 0, soldThisWeek: 0, revenueThisWeek: 0, soldToday: 0, revenueToday: 0, trend: 0, revenue: 0, originalData: {} },
  { id: 2, itemType: 'food', name: 'Trà Đào',      category: 'Nước Uống', price: 45000, quantity: 98,  imageUrl: '/img/tradao.jpg',       isAvailable: true, soldThisMonth: 0, revenueThisMonth: 0, soldThisWeek: 0, revenueThisWeek: 0, soldToday: 0, revenueToday: 0, trend: 0, revenue: 0, originalData: {} },
  { id: 3, itemType: 'food', name: 'Bắp Caramel',  category: 'Bắp Rang',  price: 60000, quantity: 94,  imageUrl: '/img/bapngot.jpg',      isAvailable: true, soldThisMonth: 0, revenueThisMonth: 0, soldThisWeek: 0, revenueThisWeek: 0, soldToday: 0, revenueToday: 0, trend: 0, revenue: 0, originalData: {} },
  { id: 4, itemType: 'food', name: 'Bắp Ngọt Lớn', category: 'Bắp Rang',  price: 60000, quantity: 90,  imageUrl: '/img/bapngot.jpg',      isAvailable: true, soldThisMonth: 0, revenueThisMonth: 0, soldThisWeek: 0, revenueThisWeek: 0, soldToday: 0, revenueToday: 0, trend: 0, revenue: 0, originalData: {} },
  { id: 5, itemType: 'food', name: '7up',           category: 'Nước Uống', price: 35000, quantity: 98,  imageUrl: '/img/7up.jpg',          isAvailable: true, soldThisMonth: 0, revenueThisMonth: 0, soldThisWeek: 0, revenueThisWeek: 0, soldToday: 0, revenueToday: 0, trend: 0, revenue: 0, originalData: {} },
  { id: 6, itemType: 'food', name: 'Sting',         category: 'Nước Uống', price: 35000, quantity: 90,  imageUrl: '/img/sting.jpg',        isAvailable: true, soldThisMonth: 0, revenueThisMonth: 0, soldThisWeek: 0, revenueThisWeek: 0, soldToday: 0, revenueToday: 0, trend: 0, revenue: 0, originalData: {} },
  { id: 8, itemType: 'food', name: 'Pepsi',         category: 'Nước Uống', price: 35000, quantity: 98,  imageUrl: '/img/pepsi.jpg',        isAvailable: true, soldThisMonth: 0, revenueThisMonth: 0, soldThisWeek: 0, revenueThisWeek: 0, soldToday: 0, revenueToday: 0, trend: 0, revenue: 0, originalData: {} },
  { id: 9, itemType: 'food', name: 'Mirinda Cam',   category: 'Nước Uống', price: 35000, quantity: 97,  imageUrl: '/img/MirindaCam.jpg',   isAvailable: true, soldThisMonth: 0, revenueThisMonth: 0, soldThisWeek: 0, revenueThisWeek: 0, soldToday: 0, revenueToday: 0, trend: 0, revenue: 0, originalData: {} },
];

const MOCK_COMBOS = [
  { id: 1, itemType: 'combo', name: 'Combo Solo',   category: 'Combo', price: 100000, quantity: 100, imageUrl: '/img/combosolo.jpg',   isAvailable: true, soldThisMonth: 0, revenueThisMonth: 0, soldThisWeek: 0, revenueThisWeek: 0, soldToday: 0, revenueToday: 0, trend: 0, revenue: 0, originalData: { description: '1 bắp rang bơ cỡ vừa và 1 nước ngọt cỡ vừa' } },
  { id: 4, itemType: 'combo', name: 'Combo Couple', category: 'Combo', price: 139000, quantity: 100, imageUrl: '/img/combocouple.jpg', isAvailable: true, soldThisMonth: 0, revenueThisMonth: 0, soldThisWeek: 0, revenueThisWeek: 0, soldToday: 0, revenueToday: 0, trend: 0, revenue: 0, originalData: { description: '1 bắp rang bơ cỡ lớn và 2 nước ngọt cỡ vừa' } },
  { id: 6, itemType: 'combo', name: 'Combo Family', category: 'Combo', price: 229000, quantity: 59,  imageUrl: '/img/combofamily.jpg', isAvailable: true, soldThisMonth: 0, revenueThisMonth: 0, soldThisWeek: 0, revenueThisWeek: 0, soldToday: 0, revenueToday: 0, trend: 0, revenue: 0, originalData: { description: '2 bắp rang bơ cỡ lớn và 4 nước ngọt cỡ vừa' } },
];


export function useFood() {
  const [items, setItems] = useState([...MOCK_FOODS, ...MOCK_COMBOS]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Filter category
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [timeFilter, setTimeFilter] = useState("month"); // 'month' or 'today'

  // Selected item for edit/delete/import
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Import state
  const [importQuantity, setImportQuantity] = useState(1);

  // Form Data
  const [formData, setFormData] = useState({
    itemType: "food", // 'food' or 'combo'
    name: "",
    category: "",
    price: 0,
    quantity: 0,
    imageUrl: "",
    isAvailable: true
  });

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [foodsData, combosData, bookingsData] = await Promise.all([
        fetchFoods().catch(() => null),
        fetchCombos().catch(() => null),
        fetchBookingsForInventory().catch(() => [])
      ]);
      const { foodSales, comboSales } = getMonthlySoldQuantities(bookingsData);

      const normalizedFoods = foodsData && foodsData.length > 0
        ? foodsData.map(f => {
            const trend = Math.floor(Math.random() * 30) - 10;
            const foodId = f.foodId ?? f.FoodId ?? f.id ?? f.Id;
            const derivedSold = foodSales.get(String(foodId)) || 0;
            const apiSold = Number(f.soldThisMonth ?? f.SoldThisMonth ?? 0);
            const shouldDeriveStock = apiSold === 0 && derivedSold > 0;
            return {
              id: foodId,
              itemType: 'food',
              name: f.foodName ?? f.FoodName,
              category: f.category ?? f.Category ?? "Khác",
              price: Number(f.price ?? f.Price ?? 0),
              quantity: Math.max(0, Number(f.quantity ?? f.Quantity ?? 0) - (shouldDeriveStock ? derivedSold : 0)),
              imageUrl: f.imageUrl ?? f.ImageUrl,
              isAvailable: f.isAvailable ?? f.IsAvailable ?? true,
              soldThisMonth: Math.max(apiSold, derivedSold),
              revenueThisMonth: Math.max(Number(f.revenueThisMonth ?? f.RevenueThisMonth ?? 0), derivedSold * Number(f.price ?? f.Price ?? 0)),
              soldThisWeek: Number(f.soldThisWeek ?? f.SoldThisWeek ?? 0),
              revenueThisWeek: Number(f.revenueThisWeek ?? f.RevenueThisWeek ?? 0),
              soldToday: Number(f.soldToday ?? f.SoldToday ?? 0),
              revenueToday: Number(f.revenueToday ?? f.RevenueToday ?? 0),
              trend: trend,
              revenue: f.revenueThisMonth || 0,
              originalData: f
            };
          })
        : MOCK_FOODS; // Giữ mock nếu API lỗi hoặc trả rỗng

      const normalizedCombos = combosData && combosData.length > 0
        ? combosData.map(c => {
            const trend = Math.floor(Math.random() * 20) - 5;
            const comboId = c.comboId ?? c.ComboId ?? c.id ?? c.Id;
            const derivedSold = comboSales.get(String(comboId)) || 0;
            const apiSold = Number(c.soldThisMonth ?? c.SoldThisMonth ?? 0);
            const shouldDeriveStock = apiSold === 0 && derivedSold > 0;
            return {
              id: comboId,
              itemType: 'combo',
              name: c.comboName ?? c.ComboName,
              category: "Combo",
              price: Number(c.price ?? c.Price ?? 0),
              quantity: Math.max(0, Number(c.quantity ?? c.Quantity ?? 0) - (shouldDeriveStock ? derivedSold : 0)),
              imageUrl: c.imageUrl ?? c.ImageUrl,
              isAvailable: c.isAvailable ?? c.IsAvailable ?? true,
              soldThisMonth: Math.max(apiSold, derivedSold),
              revenueThisMonth: Math.max(Number(c.revenueThisMonth ?? c.RevenueThisMonth ?? 0), derivedSold * Number(c.price ?? c.Price ?? 0)),
              soldThisWeek: Number(c.soldThisWeek ?? c.SoldThisWeek ?? 0),
              revenueThisWeek: Number(c.revenueThisWeek ?? c.RevenueThisWeek ?? 0),
              soldToday: Number(c.soldToday ?? c.SoldToday ?? 0),
              revenueToday: Number(c.revenueToday ?? c.RevenueToday ?? 0),
              trend: trend,
              revenue: c.revenueThisMonth || 0,
              originalData: c
            };
          })
        : MOCK_COMBOS; // Giữ mock nếu API lỗi hoặc trả rỗng

      setItems([...normalizedFoods, ...normalizedCombos].sort((a, b) => b.id - a.id));
    } catch (err) {
      setError(err.message || "Lỗi khi tải dữ liệu");
      // Giữ nguyên mock data, không xoá
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCategorySelect = (cat) => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const capitalizeWords = (str) => {
    if (!str) return str;
    return str.split(' ').map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === "checkbox" ? checked : value;
    
    if (name === "name" || name === "category") {
      finalValue = capitalizeWords(finalValue);
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        imageUrl: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  // Add Mode
  const openAddModal = () => {
    setFormData({ itemType: "food", name: "", category: "", price: 0, quantity: 0, imageUrl: "", isAvailable: true });
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (formData.itemType === 'food') {
        await createFood({
          foodName: formData.name,
          category: formData.category,
          price: Number(formData.price),
          quantity: Number(formData.quantity),
          imageUrl: formData.imageUrl,
          isAvailable: formData.isAvailable
        });
      } else {
        await createCombo({
          comboName: formData.name,
          price: Number(formData.price),
          quantity: Number(formData.quantity),
          imageUrl: formData.imageUrl,
          isAvailable: formData.isAvailable,
          description: formData.category // map tạm category vào description nếu cần
        });
      }
      setShowAddModal(false);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Edit Mode
  const openEditModal = (item) => {
    setSelectedItem(item);
    setFormData({
      itemType: item.itemType,
      name: item.name,
      category: item.category || item.originalData.description || "",
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl || "",
      isAvailable: item.isAvailable
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      setLoading(true);
      if (selectedItem.itemType === 'food') {
        await updateFood(selectedItem.id, {
          foodName: formData.name,
          category: formData.category,
          price: Number(formData.price),
          quantity: Number(formData.quantity),
          imageUrl: formData.imageUrl,
          isAvailable: formData.isAvailable
        });
      } else {
        await updateCombo(selectedItem.id, {
          comboName: formData.name,
          price: Number(formData.price),
          quantity: Number(formData.quantity),
          imageUrl: formData.imageUrl,
          isAvailable: formData.isAvailable,
          description: formData.category
        });
      }
      setShowEditModal(false);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Import Mode
  const openImportModal = (item) => {
    setSelectedItem(item);
    setImportQuantity(10);
    setShowImportModal(true);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem || importQuantity <= 0) return;
    try {
      setLoading(true);
      const newQuantity = selectedItem.quantity + Number(importQuantity);
      if (selectedItem.itemType === 'food') {
        await updateFood(selectedItem.id, {
          foodName: selectedItem.name,
          category: selectedItem.originalData.category,
          price: selectedItem.price,
          quantity: newQuantity,
          imageUrl: selectedItem.imageUrl,
          isAvailable: selectedItem.isAvailable
        });
      } else {
        await updateCombo(selectedItem.id, {
          comboName: selectedItem.name,
          price: selectedItem.price,
          quantity: newQuantity,
          imageUrl: selectedItem.imageUrl,
          isAvailable: selectedItem.isAvailable,
          description: selectedItem.originalData.description
        });
      }
      setShowImportModal(false);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete Mode
  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    try {
      setLoading(true);
      if (selectedItem.itemType === 'food') {
        await deleteFood(selectedItem.id);
      } else {
        await deleteCombo(selectedItem.id);
      }
      setShowDeleteModal(false);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter & Pagination
  const filteredItems = items.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (f.category && f.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = activeCategory === "Tất cả" || f.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const currentItems = filteredItems;

  // Computed Stats for Dashboard
  const isMonth = timeFilter === 'month';
  const isWeek = timeFilter === 'week';
  const getSold = (item) => isMonth ? item.soldThisMonth : (isWeek ? item.soldThisWeek : item.soldToday);
  const getRev = (item) => isMonth ? item.revenueThisMonth : (isWeek ? item.revenueThisWeek : item.revenueToday);

  const totalStock = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalSold = items.reduce((sum, item) => sum + getSold(item), 0);
  const totalRevenue = items.reduce((sum, item) => sum + getRev(item), 0);
  
  // Top selling items
  const topSelling = [...items].sort((a, b) => getSold(b) - getSold(a)).slice(0, 5);
  
  // Low stock alerts
  const lowStockItems = items.filter(i => i.quantity < 100);

  // Category chart data
  const categoryStats = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.quantity;
    return acc;
  }, {});
  const chartData = Object.keys(categoryStats).map(key => ({
    name: key,
    value: categoryStats[key]
  })).sort((a, b) => b.value - a.value);

  return {
    items: currentItems,
    allCategories: ["Tất cả", ...new Set(items.map(i => i.category))],
    activeCategory,
    handleCategorySelect,
    stats: {
      totalItems: items.length,
      totalStock,
      totalSold,
      totalRevenue,
      topSelling,
      lowStockItems,
      chartData
    },
    loading,
    error,
    searchTerm,
    handleSearch,
    currentPage,
    totalPages,
    handlePageChange,
    
    showAddModal, setShowAddModal, openAddModal, handleAddSubmit,
    showEditModal, setShowEditModal, openEditModal, handleEditSubmit,
    showDeleteModal, setShowDeleteModal, openDeleteModal, confirmDelete,
    showImportModal, setShowImportModal, openImportModal, handleImportSubmit, importQuantity, setImportQuantity,
    
    timeFilter, setTimeFilter, getSold, getRev,
    formData, setFormData, handleInputChange, handleFileChange, selectedItem
  };
}
