# 📡 SoloShop MVP API 接口全面分析

> 项目名称：SoloShop  
> 项目定位：轻量级数字商品发卡与自动交付系统  
> 技术栈：React 19 + TypeScript + Vite 8 + TailwindCSS 4 + Fastify 5 + Prisma + PostgreSQL 16 + Redis 7  
> 版本范围：MVP 第一版  
> 设计目标：商品展示、订单支付、自动发货、后台补单、库存管理、系统设置

---

## 一、认证相关 (Auth)

| 方法 | 路径                              | 说明                     |
| ---- | --------------------------------- | ------------------------ |
| POST | `/api/auth/login`                   | 管理员登录               |
| GET  | `/api/auth/me`                      | 获取当前管理员信息       |
| POST | `/api/auth/logout`                  | 管理员退出登录           |
| POST | `/api/auth/change-password`         | 修改管理员密码           |
| POST | `/api/auth/refresh`                 | 刷新登录 Token，可选     |
| GET  | `/api/auth/permissions`             | 获取当前管理员权限列表   |

---

## 二、前台站点配置 (Public Settings)

| 方法 | 路径                       | 说明                                                 |
| ---- | -------------------------- | ---------------------------------------------------- |
| GET  | `/api/public/settings`     | 获取前台公开站点配置                                 |
| GET  | `/api/public/announcement` | 获取前台公告                                         |
| GET  | `/api/public/config`       | 获取前台基础配置，如币种、订单超时时间、是否显示库存 |
| GET  | `/api/public/contact`      | 获取客服联系信息                                     |

---

## 三、商品分类 (Categories)

| 方法   | 路径                                | 说明                 |
| ------ | ----------------------------------- | -------------------- |
| GET    | `/api/public/categories`            | 前台获取可见商品分类 |
| GET    | `/api/admin/categories`             | 后台获取分类列表     |
| POST   | `/api/admin/categories`             | 创建商品分类         |
| GET    | `/api/admin/categories/:id`         | 获取分类详情         |
| PATCH  | `/api/admin/categories/:id`         | 更新商品分类         |
| DELETE | `/api/admin/categories/:id`         | 删除商品分类         |
| POST   | `/api/admin/categories/:id/enable`  | 启用分类             |
| POST   | `/api/admin/categories/:id/disable` | 禁用分类             |

---

## 四、商品相关 (Products)

| 方法   | 路径                                | 说明                       |
| ------ | ----------------------------------- | -------------------------- |
| GET    | `/api/public/products`              | 前台获取商品列表           |
| GET    | `/api/public/products/:slug`        | 前台获取商品详情           |
| GET    | `/api/admin/products`               | 后台获取商品列表           |
| POST   | `/api/admin/products`               | 创建商品                   |
| GET    | `/api/admin/products/:id`           | 获取商品详情               |
| PATCH  | `/api/admin/products/:id`           | 更新商品                   |
| DELETE | `/api/admin/products/:id`           | 删除商品，建议软删除       |
| POST   | `/api/admin/products/:id/publish`   | 上架商品                   |
| POST   | `/api/admin/products/:id/unpublish` | 下架商品                   |
| POST   | `/api/admin/products/:id/duplicate` | 复制商品                   |
| GET    | `/api/admin/products/:id/stats`     | 获取单个商品销售和库存统计 |

---

## 五、卡密库存 (Cards)

| 方法   | 路径                                | 说明                   |
| ------ | ----------------------------------- | ---------------------- |
| GET    | `/api/admin/cards`                  | 获取卡密库存列表       |
| POST   | `/api/admin/cards`                  | 新增单条卡密           |
| POST   | `/api/admin/cards/import`           | 批量导入卡密           |
| GET    | `/api/admin/cards/:id`              | 获取卡密详情，默认脱敏 |
| GET    | `/api/admin/cards/:id/reveal`       | 查看完整卡密内容       |
| PATCH  | `/api/admin/cards/:id`              | 更新卡密信息           |
| DELETE | `/api/admin/cards/:id`              | 删除卡密               |
| POST   | `/api/admin/cards/batch-delete`     | 批量删除卡密           |
| POST   | `/api/admin/cards/:id/disable`      | 禁用卡密               |
| POST   | `/api/admin/cards/:id/enable`       | 启用卡密               |
| GET    | `/api/admin/cards/stats`            | 获取库存状态统计       |
| GET    | `/api/admin/cards/batches`          | 获取卡密批次列表       |
| DELETE | `/api/admin/cards/batches/:batchNo` | 删除指定批次未售出卡密 |

