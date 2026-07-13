import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { LoadingState } from "../../components/LoadingStates.js";
import { NumberedPagination } from "../../theme/components/navigation/NumberedPagination.js";
import toast from "react-hot-toast";
import { formatDate } from "../../utils/format.js";
import {
  CurrencyYenIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

/* ========== KPI 卡片 ========== */

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  accent: "blue" | "green" | "amber" | "purple" | "red";
}

const accentStyles: Record<string, { bg: string; icon: string }> = {
  blue: { bg: "bg-blue-50", icon: "text-blue-500" },
  green: { bg: "bg-green-100", icon: "text-green-500" },
  amber: { bg: "bg-yellow-100", icon: "text-yellow-500" },
  purple: { bg: "bg-purple-50", icon: "text-purple-500" },
  red: { bg: "bg-red-100", icon: "text-red-500" },
};

function KpiCard({ icon, label, value, unit = "", accent }: KpiCardProps) {
  const s = accentStyles[accent];
  return (
    <div className="rounded-xl bg-surface p-4 shadow-card transition-shadow hover:shadow-md">
      <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}>
        <span className={`h-4 w-4 ${s.icon}`}>{icon}</span>
      </div>
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-text-primary">
        {value}{unit && <span className="ml-0.5 text-sm font-normal text-text-secondary">{unit}</span>}
      </p>
    </div>
  );
}

/* ========== 审核通过弹窗 ========== */

