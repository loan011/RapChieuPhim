import { useEffect, useState, useMemo } from "react";
import {
  getMovieList,
  getMovieCategoryList,
  createMovie,
  updateMovie,
  deleteMovie,
} from "./movieService";

export const PAGE_SIZE = 5;

export const STATUS_OPTIONS = [
  "Đang chiếu",
  "Sắp chiếu",
  "Đã chiếu",
  "Chiếu sớm",
];

export const EMPTY_FORM = {
  title: "",
  genre: "",
  duration: "",
  director: "",
  releaseDate: "",
  status: "Đang chiếu",
  posterUrl: "",
  trailerUrl: "",
  ageRating: "P",
  description: "",
  language: "",
  subtitles: "",
};

/* ═══════════════════════════════════════════════════════════
   PURE HELPER FUNCTIONS
═══════════════════════════════════════════════════════════ */

export function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  return [];
}

export function getMovieId(movie) {
  return movie?.id ?? movie?.Id ?? movie?.movieId ?? movie?.MovieId;
}

export function getMovieTitle(movie) {
  return movie?.title ?? movie?.Title ?? movie?.movieTitle ?? movie?.MovieTitle ?? movie?.name ?? movie?.Name ?? "Chưa có tên";
}

export function getMovieDuration(movie) {
  const duration = movie?.duration ?? movie?.Duration ?? movie?.durationMinutes ?? movie?.DurationMinutes ?? movie?.runningTime ?? movie?.RunningTime;
  if (!duration) return "Chưa có";
  const text = String(duration);
  return text.toLowerCase().includes("phút") ? text : `${text} phút`;
}

export function getMovieDirector(movie) {
  return movie?.director ?? movie?.Director ?? "Chưa có";
}

export function getMovieReleaseDateRaw(movie) {
  return movie?.releaseDate ?? movie?.ReleaseDate ?? movie?.startDate ?? movie?.StartDate ?? movie?.openingDate ?? movie?.OpeningDate ?? movie?.premiereDate ?? movie?.PremiereDate ?? "";
}

export function formatDate(dateValue) {
  if (!dateValue) return "Chưa có";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    const split = String(dateValue).split("T")[0];
    if (split && split.includes("-")) {
      const [y, m, d] = split.split("-");
      return `${d}/${m}/${y}`;
    }
    return String(dateValue).split("T")[0] || "Chưa có";
  }
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function getMovieReleaseDate(movie) {
  return formatDate(getMovieReleaseDateRaw(movie));
}

export function getMoviePoster(movie) {
  const poster = movie?.posterUrl ?? movie?.PosterUrl ?? movie?.posterURL ?? movie?.PosterURL ?? movie?.imageUrl ?? movie?.ImageUrl ?? movie?.image ?? movie?.Image ?? "";
  return poster || "/img/no-image.png";
}

export function getMovieAgeRating(movie) {
  return movie?.ageRating ?? movie?.AgeRating ?? movie?.limitAge ?? movie?.LimitAge ?? movie?.restriction ?? "P";
}

export function getMovieStatusDisplayName(movie) {
  const rawStatus = (movie?.status ?? movie?.Status ?? movie?.movieStatus ?? movie?.MovieStatus ?? "").toLowerCase();
  if (rawStatus.includes("đang chiếu") || rawStatus === "now" || rawStatus.includes("đang bán") || rawStatus === "active") {
    return "Đang chiếu";
  }
  if (rawStatus.includes("sắp chiếu") || rawStatus === "coming") {
    return "Sắp chiếu";
  }
  if (rawStatus.includes("đã chiếu") || rawStatus === "completed") {
    return "Đã chiếu";
  }
  if (rawStatus.includes("chiếu sớm")) {
    return "Chiếu sớm";
  }
  // Auto-promote or default based on release date if status is unclear
  const rawRelease = getMovieReleaseDateRaw(movie);
  if (rawRelease) {
    const releaseDt = new Date(rawRelease);
    if (!isNaN(releaseDt.getTime()) && releaseDt <= new Date()) {
      return "Đang chiếu";
    }
  }
  return "Sắp chiếu";
}

