# 数据 Schema

## 版本: 1.0 | 更新: 2026-10-19

## 概述

系统核心数据结构定义。

## ECG 信号

```typescript
interface ECGSignal {
  samples: number[];        // 采样值
  sample_rate: number;      // 采样率 (Hz)
  duration_ms: number;      // 持续时间 (ms)
  lead_type: "single" | "12-lead";
}
```

## 分析结果

```typescript
interface AnalysisResult {
  task_id: string;
  status: "pending" | "completed" | "failed";
  classification: {
    rhythm: string;
    confidence: number;     // 0-1
  };
  signal_quality: number;   // 0-1
}
```

## TODO

- [ ] 补充完整类型定义
- [ ] 添加 JSON Schema
- [ ] 添加 Protobuf 定义 (可选)

## 负责人更新

| 日期 | 更新内容 |
|------|----------|
