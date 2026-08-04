import { useEffect, useState } from "react";

export const SELLING_TIME_MESSAGE = "Ngoài thời gian bán vé. Hệ thống chỉ hoạt động từ 08:00 đến 24:00.";

function getVietnamHour(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Number(parts.find((part) => part.type === "hour")?.value ?? -1);
}

export function getCurrentShift(date = new Date()) {
  const hour = getVietnamHour(date);
  if (hour >= 8 && hour < 16) return { shiftId: 1, code: "CA1", name: "Ca 1 (08:00 - 16:00)" };
  if (hour >= 16 && hour < 24) return { shiftId: 2, code: "CA2", name: "Ca 2 (16:00 - 24:00)" };
  return null;
}

export function isSellingTime(date = new Date()) {
  return getCurrentShift(date) !== null;
}

export function useSellingShift() {
  const [shift, setShift] = useState(() => getCurrentShift());
  useEffect(() => {
    const refresh = () => setShift(getCurrentShift());
    refresh();
    const timer = window.setInterval(refresh, 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return { currentShift: shift, isSelling: shift !== null, message: SELLING_TIME_MESSAGE };
}
