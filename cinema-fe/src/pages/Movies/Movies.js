import { useEffect, useState } from "react";
import { getMovieList, getAreaList as getServiceAreaList } from "./moviesService.js";
import { getHomeShowtimes, getHomeCinemas, getHomeRooms } from "../home.js";

const API_URL = import.meta.env.VITE_API_URL;

/* =========================
   MOVIE STATUS / TABS
========================= */

export const MOVIE_STATUS = {
  now: "suất đang chiếu",
  coming: "suất sắp chiếu",
  special: "suất đặc biệt",
};

export const MOVIE_TABS = [
  {
    key: "now",
    label: "PHIM ĐANG CHIẾU",
    status: MOVIE_STATUS.now,
    tag: "HOT",
  },
  {
    key: "coming",
    label: "PHIM SẮP CHIẾU",
    status: MOVIE_STATUS.coming,
    tag: "SOON",
  },
  {
    key: "special",
    label: "SUẤT CHIẾU ĐẶC BIỆT",
    status: MOVIE_STATUS.special,
    tag: "SPECIAL",
  },
];

/* =========================
   API HELPER
========================= */

let movieCategoryCache = [];

function getToken() {
  return localStorage.getItem("token");
}

function getAuthHeaders() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readResponse(response) {
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("userEmail");

    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }

    throw new Error(MOVIES_TEXT.messages.sessionExpired);
  }

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.Message ||
        data?.title ||
        data?.Title ||
        text ||
        `Lỗi API: ${response.status}`
    );
  }

  return data;
}

export function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;

  return [];
}

async function fetchGet(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return readResponse(response);
}

/* =========================
   API MOVIES
========================= */

export async function getMoviesByTab(tabKey) {
  const tab = MOVIE_TABS.find((item) => item.key === tabKey);
  if (!tab) return [];

  // Gọi service lấy danh sách phim
  const data = await getMovieList();
  const list = normalizeArray(data);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Lọc phim theo trạng thái tab và ngày phát hành thực tế
  return list.filter((m) => {
    const status = (m.status || m.Status || m.movieStatus || m.MovieStatus || "").toLowerCase();
    
    const rawRelease = m.releaseDate || m.ReleaseDate || m.release_date || m.startDate || m.StartDate || m.openingDate || m.OpeningDate || m.premiereDate || m.PremiereDate;
    const releaseDate = rawRelease ? new Date(rawRelease) : null;
    const isReleased = releaseDate && !isNaN(releaseDate.getTime()) && releaseDate <= today;

    // Phim đang chiếu (now): có status đang chiếu HOẶC (sắp chiếu NHƯNG đã đến/qua ngày chiếu)
    if (tabKey === "now") {
      const matchesStatus = status.includes("đang chiếu") || status === "now";
      const autoPromoted = (status.includes("sắp chiếu") || status === "coming") && isReleased;
      return matchesStatus || autoPromoted;
    }

    // Phim sắp chiếu (coming): có status sắp chiếu VÀ chưa đến ngày chiếu
    if (tabKey === "coming") {
      const matchesStatus = status.includes("sắp chiếu") || status === "coming";
      const notYetReleased = !releaseDate || isNaN(releaseDate.getTime()) || releaseDate > today;
      return matchesStatus && notYetReleased;
    }

    return status.includes(tab.status.toLowerCase()) || status === tabKey;
  });
}

export async function getMovieCategories() {
  // Lấy danh sách phim để thu thập thể loại, hoặc trả về rỗng nếu không có API categories riêng biệt
  return [];
}

export async function getAreaList() {
  const data = await getServiceAreaList();
  return normalizeArray(data);
}

export async function loadMoviesInitialData() {
  const [categories, areas] = await Promise.all([
    getMovieCategories(),
    getAreaList(),
  ]);

  return {
    categories: normalizeArray(categories),
    areas: normalizeArray(areas),
  };
}

/* =========================
   LOCAL USER
========================= */

export function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

export function getMovieUserEmail() {
  const savedUser = getSavedUser();

  return (
    localStorage.getItem("userEmail") ||
    localStorage.getItem("email") ||
    savedUser.email ||
    savedUser.Email ||
    ""
  );
}

