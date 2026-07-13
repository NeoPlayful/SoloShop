import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../lib/client.js";
import { Input } from "../theme/components/form/Input.js";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function OrderQueryPage() {
  const { t } = useTranslation("store");
  const [orderNo, setOrderNo] = useState("");
  const [email, setEmail] = useState("");
  const [requireEmail, setRequireEmail] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get("/public/settings").then((r) => {
      const val = r.data.data?.order_order_query_require_email;
      setRequireEmail(val !== false);
    }).catch(() => {});
  }, []);

  const handleQuery = async () => {
    if (!orderNo) { toast.error(t("orderQueryError")); return; }
    if (requireEmail && !email) { toast.error(t("orderQueryError")); return; }
    try {
      const res = await apiClient.post("/public/orders/query", { orderNo, email: requireEmail ? email : undefined });
      if (res.data.success) {
        navigate(`/order/${orderNo}${email ? `?email=${encodeURIComponent(email)}` : ""}`);
      } else {
        toast.error(res.data.error?.message || t("orderQueryFail"));
      }
    } catch {
      toast.error(t("orderQueryFail"));
    }
  };

  return (
    <div className="mx-auto w-full max-w-md py-16">
      <h1 className="mb-8 text-center text-2xl font-bold">{t("orderQueryTitle")}</h1>
      <div className="space-y-4 rounded-lg border-border bg-surface p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">{t("orderNo", { ns: "common" })}</label>
          <Input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} placeholder={t("orderNoPlaceholder")} />
        </div>
        {requireEmail && (
          <div>
            <label className="mb-1 block text-sm font-medium">{t("email")}</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("orderEmailPlaceholder")} />
          </div>
        )}
        <button onClick={handleQuery} className="w-full rounded bg-blue-500 py-2 text-white hover:bg-blue-600">{t("orderQueryBtn")}</button>
      </div>
    </div>
  );
}
