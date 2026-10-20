# 唐一可：AI 算法与分析集成

pipeline.py 是统一入口，调用林玄初的 process 后判断质量，再调用 inference/factory。当前没有加载模型，返回空分类与 model_unavailable，不输出模拟正常结果。

下一步：单导联任务标签、患者级划分、基线、训练评价、真实模型适配。models/ecg_founder/manifest.json 是尚未启用的12导联扩展参考，不适配当前单导联输入。eval/model_eval_report.py 只根据真实预测列表计算指标，不再返回固定精度。
