"""
WebSocket 接口
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import asyncio
from datetime import datetime

router = APIRouter()


class ConnectionManager:
    """WebSocket 连接管理器"""
    
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
    
    def disconnect(self, client_id: str):
        self.active_connections.pop(client_id, None)
    
    async def send_message(self, message: dict, client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(message)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            await connection.send_json(message)


manager = ConnectionManager()


@router.websocket("/ws/realtime")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    """
    实时 ECG 分析 WebSocket
    
    连接: ws://host/api/v1/ws/realtime?token=<jwt>
    
    客户端发送:
        {"type": "ecg_data", "data": [...], "timestamp": "..."}
    
    服务端响应:
        {"type": "analysis_result", "data": {...}}
        {"type": "alert", "data": {...}}
    """
    client_id = f"{id(websocket)}"
    
    # 验证 token (简化版)
    if not token:
        await websocket.close(code=4001)
        return
    
    await manager.connect(websocket, client_id)
    
    try:
        while True:
            # 接收客户端数据
            data = await websocket.receive_json()
            
            if data.get("type") == "ecg_data":
                # 处理 ECG 数据
                # TODO: 调用信号处理和 AI 推理
                result = await process_realtime_data(data)
                await websocket.send_json(result)
                
            elif data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(client_id)


async def process_realtime_data(data: dict) -> dict:
    """
    处理实时数据
    
    TODO: 集成信号处理和 AI 模型
    """
    ecg_signal = data.get("data", [])
    
    # 模拟分析结果
    return {
        "type": "analysis_result",
        "data": {
            "timestamp": datetime.utcnow().isoformat(),
            "rhythm": "normal",
            "confidence": 0.92,
            "heart_rate": 72,
            "alert": None
        }
    }
