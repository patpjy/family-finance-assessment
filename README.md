# AI 家庭财务盘点

这是一个基于 Next.js 的家庭资产盘点与评估 H5。它当前是一个不依赖数据库的单体 Web 项目，适合先快速上线验证，再逐步扩展成更完整的线上服务。

## 1. 本地项目当前架构

### 1.1 技术栈

- 前端与服务端框架：Next.js 16
- UI 运行时：React 19
- 服务端运行时：Node.js
- 数据校验：Zod
- 外部 AI 接口：OpenAI 兼容 Responses API

### 1.2 当前目录结构

```text
家庭资产评估版本2/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/
│       └── assessment/
│           └── route.ts
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
├── .gitignore
├── next.config.ts
├── package.json
├── package-lock.json
└── README.md
```

### 1.3 架构分层说明

这个项目当前可以按下面 4 层理解：

1. 页面层

- `app/page.tsx`
- `components/assessment-experience.tsx`

这一层负责展示 H5 页面、收集用户输入、触发生成请求、展示最终报告。

2. API 层

- `app/api/assessment/route.ts`

这一层负责接收前端提交的数据、读取环境变量、调用外部 AI 接口，并把流式结果返回给前端。

3. 业务逻辑层

- `lib/assessment/*.ts`

这一层负责：

- 指标计算
- 文案与标签映射
- 数据格式整理
- 报告结构生成
- 请求 schema 校验

4. 配置层

- `.env.local`
- `.env.example`
- `next.config.ts`
- `package.json`

这一层负责运行环境、模型接口地址、构建和启动方式。

### 1.4 当前运行链路

项目当前的真实运行流程是：

```text
用户打开 H5
-> 填写资产/负债/现金流问卷
-> 前端调用 /api/assessment
-> 服务端校验数据并组装 prompt
-> 服务端请求 OpenAI 兼容接口
-> AI 返回流式分析结果
-> 页面实时展示结果
```

### 1.5 当前项目边界

这个项目当前已经具备：

- 问卷采集
- 规则计算
- AI 分析生成
- H5 页面展示
- 生产构建与服务器部署能力

这个项目当前还没有：

- 用户登录
- 数据库
- 报告持久化
- 管理后台
- 多租户系统

因此，当前 GitHub 上的版本更准确地说，是一个“可部署的单体 Next.js 应用”，而不是完整的带后台运营能力的 SaaS 系统。

## 2. 上传到 GitHub 的是什么版本

当前上传到 GitHub 的是“源码仓库版本”，不是你本地电脑上的完整运行态目录。

### 2.1 GitHub 上包含什么

GitHub 上当前包含的是：

- 页面源码
- API 源码
- 业务逻辑源码
- `package.json`
- `package-lock.json`
- `README.md`
- `.env.example`
- `.gitignore`

也就是说，GitHub 上保存的是“可重新安装、可重新构建、可重新部署”的项目源码。

### 2.2 GitHub 上不包含什么

根据当前 `.gitignore` 配置，以下内容不会被上传：

```text
.next
node_modules
.env.local
.DS_Store
npm-debug.log*
```

这意味着 GitHub 上不包含：

- 真实 API key
- 你本地的私密环境变量
- 已安装依赖
- 本地构建产物
- Finder 垃圾文件

### 2.3 这意味着什么

这很重要，因为它直接决定了你从 GitHub 拉到别的机器后，不能“直接运行”，而是要先补齐运行条件。

换句话说：

- GitHub 上的是“源码版”
- 你本地电脑里的是“源码 + 本地配置 + 已安装依赖 + 构建缓存”的运行版

### 2.4 当前 GitHub 版本的定位

当前 GitHub 上的版本，适合做下面几件事：

- 在另一台电脑上重新拉取源码继续开发
- 在阿里云服务器上重新部署
- 作为版本记录和备份
- 以后通过 `git pull` 更新服务器

它不适合直接拿来做下面这些事：

- 不补环境变量就直接调用模型
- 不安装依赖就直接启动
- 把 GitHub 当作生产环境配置存储

## 3. 从 GitHub 拉到本地后，需要先做哪些处理

假设你是在一台新的本地电脑上拉取这个项目。

### 3.1 拉取源码

```bash
git clone https://github.com/patpjy/family-finance-assessment.git
cd family-finance-assessment
```

### 3.2 检查 Node.js 版本

建议使用 Node.js 20 或更高版本。

先检查：

```bash
node -v
npm -v
```

如果没有安装 Node.js，或者版本太低，先安装或升级，再继续。

