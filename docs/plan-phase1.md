# Phase 1 开发计划 — 基础交易闭环

## 一、Phase 1 目标

> **商品能展示 → 买家能下单 → 支付能回调 → 库存不超卖 → 卡密能自动发货 → 订单能查询 → 后台能补单和重发**

### 核心原则

- **不碰用户体系**：全程游客购买，无需注册登录
- **不碰复杂营销**：优惠券、返佣等 Phase 2 再做
- **不碰多商户**：第一版就是单店铺
- **不碰邮件通知**：第一版支付成功页直接展示发货内容，邮件 Phase 2
- **交易链路稳定优先**：幂等、锁、事务、日志一个不能少

---

## 二、Phase 1 开发阶段划分

```
Phase 1 分 5 个子阶段，建议按顺序推进，每个阶段产出可验证的成果：
```

| 阶段 | 内容 | 预期工时 |
|------|------|---------|
| **S1 基础设施** | 项目脚手架、Prisma 数据模型、Docker 环境 | 1-2 天 |
| **S2 后台管理** | 管理员认证 + 商品管理 + 分类管理 + 卡密管理 | 3-4 天 |
| **S3 前台商店** | 商品展示 + 下单 + 支付对接 | 3-4 天 |
| **S4 交易闭环** | 支付回调 + 自动发货 + 订单查询 + 库存流转 | 2-3 天 |
| **S5 后台运营** | 仪表板 + 订单管理 + 支付记录 + 发货管理 + 系统设置 | 2-3 天 |

> 合计约 11-16 天（单人开发）

---

## 三、数据模型设计

### 3.1 模型总览

```
admin          管理员
category       商品分类
product        商品
card           卡密库存
order          订单（含支付、发货信息）
payment        支付记录
payment_channel   支付渠道配置
operation_log     操作日志
system_setting    系统设置
```

### 3.2 各模型核心字段

#### Admin
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int | 主键 |
| username | String | 唯一，登录名 |
| password | String | bcrypt 加密 |
| nickname | String | 显示名称 |
| isActive | Boolean | 是否启用 |
| lastLoginAt | DateTime? | 最后登录时间 |
| createdAt | DateTime | 创建时间 |

#### Category
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int | 主键 |
| name | String | 分类名称 |
| slug | String | URL 标识，唯一 |
| description | String? | 分类描述 |
| sortOrder | Int | 排序权重 |
| isVisible | Boolean | 前台是否显示 |
| productCount | Int | 商品数量（冗余） |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### Product
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int | 主键 |
| name | String | 商品名称 |
| slug | String | URL 标识，唯一 |
| categoryId | Int | 关联分类 |
| description | String? | 商品详情（富文本） |
| coverImage | String? | 封面图 URL |
| price | Decimal | 售价 |
| originalPrice | Decimal? | 原价（划线价） |
| costPrice | Decimal? | 成本价 |
| stock | Int | 库存数量（冗余） |
| salesCount | Int | 销量（冗余） |
| deliveryType | Enum | 发货方式：auto_card / manual / text |
| deliveryContent | String? | 固定文本发货内容（deliveryType=text 时） |
| minQuantity | Int | 最小购买数量，默认 1 |
| maxQuantity | Int | 最大购买数量，默认 1 |
| status | Enum | draft / active / inactive / sold_out |
| sortOrder | Int | 排序权重 |
| isHidden | Boolean | 是否隐藏（隐藏后前台不可见） |
| purchaseNotes | String? | 购买须知 |
| createdAt | DateTime | |
| updatedAt | DateTime | |
| deletedAt | DateTime? | 软删除 |

#### Card (卡密)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int | 主键 |
| productId | Int | 关联商品 |
| content | String | 卡密内容（加密存储） |
| status | Enum | available / locked / sold / disabled / expired |
| batchNo | String? | 批次号，方便追踪 |
| orderId | Int? | 锁定或售出时关联订单 |
| lockedAt | DateTime? | 锁定时间（用于超时释放） |
| soldAt | DateTime? | 售出时间 |
| createdAt | DateTime | |

