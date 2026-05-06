# KnowNest 日常运维命令

本文记录 Mac mini Docker 自托管阶段的常用命令。默认在项目目录执行：

```bash
cd ~/Desktop/code/KnowNest
```

## 启动和更新

首次启动或代码更新后重建：

```bash
docker compose --env-file .env.production up -d --build
```

如遇旧 service 产生 orphan 容器，首次切换时清理：

```bash
docker compose --env-file .env.production up -d --build --remove-orphans
```

只重启当前容器：

```bash
docker compose --env-file .env.production restart app
```

停止服务：

```bash
docker compose --env-file .env.production down
```

## 状态和日志

查看 compose 服务状态：

```bash
docker compose --env-file .env.production ps
```

查看容器端口和运行状态：

```bash
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
```

实时查看应用日志：

```bash
docker compose --env-file .env.production logs -f app
```

查看最近 200 行日志：

```bash
docker compose --env-file .env.production logs --tail=200 app
```

查看健康检查状态：

```bash
docker inspect --format='{{json .State.Health}}' knownest-app
```

## 本机 smoke 验证

登录页应返回 `200`：

```bash
curl -I http://127.0.0.1:3000/login
```

未登录访问应用应跳转登录页：

```bash
curl -I http://127.0.0.1:3000/app
```

公网域名验证：

```bash
curl -I https://你的域名/login
curl -I https://你的域名/app
```

## 配置检查

确认 `.env.production` 不会被提交：

```bash
git check-ignore .env.production
git status --short .env.production
```

检查 compose 配置是否可解析：

```bash
docker compose --env-file .env.production config --quiet
```

仅检查 compose 结构，不解析本地 env 文件：

```bash
docker compose config --no-env-resolution --quiet
```

## 代码更新流程

拉取或切换到目标代码后：

```bash
git status --short
git pull origin main
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
curl -I http://127.0.0.1:3000/login
```

如本机有未提交改动，先不要 `git pull`，避免覆盖当前工作。

## 回滚

记录当前提交：

```bash
git rev-parse --short HEAD
```

回滚到上一稳定提交后重建：

```bash
git checkout <stable-commit>
docker compose --env-file .env.production up -d --build
curl -I http://127.0.0.1:3000/login
```

回到主分支最新版本：

```bash
git checkout main
git pull origin main
docker compose --env-file .env.production up -d --build
```

## 清理

查看 Docker 磁盘占用：

```bash
docker system df
```

清理未使用的镜像和构建缓存：

```bash
docker system prune
```

清理未使用的 build cache：

```bash
docker builder prune
```

注意：不要随手执行带 `--volumes` 的清理命令，除非已经确认不会删除需要保留的数据卷。

## 数据库提醒

- 当前阶段仍使用 Supabase Cloud。
- 不要在日常应用更新时执行 database migration。
- Supabase Cloud 迁移到 self-hosted Supabase 前，需要单独准备备份、恢复演练、Auth 配置、RLS 和 migration 验证。