---

## 六、订单相关 (Orders)

| 方法  | 路径                                   | 说明                            |
| ----- | -------------------------------------- | ------------------------------- |
| POST  | `/api/public/orders`                   | 前台创建订单                    |
| POST  | `/api/public/orders/query`             | 前台查询订单，建议订单号 + 邮箱 |
| GET   | `/api/public/orders/:orderNo/status`   | 前台查询订单支付和发货状态      |
| POST  | `/api/public/orders/resend-email`      | 重新发送发货邮件                |
| GET   | `/api/admin/orders`                    | 后台获取订单列表                |
| GET   | `/api/admin/orders/:id`                | 后台获取订单详情                |
| POST  | `/api/admin/orders/:id/mark-paid`      | 后台手动标记订单已支付          |
| POST  | `/api/admin/orders/:id/redeliver`      | 后台重新发货                    |
| POST  | `/api/admin/orders/:id/manual-deliver` | 后台手动发货                    |
| POST  | `/api/admin/orders/:id/close`          | 后台关闭未支付订单              |
| POST  | `/api/admin/orders/:id/cancel`         | 后台取消订单                    |
| PATCH | `/api/admin/orders/:id/note`           | 更新订单后台备注                |
| GET   | `/api/admin/orders/:id/logs`           | 获取订单操作日志                |
| POST  | `/api/admin/orders/export`             | 导出订单数据，CSV 或 Excel      |

---

## 七、支付相关 (Payment)

| 方法 | 路径                                  | 说明                         |
| ---- | ------------------------------------- | ---------------------------- |
| GET  | `/api/public/payment-channels`        | 前台获取可用支付渠道         |
| POST | `/api/pay/create`                     | 重新创建支付链接或支付二维码 |
| GET  | `/api/pay/status/:orderNo`            | 查询支付状态                 |
| POST | `/api/webhook/pay/:channel`           | 支付平台异步回调             |
| GET  | `/api/admin/payments`                 | 后台获取支付记录             |
| GET  | `/api/admin/payments/:id`             | 获取支付记录详情             |
| GET  | `/api/admin/payment-callbacks`        | 获取支付回调日志             |
| GET  | `/api/admin/payment-callbacks/:id`    | 获取支付回调详情             |
| POST | `/api/admin/payments/:id/sync`        | 手动同步支付状态，可选       |
| POST | `/api/admin/payments/:id/refund-mark` | 后台标记退款，MVP 可只做标记 |

---

## 八、发货相关 (Deliveries)

| 方法 | 路径                                     | 说明                   |
| ---- | ---------------------------------------- | ---------------------- |
| GET  | `/api/admin/deliveries`                  | 获取发货记录列表       |
| GET  | `/api/admin/deliveries/:id`              | 获取发货记录详情       |
| POST | `/api/admin/deliveries/:id/retry`        | 重试失败的发货任务     |
| POST | `/api/admin/deliveries/:id/resend-email` | 重新发送该发货记录邮件 |
| GET  | `/api/admin/deliveries/failed`           | 获取发货失败列表       |
| POST | `/api/admin/deliveries/batch-retry`      | 批量重试发货失败任务   |

---

## 九、邮件通知 (Email)

| 方法  | 路径                               | 说明             |
| ----- | ---------------------------------- | ---------------- |
| GET   | `/api/admin/email-logs`            | 获取邮件发送日志 |
| GET   | `/api/admin/email-logs/:id`        | 获取邮件日志详情 |
| POST  | `/api/admin/email-logs/:id/resend` | 重新发送某封邮件 |
| GET   | `/api/admin/email-templates`       | 获取邮件模板列表 |
| GET   | `/api/admin/email-templates/:key`  | 获取邮件模板详情 |
| PATCH | `/api/admin/email-templates/:key`  | 更新邮件模板     |
| POST  | `/api/admin/settings/mail/test`    | 发送测试邮件     |

