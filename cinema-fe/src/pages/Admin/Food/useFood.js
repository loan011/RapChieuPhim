import { useState, useEffect, useRef } from "react";
import { createFood, updateFood, createCombo, updateCombo, receiveFoodStock, loadFoodInventory, loadFoodStatistics, loadFoodRevenue, loadTopSellingFoods, deleteCinemaFood, updateCinemaFoodSaleStatus, updateCinemaComboSaleStatus } from "./foodService";

function toList(value) {
  if (Array.isArray(value)) return value;
  return value?.$values || value?.data || value?.items || [];
}

function getBookingCinemaId(booking, showtimeCinemaMap) {
  if (!booking) return null;
  let cid = booking.cinemaId ?? booking.CinemaId;
  if (cid) return String(cid);

  const tickets = booking.tickets ?? booking.Tickets;
  if (Array.isArray(tickets) && tickets.length > 0) {
    const t = tickets[0];
    cid = t.cinemaId ?? t.CinemaId ?? t.cinema?.cinemaId ?? t.cinema?.CinemaId;
    if (cid) return String(cid);
    const stId = t.showtimeId ?? t.ShowtimeId;
    if (stId && showtimeCinemaMap && showtimeCinemaMap.has(String(stId))) {
      return showtimeCinemaMap.get(String(stId));
    }
  }

  const showtime = booking.showtime ?? booking.Showtime;
  if (showtime) {
    cid = showtime.cinemaId ?? showtime.CinemaId;
    if (cid) return String(cid);
    const room = showtime.room ?? showtime.Room;
    if (room) {
      cid = room.cinemaId ?? room.CinemaId;
      if (cid) return String(cid);
    }
  }

  const stId = booking.showtimeId ?? booking.ShowtimeId;
  if (stId && showtimeCinemaMap && showtimeCinemaMap.has(String(stId))) {
    return showtimeCinemaMap.get(String(stId));
  }

  const room = booking.room ?? booking.Room;
  if (room) {
    cid = room.cinemaId ?? room.CinemaId;
    if (cid) return String(cid);
  }

  return null;
}

function getOrderCinemaId(order, showtimeCinemaMap) {
  if (!order) return null;
  let cid = order.cinemaId ?? order.CinemaId;
  if (cid) return String(cid);

  if (order.staff) {
    cid = order.staff.cinemaId ?? order.staff.CinemaId ?? order.staff.cinema?.cinemaId ?? order.staff.cinema?.CinemaId;
    if (cid) return String(cid);
  }
  if (order.Staff) {
    cid = order.Staff.cinemaId ?? order.Staff.CinemaId ?? order.Staff.cinema?.cinemaId ?? order.Staff.cinema?.CinemaId;
    if (cid) return String(cid);
  }

  const booking = order.booking ?? order.Booking;
  if (booking) {
    cid = getBookingCinemaId(booking, showtimeCinemaMap);
    if (cid) return cid;
  }

  const orderId = order.orderId ?? order.OrderId ?? order.id ?? order.Id;
  if (orderId) {
    try {
      const map = JSON.parse(localStorage.getItem("order_cinema_map") || "{}");
      if (map[String(orderId)]) return String(map[String(orderId)]);
    } catch (e) {}
  }

  return null;
}

