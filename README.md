# AI 家庭财务盘点

这是一个基于 Next.js 的家庭资产盘点与评估 H5。

核心能力：

- 3 步问卷采集家庭资产、负债、现金流和风险偏好
- 服务端按固定规则计算核心指标
- 调用 `gpt-5.4` 生成个性化分析与建议
- 输出适合手机端展示的可视化报告

这套服务本身是标准 Web 应用；如果和 `ecom-image` 一起上线，建议把两者视为两套独立服务。

## 1. 当前项目结构

```text
家庭资产评估版本2/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── assessment-experience.tsx
├── lib/
│   └── assessment/
│       ├── ai.ts
│       ├── content.ts
│       ├── demo.ts
│       ├── engine.ts
│       ├── format.ts
│       ├── metrics.ts
│       ├── report.ts
│       ├── schema.ts
│       ├── stream.ts
│       └── types.ts
├── .env.example
├── .env.local
├── next.config.ts
├── package.json
└── README.md
```

## 2. 本地启动

```bash
npm install
cp .env.example .env.local
npm run dev
```

打开 `http://localhost:3000`

## 3. 环境变量

在 `.env.local` 中配置：

```bash
OPENAI_API_KEY=你的API Key
OPENAI_BASE_URL=https://www.packyapi.com/v1
OPENAI_MODEL=gpt-5.4
OPENAI_REASONING_EFFORT=medium
```

说明：

- `OPENAI_BASE_URL` 支持 OpenAI 兼容接口
- 默认模型为 `gpt-5.4`
- 如果未配置 API Key，建议在上线前补齐，不要把生产环境建立在兜底逻辑上

## 4. 工作流程

1. 用户填写 3 步问卷
2. 前端提交家庭资产与现金流信息
3. 服务端做规则计算
4. 调用 `gpt-5.4` 生成个性化分析
5. 返回结构化报告并在页面展示

## 5. 生产部署

这是标准 Next.js 服务，生产环境可部署到：

- Vercel
- 腾讯云 CloudBase
- 阿里云 ECS
- 任何支持 Node.js 的容器平台

常规启动方式：

```bash
npm install
npm run build
npm run start
```

如果要放到正式服务器，建议：

1. 使用 Node.js 20+
2. 用 Nginx 或云平台网关反代到应用端口
3. 把 `.env.local` 或等价环境变量放到服务端，不要写死到仓库
4. 配置进程守护，比如 `pm2`、systemd 或容器编排

## 6. 和 `ecom-image` 联合部署时的定位

这套家庭财务盘点服务和 `ecom-image` 的性质不同：

- 家庭财务盘点：标准 Web/H5 服务
- `ecom-image`：OpenClaw 网关 + 飞书通道 + 图片任务处理 + 外部模型调用

所以它们可以放在同一台机器上，但不应该混成同一个进程，也不应该共用一套业务目录。

推荐最小拆分方式：

- 一个 Web 服务进程：家庭财务盘点 H5
- 一个 OpenClaw gateway 进程：承载 `ecom-image`

如果以后再把另外四个 Agent 也放上来，建议继续保持：

- 每个 Agent 维持自己的 `workspace/`
- 各 Agent 的独立配置保持隔离
- 共享的只有网关运行时和系统资源

## 7. 这次 `ecom-image` 修复的内容，以及对其他 Agent 的影响

这次修的是 OpenClaw 网关的消息解析层，不是家庭财务盘点项目本身。

### 7.1 问题根因

飞书图片消息正文前面会带 `![image]`。

OpenClaw 旧逻辑里把以 `!` 开头的聊天内容也当作 bash 快捷入口，所以飞书图文消息被误判成 bash，返回：

- `bash is disabled. Set commands.bash=true to enable.`

### 7.2 实际修复点

这次修复做了两件事：

1. 清洗飞书消息时，不再把 `![image]` 清成残留的 `!`
2. 关闭旧的 `!` bash 聊天快捷入口，只保留 `/bash ...`

### 7.3 没有改动的内容

这次没有去改另外四个 Agent 的：

- `workspace/`
- `agent/models.json`
- `agent/auth-profiles.json`
- 提示词文件
- 记忆文件
- README 文档

