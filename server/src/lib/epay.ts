import crypto from "node:crypto";

/**
 * 易支付 (Epay) 集成模块
 *
 * 支持通过易支付网关创建支付宝、微信支付等订单。
 * 渠道 code 映射到 epay type 参数：
 *   alipay → type=alipay（支付宝）
 *   wxpay  → type=wxpay（微信支付）
 *   epay   → type=alipay（直接使用易支付时默认支付宝）
 */

export interface EpayConfig {
  apiUrl: string; // 易支付网关地址，如 https://pay.example.com
  pid: string;    // 商户 ID
  key: string;    // 商户密钥
}

export interface EpayCreateOrderParams {
  type: string;       // alipay / wxpay / qqpay / ...
  outTradeNo: string; // 商户订单号
  name: string;       // 商品名称
  money: string;      // 金额，如 "99.00"
  notifyUrl: string;  // 异步通知 URL
  returnUrl?: string; // 同步跳转 URL
  siteName?: string;  // 站点名称
}

export interface EpayCreateOrderResult {
  code: number;   // 1=成功, 0=失败
  payurl: string; // 支付链接
  qrcode?: string; // 二维码地址（部分易支付版本返回）
  msg?: string;   // 错误信息
}

/**
 * 对参数按 key 字典序排序并 MD5 签名
 */
function md5Sign(params: Record<string, string>, key: string): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("md5").update(sorted + `&key=${key}`).digest("hex");
}

/**
 * 创建易支付订单
 */
export async function createEpayOrder(
  config: EpayConfig,
  params: EpayCreateOrderParams,
): Promise<EpayCreateOrderResult> {
  const apiUrl = config.apiUrl.replace(/\/+$/, "") + "/mapi.php";

  const formParams: Record<string, string> = {
    pid: config.pid,
    type: params.type,
    out_trade_no: params.outTradeNo,
    notify_url: params.notifyUrl,
    return_url: params.returnUrl || params.notifyUrl,
    name: params.name,
    money: params.money,
    sitename: params.siteName || "SoloShop",
    sign_type: "MD5",
  };

  formParams.sign = md5Sign(formParams, config.key);

  // 尝试 JSON 格式请求
  const requestBody = new URLSearchParams(formParams);
  requestBody.set("format", "json");

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: requestBody.toString(),
    });

    if (!response.ok) {
      return { code: 0, payurl: "", msg: `HTTP ${response.status}` };
    }

    const text = await response.text();

    // 尝试解析 JSON
    try {
      const json = JSON.parse(text) as EpayCreateOrderResult;
      return json;
    } catch {
      // 如果不是 JSON（可能返回了 HTML），构造一个带有原始响应的结果
      return { code: 0, payurl: "", msg: "非 JSON 响应，可能是配置错误" };
    }
  } catch (err: any) {
    return { code: 0, payurl: "", msg: err.message || "网络错误" };
  }
}

/**
 * 获取 epay 支付方式对应的 type 参数
 */
export function getEpayType(channel: string): string {
  const map: Record<string, string> = {
    alipay: "alipay",
    wxpay: "wxpay",
    epay: "alipay",
  };
  return map[channel] || "alipay";
}

/**
 * 验证易支付异步通知签名
 * @returns 验证通过返回 true，否则 false
 */
export function verifyEpayCallback(
  config: EpayConfig,
  body: Record<string, string>,
): boolean {
  const { sign: callbackSign, sign_type, ...rest } = body;
  if (!callbackSign) return false;

  const formParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined && value !== null) {
      formParams[key] = String(value);
    }
  }

  const expectedSign = md5Sign(formParams, config.key);
  return expectedSign === callbackSign;
}

/**
 * 判断易支付回调状态是否为成功
 */
export function isTradeSuccess(
  body: Record<string, string>,
): boolean {
  return body.trade_status === "TRADE_SUCCESS";
}
