import { useState, useEffect } from "react";
import { fetchFoods, createFood, updateFood, deleteFood, fetchCombos, createCombo, updateCombo, deleteCombo } from "./foodService";

export function useFood() {
  const [items, setItems] = useState([]);
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
      const [foodsData, combosData] = await Promise.all([
        fetchFoods().catch(() => []),
        fetchCombos().catch(() => [])
      ]);
      
      const normalizedFoods = (foodsData || []).map(f => {
        const trend = Math.floor(Math.random() * 30) - 10;
        return {
          id: f.foodId,
          itemType: 'food',
          name: f.foodName,
          category: f.category || "Khác",
          price: f.price,
          quantity: f.quantity,
          imageUrl: f.imageUrl,
          isAvailable: f.isAvailable,
          soldThisMonth: f.soldThisMonth || 0,
          revenueThisMonth: f.revenueThisMonth || 0,
          soldThisWeek: f.soldThisWeek || 0,
          revenueThisWeek: f.revenueThisWeek || 0,
          soldToday: f.soldToday || 0,
          revenueToday: f.revenueToday || 0,
          trend: trend,
          revenue: f.revenueThisMonth || 0,
          originalData: f
        }
      });

      const normalizedCombos = (combosData || []).map(c => {
        const trend = Math.floor(Math.random() * 20) - 5;
        return {
          id: c.comboId,
          itemType: 'combo',
          name: c.comboName,
          category: "Combo",
          price: c.price,
          quantity: c.quantity,
          imageUrl: c.imageUrl,
          isAvailable: c.isAvailable,
          soldThisMonth: c.soldThisMonth || 0,
          revenueThisMonth: c.revenueThisMonth || 0,
          soldThisWeek: c.soldThisWeek || 0,
          revenueThisWeek: c.revenueThisWeek || 0,
          soldToday: c.soldToday || 0,
          revenueToday: c.revenueToday || 0,
          trend: trend,
          revenue: c.revenueThisMonth || 0,
          originalData: c
        }
      });

      setItems([...normalizedFoods, ...normalizedCombos].sort((a, b) => b.id - a.id));
    } catch (err) {
      setError(err.message || "Lỗi khi tải dữ liệu");
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
  const currentItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
