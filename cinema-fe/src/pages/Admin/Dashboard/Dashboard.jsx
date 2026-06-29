import "./Dashboard.css";
import { useDashboard } from "./Dashboard.js";

export default function Dashboard() {
  const {
    cards,
    recentTickets,
    loading,
    error,
  } = useDashboard();

  return (
    <div>
      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
        <h4 className="font-bold text-lg mb-1">
          👋 Xin chào Admin!
        </h4>

        <p className="text-gray-500 text-sm">
          Chào mừng bạn đến với hệ thống quản lý rạp chiếu phim T&M.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map((card) => {
          const Icon = card.Icon;

          return (
            <div
              key={card.key}
              className={`${card.color} text-white rounded-lg p-4 flex items-center justify-between shadow`}
            >
              <div>
                <div className="text-2xl font-bold">
                  {card.value}
                </div>

                <div className="text-sm opacity-90">
                  {card.label}
                </div>
              </div>

              <div className="text-4xl opacity-70">
                <Icon />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <h5 className="font-semibold text-gray-700 mb-3">
          Vé Đặt Gần Đây
        </h5>

        {loading && (
          <p className="text-gray-500 text-sm">
            Đang tải dữ liệu...
          </p>
        )}

        {error && (
          <p className="text-red-500 text-sm">
            {error}
          </p>
        )}

        {!loading && !error && recentTickets.length === 0 && (
          <p className="text-gray-400 text-sm">
            Chưa có dữ liệu.
          </p>
        )}

        {!loading && !error && recentTickets.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  {["#", "Tên Phim", "Khách Hàng", "Ghế", "Tên Rạp", "Khu Vực", "Giá Vé", "Ngày Đặt"].map((header) => (
                    <th key={header} className="px-3 py-2 text-left">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {recentTickets.map((ticket, index) => (
                  <tr
                    key={ticket.id || index}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-3 py-2">
                      {index + 1}
                    </td>

                    <td className="px-3 py-2">
                      {ticket.movieName}
                    </td>

                    <td className="px-3 py-2">
                      {ticket.customerName}
                    </td>

                    <td className="px-3 py-2">
                      {ticket.seat}
                    </td>

                    <td className="px-3 py-2">
                      {ticket.cinemaName}
                    </td>

                    <td className="px-3 py-2">
                      {ticket.areaName}
                    </td>

                    <td className="px-3 py-2">
                      {ticket.price}
                    </td>

                    <td className="px-3 py-2">
                      {ticket.createdAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}