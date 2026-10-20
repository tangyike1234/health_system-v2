"""实时流待设备协议确认，显式关闭，避免返回模拟正常心律。"""
from fastapi import APIRouter, WebSocket
router = APIRouter()

@router.websocket('/ws/realtime')
async def websocket_endpoint(socket: WebSocket):
    await socket.close(code=1008, reason='Realtime acquisition not implemented; use authenticated replay API')