export function getCategoryId(category) {
  return category?.categoryId ?? category?.CategoryId ?? category?.id ?? category?.Id;
}

export function getCategoryName(category) {
  if (!category) return "";
  if (typeof category === "string") return category;
  return category?.categoryName ?? category?.CategoryName ?? category?.name ?? category?.Name ?? category?.category?.categoryName ?? category?.category?.CategoryName ?? category?.Category?.categoryName ?? category?.Category?.CategoryName ?? "";
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
      category?.movies ?? category?.Movies ?? category?.movieList ?? category?.MovieList
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

  const directGenre = movie?.genre ?? movie?.Genre ?? movie?.categoryName ?? movie?.CategoryName;
  if (directGenre) return directGenre;

  const categoryNames = normalizeNestedArray(movie?.categoryNames ?? movie?.CategoryNames);
  if (categoryNames.length > 0) {
    return categoryNames.join(", ");
  }

  const categories = normalizeNestedArray(movie?.categories ?? movie?.Categories);
  if (categories.length > 0) {
    const names = categories.map(getCategoryName).filter(Boolean);
    if (names.length > 0) return names.join(", ");
  }

  const categoryIds = normalizeNestedArray(movie?.categoryIds ?? movie?.CategoryIds);
  if (categoryIds.length > 0) {
    const names = categoryIds.map((id) => categoryMap[id]).filter(Boolean);
    if (names.length > 0) return names.join(", ");
  }

  const mappings = normalizeNestedArray(movie?.movieCategoryMappings ?? movie?.MovieCategoryMappings ?? movie?.movieCategories ?? movie?.MovieCategories);
  if (mappings.length > 0) {
    const names = mappings.map((item) => {
      const id = item?.categoryId ?? item?.CategoryId ?? item?.movieCategoryId ?? item?.MovieCategoryId ?? item?.category?.categoryId ?? item?.category?.CategoryId ?? item?.Category?.categoryId ?? item?.Category?.CategoryId;
      return item?.category?.categoryName ?? item?.category?.CategoryName ?? item?.Category?.categoryName ?? item?.Category?.CategoryName ?? item?.categoryName ?? item?.CategoryName ?? categoryMap[id];
    }).filter(Boolean);
    if (names.length > 0) return names.join(", ");
  }

  const movieId = getMovieId(movie);
  if (movieId != null && movieCategoryMap[movieId]?.length > 0) {
    return movieCategoryMap[movieId].join(", ");
  }

  return "Chưa có";
}

/* ═══════════════════════════════════════════════════════════
   useFilm HOOK
═══════════════════════════════════════════════════════════ */