### 3.3 创建本地环境变量文件

GitHub 上只有 `.env.example`，没有 `.env.local`。所以拉下来后要先自己创建：

```bash
cp .env.example .env.local
```

然后编辑 `.env.local`，填入真实配置：

```bash
OPENAI_API_KEY=你的真实 key
OPENAI_BASE_URL=https://www.packyapi.com/v1
OPENAI_MODEL=gpt-5.4
OPENAI_REASONING_EFFORT=medium
```

如果这一步不做，运行时就可能报：

- API key 未配置
- 请求 AI 接口失败

### 3.4 安装依赖

```bash
npm install
```

这一步会安装 `next`、`react`、`zod` 等项目依赖，并生成本机可用的 `node_modules`。

### 3.5 本地开发启动

```bash
npm run dev
```

然后访问：

```text
http://localhost:3000
```

### 3.6 如果要验证生产构建

```bash
npm run build
npm run start
```

这一步的意义是验证：

- 代码能否成功构建
- 生产模式是否可运行

## 4. 从 GitHub 拉到服务器后，需要先做哪些处理

假设你是在阿里云 ECS 上部署。

### 4.1 服务器先准备基础环境

至少需要：

- Git
- Node.js 20+
- npm

检查命令：

```bash
git --version
node -v
npm -v
```

### 4.2 在服务器上拉取源码

```bash
mkdir -p /root/apps
cd /root/apps
git clone https://github.com/patpjy/family-finance-assessment.git
cd family-finance-assessment
```

### 4.3 在服务器上创建 `.env.local`

这一点非常关键。服务器上也必须单独创建一份 `.env.local`，因为 GitHub 不会保存真实密钥。

```bash
cat > .env.local <<'EOF'
OPENAI_API_KEY=你的真实 key
OPENAI_BASE_URL=https://www.packyapi.com/v1
OPENAI_MODEL=gpt-5.4
OPENAI_REASONING_EFFORT=medium
EOF
```

### 4.4 在服务器上安装依赖

```bash
npm install
```

### 4.5 在服务器上做生产构建

```bash
npm run build
```

如果这一步报错，不要急着启动，要先把报错解决掉。

### 4.6 在服务器上启动服务

```bash
npm run start
```

默认会监听 `3000` 端口。

### 4.7 检查安全组

如果你想直接从浏览器访问：

```text
http://服务器公网IP:3000
```

那还要确保阿里云安全组已经放行 `3000` 端口。

如果安全组没放行，就会出现：

- 服务已经启动
- 但浏览器打不开

### 4.8 更适合长期维护的启动方式

临时测试可以直接：

```bash
npm run start
```

但正式环境建议后续补上：

- `pm2`
- `systemd`
- `Nginx` 或 `Caddy`

否则你关闭终端后，服务可能会中断。

## 5. 本地和服务器同步更新的推荐流程

后续建议按这个流程更新：

1. 在本地改代码
2. 本地自测
3. 提交 Git
4. 推送到 GitHub
5. 服务器进入项目目录
6. 执行 `git pull`
7. 如依赖有变化则执行 `npm install`
8. 重新执行 `npm run build`
9. 重启服务

常见命令如下：

本地：

```bash
git add .
git commit -m "你的更新说明"
git push
```

服务器：

```bash
cd /root/apps/family-finance-assessment
git pull
npm install
npm run build
npm run start
```

如果以后用了 `pm2` 或 `systemd`，最后一步会从手动 `npm run start` 变成“重启进程”。

## 6. 当前环境变量说明

当前项目实际使用的是以下环境变量：

```bash
OPENAI_API_KEY=
OPENAI_BASE_URL=https://www.packyapi.com/v1
OPENAI_MODEL=gpt-5.4
OPENAI_REASONING_EFFORT=medium
```

说明如下：

- `OPENAI_API_KEY`：真实鉴权 key
- `OPENAI_BASE_URL`：OpenAI 兼容接口地址
- `OPENAI_MODEL`：默认模型名
- `OPENAI_REASONING_EFFORT`：推理强度

## 7. 一句话总结

当前这个项目的正确理解方式是：

- 本地目录是“源码 + 本地配置 + 本地依赖 + 本地构建缓存”
- GitHub 上是“可重新部署的源码仓库版本”
- 无论拉到新的本地电脑还是服务器，都要先补 `.env.local`，再 `npm install`，再启动或构建

只要记住这一点，后面你自己迁机器、换服务器、做更新，就不会乱。