/* =========================
   AREA HELPER
========================= */

export function getAreaId(area) {
  return area?.areaId || area?.AreaId || area?.id || area?.Id;
}

export function getAreaName(area) {
  return (
    area?.areaName ||
    area?.AreaName ||
    area?.name ||
    area?.Name ||
    "Khu vực không tên"
  );
}

/* =========================
   MOVIE HELPER
========================= */

export function getMovieId(movie) {
  return movie?.movieId || movie?.MovieId || movie?.id || movie?.Id;
}

export function getMovieTitle(movie) {
  return (
    movie?.title ||
    movie?.Title ||
    movie?.name ||
    movie?.Name ||
    movie?.movieName ||
    movie?.MovieName ||
    movie?.movieTitle ||
    movie?.MovieTitle ||
    "Chưa có tên phim"
  );
}

export function getMovieImage(movie) {
  const image =
    movie?.posterUrl ||
    movie?.PosterUrl ||
    movie?.posterURL ||
    movie?.PosterURL ||
    movie?.img ||
    movie?.Img ||
    movie?.image ||
    movie?.Image ||
    movie?.imageUrl ||
    movie?.ImageUrl ||
    movie?.poster ||
    movie?.Poster ||
    "";

  if (!image) return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop";

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  if (image.startsWith("/")) {
    return image;
  }

  return `/img/${image}`;
}

export function getMovieAge(movie) {
  return (
    movie?.ageRating ||
    movie?.AgeRating ||
    movie?.age ||
    movie?.Age ||
    movie?.rated ||
    movie?.Rated ||
    movie?.rating ||
    movie?.Rating ||
    "P"
  );
}

export function getMovieTag(movie, activeTab = "now") {
  const currentTab = MOVIE_TABS.find((tab) => tab.key === activeTab);

  return movie?.tag || movie?.Tag || currentTab?.tag || "HOT";
}

export function getMovieStatus(movie, activeTab = "now") {
  const currentTab = MOVIE_TABS.find((tab) => tab.key === activeTab);

  return (
    movie?.status ||
    movie?.Status ||
    movie?.movieStatus ||
    movie?.MovieStatus ||
    movie?.showingStatus ||
    movie?.ShowingStatus ||
    movie?.statusName ||
    movie?.StatusName ||
    currentTab?.status ||
    "Đang cập nhật"
  );
}

export function getCategoryName(category) {
  return (
    category?.categoryName ||
    category?.CategoryName ||
    category?.name ||
    category?.Name ||
    category?.title ||
    category?.Title ||
    category?.description ||
    category?.Description ||
    ""
  );
}

export function getCategoryId(category) {
  return (
    category?.categoryId ||
    category?.CategoryId ||
    category?.id ||
    category?.Id ||
    category?.movieCategoryId ||
    category?.MovieCategoryId
  );
}

export function normalizeNestedArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.$values)) return value.$values;

  return [];
}

