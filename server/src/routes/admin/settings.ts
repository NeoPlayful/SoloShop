import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";
import { authMiddleware } from "../../lib/auth.js";
import { success } from "../../lib/api-utils.js";

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
}