function ApproveModal({ item, onClose }: { item: any; onClose: () => void }) {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("common");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => apiClient.post(`/admin/withdrawal-requests/${item.id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawal-requests"] });
      toast.success(t("operationSuccess"));
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || tc("operationFailed"));
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="mx-4 w-full max-w-md rounded-lg bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-bold text-text-primary">{t("withdrawalApproveConfirm")}</h2>
        <div className="mb-4 space-y-2 rounded-lg bg-surface-alt p-3 text-sm text-text-secondary">
          <div className="flex justify-between">
            <span>{t("withdrawalAccount")}:</span>
            <span className="text-text-primary">{item.accountType}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("withdrawalAccountNumber")}:</span>
            <span className="text-text-primary font-mono">{item.accountNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("withdrawalAmount")}:</span>
            <span className="text-text-primary font-medium">¥{Number(item.netAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("promotionName")}:</span>
            <span className="text-text-primary">{item.user?.email || "-"}</span>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover transition-colors">{tc("cancel")}</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50 transition-colors">
            {mutation.isPending ? tc("loading") : tc("confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========== 拒绝弹窗 ========== */

function RejectModal({ item, onClose }: { item: any; onClose: () => void }) {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("common");
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: () => apiClient.post(`/admin/withdrawal-requests/${item.id}/reject`, { remark: reason || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawal-requests"] });
      toast.success(t("operationSuccess"));
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || tc("operationFailed"));
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="mx-4 w-full max-w-md rounded-lg bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-bold text-text-primary">{t("withdrawalRejectConfirm")}</h2>
        <div className="mb-4 space-y-2 rounded-lg bg-surface-alt p-3 text-sm text-text-secondary">
          <div className="flex justify-between">
            <span>{t("promotionName")}:</span>
            <span className="text-text-primary">{item.user?.email || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("withdrawalAmount")}:</span>
            <span className="text-text-primary font-medium">¥{Number(item.netAmount).toFixed(2)}</span>
          </div>
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-sm text-text-primary">{t("withdrawalRejectReason")}</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("withdrawalRejectReasonPlaceholder")}
            rows={3}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500 transition-colors resize-none"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover transition-colors">{tc("cancel")}</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
            {mutation.isPending ? tc("loading") : t("reject")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========== 标记打款确认 ========== */

function MarkPaidModal({ item, onClose }: { item: any; onClose: () => void }) {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("common");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => apiClient.post(`/admin/withdrawal-requests/${item.id}/mark-paid`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawal-requests"] });
      toast.success(t("operationSuccess"));
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || tc("operationFailed"));
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="mx-4 w-full max-w-md rounded-lg bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-bold text-text-primary">{t("withdrawalMarkPaidConfirm")}</h2>
        <div className="mb-4 space-y-2 rounded-lg bg-surface-alt p-3 text-sm text-text-secondary">
          <div className="flex justify-between">
            <span>{t("promotionName")}:</span>
            <span className="text-text-primary">{item.user?.email || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("withdrawalAmount")}:</span>
            <span className="text-text-primary font-medium">¥{Number(item.netAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("withdrawalAccount")}:</span>
            <span className="text-text-primary">{item.accountType} / {item.accountNumber}</span>
          </div>
          {item.accountName && (
            <div className="flex justify-between">
              <span>{t("withdrawalAccountName")}:</span>
              <span className="text-text-primary">{item.accountName}</span>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover transition-colors">{tc("cancel")}</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="rounded-lg bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600 disabled:opacity-50 transition-colors">
            {mutation.isPending ? tc("loading") : t("withdrawalMarkPaid")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========== 状态标签 ========== */

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  paid: "bg-green-100 text-green-700",
};


/* ========== 主页面 ========== */

export default function WithdrawalRequestsPage() {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("common");
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [approveItem, setApproveItem] = useState<any>(null);
  const [rejectItem, setRejectItem] = useState<any>(null);
  const [markPaidItem, setMarkPaidItem] = useState<any>(null);
  const pageSize = 15;

  // 统计
  const { data: stats } = useQuery({
    queryKey: ["admin-withdrawal-stats"],
    queryFn: () => apiClient.get("/admin/withdrawal-requests/stats").then((r) => r.data.data),
    refetchInterval: 30000,
  });

  // 列表
  const { data: listData, isLoading } = useQuery({
    queryKey: ["admin-withdrawal-requests", search, statusFilter, page],
    queryFn: () =>
      apiClient
        .get("/admin/withdrawal-requests", {
          params: { search, status: statusFilter !== "all" ? statusFilter : undefined, page, pageSize },
        })
        .then((r) => r.data.data),
  });

  const list = listData?.list || [];
  const total = listData?.total || 0;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-withdrawal-requests"] });
    queryClient.invalidateQueries({ queryKey: ["admin-withdrawal-stats"] });
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">{t("withdrawalRequests")}</h1>
      </div>

      {/* KPI 统计 */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          icon={<ClockIcon className="h-4 w-4" />}
          label={t("withdrawalPendingCount")}
          value={stats?.pendingCount ?? 0}
          accent="amber"
        />
        <KpiCard
          icon={<CurrencyYenIcon className="h-4 w-4" />}
          label={t("withdrawalPendingAmount")}
          value={Number(stats?.pendingAmount ?? 0).toFixed(2)}
          unit={t("unitYuan")}
          accent="amber"
        />
        <KpiCard
          icon={<BanknotesIcon className="h-4 w-4" />}
          label={t("withdrawalMonthlyPaid")}
          value={Number(stats?.monthlyPaid ?? 0).toFixed(2)}
          unit={t("unitYuan")}
          accent="green"
        />
        <KpiCard
          icon={"¥"}
          label={t("withdrawalTotalWithdrawn")}
          value={Number(stats?.totalWithdrawn ?? 0).toFixed(2)}
          unit={t("unitYuan")}
          accent="purple"
        />
      </div>

      {/* 搜索/筛选 */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t("withdrawalSearchPlaceholder")}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 pl-9 text-sm text-text-primary outline-none focus:border-blue-500 transition-colors"
          />
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500 transition-colors"
        >
          <option value="all">{t("withdrawalAllStatus")}</option>
          <option value="pending">{t("withdrawalPending")}</option>
          <option value="approved">{t("withdrawalApproved")}</option>
          <option value="paid">{t("withdrawalPaid")}</option>
          <option value="rejected">{t("withdrawalRejected")}</option>
        </select>
      </div>

      {/* 表格 */}
      <div className="rounded-lg bg-surface shadow">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-text-primary">
          {t("withdrawalRequests")} ({total})
        </h2>

        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-text-secondary">{tc("loading")}</div>
        ) : list.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-text-secondary">{t("withdrawalNoData")}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead className="border-b border-border bg-surface-alt">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm text-text-primary">{tc("time")}</th>
                    <th className="px-4 py-3 text-left text-sm text-text-primary">{t("promotionName")}</th>
                    <th className="px-4 py-3 text-right text-sm text-text-primary">{t("withdrawalAmount")}</th>
                    <th className="px-4 py-3 text-right text-sm text-text-primary">{t("withdrawalFee")}</th>
                    <th className="px-4 py-3 text-right text-sm text-text-primary">{t("withdrawalNetAmount")}</th>
                    <th className="px-4 py-3 text-left text-sm text-text-primary">{t("withdrawalAccount")}</th>
                    <th className="px-4 py-3 text-left text-sm text-text-primary">{tc("status")}</th>
                    <th className="px-4 py-3 text-left text-sm text-text-primary">{tc("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((item: any) => (
                    <tr key={item.id} className="border-b border-border text-sm hover:bg-surface-hover">
                      <td className="px-4 py-3 text-xs text-text-secondary">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-3 font-medium text-text-primary">{item.user?.email || "-"}</td>
                      <td className="px-4 py-3 text-right text-text-primary">¥{Number(item.amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-text-secondary">¥{Number(item.fee).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium text-text-primary">¥{Number(item.netAmount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        <span className="text-xs">{item.accountType}</span>
                        <span className="ml-1 font-mono text-xs">{item.accountNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusStyles[item.status] || "bg-gray-100 text-gray-700"}`}>
                          {t(`withdrawal${item.status.charAt(0).toUpperCase()}${item.status.slice(1)}` as any)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {item.status === "pending" && (
                            <>
                              <button onClick={() => setApproveItem(item)} className="rounded px-2 py-1 text-xs text-green-600 hover:bg-surface-hover border border-green-300">
                                {t("approve")}
                              </button>
                              <button onClick={() => setRejectItem(item)} className="rounded px-2 py-1 text-xs text-red-500 hover:bg-surface-hover border border-red-200">
                                {t("reject")}
                              </button>
                            </>
                          )}
                          {item.status === "approved" && (
                            <button onClick={() => setMarkPaidItem(item)} className="rounded px-2 py-1 text-xs text-green-600 hover:bg-surface-hover border border-green-300">
                              {t("withdrawalMarkPaid")}
                            </button>
                          )}
                          {item.status === "rejected" && item.remark && (
                            <span className="text-xs text-text-tertiary max-w-32 truncate" title={item.remark}>
                              {item.remark}
                            </span>
                          )}
                          {item.status === "paid" && (
                            <span className="text-xs text-text-tertiary">{formatDate(item.paidAt)}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4">
              <NumberedPagination
                page={page}
                pageSize={pageSize}
                total={total}
                onChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      {/* 弹窗 */}
      {approveItem && <ApproveModal item={approveItem} onClose={() => { setApproveItem(null); invalidateAll(); }} />}
      {rejectItem && <RejectModal item={rejectItem} onClose={() => { setRejectItem(null); invalidateAll(); }} />}
      {markPaidItem && <MarkPaidModal item={markPaidItem} onClose={() => { setMarkPaidItem(null); invalidateAll(); }} />}
    </div>
  );
}
