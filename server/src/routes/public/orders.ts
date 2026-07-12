import type { FastifyInstance } from "fastify";
import dayjs from "dayjs";
import { prisma } from "../../lib/db.js";
import { success, error } from "../../lib/api-utils.js";
import { getAvailableStock, lockCards, releaseCards } from "../../lib/card-pool.js";

export async function publicOrderRoutes(app: FastifyInstance) {
  // 创建订单
  app.post("/", async (request, reply) => {
    const body = request.body as { productId: number; quantity: number; buyerEmail?: string; buyerContact?: string; referralCode?: string };
    if (!body.productId || !body.quantity) return reply.code(400).send(error("VALIDATION_ERROR", "参数错误"));

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

      // 通过 buyerEmail 关联用户
      if (body.buyerEmail) {
        const user = await prisma.user.upsert({
          where: { email: body.buyerEmail },
          update: { lastLoginAt: new Date() },
          create: { email: body.buyerEmail, role: "buyer" },
        });
        await prisma.order.update({ where: { id: order.id }, data: { userId: user.id } });
      }

      return success({ orderNo: order.orderNo, totalAmount });
    } catch (err) {
      await releaseCards(lockedIds, product.id);
      throw err;
    }
  });

  // 查询订单状态
  app.get("/:orderNo/status", async (request, reply) => {
    const { orderNo } = request.params as { orderNo: string };
    const order = await prisma.order.findUnique({ where: { orderNo } });
    if (!order) return reply.code(404).send(error("ORDER_NOT_FOUND", "订单不存在"));
    return success({ orderNo: order.orderNo, orderStatus: order.orderStatus, paymentStatus: order.paymentStatus, deliveryStatus: order.deliveryStatus });
  });

  // 订单查询（订单号+邮箱）
  app.post("/query", async (request, reply) => {
    const { orderNo, email } = request.body as { orderNo: string; email: string };
    if (!orderNo || !email) return reply.code(400).send(error("VALIDATION_ERROR", "订单号和邮箱不能为空"));
    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: { deliveries: { orderBy: { createdAt: "desc" }, take: 1 }, product: { select: { name: true } } },
    });
    if (!order || order.buyerEmail !== email) return reply.code(404).send(error("ORDER_NOT_FOUND", "订单不存在或邮箱不匹配"));
    return success(order);
  });
}
