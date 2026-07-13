import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { authMiddleware } from "../../lib/auth.js";
import { success, error } from "../../lib/api-utils.js";
import { testMailConnection, resetTransporter, sendMail, renderTemplate } from "../../lib/mailer.js";

export async function adminSettingsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  app.get("/", async () => {
    const settings = await prisma.systemSetting.findMany();
    const map: Record<string, any> = {};
    for (const s of settings) map[s.key] = s.value;
    return success(map);
  });

  async function updateSettings(keyPrefix: string, body: Record<string, any>) {
    for (const [key, value] of Object.entries(body)) {
      await prisma.systemSetting.upsert({ where: { key: keyPrefix + "_" + key }, update: { value }, create: { key: keyPrefix + "_" + key, value } });
    }
    return success(null);
  }

  app.patch("/site", async (request) => updateSettings("site", request.body as any));
  app.patch("/order", async (request) => updateSettings("order", request.body as any));
  app.patch("/security", async (request) => updateSettings("security", request.body as any));
  app.patch("/promotion", async (request) => updateSettings("promotion", request.body as any));

  // ─── 邮件设置 ───
  app.patch("/email", async (request) => {
    const result = await updateSettings("email", request.body as any);
    resetTransporter();
    return result;
  });

  // ─── 测试邮件 ───
  app.post("/email/test", async (request, reply) => {
    const { to } = request.body as { to?: string };
    if (!to) return reply.code(400).send(error("VALIDATION_ERROR", "收件人地址不能为空"));
    try {
      await testMailConnection(to);
      return success({ message: "测试邮件已发送" });
    } catch (err: any) {
      return reply.code(500).send(error("EMAIL_ERROR", err.message || "发送失败"));
    }
  });

  // ─── 测试邮件模板 ───
  app.post("/email/test-template", async (request, reply) => {
    const { to, templateKey } = request.body as { to?: string; templateKey?: string };
    if (!to) return reply.code(400).send(error("VALIDATION_ERROR", "收件人地址不能为空"));
    if (!templateKey) return reply.code(400).send(error("VALIDATION_ERROR", "模板 Key 不能为空"));
    try {
      const result = await renderTemplate(templateKey, { siteName: "SoloShop", code: "123456", orderNo: "TEST", productName: "测试商品", quantity: "1", cardKeys: "TEST-KEY-001" });
      if (!result) return reply.code(404).send(error("TEMPLATE_NOT_FOUND", "模板不存在"));
      await sendMail({ to, subject: result.subject, html: result.html });
      return success({ message: "测试模板邮件已发送" });
    } catch (err: any) {
      return reply.code(500).send(error("EMAIL_ERROR", err.message || "发送失败"));
    }
  });
}
