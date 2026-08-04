import { getApiUrl, getAuthHeaders, getErrorMessage, readResponse } from "./apiHelper";

export async function askChatbot(question) {
  const response = await fetch(`${getApiUrl()}/chatbot/ask`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ question }),
  });
  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Không thể gửi câu hỏi tới trợ lý."));
  }

  return data;
}