export function getMovieGenre(movie, categories = movieCategoryCache) {
  const rawCategoryArray =
    movie?.categories ||
    movie?.Categories ||
    movie?.movieCategories ||
    movie?.MovieCategories ||
    movie?.categoryList ||
    movie?.CategoryList;

  const categoryArray = normalizeNestedArray(rawCategoryArray);

  if (categoryArray.length > 0) {
    const categoryText = categoryArray
      .map((item) => {
        return (
          getCategoryName(item) ||
          getCategoryName(item.category) ||
          getCategoryName(item.Category) ||
          getCategoryName(item.movieCategory) ||
          getCategoryName(item.MovieCategory)
        );
      })
      .filter(Boolean)
      .join(", ");

    if (categoryText) return categoryText;
  }

  const rawMappings =
    movie?.movieCategoryMappings ||
    movie?.MovieCategoryMappings ||
    movie?.categoryMappings ||
    movie?.CategoryMappings;

  const mappings = normalizeNestedArray(rawMappings);

  if (mappings.length > 0) {
    const categoryText = mappings
      .map((mapping) => {
        const category =
          mapping.movieCategory ||
          mapping.MovieCategory ||
          mapping.category ||
          mapping.Category;

        const nameFromMapping =
          getCategoryName(category) || getCategoryName(mapping);

        if (nameFromMapping) return nameFromMapping;

        const categoryId =
          mapping.categoryId ||
          mapping.CategoryId ||
          mapping.movieCategoryId ||
          mapping.MovieCategoryId;

        if (categoryId) {
          const foundCategory = categories.find(
            (item) => String(getCategoryId(item)) === String(categoryId)
          );

          return getCategoryName(foundCategory);
        }

        return "";
      })
      .filter(Boolean)
      .join(", ");

    if (categoryText) return categoryText;
  }

  const rawCategoryIds =
    movie?.categoryIds ||
    movie?.CategoryIds ||
    movie?.movieCategoryIds ||
    movie?.MovieCategoryIds;

  const categoryIds = normalizeNestedArray(rawCategoryIds);

  if (categoryIds.length > 0) {
    const categoryText = categoryIds
      .map((id) => {
        const foundCategory = categories.find(
          (category) => String(getCategoryId(category)) === String(id)
        );

        return getCategoryName(foundCategory);
      })
      .filter(Boolean)
      .join(", ");

    if (categoryText) return categoryText;
  }

  const singleCategoryObj =
    movie?.movieCategory ||
    movie?.MovieCategory ||
    movie?.category ||
    movie?.Category;

  if (singleCategoryObj && typeof singleCategoryObj === "object") {
    const categoryName = getCategoryName(singleCategoryObj);

    if (categoryName) return categoryName;
  }

  const singleCategoryId =
    movie?.categoryId ||
    movie?.CategoryId ||
    movie?.movieCategoryId ||
    movie?.MovieCategoryId;

  if (singleCategoryId) {
    const foundCategory = categories.find(
      (category) => String(getCategoryId(category)) === String(singleCategoryId)
    );

    const categoryName = getCategoryName(foundCategory);

    if (categoryName) return categoryName;
  }

  const directCategory =
    movie?.categoryName ||
    movie?.CategoryName ||
    movie?.genre ||
    movie?.Genre;

  if (directCategory) return directCategory;

  return "Đang cập nhật";
}

export function getMovieDuration(movie) {
  const duration =
    movie?.duration ||
    movie?.Duration ||
    movie?.durationMinutes ||
    movie?.DurationMinutes ||
    movie?.runningTime ||
    movie?.RunningTime;

  if (duration && typeof duration === "string") {
    if (duration.toLowerCase().includes("phút")) {
      return duration;
    }

    return `${duration} phút`;
  }

  if (duration && typeof duration === "number") {
    return `${duration} phút`;
  }

  return "Đang cập nhật";
}

export function formatDate(dateValue) {
  if (!dateValue) return "Đang cập nhật";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Đang cập nhật";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

export function getMovieReleaseDate(movie) {
  return formatDate(
    movie?.releaseDate ||
      movie?.ReleaseDate ||
      movie?.release_date ||
      movie?.startDate ||
      movie?.StartDate ||
      movie?.openingDate ||
      movie?.OpeningDate ||
      movie?.premiereDate ||
      movie?.PremiereDate
  );
}

export function convertYoutubeToEmbed(url) {
  if (!url) return "";

  if (url.includes("youtube.com/embed/")) {
    return url;
  }

  if (url.includes("youtube.com/watch?v=")) {
    const videoId = url.split("watch?v=")[1]?.split("&")[0];

    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  }

  if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1]?.split("?")[0];

    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  }

  return url;
}

export function getMovieTrailer(movie) {
  const trailer =
    movie?.trailerUrl ||
    movie?.TrailerUrl ||
    movie?.trailerURL ||
    movie?.TrailerURL ||
    movie?.trailer ||
    movie?.Trailer ||
    movie?.videoUrl ||
    movie?.VideoUrl ||
    "";

  return convertYoutubeToEmbed(trailer);
}

