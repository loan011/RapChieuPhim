import { useEffect, useState } from "react";

import {
  getMovieList,
  getMovieCategoryList,
  createMovie,
  updateMovie,
  deleteMovie,
} from "./movieService";

export const EMPTY_FORM = {
  title: "",
  description: "",
  duration: "",
  director: "",
  actors: "",
  language: "",
  subtitles: "",
  ageRating: "",
  releaseDate: "",
  endDate: "",
  posterUrl: "",
  trailerUrl: "",
  status: "suất sắp chiếu",
  categoryIds: [],
};

export const STATUS_OPTIONS = [
  "suất đang chiếu",
  "suất sắp chiếu",
  "suất đặc biệt",
  "ngừng chiếu",
];



export function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;

  return [];
}

export function getMovieId(movie) {
  return (
    movie?.id ??
    movie?.Id ??
    movie?.movieId ??
    movie?.MovieId
  );
}

export function getMovieTitle(movie) {
  return (
    movie?.title ??
    movie?.Title ??
    movie?.movieTitle ??
    movie?.MovieTitle ??
    movie?.name ??
    movie?.Name ??
    "Chưa có tên"
  );
}

export function getMovieDuration(movie) {
  const duration =
    movie?.duration ??
    movie?.Duration ??
    movie?.durationMinutes ??
    movie?.DurationMinutes ??
    movie?.runningTime ??
    movie?.RunningTime;

  if (!duration) return "Chưa có";

  const text = String(duration);

  if (text.toLowerCase().includes("phút")) {
    return text;
  }

  return `${text} phút`;
}

export function getMovieDirector(movie) {
  return (
    movie?.director ??
    movie?.Director ??
    "Chưa có"
  );
}

export function getMovieStatus(movie) {
  return (
    movie?.status ??
    movie?.Status ??
    movie?.movieStatus ??
    movie?.MovieStatus ??
    "Chưa có"
  );
}

export function getMovieReleaseDateRaw(movie) {
  return (
    movie?.releaseDate ??
    movie?.ReleaseDate ??
    movie?.startDate ??
    movie?.StartDate ??
    movie?.openingDate ??
    movie?.OpeningDate ??
    movie?.premiereDate ??
    movie?.PremiereDate ??
    ""
  );
}

export function formatDate(dateValue) {
  if (!dateValue) return "Chưa có";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue).split("T")[0] || "Chưa có";
  }

  return date.toISOString().split("T")[0];
}

export function getMovieReleaseDate(movie) {
  return formatDate(getMovieReleaseDateRaw(movie));
}

export function getCategoryId(category) {
  return (
    category?.categoryId ??
    category?.CategoryId ??
    category?.id ??
    category?.Id
  );
}

export function getCategoryName(category) {
  if (!category) return "";
  if (typeof category === "string") return category;

  return (
    category?.categoryName ??
    category?.CategoryName ??
    category?.name ??
    category?.Name ??
    category?.category?.categoryName ??
    category?.category?.CategoryName ??
    category?.Category?.categoryName ??
    category?.Category?.CategoryName ??
    ""
  );
}

export function normalizeNestedArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.$values)) return value.$values;

  return [];
}

export function buildCategoryMaps(categories) {
  const categoryMap = {};
  const movieCategoryMap = {};

  normalizeArray(categories).forEach((category) => {
    const categoryId = getCategoryId(category);
    const categoryName = getCategoryName(category);

    if (categoryId != null && categoryName) {
      categoryMap[categoryId] = categoryName;
    }

    const categoryMovies = normalizeNestedArray(
      category?.movies ??
        category?.Movies ??
        category?.movieList ??
        category?.MovieList
    );

    categoryMovies.forEach((movie) => {
      const movieId = getMovieId(movie);

      if (movieId != null && categoryName) {
        if (!movieCategoryMap[movieId]) {
          movieCategoryMap[movieId] = [];
        }

        movieCategoryMap[movieId].push(categoryName);
      }
    });
  });

  return {
    categoryMap,
    movieCategoryMap,
  };
}

export function getMovieGenre(movie, categoryMap = {}, movieCategoryMap = {}) {
  if (!movie) return "Chưa có";

  const directGenre =
    movie?.genre ??
    movie?.Genre ??
    movie?.categoryName ??
    movie?.CategoryName;

  if (directGenre) return directGenre;

  const categoryNames = normalizeNestedArray(
    movie?.categoryNames ?? movie?.CategoryNames
  );

  if (categoryNames.length > 0) {
    return categoryNames.join(", ");
  }

  const categories = normalizeNestedArray(
    movie?.categories ?? movie?.Categories
  );

  if (categories.length > 0) {
    const names = categories.map(getCategoryName).filter(Boolean);

    if (names.length > 0) {
      return names.join(", ");
    }
  }

  const categoryIds = normalizeNestedArray(
    movie?.categoryIds ?? movie?.CategoryIds
  );

  if (categoryIds.length > 0) {
    const names = categoryIds
      .map((id) => categoryMap[id])
      .filter(Boolean);

    if (names.length > 0) {
      return names.join(", ");
    }
  }

  const mappings = normalizeNestedArray(
    movie?.movieCategoryMappings ??
      movie?.MovieCategoryMappings ??
      movie?.movieCategories ??
      movie?.MovieCategories
  );

  if (mappings.length > 0) {
    const names = mappings
      .map((item) => {
        const id =
          item?.categoryId ??
          item?.CategoryId ??
          item?.movieCategoryId ??
          item?.MovieCategoryId ??
          item?.category?.categoryId ??
          item?.category?.CategoryId ??
          item?.Category?.categoryId ??
          item?.Category?.CategoryId;

        return (
          item?.category?.categoryName ??
          item?.category?.CategoryName ??
          item?.Category?.categoryName ??
          item?.Category?.CategoryName ??
          item?.categoryName ??
          item?.CategoryName ??
          categoryMap[id]
        );
      })
      .filter(Boolean);

    if (names.length > 0) {
      return names.join(", ");
    }
  }

  const movieId = getMovieId(movie);

  if (movieId != null && movieCategoryMap[movieId]?.length > 0) {
    return movieCategoryMap[movieId].join(", ");
  }

  return "Chưa có";
}

