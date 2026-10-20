"""王书阁：连接、迁移与记录存储；业务模块负责各自表的数据操作。"""
import sqlite3
import os
from contextlib import contextmanager
from pathlib import Path

DB = Path(os.environ.get('HEALTH_DB_PATH', str(Path(__file__).resolve().parents[3] / 'runtime' / 'health.sqlite3')))

@contextmanager
def connect():
    DB.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB)
    connection.row_factory = sqlite3.Row
    connection.execute('PRAGMA foreign_keys=ON')
    try:
        with connection:
            yield connection
    finally:
        connection.close()

def initialize():
    with connect() as db:
        db.executescript('''
        CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, username TEXT UNIQUE, password_hash TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), expires REAL);
        CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY, owner_id TEXT REFERENCES users(id), created_at TEXT, payload TEXT);
        CREATE TABLE IF NOT EXISTS grants(id TEXT PRIMARY KEY, owner_id TEXT REFERENCES users(id), relative_id TEXT REFERENCES users(id), active INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS notifications(id TEXT PRIMARY KEY, recipient_id TEXT REFERENCES users(id), grant_id TEXT REFERENCES grants(id), message TEXT, status TEXT);
        ''')
