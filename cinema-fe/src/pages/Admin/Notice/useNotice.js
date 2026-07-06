import { useEffect, useState } from "react";
import {
  getNotificationList,
  sendNotification,
  deleteNotification,
} from "./notificationService";

export const NOTICE_TARGET_OPTIONS = [
  {
    value: "all",
    label: "Tất cả người dùng",
  },
  {
    value: "customers",
    label: "Chỉ khách hàng",
  },
  {
    value: "staff",
    label: "Chỉ nhân viên",
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

export function useNotice() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState(INITIAL_NOTICE_FORM);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      setLoading(true);
      setError("");

      const data = await getNotificationList();

      setHistory(normalizeArray(data));
    } catch (err) {
      console.error("Lỗi tải thông báo:", err);

      setHistory([]);
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

      const sent = await sendNotification(payload);

      const newNotice = sent || {
        ...payload,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };

      setHistory((prev) => [newNotice, ...prev]);
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
      await deleteNotification(id);

      setHistory((prev) =>
        prev.filter((notice) => String(getNoticeId(notice)) !== String(id))
      );
    } catch (err) {
      console.error("Lỗi xóa thông báo:", err);

      alert(err.message || "Xóa thông báo thất bại!");
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

    fetchHistory,
    handleChange,
    handleSend,
    handleDelete,
  };
}