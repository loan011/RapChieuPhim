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
    let response = await fetch(`${API_URL}/Tickets/ByCode/${ticketCode}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      response = await fetch(`${API_URL}/Tickets/Public/${ticketCode}`, {
        headers: getAuthHeaders(),
      });
    }
    const data = await readResponse(response);
    if (!response.ok) return null;
    return data;
  } catch (err) {
    console.error("Error fetching ticket by code:", err);
    return null;
  }
}

export async function fetchBookingById(bookingId) {
  try {
    const response = await fetch(`${API_URL}/Bookings/${bookingId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    return await readResponse(response);
  } catch (err) {
    console.error("Error fetching booking by id:", err);
    return null;
  }
}
