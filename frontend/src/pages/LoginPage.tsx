import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiClient } from "../lib/client.js";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { t } = useTranslation("store");
  const navigate = useNavigate();

  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credential || !password) {
      toast.error(t("common:requiredField", { field: "" }));
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/login", { username: credential, password });
      if (res.data.success) {
        toast.success(t("loginSuccess"));
        const role = res.data.data?.user?.role;
        if (role === "admin" || role === "super_admin") {
          navigate("/admin");
        } else {
          navigate("/promotion/apply");
        }
      } else {
        toast.error(res.data.error?.message || t("common:operationFailed"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || t("common:operationFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm py-12">
      <form onSubmit={handleSubmit} className="rounded-lg bg-surface p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-text-primary">{t("login")}</h1>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-text-primary">{t("common:username")} / {t("common:email")}</label>
          <input
            value={credential}
            onChange={(e) => setCredential(e.target.value)}
            placeholder={t("usernamePlaceholder")}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-text-primary">{t("common:password")}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("passwordPlaceholder")}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-500 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {loading ? t("common:loading") : t("login")}
        </button>

        <p className="mt-4 text-center text-sm text-text-secondary">
          {t("noAccount")}{" "}
          <Link to="/register" className="text-blue-500 hover:underline">{t("registerNow")}</Link>
        </p>
      </form>
    </div>
  );
}
