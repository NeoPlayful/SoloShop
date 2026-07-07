import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../../lib/auth.js";
import { success, error } from "../../lib/api-utils.js";
import { fileURLToPath } from "node:url";
import { join, extname, dirname } from "node:path";
import { writeFile, mkdir } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const UPLOAD_DIR = join(__dirname, "../../../uploads/products");

export async function adminUploadRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // 上传图片
  app.post("/", async (request, reply) => {
    try {
      const file = await request.file();
      if (!file) {
        return reply.code(400).send(error("NO_FILE", "请选择要上传的文件"));
      }

      if (!ALLOWED_TYPES.includes(file.mimetype)) {
        return reply.code(400).send(error("INVALID_FILE_TYPE", "仅支持 PNG、JPG、WebP、SVG 格式"));
      }

      // 确保目录存在
      await mkdir(UPLOAD_DIR, { recursive: true });

      // 生成唯一文件名
      const ext = extname(file.filename) || ".png";
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      const filePath = join(UPLOAD_DIR, filename);

      // 写入文件
      const buffer = await file.toBuffer();
      await writeFile(filePath, buffer);

      // 返回可访问的 URL
      const url = `/uploads/products/${filename}`;
      return success({ url, filename });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send(error("UPLOAD_FAILED", "上传失败"));
    }
  });
}
