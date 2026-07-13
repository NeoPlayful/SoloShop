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
  html?: string;
  text?: string;
}): Promise<void> {
  // 检查邮件服务是否启用
  const enabledSetting = await prisma.systemSetting.findUnique({ where: { key: "email_enabled" } });
  if (enabledSetting?.value === false) {
    throw new Error("邮件服务未启用");
  }

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
    ...(options.text ? { text: options.text } : {}),
    ...(options.html ? { html: options.html } : {}),
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

  // 获取站点名称
  const siteSetting = await prisma.systemSetting.findUnique({ where: { key: "site_name" } });
  const siteName = String(siteSetting?.value || "SoloShop");

  const now = new Date().toLocaleString("zh-CN", { hour12: false });

  await sendMail({
    to,
    subject: `${siteName} - SMTP 测试邮件`,
    text: `SMTP 配置测试\n\n这是一封来自 ${siteName} 的测试邮件。\n\n如果您收到此邮件，说明 SMTP 配置正确，邮件服务正常工作。\n\n发送时间：${now}`,
    html: `<h1 style="color:#2563eb;">SMTP 配置测试</h1><p>这是一封来自 <strong>${siteName}</strong> 的测试邮件。</p><p>如果您收到此邮件，说明 SMTP 配置正确，邮件服务正常工作。</p><p style="color:#6b7280;font-size:13px;">发送时间：${now}</p>`,
  });
}

/**
 * 清除缓存的 transporter（配置更新后调用）
 */
export function resetTransporter(): void {
  transporter = null;
}

/**
 * 渲染邮件模板 — 从 SystemSetting 读取模板内容，替换变量
 * @returns { subject, html } 或 null（模板不存在时）
 */
export async function renderTemplate(
  templateKey: string,
  variables: Record<string, string>,
): Promise<{ subject: string; html: string } | null> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: templateKey },
  });
  if (!setting?.value) return null;

  const template = setting.value as { subject: string; bodyHtml: string };
  if (!template.subject || !template.bodyHtml) return null;

  let subject = template.subject;
  let html = template.bodyHtml;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    subject = subject.replace(placeholder, value);
    html = html.replace(placeholder, value);
  }

  return { subject, html };
}
