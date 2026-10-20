# 系统架构

## 版本: 1.0 | 更新: 2026-10-19

## 概述

ECG 智能分析系统架构。

## 组件

```
Hardware → Backend → Frontend
              ↑
         AI Model
              ↑
      Signal Processing
```

## 模块

| 模块 | 技术 |
|------|------|
| Hardware | STM32 |
| Signal Processing | Python/C |
| AI Model | TensorFlow/ONNX |
| Backend | FastAPI |
| Frontend | React |

## 数据流

1. 硬件采集 → 协议传输
2. 后台接收 → 信号处理
3. AI 推理 → 结果存储
4. 前端展示

## TODO

- [ ] 补充详细架构图
- [ ] 添加部署架构

## 负责人更新

| 日期 | 更新内容 |
|------|----------|
# 本分支架构入口

本次改造以 [overview](architecture/overview.md) 和 [五人分工](team_assignment.md) 为准。下文保留旧方案参考。

