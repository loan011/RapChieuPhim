import "./Film.css";
import { createPortal } from "react-dom";
import {
  STATUS_OPTIONS,
  EMPTY_FORM,
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

    categoryMap,
    getMovieGenreText,
    handleDelete,
    handleAddClick,
    handleEditClick,

    showModal,
    editId,
    formData,
    formLoading,
    formError,
    closeModal,
    handleChange,
    handleCategoryToggle,
    handleSubmit,
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

      {/* Modal Thêm / Sửa Phim */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h5 className="text-lg font-bold text-gray-800">
                {editId ? "Sửa Phim" : "Thêm Phim Mới"}
              </h5>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-4 flex-1">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                  ⚠️ {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Tên phim */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tên Phim <span className="text-red-500">*</span></label>
                  <input
                    name="title" value={formData.title} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Nhập tên phim"
                  />
                </div>

                {/* Đạo diễn */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Đạo Diễn</label>
                  <input
                    name="director" value={formData.director} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Tên đạo diễn"
                  />
                </div>

                {/* Thời lượng */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Thời Lượng (phút)</label>
                  <input
                    type="number" name="duration" value={formData.duration} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="90"
                    min={1}
                  />
                </div>

                {/* Ngày khởi chiếu */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Ngày Khởi Chiếu</label>
                  <input
                    type="date" name="releaseDate" value={formData.releaseDate} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Trạng thái */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Trạng Thái</label>
                  <select
                    name="status" value={formData.status} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Poster URL */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    URL Ảnh Bìa <span className="text-gray-400 font-normal">(tối đa 500 ký tự — dùng link ảnh trực tiếp)</span>
                  </label>
                  <input
                    name="posterUrl" value={formData.posterUrl} onChange={handleChange}
                    className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 ${formData.posterUrl.length > 500 ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.posterUrl.length > 500 && (
                    <p className="text-red-500 text-xs mt-1">URL quá dài ({formData.posterUrl.length}/500 ký tự)</p>
                  )}
                </div>

                {/* Trailer URL */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">URL Trailer</label>
                  <input
                    name="trailerUrl" value={formData.trailerUrl} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="https://youtube.com/..."
                  />
                </div>

                {/* Diễn viên */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Diễn Viên</label>
                  <input
                    name="actors" value={formData.actors} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Tên diễn viên (cách nhau bằng dấu phẩy)"
                  />
                </div>

                {/* Ngôn ngữ & Phụ đề */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Ngôn Ngữ</label>
                  <input
                    name="language" value={formData.language} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Tiếng Việt"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phụ Đề</label>
                  <input
                    name="subtitles" value={formData.subtitles} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Tiếng Việt, Tiếng Anh"
                  />
                </div>

                {/* Độ tuổi & Ngày kết thúc */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Giới Hạn Tuổi</label>
                  <input
                    name="ageRating" value={formData.ageRating} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="P, C13, C16, C18"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Ngày Kết Thúc</label>
                  <input
                    type="date" name="endDate" value={formData.endDate} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Mô tả */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Mô Tả</label>
                  <textarea
                    name="description" value={formData.description} onChange={handleChange}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="Nội dung phim..."
                  />
                </div>

                {/* Thể loại */}
                {Object.keys(categoryMap).length > 0 && (
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Thể Loại</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(categoryMap).map(([id, name]) => (
                        <label key={id} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.categoryIds.includes(Number(id))}
                            onChange={() => handleCategoryToggle(Number(id))}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700">{name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                type="button" onClick={closeModal}
                className="px-5 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button" onClick={handleSubmit}
                disabled={formLoading}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {formLoading ? "Đang lưu..." : editId ? "Cập nhật" : "Thêm phim"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}