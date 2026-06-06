# 部署说明

## 目标部署形态

- 开发：本机 Docker + 本地 Next.js
- 生产：阿里云 ECS + Docker Compose

## 本地启动

```bash
npm ci
npm run setup:local
docker compose up -d postgres redis
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

## 生产部署顺序

```bash
npm run security:audit
npm run check:env
npm run db:generate
npm run db:push
npm run build
bash scripts/deploy-lite.sh
VERIFY_BASE_URL=http://127.0.0.1:${WEB_PORT} npm run verify:runtime
```

## 当前独立部署约束

- 旧项目仍占用 `80 -> 127.0.0.1:3000`
- 新项目必须独立运行在：
  - `WEB_PORT=3001`
  - `POSTGRES_PORT=5434`
  - `REDIS_PORT=6380`
- 生产 `.env` 里必须设置：

```bash
COMPOSE_PROJECT_NAME=tiger_local_life_saas
APP_ENV=production
APP_URL=http://218.244.136.188:3001
WEB_PORT=3001
POSTGRES_PORT=5434
REDIS_PORT=6380
```

- 当前阶段先通过 `http://218.244.136.188:3001` 验证新项目，不覆盖旧项目的 Nginx 80 端口。
- 服务器内联调和健康检查优先使用：

```bash
VERIFY_BASE_URL=http://127.0.0.1:${WEB_PORT} npm run verify:runtime
```

避免宿主机访问公网 `APP_URL` 时受到回环或云网络策略影响。

## 生产必填环境变量

- `COMPOSE_PROJECT_NAME`
- `APP_ENV=production`
- `APP_URL`
- `DATABASE_URL`
- `REDIS_URL`
- `AUTH_SECRET`
- `ADMIN_API_KEY`
- `BAILIAN_API_KEY`
- `BAILIAN_BASE_URL`
- `BAILIAN_DAILY_MODEL`
- `BAILIAN_COMPLEX_MODEL`

## 阿里云入口

- DashScope / 百炼控制台：<https://dashscope.console.aliyun.com/>
- ECS 控制台：<https://ecs.console.aliyun.com/>
- OSS 控制台：<https://oss.console.aliyun.com/>
- 域名解析：<https://dns.console.aliyun.com/>

## 发布前检查

1. 确认 `.env` 未提交。
2. 确认 `APP_URL` 为真实公网地址。
3. 确认数据库迁移可重复执行。
4. 确认 `ADMIN_API_KEY` 已替换成随机值。
5. 确认百炼真实 Key 已写入生产环境。
6. 确认 `WEB_PORT / POSTGRES_PORT / REDIS_PORT` 未与旧项目冲突。
