import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { LoadingState } from "../../components/LoadingStates.js";
import toast from "react-hot-toast";
import { NumberedPagination } from "../../theme/components/navigation/NumberedPagination.js";
import { formatDate } from "../../utils/format.js";
import {
  UserGroupIcon,
  CurrencyYenIcon,
  PresentationChartBarIcon,
  CursorArrowRaysIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

/* ========== KPI 卡片 ========== */

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  accent: "blue" | "green" | "amber" | "purple" | "red";
  loading?: boolean;
}

const accentStyles: Record<string, { bg: string; icon: string }> = {
  blue: { bg: "bg-blue-50", icon: "text-blue-500" },
  green: { bg: "bg-green-100", icon: "text-green-500" },
  amber: { bg: "bg-yellow-100", icon: "text-yellow-500" },
  purple: { bg: "bg-purple-50", icon: "text-purple-500" },
  red: { bg: "bg-red-100", icon: "text-red-500" },
};

function KpiCard({ icon, label, value, unit = "", accent, loading }: KpiCardProps) {
  const s = accentStyles[accent];

  if (loading) {
    return (
      <div className="rounded-xl bg-surface p-4 shadow-card">
        <div className="mb-3 h-9 w-9 animate-pulse rounded-lg bg-gray-200" />
        <div className="mb-1.5 h-3 w-14 animate-pulse rounded bg-gray-200" />
        <div className="h-6 w-20 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

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

/* ========== 推广人订单详情弹窗 ========== */

function PromoterOrdersModal({ userId, email, onClose }: { userId: number; email: string; onClose: () => void }) {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("common");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-promotion-orders", userId, page, pageSize],
    queryFn: () =>
      apiClient.get(`/admin/promotion/${userId}/orders?page=${page}&pageSize=${pageSize}`).then((r) => r.data.data),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="mx-4 w-full max-w-2xl rounded-lg bg-surface shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold text-text-primary">
            {t("promoterOrders")} - {email}
          </h2>
          <button onClick={onClose} className="rounded p-1 text-text-secondary hover:bg-surface-hover transition-colors">
            <span className="text-lg">&times;</span>
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <LoadingState />
          ) : !data || !data.list || data.list.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-secondary">
              {t("noData", { ns: "common" })}
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-xs text-text-secondary">
                    <th className="px-3 py-2 text-left">{t("orderNo", { ns: "common" })}</th>
                    <th className="px-3 py-2 text-left">{t("product2")}</th>
                    <th className="px-3 py-2 text-right">{t("amount", { ns: "common" })}</th>
                    <th className="px-3 py-2 text-right">{t("promotionCommission")}</th>
                    <th className="px-3 py-2 text-right">{tc("time")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.list.map((order: any) => (
                    <tr key={order.orderNo} className="border-b border-border text-sm hover:bg-surface-hover">
                      <td className="px-3 py-2.5 font-mono text-xs text-text-primary">{order.orderNo}</td>
                      <td className="px-3 py-2.5 text-text-primary">{order.productSnapshot?.name || "-"}</td>
                      <td className="px-3 py-2.5 text-right text-text-primary">
                        ¥{Number(order.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-text-primary">
                        {order.commissionAmount
                          ? `¥${Number(order.commissionAmount).toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-right text-text-secondary text-xs">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-2">
                <NumberedPagination
                  page={data.page}
                  pageSize={pageSize}
                  total={data.total}
                  onChange={setPage}
                  pageSizeOptions={[10, 20, 50, 100]}
                  onPageSizeChange={(nextPageSize) => {
                    setPageSize(nextPageSize);
                    setPage(1);
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========== 审批弹窗 ========== */

function ApproveModal({ item, onClose }: { item: any; onClose: () => void }) {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("common");
  const queryClient = useQueryClient();

  const [commissionRate, setCommissionRate] = useState(10);

  const { data: settings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => apiClient.get("/admin/settings").then((r) => r.data.data),
    staleTime: 300_000,
  });

  // 设置加载后更新默认佣金比例
  useEffect(() => {
    if (settings?.promotion_default_commission_rate != null) {
      setCommissionRate(Number(settings.promotion_default_commission_rate) * 100);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (body: any) => apiClient.post(`/admin/promotion/${item.id}/approve`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotion"] });
      toast.success(t("operationSuccess"));
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ commissionRate: commissionRate / 100 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-bold text-text-primary">{t("approve")}</h2>
        <p className="mb-4 text-sm text-text-secondary">{tc("email")}: {item.email || "-"}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-text-primary">{t("commissionRate")}</label>
            <div className="flex items-center gap-2">
              <input type="number" min={0} max={100} step={0.1} value={commissionRate} onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)} className="w-24 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500" />
              <span className="text-sm text-text-secondary">%</span>
            </div>
            <p className="mt-0.5 text-xs text-text-secondary">{t("promotionCode")}: {t("autoGenerate")}</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover transition-colors">{tc("cancel")}</button>
            <button type="submit" disabled={saveMutation.isPending} className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 transition-colors disabled:opacity-50">
              {tc("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========== 配置弹窗 ========== */

function SettingsModal({ item, onClose }: { item: any; onClose: () => void }) {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("common");
  const queryClient = useQueryClient();
  const info = item.promotionInfo;

  const [commissionRate, setCommissionRate] = useState(info ? Number(info.commissionRate) * 100 : 10);

  const saveMutation = useMutation({
    mutationFn: (body: any) => apiClient.patch(`/admin/promotion/${item.id}/settings`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotion"] });
      toast.success(t("saveSuccess"));
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ commissionRate: commissionRate / 100 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-bold text-text-primary">{t("config")} - {item.email}</h2>
        <div className="mb-4 rounded-lg bg-surface-alt p-3 text-sm text-text-secondary space-y-1">
          <p>{t("promotionCode")}: <span className="font-mono text-text-primary">{info?.referralCode}</span></p>
          <p>{t("promotionClicks")}: {info?.clickCount} | {t("promotionOrders")}: {info?.orderCount}</p>
          <p>{t("promotionSales")}: ¥{Number(info?.totalSales ?? 0).toFixed(2)} | {t("promotionCommission")}: ¥{Number(info?.totalCommission ?? 0).toFixed(2)}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-text-primary">{t("commissionRate")}</label>
            <div className="flex items-center gap-2">
              <input type="number" min={0} max={100} step={0.1} value={commissionRate} onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)} className="w-24 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500" />
              <span className="text-sm text-text-secondary">%</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover transition-colors">{tc("cancel")}</button>
            <button type="submit" disabled={saveMutation.isPending} className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 transition-colors disabled:opacity-50">
              {tc("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========== 主页面 ========== */

export default function PromotionPage() {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("common");
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState<any>(null);
  const [approveItem, setApproveItem] = useState<any>(null);
  const [detailItem, setDetailItem] = useState<any>(null);

  // 搜索/筛选/分页
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 总览统计
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["admin-promotion-overview"],
    queryFn: () => apiClient.get("/admin/promotion/overview").then((r) => r.data.data),
    refetchInterval: 30000,
  });

  // 推广人列表（已通过 + 待审核统一查询）
  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ["admin-promotion", search, statusFilter, page, pageSize],
    queryFn: () =>
      apiClient
        .get("/admin/promotion", {
          params: { search, status: statusFilter !== "all" ? statusFilter : undefined, page, pageSize },
        })
        .then((r) => r.data.data),
  });

  // 待审核列表（独立查询，不受搜索/筛选影响）
  const { data: pendingData } = useQuery({
    queryKey: ["admin-promotion-pending"],
    queryFn: () =>
      apiClient.get("/admin/promotion", { params: { page: 1, pageSize: 100, status: undefined } })
        .then((r) => r.data.data),
    refetchInterval: 15000,
  });

  const list = listData?.list || [];
  const total = listData?.total || 0;
  const pending = (pendingData?.list || []).filter((item: any) => !item.promotionInfo);

  const disableMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`/admin/promotion/${id}/disable`),
    onSuccess: () => { invalidateAll(); toast.success(t("operationSuccess")); },
  });

  const enableMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`/admin/promotion/${id}/enable`),
    onSuccess: () => { invalidateAll(); toast.success(t("operationSuccess")); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/admin/promotion/${id}`),
    onSuccess: () => { invalidateAll(); toast.success(t("deleteSuccess")); },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`/admin/promotion/${id}/reject`),
    onSuccess: () => { invalidateAll(); toast.success(t("operationSuccess")); },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-promotion"] });
    queryClient.invalidateQueries({ queryKey: ["admin-promotion-overview"] });
    queryClient.invalidateQueries({ queryKey: ["admin-promotion-pending"] });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">{t("promotionManagement")}</h1>
      </div>

      {/* ─── KPI 统计卡片 ─── */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <KpiCard
          icon={<UserGroupIcon className="h-4 w-4" />}
          label={t("approved")}
          value={overview?.promoterCount ?? 0}
          accent="blue"
          loading={overviewLoading}
        />
        <KpiCard
          icon={<ClockIcon className="h-4 w-4" />}
          label={t("pendingApproval")}
          value={overview?.pendingCount ?? 0}
          accent="amber"
          loading={overviewLoading}
        />
        <KpiCard
          icon={<CurrencyYenIcon className="h-4 w-4" />}
          label={t("promotionSales")}
          value={Number(overview?.totalSales ?? 0).toFixed(2)}
          unit={t("unitYuan")}
          accent="green"
          loading={overviewLoading}
        />
        <KpiCard
          icon={<PresentationChartBarIcon className="h-4 w-4" />}
          label={t("promotionCommission")}
          value={Number(overview?.totalCommission ?? 0).toFixed(2)}
          unit={t("unitYuan")}
          accent="purple"
          loading={overviewLoading}
        />
        <KpiCard
          icon={<CursorArrowRaysIcon className="h-4 w-4" />}
          label={t("promotionClicks")}
          value={overview?.totalClicks ?? 0}
          accent="red"
          loading={overviewLoading}
        />
      </div>

      {/* ─── 待审核区域 ─── */}
      {pending.length > 0 && (
        <div className="mb-6 rounded-lg bg-surface shadow">
          <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-amber-600">
            {t("pendingApproval")} ({pending.length})
          </h2>
          <table className="w-full">
            <thead className="border-b border-border bg-surface-alt">
              <tr>
                <th className="px-4 py-3 text-left text-sm text-text-primary">{tc("email")}</th>
                <th className="px-4 py-3 text-left text-sm text-text-primary">{t("contact")}</th>
                <th className="px-4 py-3 text-left text-sm text-text-primary">{tc("createdAt")}</th>
                <th className="px-4 py-3 text-left text-sm text-text-primary">{tc("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((item: any) => (
                <tr key={item.id} className="border-b border-border text-sm hover:bg-surface-hover">
                  <td className="px-4 py-3 text-text-primary">{item.email || "-"}</td>
                  <td className="px-4 py-3 text-text-secondary">{item.contact || "-"}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setApproveItem(item)} className="rounded px-2 py-1 text-xs text-green-600 hover:bg-surface-hover border border-green-300">
                        {t("approve")}
                      </button>
                      <button onClick={() => { if (confirm(t("rejectConfirm"))) rejectMutation.mutate(item.id); }} className="rounded px-2 py-1 text-xs text-red-500 hover:bg-surface-hover border border-red-200">
                        {t("reject")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── 搜索/筛选栏 ─── */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t("searchPromoter")}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 pl-9 text-sm text-text-primary outline-none focus:border-blue-500 transition-colors"
          />
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500 transition-colors"
        >
          <option value="all">{tc("all")}</option>
          <option value="active">{tc("enabled")}</option>
          <option value="inactive">{tc("disabled")}</option>
        </select>
      </div>

      {/* ─── 已通过推广人表格 ─── */}
      <div className="rounded-lg bg-surface shadow">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-text-primary">
          {t("approved")} ({total})
        </h2>

        {listLoading ? (
          <div className="px-4 py-8 text-center text-sm text-text-secondary">{tc("loading")}</div>
        ) : list.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-text-secondary">{tc("noData")}</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="border-b border-border bg-surface-alt">
                <tr>
                  <th className="px-4 py-3 text-left text-sm text-text-primary">{t("promotionCode")}</th>
                  <th className="px-4 py-3 text-left text-sm text-text-primary">{t("promotionName")}</th>
                  <th className="px-4 py-3 text-left text-sm text-text-primary">{t("commissionRate")}</th>
                  <th className="px-4 py-3 text-left text-sm text-text-primary">{t("promotionClicks")}</th>
                  <th className="px-4 py-3 text-left text-sm text-text-primary">{t("promotionOrders")}</th>
                  <th className="px-4 py-3 text-left text-sm text-text-primary">{t("promotionSales")}</th>
                  <th className="px-4 py-3 text-left text-sm text-text-primary">{t("promotionCommission")}</th>
                  <th className="px-4 py-3 text-left text-sm text-text-primary">{tc("status")}</th>
                  <th className="px-4 py-3 text-left text-sm text-text-primary">{tc("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item: any) => {
                  const info = item.promotionInfo;
                  return (
                    <tr key={item.id} className="border-b border-border text-sm hover:bg-surface-hover">
                      <td className="px-4 py-3 font-mono text-xs text-text-primary">{info?.referralCode || "-"}</td>
                      <td className="px-4 py-3 font-medium text-text-primary">{item.email || "-"}</td>
                      <td className="px-4 py-3 text-text-primary">{info ? `${(Number(info.commissionRate) * 100).toFixed(1)}%` : "-"}</td>
                      <td className="px-4 py-3 text-text-primary">{info?.clickCount ?? 0}</td>
                      <td className="px-4 py-3 text-text-primary">{info?.orderCount ?? 0}</td>
                      <td className="px-4 py-3 text-text-primary">¥{Number(info?.totalSales ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-text-primary">¥{Number(info?.totalCommission ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded px-2 py-0.5 text-xs ${item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {item.isActive ? tc("enabled") : tc("disabled")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          <button
                            onClick={() => setDetailItem(item)}
                            className="rounded px-2 py-1 text-xs text-blue-500 hover:bg-surface-hover border border-blue-200"
                          >
                            {tc("detail")}
                          </button>
                          <button onClick={() => setShowSettings(item)} className="rounded px-2 py-1 text-xs text-blue-500 hover:bg-surface-hover border border-blue-200">
                            {t("config")}
                          </button>
                          {item.isActive ? (
                            <button onClick={() => disableMutation.mutate(item.id)} className="rounded px-2 py-1 text-xs text-yellow-500 hover:bg-surface-hover border border-yellow-200">
                              {tc("disabled")}
                            </button>
                          ) : (
                            <button onClick={() => enableMutation.mutate(item.id)} className="rounded px-2 py-1 text-xs text-green-500 hover:bg-surface-hover border border-green-200">
                              {tc("enabled")}
                            </button>
                          )}
                          <button onClick={() => { if (confirm(tc("confirm") + "?")) deleteMutation.mutate(item.id); }} className="rounded px-2 py-1 text-xs text-red-500 hover:bg-surface-hover border border-red-200">
                            {tc("delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 分页 */}
            <div className="px-4">
              <NumberedPagination
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
          </>
        )}
      </div>
      {/* 弹窗 */}
      {approveItem && <ApproveModal item={approveItem} onClose={() => { setApproveItem(null); queryClient.invalidateQueries({ queryKey: ["admin-promotion"] }); }} />}
      {showSettings && <SettingsModal item={showSettings} onClose={() => setShowSettings(null)} />}
      {detailItem && <PromoterOrdersModal userId={detailItem.id} email={detailItem.email} onClose={() => setDetailItem(null)} />}
    </div>
  );
}
