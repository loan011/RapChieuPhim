import {
  getApiUrl,
  readResponse,
  getErrorMessage,
  getAuthHeaders,
} from "../../../services/apiHelper";

function generateMockSeats(roomId) {
  const seats = [];
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  let idCounter = 1;
  rows.forEach((row) => {
    const isCoupleRow = row === "I" || row === "J";
    const seatCount = isCoupleRow ? 20 : 16;
    for (let col = 1; col <= seatCount; col++) {
      let seatType = "Standard";
      if (isCoupleRow) seatType = "Couple";
      else if (row === "E" || row === "F" || row === "G") seatType = "VIP";

      seats.push({
        seatId: idCounter++,
        roomId,
        seatRow: row,
        seatNumber: `${row}${col}`,
        seatType,
        isAvailable: true,
      });
    }
  });
  return seats;
}

const API_URL = getApiUrl();

function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.$values)) return data.data.$values;
  return [];
}

export async function getMovieList() {
  const response = await fetch(`${API_URL}/Movies`, {
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Lấy danh sách phim thất bại!"));
  }

  return normalizeArray(data);
}

export async function getShowtimeList() {
  const response = await fetch(`${API_URL}/Showtimes`, {
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Lấy danh sách suất chiếu thất bại!")
    );
  }

  return normalizeArray(data);
}

export async function getShowtimeDetailList() {
  const response = await fetch(`${API_URL}/Showtimes`, {
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Lấy danh sách suất chiếu thất bại!")
    );
  }

  return normalizeArray(data);
}

export async function getSeatsByRoomId(roomId) {
  const response = await fetch(`${API_URL}/Seats/ByRoom/${roomId}`, {
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Lấy sơ đồ ghế thất bại!"));
  }

  const seats = normalizeArray(data);

  if (seats.length === 0) {
    return generateMockSeats(roomId);
  }

  return seats;
}

export async function getAvailableSeats(showtimeId) {
  const response = await fetch(
    `${API_URL}/Bookings/AvailableSeats/${showtimeId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Lấy danh sách ghế trống thất bại!")
    );
  }

  return normalizeArray(data);
}

export async function createBooking(payload) {
  const response = await fetch(`${API_URL}/Bookings`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Đặt vé thất bại!"));
  }

  return data?.data || data;
}

export async function getRoomList() {
  const response = await fetch(`${API_URL}/Rooms`, {
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Lấy danh sách phòng thất bại!")
    );
  }

  return normalizeArray(data);
}

export async function getCombosAndFoodsList() {
  let combosData = [];
  let foodsData = [];

  try {
    const res = await fetch(`${API_URL}/Combos/Available`, { headers: getAuthHeaders() });
    const data = await readResponse(res);
    combosData = normalizeArray(data);
  } catch (err) {
    console.warn("Failed to load combos:", err);
  }

  try {
    const res = await fetch(`${API_URL}/Foods/Available`, { headers: getAuthHeaders() });
    const data = await readResponse(res);
    foodsData = normalizeArray(data);
  } catch (err) {
    console.warn("Failed to load foods:", err);
  }

  const combos = combosData.map(c => ({
    id: c.comboId ?? c.ComboId,
    type: "combo",
    name: c.comboName ?? c.ComboName ?? "",
    description: c.description ?? c.Description ?? "",
    price: Number(c.price ?? c.Price ?? 0),
    image: c.imageUrl ?? c.ImageUrl ?? "🍿",
    category: "combo",
  }));

  const foods = foodsData.map(f => ({
    id: f.foodId ?? f.FoodId,
    type: "food",
    name: f.foodName ?? f.FoodName ?? "",
    description: f.category ?? f.Category ?? "",
    price: Number(f.price ?? f.Price ?? 0),
    image: f.imageUrl ?? f.ImageUrl ?? "🥤",
    category: (f.category ?? f.Category ?? "").toLowerCase().includes("nước") || (f.category ?? f.Category ?? "").toLowerCase().includes("uống") ? "drink" : "food",
  }));

  if (combos.length === 0 && foods.length === 0) {
    return [
      { id: 1, type: "combo", name: "Combo Solo", description: "1 Bắp ngọt lớn + 1 Nước ngọt lớn", price: 85000, image: "🍿🥤", category: "combo" },
      { id: 2, type: "combo", name: "Combo Couple", description: "1 Bắp ngọt lớn + 2 Nước ngọt lớn", price: 115000, image: "🍿🥤🥤", category: "combo" },
      { id: 3, type: "combo", name: "Combo Family", description: "2 Bắp ngọt lớn + 3 Nước ngọt lớn", price: 185000, image: "🍿🍿🥤🥤🥤", category: "combo" },
      { id: 4, type: "food", name: "Bắp Ngọt Lớn", description: "Bắp ngọt giòn thơm cỡ lớn", price: 60000, image: "🍿", category: "food" },
      { id: 5, type: "food", name: "Nước Ngọt Lớn", description: "Ly nước ngọt 32oz mát lạnh", price: 35000, image: "🥤", category: "drink" }
    ];
  }

  return [...combos, ...foods];
}