function calculateItemSales(bookings, orders, selectedCinemaId, showtimeCinemaMap) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  const isThisWeek = (d) => {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return d >= startOfWeek;
  };
  const isThisMonth = (d) => d.getFullYear() === currentYear && d.getMonth() === currentMonth;

  const foodStatsMap = new Map();  // foodId -> { month: 0, week: 0, today: 0 }
  const comboStatsMap = new Map(); // comboId -> { month: 0, week: 0, today: 0 }

  const addSale = (map, id, qty, dateObj) => {
    if (!id) return;
    const key = String(id);
    if (!map.has(key)) map.set(key, { month: 0, week: 0, today: 0 });
    const stat = map.get(key);
    
    if (isThisMonth(dateObj)) stat.month += qty;
    if (isThisWeek(dateObj)) stat.week += qty;
    if (isSameDay(dateObj, now)) stat.today += qty;
  };

  // 1. Process Customer Bookings
  toList(bookings).forEach((booking) => {
    const status = String(booking.status ?? booking.Status ?? booking.paymentStatus ?? booking.PaymentStatus ?? "").toLowerCase();
    if (["pending", "unpaid", "cancelled", "canceled"].some(v => status.includes(v))) return;

    if (selectedCinemaId) {
      const bCinemaId = getBookingCinemaId(booking, showtimeCinemaMap);
      if (bCinemaId && String(bCinemaId) !== String(selectedCinemaId)) return;
    }

    const rawDate = booking.bookingDate ?? booking.BookingDate ?? booking.createdAt ?? booking.CreatedAt;
    const dateObj = rawDate ? new Date(rawDate) : null;
    if (!dateObj || Number.isNaN(dateObj.getTime())) return;

    const rawItems = booking.bookingFoods ?? booking.BookingFoods ?? booking.foods ?? booking.Foods ?? booking.bookingCombos ?? booking.BookingCombos ?? booking.combos ?? booking.Combos ?? booking.items ?? [];
    toList(rawItems).forEach((item) => {
      const qty = Number(item.quantity ?? item.Quantity ?? 1);
      const foodId = item.foodId ?? item.FoodId ?? item.food?.foodId ?? item.Food?.FoodId;
      const comboId = item.comboId ?? item.ComboId ?? item.combo?.comboId ?? item.Combo?.ComboId;
      if (foodId != null) addSale(foodStatsMap, foodId, qty, dateObj);
      if (comboId != null) addSale(comboStatsMap, comboId, qty, dateObj);
    });
  });

  // 2. Process Staff POS Orders
  toList(orders).forEach((order) => {
    const status = String(order.status ?? order.Status ?? "").toLowerCase();
    if (["pending", "unpaid", "cancelled", "canceled"].some(v => status.includes(v))) return;

    if (selectedCinemaId) {
      const oCinemaId = getOrderCinemaId(order, showtimeCinemaMap);
      if (oCinemaId && String(oCinemaId) !== String(selectedCinemaId)) return;
    }

    const rawDate = order.orderDate ?? order.OrderDate ?? order.createdAt ?? order.CreatedAt;
    const dateObj = rawDate ? new Date(rawDate) : null;
    if (!dateObj || Number.isNaN(dateObj.getTime())) return;

    const rawItems = order.orderitems ?? order.OrderItems ?? order.items ?? order.Items ?? [];
    toList(rawItems).forEach((item) => {
      const qty = Number(item.quantity ?? item.Quantity ?? 1);
      const foodId = item.foodId ?? item.FoodId ?? item.food?.foodId ?? item.Food?.FoodId;
      const comboId = item.comboId ?? item.ComboId ?? item.combo?.comboId ?? item.Combo?.ComboId;
      if (foodId != null) addSale(foodStatsMap, foodId, qty, dateObj);
      if (comboId != null) addSale(comboStatsMap, comboId, qty, dateObj);
    });
  });

  return { foodStatsMap, comboStatsMap };
}

