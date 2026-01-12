# 🚀 Vercel 部署指南 - Ocean Sumria Rewards

本文档详细介绍如何将 Ocean Sumria Rewards 项目部署到 Vercel。

---

## 📋 部署前准备

### 1. 确保 Supabase 项目已配置

在部署前，请确保你的 Supabase 项目已完成以下配置：

- ✅ 数据库表和函数已创建（运行 `sql/FULL_REBUILD.sql`）
- ✅ RLS (Row Level Security) 策略已启用
- ✅ 必要的扩展已启用（如 `pgcrypto`）

### 2. 收集环境变量

你需要准备以下环境变量（从 Supabase 项目设置 > API 获取）：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名公钥 | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥（仅服务端使用） | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |

> ⚠️ **安全提示**：`SUPABASE_SERVICE_ROLE_KEY` 具有完整的数据库访问权限，请勿在客户端代码中使用！

### 3. 确保代码已推送到 Git 仓库

Vercel 需要从 Git 仓库（GitHub、GitLab 或 Bitbucket）拉取代码：

```bash
# 如果还没有初始化 Git
git init
git add .
git commit -m "Initial commit"

# 添加远程仓库并推送
git remote add origin https://github.com/你的用户名/ocean-sumria-rewards.git
git branch -M main
git push -u origin main
```

---

## 🖥️ 方式一：通过 Vercel 网页控制台部署（推荐）

### 步骤 1：登录 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub、GitLab 或 Bitbucket 账号登录

### 步骤 2：导入项目

1. 点击 **"Add New..."** → **"Project"**
2. 选择 **"Import Git Repository"**
3. 找到并选择 `ocean-sumria-rewards` 仓库
4. 点击 **"Import"**

### 步骤 3：配置项目

Vercel 会自动检测到这是一个 Next.js 项目，通常配置会自动填充：

| 设置项 | 值 |
|--------|-----|
| Framework Preset | Next.js |
| Root Directory | `./` （项目根目录） |
| Build Command | `next build` 或 `npm run build` |
| Output Directory | `.next`（自动） |
| Install Command | `npm install` |

### 步骤 4：配置环境变量 ⚠️ 重要！

1. 展开 **"Environment Variables"** 部分
2. 添加以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL = https://你的项目ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = 你的匿名公钥
SUPABASE_SERVICE_ROLE_KEY = 你的服务角色密钥
```

> 💡 **提示**：确保环境变量适用于所有环境（Production、Preview、Development）

### 步骤 5：部署

点击 **"Deploy"** 按钮，等待部署完成（通常需要 1-3 分钟）。

部署成功后，你将获得一个类似 `https://ocean-sumria-rewards.vercel.app` 的 URL。

---

## 💻 方式二：通过 Vercel CLI 部署

### 步骤 1：安装 Vercel CLI

```bash
npm install -g vercel
```

### 步骤 2：登录 Vercel

```bash
vercel login
```

按提示选择登录方式（推荐使用 GitHub）。

### 步骤 3：初次部署

在项目根目录运行：

```bash
vercel
```

按提示进行配置：

```
? Set up and deploy "ocean-sumria-rewards"? [Y/n] Y
? Which scope do you want to deploy to? <你的用户名>
? Link to existing project? [y/N] N
? What's your project's name? ocean-sumria-rewards
? In which directory is your code located? ./
```

### 步骤 4：配置环境变量

```bash
# 添加公开的环境变量
vercel env add NEXT_PUBLIC_SUPABASE_URL

# 添加敏感的环境变量
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

按提示输入变量值，并选择应用到哪些环境（建议全部选择）。

### 步骤 5：生产环境部署

```bash
vercel --prod
```

---

## ⚙️ 配置自定义域名（可选）

### 步骤 1：添加域名

1. 在 Vercel 控制台进入项目
2. 点击 **"Settings"** → **"Domains"**
3. 输入你的域名（如 `rewards.example.com`）
4. 点击 **"Add"**

### 步骤 2：配置 DNS

根据提示在你的 DNS 服务商处添加记录：

**方式 A - 使用 CNAME（推荐用于子域名）**：
```
Type: CNAME
Name: rewards
Value: cname.vercel-dns.com.
```

**方式 B - 使用 A 记录（用于根域名）**：
```
Type: A
Name: @
Value: 76.76.21.21
```

### 步骤 3：更新 Supabase 配置

在 Supabase 控制台中，更新认证配置以允许新域名：

1. 进入 **Authentication** → **URL Configuration**
2. 添加新域名到 **Site URL** 和 **Redirect URLs**

---

## 🔄 自动部署

Vercel 默认配置了自动部署：

| 分支 | 部署类型 | URL |
|------|----------|-----|
| `main` / `master` | Production | `your-project.vercel.app` |
| 其他分支 | Preview | `your-project-git-branch.vercel.app` |
| Pull Request | Preview | 自动生成预览链接 |

---

## 🔧 常见问题排查

### 问题 1：构建失败

**症状**：Vercel 显示 "Build Failed"

**解决方案**：

1. 检查本地构建是否成功：
   ```bash
   npm run build
   ```

2. 检查环境变量是否正确配置

3. 查看 Vercel 构建日志获取详细错误信息

### 问题 2：环境变量未生效

**症状**：应用无法连接 Supabase

**解决方案**：

1. 确保变量名完全正确（区分大小写）
2. 重新部署应用：
   ```bash
   vercel --prod
   ```

### 问题 3：Supabase 连接失败

**症状**：API 请求返回 401 或 403 错误

**解决方案**：

1. 检查 Supabase 项目是否启用了 CORS
2. 在 Supabase 控制台 → Authentication → URL Configuration 中添加 Vercel 域名
3. 确保 RLS 策略正确配置

### 问题 4：页面 404 错误

**症状**：除首页外其他页面返回 404

**解决方案**：

通常是 Next.js 路由配置问题，检查 `app/` 目录结构是否正确。

---

## 📊 监控与分析

### Vercel Analytics（可选）

1. 在项目设置中启用 **Analytics**
2. 安装 Analytics 包：
   ```bash
   npm install @vercel/analytics
   ```

3. 在 `app/layout.tsx` 中添加：
   ```tsx
   import { Analytics } from '@vercel/analytics/react';
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <Analytics />
         </body>
       </html>
     );
   }
   ```

---

## 📝 部署清单

在部署前，请确认以下事项：

- [ ] Git 仓库已创建并推送代码
- [ ] Supabase 数据库已初始化
- [ ] 已收集所有必需的环境变量
- [ ] Vercel 项目已创建
- [ ] 环境变量已在 Vercel 中配置
- [ ] 首次部署成功
- [ ] 基本功能测试通过（登录、积分、转盘等）
- [ ] 自定义域名已配置（如需要）
- [ ] Supabase URL Configuration 已更新

---

## 🎉 完成！

恭喜！你的 Ocean Sumria Rewards 应用现已部署到 Vercel。

**相关链接**：
- [Vercel 文档](https://vercel.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Supabase 文档](https://supabase.com/docs)

如有问题，请查看 Vercel 构建日志或在项目仓库中提交 Issue。
