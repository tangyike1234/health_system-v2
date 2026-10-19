# Signal Processing 模块

## 目录结构

```
signal_processing/
├── python/                 # Python 实现
│   ├── ecg_preprocessing.py
│   ├── filters.py
│   ├── rpeak_detection.py
│   ├── feature_extraction.py
│   └── requirements.txt
├── c/                     # C 语言实现 (嵌入式)
│   ├── include/
│   │   ├── ecg_filter.h
│   │   ├── rpeak.h
│   │   └── common.h
│   ├── src/
│   │   ├── ecg_filter.c
│   │   └── rpeak.c
│   ├── CMakeLists.txt
│   └── test/
└── docs/                  # 算法文档
    ├── filter_design.md
    ├── noise_baseline.md
    └── mcu分工.md
```

## 职责

1. **预处理**: 基线漂移移除、 工频干扰滤波
2. **R 峰检测**: 经典算法实现 (Pan-Tompkins 等)
3. **特征提取**: HRV、波形特征
4. **双版本提供**: Python 用于验证，C 用于 MCU/高性能场景

## 里程碑

- [ ] 10-27: Python/C 双版本滤波与 R 峰检测
- [ ] 完成: 滤波实验记录与波形对比图
- [ ] 完成: 噪声基线测试策略
- [ ] 与 hardware 确认 MCU 端滤波负载

## 算法说明

### 滤波器设计

```
输入信号 → 高通滤波 (0.5Hz) → 低通滤波 (45Hz) → 工频陷波 (50Hz) → 输出
```

- **高通滤波**: 去除基线漂移
- **低通滤波**: 去除高频噪声
- **工频陷波**: 去除 50Hz 交流干扰

### R 峰检测流程

1. 带通滤波 (5-15Hz)
2. 信号平方
3. 移动窗口积分
4. 峰值检测
5. 自适应阈值
6. RR 间期验证

## 与 MCU 的分工

| 处理阶段 | 端侧 (MCU) | 云侧 (Python/C++) |
|----------|------------|-------------------|
| 原始采样 | ✓ | |
| 简单滤波 | ✓ (可选) | ✓ |
| 基线移除 | | ✓ |
| R 峰检测 | | ✓ |
| 特征提取 | | ✓ |
| 高级分析 | | ✓ |

## 待办事项

- [ ] 确定 MCU 端滤波算法复杂度预算
- [ ] 编写 C 版本单元测试
- [ ] 性能对比基准测试
- [ ] 噪声模拟数据生成脚本
