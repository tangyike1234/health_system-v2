# 两条软件业务线的 React 应用

公共壳、Login、Family 属李运嘉；Dashboard、Analyze、Records、Waveform 属王书阁。双方各自维护对应业务接口，不把全部页面交给一人。

在本目录 npm ci 后 npm run dev。构建 npm run build。API 代理见 vite.config.ts（/api 转发到后端）；当前分析同步执行，页面尚无异步任务轮询，历史无分页/趋势/导出删除。API 代理配置见 vite.config.ts；用户会话存 sessionStorage，刷新后可继续会话；服务退出登录后 token 失效。合成波形有明确来源，无模型时显示空分类。

总体分工以[根 README](../README.md)为准。当前详情固定显示心率尚未实现，不会展示可选分类器嵌套的心率与完整 explanation_detail；这些需要后续联调，不代表正式功能已完成。
