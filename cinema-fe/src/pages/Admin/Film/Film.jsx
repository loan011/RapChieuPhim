import "./Film.css";
import {
  STATUS_OPTIONS,
  useFilm,
  getMovieId,
  getMovieTitle,
  getMovieDuration,
  getMovieDirector,
  getMovieStatus,
  getMovieReleaseDate,
} from "./Film.js";

export default function Film() {
  const {
    loading,
    error,

    search,
    setSearch,

    filterStatus,
    setFilterStatus,

    filtered,

    getMovieGenreText,
    handleDelete,
    handleAddClick,
    handleEditClick,
  } = useFilm();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-xl">Quản Lý Phim</h4>

        <button
          type="button"
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          onClick={handleAddClick}
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

            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <p className="text-gray-500 text-sm">Đang tải...</p>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  {[
                    "#",
                    "Tên Phim",
                    "Thể Loại",
                    "Thời Lượng",
                    "Đạo Diễn",
                    "Ngày Khởi Chiếu",
                    "Trạng Thái",
                    "Thao Tác",
                  ].map((header) => (
                    <th key={header} className="px-3 py-2 text-left">
                      {header}
                    </th>
                  ))}
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
                  filtered.map((movie, index) => {
                    const movieId = getMovieId(movie);

                    return (
                      <tr
                        key={movieId ?? index}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-3 py-2">{index + 1}</td>

                        <td className="px-3 py-2 font-medium">
                          {getMovieTitle(movie)}
                        </td>

                        <td className="px-3 py-2">
                          {getMovieGenreText(movie)}
                        </td>

                        <td className="px-3 py-2">
                          {getMovieDuration(movie)}
                        </td>

                        <td className="px-3 py-2">
                          {getMovieDirector(movie)}
                        </td>

                        <td className="px-3 py-2">
                          {getMovieReleaseDate(movie)}
                        </td>

                        <td className="px-3 py-2">
                          {getMovieStatus(movie)}
                        </td>

                        <td className="px-3 py-2 flex gap-2">
                          <button
                            type="button"
                            className="text-blue-600 hover:underline text-xs"
                            onClick={() => handleEditClick(movieId)}
                          >
                            Sửa
                          </button>

                          <button
                            type="button"
                            className="text-red-500 hover:underline text-xs"
                            onClick={() => handleDelete(movieId)}
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