// Combo Service for Staff combo sales simulation
export async function getCombosList() {
  return [
    {
      id: 1,
      name: "Combo Solo",
      description: "1 Bắp ngọt lớn + 1 Nước ngọt lớn (Coke/Pepsi/Fanta)",
      price: 85000,
      image: "🍿🥤"
    },
    {
      id: 2,
      name: "Combo Couple",
      description: "1 Bắp ngọt lớn + 2 Nước ngọt lớn (Coke/Pepsi/Fanta)",
      price: 115000,
      image: "🍿🥤🥤"
    },
    {
      id: 3,
      name: "Combo Family",
      description: "2 Bắp ngọt lớn + 3 Nước ngọt lớn + 1 Snack Khoai tây",
      price: 185000,
      image: "🍿🍿🥤🥤🥤"
    },
    {
      id: 4,
      name: "Bắp Ngọt Lớn",
      description: "Bắp ngọt giòn thơm nóng hổi cỡ lớn",
      price: 60000,
      image: "🍿"
    },
    {
      id: 5,
      name: "Nước Ngọt Lớn",
      description: "Ly nước ngọt 32oz mát lạnh (Coca, Pepsi, Sprite)",
      price: 35000,
      image: "🥤"
    }
  ];
}
export async function sellCombo(payload) {
  // Simulate API POST request
  const orderId = Math.floor(Math.random() * 90000) + 10000;
  const newOrder = {
    success: true,
    id: `CB${orderId}`,
    orderId: orderId,
    customerName: payload.customerName,
    items: payload.items,
    totalAmount: payload.totalAmount,
    time: new Date().toLocaleString("vi-VN"),
    date: new Date().toLocaleDateString("en-CA"), // YYYY-MM-DD
    createdAt: new Date().toISOString()
  };

  // Save to localStorage so Daily Revenue dashboard can access it
  const localOrdersStr = localStorage.getItem("simulated_orders") || "[]";
  const localOrders = JSON.parse(localOrdersStr);
  localOrders.push(newOrder);
  localStorage.setItem("simulated_orders", JSON.stringify(localOrders));

  return newOrder;
}
