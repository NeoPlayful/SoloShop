import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiClient } from "../lib/client.js";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const { t } = useTranslation("store");
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 验证码
  const [code, setCode] = useState("");
  const [smtpEnabled, setSmtpEnabled] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // 检查 SMTP 状态
  useEffect(() => {
    apiClient.get("/auth/smtp-status").then((r) => {
      setSmtpEnabled(r.data.data?.enabled === true);
    }).catch(() => {});
  }, []);

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(countdownRef.current);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!email) {
      toast.error(t("email") + t("common:requiredField", { field: "" }));
      return;
    }
    setSendingCode(true);
    try {
      const res = await apiClient.post("/auth/send-register-code", { email });
      if (res.data.success) {
        toast.success(t("codeSent"));
        setCountdown(60);
      } else {
        toast.error(res.data.error?.message || t("common:operationFailed"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || t("common:operationFailed"));
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password || !confirmPassword) {
      toast.error(t("common:requiredField", { field: "" }));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t("common:passwordMismatch") || "Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error(t("common:passwordTooShort") || "Password must be at least 6 characters");
      return;
    }
    if (smtpEnabled && !code) {
      toast.error(t("codeRequired"));
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/register", { username, email, password, code: smtpEnabled ? code : undefined });
      if (res.data.success) {
        toast.success(t("registerSuccess"));
        navigate("/promotion/apply");
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
    <div className="mx-auto w-full max-w-sm py-12">
      <form onSubmit={handleSubmit} className="rounded-lg bg-surface p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-text-primary">{t("register")}</h1>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-text-primary">{t("username")}</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t("usernamePlaceholder")}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-text-primary">{t("email")}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500"
          />
        </div>

        {smtpEnabled && (
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-text-primary">{t("verificationCode")}</label>
            <div className="relative">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t("enterVerificationCode")}
                maxLength={6}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 pr-28 text-sm text-text-primary outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode || countdown > 0}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-blue-500 px-2.5 py-1 text-xs text-white hover:bg-blue-600 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {countdown > 0
                  ? t("resendIn", { s: countdown })
                  : sendingCode
                    ? t("sending")
                    : t("sendVerificationCode")}
              </button>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-text-primary">{t("password")}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("passwordPlaceholder")}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-text-primary">{t("confirmPassword")}</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("confirmPassword")}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-500 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {loading ? t("common:loading") : t("register")}
        </button>

        <p className="mt-4 text-center text-sm text-text-secondary">
          {t("hasAccount")}{" "}
          <Link to="/login" className="text-blue-500 hover:underline">{t("login")}</Link>
        </p>
      </form>
    </div>
  );
}
