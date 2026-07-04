import { useReport } from "./Report.js";
import { MdRefresh, MdTrendingUp, MdReceiptLong, MdConfirmationNumber, MdCalendarMonth } from "react-icons/md";

function fmt(n) {
  return Number(n || 0).toLocaleString("vi-VN");
}

function BarChart({ rows, labelKey, valueKey, color = "bg-blue-500" }) {
  const max = Math.max(...rows.map((r) => r[valueKey]), 1);
  return (
    <div className="space-y-2.5 mt-2">
      {rows.map((row, i) => {
        const pct = Math.round((row[valueKey] / max) * 100);
        return (
          <div key={i} className="flex items-center gap-3 text-sm">
            <span className="w-28 shrink-0 text-gray-500 truncate text-right text-xs">
              {row[labelKey]}
            </span>
            <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
              <div
                className={`${color} h-5 rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                style={{ width: `${Math.max(pct, 2)}%` }}
              >
                {pct > 20 && (
                  <span className="text-white text-xs font-semibold whitespace-nowrap">
                    {fmt(row[valueKey])} đ
                  </span>
                )}
              </div>
            </div>
            {pct <= 20 && (
              <span className="text-xs text-gray-600 font-semibold whitespace-nowrap">
                {fmt(row[valueKey])} đ
              </span>
            )}
          </div>
        );
      })}
      {rows.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-6">Không có dữ liệu</p>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, accent }) {
  const accents = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-green-200 bg-green-50 text-green-700",
    yellow: "border-yellow-200 bg-yellow-50 text-yellow-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
  };
  return (
    <div className={`rounded-2xl border p-5 flex items-center gap-4 ${accents[accent] || accents.blue}`}>
      <div className="text-3xl opacity-80">
        <Icon />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
        <p className="text-xl font-bold mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function Report() {
  const {
    loading,
    error,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    activeTab,
    setActiveTab,
    totalRevenue,
    totalInvoices,
    totalTickets,
    avgPerDay,
    revenueByDay,
    revenueByMovie,
    revenueByCinema,
    revenueByShowtime,
    fetchAll,
  } = useReport();

  const tabs = [
    { key: "day",      label: "Theo Ngày" },
    { key: "movie",    label: "Theo Phim" },
    { key: "cinema",   label: "Theo Rạp" },
    { key: "showtime", label: "Theo Suất Chiếu" },
  ];

  return (
    <div className="p-1">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h4 className="font-bold text-2xl text-gray-800">Báo Cáo Doanh Thu</h4>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 text-sm bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 transition"
        >
          <MdRefresh className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* Date filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Từ ngày</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Đến ngày</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
            />
          </div>
          <p className="text-xs text-gray-400 self-center">
            * Doanh thu theo ngày dựa trên hóa đơn đã thanh toán.
            <br />
            Doanh thu theo phim/rạp dựa trên vé đã bán.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
          <span className="animate-spin inline-block w-5 h-5 border-2 border-current border-t-transparent text-blue-600 rounded-full mr-2"></span>
          Đang tải dữ liệu...
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 mb-6 xl:grid-cols-4">
            <SummaryCard
              icon={MdTrendingUp}
              label="Tổng Doanh Thu"
              value={`${fmt(totalRevenue)} đ`}
              accent="green"
            />
            <SummaryCard
              icon={MdReceiptLong}
              label="Hóa Đơn Đã TT"
              value={totalInvoices}
              accent="blue"
            />
            <SummaryCard
              icon={MdConfirmationNumber}
              label="Vé Đã Bán"
              value={totalTickets}
              accent="purple"
            />
            <SummaryCard
              icon={MdCalendarMonth}
              label="Doanh Thu TB/Ngày"
              value={`${fmt(Math.round(avgPerDay))} đ`}
              accent="yellow"
            />
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    activeTab === tab.key
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Theo Ngày */}
            {activeTab === "day" && (
              <>
                <h6 className="text-sm font-semibold text-gray-700 mb-3">
                  Doanh thu theo ngày ({fromDate} → {toDate})
                </h6>
                <BarChart rows={revenueByDay} labelKey="date" valueKey="revenue" color="bg-blue-500" />
                {revenueByDay.length > 0 && (
                  <div className="mt-6 overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-600 font-semibold">
                          <th className="px-4 py-3 text-left">#</th>
                          <th className="px-4 py-3 text-left">Ngày</th>
                          <th className="px-4 py-3 text-right">Doanh Thu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {revenueByDay.map((row, i) => (
                          <tr key={row.date} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                            <td className="px-4 py-3 font-medium text-gray-700">{row.date}</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-800">
                              {fmt(row.revenue)} đ
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-blue-50 font-bold">
                          <td colSpan={2} className="px-4 py-3 text-blue-700">Tổng cộng</td>
                          <td className="px-4 py-3 text-right text-blue-700">{fmt(totalRevenue)} đ</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* Theo Phim */}
            {activeTab === "movie" && (
              <>
                <h6 className="text-sm font-semibold text-gray-700 mb-3">
                  Doanh thu theo phim (tất cả vé đã bán)
                </h6>
                <BarChart rows={revenueByMovie} labelKey="movie" valueKey="revenue" color="bg-green-500" />
                {revenueByMovie.length > 0 && (
                  <div className="mt-6 overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-600 font-semibold">
                          <th className="px-4 py-3 text-left">#</th>
                          <th className="px-4 py-3 text-left">Phim</th>
                          <th className="px-4 py-3 text-right">Doanh Thu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {revenueByMovie.map((row, i) => (
                          <tr key={row.movie} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                            <td className="px-4 py-3 font-medium text-gray-700">{row.movie}</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-800">
                              {fmt(row.revenue)} đ
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-green-50 font-bold">
                          <td colSpan={2} className="px-4 py-3 text-green-700">Tổng cộng</td>
                          <td className="px-4 py-3 text-right text-green-700">
                            {fmt(revenueByMovie.reduce((s, r) => s + r.revenue, 0))} đ
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* Theo Rạp */}
            {activeTab === "cinema" && (
              <>
                <h6 className="text-sm font-semibold text-gray-700 mb-3">
                  Doanh thu theo rạp (tất cả vé đã bán)
                </h6>
                <BarChart rows={revenueByCinema} labelKey="cinema" valueKey="revenue" color="bg-purple-500" />
                {revenueByCinema.length > 0 && (
                  <div className="mt-6 overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-600 font-semibold">
                          <th className="px-4 py-3 text-left">#</th>
                          <th className="px-4 py-3 text-left">Rạp</th>
                          <th className="px-4 py-3 text-right">Doanh Thu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {revenueByCinema.map((row, i) => (
                          <tr key={row.cinema} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                            <td className="px-4 py-3 font-medium text-gray-700">{row.cinema}</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-800">
                              {fmt(row.revenue)} đ
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-purple-50 font-bold">
                          <td colSpan={2} className="px-4 py-3 text-purple-700">Tổng cộng</td>
                          <td className="px-4 py-3 text-right text-purple-700">
                            {fmt(revenueByCinema.reduce((s, r) => s + r.revenue, 0))} đ
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* Theo Suất Chiếu */}
            {activeTab === "showtime" && (
              <>
                <h6 className="text-sm font-semibold text-gray-700 mb-3">
                  Doanh thu theo suất chiếu (tất cả vé đã bán)
                </h6>
                <BarChart rows={revenueByShowtime} labelKey="showtime" valueKey="revenue" color="bg-orange-500" />
                {revenueByShowtime.length > 0 && (
                  <div className="mt-6 overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-600 font-semibold">
                          <th className="px-4 py-3 text-left">#</th>
                          <th className="px-4 py-3 text-left">Suất Chiếu</th>
                          <th className="px-4 py-3 text-right">Doanh Thu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {revenueByShowtime.map((row, i) => (
                          <tr key={row.showtime} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                            <td className="px-4 py-3 font-medium text-gray-700">{row.showtime}</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-800">
                              {fmt(row.revenue)} đ
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-orange-50 font-bold">
                          <td colSpan={2} className="px-4 py-3 text-orange-700">Tổng cộng</td>
                          <td className="px-4 py-3 text-right text-orange-700">
                            {fmt(revenueByShowtime.reduce((s, r) => s + r.revenue, 0))} đ
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
