import { useCallback, useEffect, useState } from "react";
import { listVerifications,getVerification,getVerificationImage } from "./studentVerificationService";

const STATUS_LABELS = {
 PENDING: "Chờ xác minh",
 APPROVED: "Đã xác minh",
 REJECTED: "Đã từ chối",
 CANCELLED: "Đã hủy",
 EXPIRED: "Đã hết hạn",
};

function statusLabel(value){return STATUS_LABELS[value]||value;}

export default function StudentVerification(){
 const [rows,setRows]=useState([]),[selected,setSelected]=useState(null),[image,setImage]=useState(""),[status,setStatus]=useState("APPROVED"),[search,setSearch]=useState(""),[error,setError]=useState(""),[loading,setLoading]=useState(false);
 const load=useCallback(async()=>{setLoading(true);setError("");try{const data=await listVerifications({status,studentCode:search,page:1,pageSize:50});setRows(data.items||[]);}catch(e){setError(e.message)}finally{setLoading(false)}},[status,search]);
 useEffect(()=>{load()},[load]); useEffect(()=>()=>{if(image)URL.revokeObjectURL(image)},[image]);
 async function open(id){setLoading(true);try{setSelected(await getVerification(id));setImage(await getVerificationImage(id));}catch(e){setError(e.message)}finally{setLoading(false)}}
 return <div className="space-y-5 text-gray-100"><div><h1 className="text-2xl font-bold">Xác minh thẻ sinh viên</h1><p className="text-sm text-gray-400">Duyệt ưu đãi 15% chỉ trên tiền vé.</p></div>
 <div className="flex gap-3"><input className="bg-[#1c1c1e] border border-gray-700 rounded-lg px-3 py-2" placeholder="Tìm mã sinh viên" value={search} onChange={e=>setSearch(e.target.value)}/><select className="bg-[#1c1c1e] border border-gray-700 rounded-lg px-3" value={status} onChange={e=>setStatus(e.target.value)}><option value="APPROVED">Đã xác minh</option></select></div>
 {error&&<div className="bg-red-950 border border-red-700 rounded-lg p-3">{error}</div>}{loading&&<div className="text-gray-400">Đang xử lý…</div>}
 <div className="overflow-auto rounded-xl border border-gray-800"><table className="w-full text-sm"><thead className="bg-[#1c1c1e]"><tr>{["Mã YC","Booking","MSSV","Trường","Hạn thẻ","Chi nhánh","Nhân viên","Đã dùng","Trạng thái",""] .map(x=><th key={x} className="p-3 text-left">{x}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id} className="border-t border-gray-800"><td className="p-3">{r.id}</td><td>{r.bookingId}</td><td>{r.studentCode}</td><td>{r.schoolName||"—"}</td><td>{r.expiryDate}</td><td>{r.cinemaName}</td><td>{r.submittedBy}</td><td>{r.monthlyUsageCount}/3</td><td><span className={r.status==="APPROVED"?"inline-flex rounded-full bg-green-900/70 px-3 py-1 text-green-300":"inline-flex rounded-full bg-gray-800 px-3 py-1"}>{statusLabel(r.status)}</span></td><td><button className="text-blue-400" onClick={()=>open(r.id)}>Chi tiết</button></td></tr>)}</tbody></table></div>
 {selected&&<div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"><div className="bg-[#18181b] max-w-4xl w-full max-h-[90vh] overflow-auto rounded-2xl p-6"><button className="float-right" onClick={()=>setSelected(null)}>✕</button><h2 className="text-xl font-bold mb-4">Chi tiết xác minh #{selected.id}</h2><div className="grid md:grid-cols-2 gap-6"><img src={image} className="w-full rounded-xl" alt="Ảnh thẻ sinh viên"/><div className="space-y-3"><p><b>Trạng thái:</b> <span className="inline-flex rounded-full bg-green-900/70 px-3 py-1 text-green-300">{statusLabel(selected.status)}</span></p><p><b>Booking:</b> {selected.bookingId}</p><p><b>Thời gian mua vé:</b> {selected.purchaseTime ? new Date(selected.purchaseTime).toLocaleString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—"}</p><p><b>MSSV:</b> {selected.studentCode}</p><p><b>Họ tên:</b> {selected.studentName||"—"}</p><p><b>Trường:</b> {selected.schoolName||"—"}</p><p><b>Hạn:</b> {selected.expiryDate}</p><p><b>Tiền vé:</b> {Number(selected.totalTicketAmount).toLocaleString("vi-VN")}đ</p><p><b>Số tiền giảm:</b> {Number(selected.expectedDiscountAmount).toLocaleString("vi-VN")}đ</p><p><b>Đã dùng:</b> {selected.monthlyUsageCount}/3</p><button onClick={()=>setSelected(null)} className="mt-4 rounded-lg bg-gray-700 px-5 py-2 hover:bg-gray-600">Đóng</button></div></div></div></div>}</div>
}
