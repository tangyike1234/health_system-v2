"""王书阁：记录及分析使用流程。首版只解析单列 CSV。"""
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from app.api.auth import current_user
from app.services import records
from signal_processing.python.ecg_preprocessing import parse_csv

router = APIRouter(tags=['记录与分析'])

@router.post('/analyze/ecg')
async def upload(file: UploadFile = File(...), sample_rate_hz: float = Form(...),
                 user: str = Depends(current_user)):
    if not file.filename or not file.filename.lower().endswith('.csv'):
        raise ValueError('首版仅支持单列 CSV；WFDB/EDF 解析待信号模块扩展')
    content = await file.read(2_000_001)
    if len(content) > 2_000_000:
        raise HTTPException(413, 'CSV 最大 2 MB')
    try:
        text = content.decode('utf-8-sig')
    except UnicodeDecodeError:
        raise ValueError('CSV 请使用 UTF-8 编码')
    return records.create(user, parse_csv(text, sample_rate_hz))

@router.get('/records')
def listing(shared: bool = False, user: str = Depends(current_user)):
    return records.list_records(user, shared)

@router.get('/records/{identifier}')
def detail(identifier: str, user: str = Depends(current_user)):
    return records.detail(user, identifier)

@router.get('/analyze/{identifier}')
def analysis_status(identifier: str, user: str = Depends(current_user)):
    return records.detail(user, identifier)
