import "./Dashboard.css";

import {
  DASHBOARD_TEXT as T,
  useDashboard,
} from "./Dashboard.js";

export default function Dashboard() {
  const {
    cards,
    recentTickets,
    loading,
    error,
  } = useDashboard();

  return (
    <div>
      <div className={T.classNames.welcomeBox}>
        <h4 className={T.classNames.welcomeTitle}>
          {T.welcome.title}
        </h4>

        <p className={T.classNames.welcomeDesc}>
          {T.welcome.description}
        </p>
      </div>

      <div className={T.classNames.statsGrid}>
        {cards.map((card) => {
          const Icon = card.Icon;

          return (
            <div
              key={card.key}
              className={`${card.color} ${T.classNames.statCard}`}
            >
              <div>
                <div className={T.classNames.statValue}>
                  {card.value}
                </div>

                <div className={T.classNames.statLabel}>
                  {card.label}
                </div>
              </div>

              <div className={T.classNames.statIcon}>
                <Icon />
              </div>
            </div>
          );
        })}
      </div>

      <div className={T.classNames.recentBox}>
        <h5 className={T.classNames.recentTitle}>
          {T.recentTickets.title}
        </h5>

        {loading && (
          <p className={T.classNames.loadingText}>
            {T.messages.loading}
          </p>
        )}

        {error && (
          <p className={T.classNames.errorText}>
            {error}
          </p>
        )}

        {!loading && !error && recentTickets.length === 0 && (
          <p className={T.classNames.emptyText}>
            {T.messages.emptyRecentTickets}
          </p>
        )}

        {!loading && !error && recentTickets.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  {T.recentTickets.headers.map((header) => (
                    <th key={header} className={T.classNames.tableHead}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {recentTickets.map((ticket, index) => (
                  <tr
                    key={ticket.id || index}
                    className={T.classNames.tableRow}
                  >
                    <td className={T.classNames.tableCell}>
                      {index + 1}
                    </td>

                    <td className={T.classNames.tableCell}>
                      {ticket.movieName}
                    </td>

                    <td className={T.classNames.tableCell}>
                      {ticket.customerName}
                    </td>

                    <td className={T.classNames.tableCell}>
                      {ticket.seat}
                    </td>

                    <td className={T.classNames.tableCell}>
                      {ticket.price}
                    </td>

                    <td className={T.classNames.tableCell}>
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