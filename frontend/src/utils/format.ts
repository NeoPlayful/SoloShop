import dayjs from "dayjs";

// ─── 金额格式化 ───
export function formatAmount(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toFixed(2);
}

// ─── 日期格式化 ───
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return dayjs(date).format("YYYY-MM-DD HH:mm:ss");
}

// ─── 简短日期 ───
export function formatShortDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return dayjs(date).format("MM-DD HH:mm");
}

// ─── 状态标签颜色 ───
export const statusColors: Record<string, string> = {
  // 订单状态
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
  closed: "bg-red-100 text-red-800",

  // 支付状态
  unpaid: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-purple-100 text-purple-800",

  // 发货状态
  delivering: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",

  // 商品状态
  active: "bg-green-100 text-green-800",
  draft: "bg-gray-100 text-gray-800",
  inactive: "bg-yellow-100 text-yellow-800",
  sold_out: "bg-red-100 text-red-800",

  // 卡密状态
  available: "bg-green-100 text-green-800",
  locked: "bg-yellow-100 text-yellow-800",
  sold: "bg-gray-100 text-gray-800",
  disabled: "bg-red-100 text-red-800",
  expired: "bg-red-100 text-red-800",
};

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "待处理",
    completed: "已完成",
    cancelled: "已取消",
    closed: "已关闭",
    unpaid: "未支付",
    paid: "已支付",
    failed: "失败",
    refunded: "已退款",
    delivering: "发货中",
    delivered: "已发货",
    active: "已上架",
    draft: "草稿",
    inactive: "已下架",
    sold_out: "已售罄",
    available: "可售",
    locked: "已锁定",
    sold: "已售出",
    disabled: "已禁用",
    expired: "已过期",
  };
  return labels[status] || status;
}
