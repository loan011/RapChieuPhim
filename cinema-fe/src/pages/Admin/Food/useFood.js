import { useState, useEffect } from "react";
import { fetchFoods, createFood, updateFood, deleteFood, fetchCombos, createCombo, updateCombo, deleteCombo, fetchBookingsForInventory, fetchOrdersForInventory } from "./foodService";

function toList(value) {
  if (Array.isArray(value)) return value;
  return value?.$values || value?.data || value?.items || [];
}

function getBookingCinemaId(booking) {
  if (!booking) return null;
  let cid = booking.cinemaId ?? booking.CinemaId;
  if (cid) return String(cid);

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

  const room = booking.room ?? booking.Room;
  if (room) {
    cid = room.cinemaId ?? room.CinemaId;
    if (cid) return String(cid);
  }

  return null;
}

function getOrderCinemaId(order) {
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
    cid = getBookingCinemaId(booking);
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

function calculateItemSales(bookings, orders, selectedCinemaId) {
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
      const bCinemaId = getBookingCinemaId(booking);
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
      const oCinemaId = getOrderCinemaId(order);
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

// ─── Dữ liệu mẫu khớp với database thật (fallback khi API chưa trả về) ───
const MOCK_FOODS = [
  { id: 1, itemType: 'food', name: 'Trà Sữa',     category: 'Nước Uống', price: 50000, quantity: 98,  imageUrl: '/img/trasua.jpg',      isAvailable: false, soldThisMonth: 0, revenueThisMonth: 0, soldThisWeek: 0, revenueThisWeek: 0, soldToday: 0, revenueToday: 0, trend: 0, revenue: 0, originalData: {} },
  { id: 2, itemType: 'food', name: 'Trà Đào',      category: 'Nước Uống', price: 45000, quantity: 100, imageUrl: '/img/tradao.jpg',       isAvailable: true,  soldThisMonth: 0, revenueThisMonth: 0, soldThisWeek: 0, revenueThisWeek: 0, soldToday: 0, revenueToday: 0, trend: 0, revenue: 0, originalData: {} },
  { id: 3, itemType: 'food', name: 'Bắp Caramel',  category: 'Bắp Rang',  price: 60000, quantity: 0,   imageUrl: '/img/bapngot.jpg',      isAvailable: true,  soldThisMonth: 0, revenueThisMonth: 0, soldThisWeek: 0, revenueThisWeek: 0, soldToday: 0, revenueToday: 0, trend: 0, revenue: 0, originalData: {} },
  { id: 4, itemType: 'food', name: 'Bắp Ngọt Lớn', category: 'Bắp Rang',  price: 60000, quantity: 89,  imageUrl: '/img/bapngot.jpg',      isAvailable: true,  soldThisMonth: 0, revenueThisMonth: 0, soldThisWeek: 0, revenueThisWeek: 0, soldToday: 0, revenueToday: 0, trend: 0, revenue: 0, originalData: {} },
  { id: 5, itemType: 'food', name: '7up',           category: 'Nước Uống', price: 35000, quantity: 90,  imageUrl: '/img/7up.jpg',          isAvailable: true,  soldThisMonth: 0, revenueThisMonth: 0, soldThisWeek: 0, revenueThisWeek: 0, soldToday: 0, revenueToday: 0, trend: 0, revenue: 0, originalData: {} },
  { id: 6, itemType: 'food', name: 'Sting',         category: 'Nước Uống', price: 35000, quantity: 86,  imageUrl: '/img/sting.jpg',        isAvailable: true,  soldThisMonth: 0, revenueThisMonth: 0, soldThisWeek: 0, revenueThisWeek: 0, soldToday: 0, revenueToday: 0, trend: 0, revenue: 0, originalData: {} },
  { id: 8, itemType: 'food', name: 'Pepsi',         category: 'Nước Uống', price: 35000, quantity: 96,  imageUrl: '/img/pepsi.jpg',        isAvailable: true,  soldThisMonth: 0, revenueThisMonth: 0, soldThisWeek: 0, revenueThisWeek: 0, soldToday: 0, revenueToday: 0, trend: 0, revenue: 0, originalData: {} },
  { id: 9, itemType: 'food', name: 'Mirinda Cam',   category: 'Nước Uống', price: 35000, quantity: 97,  imageUrl: '/img/MirindaCam.jpg',   isAvailable: true,  soldThisMonth: 0, revenueThisMonth: 0, soldThisWeek: 0, revenueThisWeek: 0, soldToday: 0, revenueToday: 0, trend: 0, revenue: 0, originalData: {} },
];

const MOCK_COMBOS = [
  { id: 1, itemType: 'combo', name: 'Combo Solo',   category: 'Combo', price: 100000, quantity: 96, imageUrl: '/img/combosolo.jpg',   isAvailable: false, soldThisMonth: 0, revenueThisMonth: 0, soldThisWeek: 0, revenueThisWeek: 0, soldToday: 0, revenueToday: 0, trend: 0, revenue: 0, originalData: { description: '1 bắp rang bơ cỡ vừa và 1 nước ngọt cỡ vừa' } },
  { id: 4, itemType: 'combo', name: 'Combo Couple', category: 'Combo', price: 139000, quantity: 98, imageUrl: '/img/combocouple.jpg', isAvailable: true,  soldThisMonth: 0, revenueThisMonth: 0, soldThisWeek: 0, revenueThisWeek: 0, soldToday: 0, revenueToday: 0, trend: 0, revenue: 0, originalData: { description: '1 bắp rang bơ cỡ lớn và 2 nước ngọt cỡ vừa' } },
  { id: 6, itemType: 'combo', name: 'Combo Family', category: 'Combo', price: 229000, quantity: 58, imageUrl: '/img/combofamily.jpg', isAvailable: true,  soldThisMonth: 0, revenueThisMonth: 0, soldThisWeek: 0, revenueThisWeek: 0, soldToday: 0, revenueToday: 0, trend: 0, revenue: 0, originalData: { description: '2 bắp rang bơ cỡ lớn và 4 nước ngọt cỡ vừa' } },
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
  
  // Filter category & status
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
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

  // Cinema filter
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [foodsData, combosData, bookingsData, ordersData, cinemasRes] = await Promise.all([
        fetchFoods().catch(() => null),
        fetchCombos().catch(() => null),
        fetchBookingsForInventory().catch(() => []),
        fetchOrdersForInventory().catch(() => []),
        fetch(`${import.meta.env.VITE_API_URL}/Cinemas`, {
          headers: {
            "Authorization": `${localStorage.getItem("tokenType") || "Bearer"} ${localStorage.getItem("token") || ""}`
          }
        }).then(r => r.ok ? r.json() : []).catch(() => [])
      ]);

      const rawCList = cinemasRes?.$values || cinemasRes?.data || (Array.isArray(cinemasRes) ? cinemasRes : []);
      const cList = Array.isArray(rawCList) && rawCList.length > 0
        ? rawCList
        : [
            { cinemaId: 1, name: "CinemaHCM Đồng Khởi" },
            { cinemaId: 2, name: "CinemaHN Hoàn Kiếm" },
            { cinemaId: 3, name: "CinemaDN Hải Châu" }
          ];
      setCinemas(cList);
      let activeCinemaId = selectedCinemaId;
      if (!activeCinemaId && cList.length > 0) {
        activeCinemaId = String(cList[0].cinemaId || cList[0].id);
        setSelectedCinemaId(activeCinemaId);
      }

      const { foodStatsMap, comboStatsMap } = calculateItemSales(bookingsData, ordersData, activeCinemaId);

      let qtyOverrides = {};
      try {
        qtyOverrides = JSON.parse(localStorage.getItem("inventory_qty_overrides") || "{}");
      } catch (e) {}

      const apiFoodMap = new Map();
      if (Array.isArray(foodsData)) {
        foodsData.forEach(f => {
          const fId = f.foodId ?? f.FoodId ?? f.id ?? f.Id;
          if (fId) apiFoodMap.set(String(fId), f);
        });
      }

      const allFoodsData = Array.isArray(foodsData) ? [...foodsData] : [];
      MOCK_FOODS.forEach(mockItem => {
        if (!apiFoodMap.has(String(mockItem.id))) {
          allFoodsData.push({
            foodId: mockItem.id,
            foodName: mockItem.name,
            category: mockItem.category,
            price: mockItem.price,
            quantity: mockItem.quantity,
            imageUrl: mockItem.imageUrl,
            isAvailable: mockItem.isAvailable
          });
        }
      });

      const normalizedFoods = allFoodsData.map(f => {
        const foodId = f.foodId ?? f.FoodId ?? f.id ?? f.Id;
        const stat = foodStatsMap.get(String(foodId)) || { month: 0, week: 0, today: 0 };
        const price = Number(f.price ?? f.Price ?? 0);
        
        const soldThisMonth = selectedCinemaId ? stat.month : Math.max(Number(f.soldThisMonth ?? f.SoldThisMonth ?? 0), stat.month);
        const soldThisWeek = selectedCinemaId ? stat.week : Math.max(Number(f.soldThisWeek ?? f.SoldThisWeek ?? 0), stat.week);
        const soldToday = selectedCinemaId ? stat.today : Math.max(Number(f.soldToday ?? f.SoldToday ?? 0), stat.today);

        const trend = soldThisMonth > 0 ? (Math.floor(Math.random() * 30) - 10) : 0;

        const rawQty = Number(f.quantity ?? f.Quantity ?? 0);
        const key = `food_${foodId}`;
        const finalQty = qtyOverrides[key] !== undefined
          ? Number(qtyOverrides[key])
          : rawQty;

        const rawAvail = f.isAvailable ?? f.IsAvailable;
        const isAvailable = (String(foodId) === "1")
          ? false
          : (rawAvail === undefined || rawAvail === null ? true : Boolean(rawAvail));

        return {
          id: foodId,
          itemType: 'food',
          name: f.foodName ?? f.FoodName ?? f.name,
          category: f.category ?? f.Category ?? "Khác",
          price: price,
          quantity: finalQty,
          imageUrl: f.imageUrl ?? f.ImageUrl ?? f.image,
          isAvailable: isAvailable,
          soldThisMonth: soldThisMonth,
          revenueThisMonth: soldThisMonth * price,
          soldThisWeek: soldThisWeek,
          revenueThisWeek: soldThisWeek * price,
          soldToday: soldToday,
          revenueToday: soldToday * price,
          trend: trend,
          revenue: soldThisMonth * price,
          originalData: f
        };
      });

      const apiComboMap = new Map();
      if (Array.isArray(combosData)) {
        combosData.forEach(c => {
          const cId = c.comboId ?? c.ComboId ?? c.id ?? c.Id;
          if (cId) apiComboMap.set(String(cId), c);
        });
      }

      const allCombosData = Array.isArray(combosData) ? [...combosData] : [];
      MOCK_COMBOS.forEach(mockItem => {
        if (!apiComboMap.has(String(mockItem.id))) {
          allCombosData.push({
            comboId: mockItem.id,
            comboName: mockItem.name,
            price: mockItem.price,
            quantity: mockItem.quantity,
            imageUrl: mockItem.imageUrl,
            isAvailable: mockItem.isAvailable,
            description: mockItem.originalData?.description || mockItem.category
          });
        }
      });

      const normalizedCombos = allCombosData.map(c => {
        const comboId = c.comboId ?? c.ComboId ?? c.id ?? c.Id;
        const stat = comboStatsMap.get(String(comboId)) || { month: 0, week: 0, today: 0 };
        const price = Number(c.price ?? c.Price ?? 0);

        const soldThisMonth = selectedCinemaId ? stat.month : Math.max(Number(c.soldThisMonth ?? c.SoldThisMonth ?? 0), stat.month);
        const soldThisWeek = selectedCinemaId ? stat.week : Math.max(Number(c.soldThisWeek ?? c.SoldThisWeek ?? 0), stat.week);
        const soldToday = selectedCinemaId ? stat.today : Math.max(Number(c.soldToday ?? c.SoldToday ?? 0), stat.today);

        const trend = soldThisMonth > 0 ? (Math.floor(Math.random() * 20) - 5) : 0;

        const rawQty = Number(c.quantity ?? c.Quantity ?? 0);
        const key = `combo_${comboId}`;
        const finalQty = qtyOverrides[key] !== undefined
          ? Number(qtyOverrides[key])
          : rawQty;

        const rawAvail = c.isAvailable ?? c.IsAvailable;
        const isAvailable = (String(comboId) === "1")
          ? false
          : (rawAvail === undefined || rawAvail === null ? true : Boolean(rawAvail));

        return {
          id: comboId,
          itemType: 'combo',
          name: c.comboName ?? c.ComboName ?? c.name,
          category: "Combo",
          price: price,
          quantity: finalQty,
          imageUrl: c.imageUrl ?? c.ImageUrl ?? c.image,
          isAvailable: isAvailable,
          soldThisMonth: soldThisMonth,
          revenueThisMonth: soldThisMonth * price,
          soldThisWeek: soldThisWeek,
          revenueThisWeek: soldThisWeek * price,
          soldToday: soldToday,
          revenueToday: soldToday * price,
          trend: trend,
          revenue: soldThisMonth * price,
          originalData: c
        };
      });

      setItems([...normalizedFoods, ...normalizedCombos].sort((a, b) => a.id - b.id));
    } catch (err) {
      setError(err.message || "Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCinemaId]);

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
          description: formData.category
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
      const key = `${selectedItem.itemType}_${selectedItem.id}`;
      try {
        const overrides = JSON.parse(localStorage.getItem("inventory_qty_overrides") || "{}");
        overrides[key] = Number(formData.quantity);
        localStorage.setItem("inventory_qty_overrides", JSON.stringify(overrides));
      } catch (e) {}

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
          category: selectedItem.originalData?.category || selectedItem.category,
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
          description: selectedItem.originalData?.description || selectedItem.category
        });
      }
      const key = `${selectedItem.itemType}_${selectedItem.id}`;
      try {
        const overrides = JSON.parse(localStorage.getItem("inventory_qty_overrides") || "{}");
        overrides[key] = newQuantity;
        localStorage.setItem("inventory_qty_overrides", JSON.stringify(overrides));
      } catch (e) {}

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
  const isMonth = timeFilter === 'month';
  const isWeek = timeFilter === 'week';
  const getSold = (item) => isMonth ? item.soldThisMonth : (isWeek ? item.soldThisWeek : item.soldToday);
  const getRev = (item) => isMonth ? item.revenueThisMonth : (isWeek ? item.revenueThisWeek : item.revenueToday);

  const totalStock = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalSold = items.reduce((sum, item) => sum + getSold(item), 0);
  const totalRevenue = items.reduce((sum, item) => sum + getRev(item), 0);
  
  // Top selling items
  const topSelling = [...items].filter(a => getSold(a) > 0).sort((a, b) => getSold(b) - getSold(a)).slice(0, 5);
  
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
    statusFilter, setStatusFilter,
    formData, setFormData, handleInputChange, handleFileChange, selectedItem,
    cinemas, selectedCinemaId, setSelectedCinemaId
  };
}
