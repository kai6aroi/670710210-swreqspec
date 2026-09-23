import os

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine


def build_engine(database_url: str | None = None) -> Engine:
    # รองรับ CON-TECH-01 และการทดสอบ SQLite ในหน่วยความจำ
    resolved_url = database_url or os.getenv("DATABASE_URL", "sqlite:///:memory:")
    if resolved_url.startswith("sqlite"):
        return create_engine(resolved_url, connect_args={"check_same_thread": False}, future=True)
    return create_engine(resolved_url, future=True)
