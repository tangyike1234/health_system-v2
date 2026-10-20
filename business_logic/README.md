# FastAPI 业务与持久化

王书阁：应用入口、记录/任务服务、存储；李运嘉：身份/授权/通知 API 与服务；刘源：acquisition 适配接口。分析通过 ai_model.pipeline 调用，业务层不重复实现信号和模型算法。

从仓库根目录运行 run_backend.py。requirements.txt 是当前运行依赖；旧 config/middleware 仅保留参考，未自动启用。db/init.sql 指向唯一 schema 定义。Docker 说明见 deploy/deploy_backend.md。
