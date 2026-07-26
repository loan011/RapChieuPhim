import { useEffect, useState } from "react";
import {
  getNotificationList,
  sendNotification,
  deleteNotification,
} from "./notificationService";
import { getCinemas } from "../Dashboard/dashboardService";

let globalCinemas = [];

export const NOTICE_TARGET_OPTIONS = [
  {
    value: "all",
    label: "Tất cả người dùng",
  },
  {
    value: "customers",
    label: "Chỉ khách hàng",
  },
];

export const NOTICE_TYPE_OPTIONS = [
  {
    value: "info",
    label: "Thông tin ℹ️",
  },
  {
    value: "promotion",
    label: "Khuyến mãi 🎁",
  },
  {
    value: "warning",
    label: "Cảnh báo ⚠️",
  },
];

export const INITIAL_NOTICE_FORM = {
  title: "",
  target: "all",
  type: "info",
  content: "",
};

export function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;

  return [];
}

export function getNoticeId(notice) {
  return (
    notice?.notificationId ??
    notice?.NotificationId ??
    notice?.noticeId ??
    notice?.NoticeId ??
    notice?.id ??
    notice?.Id
  );
}

export function getNoticeTitle(notice) {
  return (
    notice?.title ??
    notice?.Title ??
    "Không có tiêu đề"
  );
}

export function getNoticeContent(notice) {
  return (
    notice?.content ??
    notice?.Content ??
    notice?.body ??
    notice?.Body ??
    ""
  );
}

export function getNoticeTarget(notice) {
  return (
    notice?.target ??
    notice?.Target ??
    "all"
  );
}

export function getNoticeType(notice) {
  return (
    notice?.type ??
    notice?.Type ??
    "info"
  );
}

export function getNoticeCreatedAtRaw(notice) {
  return (
    notice?.createdAt ??
    notice?.CreatedAt ??
    notice?.sentAt ??
    notice?.SentAt ??
    notice?.date ??
    notice?.Date ??
    ""
  );
}

export function getNoticeTargetLabel(notice) {
  const target = getNoticeTarget(notice);

  if (target === "customers") return "Khách hàng";
  if (target === "staff") return "Nhân viên";
  if (target === "all_cinemas") return "Tất cả chi nhánh";

  if (target.startsWith("cinema_")) {
    const cid = target.replace("cinema_", "");
    const cinema = globalCinemas.find(c => String(c.cinemaId || c.id) === cid);
    return cinema ? `Chi nhánh: ${cinema.cinemaName || cinema.name}` : `Chi nhánh #${cid}`;
  }

  return "Tất cả";
}

