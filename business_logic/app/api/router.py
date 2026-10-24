from fastapi import APIRouter
from app.api import auth, family, analyze, acquisition, websocket

router = APIRouter(prefix='/api/v1')
for module in (auth, family, analyze, acquisition, websocket):
    router.include_router(module.router)
