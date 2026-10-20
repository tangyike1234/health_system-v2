# 当前接口契约

前缀 `/api/v1`；除 health 和 auth/register、auth/login 外，均需 `Authorization: Bearer <token>`。token 为数据库会话，不是原先固定密钥的演示 JWT。登录过期或退出后拒绝访问。

| 方法 | 路径 | 输入/用途 | 主责 |
|---|---|---|---|
| GET | /health | 运行状态与尚未接入能力 | 王书阁 |
| POST | /auth/register | JSON username、password（至少8位） | 李运嘉 |
| POST | /auth/login | JSON username、password；返回 token | 李运嘉 |
| POST | /auth/logout | 注销当前 token | 李运嘉 |
| GET | /acquisition/status | 设备/回放状态 | 刘源 |
| POST | /acquisition/replay | 合成回放，返回已保存 Record | 刘源/王书阁 |
| POST | /analyze/ecg | multipart file（单列CSV，最大2MB）、sample_rate_hz（50–2000） | 王书阁 |
| GET | /records | 本人记录；shared=true 为有效授权给我的记录 | 王书阁 |
| GET | /records/{id} | 本人/有效授权记录详情 | 王书阁 |
| GET | /analyze/{id} | 同一记录结果的兼容入口 | 王书阁 |
| GET/POST | /family/grants | 查询授权/JSON username 直接授权查看 | 李运嘉 |
| DELETE | /family/grants/{id} | 撤回本人发出的授权 | 李运嘉 |
| GET | /family/notifications | 有效授权关联的站内授权提示 | 李运嘉 |

状态：400 输入无效，401 未登录/会话失效，404 不存在或无权查看，409 用户已存在，413 上传超限，422 字段校验失败。错误响应使用 detail；框架默认校验错误可能为结构化列表。未知记录不返回假成功。

WebSocket `/ws/realtime` 尚未实现，主动关闭，不发送模拟分析。

通知仅为站内授权提示，状态 in_app_available 不代表外部渠道投递或急救警报。授权原型为本人直接共享，不包含接收方确认。重构前 OAuth 表单及强制心律结果契约不再适用。
