# KnowNest Vercel 部署记录

## 当前生产环境

- Vercel Team / Scope：`haohaos-projects-a0810bdc`
- Vercel Project：`knownest`
- 生产域名：`https://knownest.vercel.app`
- 当前部署：`https://knownest-h8zvziim8-haohaos-projects-a0810bdc.vercel.app`
- Vercel Inspector：`https://vercel.com/haohaos-projects-a0810bdc/knownest/wmaAF666J7fppcyma5CrigQLxAPF`

## 部署前提

- 本地已安装依赖并能通过构建。
- Vercel CLI 可通过 `npx.cmd vercel` 使用。
- CLI 已登录目标 Vercel 账号。
- 项目已关联到 Vercel：

```bash
npx.cmd vercel link --yes --project knownest
```

## 生产环境变量

Vercel Production 需要配置以下环境变量：

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
DATABASE_URL
AI_PROVIDER
DEEPSEEK_API_KEY
DEEPSEEK_BASE_URL
AI_MODEL_FAST
AI_MODEL_DEFAULT
AI_MODEL_QUALITY
AI_DAILY_LIMIT
AI_MAX_INPUT_CHARS
AI_MIN_INPUT_CHARS
```

如需启用设置页的服务端模型 allowlist，可继续配置：

```text
AI_DEFAULT_MODEL_ID
AI_MODEL_OPTIONS
```

如 `AI_MODEL_OPTIONS` 中启用 Xiaomi MiMo Token Plan，还需要配置：

```text
XIAOMI_MIMO_TOKEN_PLAN_API_KEY
XIAOMI_MIMO_TOKEN_PLAN_BASE_URL
```

注意：

- 不要把真实变量值写入仓库或文档。
- `NEXT_PUBLIC_*` 变量会暴露给浏览器端，这是 Supabase URL 和 anon key 的预期用法。
- `DATABASE_URL` 只应作为服务端环境变量配置，不要添加 `NEXT_PUBLIC_` 前缀。
- AI Provider API Key 只应作为服务端环境变量配置，不要配置 `NEXT_PUBLIC_DEEPSEEK_API_KEY`，也不要用任何 `NEXT_PUBLIC_*` 变量承载模型密钥。
- `AI_MODEL_OPTIONS` 必须保持为单行 JSON；其中可公开给前端的只有 `id`、`label`、`provider`、`model`，密钥只能通过 `apiKeyEnv` 指向服务端环境变量。

如需从本地 `.env.local` 同步到 Vercel Production，应先确认 `.env.local` 指向目标生产 / 可上线环境，再执行上传。上传时不要在命令参数中直接写明密钥值，优先通过 stdin 传入。

## 部署命令

部署到 Production：

```bash
npx.cmd vercel --prod --yes
```

部署成功后，Vercel 会输出：

- Deployment URL
- Production URL
- Inspector URL
- `readyState: READY`

## V0.3 部署记录

### 2026-04-30

- 部署命令：`npx.cmd vercel --prod --yes --scope haohaos-projects-a0810bdc`。
- Deployment URL：`https://knownest-h8zvziim8-haohaos-projects-a0810bdc.vercel.app`。
- Production URL：`https://knownest.vercel.app`。
- Vercel Inspector：`https://vercel.com/haohaos-projects-a0810bdc/knownest/wmaAF666J7fppcyma5CrigQLxAPF`。
- Vercel deployment id：`dpl_wmaAF666J7fppcyma5CrigQLxAPF`。
- 部署状态：`READY`。
- 部署前验证通过：`npm.cmd run lint`、`npm.cmd run test:ai`、`npm.cmd run test:knowledge-items`、`npm.cmd run test:tags`、`npm.cmd run test:categories`、`npm.cmd run test:knowledge-item-draft`、`npm.cmd run test:knowledge-list-item`、`npm.cmd run test:security`、`npm.cmd run build`、`git diff --check`。
- Production 环境变量名检查通过：必需 AI 变量、模型 allowlist 变量和 Xiaomi MiMo Token Plan 变量均已配置；未发现 `NEXT_PUBLIC_DEEPSEEK_API_KEY` 或其他 `NEXT_PUBLIC_*` AI 密钥名。
- 已新增 `.vercelignore`，用于避免本地 `.env*`、依赖目录和构建产物进入 Vercel CLI 上传包。
- Vercel 构建日志仍提示检测到 `.env` 文件；当前真实值应只保留在 Vercel Environment Variables，不写入仓库或文档。
- 用户已确认线上真实使用正常；本记录不包含真实账号、真实密钥或数据库内容。

## 部署后验证

最小验证清单：

- 访问 `https://knownest.vercel.app/`，未登录时应进入登录页。
- 访问 `https://knownest.vercel.app/login`，应返回登录页。
- 未登录访问 `https://knownest.vercel.app/app`，应进入登录页。
- 使用真实账号登录后，应进入 `/app`。
- 登录后检查知识列表、新建、编辑、删除、收藏、归档、标签和筛选。
- 在移动端浏览器访问并检查无明显布局错乱。

本次部署已确认：

- Vercel Production 部署成功，状态 `READY`。
- `https://knownest.vercel.app/` 返回 307，`Location: /login`。
- `https://knownest.vercel.app/login` 返回 200，页面包含登录内容。
- 未登录访问 `https://knownest.vercel.app/app` 返回 307，`Location: /login`，路由保护生效。
- Agent 未直接登录真实账号读取用户数据；用户已确认线上真实使用正常。后续如需自动化回归，应使用专门测试账号和测试数据。

## 常见问题

### 根路径显示旧占位页

原因：`/` 路由仍渲染初始化阶段的 `src/app/page.tsx`，且 `src/proxy.ts` 未匹配根路径。

当前修复方式：

- `src/lib/auth/route-protection.ts`：`/` 根据登录态跳转，未登录到 `/login`，已登录到 `/app`。
- `src/proxy.ts`：matcher 包含 `/`。
- `src/lib/auth/route-protection.test.mjs`：覆盖根路径重定向回归测试。

### Vercel 提示检测到 `.env` 文件

Vercel 构建日志可能提示检测到 env 文件，并建议使用 Vercel 环境变量管理。当前项目真实值应保留在本地 `.env.local` 和 Vercel Environment Variables，不提交真实值。

## 回滚

如需回滚，优先在 Vercel Dashboard 中选择上一条成功 Production Deployment 并 Promote / Rollback。回滚后重新执行最小验证清单。
