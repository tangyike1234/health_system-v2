# 项目运行指南

**更新**: 2026-10-19

## 目录

1. [环境准备](#1-环境准备)
2. [后端启动](#2-后端启动)
3. [前端启动](#3-前端启动)
4. [快速验证](#4-快速验证)
5. [模拟数据测试](#5-模拟数据测试)

---

## 1. 环境准备

### 通用依赖

```bash
# Python 3.10+
python --version

# Node.js 18+
node --version

# Git
git --version
```

### 克隆项目

```bash
cd "C:\Users\tangyike\Desktop\EGC"
git clone <repo-url> health_system-v2
cd health_system-v2
```

---

## 2. 后端启动

### 2.1 安装依赖

```bash
cd business_logic
pip install -r requirements.txt
```

### 2.2 配置环境变量

```bash
# 复制环境变量模板
copy .env.example .env

# 编辑 .env (可选，使用默认配置)
```

### 2.3 初始化数据库

```bash
# SQLite 会自动创建，也可手动初始化
python -c "from app.main import app; print('DB ready')"
```

### 2.4 启动服务

```bash
# 开发模式 (热重载)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 或生产模式
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2.5 验证后端

```bash
# 健康检查
curl http://localhost:8000/health

# API 文档
# 浏览器打开: http://localhost:8000/docs
```

---

## 3. 前端启动

### 3.1 安装依赖

```bash
cd frontend
npm install
```

### 3.2 启动开发服务器

```bash
npm run dev
```

### 3.3 访问应用

```
浏览器打开: http://localhost:5173
```

---

## 4. 快速验证

### 4.1 前端 + 后端联调

1. 后端运行在 `http://localhost:8000`
2. 前端运行在 `http://localhost:5173`
3. 前端 API 地址配置在 `src/services/api.ts`

### 4.2 测试流程

```bash
# 1. 登录获取 token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# 2. 提交分析 (需先上传模拟数据)
curl -X POST http://localhost:8000/api/v1/analyze/ecg \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.ecg"

# 3. 查询结果
curl http://localhost:8000/api/v1/analyze/<task_id> \
  -H "Authorization: Bearer <token>"
```

---

## 5. 模拟数据测试

### 5.1 生成测试信号

```bash
cd signal_processing/python
pip install numpy scipy

# 运行测试脚本 (需先实现占位函数)
python test_signal.py
```

### 5.2 模拟 ECG 数据

```python
# test_signal.py 示例
import numpy as np

def generate_test_ecg(duration=10, fs=500):
    """生成模拟 ECG 信号"""
    t = np.arange(0, duration, 1/fs)
    # 简单模拟 R 峰
    heart_rate = 72
    r_peaks = np.sin(2 * np.pi * heart_rate / 60 * t)
    return r_peaks

# 保存测试数据
np.save('../data/test_ecg.npy', generate_test_ecg())
```

### 5.3 Mock API (前端独立开发)

前端开发时可以使用 Mock 数据：

```typescript
// src/services/mock.ts
export const mockResult = {
  task_id: 'mock-001',
  status: 'completed',
  classification: {
    rhythm: 'Normal Sinus Rhythm',
    confidence: 0.95
  },
  signal_quality: 0.88
};
```

---

## 6. Docker 部署 (可选)

### 6.1 构建镜像

```bash
cd business_logic/deploy
docker build -t ecg-backend .
```

### 6.2 启动服务

```bash
docker-compose up -d
```

---

## 7. 常见问题

### Q: pip 安装失败

```bash
# 使用国内镜像
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### Q: npm 安装慢

```bash
# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com
npm install
```

### Q: 端口被占用

```bash
# 查找占用端口的进程
netstat -ano | findstr :8000

# 终止进程
taskkill /PID <pid> /F
```

### Q: 后端 CORS 错误

后端已配置 CORS，如仍有问题检查 `app/main.py`：

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 快速启动命令汇总

```bash
# 1. 后端
cd business_logic
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 2. 前端 (新窗口)
cd frontend
npm install
npm run dev

# 3. 打开浏览器
# 前端: http://localhost:5173
# 后端: http://localhost:8000/docs
```
