import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../lib/client.js";
import { Input } from "../theme/components/form/Input.js";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function OrderQueryPage() {
  const { t } = useTranslation("store");
  const [orderNo, setOrderNo] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleQuery = async () => {
    if (!orderNo || !email) { toast.error("Please enter order number and email"); return; }
    try {
      const res = await apiClient.post("/public/orders/query", { orderNo, email });
      if (res.data.success) {
        navigate(`/order/${orderNo}`);
      } else {
        toast.error(res.data.error?.message || "Query failed");
      }
    } catch {
      toast.error("Order not found or email does not match");
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
        <div>
          <label className="mb-1 block text-sm font-medium">{t("email")}</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("orderEmailPlaceholder")} />
        </div>
        <button onClick={handleQuery} className="w-full rounded bg-blue-500 py-2 text-white hover:bg-blue-600">{t("orderQueryBtn")}</button>
      </div>
    </div>
  );
}
