import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client.js";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { toast.error("请输入用户名和密码"); return; }
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/login", { username, password });
      if (res.data.success) {
        toast.success("登录成功");
        navigate("/admin");
      } else {
        toast.error(res.data.error?.message || "登录失败");
      }
    } catch {
      toast.error("登录失败，请检查用户名和密码");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold">后台管理登录</h1>
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">用户名</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded border px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="请输入用户名" />
        </div>
        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-gray-700">密码</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded border px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="请输入密码" />
        </div>
        <button type="submit" disabled={loading} className="w-full rounded bg-blue-500 py-2 text-white hover:bg-blue-600 disabled:opacity-50">
          {loading ? "登录中..." : "登录"}
        </button>
      </form>
    </div>
  );
}