#### Order
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int | 主键 |
| orderNo | String | 订单号，唯一，如 SOLO20260706123456 |
| productId | Int | 关联商品 |
| productSnapshot | Json | 下单时商品快照（名称、价格等） |
| quantity | Int | 购买数量 |
| totalAmount | Decimal | 总金额 |
| buyerEmail | String? | 买家邮箱 |
| buyerContact | String? | 买家联系方式 |
| buyerIp | String? | 买家 IP |
| userAgent | String? | 浏览器 UA |
| orderStatus | Enum | pending / completed / cancelled / closed |
| paymentStatus | Enum | unpaid / paid / failed / refunded |
| deliveryStatus | Enum | pending / delivering / delivered / failed |
| paidAt | DateTime? | 支付时间 |
| deliveredAt | DateTime? | 发货时间 |
| note | String? | 后台备注 |
| createdAt | DateTime | |
| expiredAt | DateTime | 订单过期时间（超时未支付自动关闭） |

#### Payment
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int | 主键 |
| orderId | Int | 关联订单 |
| channel | String | 支付渠道编码，如 yipay / stripe |
| tradeNo | String? | 平台订单号 |
| channelOrderNo | String? | 支付渠道订单号 |
| amount | Decimal | 支付金额 |
| paidAmount | Decimal? | 实际支付金额 |
| status | Enum | pending / success / failed |
| rawData | Json? | 回调原始数据（用于排查） |
| createdAt | DateTime | |
| paidAt | DateTime? | |

#### PaymentChannel
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int | 主键 |
| code | String | 渠道编码，唯一：yipay / stripe |
| name | String | 显示名称 |
| config | Json | 渠道配置（密钥、URL 等），脱敏显示 |
| isEnabled | Boolean | 是否启用 |
| sortOrder | Int | 排序权重 |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### OperationLog
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int | 主键 |
| adminId | Int? | 操作管理员 |
| action | String | 操作类型，如 product.create / order.mark-paid |
| targetType | String | 操作对象类型，如 product / order / card |
| targetId | Int? | 操作对象 ID |
| detail | Json? | 操作详情 |
| ip | String? | 操作 IP |
| createdAt | DateTime | |

#### SystemSetting
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int | 主键 |
| key | String | 设置键，唯一 |
| value | Json | 设置值 |
| description | String? | 说明 |
| updatedAt | DateTime | |

---

## 四、S1 — 基础设施搭建

### 4.1 项目初始化

- [ ] 初始化 `server/` — Fastify + TypeScript + Prisma
- [ ] 初始化 `frontend/` — Vite + React 19 + TypeScript + TailwindCSS
- [ ] 配置 `docker-compose.yml`（postgres + redis + api + nginx）
- [ ] 配置 `nginx/default.conf`（反向代理到 4000）
- [ ] 编写 `.env.example`（数据库、Redis、JWT Secret 等）

### 4.2 数据模型

- [ ] 创建 `prisma/schema.prisma`（上述所有表）
- [ ] 运行 `prisma migrate dev` 生成迁移
- [ ] 编写 `prisma/seed.ts`（默认管理员 + 基础系统设置）

### 4.3 后端基础架构

- [ ] `src/lib/db.ts` — Prisma 客户端单例
- [ ] `src/lib/api-utils.ts` — 统一响应格式 + 错误处理
- [ ] `src/lib/auth.ts` — JWT 签发 + 验证中间件
- [ ] `src/lib/cache.ts` — Redis 连接 + 基本操作封装
- [ ] `src/lib/card-pool.ts` — 卡密 Redis 池（SPOP 锁定 / SADD 释放 / SCARD 统计 / 重启恢复）
- [ ] `src/lib/rate-limit.ts` — 基于 Redis 的限流
- [ ] `src/routes/system/health.ts` — 健康检查接口

### 4.4 前端基础架构

- [ ] `src/main.tsx` — 入口（React Router + QueryClient）
- [ ] `src/App.tsx` — 路由配置
- [ ] `src/index.css` — TailwindCSS 全局样式
- [ ] `src/api/client.ts` — Axios/fetch 封装（baseURL + 拦截器）
- [ ] `src/components/` — 通用组件（Loading、ErrorBoundary、EmptyState、ErrorState）
- [ ] 配置 Vite 代理到 4000 端口