/* =========================
   HOOK MOVIES
========================= */

export function useMovies() {
  const [activeTab, setActiveTab] = useState("now");
  const [movies, setMovies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [areas, setAreas] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [selectedTrailer, setSelectedTrailer] = useState(null);
  const [loading, setLoading] = useState(false);

  const userEmail = getMovieUserEmail();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchMoviesByTab(activeTab);
  }, [activeTab]);

  async function fetchInitialData() {
    try {
      const [initData, cinemaData, roomData] = await Promise.all([
        loadMoviesInitialData(),
        getHomeCinemas().catch(() => []),
        getHomeRooms().catch(() => []),
      ]);

      setCategories(initData.categories);
      setAreas(initData.areas);
      setCinemas(cinemaData);
      setRooms(roomData);

      movieCategoryCache = initData.categories;
    } catch (error) {
      console.error("Lỗi tải thông tin ban đầu:", error);

      setCategories([]);
      setAreas([]);
      setCinemas([]);
      setRooms([]);
      movieCategoryCache = [];
    }
  }

  async function fetchMoviesByTab(tabKey) {
    try {
      setLoading(true);

      const [apiMovies, showtimeData] = await Promise.all([
        getMoviesByTab(tabKey),
        getHomeShowtimes().catch((err) => {
          console.error("Lỗi tải danh sách suất chiếu:", err);
          return [];
        }),
      ]);

      console.log("Danh sách phim từ API:", apiMovies);

      setMovies(Array.isArray(apiMovies) ? apiMovies : []);
      setShowtimes(showtimeData);
    } catch (error) {
      console.error("Lỗi tải danh sách phim theo tab:", error);

      setMovies([]);
      setShowtimes([]);
    } finally {
      setLoading(false);
    }
  }

  function changeTab(tabName) {
    setActiveTab(tabName);
    setSelectedTrailer(null);
  }

  function handleAreaChange(areaId) {
    setSelectedAreaId(areaId);
  }

  function openTrailer(movie) {
    setSelectedTrailer(movie);
  }

  function closeTrailer() {
    setSelectedTrailer(null);
  }

  function getBookingLink(movie) {
    const movieId = getMovieId(movie);

    return `/booking?movie=${movieId}${
      selectedAreaId ? `&area=${selectedAreaId}` : ""
    }`;
  }

  function getMovieGenreWithCategories(movie) {
    return getMovieGenre(movie, categories);
  }

  function hasValidShowtimes(movie) {
    const movieId = getMovieId(movie);
    if (!movieId) return false;
    const now = new Date();

    const movieShowtimes = showtimes.filter((showtime) => {
      const showtimeMovieId =
        showtime?.movieId ??
        showtime?.MovieId ??
        showtime?.movie?.movieId ??
        showtime?.movie?.MovieId ??
        showtime?.Movie?.movieId ??
        showtime?.Movie?.MovieId;

      if (String(showtimeMovieId) !== String(movieId)) return false;

      const status = showtime?.status ?? showtime?.Status ?? "Chưa mở bán";
      const isCanceled = status === "Inactive" || status === "Hủy";
      if (isCanceled) return false;

      const startTimeStr = showtime?.startTime ?? showtime?.StartTime ?? "";
      const isPast = startTimeStr ? new Date(startTimeStr) < now : false;
      if (isPast) return false;

      return true;
    });

    return movieShowtimes.length > 0;
  }

  return {
    activeTab,
    setActiveTab,

    movies,
    setMovies,

    categories,
    setCategories,

    areas,
    setAreas,

    showtimes,
    setShowtimes,

    cinemas,
    setCinemas,

    rooms,
    setRooms,

    selectedAreaId,
    setSelectedAreaId,

    selectedTrailer,
    setSelectedTrailer,

    loading,
    setLoading,

    userEmail,

    changeTab,
    handleAreaChange,
    openTrailer,
    closeTrailer,
    getBookingLink,
    fetchInitialData,
    fetchMoviesByTab,
    hasValidShowtimes,

    getMovieGenre: getMovieGenreWithCategories,
  };
}