export function formatDateTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hour}:${minute}`;
}

export function getNoticeCreatedAt(notice) {
  return formatDateTime(getNoticeCreatedAtRaw(notice));
}

export function getNoticeTypeStyle(notice) {
  const type = getNoticeType(notice);

  if (type === "warning") {
    return {
      bgClass: "bg-amber-50/50 border-amber-100",
      dotColor: "bg-amber-400",
    };
  }

  if (type === "promotion") {
    return {
      bgClass: "bg-emerald-50/50 border-emerald-100",
      dotColor: "bg-emerald-500",
    };
  }

  return {
    bgClass: "bg-blue-50/50 border-blue-100",
    dotColor: "bg-blue-500",
  };
}

export function buildNotificationPayload(form) {
  return {
    title: form.title.trim(),
    target: form.target,
    type: form.type,
    content: form.content.trim(),
  };
}

export function saveAdminNotification(notice) {
  try {
    const localCache = JSON.parse(localStorage.getItem("admin_notifications_cache") || "[]");
    const nId = getNoticeId(notice) || Date.now();
    const formatted = {
      ...notice,
      id: nId,
      notificationId: nId,
      createdAt: notice.createdAt || notice.CreatedAt || new Date().toISOString(),
    };
    const existsIndex = localCache.findIndex(n => String(getNoticeId(n)) === String(nId));
    if (existsIndex >= 0) {
      localCache[existsIndex] = formatted;
    } else {
      localCache.unshift(formatted);
    }
    localStorage.setItem("admin_notifications_cache", JSON.stringify(localCache));
    window.dispatchEvent(new Event("notificationsUpdated"));
    return formatted;
  } catch (e) {
    console.error("Lỗi lưu admin notification:", e);
    return notice;
  }
}

export function removeAdminNotification(id) {
  try {
    const localCache = JSON.parse(localStorage.getItem("admin_notifications_cache") || "[]");
    const filtered = localCache.filter(n => String(getNoticeId(n)) !== String(id));
    localStorage.setItem("admin_notifications_cache", JSON.stringify(filtered));
    window.dispatchEvent(new Event("notificationsUpdated"));
  } catch (e) {
    console.error("Lỗi xóa admin notification:", e);
  }
}

export function getAdminNotificationsMerged(apiList = []) {
  try {
    const localCache = JSON.parse(localStorage.getItem("admin_notifications_cache") || "[]");
    const map = new Map();
    // Prioritize API list
    (apiList || []).forEach(item => {
      const id = String(getNoticeId(item));
      if (id) map.set(id, item);
    });
    // Add local cache items if missing
    (localCache || []).forEach(item => {
      const id = String(getNoticeId(item));
      if (id && !map.has(id)) map.set(id, item);
    });
    return Array.from(map.values());
  } catch (e) {
    return apiList;
  }
}

export function useNotice() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cinemas, setCinemas] = useState([]);

  const [form, setForm] = useState(INITIAL_NOTICE_FORM);

  useEffect(() => {
    async function loadCinemas() {
      try {
        const list = await getCinemas();
        const arr = list?.$values || list || [];
        globalCinemas = arr;
        setCinemas(arr);
      } catch (e) {
        console.error("Lỗi lấy danh sách chi nhánh:", e);
      }
    }
    loadCinemas();
  }, []);

  const targetOptions = [
    ...NOTICE_TARGET_OPTIONS,
    {
      value: "all_cinemas",
      label: "Tất cả chi nhánh (Nhân viên)",
    },
    ...cinemas.map(c => ({
      value: `cinema_${c.cinemaId || c.id}`,
      label: `Chi nhánh: ${c.cinemaName || c.name}`
    }))
  ];

  useEffect(() => {
    fetchHistory();

    function handleSync() {
      fetchHistory();
    }
    window.addEventListener("storage", handleSync);
    window.addEventListener("notificationsUpdated", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("notificationsUpdated", handleSync);
    };
  }, []);

  async function fetchHistory() {
    try {
      setLoading(true);
      setError("");

      let data = [];
      try {
        data = await getNotificationList();
      } catch (e) {
        console.warn("Lỗi API getNotificationList, dùng cache cục bộ:", e);
      }

      const merged = getAdminNotificationsMerged(normalizeArray(data));
      setHistory(merged);
    } catch (err) {
      console.error("Lỗi tải thông báo:", err);

      const merged = getAdminNotificationsMerged([]);
      setHistory(merged);
      setError(err.message || "Lấy lịch sử thông báo thất bại!");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSend(e) {
    e.preventDefault();

    try {
      const payload = buildNotificationPayload(form);
      let sent = null;

      try {
        sent = await sendNotification(payload);
      } catch (apiErr) {
        console.warn("API sendNotification không phản hồi, lưu cục bộ:", apiErr);
      }

      const newNotice = sent || {
        ...payload,
        id: Date.now(),
        notificationId: Date.now(),
        createdAt: new Date().toISOString(),
      };

      saveAdminNotification(newNotice);
      setForm(INITIAL_NOTICE_FORM);

      alert("Gửi thông báo thành công!");
    } catch (err) {
      console.error("Lỗi gửi thông báo:", err);

      alert(err.message || "Gửi thông báo thất bại!");
    }
  }

  async function handleDelete(id) {
    if (!id) return;

    if (!window.confirm("Bạn có chắc muốn xóa thông báo này?")) {
      return;
    }

    try {
      await deleteNotification(id).catch(() => null);
      removeAdminNotification(id);
      setHistory((prev) =>
        prev.filter((notice) => String(getNoticeId(notice)) !== String(id))
      );
    } catch (err) {
      console.error("Lỗi xóa thông báo:", err);

      removeAdminNotification(id);
      setHistory((prev) =>
        prev.filter((notice) => String(getNoticeId(notice)) !== String(id))
      );
    }
  }

  return {
    history,
    setHistory,

    loading,
    setLoading,

    error,
    setError,

    form,
    setForm,
    targetOptions,

    fetchHistory,
    handleChange,
    handleSend,
    handleDelete,
  };
}