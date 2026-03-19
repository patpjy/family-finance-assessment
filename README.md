# AI 家庭财务盘点

基于 Next.js 的家庭资产盘点与评估 H5 应用。用户填写 3 步问卷，AI 实时流式生成深度分析报告，包含财务健康诊断、资产配置建议等可视化图表。

## 功能特性

- 3 步问卷采集家庭财务数据（资产、负债、现金流、家庭结构、目标偏好）
- 5 个 AI 模型可选：DeepSeek V3.2、Kimi K2.5、MiniMax M2.5、Qwen 3.5、GPT-5.4
- 实时流式输出：推理过程 + 分析结果同步展示
- 可视化报告：指标卡片、健康诊断、资产负债表、现金流图、配置建议图、行动建议卡
- 响应式设计，支持桌面和移动端

## 技术栈

- Next.js 16 + React 19 + TypeScript 5.9
- Zod 数据校验
- 硅基流动 SiliconFlow API（DeepSeek / Kimi / MiniMax / Qwen）
- Packy 中转站（GPT-5.4）
- SSE 流式传输

## 项目结构

```text
├── app/
│   ├── globals.css          # 全局样式
│   ├── layout.tsx            # 页面布局
│   ├── page.tsx              # 入口页面
│   └── api/assessment/
│       └── route.ts          # AI 流式 API（多模型路由）
├── components/
│   └── assessment-experience.tsx  # 主交互组件（问卷 + 报告）
├── lib/assessment/
│   ├── content.ts            # 问卷配置与标签映射
│   ├── demo.ts               # 示例数据
│   └── schema.ts             # Zod 校验 schema
├── .env.example              # 环境变量模板
└── next.config.ts            # Next.js 配置
```

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/patpjy/family-finance-assessment.git
cd family-finance-assessment
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入真实 API Key：

```bash
# GPT-5.4 (Packy 中转站)
OPENAI_API_KEY=你的key
OPENAI_BASE_URL=https://www.packyapi.com/v1
OPENAI_MODEL=gpt-5.4
OPENAI_REASONING_EFFORT=medium

# 硅基流动 SiliconFlow
SF_DEEPSEEK_API_KEY=你的key
SF_KIMI_API_KEY=你的key
SF_MINIMAX_API_KEY=你的key
SF_QWEN_API_KEY=你的key
```

### 4. 启动开发

```bash
npm run dev
```

访问 `http://localhost:3000`

### 5. 生产构建

```bash
npm run build
npm run start
```

## AI 模型说明

| 模型 | 提供商 | API 平台 | 特点 |
|------|--------|----------|------|
| DeepSeek V3.2 | DeepSeek | 硅基流动 | 默认推荐，性价比高 |
| Kimi K2.5 | Moonshot | 硅基流动 | 推理模型，1T 参数 |
| MiniMax M2.5 | MiniMax | 硅基流动 | 推理模型，229B 参数 |
| Qwen 3.5 | 通义千问 | 硅基流动 | 推理模型，122B MoE |
| GPT-5.4 | OpenAI | Packy 中转站 | 最强但最贵 |

硅基流动的 4 个模型均使用 OpenAI Chat Completions 兼容 API，GPT-5.4 使用 OpenAI Responses API。

## 服务器部署

```bash
# 服务器上拉取
cd /root/apps
git clone https://github.com/patpjy/family-finance-assessment.git
cd family-finance-assessment

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入真实 key

# 安装、构建、启动
npm install
npm run build
npm run start
```

建议使用 pm2 管理进程，防止终端关闭后服务中断。

## 更新流程

本地改完代码后：

```bash
git add .
git commit -m "更新说明"
git push
```

服务器同步：

```bash
cd /root/apps/family-finance-assessment
git pull
npm install
npm run build
# 重启服务
```
