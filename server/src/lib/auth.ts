import { SignJWT, jwtVerify } from "jose";
import type { FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "./api-utils.js";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret",
);

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

interface JwtPayload {
  adminId: number;
  username: string;
  isSuperAdmin: boolean;
}

// ─── 生成 JWT ───
async function signToken(payload: JwtPayload): Promise<string> {
  const jwt = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(JWT_EXPIRES_IN)
    .setIssuedAt()
    .sign(JWT_SECRET);
  return jwt;
}

// ─── 验证 JWT ───
async function verifyToken(token: string): Promise<JwtPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JwtPayload;
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "登录已过期，请重新登录");
  }
}

// ─── 认证中间件（从 Cookie 读取 JWT） ───
async function authMiddleware(request: FastifyRequest, _reply: FastifyReply) {
  const token = request.cookies?.token;

  if (!token) {
    throw new AppError(401, "UNAUTHORIZED", "请先登录");
  }

  const payload = await verifyToken(token);
  (request as any).admin = payload;
}

// ─── 超级管理员中间件 ───
async function superAdminMiddleware(request: FastifyRequest, _reply: FastifyReply) {
  const admin = (request as any).admin;
  if (!admin?.isSuperAdmin) {
    throw new AppError(403, "FORBIDDEN", "无权限执行此操作");
  }
}

export { signToken, verifyToken, authMiddleware, superAdminMiddleware };
export type { JwtPayload };