---

## 五、S2 — 后台管理系统

### 5.1 管理员认证

#### 后端接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 管理员登录，返回 JWT |
| POST | `/api/auth/logout` | 退出登录 |
| GET | `/api/auth/me` | 获取当前管理员信息 |
| POST | `/api/auth/change-password` | 修改密码 |

#### 前端页面
- `admin/LoginPage.tsx` — 登录表单（用户名 + 密码 + 提交）
- `admin/layout` — 后台布局（侧边栏 + 顶栏），未登录重定向

### 5.2 分类管理

#### 后端接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/categories` | 分类列表（含商品数量） |
| POST | `/api/admin/categories` | 创建分类 |
| GET | `/api/admin/categories/:id` | 分类详情 |
| PATCH | `/api/admin/categories/:id` | 编辑分类 |
| DELETE | `/api/admin/categories/:id` | 删除分类（有商品时不允许） |
| POST | `/api/admin/categories/:id/enable` | 启用（前台显示） |
| POST | `/api/admin/categories/:id/disable` | 禁用（前台隐藏） |
| PATCH | `/api/admin/categories/sort` | 批量排序 |

#### 前端页面
- `CategoriesPage.tsx` — 分类表格 + 创建/编辑弹窗 + 拖拽排序

### 5.3 商品管理

#### 后端接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/products` | 商品列表（分页 + 搜索 + 筛选） |
| POST | `/api/admin/products` | 创建商品 |
| GET | `/api/admin/products/:id` | 商品详情 |
| PATCH | `/api/admin/products/:id` | 编辑商品 |
| DELETE | `/api/admin/products/:id` | 软删除 |
| POST | `/api/admin/products/:id/publish` | 上架 |
| POST | `/api/admin/products/:id/unpublish` | 下架 |
| POST | `/api/admin/products/:id/duplicate` | 复制商品 |
| GET | `/api/admin/products/:id/stats` | 销量 + 库存统计 |

#### 前端页面
- `ProductsPage.tsx` — 商品列表（表格 + 搜索 + 状态筛选 + 分页）
- `ProductEditPage.tsx` — 商品编辑表单（基本信息 + 分类 + 价格 + 详情 + 封面上传）

### 5.4 卡密管理

#### 后端接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/cards` | 卡密列表（分页 + 按商品筛选 + 按状态筛选） |
| POST | `/api/admin/cards` | 单条新增 |
| POST | `/api/admin/cards/import` | 批量导入（文本逐行 / 文件上传），同时同步 Redis 可用池 |
| GET | `/api/admin/cards/:id` | 卡密详情（默认脱敏） |
| GET | `/api/admin/cards/:id/reveal` | 查看完整卡密（记录日志） |
| PATCH | `/api/admin/cards/:id` | 编辑 |
| DELETE | `/api/admin/cards/:id` | 删除 |
| POST | `/api/admin/cards/:id/disable` | 禁用 |
| POST | `/api/admin/cards/:id/enable` | 启用 |
| POST | `/api/admin/cards/batch-delete` | 批量删除 |
| GET | `/api/admin/cards/stats` | 库存统计（各状态数量） |
| GET | `/api/admin/cards/batches` | 批次列表 |
| DELETE | `/api/admin/cards/batches/:batchNo` | 删除某批次未售出卡密 |

#### 前端页面
- `CardsPage.tsx` — 卡密列表（表格 + 商品筛选 + 状态筛选 + 分页）
- `CardsImportPage.tsx` — 批量导入（文本粘贴区 + 文件上传 + 导入结果展示）

### 5.5 S2 前端组件需求

- `AdminLayout.tsx` + `AdminSidebar.tsx` + `AdminTopBar.tsx`
- `Modal.tsx` — 通用模态框
- `ConfirmDialog.tsx` — 二次确认弹窗
- `Pagination.tsx` — 分页组件
- `SearchBar.tsx` — 搜索框
- `ImageUploader.tsx` — 图片上传（商品封面）
- `EmptyState.tsx` — 表格无数据占位
- `ErrorState.tsx` — 加载失败展示

