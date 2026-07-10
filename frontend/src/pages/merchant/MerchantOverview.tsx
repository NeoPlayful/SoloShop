import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "../../lib/client.js";
import { LoadingState } from "../../components/LoadingStates.js";
import toast from "react-hot-toast";

export default function MerchantOverview() {
  const { t } = useTranslation("store");
  const [contact, setContact] = useState("");

  // 用户信息（从 react-query 缓存读取，无需额外请求）
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiClient.get("/auth/me").then((r) => r.data.data),
    retry: false,
  });

  // 推广统计数据（已通过推广人或管理员）
  const referralCode = user?.promotionInfo?.referralCode;
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["promotion-stats", referralCode],
    queryFn: () => apiClient.get(`/public/promotion/${referralCode}/stats`).then((r) => r.data.data),
    enabled: !!referralCode,
  });

  // 申请推广
  const applyMutation = useMutation({
    mutationFn: (body: { contact?: string }) => apiClient.post("/public/promotion/apply", body),
    onSuccess: () => {
      toast.success(t("applySubmitted"));
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || t("common:operationFailed"));
    },
  });

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  if (isLoading) return <LoadingState />;
  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyMutation.mutate({ contact: contact || undefined });
  };

  return (
    <div>
      {/* ─── 管理员/已通过推广人：KPI 卡片 ─── */}
      {(isAdmin || (user.role === "promoter" && user.promotionInfo)) && (
        <>
          {statsLoading ? (
            <LoadingState />
          ) : stats ? (
            <div>
              <h1 className="mb-6 text-xl font-bold text-text-primary">{t("promotionCenter")}</h1>

              {/* KPI 卡片 */}
              <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg bg-surface p-4 shadow">
                  <p className="text-xs text-text-secondary">{t("promotionClicks")}</p>
                  <p className="mt-1 text-2xl font-bold text-text-primary">{stats.clickCount}</p>
                </div>
                <div className="rounded-lg bg-surface p-4 shadow">
                  <p className="text-xs text-text-secondary">{t("promotionOrders")}</p>
                  <p className="mt-1 text-2xl font-bold text-text-primary">{stats.orderCount}</p>
                </div>
                <div className="rounded-lg bg-surface p-4 shadow">
                  <p className="text-xs text-text-secondary">{t("promotionSales")}</p>
                  <p className="mt-1 text-2xl font-bold text-text-primary">¥{Number(stats.totalSales).toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-surface p-4 shadow">
                  <p className="text-xs text-text-secondary">{t("promotionCommission")}</p>
                  <p className="mt-1 text-2xl font-bold text-green-600">¥{Number(stats.totalCommission).toFixed(2)}</p>
                </div>
              </div>

              {/* 佣金比例信息 */}
              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
                {t("commissionRateInfo", { rate: (Number(stats.commissionRate) * 100).toFixed(1) })}
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-surface p-8 text-center shadow">
              <p className="text-sm text-text-secondary">{t("noPromotionOrders")}</p>
            </div>
          )}
        </>
      )}

      {/* ─── 待审核 ─── */}
      {user.role === "promoter" && !user.promotionInfo && (
        <div className="mx-auto max-w-md rounded-lg bg-surface p-8 text-center shadow">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            {t("pendingApprovalStatus")}
          </div>
          <p className="text-sm text-text-secondary">{t("applySubmitted")}</p>
        </div>
      )}

      {/* ─── 买家：申请推广 ─── */}
      {user.role === "buyer" && (
        <div className="mx-auto max-w-md rounded-lg bg-surface p-8 shadow">
          <h1 className="mb-6 text-center text-xl font-bold text-text-primary">{t("applyFormTitle")}</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">{t("contactLabel")}</label>
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={t("contactPlaceholder")}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={applyMutation.isPending}
              className="w-full rounded-lg bg-blue-500 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {applyMutation.isPending ? t("common:loading") : t("applyPromoter")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
