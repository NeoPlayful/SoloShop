import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/client.js";
import toast from "react-hot-toast";

export default function OrderQueryPage() {
  const [orderNo, setOrderNo] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleQuery = async () => {
    if (!orderNo || !email) { toast.error("请输入订单号和邮箱"); return; }
    try {
      const res = await apiClient.post("/public/orders/query", { orderNo, email });
      if (res.data.success) {
        navigate(`/order/${orderNo}`);
      } else {
        toast.error(res.data.error?.message || "查询失败");
      }
    } catch {
      toast.error("订单不存在或邮箱不匹配");
    }
  };

  return (
    <div className="mx-auto max-w-md py-16">
      <h1 className="mb-8 text-center text-2xl font-bold">订单查询</h1>
      <div className="space-y-4 rounded-lg border bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">订单号</label>
          <input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} className="w-full rounded border px-3 py-2" placeholder="请输入订单号" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">邮箱</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded border px-3 py-2" placeholder="下单时填写的邮箱" />
        </div>
        <button onClick={handleQuery} className="w-full rounded bg-blue-500 py-2 text-white hover:bg-blue-600">查询</button>
      </div>
    </div>
  );
}
