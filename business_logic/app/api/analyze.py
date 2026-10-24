"""王书阁：记录及分析使用流程。首版只解析单列 CSV。"""
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response
from app.api.auth import current_user
from app.services import records
from signal_processing.python.ecg_preprocessing import parse_csv

router = APIRouter(tags=['记录与分析'])

@router.post('/analyze/ecg', status_code=202)
async def upload(background_tasks: BackgroundTasks, file: UploadFile = File(...), sample_rate_hz: float = Form(...),
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
    task = records.submit(user, parse_csv(text, sample_rate_hz))
    background_tasks.add_task(records.execute, task['id'])
    return task

@router.get('/tasks/{task_id}')
def task(task_id: str, user: str = Depends(current_user)):
    return records.task_status(user, task_id)

@router.get('/records')
def listing(shared: bool = False, page: int | None = Query(default=None, ge=1),
            page_size: int = Query(default=20, ge=1, le=100),
            user: str = Depends(current_user)):
    return records.list_records(user, shared, page, page_size)

@router.get('/records/trends')
def trends(shared: bool = False, days: int = Query(default=30, ge=1, le=365),
           user: str = Depends(current_user)):
    return records.trend(user, shared, days)

@router.get('/records/{identifier}/export')
def export(identifier: str, format: str = Query(default='csv', pattern='^(csv|json)$'),
           user: str = Depends(current_user)):
    content, media_type = records.export_record(user, identifier, format)
    filename = f'ecg-record-{identifier}.{format}'
    return Response(content=content, media_type=media_type,
                    headers={'Content-Disposition': f'attachment; filename="{filename}"'})

@router.delete('/records/{identifier}')
def delete(identifier: str, user: str = Depends(current_user)):
    return records.delete_record(user, identifier)

@router.get('/records/{identifier}')
def detail(identifier: str, user: str = Depends(current_user)):
    return records.detail(user, identifier)

@router.get('/analyze/{identifier}')
def analysis_status(identifier: str, user: str = Depends(current_user)):
    return records.detail(user, identifier)
