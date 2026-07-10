import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "../lib/client.js";
import { LoadingState } from "../components/LoadingStates.js";
import toast from "react-hot-toast";

export default function PromoterApplyPage() {
  const { t } = useTranslation("store");
  const [contact, setContact] = useState("");

  // 获取当前登录用户信息
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiClient.get("/auth/me").then((r) => r.data.data),
    retry: false,
  });

  // 提交申请
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyMutation.mutate({ contact: contact || undefined });
  };

  if (isLoading) return <LoadingState />;

  // 未登录
  if (!user) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <div className="rounded-lg bg-surface p-8 shadow-lg">
          <h1 className="mb-4 text-2xl font-bold text-text-primary">{t("applyFormTitle")}</h1>
          <p className="mb-6 text-sm text-text-secondary">{t("common:login")}</p>
          <Link to="/login" className="inline-block rounded-lg bg-blue-500 px-6 py-2 text-sm text-white hover:bg-blue-600 transition-colors">
            {t("login")}
          </Link>
        </div>
      </div>
    );
  }

  // 管理员
  if (user.role === "admin" || user.role === "super_admin") {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <div className="rounded-lg bg-surface p-8 shadow-lg">
          <h1 className="mb-4 text-2xl font-bold text-text-primary">{t("applyFormTitle")}</h1>
          <p className="text-sm text-text-secondary">{t("common:login")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <div className="rounded-lg bg-surface p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-text-primary">{t("applyFormTitle")}</h1>

        {/* 已申请待审核 */}
        {user.role === "promoter" && !user.promotionInfo && (
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              {t("pendingApprovalStatus")}
            </div>
            <p className="text-sm text-text-secondary">{t("applySubmitted")}</p>
          </div>
        )}

        {/* 已是推广人 */}
        {user.role === "promoter" && user.promotionInfo && (
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm text-green-700">
              {t("approvedStatus")}
            </div>
            <p className="mb-4 text-sm text-text-secondary">
              {t("promotionCode")}: <span className="font-mono text-text-primary">{user.promotionInfo.referralCode}</span>
            </p>
            <Link
              to={`/promotion/${user.promotionInfo.referralCode}`}
              className="inline-block rounded-lg bg-blue-500 px-6 py-2 text-sm text-white hover:bg-blue-600 transition-colors"
            >
              {t("promotionCenter")}
            </Link>
          </div>
        )}

        {/* 可申请（buyer 角色） */}
        {user.role === "buyer" && (
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
        )}
      </div>
    </div>
  );
}