---

## 六、S3 — 前台商店

### 6.1 公开配置

#### 后端接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/public/settings` | 站点名称、Logo、公告等 |
| GET | `/api/public/categories` | 可见分类列表 |
| GET | `/api/public/products` | 商品列表（上架 + 可见 + 有库存） |
| GET | `/api/public/products/:slug` | 商品详情（含库存状态） |
| GET | `/api/public/payment-channels` | 可用的支付渠道 |

### 6.2 下单

#### 后端接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/public/orders` | 创建订单（商品 slug + 数量 + 邮箱 + 联系方式） |
| GET | `/api/public/orders/:orderNo/status` | 查询订单状态（支付 + 发货） |

下单流程逻辑：
1. 校验商品存在、已上架、有库存
2. 校验购买数量在 minQuantity ~ maxQuantity 范围内
3. 锁定库存（卡密状态 available → locked）
4. 计算金额、生成订单号、创建订单
5. 返回订单号 + 待支付信息

### 6.3 支付

#### 后端接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/public/payment/create` | 创建支付（订单号 + 支付渠道） |
| GET | `/api/public/payment/status/:orderNo` | 支付结果轮询 |

#### 易支付对接
1. 根据渠道配置构建签名
2. 返回支付 URL 或二维码内容（前端展示）
3. 前端轮询支付状态

#### Stripe 对接
1. 创建 Stripe Checkout Session
2. 返回 session URL
3. 前端跳转 Stripe 支付页
4. Stripe 回调 + webhook 更新状态

### 6.4 前端页面

- `StorePage.tsx` — 首页：分类 tab + 商品卡片网格 + 站点公告 + 联系方式
- `ProductPage.tsx` — 商品详情页：封面图 + 名称 + 价格 + 库存 + 购买须知 + 数量选择 + 立即购买
- `CheckoutPage.tsx` — 下单确认页：商品摘要 + 数量 + 总价 + 支付方式选择 + 邮箱输入
- `PayPage.tsx` — 支付页：二维码/支付链接 + 支付状态轮询 + 倒计时提示

### 6.5 前端组件需求

- `AppLayout.tsx` — 前台布局（Header + 主内容 + Footer），Header 含站点名 + 订单查询入口
- `ProductCard.tsx` — 商品卡片（封面 + 名称 + 价格 + 销量 + 库存状态）
- `PaymentStatusBadge.tsx` — 支付状态标签

---

## 七、S4 — 交易闭环

### 7.1 支付回调处理

#### 后端接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/webhook/pay/yipay` | 易支付异步回调 |
| POST | `/api/webhook/pay/stripe` | Stripe Webhook |

回调处理流程（易支付为例）：
1. 接收回调参数
2. 验证签名（按渠道配置的密钥）
3. 校验支付金额与订单金额一致
4. 校验平台订单号对应订单存在
5. **幂等处理**：该订单已支付成功 → 直接返回 success
6. 更新订单 paymentStatus = paid
7. 更新 Payment 记录
8. 触发自动发货
9. 记录回调日志
10. 返回 success

业务规则：
- 回调使用 **Redis 分布式锁**（key: `pay:{orderNo}`），防止并发
- 重复回调直接返回成功（幂等）
- 支付金额不一致 → 记录异常 + 不发货 + 通知管理员

### 7.2 自动发货引擎

触发时机：支付成功回调处理完后立即触发

逻辑（`lib/delivery.ts`）：
1. 根据商品 deliveryType 执行不同策略
2. **auto_card（卡密自动发货）**：
   - 从订单已锁定的卡密中扣减（状态 locked → sold）
   - 记录发货内容到 delivery 记录
   - 状态更新为 delivered
3. **text（固定文本发货）**：
   - 直接取 product.deliveryContent
   - 记录发货内容
4. **manual（人工发货）**：
   - 状态设为 manual_required
   - 等待后台人工处理
