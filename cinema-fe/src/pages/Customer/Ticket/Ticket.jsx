import "../../../styles/Customer/CustomerPages.css";

import {
  TICKET_TEXT as T,
  useTicket,
  getTicketStatusLabel,
  handlePosterError,
} from "./Ticket";

export default function Ticket() {
  const {
    activeTab,
    setActiveTab,
    filteredTickets,
    counts,
  } = useTicket();

  return (
    <div className="cust-page">
      <div className="cust-wrapper">
        <div className="cust-header">
          <h1>
            <span className="page-icon">{T.header.icon}</span>
            {T.header.title}
          </h1>

          <p>{T.header.description}</p>
        </div>

        <div className="cust-stats">
          <div className="cust-stat-card yellow">
            <span className="stat-num">{counts.all}</span>
            <span className="stat-label">{T.stats.total}</span>
          </div>

          <div className="cust-stat-card green">
            <span className="stat-num">{counts.upcoming}</span>
            <span className="stat-label">{T.stats.upcoming}</span>
          </div>

          <div className="cust-stat-card red">
            <span className="stat-num">{counts.cancelled}</span>
            <span className="stat-label">{T.stats.cancelled}</span>
          </div>
        </div>

        <div className="cust-card">
          <div className="cust-tabs">
            {T.tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`cust-tab${activeTab === tab.key ? " active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}

                {counts[tab.key] > 0 && (
                  <span className="cust-tab-badge">{counts[tab.key]}</span>
                )}
              </button>
            ))}
          </div>

          <div className="cust-body">
            {filteredTickets.length === 0 ? (
              <div className="cust-empty">
                <div className="cust-empty-icon">{T.empty.icon}</div>
                <h3>{T.empty.title}</h3>
                <p>{T.empty.description}</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div className="ticket-card" key={ticket.id}>
                  <div className="ticket-stripe" />

                  <img
                    src={ticket.poster}
                    alt={ticket.movie}
                    className="ticket-poster"
                    onError={handlePosterError}
                  />

                  <div className="ticket-info">
                    <p className="ticket-title">{ticket.movie}</p>

                    <div className="ticket-meta">
                      <span>
                        <T.icons.calendar />
                        {ticket.date}
                      </span>

                      <span>
                        <T.icons.time />
                        {ticket.time}
                      </span>

                      <span>
                        <T.icons.location />
                        {ticket.cinema}
                      </span>

                      <span>
                        <T.icons.ticket />
                        {ticket.hall}
                      </span>
                    </div>

                    <div className="ticket-seats">
                      {ticket.seats.map((seat) => (
                        <span className="seat-chip" key={seat}>
                          <T.icons.seat className="ticket-seat-icon" />
                          {seat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="ticket-right">
                    <span className="ticket-price">{ticket.price}</span>

                    <span className={`ticket-status ${ticket.status}`}>
                      {getTicketStatusLabel(ticket.status)}
                    </span>

                    {ticket.status === T.statusKeys.upcoming && (
                      <div className="ticket-qr" title={T.qr.title}>
                        <T.icons.qr className="ticket-qr-icon" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}