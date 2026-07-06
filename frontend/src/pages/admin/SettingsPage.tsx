import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../api/client.js";
import { LoadingState } from "../../components/LoadingStates.js";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => apiClient.get("/admin/settings").then((r) => r.data.data),
  });

  if (isLoading) return <LoadingState />;

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(data?.[key] || "");
    toast.success("已复制");
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">系统设置</h1>
      <div className="space-y-3 rounded-lg bg-white p-6 shadow">
        {data && Object.entries(data).map(([key, value]: any) => (
          <div key={key} className="flex items-center justify-between border-b pb-2">
            <div>
              <p className="text-sm font-medium">{key}</p>
              <p className="text-sm text-gray-500">{String(value)}</p>
            </div>
            <button onClick={() => handleCopy(key)} className="rounded border px-3 py-1 text-xs hover:bg-gray-50">复制</button>
          </div>
        ))}
      </div>
    </div>
  );
}
