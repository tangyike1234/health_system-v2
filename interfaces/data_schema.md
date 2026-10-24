# 数据与模块契约

首版输入：samples（单通道数值数组）、sample_rate_hz、unit=mV、lead、source。CSV 为单列数值，可含 value/sample/mv 表头；其他列必须拒绝以免把时间列当信号。合成输入 source=synthetic_replay。后续设备增加 captured_at、sequence 和缺失标记。

`process(signal)` 返回 quality、waveform、sample_rate_hz、unit、duration_sec、heart_rate_bpm=null、processing_version。quality 包含 status、reasons、scope；目前只做长度/平直/有限值检查。

`analyze(signal)` 是软件唯一分析入口，附加 source、mode（默认 framework_demo；可选分类成功时 openecg-evidence-pipeline）、prediction。prediction 含 status、label、confidence、model_version、explanation。默认无分类器时 label、confidence、model_version 为空；可选适配器拒绝输入时仍可能保留 model_version；低质量跳过分类。心拍标签与记录级心律结论不能混用。

Record：id、created_at（UTC ISO）、task_status、result。当前后台执行，completed 代表流水线结束，不表示模型已有输出。后续模型还需标签版本、配置、输入来源追溯和窗口位置。

用户/会话/记录/授权/通知表由 `business_logic/app/services/storage.py` 初始化。记录 owner_id 与会话 user_id 关联；共享查询必须匹配有效授权。撤回限制后续查询，不能抹除已被查看或下载的副本。

## 可选流水线输出

依据[根 README](../README.md)，默认模型不可用；现有代码可附加 prediction.evidence 和 prediction.explanation_detail。可选分类器可能增加 raw_label、task_type、heart_rate、beats、intervals_ms、flags；这些字段不表示真实推理已验收，也不会填充顶层 heart_rate_bpm。解释默认模板，可选外部生成失败回退模板。

analysis_tasks 保存 pending/running/completed/failed，task_inputs 保存原始标准输入。后续扩展字段、原始输入保存、窗口位置、删除与导出权限必须由对应作者实现后更新契约。

## 历史管理输出

分页响应为 items/page/page_size/total/pages/shared；趋势响应为 days/days_requested/shared，每日包含 UTC date、records、quality 计数、heart_rate_bpm（无可用值为 null）。趋势只统计当前保存结果；未导入的设备指标不参与计算。本人删除会事务删除关联任务及标准输入。
