import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { LoadingState } from "../../components/LoadingStates.js";
import toast from "react-hot-toast";

export default function PaymentChannelsPage() {
  const { t } = useTranslation("admin");
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-payment-channels"],
    queryFn: () => apiClient.get("/admin/payment-channels").then((r) => r.data.data),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ code, action }: { code: string; action: "enable" | "disable" }) => apiClient.post(`/admin/payment-channels/${code}/${action}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-payment-channels"] }); toast.success(t("operationSuccess", { ns: "common" })); },
  });

  if (isLoading) return <LoadingState />;
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-text-primary">{t("channelManagement")}</h1>
      <div className="space-y-4">
        {data?.map((ch: any) => (
          <div key={ch.code} className="flex items-center justify-between rounded-lg bg-surface p-4 shadow">
            <div>
              <p className="font-medium text-text-primary">{ch.name}</p>
              <p className="text-sm text-text-secondary">{t("channelCode")}: {ch.code}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded px-2 py-0.5 text-xs ${ch.isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{ch.isEnabled ? t("common:enabled") : t("common:disabled")}</span>
              <button onClick={() => toggleMutation.mutate({ code: ch.code, action: ch.isEnabled ? "disable" : "enable" })} className={`rounded px-3 py-1 text-sm ${ch.isEnabled ? "border border-red-300 text-red-500 hover:bg-red-50" : "border border-green-300 text-green-500 hover:bg-green-50"}`}>{ch.isEnabled ? t("disable") : t("enable")}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
