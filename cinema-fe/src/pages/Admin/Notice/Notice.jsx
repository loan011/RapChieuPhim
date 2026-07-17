import "./Notice.css";
import {
  NOTICE_TARGET_OPTIONS,
  NOTICE_TYPE_OPTIONS,
  useNotice,
  getNoticeId,
  getNoticeTitle,
  getNoticeContent,
  getNoticeTargetLabel,
  getNoticeCreatedAt,
  getNoticeTypeStyle,
} from "./useNotice.js";

export default function Notice() {
  const {
    history,
    loading,
    error,
    form,

    handleChange,
    handleSend,
    handleDelete,
  } = useNotice();

  return (
    <div className="p-1">
      <h4 className="font-bold text-2xl text-gray-100 mb-6">
        Thông Báo Đến Người Dùng
      </h4>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#1c1c24] rounded-2xl shadow-sm border border-[#2c2c35] p-6 hover:shadow-md transition-shadow duration-300">
          <h5 className="font-bold text-lg text-gray-100 mb-5 pb-3 border-b border-[#2c2c35] flex items-center gap-2">
            <span className="w-1.5 h-5 bg-blue-600 rounded-full"></span>
            Gửi Thông Báo Mới
          </h5>

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Tiêu Đề
              </label>

              <input
                type="text"
                name="title"
                required
                placeholder="Nhập tiêu đề thông báo"
                className="w-full bg-[#111115] border border-[#3a3a45] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-900/50 transition-all duration-200"
                style={{ color: '#ffffff' }}
                value={form.title}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Người Nhận
                </label>

                <select
                  name="target"
                  className="w-full bg-[#111115] border border-[#3a3a45] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-900/50 transition-all duration-200 cursor-pointer"
                  style={{ color: '#ffffff' }}
                  value={form.target}
                  onChange={handleChange}
                >
                  {NOTICE_TARGET_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Loại Thông Báo
                </label>

                <select
                  name="type"
                  className="w-full bg-[#111115] border border-[#3a3a45] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-900/50 transition-all duration-200 cursor-pointer"
                  style={{ color: '#ffffff' }}
                  value={form.type}
                  onChange={handleChange}
                >
                  {NOTICE_TYPE_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Nội Dung
              </label>

              <textarea
                name="content"
                required
                rows={4}
                placeholder="Nhập nội dung chi tiết của thông báo..."
                className="w-full bg-[#111115] border border-[#3a3a45] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-900/50 transition-all duration-200"
                style={{ color: '#ffffff' }}
                value={form.content}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 active:scale-98 font-semibold py-2.5 rounded-xl text-sm transition-all duration-150 shadow-md" style={{ color: '#ffffff' }}>
              Gửi Thông Báo
            </button>
          </form>
        </div>

        <div className="bg-[#1c1c24] rounded-2xl shadow-sm border border-[#2c2c35] p-6 hover:shadow-md transition-shadow duration-300">
          <h5 className="font-bold text-lg text-gray-100 mb-5 pb-3 border-b border-[#2c2c35] flex items-center gap-2">
            <span className="w-1.5 h-5 bg-purple-500 rounded-full"></span>
            Lịch Sử Đã Gửi
          </h5>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-400 text-sm animate-pulse">
                Đang tải lịch sử thông báo...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/50 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">
                Chưa có thông báo nào được gửi.
              </p>
            </div>
          )}

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {history.map((notice) => {
              const noticeId = getNoticeId(notice);
              const style = getNoticeTypeStyle(notice);

              return (
                <div
                  key={noticeId}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex justify-between items-start gap-4 ${style.bgClass}`}
                >
                  <div className="flex gap-3 items-start">
                    <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${style.dotColor}`}></span>

                    <div>
                      <p className="font-semibold text-gray-200 text-sm">
                        {getNoticeTitle(notice)}
                      </p>

                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        {getNoticeContent(notice)}
                      </p>

                      <div className="flex items-center gap-3 mt-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#2c2c35] text-gray-300 uppercase tracking-wider">
                          {getNoticeTargetLabel(notice)}
                        </span>

                        <span className="text-[10px] text-gray-500">
                          {getNoticeCreatedAt(notice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="text-red-500 hover:text-red-400 active:scale-95 transition-all p-1 hover:bg-red-500/10 rounded-lg text-xs"
                    onClick={() => handleDelete(noticeId)}
                  >
                    Xóa
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}