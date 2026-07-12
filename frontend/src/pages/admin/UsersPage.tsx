import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { LoadingState } from "../../components/LoadingStates.js";
import toast from "react-hot-toast";
import { formatDate } from "../../utils/format.js";

const roleOptions = ["", "buyer", "promoter", "admin", "super_admin"] as const;

export default function UsersPage() {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("common");
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", roleFilter],
    queryFn: () => apiClient.get("/admin/users", { params: { role: roleFilter || undefined } }).then((r) => r.data.data),
  });

  const disableMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`/admin/users/${id}/disable`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); toast.success(t("operationSuccess")); },
  });

  const enableMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`/admin/users/${id}/enable`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); toast.success(t("operationSuccess")); },
  });

  const roleLabels: Record<string, string> = {
    buyer: t("common:buyer") || "买家",
    promoter: t("promotionManagement"),
    admin: t("normalAdmin"),
    super_admin: t("superAdmin"),
  };

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">{t("users")}</h1>
        <div className="flex gap-1">
          {roleOptions.map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)} className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${roleFilter === r ? "bg-blue-500 text-white" : "bg-surface-alt text-text-secondary hover:bg-surface-hover"}`}>
              {r ? roleLabels[r] || r : tc("all")}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-surface shadow">
        <table className="w-full">
          <thead className="border-b border-border bg-surface-alt">
            <tr>
              <th className="px-4 py-3 text-left text-sm text-text-primary">{tc("id")}</th>
              <th className="px-4 py-3 text-left text-sm text-text-primary">{tc("username")}</th>
              <th className="px-4 py-3 text-left text-sm text-text-primary">{t("common:email")}</th>
              <th className="px-4 py-3 text-left text-sm text-text-primary">{t("common:role")}</th>
              <th className="px-4 py-3 text-left text-sm text-text-primary">{t("contact")}</th>
              <th className="px-4 py-3 text-left text-sm text-text-primary">{t("common:status")}</th>
              <th className="px-4 py-3 text-left text-sm text-text-primary">{t("lastLogin")}</th>
              <th className="px-4 py-3 text-left text-sm text-text-primary">{tc("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((item: any) => (
              <tr key={item.id} className="border-b border-border text-sm hover:bg-surface-hover">
                <td className="px-4 py-3 text-text-primary">{item.id}</td>
                <td className="px-4 py-3 font-mono text-xs font-medium text-text-primary">{item.username || "-"}</td>
                <td className="px-4 py-3 text-text-secondary">{item.email || "-"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs ${item.role === "super_admin" ? "bg-purple-100 text-purple-700" : item.role === "admin" ? "bg-blue-100 text-blue-700" : item.role === "promoter" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                    {roleLabels[item.role] || item.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary">{item.contact || "-"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs ${item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {item.isActive ? tc("enabled") : tc("disabled")}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary text-xs">{formatDate(item.lastLoginAt)}</td>
                <td className="px-4 py-3">
                  {item.isActive ? (
                    <button onClick={() => disableMutation.mutate(item.id)} className="rounded px-2 py-1 text-xs text-yellow-500 hover:bg-surface-hover">{tc("disabled")}</button>
                  ) : (
                    <button onClick={() => enableMutation.mutate(item.id)} className="rounded px-2 py-1 text-xs text-green-500 hover:bg-surface-hover">{tc("enabled")}</button>
                  )}
                </td>
              </tr>
            ))}
            {(!data || data.length === 0) && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-text-secondary">{t("noData")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
