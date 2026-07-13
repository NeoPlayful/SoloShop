import type { FastifyInstance } from "fastify";
import dayjs from "dayjs";
import { prisma } from "../../lib/db.js";
import { success, error } from "../../lib/api-utils.js";
import { getAvailableStock, lockCards, releaseCards } from "../../lib/card-pool.js";
import { createOrderLog } from "../../lib/order-log.js";

export async function publicOrderRoutes(app: FastifyInstance) {
  // 创建订单
  app.post("/", async (request, reply) => {
    const body = request.body as { productId: number; quantity: number; buyerEmail: string; buyerContact?: string; referralCode?: string };
    if (!body.productId || !body.quantity) return reply.code(400).send(error("VALIDATION_ERROR", "参数错误"));
    if (!body.buyerEmail) return reply.code(400).send(error("VALIDATION_ERROR", "邮箱不能为空"));

    const product = await prisma.product.findFirst({ where: { id: body.productId, status: "active", deletedAt: null } });
    if (!product) return reply.code(404).send(error("PRODUCT_NOT_FOUND", "商品不存在"));

    if (body.quantity < product.minQuantity || body.quantity > product.maxQuantity) {
      return reply.code(400).send(error("VALIDATION_ERROR", `购买数量需在 ${product.minQuantity} ~ ${product.maxQuantity} 之间`));
    }

    // Redis 锁定卡密
    const lockedIds = await lockCards(product.id, body.quantity);
    if (lockedIds.length < body.quantity) {
      if (lockedIds.length > 0) await releaseCards(lockedIds, product.id);
      return reply.code(400).send(error("INSUFFICIENT_STOCK", "库存不足"));
    }

    const totalAmount = Number(product.price) * body.quantity;
    const orderNo = `${dayjs().format("YYYYMMDDHHmmss")}${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`;
    const buyerIp = request.ip;

    try {
      const order = await prisma.order.create({
        data: {
          orderNo, productId: product.id,
          productSnapshot: { name: product.name, price: product.price, deliveryType: product.deliveryType },
          quantity: body.quantity, totalAmount, buyerEmail: body.buyerEmail, buyerContact: body.buyerContact, buyerIp,
          referralCode: body.referralCode || null,
          expiredAt: dayjs().add(30, "minute").toDate(),
        },
      });
      // 关联卡密到订单
      await prisma.card.updateMany({ where: { id: { in: lockedIds } }, data: { orderId: order.id } });

      // 记录订单日志
      await createOrderLog({
        orderId: order.id,
        eventType: "order.created",
        message: `商品「${product.name}」x${body.quantity}，金额 ¥${totalAmount.toFixed(2)}`,
        metadata: { productName: product.name, quantity: body.quantity, totalAmount, buyerIp, buyerEmail: body.buyerEmail },
      });

      return success({ orderNo: order.orderNo, totalAmount });
    } catch (err) {
      await releaseCards(lockedIds, product.id);
      throw err;
    }
  });

  // 查询订单状态（支持 email 参数以查看卡密内容）
  app.get("/:orderNo/status", async (request, reply) => {
    const { orderNo } = request.params as { orderNo: string };
    const { email } = request.query as { email?: string };
    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: {
        deliveries: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: { id: true, content: true, type: true, createdAt: true, deliveredAt: true },
        },
      },
    });
    if (!order) return reply.code(404).send(error("ORDER_NOT_FOUND", "订单不存在"));

    // 只有买家邮箱匹配才返回卡密内容
    const emailMatched = !!email && order.buyerEmail === email;

    return success({
      orderNo: order.orderNo,
      productSnapshot: order.productSnapshot,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      deliveryStatus: order.deliveryStatus,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      buyerEmail: order.buyerEmail,
      deliveries: emailMatched
        ? order.deliveries.map((d) => ({
            cardContent: d.content ?? null,
            deliveredAt: d.createdAt,
          }))
        : [],
    });
  });

  // 订单查询（订单号+邮箱）
  app.post("/query", async (request, reply) => {
    const { orderNo, email } = request.body as { orderNo: string; email?: string };
    if (!orderNo) return reply.code(400).send(error("VALIDATION_ERROR", "订单号不能为空"));

    // 读取是否需要邮箱验证的设置
    const requireEmailSetting = await prisma.systemSetting.findUnique({
      where: { key: "order_order_query_require_email" },
    });
    const requireEmail = requireEmailSetting?.value !== false; // 默认 true

    if (requireEmail && !email) {
      return reply.code(400).send(error("VALIDATION_ERROR", "订单号和邮箱不能为空"));
    }

    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: {
        deliveries: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: { id: true, content: true, type: true, createdAt: true, deliveredAt: true },
        },
      },
    });

    if (!order) return reply.code(404).send(error("ORDER_NOT_FOUND", "订单不存在"));
    if (requireEmail && order.buyerEmail !== email) {
      return reply.code(404).send(error("ORDER_NOT_FOUND", "订单不存在或邮箱不匹配"));
    }

    // 只有邮箱匹配才返回卡密内容
    const emailMatched = !!email && order.buyerEmail === email;

    return success({
      orderNo: order.orderNo,
      productSnapshot: order.productSnapshot,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      deliveryStatus: order.deliveryStatus,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      buyerEmail: order.buyerEmail,
      deliveries: emailMatched
        ? order.deliveries.map((d) => ({
            cardContent: d.content ?? null,
            deliveredAt: d.createdAt,
          }))
        : [],
    });
  });
}
