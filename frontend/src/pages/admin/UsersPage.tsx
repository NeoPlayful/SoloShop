import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { LoadingState } from "../../components/LoadingStates.js";
import { Modal } from "../../components/Modal.js";
import { ConfirmDialog } from "../../components/ConfirmDialog.js";
import { NumberedPagination } from "../../theme/components/navigation/NumberedPagination.js";
import toast from "react-hot-toast";
import { formatDate } from "../../utils/format.js";

const roleOptions = ["", "buyer", "promoter", "admin", "super_admin"] as const;

interface UserForm {
  username: string;
  password: string;
  email: string;
  contact: string;
  role: string;
  remark: string;
  referralCode: string;
  commissionRate: string;
}

const emptyForm: UserForm = {
  username: "",
  password: "",
  email: "",
  contact: "",
  role: "buyer",
  remark: "",
  referralCode: "",
  commissionRate: "10",
};

export default function UsersPage() {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("common");
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modal 状态
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  // 删除确认
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", roleFilter, page, pageSize],
    queryFn: () => apiClient.get("/admin/users", { params: { role: roleFilter || undefined, page, pageSize } }).then((r) => r.data.data),
  });
  const list = data?.items || [];
  const total = data?.total || 0;

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

  // ── 打开新建 Modal ──
  const openAddModal = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  // ── 打开编辑 Modal ──
  const openEditModal = (user: any) => {
    setEditingUser(user);
    setForm({
      username: user.username || "",
      password: "",
      email: user.email || "",
      contact: user.contact || "",
      role: user.role || "buyer",
      remark: user.remark || "",
      referralCode: user.promotionInfo?.referralCode || "",
      commissionRate: user.promotionInfo?.commissionRate
        ? String(Number(user.promotionInfo.commissionRate) * 100)
        : "10",
    });
    setModalOpen(true);
  };

  // ── 保存（新建/编辑） ──
  const handleSave = async () => {
    if (!form.username) {
      toast.error(tc("requiredField", { field: tc("username") }));
      return;
    }
    if (!form.email) {
      toast.error(tc("requiredField", { field: tc("email") }));
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        username: form.username,
        email: form.email,
        contact: form.contact || undefined,
        role: form.role,
        remark: form.remark || undefined,
      };

      if (editingUser) {
        // 编辑模式
        if (form.password) payload.password = form.password;
        if (form.role === "promoter" && form.commissionRate) {
          payload.commissionRate = Number(form.commissionRate) / 100;
        }
        await apiClient.patch(`/admin/users/${editingUser.id}`, payload);
        toast.success(t("operationSuccess"));
      } else {
        // 新建模式
        if (!form.password) {
          toast.error(t("common:requiredField", { field: t("common:password") }));
          setSaving(false);
          return;
        }
        payload.password = form.password;
        if (form.role === "promoter") {
          payload.referralCode = form.referralCode || undefined;
          payload.commissionRate = Number(form.commissionRate) / 100;
        }
        await apiClient.post("/admin/users", payload);
        toast.success(t("operationSuccess"));
      }
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setModalOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || tc("operationFailed");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── 删除 ──
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(t("operationSuccess"));
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || err?.message || tc("operationFailed");
      toast.error(msg);
      setDeleteTarget(null);
    },
  });

  if (isLoading) return <LoadingState />;

  const updateField = (field: keyof UserForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">{t("users")}</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {roleOptions.map((r) => (
              <button key={r} onClick={() => { setRoleFilter(r); setPage(1); }} className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${roleFilter === r ? "bg-blue-500 text-white" : "bg-surface-alt text-text-secondary hover:bg-surface-hover"}`}>
                {r ? roleLabels[r] || r : tc("all")}
              </button>
            ))}
          </div>
          <button onClick={openAddModal} className="rounded-lg bg-blue-500 px-4 py-1.5 text-xs text-white hover:bg-blue-600 transition-colors">
            + {t("addUser")}
          </button>
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
            {list.map((item: any) => (
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
                  <div className="flex items-center gap-2">
                    {item.isActive ? (
                      <button onClick={() => disableMutation.mutate(item.id)} className="rounded px-2 py-1 text-xs text-yellow-500 hover:bg-surface-hover">{tc("disabled")}</button>
                    ) : (
                      <button onClick={() => enableMutation.mutate(item.id)} className="rounded px-2 py-1 text-xs text-green-500 hover:bg-surface-hover">{tc("enabled")}</button>
                    )}
                    <button onClick={() => openEditModal(item)} className="rounded px-2 py-1 text-xs text-blue-500 hover:bg-surface-hover">{tc("edit")}</button>
                    {item.role !== "super_admin" && (
                      <button onClick={() => setDeleteTarget(item)} className="rounded px-2 py-1 text-xs text-red-500 hover:bg-surface-hover">{tc("delete")}</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-text-secondary">{t("noData")}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <NumberedPagination
          page={page}
          pageSize={pageSize}
          total={data?.total || 0}
          onChange={setPage}
          pageSizeOptions={[10, 20, 50, 100]}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
        />
      </div>

      {/* ── 新建/编辑 Modal ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? t("editUser") : t("addUser")}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-text-secondary">{tc("username")}</label>
            <input value={form.username} onChange={(e) => updateField("username", e.target.value)} className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-secondary">{tc("password")}</label>
            <input type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} placeholder={editingUser ? t("passwordPlaceholder") : ""} className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs text-text-secondary">{t("common:email")}</label>
              <input value={form.email} onChange={(e) => updateField("email", e.target.value)} className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-secondary">{t("contact")}</label>
              <input value={form.contact} onChange={(e) => updateField("contact", e.target.value)} className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs text-text-secondary">{t("common:role")}</label>
              <select value={form.role} onChange={(e) => updateField("role", e.target.value)} className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500">
                <option value="buyer">{t("common:buyer")}</option>
                <option value="promoter">{t("promotionManagement")}</option>
                <option value="admin">{t("normalAdmin")}</option>
                <option value="super_admin">{t("superAdmin")}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-secondary">{t("remark")}</label>
              <input value={form.remark} onChange={(e) => updateField("remark", e.target.value)} className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500" />
            </div>
          </div>

          {/* 推广专用字段 */}
          {form.role === "promoter" && (
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-blue-50 p-3">
              <div>
                <label className="mb-1 block text-xs text-text-secondary">{t("promotionCode")}</label>
                <input value={form.referralCode} onChange={(e) => updateField("referralCode", e.target.value)} placeholder={t("codeAutoGenerateHint")} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-secondary">{t("commissionRate")}</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={form.commissionRate} onChange={(e) => updateField("commissionRate", e.target.value)} min="0" max="100" step="0.1" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500" />
                  <span className="text-xs text-text-secondary">%</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="rounded border border-border px-4 py-2 text-sm text-text-primary hover:bg-surface-hover">{tc("cancel")}</button>
            <button onClick={handleSave} disabled={saving} className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 transition-colors disabled:opacity-50">
              {saving ? tc("saving") : tc("save")}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── 删除确认 ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={t("deleteUser")}
        message={t("deleteUserConfirm")}
        confirmText={tc("delete")}
        cancelText={tc("cancel")}
        danger
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