5. **重要规则**：
   - 已发货的订单不可再次扣卡密
   - 重新发货只能发送原 delivery 记录内容

#### 后端接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/public/orders/:orderNo/delivery` | 查询发货内容（订单号 + 邮箱验证） |

### 7.3 订单查询

#### 后端接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/public/orders/query` | 订单查询（订单号 + 邮箱） |
| POST | `/api/public/orders/resend-email` | 重发发货邮件（Phase 2 实现） |

查询流程：
1. 校验订单号 + 邮箱匹配
2. 返回订单状态、支付状态、发货状态
3. 已发货 → 返回发货内容（脱敏？看配置）
4. 限流：同一 IP 每分钟最多查询 10 次

#### 前端页面
- `OrderQueryPage.tsx` — 输入订单号 + 邮箱 → 查询
- `OrderDetailPage.tsx` — 展示订单详情 + 支付状态 + 发货内容

### 7.4 库存释放机制

关键逻辑：
- 订单创建时，从 Redis 原子弹出卡密 ID，同时 DB 标记 locked
- 定时任务（或接口触发）：扫描 DB 中超过 N 分钟未支付的 locked 卡密
- 释放时：DB 更新 status=available，Redis SADD 把 ID 加回可用池
- 提供手动接口：`POST /api/admin/system/release-locked-cards`

### 7.5 防超卖设计

使用 Redis Set 的原子操作 SPOP 配合数据库事务：

```
下单流程：
1. 读取 Redis SCARD card:pool:{productId}，快速判断是否有足够库存
2. Redis SPOP card:pool:{productId} N   ← 原子弹出 N 个卡密 ID
3. 如果实际弹出数量 < 请求数量：
   → 把弹出的 ID 通过 SADD 放回 Redis 池
   → 返回库存不足
4. 数据库事务：
   UPDATE card SET status=locked, order_id=?, locked_at=NOW()
   WHERE id IN (弹出的ID列表)
5. 如果 DB 更新失败 → 把 ID 放回 Redis 池 + 回滚事务
6. 创建订单记录
```

关键点：
- **Redis SPOP 是原子操作**，天然防并发，不存在数据库 UPDATE...LIMIT 的限制
- 数据库只负责持久化，Redis 负责高速原子计数
- Redis 重启后，从 DB 重新加载 available 状态的卡密 ID 到 Set
- 定时同步：每 N 分钟对比 Redis 与 DB 的库存数量，偏差过大时告警

---

## 八、S5 — 后台运营功能

### 8.1 仪表板

#### 后端接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/dashboard/overview` | 今日销售额/订单数/待支付/库存预警 |
| GET | `/api/admin/dashboard/recent-orders` | 最近 10 条订单 |

#### 前端页面
- `DashboardPage.tsx` — 统计卡片 + 最近订单列表

### 8.2 订单管理

#### 后端接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/orders` | 订单列表（分页 + 多条件筛选） |
| GET | `/api/admin/orders/:id` | 订单详情（含支付、发货记录） |
| POST | `/api/admin/orders/:id/mark-paid` | 手动标记支付成功 |
| POST | `/api/admin/orders/:id/redeliver` | 重新发货（用原 delivery 内容） |
| POST | `/api/admin/orders/:id/manual-deliver` | 手动发货（人工发货类型） |
| POST | `/api/admin/orders/:id/close` | 关闭未支付订单（释放库存） |
| PATCH | `/api/admin/orders/:id/note` | 更新备注 |
| GET | `/api/admin/orders/:id/logs` | 订单操作日志 |

#### 前端页面
- `OrdersPage.tsx` — 订单表格（搜索 + 状态筛选 + 分页 + 操作按钮）
- `OrderDetailPage.tsx` — 订单详情（基本信息 + 支付信息 + 发货信息 + 日志）

### 8.3 支付管理

