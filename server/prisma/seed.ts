import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { rebuildPool } from "../src/lib/card-pool.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始种子数据初始化...");

  // 创建默认管理员用户
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { username: adminUsername },
    update: { email: "admin@soloshop.com" },
    create: {
      username: adminUsername,
      password: hashedPassword,
      email: "admin@soloshop.com",
      role: "super_admin",
      isActive: true,
    },
  });
  console.log(`✅ 管理员用户创建成功: ${admin.username}`);

  // 创建默认系统设置
  const defaultSettings = [
    { key: "site_name", value: "SoloShop", description: "站点名称" },
    { key: "site_logo", value: "", description: "站点 Logo URL" },
    { key: "site_announcement", value: "", description: "站点公告" },
    { key: "contact_email", value: "", description: "联系邮箱" },
    { key: "contact_info", value: "", description: "联系方式" },
    { key: "currency", value: "CNY", description: "默认币种" },
    { key: "order_timeout_minutes", value: 30, description: "订单超时时间（分钟）" },
    { key: "order_show_stock", value: true, description: "前台是否显示库存" },
    { key: "guest_checkout", value: true, description: "是否允许游客下单" },
    { key: "order_query_require_email", value: true, description: "订单查询是否需要邮箱" },
    { key: "site_theme_id", value: "default-theme", description: "站点默认色系" },
    { key: "site_theme_mode", value: "system", description: "站点默认亮暗模式" },
    { key: "promotion_withdrawal_account_types", value: ["支付宝", "微信支付", "银行卡"], description: "提现方式列表" },
    { key: "email_enabled", value: false, description: "是否启用邮件服务" },
    { key: "email_template_register_code", value: { subject: "{{siteName}} - 邮箱验证码", bodyHtml: "<div style=\"max-width:480px;margin:0 auto;font-family:sans-serif;\"><h1 style=\"color:#2563eb;\">{{siteName}}</h1><p>您好，</p><p>您的邮箱验证码为：</p><div style=\"text-align:center;margin:24px 0;\"><div style=\"font-size:32px;font-weight:bold;letter-spacing:4px;color:#1f2937;background:#f5f5f5;padding:16px 24px;border-radius:8px;display:inline-block;\">{{code}}</div></div><p style=\"color:#999;font-size:12px;\">此验证码将在 5 分钟后过期。</p><p style=\"color:#999;font-size:12px;\">如果您没有进行此操作，请忽略此邮件。</p></div>" }, description: "注册验证码邮件模板" },
    { key: "email_template_password_reset", value: { subject: "{{siteName}} 密码重置", bodyHtml: "<div style=\"max-width:480px;margin:0 auto;font-family:sans-serif;\"><h1 style=\"color:#2563eb;\">密码重置</h1><p>您好，</p><p>您的密码重置验证码为：</p><div style=\"text-align:center;margin:24px 0;\"><div style=\"font-size:32px;font-weight:bold;letter-spacing:4px;color:#1f2937;background:#f5f5f5;padding:16px 24px;border-radius:8px;display:inline-block;\">{{code}}</div></div><p style=\"color:#999;font-size:12px;\">此验证码将在 10 分钟后过期。</p><p style=\"color:#999;font-size:12px;\">如果您没有进行此操作，请忽略此邮件。</p></div>" }, description: "密码找回邮件模板" },
    { key: "email_template_order_paid", value: { subject: "{{siteName}} - 订单已支付", bodyHtml: "<div style=\"max-width:480px;margin:0 auto;font-family:sans-serif;\"><h1 style=\"color:#2563eb;\">{{siteName}}</h1><h2 style=\"font-size:18px;color:#374151;margin:16px 0 8px;\">感谢您的购买</h2><p>订单号：<strong>{{orderNo}}</strong></p><p>商品：{{productName}} × {{quantity}}</p><p>卡密内容：</p><div style=\"background:#f3f4f6;padding:12px;border-radius:6px;font-size:14px;font-family:monospace;white-space:pre-wrap;\">{{cardKeys}}</div></div>" }, description: "支付发卡密邮件模板" },
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description },
      create: setting,
    });
  }
  console.log(`✅ 系统设置初始化完成`);

  // 创建默认支付渠道（仅配置模板，需后台启用和填写密钥）
  const channels = [
    { code: "epay", name: "易支付", config: { apiUrl: "", pid: "", key: "" }, isEnabled: false },
    { code: "alipay", name: "支付宝", config: { apiUrl: "", pid: "", key: "" }, isEnabled: false },
    { code: "wxpay", name: "微信支付", config: { apiUrl: "", pid: "", key: "" }, isEnabled: false },
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

  // ─── 示例分类 ───
  const categories = [
    { name: "游戏账号", slug: "game-accounts", description: "Steam、Epic、国服等游戏账号", sortOrder: 1 },
    { name: "数字商品", slug: "digital-goods", description: "软件密钥、激活码、数字资源", sortOrder: 2 },
    { name: "会员服务", slug: "membership", description: "视频会员、网盘会员、AI 服务", sortOrder: 3 },
  ];

  const createdCategories: Record<string, number> = {};
  for (const cat of categories) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories[cat.slug] = c.id;
  }
  console.log(`✅ 示例分类创建完成 (${categories.length} 个)`);

  // ─── 示例商品 ───
  const products = [
    {
      name: "永劫无间 国服账号",
      slug: "naraka-account",
      categorySlug: "game-accounts",
      description: "<h3>商品说明</h3><p>永劫无间（Naraka: Bladepoint）国服账号，购买后自动发货卡密。</p><ul><li>24 小时自动发货</li><li>售后保障 7 天</li><li>支持邮箱改密</li></ul>",
      price: 69.00, originalPrice: 99.00,
      deliveryType: "auto_card",
      minQuantity: 1, maxQuantity: 1,
      status: "active",
      sortOrder: 1,
      purchaseNotes: "购买后请立即修改密码和绑定手机。",
    },
    {
      name: "Steam 热门游戏通用代充",
      slug: "steam-top-up",
      categorySlug: "game-accounts",
      description: "<h3>商品说明</h3><p>Steam 钱包代充服务，支持全区。</p><ul><li>付款后联系客服处理</li><li>通常 5-30 分钟到账</li></ul>",
      price: 29.90,
      deliveryType: "manual",
      minQuantity: 1, maxQuantity: 10,
      status: "active",
      sortOrder: 2,
      purchaseNotes: "购买后请主动联系客服并提供 Steam 好友代码。",
    },
    {
      name: "Windows 11/10 Pro 激活密钥",
      slug: "win10-key",
      categorySlug: "digital-goods",
      description: "<h3>商品说明</h3><p>Windows 10/11 专业版永久激活密钥，数字许可证永久激活。</p><ul><li>支持重装系统重复激活</li><li>一机一码</li><li>永久有效</li></ul>",
      price: 19.90, originalPrice: 49.00,
      deliveryType: "auto_card",
      minQuantity: 1, maxQuantity: 5,
      status: "active",
      salesCount: 128,
      sortOrder: 1,
      purchaseNotes: "激活失败请联系客服换货。",
    },
    {
      name: "Office 2021 专业版密钥",
      slug: "office-2021-key",
      categorySlug: "digital-goods",
      description: "<h3>商品说明</h3><p>Microsoft Office 2021 Professional Plus 正版激活密钥。</p><ul><li>含 Word、Excel、PowerPoint、Outlook 等</li><li>一机一码永久激活</li><li>支持重装</li></ul>",
      price: 39.90, originalPrice: 89.00,
      deliveryType: "auto_card",
      minQuantity: 1, maxQuantity: 3,
      status: "active",
      salesCount: 256,
      sortOrder: 2,
      purchaseNotes: "需另行购买 Windows 系统授权。",
    },
    {
      name: "钉钉云课堂年卡",
      slug: "dingtalk-course",
      categorySlug: "digital-goods",
      description: "<h3>商品说明</h3><p>钉钉云课堂企业版年卡，覆盖 500+ 门精品课程。</p><ul><li>购买后客服开通</li><li>有效期 365 天</li><li>支持手机/电脑学习</li></ul>",
      price: 199.00, originalPrice: 399.00,
      deliveryType: "manual",
      minQuantity: 1, maxQuantity: 1,
      status: "active",
      salesCount: 32,
      sortOrder: 3,
    },
    {
      name: "视频网站会员月卡",
      slug: "video-vip-month",
      categorySlug: "membership",
      description: "<h3>商品说明</h3><p>主流视频平台会员月卡，支持爱奇艺、腾讯视频、优酷、B站 四选一。</p><ul><li>下单时备注平台</li><li>自动充值到账</li><li>有效期 30 天</li></ul>",
      price: 25.00, originalPrice: 30.00,
      deliveryType: "auto_card",
      minQuantity: 1, maxQuantity: 12,
      status: "active",
      salesCount: 512,
      sortOrder: 1,
    },
    {
      name: "网盘超级会员月卡",
      slug: "cloud-vip-month",
      categorySlug: "membership",
      description: "<h3>商品说明</h3><p>百度网盘超级会员月卡，畅享极速下载和超大空间。</p><ul><li>自动充值到账</li><li>支持叠加时长</li></ul>",
      price: 45.00,
      deliveryType: "auto_card",
      minQuantity: 1, maxQuantity: 12,
      status: "active",
      salesCount: 198,
      sortOrder: 2,
    },
    {
      name: "ChatGPT Plus 合租",
      slug: "chatgpt-plus",
      categorySlug: "membership",
      description: "<h3>商品说明</h3><p>ChatGPT Plus 多人合租账号，独立对话记录。</p><ul><li>含 GPT-4 和 DALL·E 3 权限</li><li>月付制，续费优惠</li><li>售后群答疑</li></ul>",
      price: 69.00, originalPrice: 155.00,
      deliveryType: "manual",
      minQuantity: 1, maxQuantity: 1,
      status: "active",
      salesCount: 43,
      sortOrder: 3,
      purchaseNotes: "购买后请添加售后群获取使用说明。",
    },
  ];

  for (const product of products) {
    const { categorySlug, ...productData } = product;
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        ...productData,
        categoryId: createdCategories[categorySlug],
      },
    });
  }
  console.log(`✅ 示例商品创建完成 (${products.length} 个)`);

  // ─── 示例卡密（auto_card 类型商品） ───
  const cardProducts = await prisma.product.findMany({
    where: { deliveryType: "auto_card", status: "active" },
  });

  const sampleCards: Record<string, string[]> = {
    "naraka-account": [
      "NARAKA-ACCT-A1B2C3D4E5F6",
      "NARAKA-ACCT-G7H8I9J0K1L2",
      "NARAKA-ACCT-M3N4O5P6Q7R8",
      "NARAKA-ACCT-S9T0U1V2W3X4",
      "NARAKA-ACCT-Y5Z6A7B8C9D0",
    ],
    "win10-key": [
      "WX9CD-7K3F4-P6HJ8-N2M5B-R1T7V",
      "VK7JG-NPHTM-C97JM-9MPGT-3V66T",
      "W269N-WFGWX-YVC9B-4J6C9-T83GX",
      "NPPR9-FWDCX-D2C8J-H872K-2YT43",
      "8N67H-M3CY9-QT7C4-2TR7M-TXYCV",
    ],
    "office-2021-key": [
      "OFF21-ABCDE-FGHIJ-KLMNO-PQRST",
      "OFF21-UVWXY-Z1234-56789-ABCDE",
      "OFF21-FGHIJ-KLMNO-PQRST-UVWXY",
      "OFF21-Z1234-56789-ABCDE-FGHIJ",
      "OFF21-KLMNO-PQRST-UVWXY-Z1234",
    ],
    "video-vip-month": [
      "VIP-MT-20260701-A1B2C3D4",
      "VIP-MT-20260701-E5F6G7H8",
      "VIP-MT-20260701-I9J0K1L2",
      "VIP-MT-20260701-M3N4O5P6",
      "VIP-MT-20260701-Q7R8S9T0",
    ],
    "cloud-vip-month": [
      "CLOUD-SVIP-240701-XYZ123",
      "CLOUD-SVIP-240701-ABC456",
      "CLOUD-SVIP-240701-DEF789",
      "CLOUD-SVIP-240701-GHI012",
      "CLOUD-SVIP-240701-JKL345",
    ],
  };

  for (const product of cardProducts) {
    const cards = sampleCards[product.slug];
    if (!cards) continue;
    for (const content of cards) {
      const existing = await prisma.card.findFirst({
        where: { productId: product.id, content },
      });
      if (!existing) {
        await prisma.card.create({
          data: {
            productId: product.id,
            content,
            status: "available",
            batchNo: "seed-001",
          },
        });
      }
    }
  }
  console.log(`✅ 示例卡密创建完成`);

  // 重建 Redis 卡密池（忽略 Redis 不可用的错误）
  try {
    await rebuildPool();
    console.log("✅ Redis 卡密池已同步");
  } catch {
    console.warn("⚠️ Redis 不可用，卡密池未同步");
  }

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
