# 当前接口契约

前缀 `/api/v1`；除 health 和 auth/register、auth/login 外，均需 `Authorization: Bearer <token>`。token 为数据库会话，不是原先固定密钥的演示 JWT。登录过期或退出后拒绝访问。

| 方法 | 路径 | 输入/用途 | 主责 |
|---|---|---|---|
| GET | /health | 运行状态与尚未接入能力 | 王书阁 |
| POST | /auth/register | JSON username、password（至少8位） | 李运嘉 |
| POST | /auth/login | JSON username、password；返回 token | 李运嘉 |
| POST | /auth/logout | 注销当前 token | 李运嘉 |
| GET | /acquisition/status | 设备/回放状态 | 刘源 |
| POST | /acquisition/replay | 合成回放，HTTP 202 返回 Task | 刘源/王书阁 |
| POST | /analyze/ecg | multipart file（单列CSV，最大2MB）、sample_rate_hz；HTTP 202 返回 Task，信号校验失败写入 failed | 王书阁 |
| GET | /records | 本人记录；shared=true 为有效授权给我的记录 | 王书阁 |
| GET | /records/{id} | 本人/有效授权记录详情 | 王书阁 |
| GET | /analyze/{id} | 同一记录结果的兼容入口 | 王书阁 |
| GET/POST | /family/grants | 查询授权/JSON username 直接授权查看 | 李运嘉 |
| DELETE | /family/grants/{id} | 撤回本人发出的授权 | 李运嘉 |
| GET | /family/notifications | 有效授权关联的站内授权提示 | 李运嘉 |

状态：400 输入无效，401 未登录/会话失效，404 不存在或无权查看，409 用户已存在，413 上传超限，422 字段校验失败。错误响应使用 detail；框架默认校验错误可能为结构化列表。未知记录不返回假成功。

WebSocket `/api/v1/ws/realtime` 尚未实现，主动关闭，不发送模拟分析。

通知仅为站内授权提示，状态 in_app_available 不代表外部渠道投递或急救警报。授权原型为本人直接共享，不包含接收方确认。重构前 OAuth 表单及强制心律结果契约不再适用。

## 当前限制

依据[根 README](../README.md)，上传和回放返回 HTTP 202 和持久化任务；已提供分页、趋势及本人导出/删除；邀请确认仍未实现。GET /analyze/{id} 是记录详情兼容入口；任务查询使用 GET /tasks/{id}。health 的 model 固定为 unavailable，不探测可选模型实际状态。

## 分析任务（本地实现更新）

GET /tasks/{id} 需本人身份，返回 id、status、created_at、updated_at、error、record_id、processing_version；完成后附 record。其他用户（包括家属）和未知任务均返回 404，记录共享仍按原授权规则。上传和回放的响应为 Task，不再是 Record；调用方必须更新为轮询任务接口。

后台使用 FastAPI BackgroundTasks，不是独立消息队列。当前仅支持单应用进程；不要配置多 worker 或多实例，以免一个实例启动时将其他实例正在运行的任务标为失败。重启恢复策略是失败提示与重新提交，不自动重跑。

## 历史管理接口（本地实现）

- GET /records?page=1&page_size=10&shared=false：返回 items/page/page_size/total/pages/shared；page_size 为 1–100。不传 page 保留旧数组响应。
- GET /records/trends?days=30&shared=false：1–365 天，UTC 按日汇总记录数、质量状态计数及已有心率的日均值；无心率返回 null。不是疾病风险预测。
- GET /records/{id}/export?format=csv|json：仅记录本人可用；CSV 为结果波形及元数据，JSON 为保存的记录对象，不等同原始设备文件。
- DELETE /records/{id}：仅本人可用；同一事务清理记录、关联任务和标准输入。未知或无权限均为 404。家属仅保留查看权限，导出权限待团队确认。

页面删除有确认提示。真实 ADS1292R 双文件仍等待波形列、单位、校准及指标语义交接，不将现有单列解析宣称为已支持硬件 CSV。
