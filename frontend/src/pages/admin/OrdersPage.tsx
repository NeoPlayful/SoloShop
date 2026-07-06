import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/client.js";
import { Pagination } from "../../components/Pagination.js";
import { LoadingState } from "../../components/LoadingStates.js";
import { Modal } from "../../components/Modal.js";
import toast from "react-hot-toast";

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [orderNo, setOrderNo] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", page, orderNo, paymentStatus],
    queryFn: () => apiClient.get("/admin/orders", { params: { page, pageSize: 20, orderNo, paymentStatus } }).then((r) => r.data.data),
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`/admin/orders/${id}/mark-paid`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success("已标记支付成功"); },
  });

  const closeMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`/admin/orders/${id}/close`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success("已关闭订单"); },
  });

  const viewDetail = async (id: number) => {
    const res = await apiClient.get(`/admin/orders/${id}`);
    setDetail(res.data.data);
  };

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">订单管理</h1>
      <div className="mb-4 flex gap-2">
        <input value={orderNo} onChange={(e) => { setOrderNo(e.target.value); setPage(1); }} placeholder="订单号" className="rounded border px-3 py-2 text-sm" />
        <select value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }} className="rounded border px-3 py-2 text-sm">
          <option value="">全部支付状态</option>
          <option value="unpaid">未支付</option>
          <option value="paid">已支付</option>
          <option value="failed">失败</option>
        </select>
      </div>

      <table className="w-full rounded-lg bg-white shadow">
        <thead className="border-b bg-gray-50"><tr>
          <th className="px-4 py-3 text-left text-sm">订单号</th>
          <th className="px-4 py-3 text-left text-sm">商品</th>
          <th className="px-4 py-3 text-left text-sm">金额</th>
          <th className="px-4 py-3 text-left text-sm">支付状态</th>
          <th className="px-4 py-3 text-left text-sm">发货状态</th>
          <th className="px-4 py-3 text-left text-sm">时间</th>
          <th className="px-4 py-3 text-left text-sm">操作</th>
        </tr></thead>
        <tbody>
          {data?.items?.map((item: any) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-mono">{item.orderNo}</td>
              <td className="px-4 py-3 text-sm">{item.product?.name || "-"}</td>
              <td className="px-4 py-3 text-sm">¥{item.totalAmount}</td>
              <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs ${item.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{item.paymentStatus}</span></td>
              <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs ${item.deliveryStatus === "delivered" ? "bg-green-100 text-green-700" : item.deliveryStatus === "failed" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>{item.deliveryStatus}</span></td>
              <td className="px-4 py-3 text-sm text-gray-500">{item.createdAt?.substring(0, 16) || "-"}</td>
              <td className="px-4 py-3 text-sm">
                <button onClick={() => viewDetail(item.id)} className="mr-2 text-blue-500 hover:text-blue-700">详情</button>
                {item.paymentStatus === "unpaid" && <><button onClick={() => markPaidMutation.mutate(item.id)} className="mr-2 text-green-500 hover:text-green-700">标记支付</button><button onClick={() => closeMutation.mutate(item.id)} className="text-red-500 hover:text-red-700">关闭</button></>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} pageSize={20} total={data?.total || 0} onChange={setPage} />

      <Modal open={!!detail} title={`订单详情 ${detail?.orderNo || ""}`} onClose={() => setDetail(null)}>
        {detail && (
          <div className="space-y-3 text-sm">
            <div><strong>商品：</strong>{detail.product?.name}</div>
            <div><strong>数量：</strong>{detail.quantity}</div>
            <div><strong>金额：</strong>¥{detail.totalAmount}</div>
            <div><strong>邮箱：</strong>{detail.buyerEmail || "-"}</div>
            <div><strong>订单状态：</strong>{detail.orderStatus}</div>
            <div><strong>支付状态：</strong>{detail.paymentStatus}</div>
            <div><strong>发货状态：</strong>{detail.deliveryStatus}</div>
            {detail.deliveries?.length > 0 && (
              <div><strong>发货内容：</strong><pre className="mt-1 rounded bg-gray-50 p-2 text-xs">{detail.deliveries[0]?.content || "-"}</pre></div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
