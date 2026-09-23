import importlib.util
from pathlib import Path

from sqlalchemy import inspect

from app.db.models import AuditLog, Base, Booking, Slot
from app.db.session import build_engine


migration_path = Path(__file__).resolve().parents[1] / "app" / "db" / "migrations" / "001_init.py"
spec = importlib.util.spec_from_file_location("booking_migration_001", migration_path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
upgrade = module.upgrade


def test_T_01_database_schema_and_constraints():
    engine = build_engine("sqlite:///:memory:")
    upgrade(engine)

    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    assert {"slots", "bookings", "audit_logs"}.issubset(tables)

    booking_columns = {column["name"] for column in inspector.get_columns("bookings")}
    assert {"id", "hn", "slot_id", "booking_date", "queue_no", "status", "created_at"}.issubset(booking_columns)
    assert "national_id" not in booking_columns

    slot_columns = {column["name"] for column in inspector.get_columns("slots")}
    assert {"id", "slot_date", "start_time", "package_code", "capacity", "remaining", "created_at"}.issubset(slot_columns)

    audit_columns = {column["name"] for column in inspector.get_columns("audit_logs")}
    assert {"id", "actor_id", "action", "hn", "accessed_at"}.issubset(audit_columns)

    assert Booking.__table__.name == "bookings"
    assert Slot.__table__.name == "slots"
    assert AuditLog.__table__.name == "audit_logs"
    assert Base.metadata.tables["bookings"].c.hn is not None
