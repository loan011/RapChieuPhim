import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const PRESETS = ["VE1", "VE2", "VE3", "VE5", "VE10", "VE15", "VE20"];

export default function TestQR() {
  const [selected, setSelected] = useState("VE1");
  const [custom, setCustom]     = useState("");

  const code = custom.trim().toUpperCase() || selected;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-white font-bold text-xl">🎬 QR Test — Vé Rạp Chiếu Phim</h1>
      <p className="text-gray-400 text-sm text-center">
        Mở trang này trên điện thoại / màn hình khác, hướng vào webcam để quét
      </p>

      {/* Preset buttons */}
      <div className="flex gap-2 flex-wrap justify-center">
        {PRESETS.map(c => (
          <button
            key={c}
            onClick={() => { setSelected(c); setCustom(""); }}
            className={`px-3 py-1 rounded-full text-sm font-bold border-2 transition-colors ${
              code === c
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-gray-800 text-gray-300 border-gray-600 hover:border-emerald-500"
            }`}
          >{c}</button>
        ))}
      </div>

      {/* QR Card */}
      <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 shadow-[0_0_40px_rgba(16,185,129,0.4)] border-4 border-emerald-500">
        <QRCodeSVG value={code} size={280} level="M" />
        <div className="text-2xl font-black text-emerald-700 tracking-[4px] bg-emerald-50 px-6 py-2 rounded-xl border-2 border-emerald-300">
          {code}
        </div>
      </div>

      {/* Custom input */}
      <div className="flex gap-2 items-center">
        <input
          value={custom}
          onChange={e => setCustom(e.target.value)}
          placeholder="Nhập mã vé (VD: VE7)"
          className="border-2 border-gray-600 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm w-44 text-center placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
        />
        {custom && (
          <button onClick={() => setCustom("")} className="text-gray-400 hover:text-red-400 text-sm">✕</button>
        )}
      </div>

      <p className="text-gray-500 text-xs text-center max-w-xs">
        💡 Cách dùng: mở tab này trên điện thoại (truy cập IP máy tính), hoặc để trên màn hình phụ rồi quét bằng webcam
      </p>
    </div>
  );
}
