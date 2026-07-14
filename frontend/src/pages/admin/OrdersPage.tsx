import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { Pagination } from "../../components/Pagination.js";
import { LoadingState } from "../../components/LoadingStates.js";
import { Modal } from "../../components/Modal.js";
import { Input } from "../../theme/components/form/Input.js";
import { Select } from "../../theme/components/form/Select.js";
import { formatDate } from "../../utils/format.js";
import toast from "react-hot-toast";

export default function OrdersPage() {
  const { t } = useTranslation("admin");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [orderNo, setOrderNo] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", page, pageSize, orderNo, paymentStatus],
    queryFn: () => apiClient.get("/admin/orders", { params: { page, pageSize, orderNo, paymentStatus } }).then((r) => r.data.data),
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`/admin/orders/${id}/mark-paid`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success(t("saveSuccess", { ns: "common" })); },
  });

  const closeMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`/admin/orders/${id}/close`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success(t("operationSuccess", { ns: "common" })); },
  });

  const viewDetail = async (id: number) => {
    const res = await apiClient.get(`/admin/orders/${id}`);
    setDetail(res.data.data);
  };

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-text-primary">{t("orderManagement")}</h1>
      <div className="mb-4 flex gap-2">
        <Input value={orderNo} onChange={(e) => { setOrderNo(e.target.value); setPage(1); }} placeholder={t("orderSearch")} />
        <Select value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }} options={[
          { value: "", label: t("allPaymentStatus") },
          { value: "unpaid", label: t("common:unpaid") },
          { value: "paid", label: t("common:paid") },
          { value: "failed", label: t("common:failed") },
        ]} />
      </div>

      <table className="w-full rounded-lg bg-surface shadow">
        <thead className="border-b border-border bg-surface-alt"><tr>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("common:orderNo")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("product2")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("amount2")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("common:orderStatus")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("common:paymentStatus")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("common:deliveryStatus")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("time")}</th>
          <th className="px-4 py-3 text-left text-sm text-text-primary">{t("operation", { ns: "common" })}</th>
        </tr></thead>
        <tbody>
          {data?.items?.map((item: any) => (
            <tr key={item.id} className="border-b border-border hover:bg-surface-hover">
              <td className="px-4 py-3 text-sm font-mono text-text-primary">{item.orderNo}</td>
              <td className="px-4 py-3 text-sm text-text-primary">{item.product?.name || "-"}</td>
              <td className="px-4 py-3 text-sm text-text-primary">¥{item.totalAmount}</td>
              <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs ${item.orderStatus === "closed" ? "bg-red-100 text-red-700" : item.orderStatus === "completed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{t("common:" + item.orderStatus)}</span></td>
              <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs ${item.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{item.paymentStatus === "paid" ? t("common:paid") : t("common:unpaid")}</span></td>
              <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs ${item.deliveryStatus === "delivered" ? "bg-green-100 text-green-700" : item.deliveryStatus === "failed" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>{item.deliveryStatus === "delivered" ? t("common:delivered") : item.deliveryStatus === "failed" ? t("common:failed") : t("common:pending")}</span></td>
              <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(item.createdAt)}</td>
              <td className="px-4 py-3 text-sm">
                <button onClick={() => viewDetail(item.id)} className="mr-2 text-blue-500 hover:text-blue-700">{t("common:detail")}</button>
                {item.paymentStatus === "unpaid" && <><button onClick={() => markPaidMutation.mutate(item.id)} className="mr-2 text-green-500 hover:text-green-700">{t("common:markPaid")}</button><button onClick={() => closeMutation.mutate(item.id)} className="text-red-500 hover:text-red-700">{t("common:closeOrder")}</button></>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={data?.total || 0}
        onChange={setPage}
        pageSizeOptions={[10, 20, 50, 100]}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        }}
      />

      <Modal open={!!detail} title={`${t("orderDetail2")} ${detail?.orderNo || ""}`} onClose={() => setDetail(null)}>
        {detail && (
          <div className="space-y-3 text-sm text-text-primary">
            <div><strong>{t("product2")}:</strong> {detail.product?.name}</div>
            <div><strong>{t("quantity2")}:</strong> {detail.quantity}</div>
            <div><strong>{t("amount2")}:</strong> ¥{detail.totalAmount}</div>
            <div><strong>{t("email2")}:</strong> {detail.buyerEmail || "-"}</div>
            <div><strong>{t("common:orderStatus")}:</strong> {t(`common:${detail.orderStatus}`)}</div>
            <div><strong>{t("common:paymentStatus")}:</strong> {t(`common:${detail.paymentStatus}`)}</div>
            <div><strong>{t("common:deliveryStatus")}:</strong> {t(`common:${detail.deliveryStatus}`)}</div>
            {detail.deliveries?.length > 0 && (
              <div><strong>{t("deliveryContent")}:</strong><pre className="mt-1 rounded bg-surface-alt p-2 text-xs text-text-primary">{detail.deliveries[0]?.content || "-"}</pre></div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
