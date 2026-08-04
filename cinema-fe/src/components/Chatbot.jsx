import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { MdChat, MdClose, MdSend } from "react-icons/md";
import { askChatbot } from "../services/chatbotService";
import "./Chatbot.css";

const suggestions = [
  "Hiện tại có chương trình khuyến mãi nào?",
  "Có phim nào sắp chiếu?",
  "Hôm nay có phim gì đang chiếu?",
  "Moana có suất chiếu lúc mấy giờ?",
  "Moana có suất chiếu ngày mai không?",
  "Giá vé ghế VIP bao nhiêu?",
  "Cho tôi thông tin các chi nhánh rạp.",
];

const welcomeMessage = {
  id: "welcome",
  sender: "bot",
  text: "Xin chào! Mình có thể giúp bạn tra cứu phim, suất chiếu, giá vé, khuyến mãi và thông tin rạp từ hệ thống.",
};

const CHAT_HISTORY_TTL_MS = 24 * 60 * 60 * 1000;

function getChatStorageKey(userKey) {
  return `cinema_chatbot_history_${encodeURIComponent(userKey)}`;
}

function loadChatHistory(userKey) {
  try {
    const storageKey = getChatStorageKey(userKey);
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (!saved || !Array.isArray(saved.messages) || !saved.savedAt) return [welcomeMessage];

    if (Date.now() - Number(saved.savedAt) >= CHAT_HISTORY_TTL_MS) {
      localStorage.removeItem(storageKey);
      return [welcomeMessage];
    }

    return saved.messages.length > 0 ? saved.messages : [welcomeMessage];
  } catch {
    return [welcomeMessage];
  }
}

function saveChatHistory(userKey, messages) {
  try {
    localStorage.setItem(getChatStorageKey(userKey), JSON.stringify({
      savedAt: Date.now(),
      messages,
    }));
  } catch {
    // Chat vẫn hoạt động nếu trình duyệt chặn hoặc hết dung lượng localStorage.
  }
}

function getCurrentUserKey() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const identity = user.userId ?? user.UserId ?? user.id ?? user.Id
      ?? user.email ?? user.Email ?? localStorage.getItem("userEmail");
    return identity ? String(identity).trim().toLowerCase() : "guest";
  } catch {
    return (localStorage.getItem("userEmail") || "guest").trim().toLowerCase();
  }
}

export default function Chatbot() {
  const location = useLocation();
  const currentUserKey = getCurrentUserKey();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => loadChatHistory(currentUserKey));
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const activeUserRef = useRef(currentUserKey);
  const conversationVersionRef = useRef(0);
  const skipNextHistorySaveRef = useRef(false);

  const isCustomerPage = !["/login", "/register", "/forgot-password", "/change-password"]
    .some((path) => location.pathname.startsWith(path))
    && !location.pathname.startsWith("/admin")
    && !location.pathname.startsWith("/staff");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (activeUserRef.current === currentUserKey) return;

    activeUserRef.current = currentUserKey;
    conversationVersionRef.current += 1;
    skipNextHistorySaveRef.current = true;
    setMessages(loadChatHistory(currentUserKey));
    setInput("");
    setLoading(false);
    setIsOpen(false);
  }, [currentUserKey]);

  useEffect(() => {
    if (skipNextHistorySaveRef.current) {
      skipNextHistorySaveRef.current = false;
      return;
    }

    if (activeUserRef.current === currentUserKey) {
      saveChatHistory(currentUserKey, messages);
    }
  }, [currentUserKey, messages]);

  if (!isCustomerPage) return null;

  async function sendQuestion(rawQuestion) {
    const question = rawQuestion.trim();
    if (!question || loading) return;

    const userMessage = { id: `user-${Date.now()}`, sender: "user", text: question };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);
    const conversationVersion = conversationVersionRef.current;
    const requestingUser = activeUserRef.current;

    try {
      const response = await askChatbot(question);
      if (conversationVersion !== conversationVersionRef.current || requestingUser !== activeUserRef.current) return;
      setMessages((current) => [
        ...current,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: response?.message || "Mình chưa tìm thấy thông tin phù hợp.",
          intent: response?.intent,
          data: Array.isArray(response?.data) ? response.data : [],
        },
      ]);
    } catch (error) {
      if (conversationVersion !== conversationVersionRef.current || requestingUser !== activeUserRef.current) return;
      setMessages((current) => [
        ...current,
        {
          id: `error-${Date.now()}`,
          sender: "bot",
          text: error.message || "Không thể kết nối tới trợ lý. Vui lòng thử lại.",
          isError: true,
        },
      ]);
    } finally {
      if (conversationVersion === conversationVersionRef.current && requestingUser === activeUserRef.current) {
        setLoading(false);
      }
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendQuestion(input);
  }

  return (
    <div className="cinema-chatbot">
      {isOpen && (
        <section className="chatbot-panel" aria-label="Trợ lý tư vấn rạp phim">
          <header className="chatbot-header">
            <div>
              <strong>Trợ lý CinemasHCM</strong>
              <span><i /> Đang trực tuyến</span>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Đóng chatbot">
              <MdClose />
            </button>
          </header>

          <div className="chatbot-messages" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`chatbot-message-row ${message.sender}`}>
                <div className={`chatbot-message ${message.isError ? "error" : ""}`}>
                  <p>{message.text}</p>
                  {message.sender === "bot" && message.data?.some((item) => item.posterUrl) && (
                    <div className="chatbot-posters">
                      {message.data.filter((item) => item.posterUrl).slice(0, 4).map((item) => (
                        <img key={item.movieId || item.title} src={item.posterUrl} alt={item.title || "Poster phim"} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chatbot-message-row bot">
                <div className="chatbot-message chatbot-typing" aria-label="Trợ lý đang trả lời">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chatbot-suggestions">
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" disabled={loading} onClick={() => sendQuestion(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>

          <form className="chatbot-input" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Hỏi về phim, suất chiếu..."
              maxLength={500}
              disabled={loading}
              aria-label="Nhập câu hỏi"
            />
            <button type="submit" disabled={loading || !input.trim()} aria-label="Gửi câu hỏi">
              <MdSend />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className={`chatbot-toggle ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? "Đóng chatbot" : "Mở chatbot"}
        aria-expanded={isOpen}
      >
        {isOpen ? <MdClose /> : <MdChat />}
      </button>
    </div>
  );
}
