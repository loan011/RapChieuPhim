import "./Film.css";
import { useEffect, useState } from "react";
import {
  getMovieList,
  createMovie,
  updateMovie,
  deleteMovie,
} from "./movieService";
import { getMovieCategories } from "../../Movies/useMovies.js";

const STATUS_OPTIONS = [
  { value: "suất đang chiếu", label: "Đang chiếu" },
  { value: "suất sắp chiếu", label: "Sắp chiếu" },
  { value: "suất đặc biệt", label: "Suất đặc biệt" },
];

const AGE_RATINGS = [
  { value: "P", label: "P - Mọi độ tuổi" },
  { value: "K", label: "K - Dưới 13 tuổi cần người bảo hộ" },
  { value: "T13", label: "T13 - Từ 13 tuổi trở lên" },
  { value: "T16", label: "T16 - Từ 16 tuổi trở lên" },
  { value: "T18", label: "T18 - Từ 18 tuổi trở lên" },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  duration: 120,
  director: "",
  actors: "",
  language: "Tiếng Việt",
  subtitles: "Không",
  ageRating: "P",
  releaseDate: "",
  endDate: "",
  posterUrl: "",
  trailerUrl: "",
  status: "suất đang chiếu",
  categoryIds: [],
};

export default function Phim() {
  const [list, setList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  function unwrapList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.$values)) return data.$values;
    return [];
  }

  function formatDate(dateValue) {
    if (!dateValue) return "—";
    return String(dateValue).split("T")[0];
  }

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const [movieData, categoryData] = await Promise.all([
        getMovieList(),
        getMovieCategories(),
      ]);

      setList(unwrapList(movieData));
      setCategories(unwrapList(categoryData));
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu phim.");
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(movie) {
    const movieId = movie.movieId ?? movie.MovieId ?? movie.id ?? movie.Id;
    const movieCategories = movie.categories ?? movie.Categories ?? [];
    const categoryList = unwrapList(movieCategories);

    const categoryIds = categoryList
      .map((c) => c.categoryId ?? c.CategoryId ?? c.id ?? c.Id)
      .filter(Boolean)
      .map(Number);

    setEditId(movieId);
    setForm({
      title: movie.title ?? movie.Title ?? "",
      description: movie.description ?? movie.Description ?? "",
      duration: movie.duration ?? movie.Duration ?? 120,
      director: movie.director ?? movie.Director ?? "",
      actors: movie.actors ?? movie.Actors ?? "",
      language: movie.language ?? movie.Language ?? "Tiếng Việt",
      subtitles: movie.subtitles ?? movie.Subtitles ?? "Không",
      ageRating: movie.ageRating ?? movie.AgeRating ?? "P",
      releaseDate: formatDate(movie.releaseDate ?? movie.ReleaseDate),
      endDate: formatDate(movie.endDate ?? movie.EndDate),
      posterUrl: movie.posterUrl ?? movie.PosterUrl ?? "",
      trailerUrl: movie.trailerUrl ?? movie.TrailerUrl ?? "",
      status: movie.status ?? movie.Status ?? "suất đang chiếu",
      categoryIds,
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

  function handleCategoryToggle(categoryId) {
    const id = Number(categoryId);

    setForm((prev) => {
      const existed = prev.categoryIds.includes(id);

      return {
        ...prev,
        categoryIds: existed
          ? prev.categoryIds.filter((item) => item !== id)
          : [...prev.categoryIds, id],
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!form.title.trim()) {
      setFormError("Vui lòng nhập tên phim.");
      return;
    }

    if (!form.releaseDate || form.releaseDate === "—") {
      setFormError("Vui lòng chọn ngày khởi chiếu.");
      return;
    }

    if (!form.endDate || form.endDate === "—") {
      setFormError("Vui lòng chọn ngày kết thúc.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description?.trim(),
      duration: Number(form.duration) || 120,
      director: form.director?.trim(),
      actors: form.actors?.trim(),
      language: form.language?.trim(),
      subtitles: form.subtitles?.trim(),
      ageRating: form.ageRating,
      releaseDate: form.releaseDate,
      endDate: form.endDate,
      posterUrl: form.posterUrl?.trim(),
      trailerUrl: form.trailerUrl?.trim(),
      status: form.status,
      categoryIds: form.categoryIds.map(Number),
    };

    try {
      setSubmitting(true);

      if (editId !== null) {
        await updateMovie(editId, payload);
      } else {
        await createMovie(payload);
      }

      await fetchData();
      closeModal();
    } catch (err) {
      setFormError(err.message || "Có lỗi xảy ra khi lưu phim.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Bạn có chắc muốn xóa phim này không?")) return;

    try {
      await deleteMovie(id);
      setList((prev) =>
        prev.filter((movie) => {
          const currentId =
            movie.movieId ?? movie.MovieId ?? movie.id ?? movie.Id;
          return currentId !== id;
        })
      );
    } catch (err) {
      alert(err.message || "Xóa phim thất bại.");
    }
  }

  function getMovieGenreText(movie) {
    const movieCategories = movie.categories ?? movie.Categories ?? [];
    const categoryList = unwrapList(movieCategories);

    return (
      categoryList
        .map((c) => c.categoryName ?? c.CategoryName ?? c.name ?? c.Name)
        .filter(Boolean)
        .join(", ") || "—"
    );
  }

  const filtered = list.filter((movie) => {
    const title = movie.title ?? movie.Title ?? "";
    const status = movie.status ?? movie.Status ?? "";

    const matchSearch = title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? status === filterStatus : true;

    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-xl">Quản Lý Phim</h4>

        <button
          type="button"
          onClick={openAddModal}
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
        >
          + Thêm Phim
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            placeholder="Tìm kiếm phim..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-40"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {loading && <p className="text-gray-500 text-sm">Đang tải...</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                <tr>
                  <th className="px-3 py-2 min-w-[50px]">#</th>
                  <th className="px-3 py-2 min-w-[260px]">Tên Phim</th>
                  <th className="px-3 py-2 min-w-[260px]">Thể Loại</th>
                  <th className="px-3 py-2 min-w-[110px]">Thời Lượng</th>
                  <th className="px-3 py-2 min-w-[180px]">Đạo Diễn</th>
                  <th className="px-3 py-2 min-w-[130px]">Khởi Chiếu</th>
                  <th className="px-3 py-2 min-w-[140px]">Trạng Thái</th>
                  <th className="px-3 py-2 min-w-[120px]">Thao Tác</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-gray-400">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  filtered.map((movie, index) => {
                    const movieId =
                      movie.movieId ?? movie.MovieId ?? movie.id ?? movie.Id;
                    const title = movie.title ?? movie.Title ?? "";
                    const duration = movie.duration ?? movie.Duration ?? "";
                    const director = movie.director ?? movie.Director ?? "—";
                    const releaseDate =
                      movie.releaseDate ?? movie.ReleaseDate ?? "";
                    const status = movie.status ?? movie.Status ?? "";

                    const statusObj = STATUS_OPTIONS.find(
                      (item) => item.value === status
                    );
                    const statusLabel = statusObj ? statusObj.label : status;

                    return (
                      <tr
                        key={movieId}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-3 py-2">{index + 1}</td>

                        <td className="px-3 py-2 font-semibold text-gray-800 whitespace-normal break-words">
                          {title}
                        </td>

                        <td className="px-3 py-2 text-xs text-gray-600 whitespace-normal break-words">
                          {getMovieGenreText(movie)}
                        </td>

                        <td className="px-3 py-2">{duration} phút</td>

                        <td className="px-3 py-2 whitespace-normal break-words">
                          {director}
                        </td>

                        <td className="px-3 py-2 text-xs">
                          {formatDate(releaseDate)}
                        </td>

                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              status === "suất đang chiếu"
                                ? "bg-green-100 text-green-700"
                                : status === "suất sắp chiếu"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {statusLabel || "—"}
                          </span>
                        </td>

                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(movie)}
                              className="text-blue-600 hover:underline text-xs"
                            >
                              Sửa
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(movieId)}
                              className="text-red-500 hover:underline text-xs"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 overflow-y-auto py-8">
          <div className="relative z-[10000] bg-white opacity-100 rounded-xl shadow-xl w-full max-w-4xl p-6 my-auto">
            <h5 className="font-bold text-lg mb-4 text-gray-900">
              {editId !== null ? "Cập Nhật Thông Tin Phim" : "Thêm Phim Mới"}
            </h5>

            {formError && (
              <p className="text-red-500 text-sm mb-3">{formError}</p>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên Phim <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Nhập tên phim"
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời Lượng
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={form.duration}
                    onChange={handleChange}
                    min={1}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đạo Diễn
                  </label>
                  <input
                    type="text"
                    name="director"
                    value={form.director}
                    onChange={handleChange}
                    placeholder="Tên đạo diễn"
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diễn Viên
                  </label>
                  <input
                    type="text"
                    name="actors"
                    value={form.actors}
                    onChange={handleChange}
                    placeholder="Tên diễn viên"
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngôn Ngữ
                  </label>
                  <input
                    type="text"
                    name="language"
                    value={form.language}
                    onChange={handleChange}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phụ Đề
                  </label>
                  <input
                    type="text"
                    name="subtitles"
                    value={form.subtitles}
                    onChange={handleChange}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Khởi Chiếu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="releaseDate"
                    value={form.releaseDate === "—" ? "" : form.releaseDate}
                    onChange={handleChange}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kết Thúc Chiếu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={form.endDate === "—" ? "" : form.endDate}
                    onChange={handleChange}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Độ Tuổi
                  </label>
                  <select
                    name="ageRating"
                    value={form.ageRating}
                    onChange={handleChange}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  >
                    {AGE_RATINGS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng Thái
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PosterUrl
                </label>
                <input
                  type="text"
                  name="posterUrl"
                  value={form.posterUrl}
                  onChange={handleChange}
                  placeholder="/img/example.jpg"
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TrailerUrl
                </label>
                <input
                  type="text"
                  name="trailerUrl"
                  value={form.trailerUrl}
                  onChange={handleChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô Tả
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Nhập mô tả phim"
                  rows={4}
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thể Loại
                </label>
                <div className="flex flex-wrap gap-2 bg-white border border-gray-300 rounded p-3 max-h-32 overflow-y-auto">
                  {categories.map((category) => {
                    const categoryId =
                      category.categoryId ??
                      category.CategoryId ??
                      category.id ??
                      category.Id;

                    const categoryName =
                      category.categoryName ??
                      category.CategoryName ??
                      category.name ??
                      category.Name;

                    const checked = form.categoryIds.includes(
                      Number(categoryId)
                    );

                    return (
                      <label
                        key={categoryId}
                        className="flex items-center gap-1 bg-white border border-gray-300 rounded px-2.5 py-1 text-xs text-gray-700 cursor-pointer select-none hover:bg-gray-100"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleCategoryToggle(categoryId)}
                          className="h-3.5 w-3.5 accent-blue-600"
                        />
                        {categoryName}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2 rounded border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                >
                  {submitting
                    ? "Đang xử lý..."
                    : editId !== null
                    ? "Lưu thay đổi"
                    : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}