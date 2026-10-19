"""
API 路由聚合
"""

from fastapi import APIRouter
from app.api.analyze import router as analyze_router
from app.api.auth import router as auth_router
from app.api.websocket import router as websocket_router

router = APIRouter()

router.include_router(auth_router, tags=["认证"])
router.include_router(analyze_router, tags=["分析"])
router.include_router(websocket_router, tags=["WebSocket"])
