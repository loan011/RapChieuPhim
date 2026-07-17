import { getTicketList, deleteTicket, createTicket, updateTicket } from "../../Admin/Ticket/ticketService";

export async function fetchTickets() {
  return await getTicketList();
}

export async function removeTicket(id) {
  return await deleteTicket(id);
}

export async function addTicket(ticket) {
  return await createTicket(ticket);
}

export async function editTicket(id, ticket) {
  return await updateTicket(id, ticket);
}
