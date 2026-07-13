import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const newTemplate = {
    subject: "{{siteName}} - 订单已支付",
    bodyHtml:
      '<div style="max-width:480px;margin:0 auto;font-family:sans-serif;">' +
      '<h1 style="color:#2563eb;">{{siteName}}</h1>' +
      '<h2 style="font-size:18px;color:#374151;margin:16px 0 8px;">感谢您的购买</h2>' +
      "<p>订单号：<strong>{{orderNo}}</strong></p>" +
      "<p>商品：{{productName}} × {{quantity}}</p>" +
      "<p>卡密内容：</p>" +
      '<div style="background:#f3f4f6;padding:12px;border-radius:6px;font-size:14px;font-family:monospace;white-space:pre-wrap;">{{cardKeys}}</div>' +
      "</div>",
  };

  const existing = await prisma.systemSetting.findUnique({
    where: { key: "email_template_order_paid" },
  });

  if (!existing) {
    console.log("⚠️ email_template_order_paid not found in DB, skipping.");
    return;
  }

  await prisma.systemSetting.update({
    where: { key: "email_template_order_paid" },
    data: { value: newTemplate },
  });

  console.log("✅ email_template_order_paid template updated successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Failed to update template:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
