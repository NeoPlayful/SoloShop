import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { LoadingState } from "../../components/LoadingStates.js";
import { Input } from "../../theme/components/form/Input.js";
import toast from "react-hot-toast";

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-text-primary">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${value ? "bg-blue-500" : "bg-gray-300"}`}
      >
        <span className={`inline-block h-4 w-4 translate-y-0 rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

export default function EmailSettingsPage() {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("common");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => apiClient.get("/admin/settings").then((r) => r.data.data),
  });

  const [emailForm, setEmailForm] = useState<Record<string, any>>({});
  const [initialized, setInitialized] = useState(false);

  const emailMutation = useMutation({
    mutationFn: (body: Record<string, any>) => apiClient.patch("/admin/settings/email", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success(t("operationSuccess"));
    },
  });

  const [testEmailTo, setTestEmailTo] = useState(() => localStorage.getItem("soloshop-test-email") || "");

  useEffect(() => {
    localStorage.setItem("soloshop-test-email", testEmailTo);
  }, [testEmailTo]);

  const testEmailMutation = useMutation({
    mutationFn: (to: string) => apiClient.post("/admin/settings/email/test", { to }),
    onSuccess: () => {
      toast.success(t("testEmailSent"));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || err?.message || tc("operationFailed");
      toast.error(t("testEmailFailed") + ": " + msg);
    },
  });

  if (isLoading) return <LoadingState />;

  if (data && !initialized) {
    setInitialized(true);
    setEmailForm({
      enabled: data.email_enabled !== false,
      smtp_host: data.email_smtp_host ?? "",
      smtp_port: data.email_smtp_port ?? 465,
      smtp_secure: data.email_smtp_secure !== false,
      smtp_user: data.email_smtp_user ?? "",
      smtp_pass: data.email_smtp_pass ?? "",
      from_name: data.email_from_name ?? "",
      from_address: data.email_from_address ?? "",
    });
  }

  const handleSave = () => {
    emailMutation.mutate(emailForm);
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-text-primary">{t("emailSettings")}</h1>

      <div className="mb-6 rounded-lg bg-surface p-6 shadow">
        <div className="space-y-4">
          <Toggle
            label={t("emailEnabled")}
            value={emailForm.enabled ?? false}
            onChange={(v) => setEmailForm({ ...emailForm, enabled: v })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t("smtpHost")}
              value={emailForm.smtp_host ?? ""}
              onChange={(e) => setEmailForm({ ...emailForm, smtp_host: e.target.value })}
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  label={t("smtpPort")}
                  type="number"
                  min={1}
                  max={65535}
                  value={emailForm.smtp_port ?? 465}
                  onChange={(e) => setEmailForm({ ...emailForm, smtp_port: parseInt(e.target.value) || 465 })}
                />
              </div>
              <div className="pt-5">
                <Toggle
                  label={t("smtpSecure")}
                  value={emailForm.smtp_secure !== false}
                  onChange={(v) => setEmailForm({ ...emailForm, smtp_secure: v, smtp_port: v ? 465 : 587 })}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t("smtpUser")}
              value={emailForm.smtp_user ?? ""}
              onChange={(e) => setEmailForm({ ...emailForm, smtp_user: e.target.value })}
            />
            <Input
              label={t("smtpPass")}
              type="password"
              value={emailForm.smtp_pass ?? ""}
              onChange={(e) => setEmailForm({ ...emailForm, smtp_pass: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t("fromName")}
              value={emailForm.from_name ?? ""}
              onChange={(e) => setEmailForm({ ...emailForm, from_name: e.target.value })}
            />
            <Input
              label={t("fromAddress")}
              value={emailForm.from_address ?? ""}
              onChange={(e) => setEmailForm({ ...emailForm, from_address: e.target.value })}
            />
          </div>
          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={emailMutation.isPending}
              className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {emailMutation.isPending ? tc("saving") : tc("save")}
            </button>
          </div>
        </div>
      </div>

      {/* ── 测试发件 ── */}
      <div className="rounded-lg bg-surface p-6 shadow">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">{t("testEmail")}</span>
          <div className="flex-1 border-t border-border" />
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              label={t("sendTestEmailTo")}
              type="email"
              value={testEmailTo}
              onChange={(e) => setTestEmailTo(e.target.value)}
              placeholder={t("enterTestEmailPlaceholder")}
            />
          </div>
          <button
            onClick={() => testEmailTo && testEmailMutation.mutate(testEmailTo)}
            disabled={!testEmailTo || testEmailMutation.isPending}
            className="mb-0.5 rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {testEmailMutation.isPending ? t("testEmailSending") : t("sendTestEmail")}
          </button>
        </div>
      </div>

    </div>
  );
}
