import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "../../lib/client.js";
import { LoadingState } from "../../components/LoadingStates.js";
import toast from "react-hot-toast";

export default function MerchantSettings() {
  const { t } = useTranslation("store");

  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiClient.get("/auth/me").then((r) => r.data.data),
    retry: false,
  });

  const [contact, setContact] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 更新联系方式
  const updateProfileMutation = useMutation({
    mutationFn: (body: { contact?: string }) => apiClient.patch("/auth/profile", body),
    onSuccess: () => {
      toast.success(t("common:operationSuccess"));
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || t("common:operationFailed"));
    },
  });

  // 修改密码
  const changePasswordMutation = useMutation({
    mutationFn: (body: { oldPassword: string; newPassword: string }) =>
      apiClient.post("/auth/change-password", body),
    onSuccess: () => {
      toast.success(t("common:operationSuccess"));
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || t("common:operationFailed"));
    },
  });

  if (isLoading) return <LoadingState />;
  if (!user) return null;

  const handleUpdateContact = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ contact: contact || undefined });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t("passwordMismatch"));
      return;
    }
    if (newPassword.length < 6) {
      toast.error(t("passwordTooShort"));
      return;
    }
    changePasswordMutation.mutate({ oldPassword, newPassword });
  };

  const roleLabels: Record<string, string> = {
    buyer: t("buyer"),
    promoter: t("promoter"),
    admin: t("admin"),
    super_admin: t("superAdmin"),
  };

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-text-primary">{t("accountSettings")}</h1>

      {/* 基本信息 */}
      <div className="mb-6 rounded-lg bg-surface p-6 shadow">
        <h2 className="mb-4 text-base font-semibold text-text-primary">{t("basicInfo")}</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <span className="w-20 text-sm text-text-secondary">{t("username")}</span>
            <span className="text-sm text-text-primary">{user.username || "-"}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-20 text-sm text-text-secondary">{t("email")}</span>
            <span className="text-sm text-text-primary">{user.email || "-"}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-20 text-sm text-text-secondary">{t("role")}</span>
            <span className="text-sm text-text-primary">{roleLabels[user.role] || user.role}</span>
          </div>
        </div>
      </div>

      {/* 联系方式 */}
      <div className="mb-6 rounded-lg bg-surface p-6 shadow">
        <h2 className="mb-4 text-base font-semibold text-text-primary">{t("contactInfo")}</h2>
        <form onSubmit={handleUpdateContact} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">{t("contactLabel")}</label>
            <input
              defaultValue={user.contact || ""}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t("contactPlaceholder")}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {updateProfileMutation.isPending ? t("common:loading") : t("save")}
          </button>
        </form>
      </div>

      {/* 修改密码 */}
      <div className="rounded-lg bg-surface p-6 shadow">
        <h2 className="mb-4 text-base font-semibold text-text-primary">{t("changePassword")}</h2>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">{t("oldPassword")}</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">{t("newPassword")}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">{t("confirmPassword")}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {changePasswordMutation.isPending ? t("common:loading") : t("changePassword")}
          </button>
        </form>
      </div>
    </div>
  );
}
