import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { Pagination } from "../../components/Pagination.js";
import { LoadingState } from "../../components/LoadingStates.js";
import { Modal } from "../../components/Modal.js";
import { formatDate } from "../../utils/format.js";
import {
  BanknotesIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

export default function PaymentsPage() {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("common");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [orderNo, setOrderNo] = useState("");
  const [status, setStatus] = useState("");
  const [channel, setChannel] = useState("");
  const [paidAtFrom, setPaidAtFrom] = useState("");
  const [paidAtTo, setPaidAtTo] = useState("");
  const [rawDataPayment, setRawDataPayment] = useState<any>(null);

  // 获取渠道列表（用于筛选下拉）
  const { data: channelsData } = useQuery({
    queryKey: ["admin-payment-channels"],
    queryFn: () => apiClient.get("/admin/payment-channels").then((r) => r.data.data),
    staleTime: 60000,
  });

  // 获取支付列表
  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments", page, pageSize, orderNo, status, channel, paidAtFrom, paidAtTo],
    queryFn: () =>
      apiClient
        .get("/admin/payments", {
          params: {
            page,
            pageSize,
            ...(orderNo && { orderNo }),
            ...(status && { status }),
            ...(channel && { channel }),
            ...(paidAtFrom && { paidAtFrom }),
            ...(paidAtTo && { paidAtTo }),
          },
        })
        .then((r) => r.data.data),
    placeholderData: (prev: any) => prev,
  });

  const list = data?.items || [];
  const total = data?.total || 0;
  const stats = data?.stats;

  // 状态样式映射
  const statusColors: Record<string, string> = {
    success: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
  };
  const statusLabels: Record<string, string> = {
    success: tc("success"),
    pending: tc("pending"),
    failed: tc("failed"),
  };

  // 重置筛选时回到第一页
  const handleFilterChange = (setter: (v: string) => void) => (val: string) => {
    setter(val);
    setPage(1);
  };

  if (isLoading && list.length === 0) return <LoadingState />;

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-text-primary">{t("paymentManagement")}</h1>

      {/* ─── 汇总统计 ─── */}
      {stats && (
        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg bg-surface p-4 shadow">
          <div className="flex items-center gap-1.5 text-sm text-text-primary">
            <BanknotesIcon className="h-4 w-4" />
            <span>
              {t("paymentStats", {
                total: stats.total,
                success: stats.successCount,
                amount: Number(stats.totalPaidAmount || 0).toFixed(2),
                pending: stats.pendingCount,
                failed: stats.failedCount,
              })}
            </span>
          </div>
          {stats.pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs text-yellow-700">
              <ClockIcon className="h-3 w-3" />
              {stats.pendingCount} {t("pendingPayment")}
            </span>
          )}
          {stats.failedCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs text-red-700">
              <XCircleIcon className="h-3 w-3" />
              {stats.failedCount} {tc("failed")}
            </span>
          )}
        </div>
      )}

      {/* ─── 筛选栏 ─── */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={orderNo}
          onChange={(e) => handleFilterChange(setOrderNo)(e.target.value)}
          placeholder={t("searchOrderNo")}
          className="w-44 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500 transition-colors"
        />
        <select
          value={status}
          onChange={(e) => handleFilterChange(setStatus)(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500 transition-colors"
        >
          <option value="">{t("allPaymentStatus")}</option>
          <option value="pending">{tc("pending")}</option>
          <option value="success">{tc("success")}</option>
          <option value="failed">{tc("failed")}</option>
        </select>
        <select
          value={channel}
          onChange={(e) => handleFilterChange(setChannel)(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500 transition-colors"
        >
          <option value="">{t("allChannels")}</option>
          {channelsData?.items?.map((ch: any) => (
            <option key={ch.code} value={ch.code}>
              {ch.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={paidAtFrom}
          onChange={(e) => handleFilterChange(setPaidAtFrom)(e.target.value)}
          placeholder={t("paidAtFrom")}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500 transition-colors"
        />
        <span className="text-text-tertiary text-sm">~</span>
        <input
          type="date"
          value={paidAtTo}
          onChange={(e) => handleFilterChange(setPaidAtTo)(e.target.value)}
          placeholder={t("paidAtTo")}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* ─── 支付列表 ─── */}
      <div className="rounded-lg bg-surface shadow">
        <table className="w-full">
          <thead className="border-b border-border bg-surface-alt">
            <tr>
              <th className="px-4 py-3 text-left text-sm text-text-primary">{tc("id")}</th>
              <th className="px-4 py-3 text-left text-sm text-text-primary">{tc("orderNo")}</th>
              <th className="px-4 py-3 text-left text-sm text-text-primary">{t("channel")}</th>
              <th className="px-4 py-3 text-right text-sm text-text-primary">{tc("amount")}</th>
              <th className="px-4 py-3 text-right text-sm text-text-primary">{t("paidAmount")}</th>
              <th className="px-4 py-3 text-left text-sm text-text-primary">{t("channelOrderNo")}</th>
              <th className="px-4 py-3 text-center text-sm text-text-primary">{tc("status")}</th>
              <th className="px-4 py-3 text-center text-sm text-text-primary">{t("isActive")}</th>
              <th className="px-4 py-3 text-left text-sm text-text-primary">{tc("createdAt")}</th>
              <th className="px-4 py-3 text-left text-sm text-text-primary">{t("paidTime")}</th>
              <th className="px-4 py-3 text-center text-sm text-text-primary">{tc("operation")}</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-sm text-text-secondary">
                  {tc("noData")}
                </td>
              </tr>
            ) : (
              list.map((item: any) => (
                <tr key={item.id} className="border-b border-border hover:bg-surface-hover">
                  <td className="px-4 py-3 text-sm text-text-primary">{item.id}</td>
                  <td className="px-4 py-3 text-sm font-mono text-text-primary">
                    {item.order?.orderNo || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-primary">{item.channel}</td>
                  <td className="px-4 py-3 text-sm text-right text-text-primary">
                    ¥{Number(item.amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-text-primary">
                    {item.paidAmount != null ? (
                      <span className={item.paidAmount !== item.amount ? "text-amber-600" : ""}>
                        ¥{Number(item.paidAmount).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-text-tertiary">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-text-secondary">
                    {item.channelOrderNo || "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs ${
                        statusColors[item.status] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {statusLabels[item.status] || item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs ${
                        item.isActive
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {item.isActive ? t("active") : t("inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">
                    {item.paidAt ? formatDate(item.paidAt) : "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setRawDataPayment(item)}
                      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-500 hover:bg-surface-hover transition-colors border border-blue-200"
                    >
                      <EyeIcon className="h-3 w-3" />
                      {t("viewRawData")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="px-4">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onChange={setPage}
            pageSizeOptions={[10, 20, 50, 100]}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* ─── 回调数据弹窗 ─── */}
      <Modal
        open={!!rawDataPayment}
        title={`${t("rawData")} - #${rawDataPayment?.id}`}
        onClose={() => setRawDataPayment(null)}
      >
        {rawDataPayment && (
          <div className="space-y-4 text-sm text-text-primary">
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-surface-alt p-3">
              <div>
                <span className="text-text-tertiary">{t("tradeNo")}：</span>
                <span className="font-mono">{rawDataPayment.tradeNo || "-"}</span>
              </div>
              <div>
                <span className="text-text-tertiary">{t("channelOrderNo")}：</span>
                <span className="font-mono">{rawDataPayment.channelOrderNo || "-"}</span>
              </div>
              <div>
                <span className="text-text-tertiary">{t("channel")}：</span>
                <span>{rawDataPayment.channel}</span>
              </div>
              <div>
                <span className="text-text-tertiary">{tc("amount")}：</span>
                <span>¥{Number(rawDataPayment.amount).toFixed(2)}</span>
              </div>
            </div>

            {rawDataPayment.rawData ? (
              <div>
                <p className="mb-1 font-medium text-text-primary">{t("rawData")}</p>
                <pre className="max-h-80 overflow-auto rounded-lg bg-surface-alt p-3 text-xs font-mono text-text-primary leading-relaxed whitespace-pre-wrap">
                  {JSON.stringify(rawDataPayment.rawData, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-text-tertiary text-center py-4">{tc("noData")}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
