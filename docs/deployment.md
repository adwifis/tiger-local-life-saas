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
npm run verify:runtime
```

## 生产必填环境变量

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
