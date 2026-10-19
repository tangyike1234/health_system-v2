# FastAPI 应用入口

from fastapi import FastAPI

app = FastAPI(title="ECG Health System")

# TODO: 挂载路由
# app.include_router(...)

@app.get("/")
def root():
    return {"message": "ECG Health System"}