export function useFilm() {
  const [list, setList] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [movieCategoryMap, setMovieCategoryMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);

  // Form add/edit states
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  /* ── Stats calculations (based on full list) ── */
  const totalCount = list.length;
  const nowShowingCount = useMemo(() => {
    return list.filter((m) => getMovieStatusDisplayName(m) === "Đang chiếu").length;
  }, [list]);
  const comingSoonCount = useMemo(() => {
    return list.filter((m) => getMovieStatusDisplayName(m) === "Sắp chiếu").length;
  }, [list]);

  /* ── Filter list ── */
  const filtered = useMemo(() => {
    const kw = search.toLowerCase().trim();
    return list.filter((movie) => {
      const title = getMovieTitle(movie).toLowerCase();
      const genre = getMovieGenre(movie, categoryMap, movieCategoryMap).toLowerCase();
      const status = getMovieStatusDisplayName(movie).toLowerCase();

      const matchSearch = !kw || title.includes(kw) || genre.includes(kw);
      const matchStatus = filterStatus ? status === filterStatus.toLowerCase() : true;

      return matchSearch && matchStatus;
    });
  }, [list, search, filterStatus, categoryMap, movieCategoryMap]);

  /* ── Pagination ── */
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)), [filtered]);
  const safePage = useMemo(() => Math.min(page, totalPages), [page, totalPages]);
  const pageItems = useMemo(() => {
    return filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  }, [filtered, safePage]);

  /* ── Handlers ── */
  async function handleDelete(id) {
    if (!id) {
      alert("Không tìm thấy ID phim");
      return;
    }
    if (!window.confirm("Bạn có chắc muốn xóa phim này?")) return;

    try {
      await deleteMovie(id);
      setList((prev) => prev.filter((movie) => String(getMovieId(movie)) !== String(id)));
    } catch (err) {
      alert(err?.message || "Xóa phim thất bại");
    }
  }

  function openAddModal() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(movie) {
    const rawRelease = getMovieReleaseDateRaw(movie);
    let releaseDateStr = "";
    if (rawRelease) {
      // format to YYYY-MM-DD for date input
      const date = new Date(rawRelease);
      if (!isNaN(date.getTime())) {
        releaseDateStr = date.toISOString().split("T")[0];
      } else {
        releaseDateStr = String(rawRelease).split("T")[0];
      }
    }

    setEditId(getMovieId(movie));
    setForm({
      title: getMovieTitle(movie),
      genre: getMovieGenre(movie, categoryMap, movieCategoryMap),
      duration: String(movie?.duration ?? movie?.Duration ?? movie?.durationMinutes ?? movie?.DurationMinutes ?? ""),
      director: getMovieDirector(movie),
      releaseDate: releaseDateStr,
      status: getMovieStatusDisplayName(movie),
      posterUrl: getMoviePoster(movie) === "/img/no-image.png" ? "" : getMoviePoster(movie),
      trailerUrl: movie?.trailerUrl ?? movie?.TrailerUrl ?? movie?.trailerURL ?? movie?.TrailerURL ?? "",
      ageRating: getMovieAgeRating(movie),
      description: movie?.description ?? movie?.Description ?? "",
      language: movie?.language ?? movie?.Language ?? "",
      subtitles: movie?.subtitles ?? movie?.Subtitles ?? "",
    });
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleGenreSelect(e) {
    const selectedVal = e.target.value;
    if (!selectedVal) return;

    setForm((prev) => {
      const currentGenres = prev.genre
        ? prev.genre.split(",").map((g) => g.trim()).filter(Boolean)
        : [];
      if (!currentGenres.includes(selectedVal)) {
        currentGenres.push(selectedVal);
      }
      return {
        ...prev,
        genre: currentGenres.join(", "),
      };
    });
    
    // Clear value to allow selecting again
    e.target.value = "";
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        posterUrl: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!form.title.trim()) {
      setFormError("Vui lòng nhập tên phim.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      genre: form.genre.trim(),
      duration: form.duration ? Number(form.duration) : null,
      director: form.director.trim(),
      releaseDate: form.releaseDate || null,
      status: form.status,
      posterUrl: form.posterUrl.trim() || null,
      trailerUrl: form.trailerUrl.trim() || null,
      ageRating: form.ageRating,
      description: form.description.trim(),
      language: form.language.trim(),
      subtitles: form.subtitles.trim(),
    };

    try {
      setSubmitting(true);
      if (editId !== null) {
        await updateMovie(editId, payload);
      } else {
        await createMovie(payload);
      }
      closeModal();
      fetchData();
    } catch (err) {
      console.error("Lỗi lưu phim:", err);
      setFormError(err?.message || "Lưu thông tin phim thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  const categoryOptions = useMemo(() => {
    return Object.entries(categoryMap).map(([id, name]) => ({
      id,
      name,
    }));
  }, [categoryMap]);

  function getMovieGenreText(movie) {
    return getMovieGenre(movie, categoryMap, movieCategoryMap);
  }

  return {
    list,
    loading,
    error,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    page,
    setPage,
    pageItems,
    totalPages,
    safePage,
    filtered,

    /* Stats */
    totalCount,
    nowShowingCount,
    comingSoonCount,

    /* Form add/edit */
    showModal,
    editId,
    form,
    formError,
    submitting,
    categoryOptions,
    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleGenreSelect,
    handleFileChange,
    handleSubmit,
    handleDelete,
    getMovieGenreText,
  };
}