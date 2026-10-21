"""刘源维护设备适配，王书阁维护记录入口。"""
from fastapi import APIRouter, BackgroundTasks, Depends
from app.api.auth import current_user
from app.services import records
from hardware.acquisition import sample, device_status

router = APIRouter(prefix='/acquisition', tags=['采集接入'])

@router.get('/status')
def status(user: str = Depends(current_user)):
    return device_status()

@router.post('/replay', status_code=202)
def replay(background_tasks: BackgroundTasks, user: str = Depends(current_user)):
    task = records.submit(user, sample())
    background_tasks.add_task(records.execute, task['id'])
    return task
