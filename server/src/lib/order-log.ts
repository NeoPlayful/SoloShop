import { prisma } from "./db.js";

export type OrderLogEventType =
  | "order.created"
  | "payment.initiated"
  | "payment.success"
  | "payment.failed"
  | "payment.marked_paid"
  | "card.delivered"
  | "card.delivery_failed"
  | "delivery.manual"
  | "delivery.retried"
  | "order.completed"
  | "order.closed"
  | "order.expired"
  | "commission.pending"
  | "commission.settled"
  | "note.updated"
  | "email.sent"
  | "email.failed";

/**
 * 记录订单日志
 */
export async function createOrderLog(params: {
  orderId: number;
  eventType: OrderLogEventType;
  message?: string;
  metadata?: Record<string, unknown>;
  operator?: string | null;
}) {
  return prisma.orderLog.create({ data: params as any });
}