#### 后端接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/payments` | 支付记录列表 |
| GET | `/api/admin/payments/:id` | 支付详情 |
| GET | `/api/admin/payment-callbacks` | 回调日志列表 |
| GET | `/api/admin/payment-callbacks/:id` | 回调日志详情 |
| GET | `/api/admin/payment-channels` | 支付渠道配置列表 |
| PATCH | `/api/admin/payment-channels/:code` | 更新支付渠道配置 |
| POST | `/api/admin/payment-channels/:code/enable` | 启用 |
| POST | `/api/admin/payment-channels/:code/disable` | 禁用 |

#### 前端页面
- `PaymentsPage.tsx` — 支付记录列表
- `PaymentChannelsPage.tsx` — 支付渠道配置（密钥脱敏展示）

### 8.4 发货管理

#### 后端接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/deliveries` | 发货记录列表 |
| GET | `/api/admin/deliveries/:id` | 发货详情 |
| POST | `/api/admin/deliveries/:id/retry` | 重试失败发货 |

#### 前端页面
- `DeliveriesPage.tsx` — 发货记录列表（状态筛选 + 失败重试）

### 8.5 系统设置

#### 后端接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/settings` | 获取所有设置 |
| PATCH | `/api/admin/settings/site` | 站点设置（名称、Logo、公告、联系方式） |
| PATCH | `/api/admin/settings/order` | 订单设置（超时时间、是否显示库存） |
| PATCH | `/api/admin/settings/security` | 安全设置（验证码开关、登录限制） |

#### 前端页面
- `SettingsPage.tsx` — 多 tab 设置表单

### 8.6 操作日志

#### 后端接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/logs/operation` | 操作日志列表 |
| GET | `/api/admin/logs/login` | 登录日志列表 |

#### 前端页面
- `LogsPage.tsx` — 日志列表（筛选 + 分页）

---

## 九、接口清单汇总

| 模块 | 接口数 | S 阶段 |
|------|--------|--------|
| 健康检查 | 1 | S1 |
| 管理员认证 | 4 | S2 |
| 分类管理 | 8 | S2 |
| 商品管理 | 9 | S2 |
| 卡密管理 | 13 | S2 |
| 公开配置 | 5 | S3 |
| 下单 | 2 | S3 |
| 支付创建 | 2 | S3 |
| 支付回调 | 2 | S4 |
| 订单查询 | 3 | S4 |
| 仪表板 | 2 | S5 |
| 订单管理 | 8 | S5 |
| 支付管理 | 6 | S5 |
| 发货管理 | 3 | S5 |
| 系统设置 | 4 | S5 |
| 操作日志 | 2 | S5 |
| **合计** | **~74 个** | |

---

## 十、关键设计决策

### 10.1 订单编号
格式：`SOLO + yyyyMMdd + HHmmss + 6位随机数`
示例：`SOLO20260706143055123456`

### 10.2 卡密存储
- 卡密 content 字段**不加密存储**（Prisma 层面），但后台默认脱敏显示
- 查看完整卡密需要点击「查看」并记录操作日志
- 后续可升级为 AES 加密

### 10.3 支付金额
- 数据库使用 DECIMAL(10,2)
- 前端展示保留两位小数
- 与支付渠道交互使用分/分为单位（如 Stripe 用 cent）

### 10.4 幂等设计
- **支付回调**：Redis 分布式锁（key 过期时间 30 秒）+ 订单状态二次校验
- **订单发货**：订单发货状态校验 + 重复调用直接返回已发货内容
- **订单号**：唯一索引

### 10.5 并发库存控制

使用 Redis Set + SPOP 实现原子库存锁定，辅以数据库持久化：

```text
卡密导入时：
  DB: INSERT card (product_id, content, status='available')
  Redis: SADD card:pool:{productId} {cardId}

创建订单时（核心流程）：
  1. SCARD card:pool:{productId}          → 快速检查可用数量
  2. SPOP card:pool:{productId} N         → 原子弹出 N 个 ID
  3. 实际弹出 < N → SADD 放回 → 返回库存不足
  4. DB: UPDATE status='locked' WHERE id IN (...)
  5. DB: 创建订单
  6. DB 写入失败 → SADD 放回 Redis

支付成功时：
  DB: UPDATE card SET status='sold', order_id=? WHERE id IN (...)

库存释放（超时/手动关闭）：
  DB: UPDATE card SET status='available', order_id=NULL WHERE id IN (...)
  Redis: SADD card:pool:{productId} {cardId}

Redis 重启恢复：
  启动时从 DB 查询所有 status='available' 的卡密 ID 重新填充 Redis Set
```

