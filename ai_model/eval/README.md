# AI 模型评估

## 数据集

| 目录 | 说明 | 状态 |
|------|------|------|
| eval/clean | 干净数据 | ⏳ 待生成 |
| eval/noise | 噪声数据 | ⏳ 待生成 |

## 脚本

- `generate_test_data.py` - 生成测试数据
- `model_eval_report.py` - 生成评估报告

## 用法

```bash
# 生成测试数据
python generate_test_data.py --type clean --output data/eval_clean

# 运行评估
python model_eval_report.py --model ecg_founder --data data/eval_clean
```

## 负责人更新

| 日期 | 更新内容 |
|------|----------|
