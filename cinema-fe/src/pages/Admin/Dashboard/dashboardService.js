import {
  getApiUrl,
  readResponse,
  getErrorMessage,
  getAuthHeaders,
} from "../../../services/apiHelper";

const API_URL = getApiUrl();

async function apiGet(path, fallbackMessage) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, fallbackMessage));
  }

  return data;
}

export async function getDashboardStats(filter, cinemaId = "") {
  const cinemaParam = cinemaId ? `&cinemaId=${cinemaId}` : "";
  return apiGet(
    `/Dashboard/Stats?filter=${filter}${cinemaParam}`,
    "Lấy số liệu tổng quan thất bại!"
  );
}

export async function getRecentTickets() {
  return apiGet(
    "/Dashboard/RecentTickets",
    "Lấy danh sách vé gần đây thất bại!"
  );
}

export async function getRevenueChart(filter, cinemaId = "") {
  const cinemaParam = cinemaId ? `&cinemaId=${cinemaId}` : "";
  return apiGet(
    `/Dashboard/RevenueChart?filter=${filter}${cinemaParam}`,
    "Lấy dữ liệu biểu đồ thất bại!"
  );
}

export async function getMovieStats(filter, cinemaId = "") {
  const cinemaParam = cinemaId ? `&cinemaId=${cinemaId}` : "";
  return apiGet(
    `/Dashboard/MovieStats?filter=${filter}${cinemaParam}`,
    "Lấy thống kê phim thất bại!"
  );
}

export async function getCinemas() {
  return apiGet(
    "/Cinemas",
    "Lấy danh sách rạp thất bại!"
  );
}

export async function getMovieDetailStats(movieId) {
  return apiGet(
    `/Dashboard/MovieDetailStats/${movieId}`,
    "Lấy thống kê chi tiết phim thất bại!"
  );
}

export async function getMovies() {
  return apiGet(
    "/Movies",
    "Lấy danh sách phim thất bại!"
  );
}

export async function getDashboardFoodSources() {
  let orders = [];

  // Đồng bộ các order giả lập bán trực tiếp tại quầy (nếu có trong localStorage)
  try {
    const localStr = localStorage.getItem("simulated_orders");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const defaultCinemaId = user?.cinemaId || user?.CinemaId || 1;
    if (localStr) {
      const localOrders = JSON.parse(localStr);
      if (Array.isArray(localOrders)) {
        localOrders.forEach(lo => {
          orders.push({
            ...lo,
            orderDate: lo.date || lo.orderDate,
            status: "Success",
            cinemaId: lo.cinemaId || lo.CinemaId || defaultCinemaId
          });
        });
      }
    }
  } catch (e) {}

  return { orders };
}
