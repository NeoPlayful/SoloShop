import { useTranslation } from "react-i18next";

interface TrendItem {
  date: string;
  orderCount: number;
  sales: number;
}

interface SalesTrendChartProps {
  data: TrendItem[];
  loading?: boolean;
}

function formatDate(dateStr: string) {
  // "2026-07-03" → "7/3"
  const [, m, d] = dateStr.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}

function formatLabel(dateStr: string, sales: number, t: (key: string) => string) {
  const d = new Date(dateStr + "T00:00:00");
  const dayNames = [t("sunday"), t("monday"), t("tuesday"), t("wednesday"), t("thursday"), t("friday"), t("saturday")];
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}月${day}日 ${dayNames[d.getDay()]} · ¥${sales.toFixed(2)}`;
}

export function SalesTrendChart({ data, loading }: SalesTrendChartProps) {
  const { t } = useTranslation("admin");
  const maxSales = Math.max(...data.map((d) => d.sales), 1);

  if (loading) {
    return (
      <div className="rounded-xl bg-surface p-5 shadow-card">
        <div className="mb-4 h-5 w-24 animate-pulse rounded bg-gray-200" />
        <div className="flex h-40 items-end gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 animate-pulse rounded-t bg-gray-200" style={{ height: `${30 + Math.random() * 60}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl bg-surface p-5 shadow-card">
        <h3 className="mb-4 text-sm font-semibold text-text-primary">{t("salesTrend")}</h3>
        <div className="flex h-40 items-center justify-center text-sm text-text-tertiary">{t("noData")}</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface p-5 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">{t("salesTrend")}</h3>
        <span className="text-xs text-text-tertiary">{t("last7Days")}</span>
      </div>
      <div className="relative" style={{ height: 176 }}>
        {/* Y-axis labels */}
        <div className="absolute -left-1 right-0 top-0 flex h-full flex-col justify-between text-[10px] text-text-tertiary">
          <span>¥{maxSales.toFixed(0)}</span>
          <span>¥{(maxSales / 2).toFixed(0)}</span>
          <span>¥0</span>
        </div>
        {/* Bars */}
        <div className="ml-12 flex h-full items-end gap-1.5">
          {data.map((item) => {
            const pct = maxSales > 0 ? (item.sales / maxSales) * 100 : 0;
            return (
              <div key={item.date} className="group relative flex flex-1 flex-col items-center justify-end h-full">
                {/* Bar */}
                <div
                  className="w-full max-w-10 rounded-t transition-all duration-300"
                  style={{
                    height: `${Math.max(pct, 2)}%`,
                    background: "linear-gradient(to top, var(--tw-blue-500), var(--tw-blue-200))",
                  }}
                />
                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  {formatLabel(item.date, item.sales, t)}
                </div>
                {/* Date label */}
                <span className="mt-1 text-[10px] text-text-tertiary">{formatDate(item.date)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
