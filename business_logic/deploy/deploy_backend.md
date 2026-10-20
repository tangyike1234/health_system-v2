# 部署文档

## 环境要求

- Python 3.10+
- Docker (可选)

## 快速部署

```bash
# 开发环境
pip install -r requirements.txt
uvicorn app.main:app --reload

# Docker 部署
docker-compose up -d
```

## TODO

- [ ] 完善部署步骤
- [ ] 添加 Kubernetes 配置
- [ ] 添加监控告警
# 当前部署方式

本地按根 README 从根目录启动 `python run_backend.py`。Docker 从仓库根目录运行 `docker compose -f business_logic/deploy/docker-compose.yml up --build`；Compose 构建上下文为根目录，包含信号、采集与 AI 包。Docker 尚未在本次环境运行验收。前端生产文件由 npm run build 生成，部署者需额外配置静态服务及 `/api` 反向代理；Compose 目前仅含后端。

下文是上游旧说明，路径与能力以本段和根 README 为准。

