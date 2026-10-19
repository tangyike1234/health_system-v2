"""
认证接口
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

router = APIRouter()

# 密码哈希
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

# 模拟用户数据 (实际从数据库读取)
MOCK_USERS_DB = {
    "admin": {
        "username": "admin",
        "hashed_password": pwd_context.hash("admin123"),
        "disabled": False
    }
}


class Token(BaseModel):
    access_token: str
    token_type: str


class User(BaseModel):
    username: str
    disabled: bool = False


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_user(username: str):
    if username in MOCK_USERS_DB:
        user_dict = MOCK_USERS_DB[username]
        return User(**user_dict)
    return None


def authenticate_user(username: str, password: str):
    user = get_user(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password if hasattr(user, 'hashed_password') else MOCK_USERS_DB[username]["hashed_password"]):
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, "secret", algorithm="HS256")


@router.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """用户登录"""
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=30)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """获取当前用户"""
    credentials_exception = HTTPException(
        status_code=401,
        detail="无法验证凭证",
        headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload = jwt.decode(token, "secret", algorithms=["HS256"])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = get_user(username)
    if user is None:
        raise credentials_exception
    return user
