import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../lib/client.js";
import { Input } from "../../theme/components/form/Input.js";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { t } = useTranslation("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { toast.error(t("requiredField", { ns: "common", field: t("username", { ns: "common" }) })); return; }
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/login", { username, password });
      if (res.data.success) {
        toast.success(t("loginSuccess", { ns: "common" }));
        navigate("/admin");
      } else {
        toast.error(res.data.error?.message || t("loginFailed", { ns: "common" }));
      }
    } catch {
      toast.error(t("loginFailed", { ns: "common" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-page">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-surface p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-text-primary">{t("loginTitle")}</h1>
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-text-primary">{t("username", { ns: "common" })}</label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t("usernamePlaceholder", { ns: "common" })} />
        </div>
        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-text-primary">{t("password", { ns: "common" })}</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("passwordPlaceholder", { ns: "common" })} />
        </div>
        <button type="submit" disabled={loading} className="w-full rounded bg-blue-500 py-2 text-white hover:bg-blue-600 disabled:opacity-50">
          {loading ? t("loggingIn", { ns: "common" }) : t("login", { ns: "common" })}
        </button>
      </form>
    </div>
  );
}
