# 运维接入说明

## GitHub

参考项目远程仓库：

```text
git@github.com:adwifis/tiger-ai-saas.git
```

当前仓库远程：

```text
git@github.com:adwifis/tiger-local-life-saas.git
```

当前默认分支已经推送到新仓库。后续只需要确认是否转私有仓库，以及是否继续沿用 `adwifis` 账号。

## 阿里云

官方入口：

- DashScope / 百炼：<https://dashscope.console.aliyun.com/>
- ECS：<https://ecs.console.aliyun.com/>
- OSS：<https://oss.console.aliyun.com/>
- 域名与 DNS：<https://dns.console.aliyun.com/>

## 当前本机已知资产

- 参考 PEM 文件：`/Users/z/Desktop/tigerclub/tiger-ai-saas.pem`

## 待你确认后再写入仓库的内容

- 服务器公网 IP / SSH Host
- 生产域名
- 百炼正式 API Key 所在环境
- 数据库生产连接方式

## 推荐上线策略

1. 本机完成开发和自测
2. 使用 Docker Compose 打包
3. 上传到阿里云 ECS
4. 先用 IP 验证
5. 再绑定域名和 HTTPS
