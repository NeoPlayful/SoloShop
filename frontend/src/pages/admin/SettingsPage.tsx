import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { LoadingState } from "../../components/LoadingStates.js";
import { Input } from "../../theme/components/form/Input.js";
import { Textarea } from "../../theme/components/form/Textarea.js";
import { Select } from "../../theme/components/form/Select.js";
import { useTheme, themeRegistry } from "../../theme/index.js";
import toast from "react-hot-toast";

type ThemeMode = "light" | "dark" | "system";

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between">
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

export default function SettingsPage() {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("common");
  const { themeId: currentThemeId, mode: currentMode } = useTheme();
  const qc = useQueryClient();

  const [selectedTheme, setSelectedTheme] = useState(currentThemeId);
  const [selectedMode, setSelectedMode] = useState<ThemeMode>(currentMode);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => apiClient.get("/admin/settings").then((r) => r.data.data),
  });

  // ─── 站点设置 - 品牌信息 ───
  const [brandForm, setBrandForm] = useState<Record<string, string>>({});
  const brandMutation = useMutation({
    mutationFn: (body: Record<string, any>) => apiClient.patch("/admin/settings/site", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success(t("operationSuccess"));
    },
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiClient.post("/admin/upload?type=logo", fd);
      if (res.data.success) {
        setBrandForm({ ...brandForm, logo: res.data.data.url });
        toast.success(tc("saveSuccess"));
      }
    } catch {
      toast.error(tc("operationFailed"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ─── 站点设置 - 联系信息 ───
  const [contactForm, setContactForm] = useState<Record<string, string>>({});
  const contactMutation = useMutation({
    mutationFn: (body: Record<string, any>) => apiClient.patch("/admin/settings/site", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success(t("operationSuccess"));
    },
  });

  // ─── 订单设置 ───
  const [orderForm, setOrderForm] = useState<Record<string, any>>({});
  const orderMutation = useMutation({
    mutationFn: (body: Record<string, any>) => apiClient.patch("/admin/settings/order", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success(t("operationSuccess"));
    },
  });

  // ─── 推广设置 ───
  const [promotionForm, setPromotionForm] = useState<Record<string, any>>({});
  const promotionMutation = useMutation({
    mutationFn: (body: Record<string, any>) => apiClient.patch("/admin/settings/promotion", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success(t("operationSuccess"));
    },
  });

  // ─── 主题设置 ───
  const themeMutation = useMutation({
    mutationFn: (body: Record<string, any>) => apiClient.patch("/admin/settings/site", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success(t("operationSuccess"));
    },
  });

  // ─── 币种设置 ───
  const [currency, setCurrency] = useState("CNY");
  const currencyMutation = useMutation({
    mutationFn: (v: string) => apiClient.patch("/admin/settings/site", { currency: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success(t("operationSuccess"));
    },
  });

  // 数据加载后初始化表单
  if (data && Object.keys(brandForm).length === 0) {
    setBrandForm({
      name: data.site_name ?? "",
      logo: data.site_logo ?? "",
      announcement: data.site_announcement ?? "",
    });
    setContactForm({
      contact_email: data.contact_email ?? "",
      contact_info: data.contact_info ?? "",
    });
    setCurrency(data.currency ?? "CNY");
    setOrderForm({
      order_timeout_minutes: data.order_timeout_minutes ?? 30,
      guest_checkout: data.guest_checkout ?? true,
      order_query_require_email: data.order_query_require_email ?? true,
      order_show_stock: data.order_show_stock ?? true,
    });
    setPromotionForm({
      default_commission_rate: data.promotion_default_commission_rate != null ? Number(data.promotion_default_commission_rate) * 100 : 10,
      max_commission_per_order: data.promotion_max_commission_per_order != null ? String(Number(data.promotion_max_commission_per_order)) : "",
    });
  }

  const handleSaveBrand = () => {
    brandMutation.mutate(brandForm);
  };

  const handleSaveContact = () => {
    contactMutation.mutate(contactForm);
  };

  const handleSaveOrder = () => {
    orderMutation.mutate(orderForm);
  };

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-text-primary">{t("systemSettings")}</h1>

      {/* ─── 站点设置 ─── */}
      <div className="mb-6 rounded-lg bg-surface p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">{t("siteSettings")}</h2>

        {/* ── 品牌信息 ── */}
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">{t("brandInfo")}</span>
          <div className="flex-1 border-t border-border" />
        </div>
        <div className="space-y-4">
          <Input label={t("siteName")} value={brandForm.name ?? ""} onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })} />
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">{t("siteLogo")}</label>
            <div className="flex items-start gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-alt flex items-center justify-center">
                {brandForm.logo ? (
                  <img src={brandForm.logo} alt="" className="h-full w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }} />
                ) : null}
                <span className={`text-xs text-text-tertiary ${brandForm.logo ? "hidden" : ""}`}>Logo</span>
              </div>
              <div className="flex-1 space-y-2">
                <input
                  value={brandForm.logo ?? ""}
                  onChange={(e) => setBrandForm({ ...brandForm, logo: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-ring-focus focus:border-transparent"
                />
                <div className="flex gap-2">
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleUploadLogo} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="rounded border border-border px-3 py-1.5 text-xs text-text-primary hover:bg-surface-hover disabled:opacity-50">
                    {uploading ? `${tc("loading")}...` : t("uploadImage", { ns: "common" })}
                  </button>
                  {brandForm.logo && (
                    <button type="button" onClick={() => setBrandForm({ ...brandForm, logo: "" })} className="text-xs text-red-500 hover:text-red-700">{t("removeImage", { ns: "common" }) || "移除图片"}</button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Textarea label={t("siteAnnouncement")} rows={4} value={brandForm.announcement ?? ""} onChange={(e) => setBrandForm({ ...brandForm, announcement: e.target.value })} />
          <div className="pt-2">
            <button
              onClick={handleSaveBrand}
              disabled={brandMutation.isPending}
              className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {brandMutation.isPending ? tc("saving") : tc("save")}
            </button>
          </div>
        </div>

        {/* ── 联系信息 ── */}
        <div className="mb-2 mt-6 flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">{t("contactInfo2")}</span>
          <div className="flex-1 border-t border-border" />
        </div>
        <div className="space-y-4">
          <Input label={t("contactEmail")} value={contactForm.contact_email ?? ""} onChange={(e) => setContactForm({ ...contactForm, contact_email: e.target.value })} />
          <Textarea label={t("contactInfo")} rows={2} value={contactForm.contact_info ?? ""} onChange={(e) => setContactForm({ ...contactForm, contact_info: e.target.value })} />
          <div className="pt-2">
            <button
              onClick={handleSaveContact}
              disabled={contactMutation.isPending}
              className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {contactMutation.isPending ? tc("saving") : tc("save")}
            </button>
          </div>
        </div>
      </div>

      {/* ─── 商务设置 ─── */}
      <div className="mb-6 rounded-lg bg-surface p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">{t("businessSettings")}</h2>
        <div className="space-y-4">
          <Select
            label={t("currency")}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            options={[
              { value: "CNY", label: "CNY (¥)" },
              { value: "USD", label: "USD ($)" },
              { value: "EUR", label: "EUR (€)" },
              { value: "JPY", label: "JPY (¥)" },
            ]}
          />
          <div className="pt-2">
            <button
              onClick={() => currencyMutation.mutate(currency)}
              disabled={currencyMutation.isPending}
              className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {currencyMutation.isPending ? tc("saving") : tc("save")}
            </button>
          </div>
        </div>
      </div>

      {/* ─── 站点主题设置 ─── */}
      <div className="mb-6 rounded-lg bg-surface p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">{t("themeSettings")}</h2>
        <label className="mb-2 block text-sm font-medium text-text-primary">{t("siteDefaultTheme")}</label>
        <div className="mb-4 flex flex-wrap gap-3">
          {themeRegistry.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setSelectedTheme(theme.id)}
              className={`w-36 rounded-lg border-2 p-3 text-left transition-colors ${
                selectedTheme === theme.id
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-border hover:border-blue-300"
              }`}
            >
              <div className="mb-2 flex h-12 overflow-hidden rounded-md">
                <div className="flex-1" style={{ backgroundColor: theme.previewColors.light }} />
                <div className="flex-1" style={{ backgroundColor: theme.previewColors.dark }} />
              </div>
              <span className="text-sm font-medium text-text-primary">{tc(theme.labelKey as any)}</span>
            </button>
          ))}
        </div>
        <label className="mb-2 block text-sm font-medium text-text-primary">{t("themeModeLabel")}</label>
        <div className="mb-4 flex gap-2">
          {(["light", "dark", "system"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setSelectedMode(mode)}
              className={`rounded border px-4 py-2 text-sm transition-colors ${
                selectedMode === mode
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-border text-text-primary hover:bg-surface-hover"
              }`}
            >
              {t(mode === "light" ? "themeLight" : mode === "dark" ? "themeDark" : "themeSystem")}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            themeMutation.mutate({ theme_id: selectedTheme, theme_mode: selectedMode });
          }}
          disabled={themeMutation.isPending}
          className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {themeMutation.isPending ? tc("saving") : t("saveThemeSettings")}
        </button>
      </div>

      {/* ─── 订单设置 ─── */}
      <div className="mb-6 rounded-lg bg-surface p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">{t("orderSettings")}</h2>
        <div className="space-y-5">
          <Input
            label={t("orderTimeoutLabel")}
            type="number"
            min={1}
            max={1440}
            value={orderForm.order_timeout_minutes ?? 30}
            onChange={(e) => setOrderForm({ ...orderForm, order_timeout_minutes: parseInt(e.target.value) || 30 })}
          />
          <Toggle
            label={t("guestCheckout")}
            value={orderForm.guest_checkout ?? true}
            onChange={(v) => setOrderForm({ ...orderForm, guest_checkout: v })}
          />
          <Toggle
            label={t("orderQueryRequireEmail")}
            value={orderForm.order_query_require_email ?? true}
            onChange={(v) => setOrderForm({ ...orderForm, order_query_require_email: v })}
          />
          <Toggle
            label={t("showStock")}
            value={orderForm.order_show_stock ?? true}
            onChange={(v) => setOrderForm({ ...orderForm, order_show_stock: v })}
          />
          <div className="pt-2">
            <button
              onClick={handleSaveOrder}
              disabled={orderMutation.isPending}
              className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {orderMutation.isPending ? tc("saving") : tc("save")}
            </button>
          </div>
        </div>
      </div>

      {/* ─── 推广设置 ─── */}
      <div className="mb-6 rounded-lg bg-surface p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">{t("promotionSettings")}</h2>
        <div className="space-y-4">
          <Input
            label={t("commissionRate")}
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={promotionForm.default_commission_rate ?? 10}
            onChange={(e) => setPromotionForm({ ...promotionForm, default_commission_rate: parseFloat(e.target.value) || 0 })}
            placeholder={t("commissionRatePlaceholder")}
          />
          <Input
            label={t("maxCommissionPerOrder")}
            type="number"
            min={0}
            step={0.01}
            value={promotionForm.max_commission_per_order ?? ""}
            onChange={(e) => setPromotionForm({ ...promotionForm, max_commission_per_order: e.target.value })}
            placeholder={t("maxCommissionHint")}
          />
          <div className="pt-2">
            <button
              onClick={() => {
                const body: Record<string, any> = {
                  default_commission_rate: Number(promotionForm.default_commission_rate) / 100,
                };
                if (promotionForm.max_commission_per_order !== "") {
                  body.max_commission_per_order = Number(promotionForm.max_commission_per_order);
                } else {
                  body.max_commission_per_order = null;
                }
                promotionMutation.mutate(body);
              }}
              disabled={promotionMutation.isPending}
              className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {promotionMutation.isPending ? tc("saving") : tc("save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
