import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { LoadingState } from "../../components/LoadingStates.js";
import { Modal } from "../../components/Modal.js";
import { NumberedPagination } from "../../theme/components/navigation/NumberedPagination.js";
import toast from "react-hot-toast";

/**
 * 各渠道配置字段定义
 * 用于动态渲染编辑 Modal 中的表单
 */
type ConfigField = {
  key: string;
  labelKey: string;
  type?: "text" | "password";
};

const channelConfigFields: Record<string, ConfigField[]> = {
  epay: [
    { key: "apiUrl", labelKey: "apiUrl" },
    { key: "pid", labelKey: "pid" },
    { key: "key", labelKey: "merchantKey", type: "password" },
  ],
  alipay: [
    { key: "apiUrl", labelKey: "apiUrl" },
    { key: "pid", labelKey: "pid" },
    { key: "key", labelKey: "merchantKey", type: "password" },
  ],
  wxpay: [
    { key: "apiUrl", labelKey: "apiUrl" },
    { key: "pid", labelKey: "pid" },
    { key: "key", labelKey: "merchantKey", type: "password" },
  ],
  stripe: [
    { key: "secretKey", labelKey: "secretKey", type: "password" },
    { key: "webhookSecret", labelKey: "webhookSecret", type: "password" },
  ],
  mock: [],
};

export default function PaymentChannelsPage() {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("common");
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 编辑 Modal 状态
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [configForm, setConfigForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payment-channels", page, pageSize],
    queryFn: () => apiClient.get("/admin/payment-channels", { params: { page, pageSize } }).then((r) => r.data.data),
  });

  // 获取单个渠道完整配置
  const { data: channelDetail } = useQuery({
    queryKey: ["admin-payment-channel-detail", editingCode],
    queryFn: () => apiClient.get(`/admin/payment-channels/${editingCode}`).then((r) => r.data.data),
    enabled: !!editingCode,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ code, action }: { code: string; action: "enable" | "disable" }) => apiClient.post(`/admin/payment-channels/${code}/${action}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-payment-channels"] }); toast.success(tc("operationSuccess")); },
  });

  const channels = data?.items || [];
  const total = data?.total || 0;

  // 打开编辑 Modal
  const openEdit = (code: string) => {
    setEditingCode(code);
    setConfigForm({});
  };

  // 当渠道详情加载完成时，预填表单
  const editingChannel = channelDetail || channels.find((ch: any) => ch.code === editingCode);
  const detailLoaded = !!channelDetail;

  // 保存配置
  const handleSaveConfig = async () => {
    if (!editingCode) return;
    setSaving(true);
    try {
      await apiClient.patch(`/admin/payment-channels/${editingCode}`, { config: configForm });
      qc.invalidateQueries({ queryKey: ["admin-payment-channels"] });
      toast.success(tc("operationSuccess"));
      setEditingCode(null);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || tc("operationFailed");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-text-primary">{t("channelManagement")}</h1>
      <div className="space-y-4">
        {channels.map((ch: any) => (
          <div key={ch.code} className="flex items-center justify-between rounded-lg bg-surface p-4 shadow">
            <div>
              <p className="font-medium text-text-primary">{ch.name}</p>
              <p className="text-sm text-text-secondary">{t("channelCode")}: {ch.code}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded px-2 py-0.5 text-xs ${ch.isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{ch.isEnabled ? tc("enabled") : tc("disabled")}</span>
              <button onClick={() => openEdit(ch.code)} className="rounded px-3 py-1 text-sm border border-blue-300 text-blue-500 hover:bg-blue-50">{tc("edit")}</button>
              <button onClick={() => toggleMutation.mutate({ code: ch.code, action: ch.isEnabled ? "disable" : "enable" })} className={`rounded px-3 py-1 text-sm ${ch.isEnabled ? "border border-red-300 text-red-500 hover:bg-red-50" : "border border-green-300 text-green-500 hover:bg-green-50"}`}>{ch.isEnabled ? t("disable") : t("enable")}</button>
            </div>
          </div>
        ))}
        <div className="px-1">
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
      </div>

      {/* ─── 编辑配置 Modal ─── */}
      <Modal
        open={!!editingCode}
        title={`${t("editChannel")} - ${editingChannel?.name || ""}`}
        onClose={() => setEditingCode(null)}
      >
        <div className="space-y-4">
          {!detailLoaded && editingCode !== "mock" ? (
            <div className="py-4 text-center text-sm text-text-tertiary">{tc("loading")}</div>
          ) : (
            <>
              {/* 配置字段 */}
              {channelConfigFields[editingCode || ""]?.length > 0 ? (
                channelConfigFields[editingCode || ""].map((field) => (
                  <div key={field.key}>
                    <label className="mb-1 block text-xs text-text-secondary">{t(field.labelKey)}</label>
                    <input
                      type={field.type || "text"}
                      value={configForm[field.key] ?? (editingChannel?.config?.[field.key] ?? "")}
                      onChange={(e) => setConfigForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500"
                    />
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-sm text-text-tertiary">{t("configHintNoConfig")}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setEditingCode(null)} className="rounded border border-border px-4 py-2 text-sm text-text-primary hover:bg-surface-hover">{tc("cancel")}</button>
                {channelConfigFields[editingCode || ""]?.length > 0 && (
                  <button onClick={handleSaveConfig} disabled={saving} className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 transition-colors disabled:opacity-50">
                    {saving ? tc("saving") : t("saveConfig")}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
