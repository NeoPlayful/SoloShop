import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../lib/client.js";
import { LoadingState } from "../../components/LoadingStates.js";
import { formatDate } from "../../utils/format.js";
import toast from "react-hot-toast";

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  paid: "bg-green-100 text-green-700",
};

const statusLabels: Record<string, string> = {
  pending: "withdrawalPending",
  approved: "withdrawalApproved",
  rejected: "withdrawalRejected",
  paid: "withdrawalPaid",
};

export default function MerchantWithdrawal() {
  const { t } = useTranslation("store");
  const { t: tc } = useTranslation("common");
  const queryClient = useQueryClient();

  // 查询余额
  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ["merchant-withdrawal-balance"],
    queryFn: () => apiClient.get("/merchant/withdrawal/balance").then((r) => r.data.data),
    retry: false,
  });

  // 提现记录
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["merchant-withdrawal-history"],
    queryFn: () => apiClient.get("/merchant/withdrawal/history").then((r) => r.data.data),
    retry: false,
  });

  // 获取启用的提现方式
  const { data: settings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => apiClient.get("/public/settings").then((r) => r.data.data),
    staleTime: 60000,
  });
  const accountTypes: string[] = settings?.promotion_withdrawal_account_types ?? ["支付宝", "微信支付", "银行卡"];

  // 表单
  const [amount, setAmount] = useState("");
  const [accountType, setAccountType] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const applyMutation = useMutation({
    mutationFn: (body: any) => apiClient.post("/merchant/withdrawal/apply", body),
    onSuccess: () => {
      toast.success(t("withdrawalSubmitSuccess"));
      setAmount("");
      setAccountName("");
      setAccountNumber("");
      queryClient.invalidateQueries({ queryKey: ["merchant-withdrawal-balance"] });
      queryClient.invalidateQueries({ queryKey: ["merchant-withdrawal-history"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || tc("operationFailed"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error(t("withdrawalAmountRequired"));
      return;
    }
    if (numAmount < 10) {
      toast.error(t("withdrawalMinAmount"));
      return;
    }
    if (numAmount > Number(balance?.availableBalance ?? 0)) {
      toast.error(t("withdrawalExceedsBalance"));
      return;
    }
    if (!accountNumber) {
      toast.error(t("withdrawalAccountRequired"));
      return;
    }
    applyMutation.mutate({
      amount: numAmount,
      accountType,
      accountName: accountName || undefined,
      accountNumber,
    });
  };

  if (balanceLoading) return <LoadingState />;
  if (!balance) {
    return (
      <div className="rounded-lg bg-surface p-8 text-center shadow">
        <p className="mb-3 text-sm text-text-secondary">{t("notPromoterYet")}</p>
        <Link to="/merchant/overview" className="inline-block rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 transition-colors">
          {t("goToApply")}
        </Link>
      </div>
    );
  }

  const availableBalance = Number(balance.availableBalance ?? 0);
  const isValidAmount = amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-text-primary">{t("withdrawalTitle")}</h1>

      {/* 余额卡片 */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-surface p-4 shadow">
          <p className="text-xs text-text-secondary">{t("withdrawalTotalCommission")}</p>
          <p className="mt-1 text-xl font-bold text-text-primary">
            ¥{Number(balance.totalCommission).toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg bg-surface p-4 shadow">
          <p className="text-xs text-text-secondary">{t("withdrawalWithdrawn")}</p>
          <p className="mt-1 text-xl font-bold text-text-secondary">
            ¥{Number(balance.withdrawnAmount).toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg bg-surface p-4 shadow">
          <p className="text-xs text-text-secondary">{t("withdrawalBalance")}</p>
          <p className="mt-1 text-xl font-bold text-green-600">
            ¥{availableBalance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* 申请表单 */}
      <div className="mb-6 rounded-lg bg-surface p-6 shadow">
        <h2 className="mb-4 text-base font-semibold text-text-primary">{t("withdraw")}</h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">{t("withdrawalAmount")}</label>
            <div className="relative">
              <input
                type="number"
                min={10}
                max={availableBalance}
                step={0.01}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t("withdrawalAmountPlaceholder")}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 pr-8 text-sm text-text-primary outline-none focus:border-blue-500 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">¥</span>
            </div>
            <p className="mt-1 text-xs text-text-tertiary">
              {t("withdrawalBalance")}: ¥{availableBalance.toFixed(2)} | {t("withdrawalMinAmount")}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">{t("withdrawalAccountType")}</label>
            <div className="flex flex-wrap gap-3">
              {accountTypes.map((type) => (
                <label
                  key={type}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm cursor-pointer transition-colors ${accountType === type ? "border-blue-500 bg-blue-50 text-blue-700" : "border-border text-text-secondary hover:bg-surface-hover"}`}
                >
                  <input
                    type="radio"
                    name="accountType"
                    value={type}
                    checked={accountType === type}
                    onChange={() => setAccountType(type)}
                    className="sr-only"
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">{t("withdrawalAccountName")}</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder={t("withdrawalAccountNamePlaceholder")}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">{t("withdrawalAccountNumber")}</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder={t("withdrawalAccountNumberPlaceholder")}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={applyMutation.isPending || availableBalance <= 0}
            className="w-full rounded-lg bg-blue-500 py-2.5 text-sm text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {applyMutation.isPending ? tc("loading") : t("withdrawalSubmit")}
          </button>
        </form>
      </div>

      {/* 提现记录 */}
      <div className="rounded-lg bg-surface shadow">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-text-primary">
          {t("withdrawalHistory")}
        </h2>
        {historyLoading ? (
          <LoadingState />
        ) : !history || history.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-text-secondary">{t("withdrawalNoHistory")}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead className="border-b border-border bg-surface-alt">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs text-text-secondary">{tc("time")}</th>
                    <th className="px-4 py-2.5 text-right text-xs text-text-secondary">{t("withdrawalAmount")}</th>
                    <th className="px-4 py-2.5 text-left text-xs text-text-secondary">{t("withdrawalAccountType")}</th>
                    <th className="px-4 py-2.5 text-center text-xs text-text-secondary">{tc("status")}</th>
                    <th className="px-4 py-2.5 text-left text-xs text-text-secondary">{t("withdrawalRemark")}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item: any) => (
                    <tr key={item.id} className="border-b border-border text-sm hover:bg-surface-hover">
                      <td className="px-4 py-3 text-xs text-text-secondary">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-3 text-right font-medium text-text-primary">¥{Number(item.amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-text-secondary text-xs">
                        {item.accountType}
                        {item.accountName ? ` (${item.accountName})` : ""}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusStyles[item.status] || "bg-gray-100 text-gray-700"}`}>
                          {t(statusLabels[item.status] || item.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-tertiary">
                        {item.remark || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
