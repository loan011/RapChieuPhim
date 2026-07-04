import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { getAreaList, createArea, updateArea, deleteArea } from "./areaService";

function normalizeArray(d) {
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.$values)) return d.$values;
  if (Array.isArray(d?.data)) return d.data;
  return [];
}

export default function Area() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [areaName, setAreaName] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      setLoading(true); setError(null);
      setList(normalizeArray(await getAreaList()));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  function openAdd() { setEditId(null); setAreaName(""); setFormError(""); setShowModal(true); }
  function openEdit(a) { setEditId(a.areaId ?? a.AreaId ?? a.id); setAreaName(a.areaName ?? a.AreaName ?? ""); setFormError(""); setShowModal(true); }
  function closeModal() { setShowModal(false); setEditId(null); setAreaName(""); setFormError(""); }

  async function handleDelete(id) {
    if (!confirm("Xóa khu vực này?")) return;
    try { await deleteArea(id); fetchData(); } catch (e) { alert(e.message); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!areaName.trim()) { setFormError("Tên khu vực không được trống."); return; }
    try {
      setFormLoading(true); setFormError("");
      const payload = { areaId: editId ?? 0, areaName: areaName.trim() };
      if (editId) await updateArea(editId, payload);
      else await createArea(payload);
      closeModal(); fetchData();
    } catch (e) { setFormError(e.message); }
    finally { setFormLoading(false); }
  }

  return (
    <div className="p-1">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-2xl text-gray-800">Quản Lý Khu Vực</h4>
        <button onClick={openAdd} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700">
          + Thêm Khu Vực
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {loading && <p className="text-gray-500 text-sm py-8 text-center">Đang tải...</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {!loading && !error && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-semibold">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Tên Khu Vực</th>
                <th className="px-4 py-3 text-left">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-10 text-gray-400">Chưa có khu vực nào</td></tr>
              ) : list.map((a, i) => {
                const id = a.areaId ?? a.AreaId ?? a.id;
                return (
                  <tr key={id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{a.areaName ?? a.AreaName}</td>
                    <td className="px-4 py-3 flex gap-3">
                      <button onClick={() => openEdit(a)} className="text-blue-600 hover:underline text-xs font-semibold">Sửa</button>
                      <button onClick={() => handleDelete(id)} className="text-red-500 hover:underline text-xs font-semibold">Xóa</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h5 className="text-lg font-bold text-gray-800">{editId ? "Sửa Khu Vực" : "Thêm Khu Vực"}</h5>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4">
              {formError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">⚠️ {formError}</div>}
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tên Khu Vực <span className="text-red-500">*</span></label>
              <input
                value={areaName} onChange={e => setAreaName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Ví dụ: Hà Nội, Hồ Chí Minh..."
                autoFocus
              />
            </form>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={closeModal} className="px-5 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
              <button onClick={handleSubmit} disabled={formLoading} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                {formLoading ? "Đang lưu..." : editId ? "Cập nhật" : "Thêm"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
