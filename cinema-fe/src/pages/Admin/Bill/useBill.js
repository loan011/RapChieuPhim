import { useEffect, useState } from "react";
import { getInvoiceList, updateInvoice } from "./invoiceService";

export const STATUS_OPTIONS = ["Đã thanh toán", "Chờ thanh toán", "Đã hủy"];

export function useBill() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  function normalizeArray(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.$values)) return data.$values;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const data = await getInvoiceList();
      setList(normalizeArray(data));
    } catch (err) {
      setList([]);
      setError(err?.message || "Không tải được danh sách hóa đơn.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      const invoice = list.find((h) => (h.id || h.invoiceId) === id);
      if (!invoice) return;

      const payload = {
        ...invoice,
        status: newStatus,
      };

      await updateInvoice(id, payload);
      alert("Cập nhật trạng thái hóa đơn thành công!");
      fetchData();
    } catch (err) {
      alert(err?.message || "Không thể cập nhật trạng thái hóa đơn.");
    }
  }

  const filtered = list.filter((h) => {
    const code = h.code || h.invoiceCode || "";
    const customer = h.customerName || h.fullName || h.userEmail || "";

    const matchSearch =
      code.toLowerCase().includes(search.toLowerCase()) ||
      customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? h.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  return {
    list,
    loading,
    error,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filtered,
    fetchData,
    handleStatusChange,
  };
}