**Redis 数据结构清单：**

| Key 模式 | 类型 | 说明 |
|----------|------|------|
| `card:pool:{productId}` | Set | 可用卡密 ID 集合，SPOP/SADD 操作 |
| `card:lock:{cardId}` | String | TTL 10min，锁定卡密 → 订单号，防并发双重校验 |
| `product:stock:{productId}` | String | 缓存库存数量（冗余加速），SCARD 后写入 |

### 10.6 错误码体系
| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| UNAUTHORIZED | 401 | 未登录或 token 过期 |
| FORBIDDEN | 403 | 无权限 |
| VALIDATION_ERROR | 400 | 参数校验失败 |
| PRODUCT_NOT_FOUND | 404 | 商品不存在 |
| PRODUCT_OFFLINE | 400 | 商品未上架 |
| PRODUCT_SOLD_OUT | 400 | 商品已售罄 |
| INSUFFICIENT_STOCK | 400 | 库存不足 |
| ORDER_NOT_FOUND | 404 | 订单不存在 |
| ORDER_EXPIRED | 400 | 订单已过期 |
| ORDER_ALREADY_PAID | 400 | 订单已支付 |
| RATE_LIMITED | 429 | 请求过于频繁 |
| SYSTEM_ERROR | 500 | 系统异常 |

---

## 十一、验证清单

每个阶段完成后验证以下内容：

### S1 验证
- [ ] Docker Compose 启动后所有服务正常运行
- [ ] `GET /api/system/health` 返回正常
- [ ] Prisma migrate 成功创建所有表
- [ ] seed 脚本成功创建默认管理员

### S2 验证
- [ ] 管理员能登录后台
- [ ] 能创建/编辑/删除分类
- [ ] 能创建/编辑/删除/上架/下架商品
- [ ] 能批量导入卡密
- [ ] 能查看卡密库存统计

### S3 验证
- [ ] 前台能看到商品列表和详情
- [ ] 游客能选择数量并下单
- [ ] 能选择支付方式
- [ ] 支付二维码/链接能正常展示

### S4 验证
- [ ] 支付回调能正确验签
- [ ] 支付成功后卡密自动发出
- [ ] 买家能在支付成功页看到卡密内容
- [ ] 通过订单号+邮箱能查到订单和发货内容
- [ ] 重复回调不会重复发货
- [ ] 超时未支付的订单自动释放库存
- [ ] 模拟并发下单不会超卖

### S5 验证
- [ ] 仪表板统计数据正确
- [ ] 能手动补单（标记支付成功 + 触发发货）
- [ ] 能重新发货
- [ ] 能手动关闭订单
- [ ] 能配置支付渠道
- [ ] 能修改站点设置
- [ ] 操作日志有记录

---

## 十二、技术依赖

### 后端 npm 包
```
fastify, @fastify/cors, @fastify/cookie, @fastify/rate-limit, @fastify/multipart
@prisma/client, prisma (dev)
jose (JWT)
bcryptjs
zod (参数校验)
pino (日志)
ioredis (Redis)
stripe (Stripe SDK)
dayjs
nanoid
```

### 前端 npm 包
```
react, react-dom, react-router-dom
@tanstack/react-query
axios
tailwindcss, @tailwindcss/vite
zod, @hookform/resolvers (表单校验)
react-hook-form (表单)
echarts, echarts-for-react (图表)
react-hot-toast (轻量提示)
dayjs
```

### 环境变量
```
DATABASE_URL=postgresql://soloshop:soloshop@localhost:5432/soloshop
REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=soloshop
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
YIPAY_API_URL=https://your.yipay.com
YIPAY_APP_ID=xxx
YIPAY_APP_KEY=xxx
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
SITE_URL=http://localhost:3000
```
