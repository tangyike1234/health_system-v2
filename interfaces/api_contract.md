# API 契约

## 版本: 1.0 | 更新: 2026-10-19

## 概述

前端与后台服务的 REST API 接口。

## 基础信息

- **Base URL**: `/api/v1`
- **认证**: Bearer Token (JWT)
- **Content-Type**: `application/json`

## 端点

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /auth/login | 登录 |

### 分析

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /analyze/ecg | 提交分析 |
| GET | /analyze/{task_id} | 查询结果 |

### 历史

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /records | 记录列表 |
| GET | /records/{id} | 记录详情 |

### 系统

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /health | 健康检查 |

## 错误响应

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "消息"
  }
}
```

## TODO

- [ ] 完善所有端点
- [ ] 添加参数说明
- [ ] 添加响应示例

## 负责人更新

| 日期 | 更新内容 |
|------|----------|