export function useFood() {
  const loadRequestRef = useRef(0);
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
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [saleStatusDraft, setSaleStatusDraft] = useState("ACTIVE");
  
  // Filter category & status
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [timeFilter, setTimeFilter] = useState("month"); // 'month' or 'today'

  // Selected item for edit/delete/import
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Import state
  const [importQuantity, setImportQuantity] = useState(1);
  const [importDetails, setImportDetails] = useState({ unitCost: 0, receivedAt: new Date().toISOString().slice(0, 10), expirationDate: "", notes: "" });
  const [comboFoodItems, setComboFoodItems] = useState([]);

  // Form Data
  const [formData, setFormData] = useState({
    itemType: "food", // 'food' or 'combo'
    name: "",
    category: "",
    price: 0,
    quantity: 0,
    imageUrl: "",
    isAvailable: true,
    allowsCustomization: true,
    drinkSlotCount: 1,
    popcornSlotCount: 1
  });

  // Cinema filter
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState("");
  const [serverRevenue, setServerRevenue] = useState({ totalSold: 0, totalRevenue: 0 });
  const [serverTopSelling, setServerTopSelling] = useState([]);

  const loadData = async () => {
    if (!selectedCinemaId) return;
    const requestId = ++loadRequestRef.current;
    setLoading(true);
    setError("");
    setItems([]);
    setServerRevenue({ totalSold: 0, totalRevenue: 0 });
    setServerTopSelling([]);
    setCurrentPage(1);
    try {
      const [inventory, statistics, topSelling, revenue] = await Promise.all([
        loadFoodInventory(selectedCinemaId),
        loadFoodStatistics(selectedCinemaId, timeFilter),
        loadTopSellingFoods(selectedCinemaId, timeFilter),
        loadFoodRevenue(selectedCinemaId, timeFilter)
      ]);
      const statList = toList(statistics);
      const statMap = new Map(statList.map(x => [`${x.foodId ? 'food' : 'combo'}_${x.foodId ?? x.comboId}`, x]));
      const normalize = (x, itemType) => {
        const id = itemType === 'food' ? (x.foodId ?? x.FoodId) : (x.comboId ?? x.ComboId);
        const stat = statMap.get(`${itemType}_${id}`) || {};
        return {
          id, itemType, name: itemType === 'food' ? (x.foodName ?? x.FoodName) : (x.comboName ?? x.ComboName),
          category: itemType === 'food' ? (x.category ?? x.Category ?? 'Khác') : 'Combo',
          price: Number(x.price ?? x.Price ?? 0), quantity: Number(x.quantity ?? x.Quantity ?? 0),
          minStock: Number(x.minStock ?? x.MinStock ?? 0),
          saleStatus: String(x.saleStatus ?? x.SaleStatus ?? (itemType === 'combo' && !(x.isAvailable ?? x.IsAvailable) ? 'INACTIVE' : 'ACTIVE')).toUpperCase(),
          stockStatus: String(x.stockStatus ?? x.StockStatus ?? x.status ?? x.Status ?? 'OUT_OF_STOCK').toUpperCase(),
          imageUrl: x.imageUrl ?? x.ImageUrl, isAvailable: Boolean(x.isAvailable ?? x.IsAvailable),
          foodItems: toList(x.foodItems ?? x.FoodItems),
          sold: Number(stat.quantity ?? stat.Quantity ?? 0), revenue: Number(stat.revenue ?? stat.Revenue ?? 0),
          trend: 0, originalData: x
        };
      };
      const nextItems = [
        ...toList(inventory?.foods).map(x => normalize(x, 'food')),
        ...toList(inventory?.combos).map(x => normalize(x, 'combo'))
      ].sort((a, b) => a.itemType.localeCompare(b.itemType) || a.id - b.id);
      if (requestId !== loadRequestRef.current) return;
      setItems(nextItems);
      setServerRevenue({ totalSold: Number(revenue?.totalSold ?? 0), totalRevenue: Number(revenue?.totalRevenue ?? 0) });
      setServerTopSelling(toList(topSelling));
    } catch (err) {
      if (requestId !== loadRequestRef.current) return;
      setError(err.message || "Lỗi khi tải dữ liệu");
    } finally {
      if (requestId === loadRequestRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCinemaId, timeFilter]);

  useEffect(() => {
    const loadCinemas = async () => {
      const headers = { "Authorization": `${localStorage.getItem("tokenType") || "Bearer"} ${localStorage.getItem("token") || ""}` };
      const response = await fetch(`${import.meta.env.VITE_API_URL}/Cinemas`, { headers });
      const data = response.ok ? await response.json() : [];
      const list = toList(data).map(cinema => ({ id: cinema.cinemaId ?? cinema.id, name: cinema.cinemaName ?? cinema.name }));
      setCinemas(list);
      if (list.length) setSelectedCinemaId(current => current || String(list[0].id));
    };
    loadCinemas().catch(err => setError(err.message));
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
    setComboFoodItems([]);
    setFormData({ itemType: "food", name: "", category: "Nước Uống", price: 0, quantity: 0, imageUrl: "", isAvailable: true, allowsCustomization: true, drinkSlotCount: 1, popcornSlotCount: 1 });
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
          allowsCustomization: formData.allowsCustomization,
          drinkSlotCount: Number(formData.drinkSlotCount),
          popcornSlotCount: Number(formData.popcornSlotCount),
          description: formData.category,
          foodItems: comboFoodItems.map(x => ({ foodId: Number(x.foodId), quantity: 0 }))
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
      category: item.category || item.originalData?.category || item.originalData?.description || "",
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl || "",
      isAvailable: item.isAvailable,
      allowsCustomization: Boolean(item.originalData?.allowsCustomization ?? item.originalData?.AllowsCustomization),
      drinkSlotCount: Number(item.originalData?.drinkSlotCount ?? item.originalData?.DrinkSlotCount ?? 0),
      popcornSlotCount: Number(item.originalData?.popcornSlotCount ?? item.originalData?.PopcornSlotCount ?? 0)
    });
    setComboFoodItems(item.itemType === 'combo' ? (item.foodItems || []).map(x => ({
      foodId: Number(x.foodId ?? x.FoodId), quantity: Number(x.quantity ?? x.Quantity ?? 1)
    })) : []);
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
          allowsCustomization: formData.allowsCustomization,
          drinkSlotCount: Number(formData.drinkSlotCount),
          popcornSlotCount: Number(formData.popcornSlotCount),
          description: formData.category
          ,foodItems: comboFoodItems.map(x => ({ foodId: Number(x.foodId), quantity: 0 }))
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
    setFormData({
      itemType: item.itemType,
      name: item.name,
      category: item.category || item.originalData?.category || item.originalData?.description || "",
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl || "",
      isAvailable: item.isAvailable
    });
    setImportQuantity(10);
    setImportDetails({ unitCost: item.price, receivedAt: new Date().toISOString().slice(0, 10), expirationDate: "", notes: "" });
    setShowImportModal(true);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem || importQuantity <= 0) return;
    try {
      setLoading(true);
      if (selectedItem.itemType !== 'food') throw new Error("Combo được tính tồn kho từ từng món thành phần; hãy nhập từng món.");
      await receiveFoodStock({
        cinemaId: Number(selectedCinemaId), foodId: Number(selectedItem.id), quantity: Number(importQuantity),
        unitCost: Number(importDetails.unitCost),
        receivedAt: new Date(importDetails.receivedAt).toISOString(),
        expirationDate: importDetails.expirationDate || null, notes: importDetails.notes || null
      });

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
      const result = await deleteCinemaFood(Number(selectedCinemaId), Number(selectedItem.id));
      setShowDeleteModal(false);
      setSelectedItem(null);
      alert(result?.message || "Xóa món thành công.");
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openStatusModal = (item) => {
    setSelectedItem(item);
    setSaleStatusDraft(item.saleStatus === "INACTIVE" ? "INACTIVE" : "ACTIVE");
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedItem || !['food', 'combo'].includes(selectedItem.itemType)) return;
    const cinemaId = Number(selectedCinemaId);
    const itemId = Number(selectedItem.id);
    if (!Number.isInteger(cinemaId) || cinemaId <= 0 || !Number.isInteger(itemId) || itemId <= 0) {
      alert("Không xác định được rạp hoặc món cần cập nhật.");
      return;
    }
    try {
      setLoading(true);
      const result = selectedItem.itemType === 'combo'
        ? await updateCinemaComboSaleStatus(cinemaId, itemId, saleStatusDraft)
        : await updateCinemaFoodSaleStatus(cinemaId, itemId, saleStatusDraft);
      setShowStatusModal(false);
      setSelectedItem(null);
      alert(result?.message || "Cập nhật trạng thái thành công.");
      await loadData();
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
    let matchesStatus = true;
    if (statusFilter === "Còn hàng") {
      matchesStatus = f.quantity > 0 && f.isAvailable;
    } else if (statusFilter === "Hết hàng") {
      matchesStatus = f.quantity <= 0 || !f.isAvailable;
    }
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const currentItems = filteredItems;

  // Computed Stats for Dashboard
  const getSold = (item) => Number(item.sold || 0);
  const getRev = (item) => Number(item.revenue || 0);

  const totalStock = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalSold = serverRevenue.totalSold;
  const totalRevenue = serverRevenue.totalRevenue;
  
  // Top selling items
  const topKeys = serverTopSelling.map(x => `${x.foodId ? 'food' : 'combo'}_${x.foodId ?? x.comboId}`);
  const itemMap = new Map(items.map(x => [`${x.itemType}_${x.id}`, x]));
  const topSelling = topKeys.map(key => itemMap.get(key)).filter(Boolean).slice(0, 5);
  
  // Low stock alerts
  const lowStockItems = items.filter(i => i.itemType === 'food' && i.quantity <= i.minStock);

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
    showImportModal, setShowImportModal, openImportModal, handleImportSubmit, importQuantity, setImportQuantity, importDetails, setImportDetails,
    showStatusModal, setShowStatusModal, openStatusModal, confirmStatusChange, saleStatusDraft, setSaleStatusDraft,
    
    timeFilter, setTimeFilter, getSold, getRev,
    statusFilter, setStatusFilter,
    formData, setFormData, handleInputChange, handleFileChange, selectedItem,
    comboFoodItems, setComboFoodItems, availableFoods: items.filter(x => x.itemType === 'food'),
    cinemas, selectedCinemaId, setSelectedCinemaId
  };
}
