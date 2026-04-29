# KnowNest Vercel 部署记录

## 当前生产环境

- Vercel Team / Scope：`haohaos-projects-a0810bdc`
- Vercel Project：`knownest`
- 生产域名：`https://knownest.vercel.app`
- 当前部署：`https://knownest-f90rj7707-haohaos-projects-a0810bdc.vercel.app`
- Vercel Inspector：`https://vercel.com/haohaos-projects-a0810bdc/knownest/8LrEwB2iJpfVqpuStW5EkpsED1MF`

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
```

注意：

- 不要把真实变量值写入仓库或文档。
- `NEXT_PUBLIC_*` 变量会暴露给浏览器端，这是 Supabase URL 和 anon key 的预期用法。
- `DATABASE_URL` 只应作为服务端环境变量配置，不要添加 `NEXT_PUBLIC_` 前缀。

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
- `https://knownest.vercel.app/` 已返回登录页内容，不再显示旧占位首页。
- 未登录访问 `/app` 进入登录页，路由保护生效。

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