---

## 十、后台首页统计 (Dashboard)

| 方法 | 路径                                     | 说明             |
| ---- | ---------------------------------------- | ---------------- |
| GET  | `/api/admin/dashboard/overview`          | 获取后台概览数据 |
| GET  | `/api/admin/dashboard/sales-trend`       | 获取销售趋势数据 |
| GET  | `/api/admin/dashboard/recent-orders`     | 获取最近订单     |
| GET  | `/api/admin/dashboard/top-products`      | 获取商品销量排行 |
| GET  | `/api/admin/dashboard/payment-channels`  | 获取支付渠道占比 |
| GET  | `/api/admin/dashboard/stock-alerts`      | 获取库存预警商品 |
| GET  | `/api/admin/dashboard/failed-deliveries` | 获取发货失败统计 |

---

## 十一、优惠码 (Coupons)

> 优惠码可以作为 MVP 后期功能，也可以放到 P1 阶段。

| 方法   | 路径                             | 说明               |
| ------ | -------------------------------- | ------------------ |
| POST   | `/api/public/coupons/verify`     | 前台校验优惠码     |
| GET    | `/api/admin/coupons`             | 获取优惠码列表     |
| POST   | `/api/admin/coupons`             | 创建优惠码         |
| GET    | `/api/admin/coupons/:id`         | 获取优惠码详情     |
| PATCH  | `/api/admin/coupons/:id`         | 更新优惠码         |
| DELETE | `/api/admin/coupons/:id`         | 删除优惠码         |
| POST   | `/api/admin/coupons/:id/enable`  | 启用优惠码         |
| POST   | `/api/admin/coupons/:id/disable` | 禁用优惠码         |
| GET    | `/api/admin/coupons/:id/usages`  | 获取优惠码使用记录 |

---

## 十二、用户相关 (Users)

> SoloShop MVP 可以先不做用户注册，采用游客购买。  
> 如果后续要做余额、额度、会员、代理系统，再启用用户模块。

| 方法 | 路径                           | 说明                   |
| ---- | ------------------------------ | ---------------------- |
| GET  | `/api/admin/users`             | 后台获取用户列表，可选 |
| GET  | `/api/admin/users/:id`         | 获取用户详情，可选     |
| GET  | `/api/admin/users/:id/orders`  | 获取用户订单，可选     |
| POST | `/api/admin/users/:id/disable` | 禁用用户，可选         |
| POST | `/api/admin/users/:id/enable`  | 启用用户，可选         |

---

## 十三、支付渠道配置 (Payment Channels)

| 方法  | 路径                                        | 说明                   |
| ----- | ------------------------------------------- | ---------------------- |
| GET   | `/api/admin/payment-channels`               | 获取支付渠道配置列表   |
| GET   | `/api/admin/payment-channels/:code`         | 获取指定支付渠道配置   |
| PATCH | `/api/admin/payment-channels/:code`         | 更新支付渠道配置       |
| POST  | `/api/admin/payment-channels/:code/enable`  | 启用支付渠道           |
| POST  | `/api/admin/payment-channels/:code/disable` | 禁用支付渠道           |
| POST  | `/api/admin/payment-channels/:code/test`    | 测试支付渠道配置，可选 |

---

## 十四、系统设置 (Settings)

| 方法  | 路径                              | 说明                 |
| ----- | --------------------------------- | -------------------- |
| GET   | `/api/admin/settings`             | 获取全部后台系统设置 |
| PATCH | `/api/admin/settings/site`        | 更新站点设置         |
| PATCH | `/api/admin/settings/order`       | 更新订单设置         |
| PATCH | `/api/admin/settings/security`    | 更新安全设置         |
| PATCH | `/api/admin/settings/mail`        | 更新邮件设置         |
| PATCH | `/api/admin/settings/storage`     | 更新上传存储设置     |
| PATCH | `/api/admin/settings/theme`       | 更新主题设置         |
| POST  | `/api/admin/settings/reset-cache` | 清理系统缓存         |

---

## 十五、文件上传 (Uploads)

