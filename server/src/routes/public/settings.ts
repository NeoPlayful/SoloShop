import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/db.js";

export async function publicSettingsRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    const settings = await prisma.systemSetting.findMany();
    const map: Record<string, any> = {};
    for (const s of settings) map[s.key] = s.value;
    return { success: true, data: map };
  });
}
