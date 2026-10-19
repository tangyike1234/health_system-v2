"""
数据模型
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class RhythmType(str, Enum):
    """心律类型"""
    NORMAL = "normal"
    SINUS_TACHYCARDIA = "sinus_tachycardia"
    SINUS_BRADYCARDIA = "sinus_bradycardia"
    ATRIAL_FIBRILLATION = "atrial_fibrillation"
    ATRIAL_FLUTTER = "atrial_flutter"
    VENTRICULAR_PREMATURE = "ventricular_premature"
    OTHER = "other"


class TaskStatus(str, Enum):
    """任务状态"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# ============ 请求模型 ============

class AnalyzeRequest(BaseModel):
    """分析请求"""
    lead_type: str = Field(default="single", description="导联类型: single / 12-lead")
    patient_id: Optional[str] = Field(None, description="患者标识")


class LoginRequest(BaseModel):
    """登录请求"""
    username: str
    password: str


# ============ 响应模型 ============

class ClassificationResult(BaseModel):
    """分类结果"""
    rhythm: RhythmType
    confidence: float = Field(..., ge=0, le=1)
    details: Optional[dict] = None


class Finding(BaseModel):
    """发现项"""
    type: str  # e.g., "R-peak", "ST-segment"
    position_ms: int
    severity: str  # normal / mild / moderate / severe


class AnalysisResult(BaseModel):
    """分析结果"""
    classification: ClassificationResult
    findings: List[Finding] = []
    signal_quality: float = Field(..., ge=0, le=1)
    processing_time_ms: int


class TaskResponse(BaseModel):
    """任务响应"""
    task_id: str
    status: TaskStatus
    result: Optional[AnalysisResult] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class RecordItem(BaseModel):
    """记录项"""
    id: str
    patient_id: Optional[str]
    rhythm: str
    created_at: datetime


class RecordListResponse(BaseModel):
    """记录列表响应"""
    total: int
    page: int
    page_size: int
    items: List[RecordItem]


# ============ WebSocket 消息 ============

class RealtimeAlert(BaseModel):
    """实时告警"""
    level: str  # warning / critical
    code: str
    message: str
    timestamp: datetime


class RealtimeResult(BaseModel):
    """实时结果"""
    timestamp: datetime
    rhythm: str
    confidence: float
    heart_rate: Optional[int] = None
    alert: Optional[RealtimeAlert] = None