| 方法   | 路径                       | 说明                       |
| ------ | -------------------------- | -------------------------- |
| POST   | `/api/admin/uploads/image` | 上传图片，如商品封面、Logo |
| POST   | `/api/admin/uploads/file`  | 上传文件，可选             |
| DELETE | `/api/admin/uploads`       | 删除上传文件               |
| GET    | `/api/admin/uploads`       | 获取上传文件列表，可选     |

---

## 十六、管理员与权限 (Admins & Roles)

| 方法   | 路径                            | 说明           |
| ------ | ------------------------------- | -------------- |
| GET    | `/api/admin/admins`             | 获取管理员列表 |
| POST   | `/api/admin/admins`             | 创建管理员     |
| GET    | `/api/admin/admins/:id`         | 获取管理员详情 |
| PATCH  | `/api/admin/admins/:id`         | 更新管理员     |
| DELETE | `/api/admin/admins/:id`         | 删除管理员     |
| POST   | `/api/admin/admins/:id/disable` | 禁用管理员     |
| POST   | `/api/admin/admins/:id/enable`  | 启用管理员     |
| GET    | `/api/admin/roles`              | 获取角色列表   |
| POST   | `/api/admin/roles`              | 创建角色       |
| PATCH  | `/api/admin/roles/:id`          | 更新角色权限   |
| DELETE | `/api/admin/roles/:id`          | 删除角色       |

---

## 十七、操作日志 (Operation Logs)

| 方法 | 路径                               | 说明             |
| ---- | ---------------------------------- | ---------------- |
| GET  | `/api/admin/operation-logs`        | 获取后台操作日志 |
| GET  | `/api/admin/operation-logs/:id`    | 获取操作日志详情 |
| GET  | `/api/admin/login-logs`            | 获取后台登录日志 |
| GET  | `/api/admin/security-logs`         | 获取安全日志     |
| POST | `/api/admin/operation-logs/export` | 导出操作日志     |

---

## 十八、风控安全 (Security)

| 方法   | 路径                                      | 说明           |
| ------ | ----------------------------------------- | -------------- |
| GET    | `/api/admin/security/rate-limits`         | 获取限流配置   |
| PATCH  | `/api/admin/security/rate-limits`         | 更新限流配置   |
| GET    | `/api/admin/security/ip-blacklist`        | 获取 IP 黑名单 |
| POST   | `/api/admin/security/ip-blacklist`        | 添加 IP 黑名单 |
| DELETE | `/api/admin/security/ip-blacklist/:id`    | 删除 IP 黑名单 |
| GET    | `/api/admin/security/email-blacklist`     | 获取邮箱黑名单 |
| POST   | `/api/admin/security/email-blacklist`     | 添加邮箱黑名单 |
| DELETE | `/api/admin/security/email-blacklist/:id` | 删除邮箱黑名单 |

---

## 十九、系统维护 (System Maintenance)

| 方法   | 路径                                       | 说明             |
| ------ | ------------------------------------------ | ---------------- |
| GET    | `/api/system/health`                       | 健康检查         |
| GET    | `/api/admin/system/info`                   | 获取系统信息     |
| GET    | `/api/admin/system/version`                | 获取当前版本信息 |
| POST   | `/api/admin/system/backup`                 | 创建数据库备份   |
| GET    | `/api/admin/system/backups`                | 获取备份列表     |
| POST   | `/api/admin/system/backups/:id/restore`    | 恢复数据库备份   |
| DELETE | `/api/admin/system/backups/:id`            | 删除备份         |
| POST   | `/api/admin/system/cleanup-expired-orders` | 清理过期订单     |
| POST   | `/api/admin/system/release-locked-cards`   | 释放异常锁定卡密 |
| POST   | `/api/admin/system/rebuild-stats`          | 重建统计数据     |

---

## 二十、开放接口 (Open API)

> MVP 第一版不建议开放给外部系统。  
> 如果后续做分销、API 接入或第三方商城集成，可以增加这一组接口。