也没有改家庭财务盘点服务的业务逻辑、页面逻辑、报告逻辑。

### 7.4 真正被影响的范围

这次改动属于“网关运行时级别”的修复，所以要这样理解影响边界：

- `ecom-image`：直接受益，飞书图文消息恢复正常
- 其他四个 Agent：业务逻辑没改，但如果共用同一个 OpenClaw 网关进程，那么它们也会一起失去旧的 `!` bash 快捷入口
- 家庭财务盘点服务：完全不受这次修复影响

换句话说：

- 没有改其他四个 Agent 的内容
- 但如果它们挂在同一个网关实例上，命令解析行为会统一变成“只认 `/bash`，不再认 `!`”

### 7.5 整体影响总结

这不是一次多 Agent 行为重构，只是一次网关入口解析修复。

整体目的只有一个：

- 防止飞书图片消息被错误识别成 bash 命令

正式上线前，要把这次修复固化到你自己可维护的 OpenClaw 版本里；否则重建容器、重拉镜像或升级版本后，这个修复可能丢失。

## 8. 单机部署时的容量边界

如果你只租一台机器，同时想跑：

1. `ecom-image`
2. 家庭财务盘点 H5
3. 后续另外四个 Agent

那么容量判断要分三档看：

### 8.1 只跑两套服务

如果只跑：

- 一个 `ecom-image`
- 一个家庭财务盘点 H5

并且访问量很小、飞书消息不密集，那么低配机器可以跑起来。

### 8.2 再加另外四个 Agent，但它们大多空闲

如果另外四个 Agent 只是挂着、偶尔触发、并且各自依赖的本地后端也不重，那么单机仍然能跑，但资源会开始紧张。

紧张点主要在：

- OpenClaw gateway 常驻内存
- 各 Agent 会话和上下文
- 图片下载、日志、缓存
- Web 服务的峰值响应

### 8.3 六个 Agent + H5 都长期在线并频繁工作

这种情况下，低配单机就不适合了。

尤其当另外四个 Agent 还依赖各自本地 bridge、爬取服务、API 转发或后台进程时，内存和 CPU 都会明显吃紧。

## 9. 当前服务选型建议

如果你只能租一台阿里云机器，并且后面目标是：

- 跑 `ecom-image`
- 跑家庭财务盘点 H5
- 逐步把另外四个 Agent 也迁上去

我的建议是：

- 不要选 `2核2G` 作为长期方案

更准确地说：

- `2核2G`：适合非常早期验证，不适合你后面的完整目标
- `2核4G`：勉强可作为早期单机方案
- `4核8G`：更像真正可长期维护的起步配置

这里要注意，这不是阿里云官方给出的“承载上限”，而是基于你当前服务形态做的工程判断。

根据阿里云官方产品定位：

- 轻量应用服务器更偏轻应用和网站快速搭建
- ECS 云服务器更偏自定义部署和更灵活的资源管理

参考：

- [阿里云轻量应用服务器](https://www.aliyun.com/product/swas)
- [阿里云 ECS 云服务器](https://www.aliyun.com/product/ecs)
- [阿里云：轻量应用服务器与 ECS 对比](https://help.aliyun.com/zh/simple-application-server/product-overview/comparison-between-simple-application-server-and-ecs)

如果你的目标真的是“后面六个 Agent 都要上云”，建议优先选 ECS，而不是把长期方案压在轻量 2核2G 上。

## 10. 当前实现边界

### 家庭财务盘点 H5

- 已完成问卷、规则计算、AI 分析、报告渲染
- 当前不带数据库
- 当前更适合即时生成，不适合重度历史留存与后台运营

如果下一步要做：

- 永久保存报告
- 用户登录
- 顾问后台
- 线索管理

建议继续补：

- 数据库
- 鉴权
- 后台管理端

### `ecom-image`

- 已能跑通飞书收图、主模型理解、提示词规划、DashScope 出图、结果回传
- 当前底层生图依然更适合“快速验证”，不是最终高质量生产方案
- 如果后面追求更高一致性和可控性，建议升级到底层 ComfyUI 工作流

## 11. 当前目录内已有材料

当前目录保留了原始业务材料，方便后续继续对齐：

- `主模板.docx`
- `提示词.docx`
- `评估报告（示例）.docx`
