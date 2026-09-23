from sqlalchemy.engine import Engine

from app.db.models import Base


def upgrade(engine: Engine) -> None:
    # รองรับ CON-TECH-01, DOM-PDPA-01, IF-HIS-01
    Base.metadata.create_all(bind=engine)
