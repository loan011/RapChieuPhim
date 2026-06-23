import "./Film.css";
import { useEffect, useState } from "react";
import { getMovieList, deleteMovie } from "./movieService";

const STATUS_OPTIONS = [
  "suất đang chiếu",
  "suất sắp chiếu",
  "suất đặc biệt",
  "ngừng chiếu",
];

function getMovieId(m) {
  return m.id ?? m.movieId ?? m.MovieId;
}

function getMovieTitle(m) {
  return m.title ?? m.movieTitle ?? m.name ?? m.Title ?? "Chưa có tên";
}

function getMovieDuration(m) {
  return m.duration ?? m.durationMinutes ?? m.runningTime ?? m.Duration ?? "";
}

function getMovieDirector(m) {
  return m.director ?? m.Director ?? "Chưa có";
}

function getMovieStatus(m) {
  return m.status ?? m.Status ?? "Chưa có";
}

function formatDate(dateValue) {
  if (!dateValue) return "Chưa có";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue).split("T")[0];
  }

  return date.toISOString().split("T")[0];
}

function getCategoryName(item) {
  if (!item) return "";

  if (typeof item === "string") return item;

  return (
    item.categoryName ??
    item.CategoryName ??
    item.name ??
    item.Name ??
    item.category?.categoryName ??
    item.category?.CategoryName ??
    item.Category?.categoryName ??
    item.Category?.CategoryName ??
    ""
  );
}

function getMovieGenre(m) {
  // Trường hợp API trả thẳng string
  if (m.genre) return m.genre;
  if (m.Genre) return m.Genre;
  if (m.categoryName) return m.categoryName;
  if (m.CategoryName) return m.CategoryName;

  // Trường hợp API trả categoryNames: ["Hài", "Tình Cảm"]
  const categoryNames = m.categoryNames ?? m.CategoryNames;
  if (Array.isArray(categoryNames) && categoryNames.length > 0) {
    return categoryNames.join(", ");
  }

  // Trường hợp API trả categories: [{ categoryName: "Hài" }]
  const categories = m.categories ?? m.Categories;
  if (Array.isArray(categories) && categories.length > 0) {
    const names = categories.map(getCategoryName).filter(Boolean);
    if (names.length > 0) return names.join(", ");
  }

  // Trường hợp API trả movieCategoryMappings:
  // [{ category: { categoryName: "Hài" } }]
  const mappings =
    m.movieCategoryMappings ??
    m.MovieCategoryMappings ??
    m.movieCategories ??
    m.MovieCategories;

  if (Array.isArray(mappings) && mappings.length > 0) {
    const names = mappings
      .map((item) => {
        return (
          item.category?.categoryName ??
          item.category?.CategoryName ??
          item.Category?.categoryName ??
          item.Category?.CategoryName ??
          item.categoryName ??
          item.CategoryName ??
          ""
        );
      })
      .filter(Boolean);

    if (names.length > 0) return names.join(", ");
  }

  return "Chưa có";
}

export default function Phim() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const data = await getMovieList();

      console.log("MOVIE API DATA:", data);

      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi tải danh sách phim:", err);
      setError("Không tải được danh sách phim");
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Bạn có chắc muốn xóa phim này?")) return;

    try {
      await deleteMovie(id);

      setList((prev) => prev.filter((m) => getMovieId(m) !== id));
    } catch (err) {
      alert(err?.message || "Xóa phim thất bại");
    }
  }

  const filtered = list.filter((m) => {
    const keyword = search.toLowerCase().trim();

    const title = getMovieTitle(m).toLowerCase();
    const genre = getMovieGenre(m).toLowerCase();
    const status = getMovieStatus(m).toLowerCase();

    const matchSearch =
      title.includes(keyword) || genre.includes(keyword);

    const matchStatus = filterStatus
      ? status === filterStatus.toLowerCase()
      : true;

    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-xl">Quản Lý Phim</h4>

        <button
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          onClick={() => alert("TODO: Mở form thêm phim")}
        >
          + Thêm
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            placeholder="Tìm kiếm phim..."
            className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-40"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>

            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {loading && <p className="text-gray-500 text-sm">Đang tải...</p>}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Tên Phim</th>
                  <th className="px-3 py-2 text-left">Thể Loại</th>
                  <th className="px-3 py-2 text-left">Thời Lượng</th>
                  <th className="px-3 py-2 text-left">Đạo Diễn</th>
                  <th className="px-3 py-2 text-left">Ngày Khởi Chiếu</th>
                  <th className="px-3 py-2 text-left">Trạng Thái</th>
                  <th className="px-3 py-2 text-left">Thao Tác</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-6 text-gray-400"
                    >
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  filtered.map((m, i) => {
                    const id = getMovieId(m);

                    return (
                      <tr
                        key={id ?? i}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-3 py-2">{i + 1}</td>

                        <td className="px-3 py-2 font-medium">
                          {getMovieTitle(m)}
                        </td>

                        <td className="px-3 py-2">
                          {getMovieGenre(m)}
                        </td>

                        <td className="px-3 py-2">
                          {getMovieDuration(m)
                            ? `${getMovieDuration(m)} phút`
                            : "Chưa có"}
                        </td>

                        <td className="px-3 py-2">
                          {getMovieDirector(m)}
                        </td>

                        <td className="px-3 py-2">
                          {formatDate(
                            m.releaseDate ??
                              m.ReleaseDate ??
                              m.startDate ??
                              m.StartDate
                          )}
                        </td>

                        <td className="px-3 py-2">
                          {getMovieStatus(m)}
                        </td>

                        <td className="px-3 py-2 flex gap-2">
                          <button
                            className="text-blue-600 hover:underline text-xs"
                            onClick={() =>
                              alert(`TODO: Sửa phim id=${id}`)
                            }
                          >
                            Sửa
                          </button>

                          <button
                            className="text-red-500 hover:underline text-xs"
                            onClick={() => handleDelete(id)}
                          >
                            Xóa
                          </button>
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
    </div>
  );
}