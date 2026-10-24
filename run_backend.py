"""从仓库根目录启动，以便同时导入业务、硬件、信号与模型包。"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent / 'business_logic'))

if __name__ == '__main__':
    import uvicorn
    uvicorn.run('app.main:app', host='127.0.0.1', port=8000)