| 方法 | 路径                                 | 说明                 |
| ---- | ------------------------------------ | -------------------- |
| GET  | `/api/open/products`                 | 外部系统获取商品列表 |
| GET  | `/api/open/products/:id`             | 外部系统获取商品详情 |
| POST | `/api/open/orders`                   | 外部系统创建订单     |
| GET  | `/api/open/orders/:orderNo`          | 外部系统查询订单     |
| GET  | `/api/open/orders/:orderNo/delivery` | 外部系统查询发货内容 |
| GET  | `/api/open/stock/:productId`         | 外部系统查询商品库存 |
| POST | `/api/open/webhook/test`             | 测试外部回调地址     |

---

## 二十一、AI 额度卡扩展 (AI Credit Extension)

> 如果 SoloShop 用来销售 ZiroCode / AI 中转站额度卡，可以后期增加额度充值型商品接口。

| 方法   | 路径                                       | 说明                 |
| ------ | ------------------------------------------ | -------------------- |
| POST   | `/api/admin/products/:id/bind-credit-plan` | 商品绑定额度套餐     |
| GET    | `/api/admin/credit-plans`                  | 获取额度套餐列表     |
| POST   | `/api/admin/credit-plans`                  | 创建额度套餐         |
| PATCH  | `/api/admin/credit-plans/:id`              | 更新额度套餐         |
| DELETE | `/api/admin/credit-plans/:id`              | 删除额度套餐         |
| POST   | `/api/delivery/credit/recharge`            | 内部额度充值发货接口 |
| GET    | `/api/admin/credit-recharge-logs`          | 获取额度充值发货日志 |

---

## 二十二、接口状态说明

### 订单状态

| 状态        | 说明   |
| ----------- | ------ |
| `pending`   | 待处理 |
| `completed` | 已完成 |
| `cancelled` | 已取消 |
| `closed`    | 已关闭 |
| `refunded`  | 已退款 |

### 支付状态

| 状态               | 说明     |
| ------------------ | -------- |
| `unpaid`           | 未支付   |
| `paid`             | 已支付   |
| `failed`           | 支付失败 |
| `refunded`         | 已退款   |
| `partial_refunded` | 部分退款 |

### 发货状态

| 状态              | 说明         |
| ----------------- | ------------ |
| `pending`         | 待发货       |
| `delivering`      | 发货中       |
| `delivered`       | 已发货       |
| `failed`          | 发货失败     |
| `manual_required` | 需要人工处理 |

### 卡密状态

| 状态        | 说明             |
| ----------- | ---------------- |
| `available` | 可售             |
| `locked`    | 已锁定，等待支付 |
| `sold`      | 已售出           |
| `disabled`  | 已禁用           |
| `expired`   | 已过期           |

### 商品状态

| 状态       | 说明   |
| ---------- | ------ |
| `draft`    | 草稿   |
| `active`   | 已上架 |
| `inactive` | 已下架 |
| `sold_out` | 已售罄 |
| `deleted`  | 已删除 |

---

## 二十三、错误码设计

| 错误码                       | 说明             |
| ---------------------------- | ---------------- |
| `UNAUTHORIZED`               | 未登录           |
| `FORBIDDEN`                  | 无权限           |
| `VALIDATION_ERROR`           | 参数校验失败     |
| `PRODUCT_NOT_FOUND`          | 商品不存在       |
| `PRODUCT_OFFLINE`            | 商品未上架       |
| `PRODUCT_SOLD_OUT`           | 商品已售罄       |
| `INSUFFICIENT_STOCK`         | 库存不足         |
| `ORDER_NOT_FOUND`            | 订单不存在       |
| `ORDER_EXPIRED`              | 订单已过期       |
| `ORDER_ALREADY_PAID`         | 订单已支付       |
| `ORDER_ALREADY_DELIVERED`    | 订单已发货       |
| `PAYMENT_CHANNEL_DISABLED`   | 支付渠道未启用   |
| `PAYMENT_SIGNATURE_INVALID`  | 支付签名验证失败 |
| `PAYMENT_AMOUNT_MISMATCH`    | 支付金额不一致   |
| `PAYMENT_CALLBACK_DUPLICATE` | 支付回调重复     |
| `DELIVERY_FAILED`            | 发货失败         |
| `CARD_NOT_FOUND`             | 卡密不存在       |
| `CARD_ALREADY_SOLD`          | 卡密已售出       |
| `CARD_LOCKED`                | 卡密已被锁定     |
| `RATE_LIMITED`               | 请求过于频繁     |
| `ADMIN_PASSWORD_INVALID`     | 管理员密码错误   |
| `SYSTEM_ERROR`               | 系统异常         |

