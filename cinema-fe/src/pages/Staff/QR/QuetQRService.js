import { getTicketList, getTicketById, updateTicket } from "../../Admin/Ticket/ticketService";

export async function fetchTickets() {
  return await getTicketList();
}

export async function fetchTicketById(id) {
  return await getTicketById(id);
}

export async function validateTicket(id, statusPayload) {
  return await updateTicket(id, statusPayload);
}
