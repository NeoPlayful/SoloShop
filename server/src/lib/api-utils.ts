// ─── 统一响应格式 ───
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

function success<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

function error(code: string, message: string): ApiResponse {
  return { success: false, error: { code, message } };
}

// ─── 错误码 ───
const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
  PRODUCT_OFFLINE: "PRODUCT_OFFLINE",
  PRODUCT_SOLD_OUT: "PRODUCT_SOLD_OUT",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  ORDER_EXPIRED: "ORDER_EXPIRED",
  ORDER_ALREADY_PAID: "ORDER_ALREADY_PAID",
  RATE_LIMITED: "RATE_LIMITED",
  SYSTEM_ERROR: "SYSTEM_ERROR",
} as const;

// ─── 业务错误类 ───
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

// ─── 分页参数 ───
interface PaginationParams {
  page: number;
  pageSize: number;
}

function parsePagination(query: { page?: string; pageSize?: string }): PaginationParams {
  const page = Math.max(1, parseInt(query.page || "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize || "20")));
  return { page, pageSize };
}

export { success, error, ErrorCodes, AppError, parsePagination };
export type { ApiResponse, PaginationParams };