export function filterMovieList({
  list,
  search,
  filterStatus,
  categoryMap,
  movieCategoryMap,
}) {
  const keyword = search.toLowerCase().trim();

  return list.filter((movie) => {
    const title = getMovieTitle(movie).toLowerCase();

    const genre = getMovieGenre(
      movie,
      categoryMap,
      movieCategoryMap
    ).toLowerCase();

    const status = getMovieStatus(movie).toLowerCase();

    const matchSearch =
      !keyword || title.includes(keyword) || genre.includes(keyword);

    const matchStatus = filterStatus
      ? status === filterStatus.toLowerCase()
      : true;

    return matchSearch && matchStatus;
  });
}

export function useFilm() {
  const [list, setList] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [movieCategoryMap, setMovieCategoryMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const [movies, categories] = await Promise.all([
        getMovieList(),
        getMovieCategoryList(),
      ]);

      console.log("MOVIE API DATA:", movies);
      console.log("CATEGORY API DATA:", categories);

      const maps = buildCategoryMaps(categories);

      setCategoryMap(maps.categoryMap);
      setMovieCategoryMap(maps.movieCategoryMap);
      setList(normalizeArray(movies));
    } catch (err) {
      console.error("Lỗi tải danh sách phim:", err);

      setError(err.message || "Không tải được danh sách phim");
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!id) {
      alert("Không tìm thấy ID phim");
      return;
    }

    if (!window.confirm("Bạn có chắc muốn xóa phim này?")) return;

    try {
      await deleteMovie(id);

      setList((prev) =>
        prev.filter((movie) => String(getMovieId(movie)) !== String(id))
      );
    } catch (err) {
      alert(err?.message || "Xóa phim thất bại");
    }
  }

  function handleAddClick() {
    setEditId(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function handleEditClick(id) {
    const movie = list.find((m) => String(getMovieId(m)) === String(id));
    if (!movie) return;
    setEditId(id);
    setFormData({
      title: movie.title || movie.Title || "",
      duration: movie.duration || movie.Duration || movie.durationMinutes || "",
      director: movie.director || movie.Director || "",
      releaseDate: getMovieReleaseDateRaw(movie) ? String(getMovieReleaseDateRaw(movie)).split("T")[0] : "",
      status: movie.status || movie.Status || "suất sắp chiếu",
      description: movie.description || movie.Description || "",
      posterUrl: movie.posterUrl || movie.PosterUrl || movie.thumbnail || movie.Thumbnail || "",
      trailerUrl: movie.trailerUrl || movie.TrailerUrl || "",
      categoryIds: [],
    });
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setFormData(EMPTY_FORM);
    setFormError("");
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleCategoryToggle(id) {
    setFormData((prev) => {
      const ids = prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id];
      return { ...prev, categoryIds: ids };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError("Tên phim không được để trống.");
      return;
    }
    try {
      setFormLoading(true);
      setFormError("");
      // Validate URL length
      if (formData.posterUrl && formData.posterUrl.length > 500) {
        setFormError("URL ảnh bìa quá dài (tối đa 500 ký tự). Hãy dùng link ảnh trực tiếp thay vì link tìm kiếm.");
        setFormLoading(false);
        return;
      }
      if (formData.trailerUrl && formData.trailerUrl.length > 500) {
        setFormError("URL trailer quá dài (tối đa 500 ký tự).");
        setFormLoading(false);
        return;
      }
      // Lấy userId từ localStorage
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userId =
        currentUser?.userId ??
        currentUser?.UserId ??
        currentUser?.id ??
        currentUser?.Id ??
        null;
      const payload = {
        ...formData,
        duration: formData.duration ? Number(formData.duration) : null,
        releaseDate: formData.releaseDate || null,
        endDate: formData.endDate || null,
        categoryIds: formData.categoryIds.map(Number),
        // Gửi cả createdBy để backend có thể nhận (nếu model bind trực tiếp)
        ...(userId != null ? { createdBy: Number(userId) } : {}),
      };
      if (editId) {
        await updateMovie(editId, payload);
      } else {
        await createMovie(payload);
      }
      closeModal();
      fetchData();
    } catch (err) {
      setFormError(err?.message || "Lưu phim thất bại.");
    } finally {
      setFormLoading(false);
    }
  }

  function getMovieGenreText(movie) {
    return getMovieGenre(movie, categoryMap, movieCategoryMap);
  }

  const filtered = filterMovieList({
    list,
    search,
    filterStatus,
    categoryMap,
    movieCategoryMap,
  });

  return {
    list,
    setList,

    categoryMap,
    setCategoryMap,

    movieCategoryMap,
    setMovieCategoryMap,

    loading,
    setLoading,

    error,
    setError,

    search,
    setSearch,

    filterStatus,
    setFilterStatus,

    filtered,

    fetchData,
    handleDelete,
    handleAddClick,
    handleEditClick,
    closeModal,
    handleChange,
    handleCategoryToggle,
    handleSubmit,
    showModal,
    editId,
    formData,
    formLoading,
    formError,
    getMovieGenreText,
  };
}
