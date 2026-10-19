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
