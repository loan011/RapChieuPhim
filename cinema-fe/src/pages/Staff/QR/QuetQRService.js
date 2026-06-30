import { getTicketList, updateTicket } from "../../Admin/Ticket/ticketService";

export async function fetchTickets() {
  return await getTicketList();
}

export async function validateTicket(id, ticket) {
  return await updateTicket(id, ticket);
}