---

## 二十四、MVP 必须接口

> 下面这些是 SoloShop 第一版必须优先实现的接口。

| 模块      | 必须接口数量 | 说明                                         |
| --------- | -----------: | -------------------------------------------- |
| 认证      |            4 | 后台登录、退出、获取当前管理员、修改密码     |
| 前台配置  |            2 | 站点配置、公告                               |
| 商品分类  |            4 | 分类列表、创建、更新、删除                   |
| 商品      |           10 | 前台展示、后台增删改查、上下架、复制         |
| 卡密库存  |            8 | 导入、列表、禁用、启用、查看、统计           |
| 订单      |           12 | 创建、查询、状态、后台详情、补单、发货、关闭 |
| 支付      |            8 | 支付渠道、支付创建、支付回调、支付记录       |
| 发货      |            5 | 发货记录、重试、失败列表                     |
| Dashboard |            5 | 概览、趋势、最近订单、排行、库存预警         |
| 设置      |            6 | 站点、订单、安全、邮件、主题、缓存           |
| 上传      |            1 | 图片上传                                     |
| 日志      |            3 | 操作日志、登录日志、安全日志                 |
| 健康检查  |            1 | 系统健康检查                                 |

---

## 二十五、MVP 暂缓接口

| 模块             | 暂缓原因                      |
| ---------------- | ----------------------------- |
| 用户注册登录     | MVP 先用游客购买，降低复杂度  |
| 用户余额         | 涉及账户资产和流水，放到 P1   |
| 代理返佣         | 涉及分佣、结算、提现，放到 P2 |
| 多商户 SaaS      | 数据隔离复杂，第一版不做      |
| 开放 API         | 系统稳定后再开放              |
| AI 额度充值      | 等发卡核心稳定后再做          |
| 自动退款         | MVP 可先后台人工标记          |
| 文件商品下载权限 | 第一版先做卡密和固定文本      |

---

## 二十六、总结

| 类型            |    数量 |
| --------------- | ------: |
| MVP 核心接口    |  70+ 个 |
| P1 可选接口     |  20+ 个 |
| P2 / 商业化接口 |  20+ 个 |
| 全量规划接口    | 110+ 个 |

**主要模块：**  
认证、前台配置、商品分类、商品、卡密库存、订单、支付、发货、邮件、Dashboard、优惠码、用户、支付渠道配置、系统设置、上传、管理员权限、操作日志、风控安全、系统维护、开放接口、AI 额度卡扩展。

**MVP 第一版重点：**

- 商品可以创建、上架、展示
- 卡密可以批量导入、锁定、售出
- 用户可以游客下单
- 支付回调可以验签、验金额、幂等处理
- 支付成功可以自动发货
- 用户可以通过订单号 + 邮箱查询订单
- 后台可以补单、重发、关闭订单
- 管理员可以查看支付回调日志、发货日志、操作日志
- 系统可以备份、释放异常锁定库存、清理过期订单

**不建议第一版做：**

- 多商户 SaaS
- 代理返佣
- 用户余额
- 复杂优惠券
- 插件市场
- 开放平台
- 自动退款

---

## 二十七、推荐接口优先级

| 优先级 | 模块                                              |
| ------ | ------------------------------------------------- |
| P0     | 认证、商品、卡密、订单、支付回调、自动发货        |
| P1     | Dashboard、邮件通知、支付配置、订单补单、发货重试 |
| P2     | 优惠码、风控、安全日志、系统备份、管理员权限      |
| P3     | 用户体系、余额、代理返佣、开放 API                |
| P4     | 多商户 SaaS、插件系统、AI 额度卡扩展    |

最终建议：

> SoloShop MVP 的 API 不要追求接口数量，而要保证交易链路稳定。第一版重点是 **商品、订单、支付、库存、发货、后台补救、日志追踪**。只要做到支付不丢单、库存不超卖、发货可追踪、后台能补救，这个 MVP 就是合格的。