import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/client.js";
import { LoadingState } from "../../components/LoadingStates.js";

export default function MerchantPromotionLink() {
  const { t } = useTranslation("store");
  const [copied, setCopied] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiClient.get("/auth/me").then((r) => r.data.data),
    retry: false,
  });

  const referralCode = user?.promotionInfo?.referralCode;

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["promotion-stats", referralCode],
    queryFn: () => apiClient.get(`/public/promotion/${referralCode}/stats`).then((r) => r.data.data),
    enabled: !!referralCode,
  });

  if (isLoading || statsLoading) return <LoadingState />;
  if (!referralCode || !stats) {
    return (
      <div className="rounded-lg bg-surface p-8 text-center shadow">
        <p className="mb-3 text-sm text-text-secondary">{t("notPromoterYet")}</p>
        <Link to="/merchant/overview" className="inline-block rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 transition-colors">
          {t("goToApply")}
        </Link>
      </div>
    );
  }

  const promoLink = `${window.location.origin}/?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(promoLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-text-primary">{t("sidebarPromotionLink")}</h1>

      <div className="rounded-lg bg-surface p-6 shadow">
        <label className="mb-2 block text-sm font-medium text-text-primary">{t("yourPromotionLink")}</label>
        <div className="flex gap-2">
          <input
            readOnly
            value={promoLink}
            className="flex-1 rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-text-primary outline-none font-mono"
          />
          <button
            onClick={handleCopy}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 transition-colors shrink-0"
          >
            {copied ? t("copied") : t("copy")}
          </button>
        </div>
      </div>

      {/* 佣金比例信息 */}
      <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
        {t("commissionRateInfo", { rate: (Number(stats.commissionRate) * 100).toFixed(1) })}
      </div>
    </div>
  );
}
