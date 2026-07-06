import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始种子数据初始化...");

  // 创建默认管理员
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.admin.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      password: hashedPassword,
      nickname: "超级管理员",
      isSuperAdmin: true,
      isActive: true,
    },
  });
  console.log(`✅ 管理员创建成功: ${admin.username}`);

  // 创建默认系统设置
  const defaultSettings = [
    { key: "site_name", value: "SoloShop", description: "站点名称" },
    { key: "site_logo", value: "", description: "站点 Logo URL" },
    { key: "site_announcement", value: "", description: "站点公告" },
    { key: "contact_email", value: "", description: "联系邮箱" },
    { key: "contact_info", value: "", description: "联系方式" },
    { key: "currency", value: "CNY", description: "默认币种" },
    { key: "order_timeout_minutes", value: 30, description: "订单超时时间（分钟）" },
    { key: "show_stock", value: true, description: "前台是否显示库存" },
    { key: "guest_checkout", value: true, description: "是否允许游客下单" },
    { key: "order_query_require_email", value: true, description: "订单查询是否需要邮箱" },
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`✅ 系统设置初始化完成`);

  // 创建默认支付渠道（仅配置模板，需后台启用和填写密钥）
  const channels = [
    { code: "yipay", name: "易支付", config: { apiUrl: "", appId: "", appKey: "" }, isEnabled: false },
    { code: "stripe", name: "Stripe", config: { secretKey: "", webhookSecret: "" }, isEnabled: false },
    { code: "mock", name: "模拟支付（开发测试）", config: {}, isEnabled: true },
  ];

  for (const ch of channels) {
    await prisma.paymentChannel.upsert({
      where: { code: ch.code },
      update: {},
      create: ch,
    });
  }
  console.log(`✅ 支付渠道初始化完成`);

  console.log("🎉 种子数据初始化完成");
}

main()
  .catch((e) => {
    console.error("❌ 种子数据初始化失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
