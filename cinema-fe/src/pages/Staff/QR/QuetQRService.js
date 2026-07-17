import { getTicketList, updateTicket } from "../../Admin/Ticket/ticketService";
import { getApiUrl, readResponse, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();

export async function fetchTickets() {
  return await getTicketList();
}

export async function validateTicket(id, ticket) {
  return await updateTicket(id, ticket);
}

export async function fetchTicketByCode(ticketCode) {
  try {
    const response = await fetch(`${API_URL}/Tickets/ByCode/${ticketCode}`, {
      headers: getAuthHeaders(),
    });
    const data = await readResponse(response);
    if (!response.ok) return null;
    return data;
  } catch (err) {
    console.error("Error fetching ticket by code:", err);
    return null;
  }
}
