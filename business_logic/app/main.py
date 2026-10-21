from contextlib import asynccontextmanager
import sqlite3
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.api.router import router
from app.services.storage import initialize
from app.services.records import recover_tasks

@asynccontextmanager
async def lifespan(app):
    initialize()
    recover_tasks()
    yield

app = FastAPI(title='家庭心电辅助记录 · 五人协作框架', lifespan=lifespan)
app.include_router(router)

@app.get('/api/v1/health')
def health():
    return {'status': 'ok', 'model': 'unavailable', 'acquisition': 'replay_only'}

async def domain_error(request: Request, error: Exception):
    status = 401 if isinstance(error, PermissionError) else 404 if isinstance(error, LookupError) else 409 if isinstance(error, sqlite3.IntegrityError) else 400
    message = '用户名或记录已存在' if isinstance(error, sqlite3.IntegrityError) else str(error)
    return JSONResponse({'detail': message}, status_code=status)

for error_type in (ValueError, PermissionError, LookupError, sqlite3.IntegrityError):
    app.add_exception_handler(error_type, domain_error)
