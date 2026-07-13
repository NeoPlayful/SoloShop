import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { prisma } from "./db.js";

let transporter: Transporter | null = null;

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromAddress: string;
}

async function loadSmtpConfig(): Promise<SmtpConfig | null> {
  const rows = await prisma.systemSetting.findMany({
    where: { key: { startsWith: "email_" } },
  });
  if (rows.length === 0) return null;

  const map: Record<string, any> = {};
  for (const row of rows) map[row.key] = row.value;

  if (!map.email_smtp_host || !map.email_smtp_user || !map.email_smtp_pass) {
    return null;
  }

  return {
    host: String(map.email_smtp_host),
    port: map.email_smtp_port != null ? Number(map.email_smtp_port) : 465,
    secure: map.email_smtp_secure !== false,
    user: String(map.email_smtp_user),
    pass: String(map.email_smtp_pass),
    fromName: String(map.email_from_name || ""),
    fromAddress: String(map.email_from_address || map.email_smtp_user),
  };
}

async function getTransporter(): Promise<Transporter | null> {
  if (transporter) return transporter;

  const config = await loadSmtpConfig();
  if (!config) return null;

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return transporter;
}

/**
 * 发送邮件
 */
export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const tr = await getTransporter();
  if (!tr) {
    throw new Error("SMTP 未配置");
  }

  const config = await loadSmtpConfig();
  const from = config?.fromName
    ? `"${config.fromName}" <${config.fromAddress}>`
    : config?.fromAddress || "";

  await tr.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

/**
 * 测试 SMTP 连接 — 发送一封测试邮件
 */
export async function testMailConnection(to: string): Promise<void> {
  const tr = await getTransporter();
  if (!tr) {
    throw new Error("SMTP 未配置");
  }

  // 先验证连接
  try {
    await tr.verify();
  } catch {
    // verify 失败仍尝试发送，有些 SMTP 服务不支持 verify
  }

  await sendMail({
    to,
    subject: "SoloShop 邮件服务测试",
    html: "<h1>邮件服务测试</h1><p>如果您收到此邮件，说明 SMTP 配置正确。</p>",
  });
}

/**
 * 清除缓存的 transporter（配置更新后调用）
 */
export function resetTransporter(): void {
  transporter = null;
}
