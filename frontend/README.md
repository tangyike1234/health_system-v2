# 两条软件业务线的 React 应用

公共壳、Login、Family 属李运嘉；Dashboard、Analyze、Records、Waveform 属王书阁。双方各自维护对应业务接口，不把全部页面交给一人。

在本目录 npm ci 后 npm run dev。构建 npm run build。API 代理见 vite.config.ts；用户会话存 sessionStorage，刷新后可继续会话；服务退出登录后 token 失效。合成波形有明确来源，无模型时显示空分类。
