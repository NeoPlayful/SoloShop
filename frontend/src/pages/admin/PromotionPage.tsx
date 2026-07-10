import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { LoadingState } from "../../components/LoadingStates.js";
import toast from "react-hot-toast";

export default function PromotionPage() {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("common");
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState<any>(null);
  const [approveItem, setApproveItem] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-promotion"],
    queryFn: () => apiClient.get("/admin/promotion").then((r) => r.data.data),
  });

  const disableMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`/admin/promotion/${id}/disable`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-promotion"] }); toast.success(t("operationSuccess")); },
  });

  const enableMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`/admin/promotion/${id}/enable`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-promotion"] }); toast.success(t("operationSuccess")); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/admin/promotion/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-promotion"] }); toast.success(t("deleteSuccess")); },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`/admin/promotion/${id}/reject`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-promotion"] }); toast.success(t("operationSuccess")); },
  });

  if (isLoading) return <LoadingState />;

  const pending = (data || []).filter((item: any) => !item.promotionInfo);
  const approved = (data || []).filter((item: any) => item.promotionInfo);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-text-primary">{t("promotionManagement")}</h1>
      </div>

      {/* ─── 待审核 ─── */}
      {pending.length > 0 && (
        <div className="mb-6 rounded-lg bg-surface shadow">
          <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-amber-600">{t("pendingApproval")} ({pending.length})</h2>
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
                  <td className="px-4 py-3 text-text-secondary text-xs">{item.createdAt?.substring(0, 16)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setApproveItem(item)} className="rounded px-2 py-1 text-xs text-green-600 hover:bg-surface-hover border border-green-300">{t("approve")}</button>
                      <button onClick={() => { if (confirm(t("rejectConfirm"))) rejectMutation.mutate(item.id); }} className="rounded px-2 py-1 text-xs text-red-500 hover:bg-surface-hover border border-red-200">{t("reject")}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── 已通过 ─── */}
      <div className="rounded-lg bg-surface shadow">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-text-primary">{t("approved")} ({approved.length})</h2>
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
            {approved.map((item: any) => {
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
                    <div className="flex gap-1">
                      <button onClick={() => setShowSettings(item)} className="rounded px-2 py-1 text-xs text-blue-500 hover:bg-surface-hover">{t("config")}</button>
                      {item.isActive ? (
                        <button onClick={() => disableMutation.mutate(item.id)} className="rounded px-2 py-1 text-xs text-yellow-500 hover:bg-surface-hover">{tc("disabled")}</button>
                      ) : (
                        <button onClick={() => enableMutation.mutate(item.id)} className="rounded px-2 py-1 text-xs text-green-500 hover:bg-surface-hover">{tc("enabled")}</button>
                      )}
                      <button onClick={() => { if (confirm(tc("confirm") + "?")) deleteMutation.mutate(item.id); }} className="rounded px-2 py-1 text-xs text-red-500 hover:bg-surface-hover">{tc("delete")}</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {approved.length === 0 && pending.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-text-secondary">{t("noData")}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {approveItem && <ApproveModal item={approveItem} onClose={() => setApproveItem(null)} />}
      {showSettings && <SettingsModal item={showSettings} onClose={() => setShowSettings(null)} />}
    </div>
  );
}

function ApproveModal({ item, onClose }: { item: any; onClose: () => void }) {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("common");
  const queryClient = useQueryClient();

  const [commissionRate, setCommissionRate] = useState(10);

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
        <div className="mb-4 text-sm text-text-secondary">
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
